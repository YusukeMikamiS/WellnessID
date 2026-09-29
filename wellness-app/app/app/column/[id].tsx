/**
 * ⑮ ウェルネスコラム
 *
 * 【規約】記事本文と商品導線は分ける（types/content.ts）。本文中に購入リンクを入れず、
 * itemIds で紐づけたアイテムを記事の最後に「この記事で紹介したもの」として並べる。
 * 薬機法・景品表示法上、記事内容と広告的な導線の距離を保つため。
 */

import { useQuery } from '@tanstack/react-query';
import { Stack, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { column as columnApi, discover } from '@/api';
import { RankingRow } from '@/components/item/RankingRow';
import { QueryState } from '@/components/ui/QueryState';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { colors, kindColors, radius, spacing, typography } from '@/theme/tokens';

/** ColumnCard と同じ地の色 */
const HERO_COLORS: Record<string, string> = {
  navy: colors.primaryStrong,
  green: kindColors.service.fg,
  slate: colors.ink,
};

export default function ColumnScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const column = useQuery(columnApi.columnQuery(id));
  const categories = useQuery(discover.categoriesQuery);
  const items = useQuery(discover.itemsByIdsQuery(column.data?.itemIds ?? []));

  if (!column.data) {
    return (
      <View style={styles.root}>
        <QueryState
          subject="コラム"
          isPending={column.isPending}
          error={column.error}
          onRetry={() => void column.refetch()}
        />
        {column.data === null && <Text style={styles.empty}>コラムが見つかりませんでした。</Text>}
      </View>
    );
  }

  const c = column.data;
  const linked = c.itemIds
    .map((itemId) => items.data?.get(itemId))
    .filter((it): it is NonNullable<typeof it> => it != null);
  const publishedAt = c.publishedAt ? new Date(c.publishedAt).toLocaleDateString('ja-JP') : '';

  return (
    <>
      <Stack.Screen options={{ title: 'コラム' }} />
      <ScrollView
        style={styles.root}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]}
      >
        <View
          style={[
            styles.hero,
            { backgroundColor: HERO_COLORS[c.heroStyle ?? ''] ?? colors.primaryStrong },
          ]}
        >
          <Text style={styles.eyebrow}>COLUMN</Text>
          <Text style={styles.title}>{c.title}</Text>
          <Text style={styles.meta}>
            {publishedAt}
            {c.supervisedBy ? ` ／ 監修：${c.supervisedBy}` : ''}
          </Text>
        </View>

        <Text style={styles.body}>{c.body}</Text>

        {linked.length > 0 && (
          <View>
            <SectionHeader title="この記事で紹介したもの" />
            <View style={styles.list}>
              {linked.map((item, i) => (
                <RankingRow
                  key={item.id}
                  item={item}
                  emoji={categories.data?.get(item.categoryId)?.emoji ?? '・'}
                  score={item.avgScore}
                  n={item.reviewCount}
                  solicitedN={item.solicitedCount}
                  last={i === linked.length - 1}
                />
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    padding: spacing.base,
    gap: spacing.lg,
  },
  empty: {
    ...typography.body,
    color: colors.inkMuted,
    textAlign: 'center',
    padding: spacing.lg,
  },
  hero: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
    minHeight: 160,
    justifyContent: 'flex-end',
  },
  eyebrow: {
    ...typography.caption,
    letterSpacing: 2,
    color: colors.primarySoft,
  },
  title: {
    ...typography.titleLg,
    color: colors.surface,
  },
  meta: {
    ...typography.caption,
    color: colors.primarySoft,
  },
  body: {
    ...typography.body,
    color: colors.ink,
  },
  list: {
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
});
