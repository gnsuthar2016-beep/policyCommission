const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const BirthdayTemplate = sequelize.define('BirthdayTemplate', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: true
  },
  fileName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  filePath: {
    type: DataTypes.STRING,
    allowNull: false
  },
  cloudinaryPublicId: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: 'birthday_templates',
  timestamps: true
});

module.exports = BirthdayTemplate;
