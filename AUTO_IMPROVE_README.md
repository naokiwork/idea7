# 自動コード改善システム

GitHub Actionsを使用して、毎時間自動でコードベースを改善するシステムです。

## 📚 ドキュメント一覧

- **[クイックスタート](./AUTO_IMPROVE_QUICKSTART.md)** - 5分でセットアップ
- **[完全ガイド](./AUTO_IMPROVE_GUIDE.md)** - 詳細な説明とカスタマイズ方法
- **[改善点テンプレート](./CODE_IMPROVEMENTS_TEMPLATE.md)** - CODE_IMPROVEMENTS.mdの書き方

## 🚀 クイックスタート

1. ファイルをコピー（`.github/workflows/auto-improve.yml`, `scripts/auto-improve.ts`）
2. 依存関係をインストール: `npm install --save-dev openai @octokit/rest simple-git ts-node`
3. GitHub Secretsを設定（`OPENAI_API_KEY`, `GH_PAT_FOR_AUTOMERGE`）
4. `CODE_IMPROVEMENTS.md`を作成
5. 完了！

詳細は [クイックスタートガイド](./AUTO_IMPROVE_QUICKSTART.md) を参照してください。

## ✨ 主な機能

- ⏰ **自動実行**: 毎時間（カスタマイズ可能）自動で実行
- 🤖 **AI改善**: OpenAI APIを使用してコード改善を生成
- 📝 **優先度処理**: 高→中→低の順で改善を適用
- 🔄 **自動PR**: 変更があれば自動でPR作成
- ✅ **自動マージ**: テストが通れば自動マージ（オプション）

## 📋 必要なもの

- GitHubリポジトリ
- OpenAI APIキー
- GitHub Personal Access Token

## 📖 使い方

### 1. 改善点の記述

`CODE_IMPROVEMENTS.md`に改善点を記述：

```markdown
## 🔴 高優先度

### 1. 未使用変数の削除
**場所**: `src/components/Button.tsx:15`
- `isLoading`が未使用
- **修正**: 削除する
```

### 2. 自動実行

毎時間（UTC 0分）に自動実行されます。手動実行も可能です。

### 3. 結果の確認

GitHub Actionsのログで実行結果を確認できます。

## 🔧 カスタマイズ

- 実行頻度: `.github/workflows/auto-improve.yml`の`cron`設定
- 処理数: `scripts/auto-improve.ts`の`selectImprovements`関数
- AIモデル: `scripts/auto-improve.ts`の`generateImprovement`関数

詳細は [完全ガイド](./AUTO_IMPROVE_GUIDE.md) を参照してください。

## 🆘 トラブルシューティング

よくある問題と解決方法は [完全ガイド](./AUTO_IMPROVE_GUIDE.md#トラブルシューティング) を参照してください。

## 📝 ライセンス

このシステムは自由に使用・改変できます。

## 🔗 関連リンク

- [GitHub Actions ドキュメント](https://docs.github.com/ja/actions)
- [OpenAI API ドキュメント](https://platform.openai.com/docs)
- [GitHub CLI ドキュメント](https://cli.github.com/manual/)

---

**質問や問題がある場合**: GitHub Issuesで報告してください。

