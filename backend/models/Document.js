const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Policy = require('./Policy');

const Document = sequelize.define('Document', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  policyId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Policy,
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
  tableName: 'documents',
  timestamps: true
});

// Set up relationship
Policy.hasMany(Document, { foreignKey: 'policyId', as: 'documents' });
Document.belongsTo(Policy, { foreignKey: 'policyId', as: 'policy' });

module.exports = Document;
