# =====================================================
# Quick Setup Script for Shree Ram Associate Database
# PowerShell Script
# =====================================================

Write-Host ""
Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host "Shree Ram Associate - Database Setup Script" -ForegroundColor Cyan
Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host ""

# Check if psql is installed
$psqlExists = $null -ne (Get-Command psql -ErrorAction SilentlyContinue)

if (-not $psqlExists) {
    Write-Host "ERROR: PostgreSQL command-line tools (psql) not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please ensure PostgreSQL is installed and psql is in your PATH." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "To add PostgreSQL to PATH:" -ForegroundColor Yellow
    Write-Host "1. Find your PostgreSQL installation (usually C:\Program Files\PostgreSQL\XX\bin)" -ForegroundColor Yellow
    Write-Host "2. Add it to your Windows PATH environment variable" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "✓ PostgreSQL tools found" -ForegroundColor Green
Write-Host ""

# Get script directory
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Write-Host "Database Scripts Location: $scriptDir" -ForegroundColor Cyan
Write-Host ""

# Display menu
Write-Host "Please select which script to execute:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Complete Setup (with test data) - Recommended for new installations"
Write-Host "2. Schema Only (no data) - Use if restoring from existing backup"
Write-Host "3. View Setup Guide"
Write-Host "4. Exit"
Write-Host ""

$choice = Read-Host "Enter your choice (1-4)"

switch ($choice) {
    "1" { Invoke-ExecuteComplete }
    "2" { Invoke-ExecuteSchemaOnly }
    "3" { Invoke-ViewGuide }
    "4" { Write-Host "Exiting..."; exit 0 }
    default {
        Write-Host "Invalid choice. Please try again." -ForegroundColor Red
        Start-Sleep -Seconds 2
        & $MyInvocation.MyCommand.Path
        exit 0
    }
}

function Invoke-ExecuteComplete {
    Write-Host ""
    Write-Host "=====================================================" -ForegroundColor Cyan
    Write-Host "Executing: database-dump.sql (Complete Setup)" -ForegroundColor Cyan
    Write-Host "=====================================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "This will create the database with all tables and test data." -ForegroundColor Yellow
    Write-Host ""

    $username = Read-Host "PostgreSQL username (default: postgres)"
    if ([string]::IsNullOrWhiteSpace($username)) { $username = "postgres" }

    Write-Host ""
    Write-Host "Connecting to PostgreSQL as user: $username" -ForegroundColor Yellow
    Write-Host ""

    Set-Location -Path $scriptDir

    # Execute psql command
    $sqlFile = Join-Path $scriptDir "database-dump.sql"
    
    if (-not (Test-Path $sqlFile)) {
        Write-Host "ERROR: database-dump.sql not found!" -ForegroundColor Red
        Write-Host "Expected location: $sqlFile" -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }

    # Execute with password prompt
    & psql -U $username -f $sqlFile

    if ($LASTEXITCODE -ne 0) {
        Write-Host ""
        Write-Host "ERROR: Script execution failed!" -ForegroundColor Red
        Write-Host ""
        Write-Host "Possible solutions:" -ForegroundColor Yellow
        Write-Host "- Check if PostgreSQL service is running" -ForegroundColor Yellow
        Write-Host "- Verify your username and password" -ForegroundColor Yellow
        Write-Host "- Check database-dump.sql file exists" -ForegroundColor Yellow
        Write-Host ""
        Read-Host "Press Enter to exit"
        exit 1
    } else {
        Write-Host ""
        Write-Host "✓ Database setup completed successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Next steps:" -ForegroundColor Cyan
        Write-Host "1. Update .env file in backend folder with database credentials" -ForegroundColor Cyan
        Write-Host "2. Run: npm install (in backend folder)" -ForegroundColor Cyan
        Write-Host "3. Run: npm run dev (to start backend server)" -ForegroundColor Cyan
        Write-Host ""
        Read-Host "Press Enter to exit"
        exit 0
    }
}

function Invoke-ExecuteSchemaOnly {
    Write-Host ""
    Write-Host "=====================================================" -ForegroundColor Cyan
    Write-Host "Executing: database-schema-only.sql (Schema Only)" -ForegroundColor Cyan
    Write-Host "=====================================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "This will create only the database schema without any data." -ForegroundColor Yellow
    Write-Host ""

    $username = Read-Host "PostgreSQL username (default: postgres)"
    if ([string]::IsNullOrWhiteSpace($username)) { $username = "postgres" }

    Write-Host ""
    Write-Host "Connecting to PostgreSQL as user: $username" -ForegroundColor Yellow
    Write-Host ""

    Set-Location -Path $scriptDir

    # Execute psql command
    $sqlFile = Join-Path $scriptDir "database-schema-only.sql"
    
    if (-not (Test-Path $sqlFile)) {
        Write-Host "ERROR: database-schema-only.sql not found!" -ForegroundColor Red
        Write-Host "Expected location: $sqlFile" -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }

    & psql -U $username -f $sqlFile

    if ($LASTEXITCODE -ne 0) {
        Write-Host ""
        Write-Host "ERROR: Script execution failed!" -ForegroundColor Red
        Write-Host ""
        Read-Host "Press Enter to exit"
        exit 1
    } else {
        Write-Host ""
        Write-Host "✓ Database schema created successfully!" -ForegroundColor Green
        Write-Host "You can now restore data from your backup file." -ForegroundColor Yellow
        Write-Host ""
        Read-Host "Press Enter to exit"
        exit 0
    }
}

function Invoke-ViewGuide {
    Write-Host ""
    Write-Host "=====================================================" -ForegroundColor Cyan
    Write-Host "Database Migration Guide" -ForegroundColor Cyan
    Write-Host "=====================================================" -ForegroundColor Cyan
    Write-Host ""

    $guideFile = Join-Path $scriptDir "DATABASE_MIGRATION_GUIDE.md"
    
    if (Test-Path $guideFile) {
        Get-Content $guideFile | Out-Host
    } else {
        Write-Host "Guide file not found at: $guideFile" -ForegroundColor Red
    }
    
    Read-Host "Press Enter to return to menu"
    & $MyInvocation.MyCommand.Path
}
