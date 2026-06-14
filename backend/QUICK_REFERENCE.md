# Quick Reference - Database Scripts

## Files Created

All database scripts are located in: `backend/`

### 1. **database-dump.sql** (Primary Script - RECOMMENDED)
- **Purpose:** Complete database setup with schema + initial test data
- **Use Case:** Fresh installation on a new computer
- **Size:** ~5 KB
- **Contains:**
  - Database creation
  - All 6 tables with proper constraints
  - Indexes for performance
  - Foreign key relationships
  - 2 test users (test@example.com, admin@example.com)
  - Optional sample data (commented out)

**How to Execute:**
```powershell
psql -U postgres -f database-dump.sql
```

---

### 2. **database-schema-only.sql** (Alternative)
- **Purpose:** Database schema without any data
- **Use Case:** When you have an existing backup to restore
- **Size:** ~3 KB
- **Contains:**
  - Database creation
  - All 6 tables with constraints
  - Indexes
  - Foreign key relationships
  - NO DATA

**How to Execute:**
```powershell
psql -U postgres -f database-schema-only.sql
```

---

### 3. **setup-database.bat** (Windows Batch Helper)
- **Purpose:** Interactive menu-driven setup script
- **OS:** Windows only
- **How to Execute:**
  - Double-click the file, or
  - Run in Command Prompt: `setup-database.bat`
- **Features:**
  - Checks if PostgreSQL is installed
  - Menu to choose which script to run
  - User-friendly prompts
  - Error handling

---

### 4. **setup-database.ps1** (PowerShell Helper)
- **Purpose:** Interactive setup script with colored output
- **OS:** Windows (PowerShell 5.0+)
- **How to Execute:**
```powershell
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope CurrentUser
.\setup-database.ps1
```
- **Features:**
  - Same as .bat version
  - Better error handling
  - Colored console output
  - View integrated guide

---

### 5. **DATABASE_MIGRATION_GUIDE.md** (Documentation)
- **Purpose:** Comprehensive setup instructions
- **Contains:**
  - Step-by-step execution guides (3 methods)
  - Troubleshooting section
  - Verification checklist
  - Production deployment tips
  - Command reference

---

## Database Structure

The scripts create these tables:

| Table | Columns | Purpose |
|-------|---------|---------|
| `users` | 5 | System users for login |
| `customers` | 8 | Customer information |
| `references` | 8 | Reference contacts |
| `miscmasters` | 4 | Master data (companies, types, etc.) |
| `policies` | 32 | Insurance policy details |
| `documents` | 8 | Policy documents (links to policies) |

**Relationships:**
- `documents.policyId` → `policies.id` (One-to-Many with CASCADE DELETE)

---

## Quick Start (3 Steps)

### Step 1: Open Terminal
```powershell
# Windows PowerShell or Command Prompt
cd "d:\Allure\Shree Ram Associate\shree-ram-associate\backend"
```

### Step 2: Execute Script
**Option A - Interactive Menu (Recommended):**
```powershell
.\setup-database.ps1
# Then follow the menu
```

**Option B - Direct Command:**
```powershell
psql -U postgres -f database-dump.sql
```

### Step 3: Verify
```powershell
psql -U postgres -d shree_ram_db -c "\dt"
```

Should show all 6 tables ✓

---

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| "psql not found" | Add PostgreSQL bin to PATH or use full path |
| "password authentication failed" | Use `-W` flag: `psql -U postgres -W -f database-dump.sql` |
| "database already exists" | Uncomment `DROP DATABASE IF EXISTS` in SQL file |
| "port 5432 in use" | Change port: `psql -U postgres -h localhost -p 5433 -f script.sql` |
| "connection refused" | Ensure PostgreSQL service is running |

---

## Test Data

If using `database-dump.sql`, you get these test users:

```
Email: test@example.com
Password: password123

Email: admin@example.com
Password: admin123
```

**Note:** These are hashed in the database. Use these credentials in the login form.

---

## Next Steps After Setup

1. **Configure Backend .env:**
   ```
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=shree_ram_db
   DB_USER=postgres
   DB_PASSWORD=your_password
   ```

2. **Install Dependencies:**
   ```powershell
   cd backend
   npm install
   ```

3. **Start Backend Server:**
   ```powershell
   npm run dev
   ```

4. **Start Frontend:**
   ```powershell
   cd ..
   npm install
   ng serve
   ```

---

## Backup & Recovery

### Create Backup
```powershell
pg_dump -U postgres shree_ram_db > backup.sql
```

### Restore from Backup
```powershell
psql -U postgres -f backup.sql
```

---

## Support & Documentation

- **Full Guide:** See `DATABASE_MIGRATION_GUIDE.md`
- **PostgreSQL Setup:** See `POSTGRESQL_SETUP.md`
- **Backend Readme:** See `backend/README.md`

---

## Script Comparison

| Feature | database-dump.sql | database-schema-only.sql |
|---------|-------------------|--------------------------|
| Database Creation | ✓ | ✓ |
| Table Creation | ✓ | ✓ |
| Indexes | ✓ | ✓ |
| Foreign Keys | ✓ | ✓ |
| Test Data | ✓ | ✗ |
| Sample MiscMaster | ✓ (commented) | ✗ |
| Initial Users | ✓ | ✗ |
| **Use For** | **Fresh Setup** | **Restore Backup** |

---

## Execution Methods Comparison

| Method | Pros | Cons | Best For |
|--------|------|------|----------|
| `.ps1` Script | User-friendly, colored output | PowerShell required | Beginners |
| `.bat` Script | Simple, no setup needed | Limited features | Quick setup |
| Direct `psql` | Full control, scriptable | More technical | Automation |
| pgAdmin GUI | Visual, easy to understand | Manual steps | GUI preference |

---

**Last Updated:** 2024
**PostgreSQL Version:** 12+
**Shree Ram Associate Insurance Management System**
