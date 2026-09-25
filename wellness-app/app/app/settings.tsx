import { ScreenPlaceholder } from '@/components/ui/ScreenPlaceholder';

export default function SettingsScreen() {
  return (
    <ScreenPlaceholder
      title="設定"
      screenNo={17}
      note="プロフィール（年代・性別・エリア・運動の頻度・悩み・目的）／ブロックしたユーザー・口コミガイドライン・通報の履歴／通知設定・利用規約・プライバシーポリシー・ログアウト・アカウント削除"
      links={[{ label: '悩み・目的を編集', href: '/onboarding' }]}
    />
  );
}
