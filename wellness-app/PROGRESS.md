# 進捗・課題メモ

> 日々の進捗と未解決課題をここに置く。プロジェクト完了後は削除予定の一時ファイル。

## 2026-10-06

### Firebase テスト環境（`wellnessidtest`）

セットアップ自体は大筋完了（Firestore・Authentication・Storage・Functionsデプロイ・予算アラート・admin Custom Claims等）。

**未解決の課題**：callable Functions 6つ（`postReview` / `deleteAccount` / `deleteReview` / `reportReview` / `toggleLike` / `rebuildRankings`）に `allUsers` への `roles/run.invoker` 権限が付与されておらず、未認証HTTPSリクエストで `403 Forbidden`（Googleフロントエンドのエラーページ＝IAMレベルの拒否）が返る。アプリから一切呼び出せない状態。

- 原因の見立て：`wellnessidtest` が会社（乙）のGoogle Workspace組織配下のプロジェクトのため、組織ポリシー「Domain Restricted Sharing」（`iam.allowedPolicyMemberDomains`）により `allUsers` へのIAM付与がデフォルトでブロックされている可能性が高い。Firebase CLIの`deploy`はinvoker権限の付与だけ黙って失敗していたとみられる。
- 対応方針：`iam.allowedPolicyMemberDomains` には特定プリンシパルだけの例外設定が無いため、**プロジェクト単位でポリシーを上書き（無効化）する**方針に決定。
- 現状（2026-10-07）：`roles/orgpolicy.policyAdmin` は**組織レベルでしか付与できないロール**と判明（プロジェクト単位でのバインドは `INVALID_ARGUMENT: Role roles/orgpolicy.policyAdmin is not supported for this resource` でエラーになる）。「プロジェクト限定で権限委譲する」方針は不可と判明したため撤回。
- 方針変更：権限委譲ではなく、**既に組織ポリシー権限を持つ社内GCP管理者に、以下のコマンドを直接実行してもらう**方式に変更。
  ```bash
  cat > policy.yaml << 'EOF'
  name: projects/wellnessidtest/policies/iam.allowedPolicyMemberDomains
  spec:
    rules:
    - allowAll: true
  EOF
  gcloud org-policies set-policy policy.yaml
  ```
  （コンソールUIの「組織のポリシー」画面ではこの制約に「すべて許可」の選択肢が出ないため、gcloud必須）
  - 完了後の手順：6つのCallable Functions（`postReview` / `deleteAccount` / `deleteReview` / `reportReview` / `toggleLike` / `rebuildRankings`）に `allUsers` / `roles/run.invoker` を再付与
  - ✅ 公開前チェック完了（2026-10-07）：6つ全ての関数を確認済み。`postReview`/`deleteReview`/`reportReview`/`toggleLike`/`deleteAccount`は`request.auth.uid`必須＋本人確認済み。`rebuildRankings`は`token.admin !== true`で運営以外を拒否する実装が既にある（`functions/src/ranking/weekly.ts`）。コード変更不要、`allUsers`付与して問題ない。

### Firebase 本番環境（`wellness-id-62d44`、甲所有）

こちらは編集者権限のみのため、以下が甲への依頼待ちで未着手。

- Firestore作成（ネイティブモード）
- Blazeプランへの変更
- （以降、テスト用で済ませた）Authentication有効化・Storage有効化・Functionsデプロイ・本番用の予算アラート設定 等

### TestFlight配信準備

- `eas.json` の `preview`/`production` プロファイルを `wellnessidtest` のFirebase設定値に紐付ける対応中（2026-10-07）。Firebase JS SDK使用のため `EXPO_PUBLIC_FIREBASE_*` 環境変数のみで足りる（ネイティブ設定ファイル不要）。
- 当初 `eas.json` に生の値（`apiKey`等）を直書きしてコミットしたところ、pushがClaude Codeの資格情報漏洩チェックでブロックされた。**値は直書きせず、EAS Environment Variables（`eas env:create`）で管理する方式に変更**し、`eas.json` 側は `"environment": "preview"` / `"environment": "production"` の参照だけにした。
- 未実施：EAS CLIへのログイン（`eas-cli` はnpx経由でローカルから実行可能。ログインはブラウザ認証が必要でユーザー本人の操作待ち）。ログイン後、`eas env:create` で以下の変数を `preview`/`production` 両環境に登録する必要あり：
  `EXPO_PUBLIC_USE_FIREBASE_EMULATOR=false` / `EXPO_PUBLIC_FIREBASE_API_KEY` / `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN` / `EXPO_PUBLIC_FIREBASE_PROJECT_ID` / `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET` / `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` / `EXPO_PUBLIC_FIREBASE_APP_ID`（値は `wellnessidtest` のWebアプリ設定。`firebase apps:sdkconfig WEB <appId> --project wellnessidtest` で取得可能）
- この時点でプロジェクトがEASにリンク済みか未確認（`app.json` に `extra.eas.projectId` が無い）。未リンクなら `eas init` も必要。
