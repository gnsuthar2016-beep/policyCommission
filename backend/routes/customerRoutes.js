const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');

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

    const customer = await Customer.findByPk(id);

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

module.exports = router;
