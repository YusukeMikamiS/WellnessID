/**
 * 口コミカードの「… 報告」メニュー（通報・ブロック）
 *
 * App Store 審査要件（Guideline 1.2）：不適切な投稿を通報でき、投稿者をブロックできること。
 * - 通報：理由を選んで送る（reportReview）。運営が確認する
 * - ブロック：その投稿者の口コミを自分の画面に出さない。相手には知らせない。設定から解除できる
 */

import { Link } from 'expo-router';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text } from 'react-native';

import { block, review as reviewApi } from '@/api';
import { Button } from '@/components/ui/Button';
import { ChoiceChips } from '@/components/ui/ChoiceChips';
import { TextField } from '@/components/ui/TextField';
import { REPORT_REASON_LABELS } from '@/lib/labels';
import { setBlockedUids, useSession } from '@/stores/session';
import { colors, fontFamily, radius, semantic, spacing, typography } from '@/theme/tokens';
import { REPORT_MAX_DETAIL_LENGTH, REPORT_REASONS, type ReportReason } from '@/types';

interface Props {
  visible: boolean;
  onClose: () => void;
  target: { itemId: string; reviewId: string; uid: string | null; nickname: string };
}

type Step = 'menu' | 'report' | 'block' | 'reported' | 'blocked';

export function ReviewMenu({ visible, onClose, target }: Props) {
  const { status, user, blockedUids } = useSession();
  const [step, setStep] = useState<Step>('menu');
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [detail, setDetail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const close = () => {
    // ブロックした相手の口コミは、メニューを閉じてから画面から外す
    // （先に外すと、このカードごとメニューが消えて「ブロックしました」が見えないため）
    if (step === 'blocked' && target.uid) {
      setBlockedUids([...new Set([...blockedUids, target.uid])]);
    }
    setStep('menu');
    setReason(null);
    setDetail('');
    setError(null);
    onClose();
  };

  const sendReport = async () => {
    if (!reason) {
      setError('通報の理由を選んでください');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await reviewApi.reportReview({
        itemId: target.itemId,
        reviewId: target.reviewId,
        reason,
        detail: detail.trim() || null,
      });
      setStep('reported');
    } catch (e) {
      setError(reviewApi.postErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const doBlock = async () => {
    if (!user || !target.uid) return;
    setBusy(true);
    setError(null);
    try {
      await block.blockUser(user.uid, target.uid);
      setStep('blocked');
    } catch {
      setError('ブロックできませんでした。時間をおいてもう一度お試しください。');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
      <Pressable style={styles.backdrop} onPress={close} accessibilityLabel="閉じる">
        {/* 中身を押しても閉じないよう、シートでは押下を受け止める */}
        <Pressable style={styles.sheet} onPress={() => undefined}>
          {status !== 'signedIn' ? (
            <>
              <Text style={styles.title}>通報・ブロックにはログインが必要です</Text>
              <Link href="/login" onPress={close} style={styles.link}>
                ログインする ›
              </Link>
            </>
          ) : step === 'menu' ? (
            <>
              <Text style={styles.title}>{target.nickname} さんの口コミ</Text>
              <Option label="この口コミを通報する" onPress={() => setStep('report')} />
              {target.uid != null && (
                <Option label="この投稿者をブロックする" onPress={() => setStep('block')} />
              )}
            </>
          ) : step === 'report' ? (
            <>
              <Text style={styles.title}>通報の理由</Text>
              <ChoiceChips
                options={REPORT_REASONS.map((r) => ({ value: r, label: REPORT_REASON_LABELS[r] }))}
                selected={reason ? [reason] : []}
                onChange={([r]) => {
                  setReason(r ?? null);
                  setError(null);
                }}
              />
              <TextField
                label="補足（任意）"
                multiline
                maxLength={REPORT_MAX_DETAIL_LENGTH}
                placeholder="気になった点があれば書いてください"
                value={detail}
                onChangeText={setDetail}
              />
              {error && <Text style={styles.error}>{error}</Text>}
              <Button label="通報する" onPress={() => void sendReport()} loading={busy} />
              <Text style={styles.note}>
                通報は運営が確認し、ガイドラインに反する場合は非表示にします。通報したことは投稿者には知らされません。
              </Text>
            </>
          ) : step === 'block' ? (
            <>
              <Text style={styles.title}>{target.nickname} さんをブロックしますか？</Text>
              <Text style={styles.body}>
                ブロックすると、この投稿者の口コミがあなたの画面に表示されなくなります。
                相手には知らされません。設定からいつでも解除できます。
              </Text>
              {error && <Text style={styles.error}>{error}</Text>}
              <Button
                label="ブロックする"
                variant="danger"
                onPress={() => void doBlock()}
                loading={busy}
              />
            </>
          ) : (
            <Text style={styles.title}>
              {step === 'reported'
                ? '通報を受け付けました。運営が内容を確認します。'
                : 'ブロックしました。この投稿者の口コミは表示されなくなります。'}
            </Text>
          )}
          <Text style={styles.close} onPress={close} accessibilityRole="button">
            閉じる
          </Text>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function Option({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable style={styles.option} onPress={onPress} accessibilityRole="button">
      <Text style={styles.optionText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: semantic.overlay,
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.md,
  },
  title: {
    ...typography.titleMd,
    color: colors.ink,
  },
  body: {
    ...typography.bodySm,
    color: colors.ink,
  },
  option: {
    paddingVertical: spacing.md,
    borderBottomColor: colors.line,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  optionText: {
    ...typography.body,
    color: colors.ink,
  },
  link: {
    ...typography.bodySm,
    fontFamily: fontFamily.bodyBold,
    color: colors.primary,
  },
  note: {
    ...typography.caption,
    color: colors.inkMuted,
  },
  error: {
    ...typography.bodySm,
    color: semantic.danger,
  },
  close: {
    ...typography.bodySm,
    color: colors.inkMuted,
    textAlign: 'center',
    paddingVertical: spacing.sm,
  },
});
