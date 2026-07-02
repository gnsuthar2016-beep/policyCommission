const { QueryTypes } = require('sequelize');
const sequelize = require('../config/database');

async function addInsuranceBranchColumn() {
  try {
    console.log('Checking if insuranceBranch column exists in policies...');

    const result = await sequelize.query(
      `SELECT column_name FROM information_schema.columns WHERE table_name = 'policies' AND column_name = 'insuranceBranch'`,
      { type: QueryTypes.SELECT, raw: true }
    );

    if (result.length === 0) {
      console.log('insuranceBranch column not found. Creating it...');
      await sequelize.query('ALTER TABLE "policies" ADD COLUMN "insuranceBranch" VARCHAR(255)', { raw: true });
      console.log('✓ insuranceBranch column created');
    } else {
      console.log('✓ insuranceBranch column already exists');
    }

    return true;
  } catch (error) {
    console.error('Migration error adding insuranceBranch column:', error.message);
    return false;
  }
}

module.exports = { addInsuranceBranchColumn };