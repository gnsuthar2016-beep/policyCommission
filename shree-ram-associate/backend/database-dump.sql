-- =====================================================
-- PostgreSQL Database Script for Shree Ram Associate
-- Insurance Database Management System
-- =====================================================

-- Drop existing database if it exists (optional - uncomment if needed)
-- DROP DATABASE IF EXISTS shree_ram_db;

-- Create Database
CREATE DATABASE shree_ram_db
    WITH
    ENCODING = 'UTF8'
    LC_COLLATE = 'C'
    LC_CTYPE = 'C'
    TEMPLATE = template0;

-- Connect to the new database
\c shree_ram_db;

-- =====================================================
-- CREATE TABLES
-- =====================================================

-- Table: users
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);

-- Table: customers
CREATE TABLE customers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    "mobileNumber" VARCHAR(255) NOT NULL UNIQUE,
    "alternativeMobileNumber" VARCHAR(255),
    "emailId" VARCHAR(255) NOT NULL UNIQUE,
    "dateOfBirth" DATE,
    remark TEXT,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_customers_mobile ON customers("mobileNumber");
CREATE INDEX idx_customers_email ON customers("emailId");

-- Table: references
CREATE TABLE references (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    "mobileNumber" VARCHAR(255) NOT NULL UNIQUE,
    "alternativeMobileNumber" VARCHAR(255),
    "emailId" VARCHAR(255) NOT NULL UNIQUE,
    "dateOfBirth" DATE,
    remark TEXT,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_references_mobile ON references("mobileNumber");
CREATE INDEX idx_references_email ON references("emailId");

-- Table: miscmasters
CREATE TABLE miscmasters (
    id SERIAL PRIMARY KEY,
    type VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL UNIQUE,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_miscmasters_type ON miscmasters(type);

-- Table: policies
CREATE TABLE policies (
    id SERIAL PRIMARY KEY,
    "customerName" VARCHAR(255) DEFAULT 'N/A',
    "policyType" VARCHAR(255) NOT NULL,
    renewal VARCHAR(255) NOT NULL,
    "policyNumber" VARCHAR(255) NOT NULL UNIQUE,
    "referenceName" VARCHAR(255) NOT NULL,
    "companyName" VARCHAR(255) NOT NULL,
    "insuranceType" VARCHAR(255) NOT NULL,
    "productName" VARCHAR(255) NOT NULL,
    "periodFrom" DATE NOT NULL,
    "periodTo" DATE NOT NULL,
    "policyDate" DATE,
    "basicODPremium" NUMERIC(10, 2) NOT NULL,
    "tpPremium" NUMERIC(10, 2) NOT NULL,
    ncb NUMERIC(10, 2),
    "netPremium" NUMERIC(10, 2) NOT NULL,
    "gstPercent" NUMERIC(5, 2),
    "gstAmount" NUMERIC(10, 2),
    "finalPremium" NUMERIC(10, 2) NOT NULL,
    "refBrokerageOn" VARCHAR(255) NOT NULL,
    "refBrokeragePercent" NUMERIC(5, 2),
    "refBrokerageAmount" NUMERIC(10, 2),
    "totalIDV" NUMERIC(10, 2) NOT NULL,
    make VARCHAR(255) NOT NULL,
    model VARCHAR(255) NOT NULL,
    "registrationNumber" VARCHAR(255) NOT NULL,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_policies_number ON policies("policyNumber");
CREATE INDEX idx_policies_customer ON policies("customerName");
CREATE INDEX idx_policies_type ON policies("policyType");
CREATE INDEX idx_policies_company ON policies("companyName");

-- Table: documents
CREATE TABLE documents (
    id SERIAL PRIMARY KEY,
    "policyId" INTEGER NOT NULL REFERENCES policies(id) ON DELETE CASCADE,
    "documentType" VARCHAR(255) NOT NULL,
    "fileName" VARCHAR(255) NOT NULL,
    "fileSize" VARCHAR(255) NOT NULL,
    "filePath" VARCHAR(255),
    "uploadDate" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_documents_policy ON documents("policyId");
CREATE INDEX idx_documents_type ON documents("documentType");

-- =====================================================
-- INITIAL DATA / SEED DATA
-- =====================================================

-- Insert test users
INSERT INTO users (name, email, password, "createdAt", "updatedAt") VALUES
('Test User', 'test@example.com', '$2a$10$YIqYqhqeqhqeqhqeqhqeqeqhqeqhqeqhqeqhqeqhqeqhqeqhqeqh', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Admin User', 'admin@example.com', '$2a$10$admin10admin10admin10admin10admin10admin10admin10admin1a', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insert sample miscmaster data (optional - uncomment to add)
-- INSERT INTO miscmasters (type, name, "createdAt", "updatedAt") VALUES
-- ('Company', 'HDFC ERGO', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
-- ('Company', 'ICICI Lombard', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
-- ('Company', 'Bajaj Allianz', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
-- ('Insurance Type', 'Motor Insurance', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
-- ('Insurance Type', 'Health Insurance', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
-- ('Policy Type', 'New', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
-- ('Policy Type', 'Renewal', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- =====================================================
-- CREATE SEQUENCES
-- =====================================================

-- Reset sequences to ensure future inserts work correctly
SELECT setval('users_id_seq', COALESCE((SELECT MAX(id) FROM users), 1) + 1);
SELECT setval('customers_id_seq', COALESCE((SELECT MAX(id) FROM customers), 1) + 1);
SELECT setval('references_id_seq', COALESCE((SELECT MAX(id) FROM references), 1) + 1);
SELECT setval('miscmasters_id_seq', COALESCE((SELECT MAX(id) FROM miscmasters), 1) + 1);
SELECT setval('policies_id_seq', COALESCE((SELECT MAX(id) FROM policies), 1) + 1);
SELECT setval('documents_id_seq', COALESCE((SELECT MAX(id) FROM documents), 1) + 1);

-- =====================================================
-- DATABASE SETUP COMPLETE
-- =====================================================

-- Optional: Grant permissions to a specific user
-- ALTER ROLE postgres WITH PASSWORD 'your_password';
-- GRANT ALL PRIVILEGES ON DATABASE shree_ram_db TO postgres;
