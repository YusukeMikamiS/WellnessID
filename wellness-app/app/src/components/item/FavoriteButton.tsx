/**
 * お気に入りボタン（詳細画面の右上）
 *
 * 未ログインで押すとログイン画面へ。表示は先に切り替え、失敗したら元に戻す。
 */

import Ionicons from '@expo/vector-icons/Ionicons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { favorite } from '@/api';
import { useSession } from '@/stores/session';
import { colors, semantic, spacing } from '@/theme/tokens';

export function FavoriteButton({ itemId }: { itemId: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { status, user } = useSession();
  const favorites = useQuery({
    ...favorite.favoritesQuery(user?.uid ?? ''),
    enabled: user != null,
  });
  const [local, setLocal] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const isFavorite = local ?? favorites.data?.some((f) => f.itemId === itemId) ?? false;

  const onPress = async () => {
    if (status !== 'signedIn' || !user) {
      router.push('/login');
      return;
    }
    if (busy) return;
    const next = !isFavorite;
    setLocal(next);
    setBusy(true);
    try {
      if (next) await favorite.addFavorite(user.uid, itemId);
      else await favorite.removeFavorite(user.uid, itemId);
      await queryClient.invalidateQueries({ queryKey: ['favorites'] });
    } catch {
      setLocal(!next);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Pressable
      onPress={() => void onPress()}
      hitSlop={12}
      style={styles.button}
      accessibilityRole="button"
      accessibilityState={{ selected: isFavorite, busy }}
      accessibilityLabel={isFavorite ? 'お気に入りから外す' : 'お気に入りに追加'}
    >
      <Ionicons
        name={isFavorite ? 'heart' : 'heart-outline'}
        size={22}
        color={isFavorite ? semantic.danger : colors.ink}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    marginHorizontal: spacing.base,
  },
});
