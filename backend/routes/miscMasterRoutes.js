const express = require('express');
const router = express.Router();
const MiscMaster = require('../models/MiscMaster');

// Save Misc Master Details
router.post('/api/misc-master', async (req, res) => {
  try {
    const { type, name } = req.body;

    if (!type || !name) {
      return res.status(400).json({
        success: false,
        message: 'Type and Name are required'
      });
    }

    // Check if entry already exists
    const existingEntry = await MiscMaster.findOne({
      where: { name: name }
    });

    if (existingEntry) {
      return res.status(400).json({
        success: false,
        message: 'This name already exists'
      });
    }

    const miscMaster = await MiscMaster.create({
      type: type,
      name: name
    });

    res.status(201).json({
      success: true,
      message: 'Misc Master saved successfully',
      data: miscMaster,
      id: miscMaster.id
    });
  } catch (error) {
    console.error('Error saving Misc Master:', error);
    res.status(500).json({
      success: false,
      message: 'Error saving Misc Master: ' + error.message
    });
  }
});

// Get all Misc Master entries by type
router.get('/api/misc-master/:type', async (req, res) => {
  try {
    const type = req.params.type;

    const miscMasters = await MiscMaster.findAll({
      where: { type: type },
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({
      success: true,
      data: miscMasters,
      count: miscMasters.length
    });
  } catch (error) {
    console.error('Error fetching Misc Masters:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching Misc Masters: ' + error.message
    });
  }
});

// Get all Misc Master entries
router.get('/api/misc-master', async (req, res) => {
  try {
    const miscMasters = await MiscMaster.findAll({
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({
      success: true,
      data: miscMasters,
      count: miscMasters.length
    });
  } catch (error) {
    console.error('Error fetching Misc Masters:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching Misc Masters: ' + error.message
    });
  }
});

// Delete Misc Master by ID
router.delete('/api/misc-master/:id', async (req, res) => {
  try {
    const id = req.params.id;

    const miscMaster = await MiscMaster.findByPk(id);

    if (!miscMaster) {
      return res.status(404).json({
        success: false,
        message: 'Misc Master not found'
      });
    }

    await miscMaster.destroy();

    res.status(200).json({
      success: true,
      message: 'Misc Master deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting Misc Master:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting Misc Master: ' + error.message
    });
  }
});

// Update Misc Master by ID
router.put('/api/misc-master/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const { type, name } = req.body;

    if (!type || !name) {
      return res.status(400).json({
        success: false,
        message: 'Type and Name are required'
      });
    }

    const miscMaster = await MiscMaster.findByPk(id);

    if (!miscMaster) {
      return res.status(404).json({
        success: false,
        message: 'Misc Master not found'
      });
    }

    // Check if name is already taken by another entry
    if (miscMaster.name !== name) {
      const existingEntry = await MiscMaster.findOne({
        where: { name: name }
      });

      if (existingEntry) {
        return res.status(400).json({
          success: false,
          message: 'This name already exists'
        });
      }
    }

    miscMaster.type = type;
    miscMaster.name = name;
    await miscMaster.save();

    res.status(200).json({
      success: true,
      message: 'Misc Master updated successfully',
      data: miscMaster
    });
  } catch (error) {
    console.error('Error updating Misc Master:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating Misc Master: ' + error.message
    });
  }
});

module.exports = router;
