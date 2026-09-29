/**
 * NGワードの検証（CLAUDE.md §7.3-4）
 *
 * TODO(運営)：NGワードの一覧は運営（甲）と決める。ここにあるのは仮の最小限（連絡先・誘導の書き込み）。
 * 一覧を運営が更新できるようにするなら、Firestore のマスタに移す。
 *
 * 誤判定を避けるため、単純な部分一致だけにしている。口コミガイドラインとあわせて見直すこと。
 */

const NG_PATTERNS: readonly RegExp[] = [
  // 連絡先の書き込み（個人情報・外部への誘導）
  /\b0\d{1,4}-\d{1,4}-\d{3,4}\b/, // 電話番号
  /[\w.+-]+@[\w-]+\.[\w.-]+/, // メールアドレス
  /(?:LINE|ライン)\s*(?:ID|ＩＤ)/i,
];

/** NGワードが含まれていれば、その部分を返す。なければ null */
export function findNgWord(text: string): string | null {
  for (const pattern of NG_PATTERNS) {
    const match = text.match(pattern);
    if (match) return match[0];
  }
  return null;
}
