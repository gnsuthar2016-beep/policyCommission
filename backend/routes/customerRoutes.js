const express = require('express');
const multer = require('multer');
const streamifier = require('streamifier');
const { v2: cloudinary } = require('cloudinary');
const router = express.Router();
const Customer = require('../models/Customer');
const CustomerDocument = require('../models/CustomerDocument');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 1 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/bmp',
      'image/tiff'
    ];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only image and PDF files are allowed'));
    }
  }
});

// Determine Cloudinary resource type from filename
function getCloudinaryResourceType(fileName) {
  if (!fileName || typeof fileName !== 'string') return 'image';
  const ext = fileName.split('.').pop().toLowerCase();
  const rawExts = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt'];
  if (rawExts.includes(ext)) return 'raw';
  return 'image';
}

// Save Customer
router.post('/api/customer', async (req, res) => {
  try {
    const { name, mobileNumber, alternativeMobileNumber, emailId, dateOfBirth, remark } = req.body;

    // Validate required fields: name and mobileNumber
    if (!name || !mobileNumber) {
      return res.status(400).json({
        success: false,
        message: 'Name and Mobile Number are required'
      });
    }

    // Check if customer already exists by mobile number
    const existingCustomerByMobile = await Customer.findOne({
      where: { mobileNumber: mobileNumber }
    });

    if (existingCustomerByMobile) {
      return res.status(400).json({
        success: false,
        message: 'Customer with this mobile number already exists'
      });
    }

    // Check if customer already exists by email (only if email is provided)
    if (emailId && emailId.trim() !== '') {
      const existingCustomerByEmail = await Customer.findOne({
        where: { emailId: emailId.trim() }
      });

      if (existingCustomerByEmail) {
        return res.status(400).json({
          success: false,
          message: 'Customer with this email already exists'
        });
      }
    }

    const customer = await Customer.create({
      name: name,
      mobileNumber: mobileNumber,
      alternativeMobileNumber: alternativeMobileNumber || null,
      emailId: (emailId && emailId.trim() !== '') ? emailId.trim() : null,
      dateOfBirth: dateOfBirth || null,
      remark: remark || null
    });

    res.status(201).json({
      success: true,
      message: 'Customer saved successfully',
      data: customer,
      id: customer.id
    });
  } catch (error) {
    console.error('Error saving Customer:', error);
    res.status(500).json({
      success: false,
      message: 'Error saving Customer: ' + error.message
    });
  }
});

// Get all Customers
router.get('/api/customer', async (req, res) => {
  try {
    const customers = await Customer.findAll({
      include: [
        {
          model: CustomerDocument,
          as: 'documents',
          attributes: ['id', 'documentType', 'fileName', 'fileSize', 'uploadDate', 'filePath', 'cloudinaryPublicId']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({
      success: true,
      data: customers,
      count: customers.length
    });
  } catch (error) {
    console.error('Error fetching Customers:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching Customers: ' + error.message
    });
  }
});

// Get Customer by ID
router.get('/api/customer/:id', async (req, res) => {
  try {
    const id = req.params.id;

    const customer = await Customer.findByPk(id, {
      include: [
        {
          model: CustomerDocument,
          as: 'documents',
          attributes: ['id', 'documentType', 'fileName', 'fileSize', 'uploadDate', 'filePath', 'cloudinaryPublicId']
        }
      ]
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    res.status(200).json({
      success: true,
      data: customer
    });
  } catch (error) {
    console.error('Error fetching Customer:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching Customer: ' + error.message
    });
  }
});

// Delete Customer by ID
router.delete('/api/customer/:id', async (req, res) => {
  try {
    const id = req.params.id;

    const customer = await Customer.findByPk(id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    await customer.destroy();

    res.status(200).json({
      success: true,
      message: 'Customer deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting Customer:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting Customer: ' + error.message
    });
  }
});

// Update Customer by ID
router.put('/api/customer/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const { name, mobileNumber, alternativeMobileNumber, emailId, dateOfBirth, remark } = req.body;

    // Validate required fields: name and mobileNumber
    if (!name || !mobileNumber) {
      return res.status(400).json({
        success: false,
        message: 'Name and Mobile Number are required'
      });
    }

    const customer = await Customer.findByPk(id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    // Check if email is already taken by another customer (only if email is provided and different from current)
    if (emailId && emailId.trim() !== '') {
      const trimmedEmail = emailId.trim();
      if (customer.emailId !== trimmedEmail) {
        const existingCustomer = await Customer.findOne({
          where: { emailId: trimmedEmail }
        });

        if (existingCustomer) {
          return res.status(400).json({
            success: false,
            message: 'This email already exists'
          });
        }
      }
    }

    customer.name = name;
    customer.mobileNumber = mobileNumber;
    customer.alternativeMobileNumber = alternativeMobileNumber || null;
    customer.emailId = (emailId && emailId.trim() !== '') ? emailId.trim() : null;
    customer.dateOfBirth = dateOfBirth || null;
    customer.remark = remark || null;
    await customer.save();

    res.status(200).json({
      success: true,
      message: 'Customer updated successfully',
      data: customer
    });
  } catch (error) {
    console.error('Error updating Customer:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating Customer: ' + error.message
    });
  }
});

// Add Document to Customer
router.post('/api/customer/:id/document', (req, res, next) => {
  upload.single('document')(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        return res.status(400).json({
          success: false,
          message: err.code === 'LIMIT_FILE_SIZE'
            ? 'File size must be 1MB or less'
            : err.message
        });
      }
      return res.status(400).json({
        success: false,
        message: err.message || 'File upload failed'
      });
    }
    next();
  });
}, async (req, res) => {
  try {
    const customerId = req.params.id;
    const { documentType } = req.body;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Document file is required'
      });
    }

    if (!documentType) {
      return res.status(400).json({
        success: false,
        message: 'Document type is required'
      });
    }

    const customer = await Customer.findOne({ where: { id: customerId } });
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    const cloudinaryConfig = cloudinary.config();
    if (!cloudinaryConfig.cloud_name || !cloudinaryConfig.api_key || !cloudinaryConfig.api_secret) {
      return res.status(500).json({
        success: false,
        message: 'Cloudinary configuration is missing'
      });
    }

    const uploadResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: 'auto',
          folder: 'customer_documents',
          public_id: `customer_${customerId}_${Date.now()}`
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        }
      );

      streamifier.createReadStream(req.file.buffer).pipe(uploadStream);
    });

    const document = await CustomerDocument.create({
      customerId,
      documentType,
      fileName: req.file.originalname,
      fileSize: `${(req.file.size / 1024).toFixed(2)} KB`,
      filePath: uploadResult.secure_url,
      cloudinaryPublicId: uploadResult.public_id
    });

    res.status(201).json({
      success: true,
      message: 'Document uploaded successfully',
      data: document
    });
  } catch (error) {
    console.error('Error adding document:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding document',
      error: error.message
    });
  }
});

// Delete Customer Document
router.delete('/api/customer/document/:id', async (req, res) => {
  try {
    const documentId = req.params.id;

    const document = await CustomerDocument.findOne({ where: { id: documentId } });
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    if (document.cloudinaryPublicId && cloudinary.config().cloud_name) {
      try {
        const resourceType = getCloudinaryResourceType(document.fileName);
        await cloudinary.uploader.destroy(document.cloudinaryPublicId, { resource_type: resourceType });
      } catch (cloudError) {
        console.warn('Cloudinary document delete failed:', cloudError.message || cloudError);
      }
    }

    await document.destroy();

    res.status(200).json({
      success: true,
      message: 'Document deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting document',
      error: error.message
    });
  }
});

module.exports = router;
