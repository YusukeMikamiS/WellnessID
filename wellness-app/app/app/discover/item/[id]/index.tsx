/**
 * ⑩ 詳細（商品・店舗・専門家で共通）
 *
 * 上から：画像 → 種別・ブランド → 名前 → 評価と口コミ件数 → 価格
 * → 指標（いまも継続中・近い人の口コミ・1年以上継続）→ 外部導線 → 悩み・目的タグ
 * → 評価の分布 → 口コミ（新しい2件）→ 口コミを書く
 *
 * 【規約】一覧・詳細は1セットで実装する。kind で出し分けるのは固有情報と外部導線だけ（CLAUDE.md §7.2）。
 * 集計値（平均・件数・継続率・分布・1年以上継続）は Functions が書いた値をそのまま出す。
 */

import Ionicons from '@expo/vector-icons/Ionicons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, Stack, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { discover, onboard, review } from '@/api';
import { ExternalLinks } from '@/components/item/ExternalLinks';
import { FavoriteButton } from '@/components/item/FavoriteButton';
import { StarDistribution } from '@/components/item/StarDistribution';
import { ReviewCard, toReviewCardData } from '@/components/review/ReviewCard';
import { Badge } from '@/components/ui/Badge';
import { QueryState } from '@/components/ui/QueryState';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Stars } from '@/components/ui/Stars';
import { KIND_LABELS, sampleLabel } from '@/lib/labels';
import { profileCohort, useProfileStore } from '@/stores/profile';
import { useSession, withoutBlocked } from '@/stores/session';
import { colors, elevation, kindColors, radius, spacing, typography } from '@/theme/tokens';
import { cohortKey, OPERATOR_OWNED_BADGE } from '@/types';

const PREVIEW_REVIEW_COUNT = 2;

