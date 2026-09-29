/**
 * フォームの入力チェック（zod）
 *
 * 技術スタック（CLAUDE.md §2）：react-hook-form + zod。Functions 側でも同じスキーマを使う想定。
 */

import { z } from 'zod';

/** Firebase Auth の下限は6文字だが、アプリでは8文字以上にする */
export const PASSWORD_MIN_LENGTH = 8;
export const NICKNAME_MAX_LENGTH = 20;

const email = z
  .string()
  .trim()
  .min(1, 'メールアドレスを入力してください')
  .email('メールアドレスの形式が正しくありません');

export const signInSchema = z.object({
  email,
  password: z.string().min(1, 'パスワードを入力してください'),
});
export type SignInValues = z.infer<typeof signInSchema>;

export const signUpSchema = z.object({
  nickname: z
    .string()
    .trim()
    .min(1, 'ニックネームを入力してください')
    .max(NICKNAME_MAX_LENGTH, `ニックネームは${NICKNAME_MAX_LENGTH}文字以内にしてください`),
  email,
  password: z
    .string()
    .min(PASSWORD_MIN_LENGTH, `パスワードは${PASSWORD_MIN_LENGTH}文字以上にしてください`),
});
export type SignUpValues = z.infer<typeof signUpSchema>;
