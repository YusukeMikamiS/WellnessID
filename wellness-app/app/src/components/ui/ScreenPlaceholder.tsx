/**
 * 画面の骨組み用プレースホルダー
 *
 * 画面番号・画面名・一行メモを表示するだけの共通コンポーネント。
 * 各画面の中身を実装したら、この呼び出しは置き換えて消す。
 *
 * - 動的ルート（[id]）では useLocalSearchParams() の id も表示する
 * - links は骨組み段階の遷移確認用（全17画面に到達できることを確かめるため）
 */

import { Link, useLocalSearchParams, type Href } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, radius, spacing, typography } from '@/theme/tokens';

export interface PlaceholderLink {
  label: string;
  href: Href;
}

interface Props {
  title: string;
  /** 企画書の画面番号（①〜⑰） */
  screenNo: number;
  note: string;
  links?: PlaceholderLink[];
}

export function ScreenPlaceholder({ title, screenNo, note, links = [] }: Props) {
  const { id } = useLocalSearchParams<{ id?: string }>();

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.screenNo}>SCREEN {String(screenNo).padStart(2, '0')}</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.note}>{note}</Text>
        {id != null && <Text style={styles.param}>id: {id}</Text>}

        {links.length > 0 && (
          <View style={styles.links}>
            {links.map((link) => (
              <Link key={link.label} href={link.href} style={styles.link}>
                {link.label} →
              </Link>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  screenNo: {
    ...typography.numeric,
    color: colors.inkMuted,
  },
  title: {
    ...typography.titleLg,
    color: colors.ink,
  },
  note: {
    ...typography.body,
    color: colors.inkMuted,
  },
  param: {
    ...typography.bodySm,
    color: colors.ink,
  },
  links: {
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  link: {
    ...typography.titleMd,
    color: colors.primary,
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
    overflow: 'hidden',
  },
});
