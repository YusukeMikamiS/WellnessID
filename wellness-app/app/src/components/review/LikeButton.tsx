/**
 * 「参考になった」ボタン
 *
 * - 未ログイン：押すとログイン画面へ
 * - 自分の口コミ：件数だけ出す（押せない）
 * - それ以外：押すと付け外しする（toggleLike）。表示は先に切り替え、失敗したら元に戻す
 */

import Ionicons from '@expo/vector-icons/Ionicons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { review as reviewApi } from '@/api';
import { useSession } from '@/stores/session';
import { colors, semantic, spacing, typography } from '@/theme/tokens';

interface Props {
  itemId: string;
  reviewId: string;
  /** 口コミの投稿者（退会済みは null） */
  authorUid: string | null;
  likeCount: number;
}

export function LikeButton({ itemId, reviewId, authorUid, likeCount }: Props) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { status, user } = useSession();
  const myLikes = useQuery({
    ...reviewApi.myLikesQuery(user?.uid ?? ''),
    enabled: user != null,
  });
  // 押した直後の表示（サーバーの結果が返るまで、または一覧を読み直すまで使う）
  const [local, setLocal] = useState<{ liked: boolean; count: number } | null>(null);
  const [busy, setBusy] = useState(false);

  const liked = local?.liked ?? myLikes.data?.has(reviewId) ?? false;
  const count = local?.count ?? likeCount;
  const isOwn = user != null && authorUid === user.uid;

  const onPress = async () => {
    if (status !== 'signedIn') {
      router.push('/login');
      return;
    }
    if (isOwn || busy) return;
    const next = { liked: !liked, count: Math.max(0, count + (liked ? -1 : 1)) };
    setLocal(next);
    setBusy(true);
    try {
      const result = await reviewApi.toggleLike(itemId, reviewId);
      setLocal({ liked: result.liked, count: result.likeCount });
      void queryClient.invalidateQueries({ queryKey: ['likes'] });
    } catch {
      setLocal({ liked, count });
    } finally {
      setBusy(false);
    }
  };

  const label = `参考になった ${count}`;
  if (isOwn) {
    return (
      <Text style={styles.text}>
        <Ionicons name="heart-outline" size={13} color={colors.inkMuted} /> {label}
      </Text>
    );
  }
  return (
    <Pressable
      onPress={() => void onPress()}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityState={{ selected: liked, busy }}
      accessibilityLabel={liked ? '参考になったを取り消す' : '参考になった'}
      style={styles.button}
    >
      <Ionicons
        name={liked ? 'heart' : 'heart-outline'}
        size={14}
        color={liked ? semantic.danger : colors.inkMuted}
      />
      <Text style={[styles.text, liked && styles.likedText]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  text: {
    ...typography.caption,
    color: colors.inkMuted,
  },
  likedText: {
    color: semantic.danger,
  },
});
