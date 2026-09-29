/**
 * ⑯ お知らせ（全ユーザー共通・出し分けなし）
 *
 * 新しい順に並べ、タップで本文を開く。お知らせの詳細画面は持たない（17画面の構成どおり）。
 */

import Ionicons from '@expo/vector-icons/Ionicons';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { notice } from '@/api';
import { QueryState } from '@/components/ui/QueryState';
import { colors, radius, spacing, typography } from '@/theme/tokens';

export default function NoticeScreen() {
  const insets = useSafeAreaInsets();
  const notices = useQuery(notice.noticesQuery);
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.lg }]}
    >
      <QueryState
        subject="お知らせ"
        isPending={notices.isPending}
        error={notices.error}
        onRetry={() => void notices.refetch()}
      />
      {notices.data?.length === 0 && <Text style={styles.empty}>お知らせはまだありません。</Text>}
      {notices.data && notices.data.length > 0 && (
        <View style={styles.list}>
          {notices.data.map((n, i) => {
            const open = openId === n.id;
            return (
              <Pressable
                key={n.id}
                onPress={() => setOpenId(open ? null : n.id)}
                style={[styles.row, i < notices.data.length - 1 && styles.divider]}
                accessibilityRole="button"
                accessibilityState={{ expanded: open }}
              >
                <View style={styles.rowHead}>
                  <View style={styles.rowBody}>
                    <Text style={styles.title}>{n.title}</Text>
                    <Text style={styles.date}>
                      {new Date(n.publishedAt).toLocaleDateString('ja-JP')}
                    </Text>
                  </View>
                  <Ionicons
                    name={open ? 'chevron-up' : 'chevron-down'}
                    size={16}
                    color={colors.inkMuted}
                  />
                </View>
                {open && <Text style={styles.text}>{n.body}</Text>}
              </Pressable>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    padding: spacing.base,
  },
  empty: {
    ...typography.body,
    color: colors.inkMuted,
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
  list: {
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  row: {
    padding: spacing.base,
    gap: spacing.sm,
  },
  divider: {
    borderBottomColor: colors.line,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  rowBody: {
    flex: 1,
    gap: 2,
  },
  title: {
    ...typography.titleMd,
    fontSize: 14,
    lineHeight: 21,
    color: colors.ink,
  },
  date: {
    ...typography.caption,
    color: colors.inkMuted,
  },
  text: {
    ...typography.bodySm,
    color: colors.ink,
  },
});
