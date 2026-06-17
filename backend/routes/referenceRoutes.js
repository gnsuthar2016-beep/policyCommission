const express = require('express');
const router = express.Router();
const Reference = require('../models/Reference');

// Save Reference
router.post('/api/reference', async (req, res) => {
  try {
    const { name, mobileNumber, alternativeMobileNumber, emailId, dateOfBirth, remark } = req.body;

    // Validate required fields
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Reference Name is required'
      });
    }

    if (!mobileNumber) {
      return res.status(400).json({
        success: false,
        message: 'Mobile Number is required'
      });
    }

    // Validate mobile number format (10 digits)
    if (!/^\d{10}$/.test(mobileNumber)) {
      return res.status(400).json({
        success: false,
        message: 'Mobile Number must be 10 digits'
      });
    }

    // Validate email format if provided
    if (emailId && emailId.trim() !== '') {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailId.trim())) {
        return res.status(400).json({
          success: false,
          message: 'Email ID format is invalid'
        });
      }
    }

    // Check if reference with same name already exists
    const existingRefByName = await Reference.findOne({
      where: { name: name }
    });

    if (existingRefByName) {
      return res.status(400).json({
        success: false,
        message: 'Reference with this name already exists'
      });
    }

    // Check if reference with same mobile already exists
    const existingRefByMobile = await Reference.findOne({
      where: { mobileNumber: mobileNumber }
    });

    if (existingRefByMobile) {
      return res.status(400).json({
        success: false,
        message: 'Reference with this mobile number already exists'
      });
    }

    // Check if reference with same email already exists (only if email is provided)
    if (emailId && emailId.trim() !== '') {
      const existingRefByEmail = await Reference.findOne({
        where: { emailId: emailId.trim() }
      });

      if (existingRefByEmail) {
        return res.status(400).json({
          success: false,
          message: 'Reference with this email already exists'
        });
      }
    }

    const reference = await Reference.create({
      name: name,
      mobileNumber: mobileNumber,
      alternativeMobileNumber: alternativeMobileNumber || null,
      emailId: (emailId && emailId.trim() !== '') ? emailId.trim() : null,
      dateOfBirth: dateOfBirth || null,
      remark: remark || null
    });

    res.status(201).json({
      success: true,
      message: 'Reference saved successfully',
      data: reference,
      id: reference.id
    });
  } catch (error) {
    console.error('Error saving Reference:', error);
    res.status(500).json({
      success: false,
      message: 'Error saving Reference: ' + error.message
    });
  }
});

// Get all References
router.get('/api/reference', async (req, res) => {
  try {
    const references = await Reference.findAll({
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({
      success: true,
      data: references,
      count: references.length
    });
  } catch (error) {
    console.error('Error fetching References:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching References: ' + error.message
    });
  }
});

// Get Reference by ID
router.get('/api/reference/:id', async (req, res) => {
  try {
    const id = req.params.id;

    const reference = await Reference.findByPk(id);

    if (!reference) {
      return res.status(404).json({
        success: false,
        message: 'Reference not found'
      });
    }

    res.status(200).json({
      success: true,
      data: reference
    });
  } catch (error) {
    console.error('Error fetching Reference:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching Reference: ' + error.message
    });
  }
});

// Delete Reference by ID
router.delete('/api/reference/:id', async (req, res) => {
  try {
    const id = req.params.id;

    const reference = await Reference.findByPk(id);

    if (!reference) {
      return res.status(404).json({
        success: false,
        message: 'Reference not found'
      });
    }

    await reference.destroy();

    res.status(200).json({
      success: true,
      message: 'Reference deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting Reference:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting Reference: ' + error.message
    });
  }
});

// Update Reference by ID
router.put('/api/reference/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const { name, mobileNumber, alternativeMobileNumber, emailId, dateOfBirth, remark } = req.body;

    // Validate required fields
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Reference Name is required'
      });
    }

    if (!mobileNumber) {
      return res.status(400).json({
        success: false,
        message: 'Mobile Number is required'
      });
    }

    // Validate mobile number format (10 digits)
    if (!/^\d{10}$/.test(mobileNumber)) {
      return res.status(400).json({
        success: false,
        message: 'Mobile Number must be 10 digits'
      });
    }

    // Validate email format if provided
    if (emailId && emailId.trim() !== '') {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailId.trim())) {
        return res.status(400).json({
          success: false,
          message: 'Email ID format is invalid'
        });
      }
    }

    const reference = await Reference.findByPk(id);

    if (!reference) {
      return res.status(404).json({
        success: false,
        message: 'Reference not found'
      });
    }

    // Check if name is already taken by another reference
    if (reference.name !== name) {
      const existingRefByName = await Reference.findOne({
        where: { name: name }
      });

      if (existingRefByName) {
        return res.status(400).json({
          success: false,
          message: 'Reference with this name already exists'
        });
      }
    }

    // Check if mobile is already taken by another reference
    if (reference.mobileNumber !== mobileNumber) {
      const existingRefByMobile = await Reference.findOne({
        where: { mobileNumber: mobileNumber }
      });

      if (existingRefByMobile) {
        return res.status(400).json({
          success: false,
          message: 'Reference with this mobile number already exists'
        });
      }
    }

    // Check if email is already taken by another reference (only if email is provided and different from current)
    if (emailId && emailId.trim() !== '') {
      const trimmedEmail = emailId.trim();
      if (reference.emailId !== trimmedEmail) {
        const existingRefByEmail = await Reference.findOne({
          where: { emailId: trimmedEmail }
        });

        if (existingRefByEmail) {
          return res.status(400).json({
            success: false,
            message: 'Reference with this email already exists'
          });
        }
      }
    }

    reference.name = name;
    reference.mobileNumber = mobileNumber;
    reference.alternativeMobileNumber = alternativeMobileNumber || null;
    reference.emailId = (emailId && emailId.trim() !== '') ? emailId.trim() : null;
    reference.dateOfBirth = dateOfBirth || null;
    reference.remark = remark || null;
    await reference.save();

    res.status(200).json({
      success: true,
      message: 'Reference updated successfully',
      data: reference
    });
  } catch (error) {
    console.error('Error updating Reference:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating Reference: ' + error.message
    });
  }
});

module.exports = router;
