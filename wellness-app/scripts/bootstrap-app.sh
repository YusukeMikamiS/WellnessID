#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# app/ の依存を Expo SDK に整合したバージョンで入れる
#
# 【なぜスクリプトなのか】
# package.json に手でバージョンを書くと、Expo SDK の想定と必ずズレる。
# `expo install` は「いま入っている Expo SDK に合うバージョン」を選んでくれるので、
# バージョン決定は全部そちらに委ねる。
#
# 使い方: リポジトリのルートで  bash scripts/bootstrap-app.sh
# ---------------------------------------------------------------------------
set -euo pipefail

cd "$(dirname "$0")/.."
ROOT="$(pwd)"
echo "▶ repo root: $ROOT"

# 1) ルートの開発ツール（eslint / prettier / typescript）だけ先に入れる
echo "▶ [1/5] ルートの devDependencies"
npm install --no-workspaces

# 2) Expo 本体（最新SDK）
echo "▶ [2/5] expo 本体"
cd "$ROOT/app"
npm install expo

# 3) Expo 管理下のパッケージは expo install に解決させる
echo "▶ [3/5] Expo 管理パッケージ"
npx expo install \
  expo-router \
  expo-constants \
  expo-linking \
  expo-status-bar \
  expo-font \
  expo-secure-store \
  react \
  react-dom \
  react-native \
  react-native-safe-area-context \
  react-native-screens \
  react-native-reanimated \
  react-native-gesture-handler \
  @expo-google-fonts/jost \
  @expo-google-fonts/zen-kaku-gothic-new

# 4) Expo 管理外のライブラリ
echo "▶ [4/5] アプリ依存"
npm install \
  zustand \
  @tanstack/react-query \
  react-hook-form \
  @hookform/resolvers \
  zod \
  firebase

npm install -D \
  tailwindcss@^3.4.0 \
  nativewind \
  @types/react

# 5) functions 側
echo "▶ [5/5] functions"
cd "$ROOT/functions"
npm install

cd "$ROOT"
echo ""
echo "✅ 完了。次を順に実行して確認してください:"
echo "   npm run typecheck"
echo "   npm run lint"
echo "   cd app && npx expo-doctor"
