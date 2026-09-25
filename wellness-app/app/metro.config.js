/**
 * Metro 設定（npm workspaces のモノレポ対応）
 *
 * ルートで依存がホイストされるため、app/node_modules だけを見ていると解決に失敗する。
 * watchFolders と nodeModulesPaths でワークスペースルートも見にいく。
 *
 * 参考：https://docs.expo.dev/guides/monorepos/
 */
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '..');

const config = getDefaultConfig(projectRoot);

// 1. ワークスペース全体を監視（functions と共有している types の変更を拾う）
config.watchFolders = [workspaceRoot];

// 2. app → ルート の順で node_modules を探す
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// 3. 上位ディレクトリを際限なく遡らせない（重複解決による "Invalid hook call" 等を防ぐ）
config.resolver.disableHierarchicalLookup = true;

module.exports = withNativeWind(config, { input: './global.css' });
