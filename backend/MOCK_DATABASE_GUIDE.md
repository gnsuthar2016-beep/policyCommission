# Mock Database & PostgreSQL Integration Guide

## Current Status

The backend is now configured to work with:
- **Mock Database** (Active): JSON file-based storage at `backend/mock-db.json`
- **PostgreSQL**: Ready to integrate when installed

## Available Test Credentials

```
Email: test@example.com
Password: password123

Email: admin@example.com
Password: admin123
```

## API Endpoints

### Authentication
```
POST /api/login
{
  "email": "test@example.com",
  "password": "password123"
}

Response:
{
  "success": true,
  "message": "Login successful",
  "data": {
    "id": 1,
    "email": "test@example.com",
    "name": "Test User"
  }
}
```

### Database Status
```
GET /api/database-status

Response:
{
  "connected": false,
  "database": "Mock (JSON)",
  "message": "Using mock database (JSON file)"
}
```

## Setting Up PostgreSQL (When Ready)

### Option 1: Local PostgreSQL Installation

1. **Download PostgreSQL 14+**
   - Windows: https://www.postgresql.org/download/windows/
   - Choose: PostgreSQL 14 or higher
   - Installation Directory: `C:\Program Files\PostgreSQL\14`

2. **During Installation**
   - Set password for `postgres` user
   - Port: 5432 (default)
   - Remember the password

3. **Create Database**
   ```sql
   CREATE DATABASE shree_ram_db;
   CREATE USER shree_ram WITH PASSWORD 'your_password';
   ALTER ROLE shree_ram WITH SUPERUSER;
   ```

4. **Update `.env` file**
   ```
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=shree_ram_db
   DB_USER=shree_ram
   DB_PASSWORD=your_password
   ```

5. **Restart Backend**
   - Stop current backend: Press `Ctrl+C` in backend terminal
   - Run: `npm run dev`
   - You'll see: `✓ Database connection successful`

### Option 2: Docker PostgreSQL (If Docker is Available Later)

```bash
# Pull PostgreSQL image
docker pull postgres:15

# Run PostgreSQL container
docker run --name policy-db \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=shree_ram_db \
  -p 5432:5432 \
  -d postgres:15

# Verify
docker ps
```

Then update `.env` with default credentials.

## Mock Database Features

The mock database (`backend/mockDatabase.js`) provides:

- **User Management**: Create, find, authenticate users
- **Policy Management**: CRUD operations on policies
- **Customer Management**: Store and retrieve customer data
- **Document Management**: Handle document uploads
- **Reference Management**: Track brokers and references
- **Persistent Storage**: Data saved to `backend/mock-db.json`

### Test Mock Database

```bash
# View mock database
cat backend/mock-db.json

# Add test data (via API calls)
# Login to generate user sessions
# Create policies through the dashboard
# All data persists in mock-db.json
```

## Switching Between Databases

The backend **automatically detects** which database to use:

1. **PostgreSQL Available**: Uses real Sequelize ORM + PostgreSQL
2. **PostgreSQL Unavailable**: Falls back to mock database (JSON)

No code changes needed! Just configure `.env` and restart.

## Data Flow

```
┌─────────────────────────────────────────────────┐
│           Angular Frontend (4200)               │
└────────────────────┬────────────────────────────┘
                     │
                     ↓
        ┌────────────────────────┐
        │  Express API (3000)    │
        │   Auto-Detection       │
        └────────────────────────┘
                 ↙              ↖
        ┌──────────────┐    ┌──────────────┐
        │ PostgreSQL   │    │ Mock DB      │
        │ (Real DB)    │    │ (JSON File)  │
        └──────────────┘    └──────────────┘
```

## Next Steps

1. ✅ Login is working (using mock database)
2. ✅ Dashboard accessible
3. ⏳ **Optional**: Install PostgreSQL for persistent production data
4. 📝 Add more API endpoints as needed
5. 🧪 Test with real data once PostgreSQL is ready

## Troubleshooting

**Login not working?**
```
GET /api/database-status
# Check which database is active
```

**Lost data between restarts?**
- Mock database saves to `backend/mock-db.json`
- Check file exists: `backend/mock-db.json`
- If missing, run login again to reinitialize

**Want to switch to PostgreSQL?**
1. Install PostgreSQL
2. Update `.env` with credentials
3. Restart backend: `npm run dev`
4. Check logs: should show "Database connection successful"

## Database Schema

The application supports:

```
users
├── id (integer)
├── email (string, unique)
├── name (string)
├── password (string, hashed)
└── timestamps

policies
├── id (integer)
├── policyNumber (string)
├── customerName (string)
├── referenceName (string)
├── premium (decimal)
└── timestamps

customers
├── id (integer)
├── name (string)
├── email (string)
├── phone (string)
└── timestamps

documents
├── id (integer)
├── policyId (integer)
├── documentUrl (string)
└── timestamps
```
