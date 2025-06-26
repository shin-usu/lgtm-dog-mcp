# LGTM Dog MCP

犬の画像にLGTMテキストを重ねた画像を生成するMCPサーバーです。

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. ビルド

```bash
npm run build
```

### 3. Claude Desktopの設定

Claude Desktopの設定ファイルを編集して、このMCPサーバーを追加します。

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

以下の内容を`mcpServers`セクションに追加してください：

```json
{
  "mcpServers": {
    "lgtm-dog": {
      "command": "node",
      "args": ["/path/to/lgtm-dog-mcp/dist/index.js"]
    }
  }
}
```

### 4. Claude Desktopを再起動

設定を反映させるために、Claude Desktopを完全に終了してから再起動してください。

## 使い方

Claude Desktopで以下のように使用できます：

1. "Use MCP tool"を選択
2. "generate_lgtm_dog"ツールを選択
3. オプションで`outputPath`を指定（指定しない場合は現在のディレクトリに保存）

例：
- `generate_lgtm_dog` - 現在のディレクトリに自動的に名前をつけて保存
- `generate_lgtm_dog` with `outputPath: "/path/to/my-lgtm.png"` - 指定したパスに保存

## 機能

- ランダムな犬の画像を[Dog CEO API](https://dog.ceo/)から取得
- 画像の中央に「LGTM」テキストを重ねる
- テキストは緑色（#00FF00）で白い縁取り付き
- 画像サイズに応じてテキストサイズが自動調整される