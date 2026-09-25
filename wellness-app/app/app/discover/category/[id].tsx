import { ScreenPlaceholder } from '@/components/ui/ScreenPlaceholder';

export default function DiscoverCategoryScreen() {
  return (
    <ScreenPlaceholder
      title="アイテム一覧"
      screenNo={9}
      note="カテゴリに属するアイテムを一覧で比べる"
      links={[{ label: '⑩ アイテム詳細', href: '/discover/item/sample' }]}
    />
  );
}
