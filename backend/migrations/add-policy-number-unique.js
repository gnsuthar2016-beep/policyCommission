// This migration ensures the database-level unique constraint on policies.policyNumber exists
const { QueryTypes } = require('sequelize');
const sequelize = require('../config/database');

async function addPolicyNumberUniqueConstraint() {
  try {
    console.log('Checking if policies.policyNumber has a unique constraint...');

    const result = await sequelize.query(
      `
        SELECT conname
        FROM pg_constraint c
        JOIN pg_attribute a
          ON a.attrelid = c.conrelid
         AND a.attnum = ANY(c.conkey)
        WHERE c.conrelid = '"policies"'::regclass
          AND c.contype = 'u'
          AND a.attname = 'policyNumber'
      `,
      { type: QueryTypes.SELECT, raw: true }
    );

    if (result.length === 0) {
      console.log('policyNumber unique constraint not found. Creating it...');
      await sequelize.query(
        'ALTER TABLE "policies" ADD CONSTRAINT "policies_policyNumber_unique" UNIQUE ("policyNumber")',
        { raw: true }
      );
      console.log('✓ policyNumber unique constraint created');
    } else {
      console.log('✓ policyNumber unique constraint already exists');
    }

    return true;
  } catch (error) {
    console.warn('Migration warning:', error.message);
    return false;
  }
}

module.exports = { addPolicyNumberUniqueConstraint };