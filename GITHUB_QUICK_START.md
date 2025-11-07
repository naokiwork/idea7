# GitHubマージ クイックスタートガイド

このガイドは、プロジェクトをGitHubリポジトリ `naokiwork/idea7` に素早くプッシュするための簡潔な手順です。

詳細な手順は [GITHUB_MERGE_TODO.md](./GITHUB_MERGE_TODO.md) を参照してください。

## 🚀 クイックコマンド

```bash
# 1. 現在のディレクトリ確認
cd /Users/naokionda/Documents/project/idea-5

# 2. Gitリポジトリの状態確認
git status

# 3. Gitリポジトリが初期化されていない場合
git init

# 4. リモートリポジトリの設定（既存のリモートがある場合は削除してから）
git remote rm origin 2>/dev/null || true
git remote add origin https://github.com/naokiwork/idea7.git

# 5. すべてのファイルをステージング
git add .

# 6. コミット
git commit -m "Initial commit: Study Hour Calendar application with Next.js, Express, and MongoDB"

# 7. ブランチ名をmainに変更（必要な場合）
git branch -M main

# 8. GitHubにプッシュ
git push -u origin main
```

## ⚠️ 注意事項

1. **認証が必要**: プッシュ時にGitHubの認証（Personal Access Token または SSH）が必要です
2. **.envファイル**: `.env` ファイルは `.gitignore` に含まれているため、アップロードされません
3. **node_modules**: `node_modules/` も自動的に除外されます

## 🔍 確認コマンド

```bash
# リモートリポジトリの確認
git remote -v

# ステージング状態の確認
git status

# ブランチの確認
git branch
```

## 🆘 エラーが発生した場合

詳細なトラブルシューティングは [GITHUB_MERGE_TODO.md](./GITHUB_MERGE_TODO.md) の「トラブルシューティング」セクションを参照してください。

