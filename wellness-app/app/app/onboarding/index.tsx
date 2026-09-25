import { ScreenPlaceholder } from '@/components/ui/ScreenPlaceholder';

export default function OnboardingScreen() {
  return (
    <ScreenPlaceholder
      title="オンボーディング"
      screenNo={2}
      note="悩み選択 → 属性入力 → 「近い人は◯人」の3ステップ"
      links={[
        { label: '新規登録へ', href: '/signup' },
        { label: 'ホームへ', href: '/' },
      ]}
    />
  );
}
