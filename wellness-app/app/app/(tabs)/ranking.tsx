import { ScreenPlaceholder } from '@/components/ui/ScreenPlaceholder';

export default function RankingScreen() {
  return (
    <ScreenPlaceholder
      title="ランキング"
      screenNo={8}
      note="「みんなの評価／あなたと近い人」の切替。総合・PRODUCTS・SERVICES・専門家・悩み別のチップ。母数 n を常に表示する"
      links={[{ label: '⑩ 詳細', href: '/discover/item/sample' }]}
    />
  );
}
