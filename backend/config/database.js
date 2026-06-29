const { Sequelize } = require('sequelize');
require('dotenv').config();

function getDbConfig() {
  if (process.env.DB_URI) {
    try {
      const parsed = new URL(process.env.DB_URI);
      return {
        database: parsed.pathname.replace(/^\/+/, ''),
        username: decodeURIComponent(parsed.username || ''),
        password: decodeURIComponent(parsed.password || ''),
        host: parsed.hostname,
        port: parsed.port || '5432'
      };
    } catch (error) {
      console.warn('Invalid DB_URI provided, falling back to DB env variables:', error.message);
    }
  }

  return {
    database: process.env.DB_NAME || 'shree_ram_db',
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || '5432'
  };
}

const dbConfig = getDbConfig();

const sequelize = new Sequelize(dbConfig.database, dbConfig.username, dbConfig.password, {
  host: dbConfig.host,
  port: dbConfig.port,
  dialect: 'postgres',
  logging: false // Set to console.log to see SQL queries
});

module.exports = sequelize;
