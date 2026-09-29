/**
 * ランキングの1行（商品・店舗・専門家で共通）
 *
 * 【規約】母数 n を必ず表示する。依頼・関係者の投稿があれば内訳も併記する（CLAUDE.md §3-7・TODO-B）。
 * 甲の自社商品（operatorOwned）には自社バッジを常に出す。「1位」などのタグは付けない。
 * Link asChild の子（Pressable）にはスタイルを配列で渡せないので、StyleSheet.flatten で平らにする。
 */

import Ionicons from '@expo/vector-icons/Ionicons';
import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { sampleLabel, KIND_LABELS } from '@/lib/labels';
import { colors, kindColors, radius, semantic, spacing, typography } from '@/theme/tokens';
import { type Item, OPERATOR_OWNED_BADGE } from '@/types';

import { Badge } from '../ui/Badge';
import { Stars } from '../ui/Stars';

interface Props {
  rank: number;
  item: Item;
  /** 画像がないときに出す絵文字（カテゴリの絵文字） */
  emoji: string;
  score: number;
  n: number;
  solicitedN: number;
  /** 「近い人」の評価を出しているか。false なら総合評価へのフォールバック */
  near?: boolean;
  /** 最後の行は下線を引かない */
  last?: boolean;
}

const RANK_COLORS = [colors.primary, colors.inkMuted, colors.ink];

export function RankingRow({ rank, item, emoji, score, n, solicitedN, near, last }: Props) {
  const kind = kindColors[item.kind];
  const rankColor = RANK_COLORS[rank - 1];
  return (
    <Link href={{ pathname: '/discover/item/[id]', params: { id: item.id } }} asChild>
      <Pressable style={StyleSheet.flatten([styles.row, !last && styles.divider])}>
        {rankColor ? (
          <View style={[styles.rank, { backgroundColor: rankColor }]}>
            <Text style={styles.rankText}>{rank}</Text>
          </View>
        ) : (
          <Text style={styles.rankPlain}>{rank}</Text>
        )}

        <View style={styles.thumb}>
          <Text style={styles.thumbEmoji}>{emoji}</Text>
        </View>

        <View style={styles.body}>
          <View style={styles.meta}>
            <Badge label={KIND_LABELS[item.kind]} fg={kind.fg} bg={kind.bg} caps />
            {item.brand != null && (
              <Text style={styles.brand} numberOfLines={1}>
                {item.brand}
              </Text>
            )}
          </View>
          <Text style={styles.name} numberOfLines={2}>
            {item.name}
          </Text>
          <View style={styles.scoreRow}>
            <Stars score={score} />
            <Text style={styles.sample}>{sampleLabel(n, solicitedN)}</Text>
          </View>
          {(near != null || item.operatorOwned) && (
            <View style={styles.badges}>
              {near === true && (
                <Badge label="近い人" fg={semantic.success} bg={kindColors.service.bg} />
              )}
              {near === false && <Badge label="総合評価" />}
              {item.operatorOwned && (
                <Badge
                  label={OPERATOR_OWNED_BADGE}
                  fg={colors.primaryStrong}
                  bg={colors.primarySoft}
                />
              )}
            </View>
          )}
        </View>

        <Ionicons name="chevron-forward" size={16} color={colors.inkMuted} />
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
  },
  divider: {
    borderBottomColor: colors.line,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rank: {
    width: 26,
    height: 26,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: {
    ...typography.numeric,
    fontSize: 13,
    color: colors.surface,
  },
  rankPlain: {
    ...typography.numeric,
    width: 26,
    textAlign: 'center',
    color: colors.inkMuted,
  },
  thumb: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    backgroundColor: colors.tint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbEmoji: {
    fontSize: 24,
  },
  body: {
    flex: 1,
    gap: 2,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  brand: {
    ...typography.caption,
    color: colors.inkMuted,
    flexShrink: 1,
  },
  name: {
    ...typography.titleMd,
    fontSize: 15,
    lineHeight: 22,
    color: colors.ink,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    columnGap: spacing.sm,
  },
  sample: {
    ...typography.caption,
    color: colors.inkMuted,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: 2,
  },
});
