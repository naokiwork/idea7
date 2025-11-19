# Railway トラブルシューティングガイド

## アプリケーションが応答しない場合の確認事項

### 1. 環境変数の確認

Railwayダッシュボードで以下を確認：

1. **サービスを開く** → **"Variables"** タブ
2. 以下の環境変数が設定されているか確認：

```
PORT=5000
NODE_ENV=production
MONGODB_URI=mongodb+srv://naokiondawork_db_user:HZRa0SqYijT7qUCm@cluster0.vdoi3su.mongodb.net/study-calendar
```

**重要:** 
- `PORT` は Railway が自動的に設定する場合がありますが、明示的に設定しても問題ありません
- `MONGODB_URI` は必ず設定してください

### 2. デプロイログの確認

1. Railwayダッシュボードで **"Deployments"** タブを開く
2. 最新のデプロイメントをクリック
3. **"View logs"** をクリック
4. 以下のログを確認：

**正常な場合:**
```
Environment check:
PORT: 5000
NODE_ENV: production
MONGODB_URI: Set
🔄 Connecting to MongoDB...
✅ Connected to MongoDB
🚀 Server running on port 5000
```

**エラーの場合:**
- MongoDB接続エラー
- 環境変数が設定されていない
- ポートの競合

### 3. ポート設定の確認

RailwayのNetworking設定で：

1. **"Settings"** → **"Networking"** を開く
2. **"Generate Service Domain"** セクションで
3. ポート番号が **5000** に設定されているか確認
4. もし8080になっている場合は、5000に変更して再生成

### 4. よくある問題と解決方法

#### 問題1: MongoDB接続エラー

**症状:** ログに "Failed to connect to MongoDB" が表示される

**解決方法:**
- MongoDB Atlas のネットワークアクセス設定を確認
- `0.0.0.0/0` が追加されているか確認
- 接続文字列が正しいか確認

#### 問題2: 環境変数が設定されていない

**症状:** ログに "MONGODB_URI is not properly configured" が表示される

**解決方法:**
- Railwayの "Variables" タブで環境変数を再設定
- 変数名と値が正しいか確認
- 保存後、再デプロイを実行

#### 問題3: ポートが正しく設定されていない

**症状:** アプリケーションが起動しているが、アクセスできない

**解決方法:**
- Networking設定でポート5000を指定
- Railwayが自動設定するPORT環境変数を使用（推奨）

### 5. 再デプロイの方法

1. **"Deployments"** タブを開く
2. 最新のデプロイメントの右側の **"..."** メニューをクリック
3. **"Redeploy"** を選択

または、GitHubに新しいコミットをプッシュすると自動的に再デプロイされます。

### 6. ログの確認コマンド

RailwayのCLIを使用する場合：
```bash
railway logs
```

### 7. ヘルスチェック

デプロイが成功したら、以下のURLで確認：
```
https://your-url.railway.app/api/health
```

正常な応答：
```json
{
  "status": "ok",
  "message": "Study Hour Calendar API is running"
}
```

## 次のステップ

問題が解決したら：
1. バックエンドAPI URLを取得
2. Vercelでのフロントエンドデプロイに進む

