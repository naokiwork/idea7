# GitHubリポジトリへのマージ To-Doリスト

このドキュメントは、現在のプロジェクト（`idea-5`）をGitHubリポジトリ `naokiwork/idea7` にマージするための詳細な手順を記載しています。

## 📋 全体の流れ

1. プロジェクトの準備と確認
2. Gitリポジトリの初期化・確認
3. ファイルのステージングとコミット
4. GitHubリポジトリとの接続
5. プッシュと確認

---

## ✅ ステップ1: プロジェクトの準備と確認

### 1.1 現在のディレクトリを確認
```bash
pwd
# 出力: /Users/naokionda/Documents/project/idea-5 であることを確認
```

### 1.2 プロジェクトファイルの確認
```bash
ls -la
# 主要なファイルとディレクトリが存在することを確認
# app/, server/, components/, package.json など
```

### 1.3 .gitignoreの確認
```bash
cat .gitignore
# 以下のファイルが除外されていることを確認:
# - node_modules/
# - .env
# - .env.local
# - .next/
# - dist/
# - *.log
```

**確認ポイント:**
- [ ] `.env` ファイルが `.gitignore` に含まれている
- [ ] `node_modules/` が除外されている
- [ ] 機密情報を含むファイルが除外されている

---

## ✅ ステップ2: Gitリポジトリの初期化・確認

### 2.1 Gitリポジトリの状態確認
```bash
git status
```

**ケースA: Gitリポジトリが既に初期化されている場合**
- `.git` フォルダが存在する
- `git status` でファイルの状態が表示される
- → **ステップ2.2をスキップしてステップ3へ**

**ケースB: Gitリポジトリが初期化されていない場合**
- `.git` フォルダが存在しない
- `fatal: not a git repository` エラーが表示される
- → **ステップ2.2を実行**

### 2.2 Gitリポジトリの初期化（必要な場合のみ）
```bash
git init
```

**確認:**
```bash
ls -la .git
# .git ディレクトリが作成されたことを確認
```

**チェックリスト:**
- [ ] Gitリポジトリが初期化された（または既に初期化済み）
- [ ] `.git` ディレクトリが存在する

---

## ✅ ステップ3: リモートリポジトリの確認・設定

### 3.1 既存のリモートリポジトリを確認
```bash
git remote -v
```

**ケースA: リモートが設定されていない場合**
- 何も表示されない
- → **ステップ3.2を実行**

**ケースB: 既存のリモートが設定されている場合**
- `origin` などのリモートが表示される
- → **ステップ3.3を実行して既存のリモートを削除または更新**

### 3.2 新しいリモートリポジトリを追加（リモートが存在しない場合）
```bash
git remote add origin https://github.com/naokiwork/idea7.git
```

### 3.3 既存のリモートを更新（リモートが既に存在する場合）

**オプション1: 既存のリモートを削除して追加**
```bash
git remote rm origin
git remote add origin https://github.com/naokiwork/idea7.git
```

**オプション2: 既存のリモートのURLを変更**
```bash
git remote set-url origin https://github.com/naokiwork/idea7.git
```

**確認:**
```bash
git remote -v
# 出力例:
# origin  https://github.com/naokiwork/idea7.git (fetch)
# origin  https://github.com/naokiwork/idea7.git (push)
```

**チェックリスト:**
- [ ] リモートリポジトリが正しく設定された
- [ ] `origin` が `https://github.com/naokiwork/idea7.git` を指している

---

## ✅ ステップ4: ファイルのステージング

### 4.1 すべてのファイルをステージングエリアに追加
```bash
git add .
```

### 4.2 ステージングされたファイルを確認
```bash
git status
```

**確認ポイント:**
- [ ] 必要なファイルがすべてステージングされている
- [ ] `.env` や `node_modules/` がステージングされていない（.gitignoreで除外されている）
- [ ] `app/`, `server/`, `components/`, `package.json` など主要ファイルが含まれている

**注意:** もし `.env` や機密情報がステージングされている場合は、以下を実行:
```bash
git reset HEAD .env
# または
git restore --staged .env
```

---

## ✅ ステップ5: 初回コミット

### 5.1 コミットメッセージの準備
適切なコミットメッセージを考えます。例:
- "Initial commit: Study Hour Calendar application"
- "Initial commit: Next.js + Express + MongoDB study tracking app"
- "feat: Add Study Hour Calendar with full-stack implementation"

### 5.2 コミットの実行
```bash
git commit -m "Initial commit: Study Hour Calendar application with Next.js, Express, and MongoDB"
```

**確認:**
```bash
git log --oneline
# コミットが作成されたことを確認
```

**チェックリスト:**
- [ ] コミットが正常に作成された
- [ ] コミットメッセージが適切である
- [ ] `git log` でコミット履歴が表示される

---

## ✅ ステップ6: ブランチ名の確認・変更

### 6.1 現在のブランチ名を確認
```bash
git branch
```

### 6.2 ブランチ名を `main` に変更（必要な場合）
GitHubのデフォルトブランチは通常 `main` です。

