# Shree Ram Associate - Backend Setup

## Overview
Express.js backend server with PostgreSQL database for the Shree Ram Associate Angular application.

## Prerequisites
- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

## Quick Setup

### 1. Install PostgreSQL
See [POSTGRESQL_SETUP.md](./POSTGRESQL_SETUP.md) for detailed instructions.

### 2. Create Database
```sql
CREATE DATABASE shree_ram_db;
```

### 3. Configure Environment Variables
Create `.env` file with your PostgreSQL credentials:
```
PORT=3000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_NAME=shree_ram_db
DB_USER=postgres
DB_PASSWORD=your_password
```

### 4. Install Dependencies
```bash
cd backend
npm install
```

### 5. Seed the Database
```bash
npm run seed
```

This creates the `users` table and adds initial test data.

## Running the Server

### Development Mode (with auto-reload):
```bash
npm run dev
```

### Production Mode:
```bash
npm start
```

The server will run on `http://localhost:3000`

## Database Schema

### Users Table
| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER | Primary Key, Auto-increment |
| name | VARCHAR(255) | User's full name |
| email | VARCHAR(255) | Unique email address |
| password | VARCHAR(255) | Hashed password (bcryptjs) |
| createdAt | TIMESTAMP | Account creation date |
| updatedAt | TIMESTAMP | Last update date |

## API Endpoints

### 1. Login
- **URL:** `/api/login`
- **Method:** POST
- **Request Body:**
  ```json
  {
    "email": "test@example.com",
    "password": "password123"
  }
  ```
- **Success Response (200):**
  ```json
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
- **Error Response (401):**
  ```json
  {
    "success": false,
    "message": "Invalid email or password"
  }
  ```

### 2. Health Check
- **URL:** `/api/health`
- **Method:** GET
- **Response:**
  ```json
  {
    "message": "Server is running"
  }
  ```

## Test Credentials

After running `npm run seed`:

| Email | Password |
|-------|----------|
| test@example.com | password123 |
| admin@example.com | admin123 |

## Project Structure
```
backend/
├── config/
│   └── database.js          # Sequelize configuration
├── models/
│   └── User.js              # User model definition
├── server.js                # Main Express server
├── seed.js                  # Database seeding script
├── package.json             # Dependencies
├── .env                     # Environment variables
└── README.md                # This file
```

## Security Features

- **Password Hashing:** Uses bcryptjs for secure password storage
- **CORS:** Configured to accept requests from frontend
- **Environment Variables:** Sensitive data stored in .env
- **Input Validation:** Email and required field validation

## Troubleshooting

### PostgreSQL Connection Error
- Ensure PostgreSQL service is running
- Check DB credentials in `.env`
- Verify database exists

### Seeding Failed
- Drop and recreate the database
- Run `npm run seed` again

### Port Already in Use
- Change PORT in `.env`
- Or kill the process: `netstat -ano | findstr :3000`

## Next Steps

1. Add user registration endpoint
2. Implement JWT authentication
3. Add password reset functionality
4. Create additional database tables as needed
5. Deploy to production environment

For more details on PostgreSQL setup, see [POSTGRESQL_SETUP.md](./POSTGRESQL_SETUP.md)