export default function ItemScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const myUid = useSession((s) => s.user?.uid);
  const blockedUids = useSession((s) => s.blockedUids);
  // 自分の口コミの削除（集計から外れるので、平均点・件数・一覧を取り直す）
  const deleteOwn = (itemId: string, reviewId: string) => async () => {
    await review.deleteReview(itemId, reviewId);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['items'] }),
      queryClient.invalidateQueries({ queryKey: ['reviews'] }),
    ]);
  };
  const myCohort = profileCohort(useProfileStore((s) => s.profile));

  const itemQuery = useQuery(discover.itemQuery(id));
  const item = itemQuery.data;
  const categories = useQuery(discover.categoriesQuery);
  const concerns = useQuery(onboard.concernsQuery);
  const reviews = useQuery(review.itemReviewsQuery(id));
  const service = useQuery({
    ...discover.serviceDetailQuery(id),
    enabled: item?.kind === 'service',
  });
  const pro = useQuery({ ...discover.proDetailQuery(id), enabled: item?.kind === 'pro' });
  const belongsToId = pro.data?.belongsToItemId;
  const belongsTo = useQuery({
    ...discover.itemQuery(belongsToId ?? ''),
    enabled: belongsToId != null,
  });

  if (!item) {
    return (
      <View style={styles.root}>
        <QueryState
          subject="アイテム"
          isPending={itemQuery.isPending}
          error={itemQuery.error}
          onRetry={() => void itemQuery.refetch()}
        />
        {itemQuery.data === null && <Text style={styles.empty}>見つかりませんでした。</Text>}
      </View>
    );
  }

  const category = categories.data?.get(item.categoryId);
  const kind = kindColors[item.kind];
  const nearN = myCohort ? (item.cohortScores[myCohort]?.n ?? 0) : null;
  const goalName = (cid: string) => concerns.data?.find((c) => c.id === cid)?.name ?? cid;
  const itemConcerns = (concerns.data ?? []).filter((c) => item.concernIds.includes(c.id));
  const price =
    item.price != null
      ? `¥${item.price.toLocaleString('ja-JP')}${item.kind === 'product' ? '' : '〜'}`
      : null;

  return (
    <>
      <Stack.Screen
        options={{ title: '詳細', headerRight: () => <FavoriteButton itemId={item.id} /> }}
      />
      <ScrollView
        style={styles.root}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]}
      >
        <View style={styles.hero}>
          <Text style={styles.heroEmoji}>{category?.emoji ?? '・'}</Text>
        </View>

        <View style={styles.headline}>
          <View style={styles.meta}>
            <Badge label={KIND_LABELS[item.kind]} fg={kind.fg} bg={kind.bg} caps />
            <Text style={styles.metaText} numberOfLines={1}>
              {[item.brand, category?.name].filter(Boolean).join(' ／ ')}
            </Text>
          </View>
          <Text style={styles.name}>{item.name}</Text>
          {item.operatorOwned && (
            <Badge label={OPERATOR_OWNED_BADGE} fg={colors.primaryStrong} bg={colors.primarySoft} />
          )}
          <View style={styles.scoreRow}>
            {item.reviewCount > 0 ? (
              <>
                <Stars score={item.avgScore} size={18} />
                <Text style={styles.sample}>
                  口コミ {sampleLabel(item.reviewCount, item.solicitedCount).replace('n=', '')}
                </Text>
              </>
            ) : (
              <Text style={styles.sample}>口コミはまだありません</Text>
            )}
          </View>
          {price && <Text style={styles.price}>{price}</Text>}
        </View>

        <View style={styles.stats}>
          <Stat value={`${Math.round(item.repeatRate * 100)}`} unit="%" label="いまも継続中" />
          <Stat value={nearN != null ? String(nearN) : '—'} label="近い人の口コミ" />
          <Stat value={String(item.longTermCount)} label="1年以上継続" />
        </View>

        <ExternalLinks
          item={item}
          service={service.data}
          pro={pro.data}
          {...(belongsTo.data ? { belongsToName: belongsTo.data.name } : {})}
        />

        {itemConcerns.length > 0 && (
          <View>
            <SectionHeader title="この悩み・目的で選ばれています" />
            <View style={styles.chips}>
              {itemConcerns.map((c) => (
                <Link
                  key={c.id}
                  href={{ pathname: '/discover/concern/[id]', params: { id: c.id } }}
                  style={styles.chip}
                >
                  {c.emoji} {c.name}
                </Link>
              ))}
            </View>
          </View>
        )}

        {item.reviewCount > 0 && (
          <View>
            <SectionHeader title="評価の分布" />
            <StarDistribution counts={item.starCounts} />
          </View>
        )}

        <View>
          <SectionHeader
            title={`口コミ（${item.reviewCount}件）`}
            {...(item.reviewCount > 0 && {
              action: {
                label: 'すべて見る',
                href: { pathname: '/discover/item/[id]/reviews', params: { id: item.id } },
              },
            })}
          />
          <QueryState
            subject="口コミ"
            isPending={reviews.isPending}
            error={reviews.error}
            onRetry={() => void reviews.refetch()}
          />
          <View style={styles.reviews}>
            {withoutBlocked(reviews.data ?? [], blockedUids)
              .slice(0, PREVIEW_REVIEW_COUNT)
              .map((r) => (
                <ReviewCard
                  key={r.id}
                  review={toReviewCardData(r, item)}
                  goalName={goalName}
                  near={
                    myCohort != null &&
                    cohortKey(r.authorSnapshot.ageBand, r.authorSnapshot.gender) === myCohort
                  }
                  showItem={false}
                  {...(myUid != null && r.uid === myUid && { onDelete: deleteOwn(r.itemId, r.id) })}
                />
              ))}
          </View>
        </View>

        <Link href={{ pathname: '/discover/item/[id]/post', params: { id: item.id } }} asChild>
          <Text style={StyleSheet.flatten([styles.postButton, elevation.card])}>
            <Ionicons name="create-outline" size={16} color={colors.surface} /> 口コミを書く
          </Text>
        </Link>
      </ScrollView>
    </>
  );
}

function Stat({ value, unit, label }: { value: string; unit?: string; label: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>
        {value}
        {unit && <Text style={styles.statUnit}>{unit}</Text>}
      </Text>
      <Text style={styles.statLabel}>{label}</Text>
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
    ...typography.body,
    color: colors.inkMuted,
    textAlign: 'center',
    padding: spacing.lg,
  },
  hero: {
    height: 180,
    borderRadius: radius.lg,
    backgroundColor: colors.tint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroEmoji: {
    fontSize: 64,
  },
  headline: {
    gap: spacing.xs,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  metaText: {
    ...typography.caption,
    color: colors.inkMuted,
    flexShrink: 1,
  },
  name: {
    ...typography.titleLg,
    color: colors.ink,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  sample: {
    ...typography.bodySm,
    color: colors.inkMuted,
  },
  price: {
    ...typography.numeric,
    fontSize: 20,
    lineHeight: 28,
    color: colors.ink,
  },
  stats: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
  },
  statValue: {
    ...typography.displayMd,
    color: colors.ink,
  },
  statUnit: {
    ...typography.caption,
    color: colors.ink,
  },
  statLabel: {
    ...typography.caption,
    color: colors.inkMuted,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    ...typography.bodySm,
    color: colors.ink,
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.pill,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    overflow: 'hidden',
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
  },
});
