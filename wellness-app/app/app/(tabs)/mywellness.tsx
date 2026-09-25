import { ScreenPlaceholder } from '@/components/ui/ScreenPlaceholder';

export default function MyWellnessScreen() {
  return (
    <ScreenPlaceholder
      title="MY WELLNESS"
      screenNo={14}
      note="未ログイン：空の状態・無料登録／ログイン・使い方の4ステップ。会員：プロフィール・いま続けているもの・やめたもの・投稿への反応"
      links={[
        { label: '無料登録してはじめる', href: '/signup' },
        { label: 'ログイン', href: '/login' },
        { label: '⑩ 詳細（いま続けているもの）', href: '/discover/item/sample' },
      ]}
    />
  );
}
