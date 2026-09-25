import { ScreenPlaceholder } from '@/components/ui/ScreenPlaceholder';

export default function ConcernScreen() {
  return (
    <ScreenPlaceholder
      title="悩み別ランキング"
      screenNo={7}
      note="「みんなの評価／あなたと近い人」の切替と種別チップ。母数 n を常に表示し、近い人が5件未満のものは総合評価を出して理由を明示する"
      links={[{ label: '⑩ 詳細', href: '/discover/item/sample' }]}
    />
  );
}
