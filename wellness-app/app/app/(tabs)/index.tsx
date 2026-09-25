import { ScreenPlaceholder } from '@/components/ui/ScreenPlaceholder';

export default function HomeScreen() {
  return (
    <ScreenPlaceholder
      title="ホーム"
      screenNo={5}
      note="悩み・目的から探す入口。新着口コミ・コラム・お知らせを並べる"
      links={[
        { label: '① Splash', href: '/splash' },
        { label: '② オンボーディング', href: '/onboarding' },
        { label: '⑦ 悩み別ランキング', href: '/discover/concern/sample' },
        { label: '⑩ アイテム詳細', href: '/discover/item/sample' },
        { label: '⑮ コラム', href: '/column/sample' },
        { label: '⑯ お知らせ', href: '/notice' },
      ]}
    />
  );
}
