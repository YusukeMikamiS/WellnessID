/**
 * 外部導線（CLAUDE.md §7.5）
 *
 * - 商品       → Amazon ／ 楽天 ／ 公式
 * - 店舗       → 公式サイト ／ 電話 ／ 地図
 * - 専門家     → 所属店舗（アプリ内の詳細）／ 公式サイト
 *
 * 【規約】Linking.openURL を使う。アプリ内予約・アプリ内決済は作らない。
 * ⚠️ 人が必ずレビューする箇所（CLAUDE.md §9）：開く URL が正しいか、アフィリエイトの表示が必要ないか。
 */

import { Link } from 'expo-router';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '@/theme/tokens';
import type { Item, ProDetail, ServiceDetail } from '@/types';

interface LinkButton {
  key: string;
  title: string;
  sub: string;
  url: string;
}

function buttonsFor(item: Item, service?: ServiceDetail | null): LinkButton[] {
  const links = item.externalLinks ?? {};
  if (item.kind === 'product') {
    return [
      links.amazon && { key: 'amazon', title: 'Amazon', sub: 'で購入', url: links.amazon },
      links.rakuten && { key: 'rakuten', title: '楽天市場', sub: 'で購入', url: links.rakuten },
      links.official && {
        key: 'official',
        title: '公式サイト',
        sub: 'を見る',
        url: links.official,
      },
    ].filter((b): b is LinkButton => Boolean(b));
  }
  const official = service?.reserveUrl ?? service?.officialUrl ?? links.official;
  const buttons: (LinkButton | undefined)[] = [
    official
      ? {
          key: 'official',
          title: '公式サイト',
          sub: service?.reserveUrl ? 'で予約する' : 'を見る',
          url: official,
        }
      : undefined,
    service?.tel
      ? { key: 'tel', title: '電話', sub: 'で問い合わせ', url: `tel:${service.tel}` }
      : undefined,
    service?.lat != null && service.lng != null
      ? {
          key: 'map',
          title: '地図',
          sub: 'を見る',
          url: `https://www.google.com/maps/search/?api=1&query=${service.lat},${service.lng}`,
        }
      : undefined,
  ];
  return buttons.filter((b): b is LinkButton => b != null);
}

interface Props {
  item: Item;
  service?: ServiceDetail | null;
  pro?: ProDetail | null;
  /** 専門家の所属店舗の名前 */
  belongsToName?: string;
}

export function ExternalLinks({ item, service, pro, belongsToName }: Props) {
  const buttons = buttonsFor(item, service);
  return (
    <View style={styles.wrap}>
      {pro?.belongsToItemId && (
        <Link
          href={{ pathname: '/discover/item/[id]', params: { id: pro.belongsToItemId } }}
          style={styles.belongs}
        >
          所属：{belongsToName ?? '店舗'} ›
        </Link>
      )}
      {buttons.length > 0 && (
        <View style={styles.row}>
          {buttons.map((b) => (
            <Pressable
              key={b.key}
              style={styles.button}
              onPress={() => void Linking.openURL(b.url)}
              accessibilityRole="link"
            >
              <Text style={styles.title}>{b.title}</Text>
              <Text style={styles.sub}>{b.sub}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.sm,
  },
  belongs: {
    ...typography.bodySm,
    color: colors.primary,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  button: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
  },
  title: {
    ...typography.titleMd,
    fontSize: 14,
    lineHeight: 20,
    color: colors.ink,
  },
  sub: {
    ...typography.caption,
    color: colors.inkMuted,
  },
});
