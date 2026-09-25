# ---------------------------------------------------------------------------
# WellnessID — 必要なライブラリを入れる（Windows / PowerShell 用）
#
# 使い方（wellness-app フォルダの中で実行）:
#   powershell -ExecutionPolicy Bypass -File scripts\bootstrap-app.ps1
#
# なぜスクリプトなのか:
#   ライブラリのバージョンを手で書くと、Expo の想定と必ずズレます。
#   `expo install` に「今の Expo に合うバージョン」を選ばせるほうが確実なので、
#   その手順を順番に実行するだけのスクリプトにしています。
# ---------------------------------------------------------------------------

$ErrorActionPreference = 'Stop'

function Invoke-Step {
    param([string]$Label, [scriptblock]$Body)
    Write-Host ""
    Write-Host "▶ $Label" -ForegroundColor Cyan
    & $Body
    if ($LASTEXITCODE -ne 0) {
        Write-Host ""
        Write-Host "✖ 失敗しました: $Label" -ForegroundColor Red
        Write-Host "  上に出ているエラーの文章をそのままコピーして相談してください。" -ForegroundColor Yellow
        exit 1
    }
}

# --- 0. 前提チェック -------------------------------------------------------
Write-Host "▶ [0/6] Node.js と npm の確認" -ForegroundColor Cyan
try {
    $nodeVersion = (node -v)
    $npmVersion = (npm -v)
} catch {
    Write-Host "✖ Node.js が見つかりません。" -ForegroundColor Red
    Write-Host "  https://nodejs.org/ から LTS 版（20系）をインストールし、" -ForegroundColor Yellow
    Write-Host "  VS Code を再起動してからやり直してください。" -ForegroundColor Yellow
    exit 1
}
Write-Host "   node $nodeVersion / npm $npmVersion"

if ($nodeVersion -notmatch '^v(20|22)\.') {
    Write-Host "   ⚠ Node 20 系（または22系）を想定しています。動かない場合はバージョンを疑ってください。" -ForegroundColor Yellow
}

# --- 場所の確認 ------------------------------------------------------------
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root
Write-Host "   作業フォルダ: $root"

if (-not (Test-Path (Join-Path $root 'app\package.json'))) {
    Write-Host "✖ wellness-app フォルダの中で実行してください。" -ForegroundColor Red
    Write-Host "  例:  cd wellness-app" -ForegroundColor Yellow
    exit 1
}

# OneDrive 配下だと node_modules の同期で不具合が出やすい
if ($root -match 'OneDrive') {
    Write-Host ""
    Write-Host "   ⚠ このフォルダは OneDrive の中にあります。" -ForegroundColor Yellow
    Write-Host "     これから入れる node_modules は数万ファイル・1GB近くになり、" -ForegroundColor Yellow
    Write-Host "     OneDrive が同期しようとして『ファイルが使用中』エラーや同期の遅延を起こしがちです。" -ForegroundColor Yellow
    Write-Host "     C:\dev\WellnessID などへ移動してからのほうが安全です。" -ForegroundColor Yellow
    Write-Host ""
    $answer = Read-Host "     このまま続けますか? (y/N)"
    if ($answer -ne 'y') {
        Write-Host "   中断しました。フォルダを移動してからやり直してください。"
        exit 0
    }
}

# --- 1. ルートの開発ツール -------------------------------------------------
Invoke-Step "[1/6] ルートの開発ツール（ESLint / Prettier / TypeScript）" {
    npm install --no-workspaces
}

# --- 2. Expo 本体 -----------------------------------------------------------
Set-Location (Join-Path $root 'app')
Invoke-Step "[2/6] Expo 本体" {
    npm install expo
}

# --- 3. Expo 管理下のパッケージ --------------------------------------------
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
Invoke-Step "[3/6] Expo 管理パッケージ（バージョンは expo install が決める）" {
    npx expo install @expoPackages
}

# --- 4. アプリ依存 ----------------------------------------------------------
Invoke-Step "[4/6] アプリのライブラリ" {
    npm install zustand '@tanstack/react-query' react-hook-form '@hookform/resolvers' zod firebase
}

Invoke-Step "[5/6] 開発用ライブラリ" {
    npm install -D 'tailwindcss@^3.4.0' nativewind '@types/react'
}

# --- 6. functions -----------------------------------------------------------
Set-Location (Join-Path $root 'functions')
Invoke-Step "[6/6] Cloud Functions 側" {
    npm install
}

Set-Location $root

Write-Host ""
Write-Host "✅ 完了しました。" -ForegroundColor Green
Write-Host ""
Write-Host "次に、この2つを順に実行して確認してください:" -ForegroundColor Cyan
Write-Host "   npm run typecheck     # 何も出なければ成功"
Write-Host "   npm run lint"
Write-Host ""
