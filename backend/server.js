const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');
const sequelize = require('./config/database');
const { Op } = require('sequelize');
const User = require('./models/User');
const OtpCode = require('./models/OtpCode');
const Policy = require('./models/Policy');
const Document = require('./models/Document');
const CustomerDocument = require('./models/CustomerDocument');
const BirthdayTemplate = require('./models/BirthdayTemplate');
const MiscMaster = require('./models/MiscMaster');
const Customer = require('./models/Customer');
const Reference = require('./models/Reference');
const { fixCustomerNameColumn } = require('./migrations/fix-customer-name');
const { addPremiumSourceColumn } = require('./migrations/add-premium-source');
const { addPolicyNumberUniqueConstraint } = require('./migrations/add-policy-number-unique');
const { repairCustomerSchema } = require('./migrations/repair-customer-schema');
const { makeInsuranceTypeNullable } = require('./migrations/insurance-type-nullable');
const { addInsuranceBranchColumn } = require('./migrations/add-insurance-branch-column');
const policyRoutes = require('./routes/policyRoutes');
const miscMasterRoutes = require('./routes/miscMasterRoutes');
const customerRoutes = require('./routes/customerRoutes');
const referenceRoutes = require('./routes/referenceRoutes');
const documentAiRoutes = require('./routes/documentAiRoutes');
const llamaExtractRoute = require('./routes/llamaExtractRoute');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve uploaded birthday template assets from the backend
app.use('/assets', express.static(path.join(__dirname, '..', 'src', 'assets')));

// Routes
app.use(policyRoutes);
app.use(miscMasterRoutes);
app.use(customerRoutes);
app.use(referenceRoutes);
app.use(documentAiRoutes);
app.use(llamaExtractRoute);

// Database connection
async function initializeDatabase() {
  try {
    await sequelize.authenticate();
    console.log('✓ Database connection successful');

    console.log('Running database migrations...');
    await fixCustomerNameColumn();
    await addPremiumSourceColumn();
    await addPolicyNumberUniqueConstraint();
    await repairCustomerSchema();
    await makeInsuranceTypeNullable();
    await addInsuranceBranchColumn();

    await sequelize.sync({ alter: true });
    console.log('✓ Database tables synced successfully');
  } catch (err) {
    console.warn('⚠ Database unavailable. Continuing without DB initialization:', err.message);
  }
}

initializeDatabase();

function createMailTransporter() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE || 'false').toLowerCase() === 'true',
    auth: {
      user,
      pass
    }
  });
}

async function sendOtpEmail(email, otp) {
  const transporter = createMailTransporter();

  if (!transporter) {
    console.warn('SMTP mail not configured. OTP was generated but not emailed.');
    return false;
  }

  const fromAddress = process.env.SMTP_FROM || process.env.SMTP_USER;

  try {
    await transporter.sendMail({
      from: fromAddress,
      to: email,
      subject: 'Your OTP for login',
      html: `<p>Your OTP is <strong>${otp}</strong>.</p><p>It will expire in 10 minutes.</p>`
    });
    return true;
  } catch (error) {
    console.error('Failed to send OTP email:', error.message);
    return false;
  }
}

async function findUserByEmail(email) {
  const normalizedEmail = String(email || '').toLowerCase().trim();
  return User.findOne({
    where: {
      email: { [Op.iLike]: normalizedEmail }
    }
  });
}

async function findCustomerByEmail(email) {
  const normalizedEmail = String(email || '').toLowerCase().trim();
  return Customer.findOne({
    where: {
      emailId: { [Op.iLike]: normalizedEmail }
    }
  });
}

// Login API endpoint
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    const user = await findUserByEmail(email);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
});

app.post('/api/otp/send', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const normalizedEmail = String(email || '').toLowerCase().trim();
    const customer = await findCustomerByEmail(normalizedEmail);

    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found for this email' });
    }

    await OtpCode.update(
      { isActive: false, isUsed: true },
      { where: { email: normalizedEmail, isActive: true } }
    );

    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await OtpCode.create({
      email: normalizedEmail,
      userId: customer.id,
      otp,
      expiresAt,
      isActive: true,
      isUsed: false
    });

    const emailSent = await sendOtpEmail(normalizedEmail, otp);

    res.status(200).json({
      success: true,
      message: emailSent ? 'OTP sent successfully' : 'OTP generated successfully. Email delivery is not configured on this server.',
      data: {
        email: normalizedEmail,
        expiresAt,
        otp: process.env.NODE_ENV !== 'production' ? otp : undefined
      }
    });
  } catch (error) {
    console.error('OTP send error:', error);
    res.status(500).json({ success: false, message: 'Failed to send OTP' });
  }
});

app.post('/api/otp/verify', async (req, res) => {
  try {
    const { email, otp, password } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email and OTP are required' });
    }

    const normalizedEmail = String(email || '').toLowerCase().trim();
    const otpRecord = await OtpCode.findOne({
      where: {
        email: normalizedEmail,
        isActive: true,
        isUsed: false,
        expiresAt: { [require('sequelize').Op.gt]: new Date() }
      },
      order: [['createdAt', 'DESC']]
    });

    if (!otpRecord) {
      return res.status(401).json({ success: false, message: 'OTP expired or invalid' });
    }

    if (otpRecord.otp !== String(otp)) {
      return res.status(401).json({ success: false, message: 'Invalid OTP' });
    }

    otpRecord.isUsed = true;
    otpRecord.isActive = false;
    await otpRecord.save();

    const customer = await findCustomerByEmail(normalizedEmail);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found for this email' });
    }

    res.status(200).json({
      success: true,
      message: 'OTP verified successfully',
      data: {
        id: customer.id,
        email: customer.emailId,
        name: customer.name
      }
    });
  } catch (error) {
    console.error('OTP verify error:', error);
    res.status(500).json({ success: false, message: 'Failed to verify OTP' });
  }
});

// Logout API endpoint
app.post('/api/logout', (req, res) => {
  try {
    // In this simple implementation, logout is handled on the frontend
    // by clearing the session. You can add server-side session tracking here if needed
    res.status(200).json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during logout'
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ message: 'Server is running' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
