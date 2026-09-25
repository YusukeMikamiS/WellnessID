import { ScreenPlaceholder } from '@/components/ui/ScreenPlaceholder';

export default function ReviewsScreen() {
  return (
    <ScreenPlaceholder
      title="口コミフィード"
      screenNo={13}
      note="新着口コミを時系列で流す"
      links={[{ label: '⑩ アイテム詳細', href: '/discover/item/sample' }]}
    />
  );
}
