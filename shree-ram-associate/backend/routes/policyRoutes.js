const express = require('express');
const router = express.Router();
const { QueryTypes, Op } = require('sequelize');
const Policy = require('../models/Policy');
const Document = require('../models/Document');
const sequelize = require('../config/database');

// Helper function to sanitize policy data - removes N/A or null customer names
const sanitizePolicyData = (policy) => {
  if (policy && (policy.customerName === 'N/A' || !policy.customerName || policy.customerName.trim() === '')) {
    console.warn(`⚠ Detected N/A or empty customer name in policy ${policy.id}. This should not happen.`);
    // Log for debugging
    return null; // Return null to indicate invalid policy
  }
  return policy;
};

// Helper function to validate customerName before save
const validateCustomerName = (customerName) => {
  if (!customerName || typeof customerName !== 'string') {
    return false;
  }
  const trimmed = customerName.trim();
  if (trimmed === '' || trimmed === 'N/A' || trimmed === 'n/a') {
    return false;
  }
  return true;
};

// Save Policy Details
router.post('/api/policy', async (req, res) => {
  try {
    const policyData = req.body;

    // Validate customerName is provided and not N/A
    if (!validateCustomerName(policyData.customerName)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid customer name. N/A is not accepted.'
      });
    }

    // Helper function to parse date strings
    const parseDate = (dateValue) => {
      if (!dateValue) return null;
      const parsed = new Date(dateValue);
      return isNaN(parsed.getTime()) ? null : parsed;
    };

    // Create policy
    const policy = await Policy.create({
      customerName: policyData.customerName.trim(),
      policyType: policyData.policyType,
      renewal: policyData.renewal,
      insuredName: policyData.insuredName,
      policyNumber: policyData.policyNumber,
      referenceName: policyData.referenceName,
      companyName: policyData.companyName,
      insuranceType: policyData.insuranceType,
      productName: policyData.productName,
      periodFrom: parseDate(policyData.periodFrom),
      periodTo: parseDate(policyData.periodTo),
      policyDate: parseDate(policyData.policyDate),
      basicODPremium: policyData.basicODPremium,
      tpPremium: policyData.tpPremium,
      ncb: policyData.ncb || null,
      netPremium: policyData.netPremium,
      gstPercent: policyData.gstPercent || null,
      gstAmount: policyData.gstAmount || null,
      finalPremium: policyData.finalPremium,
      refBrokerageOn: policyData.refBrokerageOn,
      refBrokeragePercent: policyData.refBrokeragePercent || null,
      refBrokerageAmount: policyData.refBrokerageAmount || null,
      totalIDV: policyData.totalIDV,
      make: policyData.make,
      model: policyData.model,
      registrationNumber: policyData.registrationNumber
    });

    // If documents are provided, create them
    if (policyData.documents && Array.isArray(policyData.documents) && policyData.documents.length > 0) {
      const documentPromises = policyData.documents.map(doc =>
        Document.create({
          policyId: policy.id,
          documentType: doc.documentType,
          fileName: doc.fileName,
          fileSize: doc.fileSize
        })
      );

      await Promise.all(documentPromises);
    }

    res.status(201).json({
      success: true,
      message: 'Policy details saved successfully',
      policyId: policy.id,
      data: policy
    });
  } catch (error) {
    console.error('Error saving policy:', error);
    res.status(500).json({
      success: false,
      message: 'Error saving policy details',
      error: error.message
    });
  }
});

