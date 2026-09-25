import { ScreenPlaceholder } from '@/components/ui/ScreenPlaceholder';

export default function SignupScreen() {
  return (
    <ScreenPlaceholder
      title="新規登録"
      screenNo={4}
      note="ニックネーム・メール・パスワードを入力し、オンボーディングで入力済みの情報を確認して「同意して登録する」（規約同意）"
      links={[{ label: 'ログイン', href: '/login' }]}
    />
  );
}
