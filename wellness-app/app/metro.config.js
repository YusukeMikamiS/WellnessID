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
const fs = require('fs');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '..');

const config = getDefaultConfig(projectRoot);

// 1. ワークスペース全体を監視（functions と共有している types の変更を拾う）
config.watchFolders = [workspaceRoot];

// 2. app → firebase の内側 → ルート の順で node_modules を探す
//
// functions の firebase-admin が古い @firebase/util・@firebase/component などをルートに置くため、
// アプリの firebase（クライアント SDK）が使う新しい版は node_modules/firebase/node_modules に入る。
// 下の 3. で内側の node_modules を見ない設定にしているので、ここで明示的に先に探させる。
// これがないと古い版が読み込まれ、connectFirestoreEmulator などが動かない。
const firebaseNestedModules = path.resolve(workspaceRoot, 'node_modules', 'firebase', 'node_modules');
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  ...(fs.existsSync(firebaseNestedModules) ? [firebaseNestedModules] : []),
  path.resolve(workspaceRoot, 'node_modules'),
];

// 3. 上位ディレクトリを際限なく遡らせない（重複解決による "Invalid hook call" 等を防ぐ）
config.resolver.disableHierarchicalLookup = true;

module.exports = withNativeWind(config, { input: './global.css' });
