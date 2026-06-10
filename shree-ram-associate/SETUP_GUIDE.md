# Shree Ram Associate - Full Setup Guide

This project consists of two parts:
1. **Frontend:** Angular application
2. **Backend:** Express.js API server

## Quick Start

### Step 1: Install Backend Dependencies
```bash
cd backend
npm install
```

### Step 2: Install Frontend Dependencies (if not already done)
```bash
npm install
```

### Step 3: Run Backend Server
From the `backend` folder:
```bash
npm run dev
```
Server will run on `http://localhost:3000`

### Step 4: Run Frontend (in a new terminal)
From the root folder:
```bash
ng serve
```
or
```bash
npm start
```
Application will run on `http://localhost:4200`

## Architecture

### Backend (Express.js)
- Located in `/backend` folder
- Runs on port 3000
- Provides login API endpoint
- Uses CORS for cross-origin requests

### Frontend (Angular)
- Located in root folder
- Runs on port 4200
- Consumes backend API through AuthService
- Authentication service: `src/app/services/auth.service.ts`

## Integration Details

The login flow works as follows:
1. User enters email and password in the login form
2. Angular AuthService sends POST request to `http://localhost:3000/api/login`
3. Backend validates credentials and returns response
4. On success, user data is stored in localStorage
5. User is redirected to dashboard

## Test Credentials

Use these credentials to test the login:
- **Email:** test@example.com
- **Password:** password123

Or:
- **Email:** admin@example.com
- **Password:** admin123

## File Structure

```
shree-ram-associate/
├── backend/                  # Express.js backend
│   ├── server.js            # Main server file
│   ├── package.json         # Backend dependencies
│   ├── .env                 # Environment variables
│   └── README.md            # Backend documentation
├── src/
│   ├── app/
│   │   ├── services/
│   │   │   └── auth.service.ts    # Authentication service
│   │   ├── login/
│   │   │   ├── login.component.ts
│   │   │   ├── login.component.html
│   │   │   └── login.component.css
│   │   └── ...
│   └── ...
├── angular.json             # Angular configuration
├── package.json             # Frontend dependencies
└── README.md                # This file
```

## Troubleshooting

### Backend won't start
- Ensure Node.js is installed: `node --version`
- Check if port 3000 is available
- Try: `npm run dev` from the backend folder

### Frontend can't connect to backend
- Ensure backend is running on port 3000
- Check browser console for CORS errors
- Verify API URL in `src/app/services/auth.service.ts`

### Login fails
- Check test credentials above
- Verify network tab in browser for API response
- Check backend console for errors

## Next Steps

1. Implement proper authentication (JWT tokens, secure password hashing)
2. Add database connection (MongoDB, PostgreSQL, etc.)
3. Add registration API endpoint
4. Add password reset functionality
5. Add user profile management
6. Deploy to production environment

