/**
 * ランキングの本体（ランキングタブ・悩み別ランキングで共通）
 *
 * 表示ルール（CLAUDE.md §7.4）：
 * - 母数 n を常に表示する（RankingRow）
 * - 「あなたと近い人」では、近い人の口コミが COHORT_MIN_N 件以上のものだけ近い人の評価で出し、
 *   足りないものは総合評価で出して、その件数と理由を明示する（lib/ranking.ts）
 * - 口コミが COHORT_MIN_N 件未満のものは順位を付けず「口コミが少ないもの」として分ける
 *   （rankScore の重み付けが決まるまでの暫定）
 *
 * 「みんなの評価／あなたと近い人」の切り替えは親の画面が持つ（上に種別などのチップを並べるため）。
 */

import { useQuery } from '@tanstack/react-query';
import { Link } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { discover, ranking } from '@/api';
import { FilterChips } from '@/components/ui/FilterChips';
import { QueryState } from '@/components/ui/QueryState';
import { AGE_BAND_LABELS, GENDER_LABELS, KIND_LABELS } from '@/lib/labels';
import { type DisplayRow, mergeCohortRanking, splitBySample } from '@/lib/ranking';
import { profileCohort, useProfileStore } from '@/stores/profile';
import { colors, radius, spacing, typography } from '@/theme/tokens';
import { COHORT_MIN_N, type CohortKey, cohortKey, ITEM_KINDS, type ItemKind } from '@/types';

import { RankingRow } from './RankingRow';

export type RankingMode = 'all' | 'near';

interface Props {
  mode: RankingMode;
  /** みんなの評価のランキング（rankingPaths.*） */
  overallPath: string;
  /** 近い人のランキング（rankingPaths.cohort(cohort, scope)） */
  cohortPath: (cohort: CohortKey) => string;
  /** 種別（PRODUCT / SERVICE / PROFESSIONAL）で絞り込むチップを出すか */
  kindFilter?: boolean;
  /** 該当がないときの文言 */
  emptyText?: string;
}

type KindFilter = 'all' | ItemKind;

export function RankingBoard({
  mode,
  overallPath,
  cohortPath,
  kindFilter = false,
  emptyText = '該当する口コミはまだありません。',
}: Props) {
  const profile = useProfileStore((s) => s.profile);
  const myCohort = profileCohort(profile);
  const [kind, setKind] = useState<KindFilter>('all');
  const showNear = mode === 'near' && myCohort != null;

  const categories = useQuery(discover.categoriesQuery);
  const overall = useQuery(ranking.rankingQuery(overallPath));
  const cohort = useQuery({
    ...ranking.rankingQuery(cohortPath(myCohort ?? cohortKey('30s', 'm'))),
    enabled: showNear,
  });

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

  const renderRows = (list: DisplayRow[], withRank: boolean) =>
    list.map((row, i) => {
      const item = items.data?.get(row.entry.itemId);
      if (!item) return null;
      return (
        <RankingRow
          key={row.entry.itemId}
          {...(withRank && { rank: i + 1 })}
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
    <View style={styles.wrap}>
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

      {kindFilter && (
        <FilterChips
          options={[
            { value: 'all' as const, label: `すべて（${rows.length}）` },
            ...ITEM_KINDS.map((k) => ({
              value: k,
              label: `${KIND_LABELS[k]}（${rows.filter((r) => kindOf(r.entry.itemId) === k).length}）`,
            })),
          ]}
          value={kind}
          onChange={setKind}
        />
      )}

      <QueryState
        subject="ランキング"
        isPending={overall.isPending || (showNear && cohort.isPending)}
        error={overall.error ?? cohort.error}
        onRetry={() => void overall.refetch()}
      />

      {!overall.isPending && filtered.length === 0 && <Text style={styles.empty}>{emptyText}</Text>}

      {ranked.length > 0 && <View style={styles.list}>{renderRows(ranked, true)}</View>}

      {few.length > 0 && (
        <View style={styles.fewSection}>
          <Text style={styles.fewTitle}>口コミが少ないもの（{COHORT_MIN_N}件未満）</Text>
          <Text style={styles.caption}>
            口コミが{COHORT_MIN_N}件未満のため、順位は付けていません。
          </Text>
          <View style={styles.list}>{renderRows(few, false)}</View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
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
