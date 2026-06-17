-- =====================================================
-- PostgreSQL Database Script - SIMPLIFIED VERSION
-- For Shree Ram Associate Insurance Database
-- =====================================================
-- This version creates the database and tables only
-- without the data, allowing you to use existing backups

-- Create Database
CREATE DATABASE shree_ram_db
    WITH ENCODING = 'UTF8';

-- Connect to the database (in psql, use: \c shree_ram_db)

-- Table: users
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

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

-- Table: miscmasters
CREATE TABLE miscmasters (
    id SERIAL PRIMARY KEY,
    type VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL UNIQUE,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

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
    "premiumSource" VARCHAR(50) DEFAULT 'Net Premium',
    "refBrokeragePercent" NUMERIC(5, 2),
    "refBrokerageAmount" NUMERIC(10, 2),
    "totalIDV" NUMERIC(10, 2) NOT NULL,
    make VARCHAR(255) NOT NULL,
    model VARCHAR(255) NOT NULL,
    "registrationNumber" VARCHAR(255) NOT NULL,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

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

-- Reset sequences
SELECT setval('users_id_seq', 1);
SELECT setval('customers_id_seq', 1);
SELECT setval('references_id_seq', 1);
SELECT setval('miscmasters_id_seq', 1);
SELECT setval('policies_id_seq', 1);
SELECT setval('documents_id_seq', 1);
