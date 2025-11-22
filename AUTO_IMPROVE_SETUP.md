# 自動改善システムのセットアップ

このドキュメントでは、毎時間自動でコードベースを改善するシステムのセットアップ方法を説明します。

## 概要

このシステムは以下の機能を提供します：

1. **毎時間の自動実行**: GitHub Actionsが毎時間（UTC 0分）にワークフローを実行
2. **コード分析**: `CODE_IMPROVEMENTS.md`から改善点を読み込み、優先度順に処理
3. **AIによる改善**: OpenAI APIを使用してコード改善を生成
4. **自動コミット・PR**: 変更があれば自動でコミットし、PRを作成
5. **自動マージ**: 既存の`auto-merge-cursor-pr.yml`ワークフローと連携して自動マージ

## セットアップ手順

### 1. GitHub Secretsの設定

GitHubリポジトリのSettings > Secrets and variables > Actionsで以下のシークレットを設定してください：

- **`OPENAI_API_KEY`**: OpenAI APIキー（必須）
- **`GH_PAT_FOR_AUTOMERGE`**: GitHub Personal Access Token（既存のものを使用可能）

### 2. 依存関係のインストール

```bash
npm install
```

新しく追加された依存関係：
- `openai`: OpenAI APIクライアント
- `@octokit/rest`: GitHub API操作
- `simple-git`: Git操作

### 3. ローカルでのテスト（オプション）

```bash
# 環境変数を設定
export OPENAI_API_KEY="your-api-key-here"
export GITHUB_TOKEN="your-github-token-here"
export GITHUB_REPOSITORY="owner/repo-name"

# スクリプトを実行
npm run auto-improve
```

## ワークフローの動作

### 実行タイミング

- **スケジュール実行**: 毎時間（UTC 0分）
- **手動実行**: GitHub ActionsのUIから`workflow_dispatch`で実行可能

### 実行フロー

1. リポジトリをチェックアウト
2. Node.js環境のセットアップ
3. 依存関係のインストール
4. TypeScriptのビルド
5. 自動改善スクリプトの実行
   - `CODE_IMPROVEMENTS.md`を解析
   - 優先度の高い改善点を選択（最大3つ）
   - 簡単な改善は直接適用
   - 複雑な改善はOpenAI APIを使用
6. 変更の確認
7. 変更があれば：
   - ブランチ作成（`auto-improve-YYYYMMDD-HHMMSS`）
   - コミット
   - PR作成
8. 既存の`auto-merge-cursor-pr.yml`がテストを実行して自動マージ

## 改善点の優先順位

`CODE_IMPROVEMENTS.md`の優先度に従って処理されます：

1. **🔴 高優先度**: 即座に修正すべき問題
2. **🟡 中優先度**: パフォーマンス・UX改善
3. **🟢 低優先度**: コード品質・保守性

各実行で最大3つの改善点が処理されます。

## トラブルシューティング

### OpenAI APIキーが設定されていない

エラーメッセージ: `Error: OPENAI_API_KEY environment variable is not set`

解決方法: GitHub Secretsに`OPENAI_API_KEY`を設定してください。

### PRが作成されない

- 変更がない場合はPRは作成されません
- GitHub CLIの認証に問題がある可能性があります
- `GH_PAT_FOR_AUTOMERGE`シークレットが正しく設定されているか確認してください

### 改善が適用されない

- `CODE_IMPROVEMENTS.md`の形式が正しいか確認してください
- ファイルパスが正しいか確認してください
- OpenAI APIのレスポンスを確認してください

## カスタマイズ

### 実行頻度の変更

`.github/workflows/auto-improve.yml`の`cron`設定を変更：

```yaml
schedule:
  - cron: '0 * * * *'  # 毎時間
  # - cron: '0 0 * * *'  # 毎日
  # - cron: '0 0 * * 0'  # 毎週
```

### 処理する改善点の数を変更

`scripts/auto-improve.ts`の`selectImprovements`関数の`maxCount`パラメータを変更：

```typescript
const selectedImprovements = selectImprovements(allImprovements, 3); // 3を変更
```

### AIモデルの変更

`scripts/auto-improve.ts`の`generateImprovement`関数でモデルを変更：

```typescript
model: 'gpt-4',  // 'gpt-3.5-turbo'などに変更可能
```

## 注意事項

- **APIコスト**: OpenAI APIの使用量に注意してください
- **変更の確認**: 自動マージされる前に変更内容を確認することを推奨します
- **テスト**: 改善が適用された後、テストが通ることを確認してください

## 関連ファイル

- `.github/workflows/auto-improve.yml`: メインワークフロー
- `.github/workflows/auto-merge-cursor-pr.yml`: 自動マージワークフロー（既存）
- `scripts/auto-improve.ts`: 自動改善スクリプト
- `CODE_IMPROVEMENTS.md`: 改善点リスト

