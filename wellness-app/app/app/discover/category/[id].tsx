/**
 * ⑨ アイテム一覧（カテゴリ別）
 *
 * 並び替え：評価が高い順／口コミが多い順。カードを2列で並べる。
 * 評価が高い順では、口コミが COHORT_MIN_N 件以上のものを先に並べる
 * （口コミ1〜2件で平均5.0のものが先頭に来ないように。rankScore が決まるまでの暫定）。
 *
 * モックアップの「おすすめ順」は定義が決まっていないので置かない。「人気No.1」などのタグも付けない。
 */

import { useQuery } from '@tanstack/react-query';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { discover } from '@/api';
import { ItemCard } from '@/components/item/ItemCard';
import { FilterChips } from '@/components/ui/FilterChips';
import { QueryState } from '@/components/ui/QueryState';
import { colors, spacing, typography } from '@/theme/tokens';
import { COHORT_MIN_N, type Item } from '@/types';

type Sort = 'score' | 'count';

const SORTERS: Record<Sort, (a: Item, b: Item) => number> = {
  score: (a, b) =>
    Number(b.reviewCount >= COHORT_MIN_N) - Number(a.reviewCount >= COHORT_MIN_N) ||
    b.avgScore - a.avgScore ||
    b.reviewCount - a.reviewCount,
  count: (a, b) => b.reviewCount - a.reviewCount || b.avgScore - a.avgScore,
};

export default function CategoryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const [sort, setSort] = useState<Sort>('score');
  const categories = useQuery(discover.categoriesQuery);
  const items = useQuery(discover.itemsByCategoryQuery(id));
  const category = categories.data?.get(id);
  const sorted = [...(items.data ?? [])].sort(SORTERS[sort]);

  return (
    <>
      <Stack.Screen options={{ title: category?.name ?? 'アイテム一覧' }} />
      <ScrollView
        style={styles.root}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.lg }]}
      >
        <FilterChips
          options={[
            { value: 'score', label: '評価が高い順' },
            { value: 'count', label: '口コミが多い順' },
          ]}
          value={sort}
          onChange={setSort}
        />
        {items.data && <Text style={styles.caption}>{items.data.length}件</Text>}
        <QueryState
          subject="アイテム"
          isPending={items.isPending}
          error={items.error}
          onRetry={() => void items.refetch()}
        />
        {items.data?.length === 0 && (
          <Text style={styles.empty}>このカテゴリの登録はまだありません。</Text>
        )}
        <View style={styles.grid}>
          {sorted.map((item) => (
            <ItemCard key={item.id} item={item} emoji={category?.emoji ?? '・'} />
          ))}
        </View>
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
    gap: spacing.md,
  },
  caption: {
    ...typography.caption,
    color: colors.inkMuted,
  },
  empty: {
    ...typography.body,
    color: colors.inkMuted,
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
  // 2列：横の間隔は両端揃えで作る（カード幅 48.5% × 2 に gap を足すと折り返してしまうため）
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: spacing.md,
    justifyContent: 'space-between',
  },
});
