# 進捗・課題メモ

> 日々の進捗と未解決課題をここに置く。プロジェクト完了後は削除予定の一時ファイル。

## 2026-10-06

### Firebase テスト環境（`wellnessidtest`）

セットアップ自体は大筋完了（Firestore・Authentication・Storage・Functionsデプロイ・予算アラート・admin Custom Claims等）。

**未解決の課題**：callable Functions 6つ（`postReview` / `deleteAccount` / `deleteReview` / `reportReview` / `toggleLike` / `rebuildRankings`）に `allUsers` への `roles/run.invoker` 権限が付与されておらず、未認証HTTPSリクエストで `403 Forbidden`（Googleフロントエンドのエラーページ＝IAMレベルの拒否）が返る。アプリから一切呼び出せない状態。

- 原因の見立て：`wellnessidtest` が会社（乙）のGoogle Workspace組織配下のプロジェクトのため、組織ポリシー「Domain Restricted Sharing」により `allUsers` へのIAM付与がデフォルトでブロックされている可能性が高い。Firebase CLIの`deploy`はinvoker権限の付与だけ黙って失敗していたとみられる。
- 対応予定：**2026-10-07にユーザーが組織ポリシー側を確認・解決**。

### Firebase 本番環境（`wellness-id-62d44`、甲所有）

こちらは編集者権限のみのため、以下が甲への依頼待ちで未着手。

- Firestore作成（ネイティブモード）
- Blazeプランへの変更
- （以降、テスト用で済ませた）Authentication有効化・Storage有効化・Functionsデプロイ・本番用の予算アラート設定 等

### TestFlight配信準備

- `wellness-app/app/eas.json` が新規ファイルとして存在、未コミット。本番／テストどちらのFirebase設定（`google-services.json` 等）と紐付けるか要確認。
