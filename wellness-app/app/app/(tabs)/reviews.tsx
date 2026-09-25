import { ScreenPlaceholder } from '@/components/ui/ScreenPlaceholder';

export default function ReviewsScreen() {
  return (
    <ScreenPlaceholder
      title="口コミ"
      screenNo={13}
      note="新着の口コミ。絞り込み（新着／あなたと近い人／1年以上継続／高評価）"
      links={[{ label: '⑩ 詳細', href: '/discover/item/sample' }]}
    />
  );
}
