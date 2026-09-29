/**
 * ② オンボーディング（3ステップ）
 *
 * 1. 最近どうですか？ … 悩み・目的を選ぶ（複数可）
 * 2. あなたのこと     … 年代・性別・運動の頻度（必須）、エリア（任意）
 * 3. 準備できました   … あなたと近い人の口コミ件数と、近い人が選んだもの
 *
 * 入力はプロフィールの下書き（stores/profile.ts）として端末に保存し、会員登録で引き継ぐ。
 * 右上の「skip」でホームへ。設定画面から開いたときは、入力済みの内容から始まる。
 *
 * TODO(Functions 実装後)：3の「近い人の口コミ◯件」を estimateCohort（近いユーザーの人数）に差し替える。
 */

import { useQuery } from '@tanstack/react-query';
import { Link, Stack, useRouter } from 'expo-router';
import { type ReactNode, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { discover, onboard, ranking } from '@/api';
import { RankingRow } from '@/components/item/RankingRow';
import { AreaPicker } from '@/components/onboarding/AreaPicker';
import { Button } from '@/components/ui/Button';
import { ChoiceChips } from '@/components/ui/ChoiceChips';
import { QueryState } from '@/components/ui/QueryState';
import { AGE_BAND_LABELS, areaLabel, EXERCISE_FREQ_LABELS, GENDER_LABELS } from '@/lib/labels';
import { mergeCohortRanking } from '@/lib/ranking';
import { useProfileStore } from '@/stores/profile';
import { useSession } from '@/stores/session';
import { colors, fontFamily, radius, spacing, typography } from '@/theme/tokens';
import {
  AGE_BANDS,
  type AgeBand,
  COHORT_MIN_N,
  type Area,
  cohortKey,
  EXERCISE_FREQS,
  type ExerciseFreq,
  type Gender,
  GENDERS,
  type ItemKind,
  rankingPaths,
  scopeKeys,
} from '@/types';

type Step = 1 | 2 | 3;
const TITLES: Record<Step, string> = {
  1: '最近どうですか？',
  2: 'あなたのこと',
  3: '準備できました',
};
const PICKS_PER_KIND = 3;

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const saved = useProfileStore((s) => s.profile);
  const setProfile = useProfileStore((s) => s.setProfile);
  const signedIn = useSession((s) => s.status === 'signedIn');

  const [step, setStep] = useState<Step>(1);
  const [goals, setGoals] = useState<string[]>(saved?.goals ?? []);
  const [ageBand, setAgeBand] = useState<AgeBand | undefined>(saved?.ageBand);
  const [gender, setGender] = useState<Gender | undefined>(saved?.gender);
  const [exerciseFreq, setExerciseFreq] = useState<ExerciseFreq | undefined>(saved?.exerciseFreq);
  const [area, setArea] = useState<Area | null>(saved?.area ?? null);

  const concerns = useQuery(onboard.concernsQuery);
  const canFinish = ageBand != null && gender != null && exerciseFreq != null;

  const finish = () => {
    if (!canFinish) return;
    setProfile({ goals, ageBand, gender, exerciseFreq, area });
    setStep(3);
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: TITLES[step],
          headerRight: () => (
            <Link href="/" dismissTo accessibilityLabel="スキップしてホームへ">
              <Text style={styles.skip}>skip</Text>
            </Link>
          ),
          ...(step > 1 && {
            headerLeft: () => (
              <Pressable onPress={() => setStep((s) => (s - 1) as Step)} hitSlop={12}>
                <Text style={styles.back}>‹ 戻る</Text>
              </Pressable>
            ),
          }),
        }}
      />
      <View style={styles.progress}>
        {[1, 2, 3].map((i) => (
          <View key={i} style={[styles.bar, i <= step && styles.barOn]} />
        ))}
      </View>
      <ScrollView
        style={styles.root}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]}
      >
        {step === 1 && (
          <>
            <Text style={styles.lead}>
              気になっていることを選んでください（複数選択可）。{'\n'}
              選んだ内容から、カテゴリを横断して探せるようになります。
            </Text>
            <QueryState
              subject="悩み・目的"
              isPending={concerns.isPending}
              error={concerns.error}
              onRetry={() => void concerns.refetch()}
            />
            {concerns.data && (
              <ChoiceChips
                grid
                multiple
                options={concerns.data.map((c) => ({ value: c.id, label: c.name, emoji: c.emoji }))}
                selected={goals}
                onChange={setGoals}
              />
            )}
            <Button label={`次へ（${goals.length}件選択中）`} onPress={() => setStep(2)} />
          </>
        )}

        {step === 2 && (
          <>
            <Text style={styles.lead}>
              同じような年代・生活の人が何を選んでいるかを出すために使います。
              <Text style={styles.bold}>3項目だけ</Text>お願いします。
            </Text>
            <Field label="年代">
              <ChoiceChips
                options={AGE_BANDS.map((v) => ({ value: v, label: AGE_BAND_LABELS[v] }))}
                selected={ageBand ? [ageBand] : []}
                onChange={([v]) => setAgeBand(v)}
              />
            </Field>
            <Field label="性別">
              <ChoiceChips
                options={GENDERS.map((v) => ({ value: v, label: GENDER_LABELS[v] }))}
                selected={gender ? [gender] : []}
                onChange={([v]) => setGender(v)}
              />
            </Field>
            <Field label="運動の頻度">
              <ChoiceChips
                options={EXERCISE_FREQS.map((v) => ({ value: v, label: EXERCISE_FREQ_LABELS[v] }))}
                selected={exerciseFreq ? [exerciseFreq] : []}
                onChange={([v]) => setExerciseFreq(v)}
              />
            </Field>
            <Field label="お住まいのエリア（任意）">
              <AreaPicker value={area} onChange={setArea} />
            </Field>
            <Button label="これで探してみる" onPress={finish} disabled={!canFinish} />
            <Text style={styles.note}>
              入力内容は、あなたと近い人の評価を出すために使います。口コミを投稿すると、
              年代・性別・エリア・運動の頻度が口コミと一緒に表示されます。
            </Text>
          </>
        )}

        {step === 3 && ageBand && gender && exerciseFreq && (
          <Result
            ageBand={ageBand}
            gender={gender}
            exerciseFreq={exerciseFreq}
            area={area}
            goalNames={goals
              .map((g) => concerns.data?.find((c) => c.id === g)?.name)
              .filter((n): n is string => n != null)}
            onStart={() => router.dismissTo('/')}
            showSignup={!signedIn}
          />
        )}
      </ScrollView>
    </>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

