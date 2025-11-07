# デプロイ To-Doリスト

このドキュメントは、Study Hour Calendarアプリケーションを本番環境にデプロイするための詳細な手順を記載しています。

## 📋 デプロイ構成

- **フロントエンド（Next.js）**: Vercel
- **バックエンド（Express）**: Railway または Render
- **データベース（MongoDB）**: MongoDB Atlas

---

## ✅ フェーズ1: MongoDB Atlas のセットアップ

### 1.1 MongoDB Atlas アカウントの作成
- [ ] MongoDB Atlas (https://www.mongodb.com/cloud/atlas) にアクセス
- [ ] アカウントを作成（無料プランでOK）
- [ ] メール認証を完了

### 1.2 クラスターの作成
- [ ] "Build a Database" をクリック
- [ ] 無料プラン（M0 Free）を選択
- [ ] クラウドプロバイダーを選択（AWS推奨）
- [ ] リージョンを選択（東京: ap-northeast-1 推奨）
- [ ] クラスター名を設定（例: `study-calendar-cluster`）
- [ ] "Create Cluster" をクリック
- [ ] クラスターの作成完了を待つ（3-5分）

### 1.3 データベースユーザーの作成
- [ ] "Database Access" をクリック
- [ ] "Add New Database User" をクリック
- [ ] 認証方法: "Password" を選択
- [ ] ユーザー名を設定（例: `study-calendar-user`）
- [ ] パスワードを生成・保存（**重要: 必ず保存**）
- [ ] 権限: "Atlas admin" または "Read and write to any database" を選択
- [ ] "Add User" をクリック

### 1.4 ネットワークアクセスの設定
- [ ] "Network Access" をクリック
- [ ] "Add IP Address" をクリック
- [ ] 開発用: "Add Current IP Address" をクリック
- [ ] 本番用: "Allow Access from Anywhere" (0.0.0.0/0) を追加
- [ ] "Confirm" をクリック

### 1.5 接続文字列の取得
- [ ] "Database" → "Connect" をクリック
- [ ] "Connect your application" を選択
- [ ] Driver: "Node.js" を選択
- [ ] Version: "5.5 or later" を選択
- [ ] 接続文字列をコピー（例: `mongodb+srv://username:password@cluster.mongodb.net/study-calendar`）
- [ ] **接続文字列を安全な場所に保存**

**確認項目:**
- [ ] MongoDB Atlas クラスターが作成されている
- [ ] データベースユーザーが作成されている
- [ ] ネットワークアクセスが設定されている
- [ ] 接続文字列を取得・保存している

---

## ✅ フェーズ2: バックエンド（Express）のデプロイ

### オプションA: Railway を使用する場合

#### 2A.1 Railway アカウントの作成
- [ ] Railway (https://railway.app) にアクセス
- [ ] "Start a New Project" をクリック
- [ ] GitHubアカウントでログイン
- [ ] リポジトリへのアクセスを許可

#### 2A.2 プロジェクトの作成
- [ ] "New Project" をクリック
- [ ] "Deploy from GitHub repo" を選択
- [ ] リポジトリ `naokiwork/idea7` を選択
- [ ] プロジェクト名を設定（例: `study-calendar-backend`）

#### 2A.3 サービスの設定
- [ ] "New Service" → "GitHub Repo" を選択
- [ ] 同じリポジトリを選択
- [ ] サービス名を設定（例: `backend-api`）

#### 2A.4 環境変数の設定
- [ ] サービスをクリック → "Variables" タブ
- [ ] 以下の環境変数を追加:
  ```
  PORT=5000
  NODE_ENV=production
  MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/study-calendar
  ```
- [ ] MongoDB Atlas の接続文字列を `MONGODB_URI` に設定

#### 2A.5 ビルド設定
- [ ] "Settings" タブを開く
- [ ] "Build Command" を設定（空欄のままでもOK、自動検出）
- [ ] "Start Command" を設定:
  ```
  npm run start:backend
  ```
- [ ] "Root Directory" を確認（`/` のまま）

#### 2A.6 デプロイの実行
- [ ] Railway が自動的にデプロイを開始
- [ ] デプロイログを確認
- [ ] デプロイが成功するまで待つ（5-10分）

#### 2A.7 カスタムドメインの取得
- [ ] デプロイ完了後、"Settings" → "Generate Domain" をクリック
- [ ] 生成されたURLをコピー（例: `backend-api-production.up.railway.app`）
- [ ] **このURLを保存（フロントエンドで使用）**

**確認項目:**
- [ ] Railway プロジェクトが作成されている
- [ ] 環境変数が設定されている
- [ ] デプロイが成功している
- [ ] バックエンドAPIのURLを取得している

### オプションB: Render を使用する場合

#### 2B.1 Render アカウントの作成
- [ ] Render (https://render.com) にアクセス
- [ ] "Get Started for Free" をクリック
- [ ] GitHubアカウントでログイン
- [ ] リポジトリへのアクセスを許可

#### 2B.2 Webサービスの作成
- [ ] "New +" → "Web Service" をクリック
- [ ] リポジトリ `naokiwork/idea7` を選択
- [ ] サービス名を設定（例: `study-calendar-backend`）

#### 2B.3 ビルド設定
- [ ] "Build Command": 空欄（自動検出）
- [ ] "Start Command": 
  ```
  npm run start:backend
  ```

#### 2B.4 環境変数の設定
- [ ] "Environment" セクションで以下を追加:
  ```
  PORT=5000
  NODE_ENV=production
  MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/study-calendar
  ```

#### 2B.5 デプロイの実行
- [ ] "Create Web Service" をクリック
- [ ] デプロイログを確認
- [ ] デプロイが成功するまで待つ

#### 2B.6 URLの取得
- [ ] デプロイ完了後、URLをコピー（例: `study-calendar-backend.onrender.com`）
- [ ] **このURLを保存（フロントエンドで使用）**

---

## ✅ フェーズ3: バックエンドの設定ファイル作成

### 3.1 バックエンド用の設定ファイル作成
- [ ] `server/package.json` を作成（バックエンド専用のpackage.json）
- [ ] または、ルートの `package.json` に本番用スクリプトを追加

### 3.2 TypeScriptのビルド設定
- [ ] `server/tsconfig.json` を確認
- [ ] ビルド出力ディレクトリを確認（`dist/` など）

### 3.3 ビルドスクリプトの追加
`package.json` に以下を追加:
```json
"scripts": {
  "build:server": "tsc --project server/tsconfig.json",
  "start:backend": "node server/dist/index.js"
}
```

### 3.4 ビルドのテスト
- [ ] ローカルでビルドをテスト:
  ```bash
  npm run build:server
  ```
- [ ] ビルドが成功することを確認
- [ ] `server/dist/` ディレクトリが作成されることを確認

**確認項目:**
- [ ] ビルドスクリプトが追加されている
- [ ] ローカルでビルドが成功する
- [ ] ビルド出力ファイルが生成される

---

## ✅ フェーズ4: フロントエンド（Next.js）のデプロイ

### 4.1 Vercel アカウントの作成
- [ ] Vercel (https://vercel.com) にアクセス
- [ ] "Sign Up" をクリック
- [ ] GitHubアカウントでログイン
- [ ] リポジトリへのアクセスを許可

### 4.2 プロジェクトのインポート
- [ ] "Add New..." → "Project" をクリック
- [ ] リポジトリ `naokiwork/idea7` を選択
- [ ] "Import" をクリック

### 4.3 プロジェクト設定
- [ ] Framework Preset: "Next.js" を選択
- [ ] Root Directory: `./` を確認
- [ ] Build Command: `npm run build` を確認
- [ ] Output Directory: `.next` を確認（自動検出）

### 4.4 環境変数の設定
- [ ] "Environment Variables" セクションを開く
- [ ] 以下を追加:
  ```
  NEXT_PUBLIC_API_URL=https://your-backend-url.railway.app/api
  ```
- [ ] Railway または Render で取得したバックエンドURLを設定
- [ ] 環境: Production, Preview, Development すべてにチェック

### 4.5 デプロイの実行
- [ ] "Deploy" をクリック
- [ ] デプロイログを確認
- [ ] ビルドが成功するまで待つ（3-5分）

### 4.6 デプロイURLの確認
- [ ] デプロイ完了後、URLを確認（例: `study-hour-calendar.vercel.app`）
- [ ] **このURLを保存（アプリケーションの公開URL）**

**確認項目:**
- [ ] Vercel プロジェクトが作成されている
- [ ] 環境変数が設定されている
- [ ] デプロイが成功している
- [ ] フロントエンドURLを取得している

---

## ✅ フェーズ5: CORS設定の更新

### 5.1 バックエンドのCORS設定を確認
- [ ] `server/index.ts` のCORS設定を確認
- [ ] 本番環境のフロントエンドURLを許可リストに追加

### 5.2 CORS設定の更新
`server/index.ts` を更新:
```typescript
const corsOptions = {
  origin: [
    'http://localhost:3000', // 開発環境
    'https://your-app.vercel.app', // 本番環境
  ],
  credentials: true,
};
app.use(cors(corsOptions));
```

### 5.3 変更をコミット・プッシュ
- [ ] 変更をコミット:
  ```bash
  git add server/index.ts
  git commit -m "Update CORS settings for production"
  git push origin main
  ```
- [ ] Railway/Render が自動的に再デプロイすることを確認

**確認項目:**
- [ ] CORS設定が更新されている
- [ ] 変更がGitHubにプッシュされている
- [ ] バックエンドが再デプロイされている

---

## ✅ フェーズ6: 動作確認とテスト

### 6.1 フロントエンドの動作確認
- [ ] デプロイされたフロントエンドURLにアクセス
- [ ] ページが正常に表示されることを確認
- [ ] エラーメッセージがないことを確認

### 6.2 バックエンドAPIの動作確認
- [ ] ブラウザで `https://your-backend-url/api/health` にアクセス
- [ ] `{"status":"ok","message":"Study Hour Calendar API is running"}` が返ることを確認

### 6.3 データベース接続の確認
- [ ] フロントエンドからデータを追加してみる
- [ ] MongoDB Atlas の "Collections" でデータが保存されていることを確認

### 6.4 エンドツーエンドテスト
- [ ] プランの設定が動作することを確認
- [ ] 記録の追加が動作することを確認
- [ ] カレンダーの表示が正常であることを確認
- [ ] 統計情報の表示が正常であることを確認

**確認項目:**
- [ ] フロントエンドが正常に動作している
- [ ] バックエンドAPIが正常に動作している
- [ ] データベース接続が正常である
- [ ] すべての機能が動作している

---

## ✅ フェーズ7: カスタムドメインの設定（オプション）

### 7.1 ドメインの取得
- [ ] ドメイン名を決定
- [ ] ドメイン登録サービスでドメインを購入（例: Namecheap, Google Domains）

### 7.2 Vercelでのカスタムドメイン設定
- [ ] Vercel プロジェクト → "Settings" → "Domains"
- [ ] カスタムドメインを追加
- [ ] DNS設定を確認（Vercelが指示を表示）

### 7.3 DNS設定
- [ ] ドメイン管理画面でDNSレコードを設定
- [ ] CNAME レコードを追加（Vercelが提供する値）

**確認項目:**
- [ ] カスタムドメインが設定されている
- [ ] DNS設定が正しい
- [ ] カスタムドメインでアクセスできる

---

## ✅ フェーズ8: セキュリティと最適化

### 8.1 環境変数の確認
- [ ] 機密情報が環境変数に設定されていることを確認
- [ ] `.env` ファイルがGitHubにコミットされていないことを確認

### 8.2 エラーハンドリングの確認
- [ ] 本番環境でエラーメッセージが適切に表示されることを確認
- [ ] 開発環境のデバッグ情報が本番環境で表示されないことを確認

### 8.3 パフォーマンスの最適化
- [ ] Vercel の Analytics でパフォーマンスを確認
- [ ] 必要に応じて最適化を実施

### 8.4 モニタリングの設定（オプション）
- [ ] Railway/Render のログを確認できることを確認
- [ ] エラー通知の設定（オプション）

**確認項目:**
- [ ] セキュリティ設定が適切である
- [ ] エラーハンドリングが適切である
- [ ] パフォーマンスが良好である

---

## 🚨 トラブルシューティング

### バックエンドが起動しない
- [ ] 環境変数 `MONGODB_URI` が正しく設定されているか確認
- [ ] ビルドコマンドが正しいか確認
- [ ] ログを確認してエラーを特定

### フロントエンドがバックエンドに接続できない
- [ ] `NEXT_PUBLIC_API_URL` が正しく設定されているか確認
- [ ] CORS設定が正しいか確認
- [ ] バックエンドURLが正しいか確認

### データベース接続エラー
- [ ] MongoDB Atlas のネットワークアクセス設定を確認
- [ ] 接続文字列が正しいか確認
- [ ] データベースユーザーの権限を確認

### ビルドエラー
- [ ] 依存関係が正しくインストールされているか確認
- [ ] TypeScriptの設定を確認
- [ ] ビルドログを確認してエラーを特定

---

## 📝 デプロイ完了チェックリスト

すべてのステップが完了したら、以下を確認:

- [ ] MongoDB Atlas が設定されている
- [ ] バックエンドがデプロイされている
- [ ] フロントエンドがデプロイされている
- [ ] 環境変数が正しく設定されている
- [ ] CORS設定が更新されている
- [ ] アプリケーションが正常に動作している
- [ ] データベース接続が正常である
- [ ] すべての機能が動作している

---

## 🎉 デプロイ完了後のURL

デプロイが完了すると、以下のURLが利用可能になります:

- **フロントエンド**: `https://your-app.vercel.app`
- **バックエンドAPI**: `https://your-backend.railway.app/api` または `https://your-backend.onrender.com/api`
- **GitHubリポジトリ**: `https://github.com/naokiwork/idea7`

---

## 📚 参考リソース

- [Vercel Documentation](https://vercel.com/docs)
- [Railway Documentation](https://docs.railway.app)
- [Render Documentation](https://render.com/docs)
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com)

---

**作成日:** 2024年
**対象プロジェクト:** Study Hour Calendar
**デプロイ構成:** Next.js (Vercel) + Express (Railway/Render) + MongoDB Atlas

