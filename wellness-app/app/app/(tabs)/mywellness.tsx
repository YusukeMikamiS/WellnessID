/**
 * ⑭ MY WELLNESS（未ログイン／会員の2段で出し分け・CLAUDE.md §5）
 *
 * 未ログイン：空の状態 → 無料登録／ログイン → 使い方の4ステップ
 * 会員      ：プロフィール → 目的 → 数字（評価したもの・継続中・記録の合計）
 *             → いま続けているもの → やめたもの → お気に入り → 投稿への反応
 *
 * 記録は自分の口コミ（公開中のもの）から作る。「ウェルネスの記録」という呼び方を使う
 * （「Wellness Passport」は他社の登録商標のため使わない）。
 */

import Ionicons from '@expo/vector-icons/Ionicons';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'expo-router';
import { BottomTabBarHeightContext } from 'expo-router/tabs';
import { useContext } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { discover, favorite, onboard, review } from '@/api';
import { RankingRow } from '@/components/item/RankingRow';
import { Badge } from '@/components/ui/Badge';
import { QueryState } from '@/components/ui/QueryState';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Stars } from '@/components/ui/Stars';
import {
  AGE_BAND_LABELS,
  areaLabel,
  EXERCISE_FREQ_LABELS,
  GENDER_LABELS,
  KIND_LABELS,
  monthsLabel,
} from '@/lib/labels';
import { useProfileStore } from '@/stores/profile';
import { useSession } from '@/stores/session';
import {
  colors,
  fontFamily,
  kindColors,
  radius,
  semantic,
  spacing,
  typography,
} from '@/theme/tokens';
import type { Item, Review } from '@/types';

export default function MyWellnessScreen() {
  const tabBarHeight = useContext(BottomTabBarHeightContext) ?? 0;
  const status = useSession((s) => s.status);
  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[styles.content, { paddingBottom: tabBarHeight + spacing.lg }]}
    >
      {status === 'signedIn' ? <Member /> : <Guest />}
    </ScrollView>
  );
}

const STEPS = [
  {
    title: '① 悩み・目的を選ぶ',
    text: 'カテゴリを横断して、商品・サービス・専門家を比較できます。登録は不要です。',
  },
  {
    title: '② プロフィールを入れる',
    text: '年代・性別・運動頻度を入れると、ランキングが「自分と近い人」基準に変わります。',
  },
  {
    title: '③ 使ったものを評価する',
    text: '使用期間と継続状況まで残すので、あとから「1年続けた人の評価」として参照されます。',
  },
  {
    title: '④ MY WELLNESS が育つ',
    text: '何を使い、どこへ通い、何を続けているかが、あなたのウェルネスの記録として残ります。',
  },
];

