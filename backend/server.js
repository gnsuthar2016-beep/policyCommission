const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');
const sequelize = require('./config/database');
const User = require('./models/User');
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

// Login API endpoint
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Find user by email
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Compare password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Success response
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
