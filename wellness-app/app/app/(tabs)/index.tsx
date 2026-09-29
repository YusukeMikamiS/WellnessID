/**
 * ⑤ ホーム
 *
 * 上から順に：無料登録の案内 → 悩みから探す入口 → あなたと近い人が選んだもの → 総合ランキング
 * → ウェルネスコラム → 新着の口コミ（モックアップ Phase 1 rev.3）
 *
 * 【表示ルール】
 * - 「近い人」は n ≥ COHORT_MIN_N のものだけ近い人の評価で出す。足りない分は総合評価で補い、その旨を明示する
 * - ランキングには母数 n と、依頼・関係者の投稿の内訳を必ず出す（RankingRow）
 * - 総合ランキングのプレビューは暫定で n ≥ COHORT_MIN_N に絞っている。rankScore の重み付けが
 *   決まるまで、口コミ1〜2件で平均5.0のアイテムが上位に並ぶのを避けるため（企画書⑪で要確定）
 */

import Ionicons from '@expo/vector-icons/Ionicons';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'expo-router';
import { BottomTabBarHeightContext } from 'expo-router/tabs';
import { useContext, useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { column, discover, onboard, ranking, review } from '@/api';
import { ColumnCard } from '@/components/column/ColumnCard';
import { ConcernGrid } from '@/components/concern/ConcernGrid';
import { RankingRow } from '@/components/item/RankingRow';
import { ReviewCard } from '@/components/review/ReviewCard';
import { QueryState } from '@/components/ui/QueryState';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { AGE_BAND_LABELS, GENDER_LABELS } from '@/lib/labels';
import { profileCohort, useProfileStore } from '@/stores/profile';
import { colors, elevation, radius, spacing, typography } from '@/theme/tokens';
import { COHORT_MIN_N, cohortKey, type RankingEntry, rankingPaths, scopeKeys } from '@/types';

const HOME_CONCERN_COUNT = 6;
const NEAR_COUNT = 3;
const OVERALL_COUNT = 4;
const LATEST_REVIEW_COUNT = 3;

export default function HomeScreen() {
  const tabBarHeight = useContext(BottomTabBarHeightContext) ?? 0;
  const profile = useProfileStore((s) => s.profile);
  const myCohort = profileCohort(profile);

  const concerns = useQuery(onboard.concernsQuery);
  const categories = useQuery(discover.categoriesQuery);
  const overall = useQuery(ranking.rankingQuery(rankingPaths.overall()));
  const cohortRanking = useQuery({
    ...ranking.rankingQuery(
      rankingPaths.cohort(myCohort ?? cohortKey('30s', 'm'), scopeKeys.overall()),
    ),
    enabled: myCohort != null,
  });
  const latest = useQuery(review.latestReviewsQuery(LATEST_REVIEW_COUNT));
  const columns = useQuery(column.columnsQuery);

  // 近い人：n が足りるものを優先し、足りない分は総合評価で補う
  const nearRows = useMemo(() => {
    const near = (cohortRanking.data?.entries ?? [])
      .filter((e) => e.n >= COHORT_MIN_N)
      .slice(0, NEAR_COUNT)
      .map((entry) => ({ entry, near: true }));
    const used = new Set(near.map((r) => r.entry.itemId));
    const fill = (overall.data?.entries ?? [])
      .filter((e) => e.n >= COHORT_MIN_N && !used.has(e.itemId))
      .slice(0, NEAR_COUNT - near.length)
      .map((entry) => ({ entry, near: false }));
    return [...near, ...fill];
  }, [cohortRanking.data, overall.data]);

  const overallRows = useMemo(
    () => (overall.data?.entries ?? []).filter((e) => e.n >= COHORT_MIN_N).slice(0, OVERALL_COUNT),
    [overall.data],
  );

  const itemIds = useMemo(
    () => [
      ...nearRows.map((r) => r.entry.itemId),
      ...overallRows.map((e) => e.itemId),
      ...(latest.data ?? []).map((r) => r.itemId),
    ],
    [nearRows, overallRows, latest.data],
  );
  const items = useQuery(discover.itemsByIdsQuery(itemIds));

  const emojiOf = (itemId: string) => {
    const item = items.data?.get(itemId);
    return (item && categories.data?.get(item.categoryId)?.emoji) ?? '・';
  };
  const goalName = (id: string) => concerns.data?.find((c) => c.id === id)?.name ?? id;

  const renderRows = (rows: { entry: RankingEntry; near?: boolean }[]) =>
    rows.map(({ entry, near }, i) => {
      const item = items.data?.get(entry.itemId);
      if (!item) return null;
      return (
        <RankingRow
          key={entry.itemId}
          rank={i + 1}
          item={item}
          emoji={emojiOf(entry.itemId)}
          score={entry.score}
          n={entry.n}
          solicitedN={entry.solicitedN}
          near={near}
          last={i === rows.length - 1}
        />
      );
    });

  const nearCount = nearRows.filter((r) => r.near).length;

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[styles.content, { paddingBottom: tabBarHeight + spacing.lg }]}
    >
      {/* 無料登録の案内（ログイン機能の実装後、未ログインのときだけ出す） */}
      <Link href="/signup" asChild>
        <Pressable style={StyleSheet.flatten([styles.banner, elevation.card])}>
          <View style={styles.bannerBody}>
            <Text style={styles.bannerTitle}>無料登録で口コミを残す</Text>
            <Text style={styles.bannerText}>使ったもの・通った場所が MY WELLNESS に残ります</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.primary} />
        </Pressable>
      </Link>

      <View style={styles.section}>
        <SectionHeader title="最近どうですか？" action={{ label: 'すべて', href: '/search' }} />
        <QueryState
          subject="悩み・目的"
          isPending={concerns.isPending}
          error={concerns.error}
          onRetry={() => void concerns.refetch()}
        />
        {concerns.data && <ConcernGrid concerns={concerns.data.slice(0, HOME_CONCERN_COUNT)} />}
      </View>

      <View style={styles.section}>
        <SectionHeader
          title="あなたと近い人が選んだもの"
          action={{ label: 'もっと見る', href: '/ranking' }}
        />
        {profile?.ageBand && profile.gender && cohortRanking.data ? (
          <Text style={styles.caption}>
            ● あなたと近い人（{AGE_BAND_LABELS[profile.ageBand]}・{GENDER_LABELS[profile.gender]}
            ）の口コミ {cohortRanking.data.totalN}件を集計 ／ {nearRows.length}件のうち{nearCount}
            件は近い人の評価を表示
            {nearCount < nearRows.length && '（ほかは近い人の口コミが5件未満のため総合評価）'}
          </Text>
        ) : (
          myCohort == null && (
            <Link href="/onboarding" style={styles.caption}>
              年代と性別を入れると、あなたと近い人の評価に切り替わります ›
            </Link>
          )
        )}
        <QueryState
          subject="ランキング"
          isPending={overall.isPending || (myCohort != null && cohortRanking.isPending)}
          error={overall.error ?? cohortRanking.error}
          onRetry={() => void overall.refetch()}
        />
        {nearRows.length > 0 && <View style={styles.list}>{renderRows(nearRows)}</View>}
      </View>

      <View style={styles.section}>
        <SectionHeader title="総合ランキング" note="評価の高い順・毎週更新" />
        {overallRows.length > 0 && (
          <View style={styles.list}>{renderRows(overallRows.map((entry) => ({ entry })))}</View>
        )}
      </View>

      <View style={styles.section}>
        <SectionHeader title="ウェルネスコラム" note="COLUMN" />
        <QueryState
          subject="コラム"
          isPending={columns.isPending}
          error={columns.error}
          onRetry={() => void columns.refetch()}
        />
        {columns.data && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.columns}
            style={styles.columnsScroller}
          >
            {columns.data.map((c) => (
              <ColumnCard key={c.id} column={c} />
            ))}
          </ScrollView>
        )}
      </View>

      <View style={styles.section}>
        <SectionHeader title="新着の口コミ" action={{ label: 'もっと見る', href: '/reviews' }} />
        <QueryState
          subject="口コミ"
          isPending={latest.isPending}
          error={latest.error}
          onRetry={() => void latest.refetch()}
        />
        <View style={styles.reviews}>
          {(latest.data ?? []).map((r) => (
            <ReviewCard
              key={r.id}
              review={r}
              itemEmoji={emojiOf(r.itemId)}
              goalName={goalName}
              near={
                myCohort != null &&
                cohortKey(r.authorSnapshot.ageBand, r.authorSnapshot.gender) === myCohort
              }
            />
          ))}
        </View>
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
    gap: spacing.xl,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.base,
  },
  bannerBody: {
    flex: 1,
    gap: 2,
  },
  bannerTitle: {
    ...typography.titleMd,
    color: colors.ink,
  },
  bannerText: {
    ...typography.caption,
    color: colors.inkMuted,
  },
  section: {},
  caption: {
    ...typography.caption,
    color: colors.inkMuted,
    marginBottom: spacing.sm,
  },
  list: {
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  columnsScroller: {
    marginHorizontal: -spacing.base,
  },
  columns: {
    paddingHorizontal: spacing.base,
    gap: spacing.md,
  },
  reviews: {
    gap: spacing.md,
  },
});
