/**
 * ⑫ 口コミを投稿
 *
 * 必須：星 ／ 目的タグ ／ 使用期間 ／ 継続中か ／ 購入先（商品）または知ったきっかけ（店舗・専門家）／ 本文（20文字以上）
 * 任意：写真（未対応）／ 利害関係の自己申告（チェックすると「PR（関係者による投稿）」になる）
 *
 * 入力チェックは Functions と同じスキーマ（types/schemas.ts）。送信は Callable postReview。
 * 投稿区分はサーバーが決める。画面からは送らない（TODO-B）。
 */

import Ionicons from '@expo/vector-icons/Ionicons';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { type ReactNode, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { discover, onboard, review } from '@/api';
import { StarPicker } from '@/components/review/StarPicker';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ChoiceChips } from '@/components/ui/ChoiceChips';
import { QueryState } from '@/components/ui/QueryState';
import { TextField } from '@/components/ui/TextField';
import { DISCOVERY_SOURCE_LABELS, KIND_LABELS, PURCHASE_SOURCE_LABELS } from '@/lib/labels';
import { useSession } from '@/stores/session';
import {
  colors,
  fontFamily,
  kindColors,
  radius,
  semantic,
  spacing,
  typography,
} from '@/theme/tokens';
import {
  DISCOVERY_SOURCES,
  PURCHASE_SOURCES,
  REVIEW_MAX_TEXT_LENGTH,
  REVIEW_MIN_TEXT_LENGTH,
  type ReviewDraftInput,
  reviewDraftSchema,
  sourceError,
} from '@/types';

/** 使用期間のよく使う値（月数） */
const MONTH_PRESETS = [
  { value: '1', label: '1ヶ月' },
  { value: '3', label: '3ヶ月' },
  { value: '6', label: '半年' },
  { value: '12', label: '1年' },
  { value: '24', label: '2年' },
  { value: '36', label: '3年' },
] as const;

