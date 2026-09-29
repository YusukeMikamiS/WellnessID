/**
 * 口コミカード（構造化口コミ）
 *
 * 上から：投稿者（年代・性別・エリア・運動頻度）と星 → 対象アイテム → 投稿区分ラベル
 * → 構造化項目（目的・使用期間・購入先／知ったきっかけ・継続中か）→ 本文 → 参考になった／報告（通報・ブロック）
 *
 * 【規約】投稿区分ラベルは本文より上に出す（TODO-B）。投稿者の情報は authorSnapshot（投稿時点のコピー）を使う。
 */

import { Link } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import {
  AGE_BAND_LABELS,
  areaLabel,
  DISCOVERY_SOURCE_LABELS,
  EXERCISE_FREQ_LABELS,
  GENDER_LABELS,
  monthsLabel,
  PURCHASE_SOURCE_LABELS,
} from '@/lib/labels';
import { colors, kindColors, radius, semantic, spacing, typography } from '@/theme/tokens';
import type { Item, Review, ReviewIndexEntry } from '@/types';

import { Badge } from '../ui/Badge';
import { Stars } from '../ui/Stars';

import { LikeButton } from './LikeButton';
import { PostingLabel } from './PostingLabel';
import { ReviewMenu } from './ReviewMenu';

/**
 * カードに必要な項目。新着フィード（ReviewIndexEntry）はそのまま渡せる。
 * アイテムの口コミ（Review）は、アイテム名と自社フラグを足して渡す（toReviewCardData）。
 */
export type ReviewCardData = Omit<ReviewIndexEntry, 'itemImageUrl' | 'itemKind'>;

export function toReviewCardData(review: Review, item: Item): ReviewCardData {
  return { ...review, itemName: item.name, itemOperatorOwned: item.operatorOwned };
}

interface Props {
  review: ReviewCardData;
  /** 対象アイテムの絵文字（カテゴリの絵文字） */
  itemEmoji?: string;
  /** 悩みタグの ID → 表示名 */
  goalName: (concernId: string) => string;
  /** 自分と同じコホートの投稿者か */
  near: boolean;
  /** 対象アイテムへのリンクを出すか。アイテムの詳細・口コミ一覧では出さない */
  showItem?: boolean;
  /**
   * 自分の口コミのときだけ渡す。「削除」を出し、確認のうえで呼ぶ（TODO-A：退会前に1件ずつ消せる）。
   * 失敗したら例外を投げること（カードにエラーを出す）
   */
  onDelete?: () => Promise<void>;
}

const AVATAR_COLORS = [
  colors.primary,
  kindColors.service.fg,
  kindColors.pro.fg,
  semantic.danger,
  colors.primaryStrong,
];

function avatarColor(seed: string) {
  let sum = 0;
  for (const ch of seed) sum += ch.charCodeAt(0);
  return AVATAR_COLORS[sum % AVATAR_COLORS.length] ?? colors.primary;
}

