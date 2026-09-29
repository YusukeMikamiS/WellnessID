/**
 * ⑧ ランキング（タブ）
 *
 * 「みんなの評価／あなたと近い人」の切り替えと、総合・PRODUCTS・SERVICES・専門家・悩み別のチップ。
 * 母数 n を常に表示する。表示ルールは RankingBoard（CLAUDE.md §7.4）。
 */

import { useQuery } from '@tanstack/react-query';
import { BottomTabBarHeightContext } from 'expo-router/tabs';
import { useContext, useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import { onboard } from '@/api';
import { RankingBoard, type RankingMode } from '@/components/item/RankingBoard';
import { FilterChips } from '@/components/ui/FilterChips';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { profileCohort, useProfileStore } from '@/stores/profile';
import { colors, spacing } from '@/theme/tokens';
import { type CohortKey, type ItemKind, rankingPaths, scopeKeys } from '@/types';

/** 'overall' ／ 'kind:product' ／ 'concern:tone' の形で持つ */
type Scope = 'overall' | `kind:${ItemKind}` | `concern:${string}`;

const KIND_SCOPES: { value: Scope; label: string }[] = [
  { value: 'overall', label: '総合' },
  { value: 'kind:product', label: 'PRODUCTS' },
  { value: 'kind:service', label: 'SERVICES' },
  { value: 'kind:pro', label: '専門家' },
];

function pathsOf(scope: Scope) {
  if (scope === 'overall') {
    return {
      overallPath: rankingPaths.overall(),
      cohortPath: (c: CohortKey) => rankingPaths.cohort(c, scopeKeys.overall()),
    };
  }
  if (scope.startsWith('kind:')) {
    const kind = scope.slice('kind:'.length) as ItemKind;
    return {
      overallPath: rankingPaths.kind(kind),
      cohortPath: (c: CohortKey) => rankingPaths.cohort(c, scopeKeys.kind(kind)),
    };
  }
  const concernId = scope.slice('concern:'.length);
  return {
    overallPath: rankingPaths.concern(concernId),
    cohortPath: (c: CohortKey) => rankingPaths.cohort(c, scopeKeys.concern(concernId)),
  };
}

export default function RankingScreen() {
  const tabBarHeight = useContext(BottomTabBarHeightContext) ?? 0;
  const myCohort = profileCohort(useProfileStore((s) => s.profile));
  const [mode, setMode] = useState<RankingMode>(myCohort ? 'near' : 'all');
  const [scope, setScope] = useState<Scope>('overall');
  const concerns = useQuery(onboard.concernsQuery);

  const scopeOptions: { value: Scope; label: string }[] = [
    ...KIND_SCOPES,
    ...(concerns.data ?? []).map((c) => ({
      value: `concern:${c.id}` as Scope,
      label: `${c.emoji} ${c.name}`,
    })),
  ];

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[styles.content, { paddingBottom: tabBarHeight + spacing.lg }]}
    >
      <SegmentedControl
        options={[
          { value: 'all', label: 'みんなの評価' },
          { value: 'near', label: 'あなたと近い人' },
        ]}
        value={mode}
        onChange={setMode}
      />
      <FilterChips options={scopeOptions} value={scope} onChange={setScope} />
      <RankingBoard mode={mode} {...pathsOf(scope)} />
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
});
