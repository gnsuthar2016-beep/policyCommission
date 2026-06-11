# Database Migration & Setup Guide

This guide explains how to execute the PostgreSQL database scripts on another computer to recreate the complete Shree Ram Associate insurance database with all tables.

## Prerequisites

Before executing these scripts, ensure you have:

1. **PostgreSQL Installed** (version 12 or higher)
   - Download from: https://www.postgresql.org/download/
   - Installation guide available in POSTGRESQL_SETUP.md

2. **PostgreSQL Command Line Tools** (psql)
   - Included with PostgreSQL installation
   - Should be accessible from command line

## Available Scripts

Two SQL scripts are provided in the `backend` folder:

### 1. `database-dump.sql` (RECOMMENDED)
- Creates database with complete schema
- Includes initial test users (seeds the data)
- Includes sample miscmaster entries (commented out - uncomment if needed)
- **Use this** for a fresh complete setup

### 2. `database-schema-only.sql`
- Creates database with schema only
- No initial data
- **Use this** if you want to restore data from an existing backup

## How to Execute the Scripts

### Option A: Using Command Line (psql)

#### Step 1: Open Command Prompt/PowerShell
On Windows:
- Press `Win + R`
- Type `cmd` or `powershell`
- Press Enter

#### Step 2: Navigate to the database scripts
```powershell
cd "d:\Allure\Shree Ram Associate\shree-ram-associate\backend"
```

#### Step 3: Execute the script
```powershell
psql -U postgres -f database-dump.sql
```

When prompted, enter your PostgreSQL password (the one you set during installation).

**Alternative syntax:**
```powershell
psql -U postgres --password -f database-dump.sql
```

**Expected Output:**
```
CREATE DATABASE
You are now connected to database "shree_ram_db" as user "postgres".
CREATE TABLE
CREATE INDEX
... (more CREATE INDEX statements)
INSERT 0 2
SELECT 1
SELECT 1
SELECT 1
SELECT 1
SELECT 1
SELECT 1
```

#### Step 4: Verify the database was created
```powershell
psql -U postgres -l
```

You should see `shree_ram_db` in the list of databases.

#### Step 5: Verify tables were created
```powershell
psql -U postgres -d shree_ram_db -c "\dt"
```

You should see all 6 tables:
- documents
- users
- customers
- references
- miscmasters
- policies

### Option B: Using pgAdmin 4 (GUI)

#### Step 1: Open pgAdmin 4
- Find pgAdmin 4 in Windows Start Menu
- Or navigate to: `http://localhost:5050`

#### Step 2: Connect to Server
- Expand "Servers" in left panel
- Right-click on your PostgreSQL server
- Select "Connect Server"
- Enter your password if prompted

#### Step 3: Execute SQL Script
1. Right-click on "Databases"
2. Select "Create" → "Database"
3. Name: `shree_ram_db`
4. Click "Create"
5. Then:
   - Click on your new database to select it
   - Go to "Tools" menu → "Query Tool"
   - Click "Open File" icon
   - Navigate to `database-dump.sql`
   - Click "Execute"

#### Step 4: Monitor Execution
- Green checkmark appears when successful
- Check the "Messages" tab for any errors

### Option C: Using Docker (Optional)

If you have Docker installed, you can quickly set up PostgreSQL:

```powershell
# Create and start PostgreSQL container
docker run --name shree-ram-postgres -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres:latest

# Execute script
docker exec -it shree-ram-postgres psql -U postgres -f /docker-entrypoint-initdb.d/database-dump.sql
```

## Troubleshooting

### Issue: "psql: command not found"
**Solution:**
- PostgreSQL command-line tools not in PATH
- Add PostgreSQL bin directory to PATH:
  - Usually: `C:\Program Files\PostgreSQL\15\bin`
- Or use full path: `"C:\Program Files\PostgreSQL\15\bin\psql.exe" -U postgres -f database-dump.sql`

### Issue: "FATAL: Ident authentication failed for user postgres"
**Solution:**
```powershell
psql -U postgres -h localhost -f database-dump.sql
```

### Issue: "password authentication failed"
**Solution:**
```powershell
psql -U postgres -h localhost -W -f database-dump.sql
```
Then enter your PostgreSQL password when prompted.

### Issue: "Database already exists"
**Solution:**
Edit the SQL script and uncomment this line at the top:
```sql
DROP DATABASE IF EXISTS shree_ram_db;
```

### Issue: "Port 5432 already in use"
**Solution:**
- PostgreSQL is running on different port
- Modify script to specify port:
```powershell
psql -U postgres -h localhost -p 5433 -f database-dump.sql
```

## Verification Checklist

After successful script execution:

- [ ] Database `shree_ram_db` exists
- [ ] All 6 tables created (users, customers, references, miscmasters, policies, documents)
- [ ] All indexes created
- [ ] Foreign keys established (documents → policies)
- [ ] Test users created (if using database-dump.sql):
  - Email: `test@example.com`
  - Email: `admin@example.com`

## Verify with Queries

Connect to the database and run these queries:

```sql
-- Check tables
\dt

-- Check users table
SELECT COUNT(*) FROM users;

-- List all test users
SELECT id, name, email FROM users;

-- Check policies table structure
\d policies

-- Count customers
SELECT COUNT(*) FROM customers;
```

## Next Steps

1. **Configure Backend Application:**
   - Update `.env` file in backend folder:
   ```
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=shree_ram_db
   DB_USER=postgres
   DB_PASSWORD=your_postgres_password
   ```

2. **Start Backend Server:**
   ```powershell
   cd backend
   npm install
   npm run dev
   ```

3. **Start Frontend Application:**
   ```powershell
   cd shree-ram-associate
   npm install
   ng serve
   ```

## Additional Commands

### Backup the database (after you've added data)
```powershell
pg_dump -U postgres shree_ram_db > backup.sql
```

### Restore from backup
```powershell
psql -U postgres -f backup.sql
```

### Delete database (if needed)
```sql
DROP DATABASE shree_ram_db;
```

### Connect directly to database
```powershell
psql -U postgres -d shree_ram_db
```

## For Production Deployment

When deploying to production:

1. **Create dedicated database user:**
   ```sql
   CREATE USER insurance_user WITH PASSWORD 'secure_password';
   GRANT ALL PRIVILEGES ON DATABASE shree_ram_db TO insurance_user;
   ```

2. **Update environment variables** with production credentials

3. **Enable SSL connections** for security

4. **Set up automated backups**:
   ```powershell
   # Windows Task Scheduler
   # Schedule: pg_dump -U postgres shree_ram_db > "C:\backups\shree_ram_db_$(Get-Date -Format yyyyMMdd_HHmmss).sql"
   ```

5. **Monitor database performance** and optimize indexes if needed

## Support

For issues or questions:
1. Check the POSTGRESQL_SETUP.md file
2. Verify PostgreSQL service is running
3. Check PostgreSQL error logs
4. Review table structures with `\d table_name` in psql

---

**Last Updated:** 2024
**Database Version:** PostgreSQL 12+
**Application:** Shree Ram Associate - Insurance Management System
