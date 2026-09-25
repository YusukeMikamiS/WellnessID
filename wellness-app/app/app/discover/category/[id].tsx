import { ScreenPlaceholder } from '@/components/ui/ScreenPlaceholder';

export default function CategoryScreen() {
  return (
    <ScreenPlaceholder
      title="アイテム一覧"
      screenNo={9}
      note="並び替え（おすすめ順／評価が高い順／口コミが多い順）と絞り込み。カードを2列で並べる"
      links={[{ label: '⑩ 詳細', href: '/discover/item/sample' }]}
    />
  );
}
