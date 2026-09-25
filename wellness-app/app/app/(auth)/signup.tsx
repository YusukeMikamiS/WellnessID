import { ScreenPlaceholder } from '@/components/ui/ScreenPlaceholder';

export default function SignupScreen() {
  return (
    <ScreenPlaceholder
      title="新規登録"
      screenNo={4}
      note="WellnessID の無料会員を作る。規約への同意もここで取る"
      links={[{ label: 'ログインへ', href: '/login' }]}
    />
  );
}
