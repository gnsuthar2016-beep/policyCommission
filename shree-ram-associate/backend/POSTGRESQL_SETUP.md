# PostgreSQL Setup Guide for Windows

## Step 1: Install PostgreSQL

### Option A: Using Installer (Recommended)
1. Download PostgreSQL from: https://www.postgresql.org/download/windows/
2. Run the installer
3. Follow the setup wizard:
   - Choose installation directory
   - Select components (PostgreSQL Server, pgAdmin 4, Command Line Tools)
   - Set password for `postgres` user (remember this!)
   - Choose port (default: 5432)
   - Select locale
4. Complete the installation

### Option B: Using Chocolatey
```powershell
choco install postgresql
```

## Step 2: Create Database

After PostgreSQL is installed, open **pgAdmin 4** or use command line:

### Using pgAdmin 4 (GUI - Easier):
1. Open pgAdmin 4
2. Right-click on "Databases" → Create → Database
3. Name: `shree_ram_db`
4. Owner: `postgres`
5. Click "Create"

### Using Command Line:
```powershell
psql -U postgres
```
Then run:
```sql
CREATE DATABASE shree_ram_db;
```

## Step 3: Configure Backend

1. Update `.env` file in the backend folder:
```
PORT=3000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_NAME=shree_ram_db
DB_USER=postgres
DB_PASSWORD=your_postgres_password
```

2. Replace `your_postgres_password` with the password you set during PostgreSQL installation.

## Step 4: Install Dependencies

```powershell
cd backend
npm install
```

## Step 5: Seed the Database

Run the seed script to create tables and add initial users:

```powershell
npm run seed
```

You should see:
```
✓ Database connection successful
✓ Models synced successfully
✓ Database seeded successfully!

Test Credentials:
Email: test@example.com | Password: password123
Email: admin@example.com | Password: admin123
```

## Step 6: Start the Server

```powershell
npm run dev
```

The server will connect to PostgreSQL and run on `http://localhost:3000`

## Database Structure

### Users Table
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Troubleshooting

### Connection Error: "connect ECONNREFUSED 127.0.0.1:5432"
- PostgreSQL is not running
- Solution: Start PostgreSQL service from Services or command line

### Authentication Failed
- Wrong password in `.env`
- Solution: Double-check DB_PASSWORD in .env file

### Database Does Not Exist
- Solution: Run `npm run seed` to create and populate the database

### Port Already in Use
- Solution: Change PORT in `.env` or kill the process using port 3000

## Verifying the Setup

Test the database connection:
```powershell
psql -U postgres -d shree_ram_db -h localhost
```

List all tables:
```sql
\dt
```

View users data:
```sql
SELECT * FROM users;
```

## API Endpoints

Now your Express API uses PostgreSQL:

- **Login:** `POST http://localhost:3000/api/login`
- **Health Check:** `GET http://localhost:3000/api/health`

Passwords are securely hashed using bcryptjs before storing in the database.