**現在のブランチが `master` の場合:**
```bash
git branch -M main
```

**既に `main` の場合:**
- このステップはスキップ

**確認:**
```bash
git branch
# 出力: * main であることを確認
```

**チェックリスト:**
- [ ] ブランチ名が `main` である
- [ ] 現在のブランチが `main` である（* マークが付いている）

---

## ✅ ステップ7: GitHubへのプッシュ

### 7.1 GitHub認証の確認
GitHubへのプッシュには認証が必要です。

**認証方法の確認:**
- Personal Access Token (PAT) を使用
- SSH キーを使用
- GitHub CLI を使用

### 7.2 プッシュの実行
```bash
git push -u origin main
```

**`-u` オプションの意味:**
- `-u` (または `--set-upstream`): ローカルブランチとリモートブランチの追跡関係を設定
- 次回以降は `git push` だけでプッシュ可能

### 7.3 認証が求められた場合

**Personal Access Token を使用する場合:**
1. GitHub で Personal Access Token を作成
   - Settings → Developer settings → Personal access tokens → Tokens (classic)
2. パスワードの代わりにトークンを入力

**SSH を使用する場合:**
```bash
# リモートURLをSSH形式に変更
git remote set-url origin git@github.com:naokiwork/idea7.git
git push -u origin main
```

**チェックリスト:**
- [ ] プッシュが正常に完了した
- [ ] エラーメッセージが表示されていない
- [ ] "Enumerating objects", "Counting objects", "Writing objects" が表示された

---

## ✅ ステップ8: GitHubでの確認

### 8.1 リポジトリの確認
ブラウザで以下のURLを開く:
```
https://github.com/naokiwork/idea7
```

### 8.2 確認項目
- [ ] プロジェクトファイルがすべてアップロードされている
- [ ] `README.md` が表示されている
- [ ] `package.json` が存在する
- [ ] `app/`, `server/`, `components/` ディレクトリが存在する
- [ ] `.env` ファイルがアップロードされていない（機密情報保護）
- [ ] `node_modules/` がアップロードされていない

### 8.3 コミット履歴の確認
- [ ] コミット履歴が表示されている
- [ ] コミットメッセージが正しく表示されている

---

## ✅ ステップ9: 追加の設定（オプション）

### 9.1 README.mdの確認
```bash
cat README.md
```
GitHubでREADMEが正しく表示されることを確認。

### 9.2 .gitignoreの最終確認
```bash
git check-ignore -v .env node_modules/.bin
# .gitignore が正しく機能していることを確認
```

### 9.3 リポジトリの説明を追加（GitHub上で）
1. GitHubリポジトリページで "Settings" を開く
2. "About" セクションで説明を追加:
   - "Study Hour Calendar - Track and visualize your study hours"
3. トピックを追加（オプション）:
   - `nextjs`, `typescript`, `mongodb`, `express`, `study-tracker`

---

## 🚨 トラブルシューティング

### エラー: "remote origin already exists"
```bash
git remote rm origin
git remote add origin https://github.com/naokiwork/idea7.git
```

### エラー: "failed to push some refs"
```bash
# リモートの変更を取得
git fetch origin

# リモートとマージ（必要に応じて）
git merge origin/main --allow-unrelated-histories

# 再度プッシュ
git push -u origin main
```

### エラー: "authentication failed"
- Personal Access Token を確認
- SSH キーの設定を確認
- GitHub CLI を使用: `gh auth login`

### 大きなファイルが含まれている場合
```bash
# .gitignore に追加
echo "large-file.zip" >> .gitignore

# キャッシュから削除
git rm --cached large-file.zip

# 再コミット
git add .
git commit -m "Remove large files"
git push -u origin main
```

---

## 📝 完了チェックリスト

すべてのステップが完了したら、以下を確認:

- [ ] Gitリポジトリが正常に初期化されている
- [ ] リモートリポジトリが正しく設定されている
- [ ] すべてのファイルがコミットされている
- [ ] GitHubに正常にプッシュされている
- [ ] GitHubでファイルが正しく表示されている
- [ ] 機密情報（.env）がアップロードされていない
- [ ] README.mdが正しく表示されている

---

## 🎉 次のステップ

GitHubへのマージが完了したら:

1. **CI/CDの設定**（オプション）
   - GitHub Actions の設定
   - 自動テストの追加

2. **デプロイの準備**
   - Vercel（フロントエンド）の設定
   - Railway/Render（バックエンド）の設定
   - MongoDB Atlas の設定

3. **コラボレーション**
   - コントリビューターの追加
   - ブランチ保護ルールの設定

---

## 📚 参考コマンド一覧

```bash
# 状態確認
git status
git remote -v
git branch

# ファイル操作
git add .
git commit -m "message"
git push -u origin main

# トラブルシューティング
git remote rm origin
git remote add origin <url>
git branch -M main
```

---

**作成日:** 2024年
**対象リポジトリ:** naokiwork/idea7
**プロジェクト:** Study Hour Calendar

