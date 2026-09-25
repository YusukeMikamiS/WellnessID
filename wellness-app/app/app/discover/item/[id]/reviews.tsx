import { ScreenPlaceholder } from '@/components/ui/ScreenPlaceholder';

export default function ItemReviewsScreen() {
  return (
    <ScreenPlaceholder
      title="口コミ一覧"
      screenNo={11}
      note="絞り込み（すべて／あなたと近い人／1年以上継続／継続中のみ）と母数 n。各口コミに「参考になった」と通報"
      links={[{ label: '口コミを書く', href: '/discover/item/sample/post' }]}
    />
  );
}
