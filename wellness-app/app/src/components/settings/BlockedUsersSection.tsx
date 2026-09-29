/**
 * 設定画面：ブロックしたユーザー（App Store 審査要件・CLAUDE.md §7.6）
 *
 * 表示名は相手の口コミの表示名を使う（他人のプロフィールは読めないため）。
 */

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { block } from '@/api';
import { setBlockedUids, useSession } from '@/stores/session';
import { colors, radius, semantic, spacing, typography } from '@/theme/tokens';

export function BlockedUsersSection() {
  const { status, blockedUids } = useSession();
  if (status !== 'signedIn') return null;
  return (
    <View style={styles.card}>
      <Text style={styles.title}>ブロックしたユーザー</Text>
      {blockedUids.length === 0 ? (
        <Text style={styles.empty}>ブロックしているユーザーはいません。</Text>
      ) : (
        blockedUids.map((uid) => <BlockedRow key={uid} uid={uid} />)
      )}
    </View>
  );
}

function BlockedRow({ uid }: { uid: string }) {
  const { user, blockedUids } = useSession();
  const nickname = useQuery({
    queryKey: ['nickname', uid],
    queryFn: () => block.getNicknameOf(uid),
    staleTime: 10 * 60 * 1000,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const unblock = async () => {
    if (!user) return;
    setBusy(true);
    setError(null);
    try {
      await block.unblockUser(user.uid, uid);
      setBlockedUids(blockedUids.filter((u) => u !== uid));
    } catch {
      setError('解除できませんでした。');
      setBusy(false);
    }
  };

  return (
    <View style={styles.row}>
      <Text style={styles.name} numberOfLines={1}>
        {nickname.data ?? (nickname.isPending ? '…' : '（口コミが見つからないユーザー）')}
      </Text>
      <Text
        style={styles.unblock}
        onPress={busy ? undefined : () => void unblock()}
        accessibilityRole="button"
      >
        {busy ? '解除しています…' : 'ブロックを解除'}
      </Text>
      {error && <Text style={styles.error}>{error}</Text>}
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
    marginTop: spacing.md,
  },
  title: {
    ...typography.titleMd,
    color: colors.ink,
  },
  empty: {
    ...typography.bodySm,
    color: colors.inkMuted,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderTopColor: colors.line,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  name: {
    ...typography.body,
    color: colors.ink,
    flexShrink: 1,
  },
  unblock: {
    ...typography.bodySm,
    color: colors.primary,
  },
  error: {
    ...typography.caption,
    color: semantic.danger,
    width: '100%',
  },
});
