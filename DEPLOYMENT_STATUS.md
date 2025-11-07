# デプロイ進行状況

## ✅ 完了したステップ

- [x] ローカルビルドテスト完了
  - バックエンドビルド: ✅ 成功
  - フロントエンドビルド: ✅ 成功
- [x] デプロイ設定ファイルの作成
  - railway.json: ✅ 作成済み
  - vercel.json: ✅ 作成済み
  - package.json: ✅ ビルドスクリプト追加済み
- [x] GitHubへのプッシュ完了

## 📋 次のステップ

### 1. MongoDB Atlas のセットアップ（必須）

以下の手順でMongoDB Atlasをセットアップしてください：

1. **MongoDB Atlas にアクセス**
   - https://www.mongodb.com/cloud/atlas にアクセス
   - 無料アカウントを作成（まだの場合）

2. **クラスターを作成**
   - "Build a Database" をクリック
   - M0 Free プランを選択
   - リージョンを選択（東京: ap-northeast-1 推奨）
   - クラスター名を設定
   - "Create Cluster" をクリック

3. **データベースユーザーを作成**
   - "Database Access" → "Add New Database User"
   - ユーザー名とパスワードを設定（**必ず保存**）
   - 権限: "Atlas admin" を選択

4. **ネットワークアクセスを設定**
   - "Network Access" → "Add IP Address"
   - "Allow Access from Anywhere" (0.0.0.0/0) を追加

5. **接続文字列を取得**
   - "Database" → "Connect" → "Connect your application"
   - 接続文字列をコピー（例: `mongodb+srv://username:password@cluster.mongodb.net/study-calendar`）
   - **この接続文字列を保存してください（次のステップで使用）**

### 2. Railway でバックエンドをデプロイ

1. **Railway にアクセス**
   - https://railway.app にアクセス
   - GitHubアカウントでログイン

2. **プロジェクトを作成**
   - "New Project" → "Deploy from GitHub repo"
   - リポジトリ `naokiwork/idea7` を選択

3. **サービスを設定**
   - "New Service" → "GitHub Repo"
   - 同じリポジトリを選択

4. **環境変数を設定**
   - サービス → "Variables" タブ
   - 以下を追加:
     ```
     PORT=5000
     NODE_ENV=production
     MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/study-calendar
     ```
   - MongoDB Atlas の接続文字列を `MONGODB_URI` に設定

5. **デプロイを確認**
   - Railway が自動的にデプロイを開始
   - デプロイ完了後、URLを取得（例: `backend-api-production.up.railway.app`）
   - **このURLを保存してください（次のステップで使用）**

### 3. Vercel でフロントエンドをデプロイ

1. **Vercel にアクセス**
   - https://vercel.com にアクセス
   - GitHubアカウントでログイン

2. **プロジェクトをインポート**
   - "Add New..." → "Project"
   - リポジトリ `naokiwork/idea7` を選択
   - "Import" をクリック

3. **環境変数を設定**
   - "Environment Variables" セクション
   - 以下を追加:
     ```
     NEXT_PUBLIC_API_URL=https://your-backend-url.railway.app/api
     ```
   - Railway で取得したバックエンドURLを設定

4. **デプロイ**
   - "Deploy" をクリック
   - デプロイ完了後、URLを取得（例: `study-hour-calendar.vercel.app`）
   - **これがアプリケーションの公開URLです**

### 4. CORS設定の更新

1. **server/index.ts を更新**
   - CORS設定にVercelのURLを追加

2. **変更をコミット・プッシュ**
   ```bash
   git add server/index.ts
   git commit -m "Update CORS for production"
   git push origin main
   ```

3. **Railway が自動的に再デプロイ**

## 📝 チェックリスト

- [ ] MongoDB Atlas クラスターが作成されている
- [ ] MongoDB Atlas 接続文字列を取得・保存している
- [ ] Railway でバックエンドがデプロイされている
- [ ] バックエンドAPI URLを取得・保存している
- [ ] Vercel でフロントエンドがデプロイされている
- [ ] フロントエンドURLを取得・保存している
- [ ] CORS設定が更新されている
- [ ] アプリケーションが正常に動作している

## 🎯 デプロイ完了後のURL

デプロイが完了すると、以下のURLが利用可能になります：

- **フロントエンド**: `https://your-app.vercel.app`
- **バックエンドAPI**: `https://your-backend.railway.app/api`
- **GitHubリポジトリ**: `https://github.com/naokiwork/idea7`

## 📚 詳細な手順

詳細な手順は [DEPLOYMENT_TODO.md](./DEPLOYMENT_TODO.md) を参照してください。

