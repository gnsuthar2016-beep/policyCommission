const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Customer = require('./Customer');

const CustomerDocument = sequelize.define('CustomerDocument', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  customerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Customer,
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  documentType: {
    type: DataTypes.STRING,
    allowNull: false
  },
  fileName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  fileSize: {
    type: DataTypes.STRING,
    allowNull: false
  },
  filePath: {
    type: DataTypes.STRING,
    allowNull: true
  },
  cloudinaryPublicId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  uploadDate: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
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
  tableName: 'customer_documents',
  timestamps: true
});

// Set up relationship
Customer.hasMany(CustomerDocument, { foreignKey: 'customerId', as: 'documents' });
CustomerDocument.belongsTo(Customer, { foreignKey: 'customerId', as: 'customer' });

module.exports = CustomerDocument;