function Guest() {
  return (
    <>
      <View style={styles.empty}>
        <Text style={styles.emptyIcon}>🪪</Text>
        <Text style={styles.emptyTitle}>MY WELLNESS はまだ空です</Text>
        <Text style={styles.emptyText}>
          使ったもの・通った場所を口コミとして残すと、ここに自分の記録として蓄積されていきます。
        </Text>
      </View>
      <View style={styles.buttons}>
        <Link href="/signup" asChild>
          <Pressable style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>無料登録してはじめる</Text>
          </Pressable>
        </Link>
        <Link href="/login" asChild>
          <Pressable style={styles.ghostButton}>
            <Text style={styles.ghostButtonText}>ログイン</Text>
          </Pressable>
        </Link>
      </View>
      <View>
        <SectionHeader title="使うほど「自分に合う」が分かる" />
        <View style={styles.steps}>
          {STEPS.map((step, i) => (
            <View key={step.title} style={styles.step}>
              <View style={styles.stepRail}>
                <View style={styles.stepDot} />
                {i < STEPS.length - 1 && <View style={styles.stepLine} />}
              </View>
              <View style={styles.stepBody}>
                <Text style={styles.stepTitle}>{step.title}</Text>
                <Text style={styles.stepText}>{step.text}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </>
  );
}

function Member() {
  const user = useSession((s) => s.user);
  const profile = useProfileStore((s) => s.profile);
  const concerns = useQuery(onboard.concernsQuery);
  const categories = useQuery(discover.categoriesQuery);
  const mine = useQuery({ ...review.myReviewsQuery(user?.uid ?? ''), enabled: user != null });
  const reviews = mine.data ?? [];
  const favorites = useQuery({
    ...favorite.favoritesQuery(user?.uid ?? ''),
    enabled: user != null,
  });
  const favoriteIds = (favorites.data ?? []).map((f) => f.itemId);
  const items = useQuery(
    discover.itemsByIdsQuery([...reviews.map((r) => r.itemId), ...favoriteIds]),
  );
  const favoriteItems = favoriteIds
    .map((id) => items.data?.get(id))
    .filter((it): it is Item => it != null);

  const nickname = user?.nickname ?? '';
  const summary = profile?.ageBand
    ? [
        `${AGE_BAND_LABELS[profile.ageBand]}・${profile.gender ? GENDER_LABELS[profile.gender] : ''}`,
        areaLabel(profile.area ?? null),
        profile.exerciseFreq && `運動 ${EXERCISE_FREQ_LABELS[profile.exerciseFreq]}`,
      ]
        .filter(Boolean)
        .join(' ／ ')
    : 'プロフィール未入力';
  const goals = (profile?.goals ?? [])
    .map((g) => concerns.data?.find((c) => c.id === g))
    .filter((c): c is NonNullable<typeof c> => c != null);

  const ongoing = reviews.filter((r) => r.ongoing);
  const stopped = reviews.filter((r) => !r.ongoing);
  const totalMonths = reviews.reduce((sum, r) => sum + r.months, 0);
  const totalLikes = reviews.reduce((sum, r) => sum + r.likeCount, 0);
  const emojiOf = (item: Item | undefined) =>
    (item && categories.data?.get(item.categoryId)?.emoji) ?? '・';

  return (
    <>
      <View style={styles.profile}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{nickname.slice(0, 1).toUpperCase()}</Text>
        </View>
        <View style={styles.profileBody}>
          <Text style={styles.nickname}>{nickname}</Text>
          <Text style={styles.summary}>{summary}</Text>
        </View>
      </View>

      <View style={styles.goals}>
        {goals.map((g) => (
          <Badge
            key={g.id}
            label={`${g.emoji} ${g.name}`}
            fg={colors.primaryStrong}
            bg={colors.primarySoft}
          />
        ))}
        <Link href="/onboarding" style={styles.link}>
          目的を編集 ›
        </Link>
      </View>

      <View style={styles.kpis}>
        <Kpi value={String(reviews.length)} label="評価したもの" />
        <Kpi value={String(ongoing.length)} label="継続中" />
        <Kpi value={String(totalMonths)} unit="ヶ月" label="記録の合計" />
      </View>

      <QueryState
        subject="あなたの記録"
        isPending={mine.isPending}
        error={mine.error}
        onRetry={() => void mine.refetch()}
      />

      {mine.data && reviews.length === 0 && (
        <View style={styles.card}>
          <Text style={styles.cardText}>
            まだ口コミがありません。使ったもの・通った場所を評価すると、ここに記録が残ります。
          </Text>
          <Link href="/search" style={styles.link}>
            悩み・目的から探す ›
          </Link>
        </View>
      )}

      {ongoing.length > 0 && (
        <View>
          <SectionHeader title="いま続けているもの" note="ウェルネスの記録" />
          <RecordList reviews={ongoing} items={items.data} emojiOf={emojiOf} />
        </View>
      )}

      {stopped.length > 0 && (
        <View>
          <SectionHeader title="やめたもの" note="これも記録として残ります" />
          <RecordList reviews={stopped} items={items.data} emojiOf={emojiOf} />
        </View>
      )}

      {favoriteItems.length > 0 && (
        <View>
          <SectionHeader title="お気に入り" note={`${favoriteItems.length}件`} />
          <View style={styles.list}>
            {favoriteItems.map((item, i) => (
              <RankingRow
                key={item.id}
                item={item}
                emoji={emojiOf(item)}
                score={item.avgScore}
                n={item.reviewCount}
                solicitedN={item.solicitedCount}
                last={i === favoriteItems.length - 1}
              />
            ))}
          </View>
        </View>
      )}

      {reviews.length > 0 && (
        <View>
          <SectionHeader title="あなたの投稿への反応" />
          <View style={styles.card}>
            <Text style={styles.cardText}>
              これまでの口コミが <Text style={styles.strong}>{totalLikes}回</Text>{' '}
              「参考になった」と言われています。
            </Text>
          </View>
        </View>
      )}
    </>
  );
}

function RecordList({
  reviews,
  items,
  emojiOf,
}: {
  reviews: Review[];
  items: Map<string, Item> | undefined;
  emojiOf: (item: Item | undefined) => string;
}) {
  return (
    <View style={styles.list}>
      {reviews.map((r, i) => {
        const item = items?.get(r.itemId);
        const kind = item ? kindColors[item.kind] : null;
        return (
          <Link
            key={r.id}
            href={{ pathname: '/discover/item/[id]', params: { id: r.itemId } }}
            asChild
          >
            <Pressable
              style={StyleSheet.flatten([styles.row, i < reviews.length - 1 && styles.divider])}
            >
              <View style={styles.thumb}>
                <Text style={styles.thumbEmoji}>{emojiOf(item)}</Text>
              </View>
              <View style={styles.rowBody}>
                <View style={styles.rowMeta}>
                  {item && kind && (
                    <Badge label={KIND_LABELS[item.kind]} fg={kind.fg} bg={kind.bg} caps />
                  )}
                  <Text style={styles.period}>
                    {r.ongoing ? monthsLabel(r.months) : `${monthsLabel(r.months)}で終了`}
                  </Text>
                </View>
                <Text style={styles.itemName} numberOfLines={2}>
                  {item?.name ?? '…'}
                </Text>
                <Stars score={r.stars} size={11} />
              </View>
              <View style={[styles.status, r.ongoing ? styles.ongoing : styles.stopped]}>
                <Text style={[styles.statusText, r.ongoing && styles.ongoingText]}>
                  {r.ongoing ? '継続中' : 'やめた'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={14} color={colors.inkMuted} />
            </Pressable>
          </Link>
        );
      })}
    </View>
  );
}

function Kpi({ value, unit, label }: { value: string; unit?: string; label: string }) {
  return (
    <View style={styles.kpi}>
      <Text style={styles.kpiValue}>
        {value}
        {unit && <Text style={styles.kpiUnit}>{unit}</Text>}
      </Text>
      <Text style={styles.kpiLabel}>{label}</Text>
    </View>
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
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
  },
  emptyIcon: {
    fontSize: 44,
  },
  emptyTitle: {
    ...typography.titleLg,
    color: colors.ink,
  },
  emptyText: {
    ...typography.bodySm,
    color: colors.inkMuted,
    textAlign: 'center',
  },
  buttons: {
    gap: spacing.sm,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: spacing.base,
    alignItems: 'center',
  },
  primaryButtonText: {
    ...typography.titleMd,
    color: colors.surface,
  },
  ghostButton: {
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.lg,
    paddingVertical: spacing.base,
    alignItems: 'center',
  },
  ghostButtonText: {
    ...typography.titleMd,
    color: colors.primary,
  },
  steps: {
    gap: 0,
  },
  step: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  stepRail: {
    alignItems: 'center',
    width: 12,
  },
  stepDot: {
    width: 10,
    height: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    marginTop: 6,
  },
  stepLine: {
    flex: 1,
    width: 2,
    backgroundColor: colors.primarySoft,
  },
  stepBody: {
    flex: 1,
    gap: 2,
    paddingBottom: spacing.base,
  },
  stepTitle: {
    ...typography.titleMd,
    fontSize: 14,
    color: colors.ink,
  },
  stepText: {
    ...typography.bodySm,
    color: colors.inkMuted,
  },
  profile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    ...typography.titleLg,
    color: colors.surface,
  },
  profileBody: {
    flex: 1,
    gap: 2,
  },
  nickname: {
    ...typography.titleLg,
    color: colors.ink,
  },
  summary: {
    ...typography.caption,
    color: colors.inkMuted,
  },
  goals: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.sm,
  },
  link: {
    ...typography.bodySm,
    fontFamily: fontFamily.bodyBold,
    color: colors.primary,
  },
  kpis: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  kpi: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
  },
  kpiValue: {
    ...typography.displayMd,
    color: colors.ink,
  },
  kpiUnit: {
    ...typography.caption,
    color: colors.ink,
  },
  kpiLabel: {
    ...typography.caption,
    color: colors.inkMuted,
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.lg,
    padding: spacing.base,
    gap: spacing.sm,
  },
  cardText: {
    ...typography.bodySm,
    color: colors.ink,
  },
  strong: {
    fontFamily: fontFamily.bodyBold,
    color: colors.primary,
  },
  list: {
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
  },
  divider: {
    borderBottomColor: colors.line,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  thumb: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.tint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbEmoji: {
    fontSize: 20,
  },
  rowBody: {
    flex: 1,
    gap: 2,
  },
  rowMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  period: {
    ...typography.caption,
    color: colors.inkMuted,
  },
  itemName: {
    ...typography.titleMd,
    fontSize: 14,
    lineHeight: 20,
    color: colors.ink,
  },
  status: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  ongoing: {
    backgroundColor: semantic.success,
  },
  stopped: {
    backgroundColor: colors.tint,
  },
  statusText: {
    ...typography.caption,
    color: colors.inkMuted,
  },
  ongoingText: {
    color: colors.surface,
  },
});
