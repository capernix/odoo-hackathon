# Quick Setup Script for Windows (PowerShell)
# Run this to set up the scanner system in one command

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "QR Scanner System - Quick Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check Python installation
Write-Host "Checking Python installation..." -ForegroundColor Yellow
try {
    $pythonVersion = python --version 2>&1
    Write-Host "✓ Found: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Python not found! Please install Python 3.8+ first." -ForegroundColor Red
    exit 1
}

# Install dependencies
Write-Host ""
Write-Host "Installing Python dependencies..." -ForegroundColor Yellow
pip install -r requirements.txt

if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Failed to install dependencies!" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Dependencies installed" -ForegroundColor Green

# Run setup script
Write-Host ""
Write-Host "Running database setup..." -ForegroundColor Yellow
python setup.py

if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Setup failed!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "✓ SETUP COMPLETE!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "To start the server, run:" -ForegroundColor Cyan
Write-Host "  python api.py" -ForegroundColor White
Write-Host ""
