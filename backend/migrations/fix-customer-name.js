// This migration fixes the customerName column constraint issue
const { QueryTypes } = require('sequelize');
const sequelize = require('../config/database');

async function fixCustomerNameColumn() {
  try {
    console.log('Checking if customerName column exists...');
    
    // Check if column exists
    const result = await sequelize.query(
      `SELECT column_name FROM information_schema.columns 
       WHERE table_name = 'policies' AND column_name = 'customerName'`,
      { type: QueryTypes.SELECT, raw: true }
    );

    if (result.length > 0) {
      console.log('customerName column found. Dropping it...');
      // Drop the existing column
      await sequelize.query(
        'ALTER TABLE "policies" DROP COLUMN "customerName"',
        { raw: true }
      );
      console.log('✓ Column dropped successfully');
    }

    console.log('Creating customerName column with proper constraints...');
    // Create the column with proper constraints
    await sequelize.query(
      'ALTER TABLE "policies" ADD COLUMN "customerName" VARCHAR(255) DEFAULT \'N/A\'',
      { raw: true }
    );
    console.log('✓ Column created successfully with default value');

    return true;
  } catch (error) {
    console.error('Migration error:', error.message);
    // If column doesn't exist, that's fine - Sequelize will create it
    if (error.message.includes('column "customerName" does not exist')) {
      return true;
    }
    return false;
  }
}

module.exports = { fixCustomerNameColumn };
