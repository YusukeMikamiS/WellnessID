import { ScreenPlaceholder } from '@/components/ui/ScreenPlaceholder';

export default function LoginScreen() {
  return (
    <ScreenPlaceholder
      title="ログイン"
      screenNo={3}
      note="メールアドレスとパスワードでログインする"
      links={[{ label: '新規登録へ', href: '/signup' }]}
    />
  );
}
