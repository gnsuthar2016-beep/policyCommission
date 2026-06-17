const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Policy = sequelize.define('Policy', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  customerName: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
      isNotNA(value) {
        if (value === 'N/A' || value === 'n/a') {
          throw new Error('Customer name cannot be N/A');
        }
      }
    }
  },
  policyType: {
    type: DataTypes.STRING,
    allowNull: false
  },
  policyNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  referenceName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  companyName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  insuranceType: {
    type: DataTypes.STRING,
    allowNull: false
  },
  productName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  periodFrom: {
    type: DataTypes.DATE,
    allowNull: false
  },
  periodTo: {
    type: DataTypes.DATE,
    allowNull: false
  },
  policyDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  // Premium Details
  basicODPremium: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  tpPremium: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  ncb: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  netPremium: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  gstPercent: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true
  },
  gstAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  finalPremium: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  // Broker Details
  refBrokerageOn: {
    type: DataTypes.STRING,
    allowNull: false
  },
  premiumSource: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'Net Premium',
    validate: {
      isIn: [['OD Premium', 'Net Premium']]
    }
  },
  refBrokeragePercent: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true
  },
  refBrokerageAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  // Vehicle Details
  totalIDV: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  make: {
    type: DataTypes.STRING,
    allowNull: true
  },
  model: {
    type: DataTypes.STRING,
    allowNull: true
  },
  registrationNumber: {
    type: DataTypes.STRING,
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
  tableName: 'policies',
  timestamps: true
});

module.exports = Policy;
