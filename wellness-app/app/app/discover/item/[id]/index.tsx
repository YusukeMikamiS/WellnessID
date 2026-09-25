import { ScreenPlaceholder } from '@/components/ui/ScreenPlaceholder';

export default function ItemScreen() {
  return (
    <ScreenPlaceholder
      title="詳細"
      screenNo={10}
      note="評価と口コミ件数 → 指標（継続中・近い人の口コミ・1年以上継続）→ 外部導線 → 悩み・目的タグ → 評価の分布 → 口コミ"
      links={[
        { label: '口コミ（すべて見る）', href: '/discover/item/sample/reviews' },
        { label: '口コミを書く', href: '/discover/item/sample/post' },
        { label: 'この悩み・目的で選ばれています', href: '/discover/concern/sample' },
      ]}
    />
  );
}
