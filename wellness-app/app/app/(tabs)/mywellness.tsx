import { ScreenPlaceholder } from '@/components/ui/ScreenPlaceholder';

export default function MywellnessScreen() {
  return (
    <ScreenPlaceholder
      title="MY WELLNESS"
      screenNo={14}
      note="未ログイン／会員の2段で出し分ける。お気に入り・自分の口コミ"
      links={[
        { label: '③ ログイン', href: '/login' },
        { label: '④ 新規登録', href: '/signup' },
        { label: '⑰ 設定', href: '/settings' },
      ]}
    />
  );
}
