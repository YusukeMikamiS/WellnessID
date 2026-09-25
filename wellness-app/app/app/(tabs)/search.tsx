import { ScreenPlaceholder } from '@/components/ui/ScreenPlaceholder';

export default function SearchScreen() {
  return (
    <ScreenPlaceholder
      title="探す"
      screenNo={6}
      note="悩み・カテゴリ・キーワードから商品・店舗・専門家を探す"
      links={[
        { label: '⑦ 悩み別ランキング', href: '/discover/concern/sample' },
        { label: '⑨ アイテム一覧', href: '/discover/category/sample' },
      ]}
    />
  );
}
