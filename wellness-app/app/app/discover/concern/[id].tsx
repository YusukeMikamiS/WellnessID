/**
 * ⑦ 悩み別ランキング
 *
 * 選んだ悩みに紐づく商品・店舗・専門家を横断で並べる。
 * 「みんなの評価／あなたと近い人」の切り替えと、種別（PRODUCT / SERVICE / PROFESSIONAL）の絞り込み。
 * 表示ルールは RankingBoard（CLAUDE.md §7.4）。
 */

import { useQuery } from '@tanstack/react-query';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { onboard } from '@/api';
import { RankingBoard, type RankingMode } from '@/components/item/RankingBoard';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { profileCohort, useProfileStore } from '@/stores/profile';
import { colors, spacing } from '@/theme/tokens';
import { rankingPaths, scopeKeys } from '@/types';

export default function ConcernRankingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const myCohort = profileCohort(useProfileStore((s) => s.profile));
  const [mode, setMode] = useState<RankingMode>(myCohort ? 'near' : 'all');
  const concerns = useQuery(onboard.concernsQuery);
  const concern = concerns.data?.find((c) => c.id === id);

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
        <RankingBoard
          mode={mode}
          overallPath={rankingPaths.concern(id)}
          cohortPath={(c) => rankingPaths.cohort(c, scopeKeys.concern(id))}
          kindFilter
          emptyText="この悩み・目的の口コミはまだありません。"
        />
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
});
