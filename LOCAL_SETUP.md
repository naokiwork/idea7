# ローカル開発環境セットアップ

## ✅ 環境変数の設定

以下の環境変数ファイルが作成されました：

### `.env` (バックエンド用)
```
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://naokiondawork_db_user:HZRa0SqYijT7qUCm@cluster0.vdoi3su.mongodb.net/study-calendar
```

### `.env.local` (フロントエンド用)
```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

## 🚀 アプリケーションの起動

開発サーバーを起動するには：

```bash
npm run dev
```

これにより、以下が同時に起動します：
- **フロントエンド**: http://localhost:3000
- **バックエンドAPI**: http://localhost:5000

## 📍 アクセスURL

- **フロントエンド**: http://localhost:3000
- **バックエンドAPI**: http://localhost:5000/api
- **ヘルスチェック**: http://localhost:5000/api/health

## 🛠️ 個別に起動する場合

### フロントエンドのみ
```bash
npm run dev:frontend
```

### バックエンドのみ
```bash
npm run dev:backend
```

## ✅ 動作確認

### バックエンドの確認
```bash
curl http://localhost:5000/api/health
```

正常な応答：
```json
{
  "status": "ok",
  "message": "Study Hour Calendar API is running"
}
```

### フロントエンドの確認
ブラウザで http://localhost:3000 にアクセス

## 🐛 トラブルシューティング

### ポートが既に使用されている場合
```bash
# ポート3000を使用しているプロセスを確認
lsof -ti:3000

# ポート5000を使用しているプロセスを確認
lsof -ti:5000
```

### MongoDB接続エラー
- `.env` ファイルの `MONGODB_URI` が正しいか確認
- MongoDB Atlas のネットワークアクセス設定を確認

### 環境変数が読み込まれない
- `.env` と `.env.local` ファイルがプロジェクトルートにあるか確認
- サーバーを再起動

## 📝 注意事項

- `.env` と `.env.local` ファイルは `.gitignore` に含まれているため、GitHubにコミットされません
- 本番環境では、これらの環境変数をプラットフォーム（Railway、Vercel）で設定してください

