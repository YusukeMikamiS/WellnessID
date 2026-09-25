import { ScreenPlaceholder } from '@/components/ui/ScreenPlaceholder';

export default function RankingScreen() {
  return (
    <ScreenPlaceholder
      title="ランキング"
      screenNo={8}
      note="総合・種別・カテゴリ・悩み・近い人のランキング。母数 n を常に表示する"
      links={[{ label: '⑩ アイテム詳細', href: '/discover/item/sample' }]}
    />
  );
}