// Get Policy by ID with Documents
router.get('/api/policy/:id', async (req, res) => {
  try {
    const policyId = req.params.id;

    const policy = await Policy.findOne({
      where: { id: policyId },
      include: [
        {
          model: Document,
          as: 'documents',
          attributes: ['id', 'documentType', 'fileName', 'fileSize', 'uploadDate']
        }
      ]
    });

    if (!policy) {
      return res.status(404).json({
        success: false,
        message: 'Policy not found'
      });
    }

    // Check for N/A customer name and warn
    if (!policy.customerName || policy.customerName === 'N/A' || policy.customerName.trim() === '') {
      console.warn(`⚠ Policy ${policyId} has invalid customer name: "${policy.customerName}". This should not happen.`);
      return res.status(400).json({
        success: false,
        message: 'Policy has invalid customer name. Contact administrator for data correction.'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Policy details fetched successfully',
      data: policy
    });
  } catch (error) {
    console.error('Error fetching policy:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching policy details',
      error: error.message
    });
  }
});

// Get All Policies with Documents
router.get('/api/policies', async (req, res) => {
  try {
    // Query only policies with valid customer names (not N/A, not null, not empty)
    const policies = await Policy.findAll({
      where: {
        [Op.and]: [
          sequelize.where(sequelize.col('customerName'), Op.ne, 'N/A'),
          sequelize.where(sequelize.col('customerName'), Op.ne, null),
          sequelize.where(
            sequelize.fn('TRIM', sequelize.col('customerName')), 
            Op.ne, 
            ''
          )
        ]
      },
      include: [
        {
          model: Document,
          as: 'documents',
          attributes: ['id', 'documentType', 'fileName', 'fileSize', 'uploadDate']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({
      success: true,
      message: 'Policies fetched successfully',
      count: policies.length,
      data: policies
    });
  } catch (error) {
    console.error('Error fetching policies:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching policies',
      error: error.message
    });
  }
});

// Admin endpoint to view ALL policies including those with N/A customer names
router.get('/api/policies/admin/all', async (req, res) => {
  try {
    const allPolicies = await Policy.findAll({
      include: [
        {
          model: Document,
          as: 'documents',
          attributes: ['id', 'documentType', 'fileName', 'fileSize', 'uploadDate']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    // Separate valid and invalid policies for admin review
    const validPolicies = allPolicies.filter(p => 
      p.customerName && p.customerName !== 'N/A' && p.customerName.trim() !== ''
    );
    const invalidPolicies = allPolicies.filter(p => 
      !p.customerName || p.customerName === 'N/A' || p.customerName.trim() === ''
    );

    res.status(200).json({
      success: true,
      message: 'All policies fetched (including invalid ones)',
      validCount: validPolicies.length,
      invalidCount: invalidPolicies.length,
      total: allPolicies.length,
      data: {
        valid: validPolicies,
        invalid: invalidPolicies
      }
    });
  } catch (error) {
    console.error('Error fetching all policies:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching all policies',
      error: error.message
    });
  }
});

// Add Document to Policy
router.post('/api/policy/:id/document', async (req, res) => {
  try {
    const policyId = req.params.id;
    const { documentType, fileName, fileSize } = req.body;

    // Check if policy exists
    const policy = await Policy.findOne({ where: { id: policyId } });
    if (!policy) {
      return res.status(404).json({
        success: false,
        message: 'Policy not found'
      });
    }

    // Create document
    const document = await Document.create({
      policyId,
      documentType,
      fileName,
      fileSize
    });

    res.status(201).json({
      success: true,
      message: 'Document added successfully',
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

// Update Policy by ID
router.put('/api/policy/:id', async (req, res) => {
  try {
    const policyId = req.params.id;
    const policyData = req.body;

    // Check if policy exists
    const policy = await Policy.findOne({ where: { id: policyId } });
    if (!policy) {
      return res.status(404).json({
        success: false,
        message: 'Policy not found'
      });
    }

    // Validate customerName is provided and not N/A
    if (!validateCustomerName(policyData.customerName)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid customer name. N/A is not accepted.'
      });
    }

    // Helper function to parse date strings
    const parseDate = (dateValue) => {
      if (!dateValue) return null;
      const parsed = new Date(dateValue);
      return isNaN(parsed.getTime()) ? null : parsed;
    };

    // Update policy
    await policy.update({
      customerName: policyData.customerName.trim(),
      policyType: policyData.policyType,
      renewal: policyData.renewal,
      insuredName: policyData.insuredName,
      policyNumber: policyData.policyNumber,
      referenceName: policyData.referenceName,
      companyName: policyData.companyName,
      insuranceType: policyData.insuranceType,
      productName: policyData.productName,
      periodFrom: parseDate(policyData.periodFrom),
      periodTo: parseDate(policyData.periodTo),
      policyDate: parseDate(policyData.policyDate),
      basicODPremium: policyData.basicODPremium,
      tpPremium: policyData.tpPremium,
      ncb: policyData.ncb || null,
      netPremium: policyData.netPremium,
      gstPercent: policyData.gstPercent || null,
      gstAmount: policyData.gstAmount || null,
      finalPremium: policyData.finalPremium,
      refBrokerageOn: policyData.refBrokerageOn,
      refBrokeragePercent: policyData.refBrokeragePercent || null,
      refBrokerageAmount: policyData.refBrokerageAmount || null,
      totalIDV: policyData.totalIDV,
      make: policyData.make,
      model: policyData.model,
      registrationNumber: policyData.registrationNumber
    });

    res.status(200).json({
      success: true,
      message: 'Policy details updated successfully',
      policyId: policy.id,
      data: policy
    });
  } catch (error) {
    console.error('Error updating policy:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating policy details',
      error: error.message
    });
  }
});

// Delete Document
router.delete('/api/document/:id', async (req, res) => {
  try {
    const documentId = req.params.id;

    const document = await Document.findOne({ where: { id: documentId } });
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
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

// Get all unique reference names (brokers)
router.get('/api/policies/references/unique', async (req, res) => {
  try {
    const references = await Policy.findAll({
      attributes: ['referenceName'],
      raw: true,
      group: ['referenceName'],
      where: { referenceName: { [require('sequelize').Op.ne]: null } }
    });

    const uniqueReferences = references
      .map(r => r.referenceName)
      .filter((v, i, a) => a.indexOf(v) === i)
      .sort();

    res.status(200).json({
      success: true,
      message: 'Reference names fetched successfully',
      data: uniqueReferences
    });
  } catch (error) {
    console.error('Error fetching reference names:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching reference names',
      error: error.message
    });
  }
});

// Get daily commission data for a specific month
router.get('/api/policies/commission/daily/:year/:month', async (req, res) => {
  try {
    const { year, month } = req.params;
    const { referenceName } = req.query;

    // Validate year and month parameters
    const parsedYear = parseInt(year);
    const parsedMonth = parseInt(month);
    
    if (isNaN(parsedYear) || parsedYear < 1900 || parsedYear > 2100) {
      return res.status(400).json({
        success: false,
        message: 'Invalid year parameter. Must be a valid number between 1900 and 2100.'
      });
    }
    
    if (isNaN(parsedMonth) || parsedMonth < 1 || parsedMonth > 12) {
      return res.status(400).json({
        success: false,
        message: 'Invalid month parameter. Must be between 1 and 12.'
      });
    }

    // PostgreSQL-compatible query
    let query = `
      SELECT 
        EXTRACT(DAY FROM "createdAt")::int as day,
        COALESCE(SUM("refBrokerageAmount"), 0)::numeric as commission,
        COALESCE(SUM("finalPremium"), 0)::numeric as collection
      FROM "policies"
      WHERE EXTRACT(YEAR FROM "createdAt") = :year
        AND EXTRACT(MONTH FROM "createdAt") = :month
    `;

    if (referenceName) {
      query += ` AND "referenceName" = :referenceName`;
    }

    query += ` GROUP BY EXTRACT(DAY FROM "createdAt")
              ORDER BY EXTRACT(DAY FROM "createdAt") ASC`;

    const replacements = { year: parsedYear, month: parsedMonth };
    if (referenceName) {
      replacements.referenceName = referenceName;
    }

    const policies = await Policy.sequelize.query(query, {
      replacements,
      type: QueryTypes.SELECT,
      raw: true
    });

    // Create a map of existing data
    const dataMap = {};
    policies.forEach(p => {
      dataMap[p.day] = {
        day: p.day.toString().padStart(2, '0'),
        commission: parseFloat(p.commission || 0).toFixed(2),
        collection: parseFloat(p.collection || 0).toFixed(2)
      };
    });

    // Generate all days for the selected month
    const daysInMonth = new Date(parseInt(year), parseInt(month), 0).getDate();
    const allDaysData = [];
    
    for (let day = 1; day <= daysInMonth; day++) {
      if (dataMap[day]) {
        allDaysData.push(dataMap[day]);
      } else {
        allDaysData.push({
          day: day.toString().padStart(2, '0'),
          commission: '0.00',
          collection: '0.00'
        });
      }
    }

    res.status(200).json({
      success: true,
      message: 'Daily commission data fetched successfully',
      data: allDaysData
    });
  } catch (error) {
    console.error('Error fetching daily commission data:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching daily commission data',
      error: error.message
    });
  }
});

// Get monthly commission data for a specific year
router.get('/api/policies/commission/monthly/:year', async (req, res) => {
  try {
    const { year } = req.params;
    const { referenceName } = req.query;

    // Validate year parameter
    const parsedYear = parseInt(year);
    if (isNaN(parsedYear) || parsedYear < 1900 || parsedYear > 2100) {
      return res.status(400).json({
        success: false,
        message: 'Invalid year parameter. Must be a valid number between 1900 and 2100.'
      });
    }

    // PostgreSQL-compatible query
    let query = `
      SELECT 
        TO_CHAR("createdAt", 'YYYY-MM') as month,
        COALESCE(SUM("refBrokerageAmount"), 0)::numeric as commission,
        COALESCE(SUM("finalPremium"), 0)::numeric as collection
      FROM "policies"
      WHERE EXTRACT(YEAR FROM "createdAt") = :year
    `;

    if (referenceName) {
      query += ` AND "referenceName" = :referenceName`;
    }

    query += ` GROUP BY TO_CHAR("createdAt", 'YYYY-MM')
              ORDER BY TO_CHAR("createdAt", 'YYYY-MM') ASC`;

    const replacements = { year: parsedYear };
    if (referenceName) {
      replacements.referenceName = referenceName;
    }

    const policies = await Policy.sequelize.query(query, {
      replacements,
      type: QueryTypes.SELECT,
      raw: true
    });

    // Create a map of existing data
    const dataMap = {};
    policies.forEach(p => {
      dataMap[p.month] = {
        month: p.month,
        commission: parseFloat(p.commission || 0).toFixed(2),
        collection: parseFloat(p.collection || 0).toFixed(2)
      };
    });

    // Generate all 12 months for the selected year
    const allMonthsData = [];
    const monthNames = [
      '01 - January', '02 - February', '03 - March', '04 - April',
      '05 - May', '06 - June', '07 - July', '08 - August',
      '09 - September', '10 - October', '11 - November', '12 - December'
    ];

    for (let month = 1; month <= 12; month++) {
      const monthStr = year + '-' + month.toString().padStart(2, '0');
      if (dataMap[monthStr]) {
        allMonthsData.push({
          month: monthNames[month - 1],
          commission: dataMap[monthStr].commission,
          collection: dataMap[monthStr].collection
        });
      } else {
        allMonthsData.push({
          month: monthNames[month - 1],
          commission: '0.00',
          collection: '0.00'
        });
      }
    }

    res.status(200).json({
      success: true,
      message: 'Monthly commission data fetched successfully',
      data: allMonthsData
    });
  } catch (error) {
    console.error('Error fetching monthly commission data:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching monthly commission data',
      error: error.message
    });
  }
});

// Get policies by month (optional filter by reference name)
router.get('/api/policies/month/:year/:month', async (req, res) => {
  try {
    const { year, month } = req.params;
    const { referenceName } = req.query;
    const Sequelize = require('sequelize');
    const Op = Sequelize.Op;

    // Build where clause with PostgreSQL-compatible date extraction
    let whereClause = Sequelize.where(
      Sequelize.fn('to_char', Sequelize.col('"Policy"."createdAt"'), 'YYYY-MM'),
      Op.eq,
      `${year}-${month.toString().padStart(2, '0')}`
    );

    let conditions = [whereClause];
    if (referenceName) {
      conditions.push({ referenceName: referenceName });
    }

    const policies = await Policy.findAll({
      where: Sequelize.and(...conditions),
      include: [
        {
          model: Document,
          as: 'documents',
          attributes: ['id', 'documentType', 'fileName', 'fileSize', 'uploadDate'],
          required: false
        }
      ],
      order: [[Sequelize.col('Policy.createdAt'), 'DESC']],
      subQuery: false
    });

    res.status(200).json({
      success: true,
      message: 'Policies for the month fetched successfully',
      count: policies.length,
      data: policies
    });
  } catch (error) {
    console.error('Error fetching policies by month:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching policies by month',
      error: error.message
    });
  }
});

// Get renewal policies (expiring within next 3 days)
router.get('/api/policies/renewal', async (req, res) => {
  try {
    // Calculate date range: today to today + 3 days
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + 3);
    endDate.setHours(23, 59, 59, 999);

    // Fetch policies expiring within the next 3 days
    const renewalPolicies = await Policy.findAll({
      where: {
        periodTo: {
          [Op.between]: [today, endDate]
        }
      },
      order: [['periodTo', 'ASC']],
      limit: 20
    });

    res.status(200).json({
      success: true,
      message: 'Renewal policies fetched successfully',
      data: renewalPolicies,
      count: renewalPolicies.length
    });
  } catch (error) {
    console.error('Error fetching renewal policies:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching renewal policies',
      error: error.message
    });
  }
});

// Admin Endpoint: Delete policies with N/A customer names
router.delete('/api/admin/policies/cleanup/na', async (req, res) => {
  try {
    console.log('⚠ Running cleanup: deleting policies with N/A customer names...');
    
    // Find all policies with N/A customer names
    const naPolicies = await Policy.findAll({
      where: {
        [Op.or]: [
          { customerName: 'N/A' },
          { customerName: null },
          sequelize.where(
            sequelize.fn('TRIM', sequelize.col('customerName')), 
            Op.eq, 
            ''
          )
        ]
      }
    });

    console.log(`Found ${naPolicies.length} policies with N/A customer names`);

    if (naPolicies.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No policies with N/A customer names found',
        deletedCount: 0
      });
    }

    // Delete documents associated with these policies first
    const policyIds = naPolicies.map(p => p.id);
    const deletedDocs = await Document.destroy({
      where: { policyId: { [Op.in]: policyIds } }
    });

    // Delete the policies
    const deletedCount = await Policy.destroy({
      where: { id: { [Op.in]: policyIds } }
    });

    console.log(`✓ Deleted ${deletedCount} policies and ${deletedDocs} documents with N/A customer names`);

    res.status(200).json({
      success: true,
      message: `Cleanup completed: ${deletedCount} policies with N/A customer names deleted`,
      deletedPolicies: deletedCount,
      deletedDocuments: deletedDocs,
      policyIds: policyIds
    });
  } catch (error) {
    console.error('✗ Error during cleanup:', error);
    res.status(500).json({
      success: false,
      message: 'Error during cleanup operation',
      error: error.message
    });
  }
});

// Test Endpoint: Add sample policies for testing
router.post('/api/test/sample-policies', async (req, res) => {
  try {
    console.log('Checking for existing sample policies...');

    // Check if sample policies already exist
    const existingCount = await Policy.count({
      where: {
        policyNumber: { [Op.in]: ['POL001', 'POL002', 'POL003'] }
      }
    });

    if (existingCount > 0) {
      console.log(`Found ${existingCount} existing sample policies`);
      // Fetch and return existing policies
      const existingPolicies = await Policy.findAll({
        where: {
          policyNumber: { [Op.in]: ['POL001', 'POL002', 'POL003'] }
        },
        include: [
          {
            model: Document,
            as: 'documents',
            attributes: ['id', 'documentType', 'fileName', 'fileSize', 'uploadDate']
          }
        ]
      });

      return res.status(200).json({
        success: true,
        message: 'Sample policies already exist',
        count: existingPolicies.length,
        data: existingPolicies
      });
    }

    console.log('Creating sample policies for testing...');

    const samplePolicies = [
      {
        customerName: 'Rajesh Kumar',
        policyType: 'Four Wheeler',
        renewal: 'Yes',
        policyNumber: 'POL001',
        referenceName: 'John Broker',
        companyName: 'ICICI Lombard',
        insuranceType: 'Comprehensive',
        productName: 'Four Wheeler Insurance',
        periodFrom: new Date('2024-01-01'),
        periodTo: new Date('2025-01-01'),
        policyDate: new Date('2024-01-01'),
        basicODPremium: 5000,
        tpPremium: 2000,
        ncb: 500,
        netPremium: 6500,
        gstPercent: 18,
        gstAmount: 1170,
        finalPremium: 7670,
        refBrokerageOn: 'Basic',
        refBrokeragePercent: 15,
        refBrokerageAmount: 750,
        totalIDV: 500000,
        make: 'Maruti',
        model: 'Swift',
        registrationNumber: 'DL01AB1234'
      },
      {
        customerName: 'Priya Singh',
        policyType: 'Two Wheeler',
        renewal: 'No',
        policyNumber: 'POL002',
        referenceName: 'Sarah Agent',
        companyName: 'Bajaj Allianz',
        insuranceType: 'Third Party',
        productName: 'Two Wheeler Insurance',
        periodFrom: new Date('2024-06-15'),
        periodTo: new Date('2025-06-15'),
        policyDate: new Date('2024-06-15'),
        basicODPremium: 1200,
        tpPremium: 800,
        ncb: 0,
        netPremium: 2000,
        gstPercent: 18,
        gstAmount: 360,
        finalPremium: 2360,
        refBrokerageOn: 'Net',
        refBrokeragePercent: 10,
        refBrokerageAmount: 200,
        totalIDV: 80000,
        make: 'Honda',
        model: 'CB350',
        registrationNumber: 'MH02CD5678'
      },
      {
        customerName: 'Amit Patel',
        policyType: 'Health',
        renewal: 'Yes',
        policyNumber: 'POL003',
        referenceName: 'Mike Advisor',
        companyName: 'Apollo DKV',
        insuranceType: 'Comprehensive',
        productName: 'Health Insurance',
        periodFrom: new Date('2024-03-01'),
        periodTo: new Date('2025-03-01'),
        policyDate: new Date('2024-03-01'),
        basicODPremium: 15000,
        tpPremium: 0,
        ncb: 1500,
        netPremium: 13500,
        gstPercent: 18,
        gstAmount: 2430,
        finalPremium: 15930,
        refBrokerageOn: 'Basic',
        refBrokeragePercent: 5,
        refBrokerageAmount: 750,
        totalIDV: 500000,
        make: null,
        model: null,
        registrationNumber: null
      }
    ];

    const createdPolicies = await Promise.all(
      samplePolicies.map(policy => Policy.create(policy))
    );

    res.status(201).json({
      success: true,
      message: `Created ${createdPolicies.length} sample policies`,
      count: createdPolicies.length,
      data: createdPolicies
    });
  } catch (error) {
    console.error('Error creating sample policies:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating sample policies',
      error: error.message
    });
  }
});

module.exports = router;
