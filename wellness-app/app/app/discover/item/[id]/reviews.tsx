/**
 * ⑪ 口コミ一覧（アイテムごと）
 *
 * 絞り込み：すべて／あなたと近い人／1年以上継続／継続中のみ／自発的な投稿のみ（ReviewFilter）
 * 絞り込んだ件数と母数を常に出す。各口コミに「参考になった」と通報（Functions の実装後につなぐ）。
 */

import Ionicons from '@expo/vector-icons/Ionicons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { discover, onboard, review } from '@/api';
import { ReviewCard, toReviewCardData } from '@/components/review/ReviewCard';
import { FilterChips } from '@/components/ui/FilterChips';
import { QueryState } from '@/components/ui/QueryState';
import { profileCohort, useProfileStore } from '@/stores/profile';
import { useSession } from '@/stores/session';
import { colors, elevation, radius, spacing, typography } from '@/theme/tokens';
import { cohortKey, LONG_TERM_MONTHS, type Review, type ReviewFilter } from '@/types';

export default function ItemReviewsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const myUid = useSession((s) => s.user?.uid);
  // 自分の口コミの削除（集計から外れるので、平均点・件数・一覧を取り直す）
  const deleteOwn = (itemId: string, reviewId: string) => async () => {
    await review.deleteReview(itemId, reviewId);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['items'] }),
      queryClient.invalidateQueries({ queryKey: ['reviews'] }),
    ]);
  };
  const myCohort = profileCohort(useProfileStore((s) => s.profile));
  const [filter, setFilter] = useState<ReviewFilter>('all');

  const item = useQuery(discover.itemQuery(id));
  const concerns = useQuery(onboard.concernsQuery);
  const reviews = useQuery(review.itemReviewsQuery(id));

  const isNear = (r: Review) =>
    myCohort != null && cohortKey(r.authorSnapshot.ageBand, r.authorSnapshot.gender) === myCohort;
  const matchers: Record<ReviewFilter, (r: Review) => boolean> = {
    all: () => true,
    near: isNear,
    long: (r) => r.months >= LONG_TERM_MONTHS,
    ongoing: (r) => r.ongoing,
    spontaneous: (r) => r.postingCategory === 'normal',
  };

  const all = reviews.data ?? [];
  const count = (f: ReviewFilter) => all.filter(matchers[f]).length;
  const options: { value: ReviewFilter; label: string }[] = [
    { value: 'all', label: `すべて（${all.length}）` },
    ...(myCohort != null
      ? [{ value: 'near' as const, label: `あなたと近い人（${count('near')}）` }]
      : []),
    { value: 'long', label: `1年以上継続（${count('long')}）` },
    { value: 'ongoing', label: `継続中のみ（${count('ongoing')}）` },
    { value: 'spontaneous', label: `自発的な投稿のみ（${count('spontaneous')}）` },
  ];
  const shown = all.filter(matchers[filter]);
  const goalName = (cid: string) => concerns.data?.find((c) => c.id === cid)?.name ?? cid;

  return (
    <>
      <Stack.Screen
        options={{ title: item.data ? `口コミ・${item.data.reviewCount}件` : '口コミ一覧' }}
      />
      <ScrollView
        style={styles.root}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]}
      >
        {item.data && <Text style={styles.itemName}>{item.data.name}</Text>}
        <FilterChips options={options} value={filter} onChange={setFilter} />
        <Text style={styles.caption}>
          {shown.length}件を表示（全{all.length}件）
          {filter === 'spontaneous' &&
            shown.length === 0 &&
            '。いま表示している口コミは、すべて運営の依頼などによる投稿です'}
        </Text>

        <QueryState
          subject="口コミ"
          isPending={reviews.isPending || item.isPending}
          error={reviews.error ?? item.error}
          onRetry={() => void reviews.refetch()}
        />

        <View style={styles.reviews}>
          {item.data &&
            shown.map((r) => (
              <ReviewCard
                key={r.id}
                review={toReviewCardData(r, item.data!)}
                goalName={goalName}
                near={isNear(r)}
                showItem={false}
                {...(myUid != null && r.uid === myUid && { onDelete: deleteOwn(r.itemId, r.id) })}
              />
            ))}
        </View>

        <Link href={{ pathname: '/discover/item/[id]/post', params: { id } }} asChild>
          <Text style={StyleSheet.flatten([styles.postButton, elevation.card])}>
            <Ionicons name="create-outline" size={16} color={colors.surface} /> 口コミを書く
          </Text>
        </Link>
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
  itemName: {
    ...typography.titleMd,
    color: colors.ink,
  },
  caption: {
    ...typography.caption,
    color: colors.inkMuted,
  },
  reviews: {
    gap: spacing.md,
  },
  postButton: {
    ...typography.titleMd,
    textAlign: 'center',
    color: colors.surface,
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: spacing.base,
    overflow: 'hidden',
    marginTop: spacing.sm,
  },
});
