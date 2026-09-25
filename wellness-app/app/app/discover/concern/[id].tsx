import { ScreenPlaceholder } from '@/components/ui/ScreenPlaceholder';

export default function DiscoverConcernScreen() {
  return (
    <ScreenPlaceholder
      title="悩み別ランキング"
      screenNo={7}
      note="選んだ悩みに紐づく商品・店舗・専門家を横断で並べる"
      links={[{ label: '⑩ アイテム詳細', href: '/discover/item/sample' }]}
    />
  );
}
