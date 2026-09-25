# ---------------------------------------------------------------------------
# WellnessID - install dependencies (Windows / PowerShell)
#
# Usage (run inside the wellness-app folder):
#   powershell -ExecutionPolicy Bypass -File scripts\bootstrap-app.ps1
#
# This file is intentionally ASCII-only so that Windows PowerShell 5.1
# parses it correctly regardless of the system code page.
# ---------------------------------------------------------------------------

$ErrorActionPreference = 'Stop'

function Invoke-Step {
    param(
        [string] $Label,
        [scriptblock] $Body
    )

    Write-Host ""
    Write-Host ">> $Label" -ForegroundColor Cyan

    & $Body

    if ($LASTEXITCODE -ne 0) {
        Write-Host ""
        Write-Host "FAILED: $Label" -ForegroundColor Red
        Write-Host "Copy the error text above and ask for help." -ForegroundColor Yellow
        exit 1
    }
}

# --- 0. Preflight ----------------------------------------------------------
Write-Host ">> [0/6] Checking Node.js and npm" -ForegroundColor Cyan

$nodeVersion = $null
try {
    $nodeVersion = (node -v)
} catch {
    Write-Host "Node.js not found." -ForegroundColor Red
    Write-Host "Install node-v22.x.x-x64.msi from https://nodejs.org/dist/latest-v22.x/" -ForegroundColor Yellow
    Write-Host "Then close VS Code, reopen it, and run this again." -ForegroundColor Yellow
    exit 1
}

$npmVersion = (npm -v)
Write-Host "   node $nodeVersion / npm $npmVersion"

if ($nodeVersion -notmatch '^v22\.') {
    Write-Host ""
    Write-Host "WARNING: this project targets Node 22 (found $nodeVersion)." -ForegroundColor Yellow
    Write-Host "Cloud Functions is set to the nodejs22 runtime to match." -ForegroundColor Yellow
    Write-Host "Download: https://nodejs.org/dist/latest-v22.x/ then node-v22.x.x-x64.msi" -ForegroundColor Yellow
    Write-Host ""
    $goOn = Read-Host "Continue anyway? (y/N)"
    if ($goOn -ne 'y') { exit 0 }
}

# --- Location check --------------------------------------------------------
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root
Write-Host "   working folder: $root"

if (-not (Test-Path (Join-Path $root 'app\package.json'))) {
    Write-Host "Run this from inside the wellness-app folder." -ForegroundColor Red
    Write-Host "  cd wellness-app" -ForegroundColor Yellow
    exit 1
}

if ($root -match 'OneDrive') {
    Write-Host ""
    Write-Host "WARNING: this folder is inside OneDrive." -ForegroundColor Yellow
    Write-Host "node_modules is tens of thousands of files (about 1GB)." -ForegroundColor Yellow
    Write-Host "OneDrive will try to sync it and cause 'file in use' errors." -ForegroundColor Yellow
    Write-Host "Move the project to C:\dev\WellnessID first." -ForegroundColor Yellow
    Write-Host ""
    $answer = Read-Host "Continue anyway? (y/N)"
    if ($answer -ne 'y') { exit 0 }
}

# --- 1. Root dev tools -----------------------------------------------------
Invoke-Step "[1/6] Root dev tools (ESLint / Prettier / TypeScript)" {
    npm install --no-workspaces
}

# --- 2. Expo core ----------------------------------------------------------
Set-Location (Join-Path $root 'app')
Invoke-Step "[2/6] Expo core" {
    npm install expo
}

# --- 3. Expo-managed packages ----------------------------------------------
$expoPackages = @(
    'expo-router',
    'expo-constants',
    'expo-linking',
    'expo-status-bar',
    'expo-font',
    'expo-secure-store',
    'react',
    'react-dom',
    'react-native',
    'react-native-safe-area-context',
    'react-native-screens',
    'react-native-reanimated',
    'react-native-gesture-handler',
    '@expo-google-fonts/jost',
    '@expo-google-fonts/zen-kaku-gothic-new'
)
Invoke-Step "[3/6] Expo-managed packages (expo install picks the versions)" {
    npx expo install @expoPackages
}

# --- 4. App libraries ------------------------------------------------------
Invoke-Step "[4/6] App libraries" {
    npm install zustand '@tanstack/react-query' react-hook-form '@hookform/resolvers' zod firebase
}

Invoke-Step "[5/6] Dev libraries" {
    npm install -D 'tailwindcss@^3.4.0' nativewind '@types/react'
}

# --- 6. Cloud Functions ----------------------------------------------------
Set-Location (Join-Path $root 'functions')
Invoke-Step "[6/6] Cloud Functions" {
    npm install
}

Set-Location $root

Write-Host ""
Write-Host "DONE." -ForegroundColor Green
Write-Host ""
Write-Host "Next, run these two:" -ForegroundColor Cyan
Write-Host "   npm run typecheck     # no output means success"
Write-Host "   npm run lint"
Write-Host ""
