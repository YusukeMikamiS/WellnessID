/**
 * ⑬ 口コミ（タブ）— 新着の口コミ
 *
 * 絞り込み：新着／あなたと近い人／1年以上継続／高評価（★4以上）／自発的な投稿のみ
 * reviews_index を新しい順に読む。ブロック中の相手の口コミは出さない。
 *
 * TODO：もっと読み込む（ページ送り）。今は新しい FEED_LIMIT 件だけを読む。
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { BottomTabBarHeightContext } from 'expo-router/tabs';
import { useContext, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { discover, onboard, review } from '@/api';
import { ReviewCard } from '@/components/review/ReviewCard';
import { FilterChips } from '@/components/ui/FilterChips';
import { QueryState } from '@/components/ui/QueryState';
import { profileCohort, useProfileStore } from '@/stores/profile';
import { useSession, withoutBlocked } from '@/stores/session';
import { colors, spacing, typography } from '@/theme/tokens';
import { cohortKey, LONG_TERM_MONTHS, type ReviewIndexEntry } from '@/types';

const FEED_LIMIT = 50;
/** 「高評価」とみなす星の数 */
const HIGH_STARS = 4;

type Filter = 'latest' | 'near' | 'long' | 'high' | 'spontaneous';

export default function ReviewsScreen() {
  const tabBarHeight = useContext(BottomTabBarHeightContext) ?? 0;
  const queryClient = useQueryClient();
  const myCohort = profileCohort(useProfileStore((s) => s.profile));
  const myUid = useSession((s) => s.user?.uid);
  const blockedUids = useSession((s) => s.blockedUids);
  const [filter, setFilter] = useState<Filter>('latest');

  const latest = useQuery(review.latestReviewsQuery(FEED_LIMIT));
  const concerns = useQuery(onboard.concernsQuery);
  const categories = useQuery(discover.categoriesQuery);
  const all = useMemo(
    () => withoutBlocked(latest.data ?? [], blockedUids),
    [latest.data, blockedUids],
  );
  const items = useQuery(discover.itemsByIdsQuery(all.map((r) => r.itemId)));

  const isNear = (r: ReviewIndexEntry) =>
    myCohort != null && cohortKey(r.authorSnapshot.ageBand, r.authorSnapshot.gender) === myCohort;
  const matchers: Record<Filter, (r: ReviewIndexEntry) => boolean> = {
    latest: () => true,
    near: isNear,
    long: (r) => r.months >= LONG_TERM_MONTHS,
    high: (r) => r.stars >= HIGH_STARS,
    spontaneous: (r) => r.postingCategory === 'normal',
  };
  const count = (f: Filter) => all.filter(matchers[f]).length;
  const options: { value: Filter; label: string }[] = [
    { value: 'latest', label: '新着' },
    ...(myCohort != null
      ? [{ value: 'near' as const, label: `あなたと近い人（${count('near')}）` }]
      : []),
    { value: 'long', label: `1年以上継続（${count('long')}）` },
    { value: 'high', label: `高評価（${count('high')}）` },
    { value: 'spontaneous', label: `自発的な投稿のみ（${count('spontaneous')}）` },
  ];
  const shown = all.filter(matchers[filter]);

  const emojiOf = (itemId: string) => {
    const item = items.data?.get(itemId);
    return (item && categories.data?.get(item.categoryId)?.emoji) ?? '・';
  };
  const goalName = (id: string) => concerns.data?.find((c) => c.id === id)?.name ?? id;
  const deleteOwn = (itemId: string, reviewId: string) => async () => {
    await review.deleteReview(itemId, reviewId);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['items'] }),
      queryClient.invalidateQueries({ queryKey: ['reviews'] }),
    ]);
  };

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[styles.content, { paddingBottom: tabBarHeight + spacing.lg }]}
    >
      <FilterChips options={options} value={filter} onChange={setFilter} />
      <Text style={styles.caption}>
        新しい{FEED_LIMIT}件のうち {shown.length}件を表示
        {filter === 'spontaneous' &&
          shown.length === 0 &&
          '。いま表示している口コミは、すべて運営の依頼などによる投稿です'}
      </Text>
      <QueryState
        subject="口コミ"
        isPending={latest.isPending}
        error={latest.error}
        onRetry={() => void latest.refetch()}
      />
      <View style={styles.list}>
        {shown.map((r) => (
          <ReviewCard
            key={r.id}
            review={r}
            itemEmoji={emojiOf(r.itemId)}
            goalName={goalName}
            near={isNear(r)}
            {...(myUid != null && r.uid === myUid && { onDelete: deleteOwn(r.itemId, r.id) })}
          />
        ))}
      </View>
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
    gap: spacing.md,
  },
  caption: {
    ...typography.caption,
    color: colors.inkMuted,
  },
  list: {
    gap: spacing.md,
  },
});
