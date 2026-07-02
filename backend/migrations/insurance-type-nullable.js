const { QueryTypes } = require('sequelize');
const sequelize = require('../config/database');

async function makeInsuranceTypeNullable() {
  try {
    console.log('Checking if policies.insuranceType is nullable...');

    const result = await sequelize.query(
      `SELECT is_nullable FROM information_schema.columns WHERE table_name = 'policies' AND column_name = 'insuranceType'`,
      { type: QueryTypes.SELECT, raw: true }
    );

    if (result.length === 0) {
      console.log('insuranceType column not found on policies table. No changes made.');
      return true;
    }

    if (result[0].is_nullable === 'YES') {
      console.log('insuranceType column is already nullable.');
      return true;
    }

    console.log('Making insuranceType column nullable...');
    await sequelize.query('ALTER TABLE "policies" ALTER COLUMN "insuranceType" DROP NOT NULL', { raw: true });
    console.log('✓ insuranceType column made nullable');
    return true;
  } catch (error) {
    console.error('Migration error for insuranceType nullable:', error.message);
    if (error.message.includes('does not exist')) {
      console.log('insuranceType column does not exist, skipping migration.');
      return true;
    }
    return false;
  }
}

module.exports = { makeInsuranceTypeNullable };
