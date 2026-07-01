// This migration repairs the customers table in PostgreSQL so blank mobile/email values can be imported safely.
const { QueryTypes } = require('sequelize');
const sequelize = require('../config/database');

async function repairCustomerSchema() {
  try {
    console.log('Checking customer table schema...');

    const tableCheck = await sequelize.query(
      `SELECT to_regclass('public.customers') AS table_name`,
      { type: QueryTypes.SELECT, raw: true }
    );

    if (!tableCheck[0] || !tableCheck[0].table_name) {
      console.log('✓ customers table does not exist yet; skipping direct repair');
      return true;
    }

    const constraints = await sequelize.query(
      `
        SELECT c.conname, a.attname
        FROM pg_constraint c
        JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
        WHERE c.conrelid = '"customers"'::regclass
          AND c.contype = 'u'
          AND a.attname IN ('mobileNumber', 'emailId')
      `,
      { type: QueryTypes.SELECT, raw: true }
    );

    for (const constraint of constraints) {
      try {
        console.log(`Dropping unique constraint ${constraint.conname} on customers.${constraint.attname}...`);
        await sequelize.query(`ALTER TABLE "customers" DROP CONSTRAINT "${constraint.conname}"`, { raw: true });
      } catch (error) {
        console.warn(`Warning while dropping constraint ${constraint.conname}:`, error.message);
      }
    }

    const columns = await sequelize.query(
      `
        SELECT column_name, is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'customers'
          AND column_name IN ('mobileNumber', 'emailId')
      `,
      { type: QueryTypes.SELECT, raw: true }
    );

    for (const column of columns) {
      if (column.is_nullable === 'NO') {
        console.log(`Making customers.${column.column_name} nullable...`);
        await sequelize.query(`ALTER TABLE "customers" ALTER COLUMN "${column.column_name}" DROP NOT NULL`, { raw: true });
      }
    }

    console.log('✓ Customer schema repair completed');
    return true;
  } catch (error) {
    console.warn('Customer schema repair warning:', error.message);
    return false;
  }
}

module.exports = { repairCustomerSchema };
