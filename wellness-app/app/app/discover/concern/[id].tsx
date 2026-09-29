/**
 * ⑦ 悩み別ランキング
 *
 * 選んだ悩みに紐づく商品・店舗・専門家を横断で並べる。
 * 「みんなの評価／あなたと近い人」の切り替えと、種別（PRODUCT / SERVICE / PROFESSIONAL）の絞り込み。
 * 母数 n を常に表示し、近い人の口コミが5件未満のものは総合評価を出して理由を明示する（CLAUDE.md §7.4）。
 */

import { useQuery } from '@tanstack/react-query';
import { Link, Stack, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { discover, onboard, ranking } from '@/api';
import { RankingRow } from '@/components/item/RankingRow';
import { FilterChips } from '@/components/ui/FilterChips';
import { QueryState } from '@/components/ui/QueryState';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { AGE_BAND_LABELS, GENDER_LABELS, KIND_LABELS } from '@/lib/labels';
import { type DisplayRow, mergeCohortRanking, splitBySample } from '@/lib/ranking';
import { profileCohort, useProfileStore } from '@/stores/profile';
import { colors, radius, spacing, typography } from '@/theme/tokens';
import {
  COHORT_MIN_N,
  cohortKey,
  ITEM_KINDS,
  type ItemKind,
  rankingPaths,
  scopeKeys,
} from '@/types';

type Mode = 'all' | 'near';
type KindFilter = 'all' | ItemKind;

export default function ConcernRankingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const profile = useProfileStore((s) => s.profile);
  const myCohort = profileCohort(profile);
  const [mode, setMode] = useState<Mode>(myCohort ? 'near' : 'all');
  const [kind, setKind] = useState<KindFilter>('all');

  const concerns = useQuery(onboard.concernsQuery);
  const categories = useQuery(discover.categoriesQuery);
  const overall = useQuery(ranking.rankingQuery(rankingPaths.concern(id)));
  const cohort = useQuery({
    ...ranking.rankingQuery(
      rankingPaths.cohort(myCohort ?? cohortKey('30s', 'm'), scopeKeys.concern(id)),
    ),
    enabled: myCohort != null && mode === 'near',
  });

  const concern = concerns.data?.find((c) => c.id === id);
  const showNear = mode === 'near' && myCohort != null;

  const rows: DisplayRow[] = useMemo(() => {
    const base = overall.data?.entries ?? [];
    if (!showNear) return base.map((entry) => ({ entry }));
    return mergeCohortRanking(base, cohort.data?.entries ?? []);
  }, [overall.data, cohort.data, showNear]);

  const items = useQuery(discover.itemsByIdsQuery(rows.map((r) => r.entry.itemId)));
  const kindOf = (itemId: string) => items.data?.get(itemId)?.kind;

  const filtered = kind === 'all' ? rows : rows.filter((r) => kindOf(r.entry.itemId) === kind);
  const { ranked, few } = splitBySample(filtered);
  const nearCount = filtered.filter((r) => r.near).length;

  const kindOptions = [
    { value: 'all' as const, label: `すべて（${rows.length}）` },
    ...ITEM_KINDS.map((k) => ({
      value: k,
      label: `${KIND_LABELS[k]}（${rows.filter((r) => kindOf(r.entry.itemId) === k).length}）`,
    })),
  ];

  const renderRows = (list: DisplayRow[], startRank: number, showRank: boolean) =>
    list.map((row, i) => {
      const item = items.data?.get(row.entry.itemId);
      if (!item) return null;
      return (
        <RankingRow
          key={row.entry.itemId}
          {...(showRank && { rank: startRank + i })}
          item={item}
          emoji={categories.data?.get(item.categoryId)?.emoji ?? '・'}
          score={row.entry.score}
          n={row.entry.n}
          solicitedN={row.entry.solicitedN}
          near={row.near}
          last={i === list.length - 1}
        />
      );
    });

  return (
    <>
      <Stack.Screen options={{ title: concern?.name ?? '悩み別ランキング' }} />
      <ScrollView
        style={styles.root}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.lg }]}
      >
        <SegmentedControl
          options={[
            { value: 'all', label: 'みんなの評価' },
            { value: 'near', label: 'あなたと近い人' },
          ]}
          value={mode}
          onChange={setMode}
        />

        {mode === 'near' && myCohort == null ? (
          <Link href="/onboarding" style={styles.caption}>
            ● 年代と性別を入れると、あなたと近い人の評価に切り替わります ›
          </Link>
        ) : showNear && profile?.ageBand && profile.gender ? (
          <Text style={styles.caption}>
            ● あなたと近い人（{AGE_BAND_LABELS[profile.ageBand]}・{GENDER_LABELS[profile.gender]}
            ）の口コミ {cohort.data?.totalN ?? 0}件を集計 ／ {filtered.length}件のうち{nearCount}
            件は近い人の評価を表示
            {nearCount < filtered.length &&
              `（ほかは近い人の口コミが${COHORT_MIN_N}件未満のため総合評価）`}
          </Text>
        ) : (
          <Text style={styles.caption}>
            ● 全ユーザーの口コミ {overall.data?.totalN ?? 0}件を集計（毎週更新）
          </Text>
        )}

        <FilterChips options={kindOptions} value={kind} onChange={setKind} />

        <QueryState
          subject="ランキング"
          isPending={overall.isPending || (showNear && cohort.isPending)}
          error={overall.error ?? cohort.error}
          onRetry={() => void overall.refetch()}
        />

        {overall.data && filtered.length === 0 && (
          <Text style={styles.empty}>この悩み・目的の口コミはまだありません。</Text>
        )}

        {ranked.length > 0 && <View style={styles.list}>{renderRows(ranked, 1, true)}</View>}

        {few.length > 0 && (
          <View style={styles.fewSection}>
            <Text style={styles.fewTitle}>口コミが少ないもの（{COHORT_MIN_N}件未満）</Text>
            <Text style={styles.caption}>
              口コミが{COHORT_MIN_N}件未満のため、順位は付けていません。
            </Text>
            <View style={styles.list}>{renderRows(few, 0, false)}</View>
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
    gap: spacing.md,
  },
  caption: {
    ...typography.caption,
    color: colors.inkMuted,
  },
  list: {
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  empty: {
    ...typography.body,
    color: colors.inkMuted,
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
  fewSection: {
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  fewTitle: {
    ...typography.titleMd,
    color: colors.ink,
  },
});
