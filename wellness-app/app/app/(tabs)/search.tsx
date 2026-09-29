import { Text } from 'react-native';

import { ConcernChipList } from '@/components/concern/ConcernChipList';
import { ScreenPlaceholder } from '@/components/ui/ScreenPlaceholder';
import { colors, spacing, typography } from '@/theme/tokens';

export default function SearchScreen() {
  return (
    <ScreenPlaceholder
      title="探す"
      screenNo={6}
      note="キーワード検索 → 悩み・目的から探す（カテゴリを横断して比較）→ カテゴリから探す"
      links={[
        { label: '⑦ 悩み別ランキング', href: '/discover/concern/sample' },
        { label: '⑨ アイテム一覧', href: '/discover/category/sample' },
        { label: '⑩ 詳細（検索結果）', href: '/discover/item/sample' },
      ]}
    >
      <Text style={{ ...typography.titleMd, color: colors.ink, marginBottom: spacing.sm }}>
        悩み・目的から探す
      </Text>
      <ConcernChipList />
    </ScreenPlaceholder>
  );
}
