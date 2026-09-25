import { ScreenPlaceholder } from '@/components/ui/ScreenPlaceholder';

export default function DiscoverItemScreen() {
  return (
    <ScreenPlaceholder
      title="アイテム詳細"
      screenNo={10}
      note="商品・店舗・専門家の共通詳細。評価分布・近い人の評価・外部リンク"
      links={[
        { label: '⑪ 口コミ一覧', href: '/discover/item/sample/reviews' },
        { label: '⑫ 口コミを書く', href: '/discover/item/sample/post' },
      ]}
    />
  );
}