export default function PostReviewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const status = useSession((s) => s.status);

  const item = useQuery(discover.itemQuery(id));
  const categories = useQuery(discover.categoriesQuery);
  const concerns = useQuery(onboard.concernsQuery);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    setError,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ReviewDraftInput>({
    resolver: zodResolver(reviewDraftSchema),
    defaultValues: {
      itemId: id,
      stars: 0,
      goalTags: [],
      // 未入力で始めたいので undefined（送信時にスキーマが「使用期間を入力してください」で止める）
      months: undefined as unknown as number,
      ongoing: true,
      purchaseSource: null,
      discoverySource: null,
      affiliationDeclared: false,
      text: '',
      photos: [],
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    if (!item.data) return;
    setSubmitError(null);
    const sourceMessage = sourceError(item.data.kind, values);
    if (sourceMessage) {
      setError(item.data.kind === 'product' ? 'purchaseSource' : 'discoverySource', {
        message: sourceMessage,
      });
      return;
    }
    try {
      await review.postReview(values);
      // 平均点・件数・口コミ一覧・新着を取り直す（ランキングは週次の集計まで変わらない）
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['items'] }),
        queryClient.invalidateQueries({ queryKey: ['reviews'] }),
      ]);
      if (router.canGoBack()) router.back();
      else router.replace({ pathname: '/discover/item/[id]', params: { id } });
    } catch (error) {
      setSubmitError(review.postErrorMessage(error));
    }
  });

  if (status !== 'signedIn') {
    return (
      <View style={[styles.root, styles.gate]}>
        <Stack.Screen options={{ title: '口コミを投稿' }} />
        <Ionicons name="lock-closed-outline" size={28} color={colors.inkMuted} />
        <Text style={styles.gateText}>口コミの投稿にはログインが必要です。</Text>
        <Link href="/login" asChild>
          <Pressable style={styles.gateButton}>
            <Text style={styles.gateButtonText}>ログイン</Text>
          </Pressable>
        </Link>
        <Link href="/signup" style={styles.link}>
          新規登録（無料）はこちら ›
        </Link>
      </View>
    );
  }

  if (!item.data) {
    return (
      <View style={styles.root}>
        <QueryState
          subject="アイテム"
          isPending={item.isPending}
          error={item.error}
          onRetry={() => void item.refetch()}
        />
      </View>
    );
  }

  const target = item.data;
  const kind = kindColors[target.kind];
  const isProduct = target.kind === 'product';
  const text = watch('text');
  // このアイテムに紐づく悩みを先に並べる
  const goalOptions = [...(concerns.data ?? [])]
    .sort(
      (a, b) => Number(target.concernIds.includes(b.id)) - Number(target.concernIds.includes(a.id)),
    )
    .map((c) => ({ value: c.id, label: c.name }));

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Stack.Screen options={{ title: '口コミを投稿' }} />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.target}>
          <View style={styles.thumb}>
            <Text style={styles.thumbEmoji}>
              {categories.data?.get(target.categoryId)?.emoji ?? '・'}
            </Text>
          </View>
          <View style={styles.targetBody}>
            <View style={styles.targetMeta}>
              <Badge label={KIND_LABELS[target.kind]} fg={kind.fg} bg={kind.bg} caps />
              {target.brand != null && <Text style={styles.caption}>{target.brand}</Text>}
            </View>
            <Text style={styles.targetName}>{target.name}</Text>
          </View>
        </View>

        <Field label="総合評価" error={errors.stars?.message}>
          <Controller
            control={control}
            name="stars"
            render={({ field }) => <StarPicker value={field.value} onChange={field.onChange} />}
          />
        </Field>

        <Field label="使った目的（複数選択可）" error={errors.goalTags?.message}>
          <Controller
            control={control}
            name="goalTags"
            render={({ field }) => (
              <ChoiceChips
                multiple
                options={goalOptions}
                selected={field.value}
                onChange={field.onChange}
              />
            )}
          />
        </Field>

        <Field label="使用（利用）期間" error={errors.months?.message}>
          <Controller
            control={control}
            name="months"
            render={({ field }) => (
              <View style={styles.monthsWrap}>
                <ChoiceChips
                  options={MONTH_PRESETS}
                  selected={field.value ? [String(field.value)] : []}
                  onChange={([v]) => field.onChange(v ? Number(v) : undefined)}
                />
                <View style={styles.monthsInput}>
                  <TextField
                    label="月数で入力（1ヶ月未満は1）"
                    keyboardType="number-pad"
                    placeholder="例：14"
                    value={field.value ? String(field.value) : ''}
                    onChangeText={(t) => {
                      const digits = t.replace(/[^0-9]/g, '');
                      field.onChange(digits ? Number(digits) : undefined);
                    }}
                  />
                </View>
              </View>
            )}
          />
        </Field>

        <Field label="いまも続けていますか">
          <Controller
            control={control}
            name="ongoing"
            render={({ field }) => (
              <ChoiceChips
                options={[
                  { value: 'yes', label: '続けている' },
                  { value: 'no', label: 'やめた' },
                ]}
                selected={[field.value ? 'yes' : 'no']}
                onChange={([v]) => v && field.onChange(v === 'yes')}
              />
            )}
          />
        </Field>

        {isProduct ? (
          <Field label="購入先" error={errors.purchaseSource?.message}>
            <Controller
              control={control}
              name="purchaseSource"
              render={({ field }) => (
                <ChoiceChips
                  options={PURCHASE_SOURCES.map((v) => ({
                    value: v,
                    label: PURCHASE_SOURCE_LABELS[v],
                  }))}
                  selected={field.value ? [field.value] : []}
                  onChange={([v]) => field.onChange(v ?? null)}
                />
              )}
            />
          </Field>
        ) : (
          <Field label="知ったきっかけ" error={errors.discoverySource?.message}>
            <Controller
              control={control}
              name="discoverySource"
              render={({ field }) => (
                <ChoiceChips
                  options={DISCOVERY_SOURCES.map((v) => ({
                    value: v,
                    label: DISCOVERY_SOURCE_LABELS[v],
                  }))}
                  selected={field.value ? [field.value] : []}
                  onChange={([v]) => field.onChange(v ?? null)}
                />
              )}
            />
          </Field>
        )}

        <Controller
          control={control}
          name="text"
          render={({ field }) => (
            <TextField
              label="口コミ本文"
              multiline
              textAlignVertical="top"
              maxLength={REVIEW_MAX_TEXT_LENGTH}
              placeholder={`続けてみて感じたこと、変化、合わなかった点などを書いてください（${REVIEW_MIN_TEXT_LENGTH}文字以上）`}
              style={styles.textArea}
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={errors.text?.message}
            />
          )}
        />
        <Text style={styles.counter}>
          {text.trim().length}／{REVIEW_MIN_TEXT_LENGTH}文字以上
        </Text>

        <Field label="写真（任意）">
          <Text style={styles.caption}>写真の投稿は準備中です。</Text>
        </Field>

        <Controller
          control={control}
          name="affiliationDeclared"
          render={({ field }) => (
            <Pressable
              style={styles.declare}
              onPress={() => field.onChange(!field.value)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: field.value }}
            >
              <Ionicons
                name={field.value ? 'checkbox' : 'square-outline'}
                size={22}
                color={field.value ? colors.primary : colors.inkMuted}
              />
              <View style={styles.declareBody}>
                <Text style={styles.declareLabel}>
                  この{isProduct ? '商品' : target.kind === 'pro' ? '専門家' : '店舗'}
                  と利害関係があります
                </Text>
                <Text style={styles.caption}>
                  事業者の関係者・スタッフなどの方はチェックしてください。口コミに「PR（関係者による投稿）」と表示されます。
                </Text>
              </View>
            </Pressable>
          )}
        />

        <View style={styles.recordCard}>
          <Text style={styles.recordTitle}>この投稿はあなたのウェルネスの記録になります</Text>
          <Text style={styles.recordText}>
            使用期間と継続状況が残るため、あとから「1年続けた人の評価」として参照されます。
            ニックネームと、年代・性別・エリア・運動の頻度が口コミと一緒に表示されます。
          </Text>
        </View>

        {submitError && <Text style={styles.submitError}>{submitError}</Text>}
        <Button label="投稿する" onPress={() => void onSubmit()} loading={isSubmitting} />
        <Text style={styles.guideline}>ガイドラインに反する投稿は非表示になる場合があります</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string | undefined;
  children: ReactNode;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
      {error != null && <Text style={styles.error}>{error}</Text>}
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
  gate: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.lg,
  },
  gateText: {
    ...typography.body,
    color: colors.ink,
  },
  gateButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  gateButtonText: {
    ...typography.titleMd,
    color: colors.surface,
  },
  link: {
    ...typography.bodySm,
    fontFamily: fontFamily.bodyBold,
    color: colors.primary,
  },
  target: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  thumb: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.tint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbEmoji: {
    fontSize: 22,
  },
  targetBody: {
    flex: 1,
    gap: 2,
  },
  targetMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  targetName: {
    ...typography.titleMd,
    color: colors.ink,
  },
  field: {
    gap: spacing.sm,
  },
  fieldLabel: {
    ...typography.titleMd,
    fontSize: 14,
    color: colors.ink,
  },
  error: {
    ...typography.caption,
    color: semantic.danger,
  },
  monthsWrap: {
    gap: spacing.sm,
  },
  monthsInput: {
    maxWidth: 220,
  },
  textArea: {
    minHeight: 140,
  },
  counter: {
    ...typography.caption,
    color: colors.inkMuted,
    textAlign: 'right',
    marginTop: -spacing.md,
  },
  caption: {
    ...typography.caption,
    color: colors.inkMuted,
  },
  declare: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  declareBody: {
    flex: 1,
    gap: 2,
  },
  declareLabel: {
    ...typography.bodySm,
    color: colors.ink,
  },
  recordCard: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.xs,
  },
  recordTitle: {
    ...typography.bodySm,
    fontFamily: fontFamily.bodyBold,
    color: colors.primaryStrong,
  },
  recordText: {
    ...typography.caption,
    color: colors.primaryStrong,
  },
  submitError: {
    ...typography.bodySm,
    color: semantic.danger,
  },
  guideline: {
    ...typography.caption,
    color: colors.inkMuted,
    textAlign: 'center',
  },
});
