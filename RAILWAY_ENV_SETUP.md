# Railway 環境変数設定ガイド

## 問題: MONGODB_URI が正しく設定されていない

ログに `MONGODB_URI: Set` と表示されていても、値が空文字列またはデフォルト値になっている可能性があります。

## 解決方法: Railwayで環境変数を正しく設定

### ステップ1: Variables タブを開く

1. Railwayダッシュボードでプロジェクト「idea7」を開く
2. サービス（backend-apiなど）をクリック
3. **"Variables"** タブをクリック

### ステップ2: 環境変数を確認・設定

以下の環境変数が**正確に**設定されているか確認してください：

#### 1. MONGODB_URI（最重要）

**変数名:** `MONGODB_URI`  
**値:** 
```
mongodb+srv://naokiondawork_db_user:HZRa0SqYijT7qUCm@cluster0.vdoi3su.mongodb.net/study-calendar
```

**注意事項:**
- 値の前後にスペースがないか確認
- 値全体をコピー&ペーストする
- パスワード部分（`HZRa0SqYijT7qUCm`）が正確か確認

#### 2. NODE_ENV

**変数名:** `NODE_ENV`  
**値:** `production`

#### 3. PORT（オプション）

**変数名:** `PORT`  
**値:** `5000`

**注意:** Railwayが自動的に設定する場合もありますが、明示的に設定しても問題ありません。

### ステップ3: 環境変数の追加方法

1. **"Variables"** タブで **"+ New Variable"** をクリック
2. **"Name"** に変数名を入力（例: `MONGODB_URI`）
3. **"Value"** に値を入力（例: `mongodb+srv://...`）
4. **"Add"** をクリック

### ステップ4: 既存の環境変数を更新する場合

1. 既存の変数名をクリック
2. 値を編集
3. **"Save"** をクリック

### ステップ5: 環境変数の確認

設定後、以下のように表示されることを確認：

```
MONGODB_URI = mongodb+srv://naokiondawork_db_user:HZRa0SqYijT7qUCm@cluster0.vdoi3su.mongodb.net/study-calendar
NODE_ENV = production
PORT = 5000
```

### ステップ6: 再デプロイ

環境変数を設定・更新した後：

1. **"Deployments"** タブを開く
2. 最新のデプロイメントの右側の **"..."** メニューをクリック
3. **"Redeploy"** を選択

または、GitHubに新しいコミットをプッシュすると自動的に再デプロイされます。

## 確認方法

再デプロイ後、ログで以下が表示されることを確認：

```
Environment check:
PORT: 5000
NODE_ENV: production
MONGODB_URI exists: true
MONGODB_URI length: 100 (おおよその長さ)
MONGODB_URI starts with mongodb: true
🔄 Connecting to MongoDB...
✅ Connected to MongoDB
🚀 Server running on port 5000
```

## よくある間違い

1. **変数名のタイポ**
   - ❌ `MONGODB_URL`
   - ❌ `MONGO_URI`
   - ✅ `MONGODB_URI`

2. **値の前後にスペース**
   - ❌ ` mongodb+srv://... `
   - ✅ `mongodb+srv://...`

3. **値が空文字列**
   - 変数は存在するが、値が空
   - 必ず値を入力する

4. **デフォルト値が使われている**
   - 環境変数が設定されていない場合、コードのデフォルト値（localhost）が使われる
   - 必ず環境変数を設定する

## 次のステップ

環境変数が正しく設定され、デプロイが成功したら：
1. バックエンドAPI URLを取得
2. Vercelでのフロントエンドデプロイに進む

