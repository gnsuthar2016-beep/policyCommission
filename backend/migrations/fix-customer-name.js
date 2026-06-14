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
      console.log('customerName column found. Checking for N/A values...');
      
      // Check and log any N/A or NULL values
      const naCheck = await sequelize.query(
        `SELECT COUNT(*) as count FROM "policies" WHERE "customerName" = 'N/A' OR "customerName" IS NULL`,
        { type: QueryTypes.SELECT, raw: true }
      );
      
      if (naCheck[0].count > 0) {
        console.log(`⚠ Found ${naCheck[0].count} policies with N/A or NULL customer names`);
        console.log('⚠ These need manual review and correction');
      }
    } else {
      console.log('Creating customerName column with NOT NULL constraint...');
      // Create the column without default N/A
      await sequelize.query(
        'ALTER TABLE "policies" ADD COLUMN "customerName" VARCHAR(255) NOT NULL',
        { raw: true }
      );
      console.log('✓ Column created successfully');
    }

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
