// This migration adds the premiumSource column to policies table
const { QueryTypes } = require('sequelize');
const sequelize = require('../config/database');

async function addPremiumSourceColumn() {
  try {
    console.log('Checking if premiumSource column exists...');
    
    // Check if column exists
    const result = await sequelize.query(
      `SELECT column_name FROM information_schema.columns 
       WHERE table_name = 'policies' AND column_name = 'premiumSource'`,
      { type: QueryTypes.SELECT, raw: true }
    );

    if (result.length === 0) {
      console.log('premiumSource column not found. Creating it...');
      // Create the column with default value
      await sequelize.query(
        'ALTER TABLE "policies" ADD COLUMN "premiumSource" VARCHAR(50) DEFAULT \'Net Premium\'',
        { raw: true }
      );
      console.log('✓ premiumSource column created successfully with default value "Net Premium"');
    } else {
      console.log('✓ premiumSource column already exists');
    }

    return true;
  } catch (error) {
    console.error('Migration error:', error.message);
    // If the column already exists, that's fine
    if (error.message.includes('duplicate column name') || error.message.includes('already exists')) {
      console.log('✓ Column already exists, skipping creation');
      return true;
    }
    console.warn('Migration warning:', error.message);
    return false;
  }
}

module.exports = { addPremiumSourceColumn };