interface ResultProps {
  ageBand: AgeBand;
  gender: Gender;
  exerciseFreq: ExerciseFreq;
  area: Area | null;
  goalNames: string[];
  onStart: () => void;
  showSignup: boolean;
}

/** 3. 準備できました：近い人の口コミ件数と、近い人が選んだ商品・店舗 */
function Result({
  ageBand,
  gender,
  exerciseFreq,
  area,
  goalNames,
  onStart,
  showSignup,
}: ResultProps) {
  const myCohort = cohortKey(ageBand, gender);
  const categories = useQuery(discover.categoriesQuery);
  const overall = useQuery(ranking.rankingQuery(rankingPaths.overall()));
  const cohort = useQuery(ranking.rankingQuery(rankingPaths.cohort(myCohort, scopeKeys.overall())));

  const rows = useMemo(
    () => mergeCohortRanking(overall.data?.entries ?? [], cohort.data?.entries ?? []),
    [overall.data, cohort.data],
  );
  const items = useQuery(discover.itemsByIdsQuery(rows.map((r) => r.entry.itemId)));
  const pick = (kinds: ItemKind[]) =>
    rows
      .filter((r) => {
        const kind = items.data?.get(r.entry.itemId)?.kind;
        return kind != null && kinds.includes(kind) && r.entry.n >= COHORT_MIN_N;
      })
      .slice(0, PICKS_PER_KIND);

  const summary = [
    `${AGE_BAND_LABELS[ageBand]}・${GENDER_LABELS[gender]}`,
    areaLabel(area),
    `運動 ${EXERCISE_FREQ_LABELS[exerciseFreq]}`,
  ].filter(Boolean);

  const section = (title: string, kinds: ItemKind[]) => {
    const list = pick(kinds);
    if (list.length === 0) return null;
    return (
      <View style={styles.pickSection}>
        <Text style={styles.pickTitle}>{title}</Text>
        <View style={styles.list}>
          {list.map((row, i) => {
            const item = items.data?.get(row.entry.itemId);
            if (!item) return null;
            return (
              <RankingRow
                key={item.id}
                rank={i + 1}
                item={item}
                emoji={categories.data?.get(item.categoryId)?.emoji ?? '・'}
                score={row.entry.score}
                n={row.entry.n}
                solicitedN={row.entry.solicitedN}
                near={row.near}
                last={i === list.length - 1}
              />
            );
          })}
        </View>
      </View>
    );
  };

  return (
    <>
      <View style={styles.hero}>
        <Text style={styles.heroLabel}>あなたと近い人の口コミは</Text>
        <Text style={styles.heroNumber}>
          {cohort.data?.totalN ?? 0}
          <Text style={styles.heroUnit}>件</Text>
        </Text>
        <Text style={styles.heroSummary}>
          {summary.join(' ／ ')}
          {goalNames.length > 0 && `\n目的：${goalNames.slice(0, 3).join(' / ')}`}
        </Text>
      </View>
      <QueryState
        subject="ランキング"
        isPending={overall.isPending || cohort.isPending}
        error={overall.error ?? cohort.error}
      />
      {section('近い人が選んだ PRODUCTS', ['product'])}
      {section('近い人が選んだ SERVICES', ['service', 'pro'])}
      <Text style={styles.note}>
        近い人の口コミが{COHORT_MIN_N}件未満のものは、総合評価で表示しています。
      </Text>
      <Button label="はじめる" onPress={onStart} />
      {showSignup && (
        <Link href="/signup" asChild>
          <Pressable style={styles.ghostLink}>
            <Text style={styles.ghostLinkText}>無料登録して記録を残す</Text>
          </Pressable>
        </Link>
      )}
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
  skip: {
    marginHorizontal: spacing.base,
    fontFamily: fontFamily.bodyBold,
    fontSize: 13,
    color: colors.primary,
  },
  back: {
    ...typography.bodySm,
    color: colors.primary,
    marginHorizontal: spacing.sm,
  },
  progress: {
    flexDirection: 'row',
    gap: spacing.xs,
    paddingHorizontal: spacing.base,
    backgroundColor: colors.bg,
  },
  bar: {
    flex: 1,
    height: 3,
    borderRadius: radius.pill,
    backgroundColor: colors.tint,
  },
  barOn: {
    backgroundColor: colors.primary,
  },
  lead: {
    ...typography.bodySm,
    color: colors.inkMuted,
  },
  bold: {
    fontFamily: fontFamily.bodyBold,
    color: colors.ink,
  },
  field: {
    gap: spacing.sm,
  },
  fieldLabel: {
    ...typography.titleMd,
    fontSize: 14,
    color: colors.ink,
  },
  note: {
    ...typography.caption,
    color: colors.inkMuted,
    textAlign: 'center',
  },
  hero: {
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.lg,
  },
  heroLabel: {
    ...typography.bodySm,
    color: colors.inkMuted,
  },
  heroNumber: {
    ...typography.displayLg,
    fontSize: 44,
    lineHeight: 52,
    color: colors.primary,
  },
  heroUnit: {
    ...typography.titleMd,
    color: colors.primary,
  },
  heroSummary: {
    ...typography.caption,
    color: colors.inkMuted,
    textAlign: 'center',
  },
  pickSection: {
    gap: spacing.sm,
  },
  pickTitle: {
    ...typography.titleMd,
    color: colors.ink,
  },
  list: {
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  ghostLink: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  ghostLinkText: {
    ...typography.titleMd,
    color: colors.primary,
  },
});
