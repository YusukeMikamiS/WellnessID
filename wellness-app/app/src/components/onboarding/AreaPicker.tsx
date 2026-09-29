/**
 * お住まいのエリア（任意）
 *
 * 入口はモックアップどおり「港区／渋谷区／目黒区／その他の東京都／東京都外」（AREA_QUICK_PICKS）。
 * 「その他の東京都」は区（または23区外）を、「東京都外」は都道府県を続けて選ぶ。
 * 保存は都道府県コード＋市区町村コード（types/common.ts の Area）。
 */

import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { ChoiceChips } from '@/components/ui/ChoiceChips';
import { PREFECTURES, TOKYO_WARDS } from '@/lib/labels';
import { colors, spacing, typography } from '@/theme/tokens';
import { AREA_QUICK_PICKS, type Area } from '@/types';

const TOKYO = '13';
/** 「23区外」を表す選択肢の値（市区町村コードは持たない） */
const TOKYO_OUTSIDE_WARDS = 'tokyo-other';

type QuickKey = (typeof AREA_QUICK_PICKS)[number]['key'];

function quickKeyOf(area: Area | null): QuickKey | null {
  if (!area) return null;
  const direct = AREA_QUICK_PICKS.find((p) => p.area && p.area.municipality === area.municipality);
  if (direct) return direct.key;
  return area.prefecture === TOKYO ? 'otherTokyo' : 'outsideTokyo';
}

interface Props {
  value: Area | null;
  onChange: (area: Area | null) => void;
}

export function AreaPicker({ value, onChange }: Props) {
  // 「その他の東京都」「東京都外」は続けて選ぶまで値が決まらないので、入口の選択は別に持つ
  const [quick, setQuick] = useState<QuickKey | null>(quickKeyOf(value));
  const quickPicks = AREA_QUICK_PICKS.map((p) => ({ value: p.key, label: p.label }));

  const onQuick = ([key]: QuickKey[]) => {
    setQuick(key ?? null);
    const pick = AREA_QUICK_PICKS.find((p) => p.key === key);
    // 区・都道府県を続けて選ぶまでは未入力（null）のままにする
    onChange(pick?.area ? { ...pick.area } : null);
  };

  const wardOptions = [
    ...Object.entries(TOKYO_WARDS)
      .filter(([code]) => !AREA_QUICK_PICKS.some((p) => p.area?.municipality === code))
      .map(([code, name]) => ({ value: code, label: name })),
    { value: TOKYO_OUTSIDE_WARDS, label: '23区外（多摩・島しょ）' },
  ];
  const prefectureOptions = Object.entries(PREFECTURES)
    .filter(([code]) => code !== TOKYO)
    .map(([code, name]) => ({ value: code, label: name }));

  return (
    <View style={styles.wrap}>
      <ChoiceChips options={quickPicks} selected={quick ? [quick] : []} onChange={onQuick} />

      {quick === 'otherTokyo' && (
        <View style={styles.sub}>
          <Text style={styles.subLabel}>区を選んでください</Text>
          <ChoiceChips
            options={wardOptions}
            selected={
              value?.prefecture === TOKYO ? [value.municipality ?? TOKYO_OUTSIDE_WARDS] : []
            }
            onChange={([code]) =>
              onChange(
                code
                  ? { prefecture: TOKYO, municipality: code === TOKYO_OUTSIDE_WARDS ? null : code }
                  : null,
              )
            }
          />
        </View>
      )}

      {quick === 'outsideTokyo' && (
        <View style={styles.sub}>
          <Text style={styles.subLabel}>都道府県を選んでください</Text>
          <ChoiceChips
            options={prefectureOptions}
            selected={value?.prefecture ? [value.prefecture] : []}
            onChange={([code]) => onChange(code ? { prefecture: code, municipality: null } : null)}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.md,
  },
  sub: {
    gap: spacing.sm,
    paddingLeft: spacing.md,
    borderLeftColor: colors.line,
    borderLeftWidth: 2,
  },
  subLabel: {
    ...typography.caption,
    color: colors.inkMuted,
  },
});
