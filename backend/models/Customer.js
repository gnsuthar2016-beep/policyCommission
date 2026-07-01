const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Customer = sequelize.define('Customer', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  mobileNumber: {
    type: DataTypes.STRING,
    allowNull: true
  },
  alternativeMobileNumber: {
    type: DataTypes.STRING,
    allowNull: true
  },
  emailId: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true,
    where: {
      emailId: { [require('sequelize').Op.ne]: null }
    }
  },
  dateOfBirth: {
    type: DataTypes.DATE,
    allowNull: true
  },
  remark: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'customers',
  timestamps: true
});

module.exports = Customer;
