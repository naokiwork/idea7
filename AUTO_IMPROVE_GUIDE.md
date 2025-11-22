# 自動コード改善システム - 完全ガイド

このドキュメントでは、GitHub Actionsを使用して毎時間自動でコードベースを改善するシステムのセットアップと使用方法を説明します。このシステムは、Cursorやその他のプロジェクトで使用できます。

## 📋 目次

- [概要](#概要)
- [機能](#機能)
- [セットアップ](#セットアップ)
- [カスタマイズ](#カスタマイズ)
- [他のプロジェクトへの適用](#他のプロジェクトへの適用)
- [トラブルシューティング](#トラブルシューティング)
- [ベストプラクティス](#ベストプラクティス)

## 概要

このシステムは以下の機能を提供します：

- **自動実行**: GitHub Actionsが毎時間（またはカスタムスケジュールで）自動実行
- **コード分析**: 改善点リスト（`CODE_IMPROVEMENTS.md`）から優先度順に改善を選択
- **AIによる改善**: OpenAI APIを使用してコード改善を生成・適用
- **自動コミット・PR**: 変更があれば自動でブランチ作成、コミット、PR作成
- **自動マージ**: テストが通れば自動マージ（オプション）

## 機能

### 1. スケジュール実行
- デフォルト: 毎時間（UTC 0分）
- 手動実行も可能（`workflow_dispatch`）

### 2. 改善点の優先順位処理
- 🔴 高優先度: 即座に修正すべき問題
- 🟡 中優先度: パフォーマンス・UX改善
- 🟢 低優先度: コード品質・保守性

各実行で最大3つの改善点を処理（カスタマイズ可能）

### 3. 改善の適用方法
- **直接適用**: 簡単な改善（未使用変数の削除、マジックナンバーの定数化など）は直接適用
- **AI生成**: 複雑な改善はOpenAI APIを使用してコードを生成

## セットアップ

### ステップ1: ファイルのコピー

以下のファイルをプロジェクトにコピーします：

```
プロジェクトルート/
├── .github/
│   └── workflows/
│       └── auto-improve.yml          # GitHub Actionsワークフロー
├── scripts/
│   ├── auto-improve.ts               # 自動改善スクリプト
│   └── tsconfig.json                 # TypeScript設定（オプション）
└── CODE_IMPROVEMENTS.md              # 改善点リスト（既存または新規作成）
```

### ステップ2: 依存関係のインストール

```bash
npm install --save-dev openai @octokit/rest simple-git ts-node
```

または、`package.json`に追加：

```json
{
  "dependencies": {
    "@octokit/rest": "^20.0.2",
    "openai": "^4.20.1",
    "simple-git": "^3.20.0"
  },
  "devDependencies": {
    "ts-node": "^10.9.2",
    "typescript": "^5.0.0"
  }
}
```

### ステップ3: package.jsonにスクリプトを追加

```json
{
  "scripts": {
    "auto-improve": "ts-node scripts/auto-improve.ts"
  }
}
```

### ステップ4: GitHub Secretsの設定

GitHubリポジトリの **Settings > Secrets and variables > Actions** で以下を設定：

#### 必須シークレット

1. **`OPENAI_API_KEY`**
   - OpenAI APIキー
   - 取得方法: https://platform.openai.com/api-keys
   - 用途: コード改善の生成

2. **`GH_PAT_FOR_AUTOMERGE`**
   - GitHub Personal Access Token
   - 必要な権限:
     - `repo` (フルコントロール)
     - `workflow` (ワークフローの更新)
   - 取得方法: https://github.com/settings/tokens
   - 用途: リポジトリへの書き込み、PR作成、自動マージ

#### シークレットの設定方法

1. GitHubリポジトリにアクセス
2. **Settings** > **Secrets and variables** > **Actions**
3. **New repository secret** をクリック
4. 名前と値を入力して保存

### ステップ5: CODE_IMPROVEMENTS.mdの作成

改善点リストを作成します。形式は以下の通り：

```markdown
# コード改善点リスト

## 🔴 高優先度（即座に修正すべき）

### 1. 未使用の変数
**場所**: `src/components/Example.tsx:22`
- `loading`が定義されているが使用されていない
- **修正**: 削除するか、実際に使用する

### 2. alert()の使用
**場所**: `src/utils/helpers.ts:34`
- モダンなUIではない
- **修正**: 統一されたエラー表示コンポーネントを作成

## 🟡 中優先度（パフォーマンス・UX改善）

### 3. パフォーマンス最適化
**場所**: `src/components/Stats.tsx`
- 毎回統計を再計算している
- **修正**: `useMemo`でメモ化

## 🟢 低優先度（コード品質・保守性）

### 4. マジックナンバー
**場所**: `src/components/Calendar.tsx:82`
- ハードコードされた値
- **修正**: 定数として定義
```

### ステップ6: 初回テスト

GitHub ActionsのUIから手動実行してテスト：

1. リポジトリの **Actions** タブに移動
2. **Auto-improve Codebase** ワークフローを選択
3. **Run workflow** をクリック
4. 実行結果を確認

## カスタマイズ

### 実行頻度の変更

`.github/workflows/auto-improve.yml`の`cron`設定を変更：

```yaml
schedule:
  - cron: '0 * * * *'    # 毎時間（デフォルト）
  # - cron: '0 0 * * *'   # 毎日（UTC 0時）
  # - cron: '0 0 * * 0'   # 毎週日曜日
  # - cron: '0 9 * * 1-5' # 平日の9時（UTC）
```

Cron形式の説明：
- `分 時 日 月 曜日`
- `0 * * * *` = 毎時間の0分
- `0 0 * * *` = 毎日の0時
- `0 0 * * 0` = 毎週日曜日の0時

### 処理する改善点の数を変更

`scripts/auto-improve.ts`の`selectImprovements`関数を変更：

```typescript
// デフォルト: 3つ
const selectedImprovements = selectImprovements(allImprovements, 3);

// 変更例: 5つに増やす
const selectedImprovements = selectImprovements(allImprovements, 5);
```

### AIモデルの変更

`scripts/auto-improve.ts`の`generateImprovement`関数を変更：

```typescript
const response = await openai.chat.completions.create({
  model: 'gpt-4',           // 'gpt-3.5-turbo'などに変更可能
  // ...
});
```

**モデルの選択**:
- `gpt-4`: 高品質だが高コスト（推奨）
- `gpt-3.5-turbo`: 低コストだが品質はやや低い
- `gpt-4-turbo`: バランス型

### ブランチ名の変更

`.github/workflows/auto-improve.yml`のブランチ名を変更：

```yaml
BRANCH_NAME="auto-improve-$(date +%Y%m%d-%H%M%S)"
# 変更例:
# BRANCH_NAME="improvements/$(date +%Y%m%d-%H%M%S)"
```

### コミットメッセージの変更

`.github/workflows/auto-improve.yml`のコミットメッセージを変更：

```yaml
git commit -m "Auto-improve: Code improvements and fixes"
# 変更例:
# git commit -m "chore: auto-improve $(date +%Y-%m-%d)"
```

### 自動マージの設定

既存の`auto-merge-cursor-pr.yml`ワークフローと連携する場合：

1. ブランチ名が`auto-improve-`で始まることを確認
2. 既存のワークフローがこのパターンを認識しているか確認

例：

```yaml
# .github/workflows/auto-merge-cursor-pr.yml
if: startsWith(github.head_ref, 'auto-improve-')
```

## 他のプロジェクトへの適用

### 1. 既存プロジェクトへの追加

```bash
# 1. ワークフローディレクトリを作成
mkdir -p .github/workflows

# 2. スクリプトディレクトリを作成
mkdir -p scripts

# 3. ファイルをコピー
# - .github/workflows/auto-improve.yml
# - scripts/auto-improve.ts
# - scripts/tsconfig.json（オプション）

# 4. 依存関係をインストール
npm install --save-dev openai @octokit/rest simple-git ts-node

# 5. package.jsonにスクリプトを追加
# 6. GitHub Secretsを設定
# 7. CODE_IMPROVEMENTS.mdを作成
```

### 2. 異なる言語のプロジェクト

TypeScript以外のプロジェクトでも使用可能です：

#### JavaScriptプロジェクト

1. `auto-improve.ts`を`auto-improve.js`に変換
2. TypeScriptの型定義を削除
3. `ts-node`の代わりに`node`を使用

```yaml
# .github/workflows/auto-improve.yml
run: |
  node scripts/auto-improve.js
```

#### Pythonプロジェクト

1. Node.jsスクリプトの代わりにPythonスクリプトを作成
2. `openai` Pythonパッケージを使用
3. `github` Pythonパッケージを使用

#### その他の言語

- OpenAI APIはREST APIなので、どの言語からでも呼び出し可能
- GitHub APIもREST APIなので同様

### 3. モノレポでの使用

複数のパッケージがある場合：

```typescript
// scripts/auto-improve.ts を修正
const packages = ['packages/app', 'packages/api', 'packages/shared'];

for (const pkg of packages) {
  const improvementsPath = path.join(process.cwd(), pkg, 'CODE_IMPROVEMENTS.md');
  // ...
}
```

## トラブルシューティング

### エラー: OPENAI_API_KEY環境変数が設定されていない

**症状**: 
```
Error: OPENAI_API_KEY environment variable is not set
```

**解決方法**:
1. GitHub Secretsに`OPENAI_API_KEY`が設定されているか確認
2. ワークフローファイルで環境変数が正しく参照されているか確認

### エラー: PRが作成されない

**症状**: 変更があるのにPRが作成されない

**解決方法**:
1. `GH_PAT_FOR_AUTOMERGE`シークレットが正しく設定されているか確認
2. GitHub CLIの認証が成功しているか確認
3. ワークフローのログでエラーメッセージを確認

### エラー: TypeScriptのコンパイルエラー

**症状**: 
```
error TS18028: Private identifiers are only available when targeting ECMAScript 2015 and higher.
```

**解決方法**:
1. `tsconfig.json`の`target`を`ES2020`以上に設定
2. ワークフローで`--skipLibCheck`オプションを使用（既に実装済み）

### エラー: 改善が適用されない

**症状**: 改善点があるのに適用されない

**解決方法**:
1. `CODE_IMPROVEMENTS.md`の形式が正しいか確認
2. ファイルパスが正しいか確認
3. OpenAI APIのレスポンスを確認（ログを確認）
4. 改善点の優先度が正しく設定されているか確認

### エラー: GitHub CLIが見つからない

**症状**: 
```
gh: command not found
```

**解決方法**:
ワークフローにGitHub CLIのセットアップを追加：

```yaml
- name: Setup GitHub CLI
  run: |
    type -p curl >/dev/null || (apt update && apt install curl -y)
    curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
    chmod go+r /usr/share/keyrings/githubcli-archive-keyring.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | tee /etc/apt/sources.list.d/github-cli.list > /dev/null
    apt update
    apt install gh -y
```

## ベストプラクティス

### 1. 改善点の優先順位付け

- **高優先度**: バグ、セキュリティ問題、パフォーマンスの重大な問題
- **中優先度**: UX改善、コードの可読性、リファクタリング
- **低優先度**: スタイルの統一、ドキュメント、テストの追加

### 2. 改善点の記述

明確で具体的な改善点を記述：

```markdown
### 良い例
**場所**: `src/components/Button.tsx:15`
- `onClick`ハンドラーが未定義の可能性がある
- **修正**: デフォルトの空関数を追加するか、必須プロパティとして定義

### 悪い例
**場所**: `src/components/Button.tsx`
- バグがある
- **修正**: 修正する
```

### 3. テストの重要性

自動マージする前に、必ずテストが通ることを確認：

```yaml
- name: Run tests
  run: npm test

- name: Auto-merge PR if tests pass
  if: success()
  # ...
```

### 4. レビューの推奨

重要な変更は自動マージせず、手動レビューを推奨：

```yaml
# 自動マージを無効化
# if: success() を削除
```

### 5. APIコストの管理

- 実行頻度を調整（毎時間ではなく毎日など）
- 処理する改善点の数を制限
- より安価なモデル（`gpt-3.5-turbo`）を使用

### 6. セキュリティ

- APIキーは必ずGitHub Secretsに保存
- トークンには最小限の権限を付与
- 定期的にトークンをローテーション

## ファイル構造

完全なファイル構造：

```
プロジェクトルート/
├── .github/
│   └── workflows/
│       ├── auto-improve.yml          # 自動改善ワークフロー
│       └── auto-merge-cursor-pr.yml  # 自動マージワークフロー（既存または新規）
├── scripts/
│   ├── auto-improve.ts               # 自動改善スクリプト
│   └── tsconfig.json                 # TypeScript設定（オプション）
├── CODE_IMPROVEMENTS.md             # 改善点リスト
├── package.json                      # 依存関係とスクリプト
└── README.md                         # プロジェクトの説明
```

## 参考リンク

- [GitHub Actions ドキュメント](https://docs.github.com/ja/actions)
- [OpenAI API ドキュメント](https://platform.openai.com/docs)
- [GitHub CLI ドキュメント](https://cli.github.com/manual/)
- [Cron式の説明](https://crontab.guru/)

## ライセンス

このシステムは自由に使用・改変できます。プロジェクトのライセンスに従ってください。

---

**質問や問題がある場合**: GitHub Issuesで報告してください。

