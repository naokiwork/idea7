# デプロイ クイックスタートガイド

このガイドは、Study Hour Calendarアプリケーションを素早くデプロイするための簡潔な手順です。

詳細な手順は [DEPLOYMENT_TODO.md](./DEPLOYMENT_TODO.md) を参照してください。

## 🚀 デプロイの流れ

### 1. MongoDB Atlas のセットアップ（5分）

1. https://www.mongodb.com/cloud/atlas にアクセス
2. 無料アカウントを作成
3. クラスターを作成（M0 Free）
4. データベースユーザーを作成
5. ネットワークアクセスを設定（0.0.0.0/0 を追加）
6. 接続文字列を取得・保存

### 2. バックエンドのデプロイ（Railway推奨、10分）

1. https://railway.app にアクセス
2. GitHubでログイン
3. "New Project" → "Deploy from GitHub repo"
4. リポジトリ `naokiwork/idea7` を選択
5. 環境変数を設定:
   ```
   PORT=5000
   NODE_ENV=production
   MONGODB_URI=mongodb+srv://...
   ```
6. デプロイURLを保存

### 3. フロントエンドのデプロイ（Vercel、5分）

1. https://vercel.com にアクセス
2. GitHubでログイン
3. "Add New Project"
4. リポジトリ `naokiwork/idea7` を選択
5. 環境変数を設定:
   ```
   NEXT_PUBLIC_API_URL=https://your-backend.railway.app/api
   ```
6. "Deploy" をクリック

### 4. CORS設定の更新（5分）

1. `server/index.ts` のCORS設定を更新
2. 本番環境のフロントエンドURLを追加
3. コミット・プッシュ:
   ```bash
   git add server/index.ts
   git commit -m "Update CORS for production"
   git push origin main
   ```

### 5. 動作確認（5分）

1. フロントエンドURLにアクセス
2. バックエンドAPI: `https://your-backend.railway.app/api/health`
3. データの追加・表示をテスト

## 📝 必要な情報

デプロイ前に以下を準備:

- [ ] MongoDB Atlas 接続文字列
- [ ] バックエンドデプロイURL（Railway/Render）
- [ ] フロントエンドデプロイURL（Vercel）

## ⚠️ 注意事項

- 環境変数は必ず本番環境で設定すること
- `.env` ファイルはGitHubにコミットしない
- CORS設定を忘れずに更新すること

## 🆘 トラブルシューティング

### バックエンドが起動しない
- 環境変数 `MONGODB_URI` を確認
- ビルドログを確認

### フロントエンドがバックエンドに接続できない
- `NEXT_PUBLIC_API_URL` を確認
- CORS設定を確認

詳細は [DEPLOYMENT_TODO.md](./DEPLOYMENT_TODO.md) を参照してください。

