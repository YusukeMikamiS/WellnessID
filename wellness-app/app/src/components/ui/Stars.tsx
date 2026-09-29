/**
 * 星評価（0.5刻みで表示）と数値
 * 星の色はアンバー固定（semantic.star）。評価以外の用途には使わない。
 */

import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import { colors, semantic, typography } from '@/theme/tokens';

interface Props {
  score: number;
  size?: number;
  /** 数値（例：4.72）を星の右に出すか */
  showValue?: boolean;
}

export function Stars({ score, size = 13, showValue = true }: Props) {
  const rounded = Math.round(score * 2) / 2;
  return (
    <View style={styles.row} accessibilityLabel={`評価 ${score.toFixed(2)}`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Ionicons
          key={i}
          name={rounded >= i ? 'star' : rounded >= i - 0.5 ? 'star-half' : 'star-outline'}
          size={size}
          color={semantic.star}
        />
      ))}
      {showValue && <Text style={styles.value}>{score.toFixed(2)}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 1,
  },
  value: {
    ...typography.numeric,
    fontSize: 14,
    color: colors.ink,
    marginLeft: 4,
  },
});
