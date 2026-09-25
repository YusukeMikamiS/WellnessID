import { ScreenPlaceholder } from '@/components/ui/ScreenPlaceholder';

export default function ItemPostScreen() {
  return (
    <ScreenPlaceholder
      title="口コミを投稿"
      screenNo={12}
      note="総合評価（★）・使った目的・使用（利用）期間・いまも続けているか・購入先（店舗・専門家は知ったきっかけ）・本文（20文字以上）・写真（任意）"
      links={[{ label: '投稿後は口コミ一覧へ', href: '/discover/item/sample/reviews' }]}
    />
  );
}
