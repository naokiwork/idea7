# クイック修正ガイド

## 404エラーが表示される場合

### 問題
Next.jsアプリケーションで404エラーが表示される

### 解決方法

#### ステップ1: すべてのプロセスを停止

```bash
# すべてのNodeプロセスを終了
pkill -9 node

# ポートを確認
lsof -ti:3000 -ti:5000
```

#### ステップ2: クリーンな状態で再起動

```bash
cd /Users/naokionda/Documents/project/idea-5
npm run dev
```

#### ステップ3: 動作確認

**バックエンド:**
```bash
curl http://localhost:5000/api/health
```

正常な応答:
```json
{
  "status": "ok",
  "message": "Study Hour Calendar API is running"
}
```

**フロントエンド:**
ブラウザで http://localhost:3000 にアクセス

### よくある問題

1. **ポートが使用されている**
   - 解決: `pkill -9 node` で全プロセスを終了

2. **バックエンドが起動していない**
   - 解決: バックエンドのログを確認

3. **環境変数が設定されていない**
   - 解決: `.env` と `.env.local` ファイルを確認

### 完全リセット手順

```bash
# 1. すべてのプロセスを終了
pkill -9 node

# 2. ポートを確認（何も表示されないことを確認）
lsof -ti:3000 -ti:5000

# 3. アプリケーションを起動
cd /Users/naokionda/Documents/project/idea-5
npm run dev

# 4. 10秒待ってから確認
sleep 10
curl http://localhost:5000/api/health
```

ブラウザで http://localhost:3000 にアクセスして確認してください。

