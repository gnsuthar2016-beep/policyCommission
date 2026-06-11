@echo off
REM =====================================================
REM Quick Setup Script for Shree Ram Associate Database
REM Windows Batch Script
REM =====================================================

setlocal enabledelayedexpansion

echo.
echo =====================================================
echo Shree Ram Associate - Database Setup Script
echo =====================================================
echo.

REM Check if psql is installed
where psql >nul 2>nul
if errorlevel 1 (
    echo ERROR: PostgreSQL command-line tools (psql) not found!
    echo.
    echo Please ensure PostgreSQL is installed and psql is in your PATH.
    echo.
    echo To add PostgreSQL to PATH:
    echo 1. Find your PostgreSQL installation (usually C:\Program Files\PostgreSQL\XX\bin)
    echo 2. Add it to your Windows PATH environment variable
    echo.
    pause
    exit /b 1
)

echo ✓ PostgreSQL tools found
echo.

REM Get current directory
set SCRIPT_DIR=%~dp0

echo Database Scripts Location: %SCRIPT_DIR%
echo.

REM Display menu
echo Please select which script to execute:
echo.
echo 1. Complete Setup (with test data) - Recommended for new installations
echo 2. Schema Only (no data) - Use if restoring from existing backup
echo 3. Schema Only (Simplified version)
echo 4. Exit
echo.

set /p CHOICE="Enter your choice (1-4): "

if "%CHOICE%"=="1" (
    call :execute_complete
) else if "%CHOICE%"=="2" (
    call :execute_schema_only
) else if "%CHOICE%"=="3" (
    call :execute_schema_simplified
) else if "%CHOICE%"=="4" (
    echo Exiting...
    exit /b 0
) else (
    echo Invalid choice. Please try again.
    pause
    goto start
)

exit /b 0

:execute_complete
echo.
echo =====================================================
echo Executing: database-dump.sql (Complete Setup)
echo =====================================================
echo.
echo This will create the database with all tables and test data.
echo.

set /p USERNAME="PostgreSQL username (default: postgres): "
if "!USERNAME!"=="" set USERNAME=postgres

echo.
echo Connecting to PostgreSQL as user: !USERNAME!
echo.

cd /d "%SCRIPT_DIR%"
psql -U !USERNAME! -f database-dump.sql

if errorlevel 1 (
    echo.
    echo ERROR: Script execution failed!
    echo.
    echo Possible solutions:
    echo - Check if PostgreSQL service is running
    echo - Verify your username and password
    echo - Check database-dump.sql file exists
    echo.
    pause
    exit /b 1
) else (
    echo.
    echo ✓ Database setup completed successfully!
    echo.
    echo Next steps:
    echo 1. Update .env file in backend folder with database credentials
    echo 2. Run: npm install (in backend folder)
    echo 3. Run: npm run dev (to start backend server)
    echo.
    pause
    exit /b 0
)

:execute_schema_only
echo.
echo =====================================================
echo Executing: database-schema-only.sql (Schema Only)
echo =====================================================
echo.
echo This will create only the database schema without any data.
echo.

set /p USERNAME="PostgreSQL username (default: postgres): "
if "!USERNAME!"=="" set USERNAME=postgres

echo.
echo Connecting to PostgreSQL as user: !USERNAME!
echo.

cd /d "%SCRIPT_DIR%"
psql -U !USERNAME! -f database-schema-only.sql

if errorlevel 1 (
    echo.
    echo ERROR: Script execution failed!
    echo.
    pause
    exit /b 1
) else (
    echo.
    echo ✓ Database schema created successfully!
    echo You can now restore data from your backup file.
    echo.
    pause
    exit /b 0
)

:execute_schema_simplified
echo.
echo =====================================================
echo Alternative: Manual Execution
echo =====================================================
echo.
echo To execute manually, use this command:
echo.
echo psql -U postgres -f "%SCRIPT_DIR%database-dump.sql"
echo.
echo Or with password prompt:
echo.
echo psql -U postgres -W -f "%SCRIPT_DIR%database-dump.sql"
echo.
echo Then enter your PostgreSQL password when prompted.
echo.
pause
exit /b 0

:eof
endlocal
