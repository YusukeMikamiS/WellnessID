import { ScreenPlaceholder } from '@/components/ui/ScreenPlaceholder';

export default function HomeScreen() {
  return (
    <ScreenPlaceholder
      title="ホーム"
      screenNo={5}
      note="上から順に：悩みから探す入口 → あなたと近い人が選んだもの → 総合ランキング → ウェルネスコラム → 新着の口コミ"
      links={[
        { label: '悩みから探す（すべて）', href: '/search' },
        { label: '⑦ 悩み別ランキング', href: '/discover/concern/sample' },
        { label: '近い人が選んだもの（もっと見る）', href: '/ranking' },
        { label: '⑩ 詳細', href: '/discover/item/sample' },
        { label: '⑮ コラム', href: '/column/sample' },
        { label: '新着の口コミ（もっと見る）', href: '/reviews' },
        { label: '① Splash（確認用）', href: '/splash' },
        { label: '② オンボーディング（確認用）', href: '/onboarding' },
      ]}
    />
  );
}
