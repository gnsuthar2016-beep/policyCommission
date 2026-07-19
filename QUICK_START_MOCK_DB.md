# Quick Start Guide - Mock Database Integration

## ✅ What's Ready

Your application is now fully functional with an integrated **Mock PostgreSQL** (JSON-based storage):

### Current Setup
- **Frontend**: http://localhost:4200 ✅
- **Backend API**: http://localhost:3000 ✅
- **Database**: Mock Database (JSON file at `backend/mock-db.json`) ✅
- **Login**: Working with test credentials ✅

### Test the System

#### 1. Check Database Status
```
GET http://localhost:3000/api/database-status
```

**Response:**
```json
{
  "connected": false,
  "database": "Mock (JSON)",
  "message": "Using mock database (JSON file)"
}
```

#### 2. Login with Test Credentials
```
Email: test@example.com
Password: password123
```

Or:
```
Email: admin@example.com
Password: admin123
```

Navigate to: http://localhost:4200

#### 3. View Mock Database
```
File: backend/mock-db.json
```

All data is stored here in JSON format and persists between restarts.

---

## 🔄 How It Works

```
┌─────────────────────────────────┐
│   Angular Frontend (4200)       │
└────────────────┬────────────────┘
                 │
                 ↓
┌─────────────────────────────────┐
│  Express Backend (3000)         │
│  ✓ Auto-detects database        │
│  ✓ Falls back to mock if needed │
└────────────────┬────────────────┘
                 │
        ┌────────┴────────┐
        ↓                 ↓
   PostgreSQL      Mock Database
  (when ready)      (JSON file)
  
Backend automatically chooses based on what's available!
```

---

## 📊 Mock Database Features

### Persistent Storage
- Data stored in `backend/mock-db.json`
- Survives application restarts
- Can be edited manually if needed

### Supported Operations
- **Users**: Create, find, authenticate
- **Policies**: Create, read, update, delete
- **Customers**: Store and manage customer information
- **Documents**: Handle document references
- **References**: Track brokers and references

### Data Structure
```json
{
  "users": [...],
  "policies": [...],
  "customers": [...],
  "documents": [...],
  "references": [...]
}
```

---

## 🚀 Next Steps: Installing Real PostgreSQL (Optional)

When you're ready to use a production database:

### Windows Installation

1. **Download PostgreSQL**
   - Go to https://www.postgresql.org/download/windows/
   - Download PostgreSQL 14 or higher
   - Run the installer

2. **During Installation**
   - Accept defaults
   - Set password for `postgres` user (remember this!)
   - Port: 5432

3. **Create Database**
   - Open pgAdmin (included with PostgreSQL)
   - Right-click "Databases" → Create → Database
   - Name: `shree_ram_db`

4. **Update `.env`**
   ```
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=shree_ram_db
   DB_USER=postgres
   DB_PASSWORD=<your-password>
   ```

5. **Restart Backend**
   ```
   cd backend
   npm run dev
   ```
   
   Look for: `✓ Database connection successful`

---

## 🧪 Test Data

Create test data by:

1. Login to dashboard
2. Use the UI to create policies, customers, etc.
3. Data automatically saves to `mock-db.json`

Or manually edit `backend/mock-db.json`:

```json
{
  "policies": [
    {
      "id": 1,
      "policyNumber": "POL-2026-001",
      "customerName": "John Doe",
      "premium": 5000,
      "referenceName": "Broker ABC",
      "createdAt": "2026-07-05T10:00:00Z"
    }
  ]
}
```

---

## 🔍 Troubleshooting

**Question: Where is my data stored?**
- Answer: `backend/mock-db.json` in the project folder

**Question: Can I switch between Mock and PostgreSQL?**
- Answer: Yes! Just update `.env` and restart. Backend auto-detects.

**Question: How do I reset the mock database?**
- Answer: Delete `backend/mock-db.json` and restart the app

**Question: Will my data persist?**
- Answer: Yes! Mock database saves automatically.

---

## 📝 File Locations

```
policyCommission/
├── backend/
│   ├── mock-db.json              ← Your data storage
│   ├── mockDatabase.js           ← Mock database logic
│   ├── server.js                 ← Main backend server
│   └── .env                      ← Database configuration
├── src/
│   └── app/
│       └── services/
│           └── policy.service.ts ← API calls
└── package.json
```

---

## ✨ Summary

Your application is now ready to:
- ✅ Accept user logins
- ✅ Store data persistently
- ✅ Manage policies and customers
- ✅ Handle documents
- ⏳ Scale to real PostgreSQL when needed

**No additional setup required!** Start using the app now.

When you're ready for a real database, just install PostgreSQL and update the `.env` file. Everything else will work the same way.
