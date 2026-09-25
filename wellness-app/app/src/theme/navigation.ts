/**
 * ナビゲーション（ヘッダー）の共通スタイル
 *
 * ルート Stack・(auth) Stack・(tabs) の3か所で同じ見た目にするため、ここに集約する。
 * モックアップ準拠：ヘッダーは背景と同じ色で罫線なし。境界は余白で見せる。
 */

import { colors, fontFamily } from './tokens';

export const headerOptions = {
  headerStyle: { backgroundColor: colors.bg },
  headerShadowVisible: false,
  headerTintColor: colors.primary,
  headerTitleAlign: 'center',
  headerTitleStyle: { fontFamily: fontFamily.bodyBold, fontSize: 16, color: colors.ink },
} as const;
