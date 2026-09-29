/**
 * ⑥ 探す
 *
 * キーワード検索 → 悩み・目的から探す（カテゴリを横断して比較）→ カテゴリから探す
 * キーワード検索は、名前・ブランドの部分一致（src/api/discover.ts の searchItems）。
 */

import Ionicons from '@expo/vector-icons/Ionicons';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'expo-router';
import { BottomTabBarHeightContext } from 'expo-router/tabs';
import { useContext, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { discover } from '@/api';
import { ConcernChipList } from '@/components/concern/ConcernChipList';
import { ItemCard } from '@/components/item/ItemCard';
import { QueryState } from '@/components/ui/QueryState';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { KIND_LABELS } from '@/lib/labels';
import { colors, radius, spacing, typography } from '@/theme/tokens';
import { ITEM_KINDS } from '@/types';

export default function SearchScreen() {
  const tabBarHeight = useContext(BottomTabBarHeightContext) ?? 0;
  const [keyword, setKeyword] = useState('');
  const categories = useQuery(discover.categoriesQuery);
  const allItems = useQuery({ ...discover.allItemsQuery, enabled: keyword.trim().length > 0 });
  const hits = useMemo(
    () => discover.searchItems(allItems.data ?? [], keyword),
    [allItems.data, keyword],
  );
  const searching = keyword.trim().length > 0;

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[styles.content, { paddingBottom: tabBarHeight + spacing.lg }]}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.searchBox}>
        <Ionicons name="search" size={18} color={colors.inkMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="商品・サービス・専門家を検索"
          placeholderTextColor={colors.inkMuted}
          value={keyword}
          onChangeText={setKeyword}
          returnKeyType="search"
          accessibilityLabel="キーワード検索"
        />
        {searching && (
          <Pressable onPress={() => setKeyword('')} hitSlop={8} accessibilityLabel="クリア">
            <Ionicons name="close-circle" size={18} color={colors.inkMuted} />
          </Pressable>
        )}
      </View>

      {searching && (
        <View>
          <SectionHeader title={`「${keyword.trim()}」の検索結果`} note={`${hits.length}件`} />
          <QueryState
            subject="アイテム"
            isPending={allItems.isPending}
            error={allItems.error}
            onRetry={() => void allItems.refetch()}
          />
          {allItems.data && hits.length === 0 && (
            <Text style={styles.empty}>
              該当がありません。下の「悩み・目的から探す」もお試しください。
            </Text>
          )}
          <View style={styles.grid}>
            {hits.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                emoji={categories.data?.get(item.categoryId)?.emoji ?? '・'}
              />
            ))}
          </View>
        </View>
      )}

      <View>
        <SectionHeader title="悩み・目的から探す" note="カテゴリを横断して比較します" />
        <ConcernChipList />
      </View>

      <View style={styles.categorySection}>
        <SectionHeader title="カテゴリから探す" />
        <QueryState
          subject="カテゴリ"
          isPending={categories.isPending}
          error={categories.error}
          onRetry={() => void categories.refetch()}
        />
        {ITEM_KINDS.map((kind) => {
          const list = [...(categories.data?.values() ?? [])].filter((c) => c.kind === kind);
          if (list.length === 0) return null;
          return (
            <View key={kind} style={styles.kindGroup}>
              <Text style={styles.kindTitle}>{KIND_LABELS[kind]}</Text>
              <View style={styles.categoryGrid}>
                {list.map((c) => (
                  <Link
                    key={c.id}
                    href={{ pathname: '/discover/category/[id]', params: { id: c.id } }}
                    asChild
                  >
                    <Pressable style={styles.category}>
                      <Text style={styles.categoryEmoji}>{c.emoji}</Text>
                      <Text style={styles.categoryName} numberOfLines={2}>
                        {c.name}
                      </Text>
                    </Pressable>
                  </Link>
                ))}
              </View>
            </View>
          );
        })}
      </View>
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
    gap: spacing.xl,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
  },
  searchInput: {
    ...typography.body,
    flex: 1,
    color: colors.ink,
    paddingVertical: spacing.md,
  },
  empty: {
    ...typography.bodySm,
    color: colors.inkMuted,
    paddingVertical: spacing.md,
  },
  // 2列：横の間隔は両端揃えで作る（ItemCard の幅 48.5% に gap を足すと折り返すため）
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: spacing.md,
    justifyContent: 'space-between',
  },
  categorySection: {
    gap: spacing.md,
  },
  kindGroup: {
    gap: spacing.sm,
  },
  kindTitle: {
    ...typography.caption,
    letterSpacing: 1,
    color: colors.inkMuted,
  },
  // 3列：幅 31.5% × 3 ＋ 間隔 2.75% × 2 ＝ 100%
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: spacing.sm,
    columnGap: '2.75%',
  },
  category: {
    width: '31.5%',
    minHeight: 76,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.md,
    padding: spacing.sm,
  },
  categoryEmoji: {
    fontSize: 22,
  },
  categoryName: {
    ...typography.caption,
    color: colors.ink,
    textAlign: 'center',
  },
});
