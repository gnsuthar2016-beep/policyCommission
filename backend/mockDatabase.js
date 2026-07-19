const fs = require('fs');
const path = require('path');

// Mock Database - Simulates PostgreSQL with JSON file storage
class MockDatabase {
  constructor() {
    this.dbPath = path.join(__dirname, 'mock-db.json');
    this.data = {
      users: [],
      policies: [],
      customers: [],
      documents: [],
      customerDocuments: [],
      miscMasters: [],
      references: []
    };
    this.loadData();
  }

  loadData() {
    try {
      if (fs.existsSync(this.dbPath)) {
        const rawData = fs.readFileSync(this.dbPath, 'utf-8');
        this.data = JSON.parse(rawData);
      } else {
        this.initializeDefaultData();
      }
    } catch (err) {
      console.warn('Error loading mock database, initializing fresh:', err.message);
      this.initializeDefaultData();
    }
  }

  saveData() {
    try {
      fs.writeFileSync(this.dbPath, JSON.stringify(this.data, null, 2));
    } catch (err) {
      console.error('Error saving mock database:', err.message);
    }
  }

  initializeDefaultData() {
    // Initialize with test users
    this.data = {
      users: [
        {
          id: 1,
          name: 'Test User',
          email: 'test@example.com',
          password: '$2a$10$1234567890abcdefghijklmnopqrstuvwxyz', // password123
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 2,
          name: 'Admin User',
          email: 'admin@example.com',
          password: '$2a$10$0987654321abcdefghijklmnopqrstuvwxyz', // admin123
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ],
      policies: [],
      customers: [],
      documents: [],
      customerDocuments: [],
      miscMasters: [],
      references: []
    };
    this.saveData();
  }

  // User operations
  findUser(email) {
    return this.data.users.find(u => u.email === email);
  }

  findUserById(id) {
    return this.data.users.find(u => u.id === id);
  }

  createUser(userData) {
    const id = Math.max(...this.data.users.map(u => u.id), 0) + 1;
    const user = {
      id,
      ...userData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.data.users.push(user);
    this.saveData();
    return user;
  }

  // Policy operations
  findPolicyById(id) {
    return this.data.policies.find(p => p.id === id);
  }

  getAllPolicies() {
    return this.data.policies;
  }

  getPoliciesByMonth(year, month) {
    return this.data.policies.filter(p => {
      const date = new Date(p.createdAt);
      return date.getFullYear() === year && (date.getMonth() + 1) === month;
    });
  }

  createPolicy(policyData) {
    const id = Math.max(...this.data.policies.map(p => p.id || 0), 0) + 1;
    const policy = {
      id,
      ...policyData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.data.policies.push(policy);
    this.saveData();
    return policy;
  }

  updatePolicy(id, policyData) {
    const policy = this.findPolicyById(id);
    if (policy) {
      Object.assign(policy, policyData, {
        updatedAt: new Date().toISOString()
      });
      this.saveData();
    }
    return policy;
  }

  deletePolicy(id) {
    const index = this.data.policies.findIndex(p => p.id === id);
    if (index > -1) {
      this.data.policies.splice(index, 1);
      this.saveData();
      return true;
    }
    return false;
  }

  // Customer operations
  findCustomerById(id) {
    return this.data.customers.find(c => c.id === id);
  }

  getAllCustomers() {
    return this.data.customers;
  }

  createCustomer(customerData) {
    const id = Math.max(...this.data.customers.map(c => c.id || 0), 0) + 1;
    const customer = {
      id,
      ...customerData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.data.customers.push(customer);
    this.saveData();
    return customer;
  }

  updateCustomer(id, customerData) {
    const customer = this.findCustomerById(id);
    if (customer) {
      Object.assign(customer, customerData, {
        updatedAt: new Date().toISOString()
      });
      this.saveData();
    }
    return customer;
  }

  // Document operations
  findDocumentById(id) {
    return this.data.documents.find(d => d.id === id);
  }

  createDocument(documentData) {
    const id = Math.max(...this.data.documents.map(d => d.id || 0), 0) + 1;
    const document = {
      id,
      ...documentData,
      createdAt: new Date().toISOString()
    };
    this.data.documents.push(document);
    this.saveData();
    return document;
  }

  deleteDocument(id) {
    const index = this.data.documents.findIndex(d => d.id === id);
    if (index > -1) {
      this.data.documents.splice(index, 1);
      this.saveData();
      return true;
    }
    return false;
  }

  // Reference operations
  getAllReferences() {
    return this.data.references;
  }

  getUniqueReferenceNames() {
    const names = [...new Set(this.data.policies.map(p => p.referenceName).filter(Boolean))];
    return names;
  }

  // Clear all data
  clearData() {
    this.initializeDefaultData();
  }
}

module.exports = new MockDatabase();
