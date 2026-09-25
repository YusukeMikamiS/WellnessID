import { ScreenPlaceholder } from '@/components/ui/ScreenPlaceholder';

export default function DiscoverItemReviewsScreen() {
  return (
    <ScreenPlaceholder
      title="口コミ一覧"
      screenNo={11}
      note="アイテムの構造化口コミを一覧で読む。通報・ブロックの導線を置く"
      links={[{ label: '⑫ 口コミを書く', href: '/discover/item/sample/post' }]}
    />
  );
}
