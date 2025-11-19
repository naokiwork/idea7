# ローカル環境の起動方法

## 🚀 簡単な起動方法

### ステップ1: すべてのプロセスを停止

```bash
# ポート5000と3000を使用しているプロセスを終了
lsof -ti:5000 -ti:3000 | xargs kill -9 2>/dev/null

# または、すべてのNodeプロセスを終了
pkill -9 -f "node.*server|nodemon|next dev"
```

### ステップ2: アプリケーションを起動

```bash
cd /Users/naokionda/Documents/project/idea-5
npm run dev
```

これで以下が起動します：
- **フロントエンド**: http://localhost:3000
- **バックエンドAPI**: http://localhost:5000

## 📍 アクセスURL

- **アプリケーション**: http://localhost:3000
- **APIヘルスチェック**: http://localhost:5000/api/health

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

## 💾 MongoDBについて

- MongoDBがなくてもサーバーは起動します
- データの永続化が必要な場合は、ローカルMongoDBをインストール：
  ```bash
  brew install mongodb-community
  brew services start mongodb-community
  ```

## 🐛 トラブルシューティング

### ポートが使用されている場合

```bash
# ポートを確認
lsof -ti:5000
lsof -ti:3000

# プロセスを終了
kill -9 <PID>
```

### サーバーが起動しない場合

1. すべてのプロセスを終了
2. `npm run dev` を再実行