export function ReviewCard({
  review,
  itemEmoji,
  goalName,
  near,
  showItem = true,
  onDelete,
}: Props) {
  const author = review.authorSnapshot;
  const [menuOpen, setMenuOpen] = useState(false);
  const meta = [
    `${AGE_BAND_LABELS[author.ageBand]}・${GENDER_LABELS[author.gender]}`,
    areaLabel(author.area),
    `運動 ${EXERCISE_FREQ_LABELS[author.exerciseFreq]}`,
  ].filter(Boolean);
  const source = review.purchaseSource
    ? { label: '購入先', value: PURCHASE_SOURCE_LABELS[review.purchaseSource] }
    : review.discoverySource
      ? { label: '知ったきっかけ', value: DISCOVERY_SOURCE_LABELS[review.discoverySource] }
      : null;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={[styles.avatar, { backgroundColor: avatarColor(author.nickname) }]}>
          <Text style={styles.avatarText}>{author.nickname.slice(0, 1).toUpperCase()}</Text>
        </View>
        <View style={styles.author}>
          <View style={styles.nameRow}>
            <Text style={styles.nickname} numberOfLines={1}>
              {author.nickname}
            </Text>
            {near && (
              <Badge label="あなたと近い" fg={semantic.success} bg={kindColors.service.bg} />
            )}
          </View>
          <Text style={styles.meta}>{meta.join(' ／ ')}</Text>
        </View>
        <Stars score={review.stars} showValue={false} />
      </View>

      {showItem && (
        <Link
          href={{ pathname: '/discover/item/[id]', params: { id: review.itemId } }}
          style={styles.item}
          numberOfLines={1}
        >
          {itemEmoji ? `${itemEmoji} ` : ''}
          {review.itemName} ›
        </Link>
      )}

      <PostingLabel category={review.postingCategory} operatorOwned={review.itemOperatorOwned} />

      <View style={styles.facts}>
        <View style={styles.factRow}>
          <Text style={styles.fact}>
            目的 <Text style={styles.factValue}>{review.goalTags.map(goalName).join('・')}</Text>
          </Text>
          <Text style={styles.fact}>
            使用期間 <Text style={styles.factValue}>{monthsLabel(review.months)}</Text>
          </Text>
        </View>
        <View style={styles.factRow}>
          {source && (
            <Text style={styles.fact}>
              {source.label} <Text style={styles.factValue}>{source.value}</Text>
            </Text>
          )}
          <View style={[styles.status, review.ongoing ? styles.ongoing : styles.stopped]}>
            <Text style={[styles.statusText, review.ongoing && styles.ongoingText]}>
              {review.ongoing ? 'いまも継続中' : 'やめた'}
            </Text>
          </View>
        </View>
      </View>

      <Text style={styles.text}>{review.text}</Text>

      <View style={styles.footer}>
        <LikeButton
          itemId={review.itemId}
          reviewId={review.id}
          authorUid={review.uid}
          likeCount={review.likeCount}
        />
        {onDelete ? (
          <DeleteAction onDelete={onDelete} />
        ) : (
          <Text
            style={styles.footerText}
            onPress={() => setMenuOpen(true)}
            accessibilityRole="button"
            accessibilityLabel="通報・ブロック"
          >
            … 報告
          </Text>
        )}
      </View>
      <ReviewMenu
        visible={menuOpen}
        onClose={() => setMenuOpen(false)}
        target={{
          itemId: review.itemId,
          reviewId: review.id,
          uid: review.uid,
          nickname: author.nickname,
        }}
      />
    </View>
  );
}

/** 自分の口コミの削除。1回目で確認、2回目で削除する */
function DeleteAction({ onDelete }: { onDelete: () => Promise<void> }) {
  const [step, setStep] = useState<'idle' | 'confirm' | 'deleting'>('idle');
  const [error, setError] = useState<string | null>(null);
  if (step === 'idle') {
    return (
      <Text style={styles.footerText} onPress={() => setStep('confirm')} accessibilityRole="button">
        削除
      </Text>
    );
  }
  return (
    <View style={styles.confirm}>
      <Text style={styles.footerText}>
        {step === 'deleting' ? '削除しています…' : 'この口コミを削除しますか？'}
      </Text>
      {step === 'confirm' && (
        <View style={styles.confirmRow}>
          <Text
            style={styles.footerText}
            onPress={() => setStep('idle')}
            accessibilityRole="button"
          >
            やめる
          </Text>
          <Text
            style={styles.deleteText}
            accessibilityRole="button"
            onPress={() => {
              setStep('deleting');
              setError(null);
              onDelete().catch(() => {
                setError('削除できませんでした。時間をおいてもう一度お試しください。');
                setStep('confirm');
              });
            }}
          >
            削除する
          </Text>
        </View>
      )}
      {error && <Text style={styles.deleteText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.lg,
    padding: spacing.base,
    gap: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    ...typography.titleMd,
    color: colors.surface,
  },
  author: {
    flex: 1,
    gap: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  nickname: {
    ...typography.titleMd,
    fontSize: 14,
    lineHeight: 20,
    color: colors.ink,
    flexShrink: 1,
  },
  meta: {
    ...typography.caption,
    color: colors.inkMuted,
  },
  item: {
    ...typography.bodySm,
    color: colors.primary,
  },
  facts: {
    backgroundColor: colors.bg,
    borderColor: colors.line,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.xs,
  },
  factRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  fact: {
    ...typography.caption,
    color: colors.inkMuted,
  },
  factValue: {
    ...typography.bodySm,
    color: colors.ink,
  },
  status: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    marginLeft: 'auto',
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
  text: {
    ...typography.body,
    color: colors.ink,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  confirm: {
    alignItems: 'flex-end',
    gap: 2,
  },
  confirmRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  deleteText: {
    ...typography.caption,
    color: semantic.danger,
  },
  footerText: {
    ...typography.caption,
    color: colors.inkMuted,
  },
});
