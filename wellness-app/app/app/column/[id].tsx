import { ScreenPlaceholder } from '@/components/ui/ScreenPlaceholder';

export default function ColumnScreen() {
  return (
    <ScreenPlaceholder
      title="ウェルネスコラム"
      screenNo={15}
      note="コラム本文と、この記事で紹介したもの"
      links={[{ label: '⑩ 詳細（紹介したもの）', href: '/discover/item/sample' }]}
    />
  );
}
