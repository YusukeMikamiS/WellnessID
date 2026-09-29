/**
 * アイテムのカード（2列の一覧用。商品・店舗・専門家で共通）
 *
 * 【規約】母数 n を必ず出す。依頼・関係者の投稿があれば内訳も併記する（TODO-B）。
 * 甲の自社商品には自社バッジを常に出す。「人気No.1」などの順位タグは付けない。
 */

import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { KIND_LABELS, sampleLabel } from '@/lib/labels';
import { colors, elevation, kindColors, radius, spacing, typography } from '@/theme/tokens';
import { type Item, OPERATOR_OWNED_BADGE } from '@/types';

import { Badge } from '../ui/Badge';
import { Stars } from '../ui/Stars';

export function ItemCard({ item, emoji }: { item: Item; emoji: string }) {
  const kind = kindColors[item.kind];
  const price =
    item.price != null
      ? `¥${item.price.toLocaleString('ja-JP')}${item.kind === 'product' ? '' : '〜'}`
      : null;
  return (
    <Link href={{ pathname: '/discover/item/[id]', params: { id: item.id } }} asChild>
      <Pressable style={StyleSheet.flatten([styles.card, elevation.card])}>
        <View style={styles.thumb}>
          <Text style={styles.thumbEmoji}>{emoji}</Text>
          <View style={styles.kind}>
            <Badge label={KIND_LABELS[item.kind]} fg={kind.fg} bg={kind.bg} caps />
          </View>
        </View>
        <View style={styles.body}>
          {item.brand != null && (
            <Text style={styles.brand} numberOfLines={1}>
              {item.brand}
            </Text>
          )}
          <Text style={styles.name} numberOfLines={2}>
            {item.name}
          </Text>
          {item.reviewCount > 0 ? (
            <>
              <Stars score={item.avgScore} size={11} />
              <Text style={styles.sample}>
                {sampleLabel(item.reviewCount, item.solicitedCount)}
              </Text>
            </>
          ) : (
            <Text style={styles.sample}>口コミはまだありません</Text>
          )}
          {price && <Text style={styles.price}>{price}</Text>}
          {item.operatorOwned && (
            <Badge label={OPERATOR_OWNED_BADGE} fg={colors.primaryStrong} bg={colors.primarySoft} />
          )}
        </View>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '48.5%',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  thumb: {
    height: 110,
    backgroundColor: colors.tint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbEmoji: {
    fontSize: 36,
  },
  kind: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
  },
  body: {
    padding: spacing.md,
    gap: 3,
  },
  brand: {
    ...typography.caption,
    color: colors.inkMuted,
  },
  name: {
    ...typography.titleMd,
    fontSize: 14,
    lineHeight: 20,
    color: colors.ink,
  },
  sample: {
    ...typography.caption,
    color: colors.inkMuted,
  },
  price: {
    ...typography.numeric,
    color: colors.ink,
  },
});
