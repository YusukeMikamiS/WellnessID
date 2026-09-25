import { ScreenPlaceholder } from '@/components/ui/ScreenPlaceholder';

export default function SplashScreen() {
  return (
    <ScreenPlaceholder
      title="Splash"
      screenNo={1}
      note="ロゴとキャッチコピー（Find what works for you.）を表示する起動画面"
      links={[
        { label: 'オンボーディングへ', href: '/onboarding' },
        { label: 'ホームへ', href: '/' },
      ]}
    />
  );
}
