/**
 * Metro（Expo × npm workspaces × NativeWind）
 *
 * - 依存はリポジトリ直下の node_modules に hoist されるため、
 *   ワークスペースルートも監視・解決対象に含める。
 * - NativeWind v4 は withNativeWind で global.css を取り込む。
 */
const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '..');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

module.exports = withNativeWind(config, { input: './global.css' });
