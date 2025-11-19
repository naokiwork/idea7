# Railway バックエンドAPI URLの取得方法

## 方法1: Settings タブから取得（推奨）

1. Railwayダッシュボードで、プロジェクト「idea7」を開く
2. 左側のメニューから **"Settings"** タブをクリック
3. **"Networking"** セクションを探す
4. **"Generate Domain"** ボタンをクリック（まだ生成していない場合）
5. 生成されたURLが表示されます（例: `idea7-production.up.railway.app`）

## 方法2: サービス詳細から確認

1. サービス（backend-apiなど）をクリック
2. **"Settings"** タブを開く
3. **"Networking"** セクションでURLを確認

## 方法3: デプロイメント詳細から確認

1. **"Deployments"** タブを開く
2. 成功したデプロイメントをクリック
3. ログや詳細情報にURLが表示される場合があります

## URLの形式

RailwayのURLは通常以下の形式です：
- `https://your-service-name.up.railway.app`
- または `https://your-project-name-production.up.railway.app`

## APIエンドポイント

バックエンドAPIのベースURLが取得できたら、以下のエンドポイントでアクセスできます：

- ヘルスチェック: `https://your-url.railway.app/api/health`
- レコードAPI: `https://your-url.railway.app/api/records`
- プランAPI: `https://your-url.railway.app/api/plans`

## 注意事項

- URLは自動生成されます
- カスタムドメインも設定可能です（有料プランの場合）
- URLは永続的ですが、サービスを削除すると変更される可能性があります

