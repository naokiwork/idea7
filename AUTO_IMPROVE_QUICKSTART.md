# 自動コード改善システム - クイックスタート

5分でセットアップできる簡易ガイドです。

## 前提条件

- GitHubリポジトリへのアクセス権限
- OpenAI APIキー（https://platform.openai.com/api-keys）
- GitHub Personal Access Token（https://github.com/settings/tokens）

## セットアップ手順

### 1. ファイルをコピー（2分）

以下の3つのファイルをプロジェクトにコピー：

```
.github/workflows/auto-improve.yml
scripts/auto-improve.ts
scripts/tsconfig.json（オプション）
```

### 2. 依存関係をインストール（1分）

```bash
npm install --save-dev openai @octokit/rest simple-git ts-node typescript
```

### 3. package.jsonに追加（30秒）

```json
{
  "scripts": {
    "auto-improve": "ts-node scripts/auto-improve.ts"
  }
}
```

### 4. GitHub Secretsを設定（1分）

リポジトリの **Settings > Secrets and variables > Actions** で：

- `OPENAI_API_KEY`: OpenAI APIキー
- `GH_PAT_FOR_AUTOMERGE`: GitHub Personal Access Token（`repo`権限）

### 5. CODE_IMPROVEMENTS.mdを作成（30秒）

```markdown
# コード改善点リスト

## 🔴 高優先度

### 1. 改善例
**場所**: `src/example.ts:10`
- 問題の説明
- **修正**: 修正方法の説明
```

### 6. テスト実行（30秒）

GitHub Actionsの **Actions** タブから手動実行して確認。

## 完了！

これで毎時間自動でコード改善が実行されます。

詳細は [AUTO_IMPROVE_GUIDE.md](./AUTO_IMPROVE_GUIDE.md) を参照してください。

