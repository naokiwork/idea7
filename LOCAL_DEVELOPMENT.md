# ローカル開発環境完全ガイド

## ✅ 現在の設定

アプリケーションはローカルで完全に動作するように設定されています。

### 環境変数

**`.env`** (バックエンド用):
```
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/study-calendar
```

**`.env.local`** (フロントエンド用):
```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

## 🚀 起動方法

### 方法1: 両方同時に起動（推奨）

```bash
npm run dev
```

これで以下が同時に起動します：
- フロントエンド: http://localhost:3000
- バックエンドAPI: http://localhost:5000

### 方法2: 個別に起動

**フロントエンドのみ:**
```bash
npm run dev:frontend
```

**バックエンドのみ:**
```bash
npm run dev:backend
```

## 💾 MongoDBの設定（オプション）

### オプション1: ローカルMongoDBを使用

1. **MongoDBをインストール:**
   ```bash
   brew install mongodb-community
   ```

2. **MongoDBを起動:**
   ```bash
   brew services start mongodb-community
   ```

3. **動作確認:**
   ```bash
   mongosh
   ```

4. **`.env`ファイルを更新:**
   ```
   MONGODB_URI=mongodb://localhost:27017/study-calendar
   ```

### オプション2: MongoDBなしで動作

MongoDBがなくてもサーバーは起動しますが、データの保存はできません。

- サーバーは正常に起動します
- APIエンドポイントは応答します
- データの永続化はできません

### オプション3: MongoDB Atlasを使用（クラウド）

`.env`ファイルでMongoDB Atlasの接続文字列を使用：
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/study-calendar
```

## 📍 アクセスURL

- **フロントエンド**: http://localhost:3000
- **バックエンドAPI**: http://localhost:5000/api
- **ヘルスチェック**: http://localhost:5000/api/health

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

### ポートが既に使用されている

```bash
# ポートを確認
lsof -ti:3000
lsof -ti:5000

# プロセスを終了
kill -9 <PID>
```

### MongoDB接続エラー

**ローカルMongoDBを使用する場合:**
```bash
# MongoDBが起動しているか確認
brew services list | grep mongodb

# 起動していない場合は起動
brew services start mongodb-community
```

**MongoDB Atlasを使用する場合:**
- ネットワーク接続を確認
- MongoDB Atlasのネットワークアクセス設定を確認（0.0.0.0/0を追加）

### 環境変数が読み込まれない

- `.env`と`.env.local`ファイルがプロジェクトルートにあるか確認
- サーバーを再起動

## 📝 注意事項

- `.env`と`.env.local`ファイルは`.gitignore`に含まれているため、GitHubにコミットされません
- ローカル開発では、MongoDBがなくてもサーバーは起動します（データは保存されません）
- データの永続化が必要な場合は、ローカルMongoDBまたはMongoDB Atlasを使用してください

## 🎯 次のステップ

1. ブラウザで http://localhost:3000 にアクセス
2. アプリケーションが正常に動作することを確認
3. データを追加して動作をテスト

