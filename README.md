# きろくん

商談や会議の音声録音・文字起こし・要約を一元管理できるReact Nativeアプリです。

## 📱 概要

「きろくん」は、ビジネスシーンでの音声記録を効率化するモバイルアプリケーションです。録音から文字起こし、要約生成までを一つのアプリで完結し、商談や会議の内容を簡単に管理・共有できます。

## ✨ 主要機能

### 🎙️ 音声録音
- **高品質な音声録音**：一時停止・再開機能付き
- **リアルタイム録音時間表示**：録音状況を視覚的に確認
- **タイトル・メモ機能**：録音内容の詳細情報を記録

### 📝 AIによる文字起こし
- **Gemini API活用**：Googleの最新AI技術で高精度な文字起こし
- **話者識別機能**：複数の話者を自動識別・分離
- **ノイズ除去**：間投詞や不要な口癖を自動削除
- **ビジネス文体変換**：自然で読みやすい文章に自動整形

### 📊 要約生成
- **自動要約機能**：文字起こし内容から重要ポイントを抽出
- **構造化された要約**：議題、決定事項、次回アクションを整理
- **ビジネス文書形式**：そのまま報告書として活用可能

### 📂 録音管理
- **録音一覧表示**：過去の録音を日付順で管理
- **詳細表示機能**：文字起こし・要約・メモを統合表示
- **共有機能**：他のアプリやメールで内容を共有

## 🛠️ 技術スタック

- **フレームワーク**: React Native 0.74.0
- **言語**: TypeScript 5.0.4
- **AI API**: Google Gemini 1.5 Flash
- **音声処理**: react-native-audio-recorder-player
- **データ保存**: AsyncStorage
- **ファイル管理**: react-native-fs
- **権限管理**: react-native-permissions
- **UI/UX**: React Native標準コンポーネント

## 🚀 セットアップ

### 前提条件

- Node.js >= 18
- React Native開発環境
- iOS開発環境（Xcode）またはAndroid開発環境（Android Studio）
- Gemini API キー

### インストール手順

1. **リポジトリのクローン**
```bash
git clone <repository-url>
cd Kirokun
```

2. **依存関係のインストール**
```bash
npm install
```

3. **iOS依存関係のインストール**
```bash
npx pod-install
```

4. **環境変数の設定**
`.env`ファイルを作成し、Gemini APIキーを設定：
```env
GEMINI_API_KEY=your_gemini_api_key_here
```

### 実行方法

**iOS**
```bash
npm run ios
```

**Android**
```bash
npm run android
```

## 🎯 使用方法

### 1. 音声録音
1. アプリを起動し、「録音」タブを選択
2. 「録音開始」ボタンをタップして録音開始
3. 必要に応じて「一時停止」「再開」機能を使用
4. 「録音停止」ボタンで録音終了
5. タイトルとメモを入力して保存

### 2. 文字起こし
1. 録音保存時に「文字起こしを開始しますか？」で「開始」を選択
2. AIが自動で音声を解析し、文字起こしを実行
3. 話者の識別と内容の整形が自動実行

### 3. 録音管理
1. 「録音一覧」タブで過去の録音を確認
2. 録音をタップして詳細画面を表示
3. 文字起こし内容や要約を確認・共有

## 📁 プロジェクト構造

```
src/
├── components/          # 再利用可能なUIコンポーネント
├── screens/            # 画面コンポーネント
│   ├── RecordingScreen.tsx          # 録音画面
│   ├── RecordingListScreen.tsx      # 録音一覧画面
│   └── RecordingDetailScreen.tsx    # 録音詳細画面
├── services/           # ビジネスロジック・API連携
│   ├── RecordingService.ts          # 録音関連サービス
│   ├── StorageService.ts            # データ保存サービス
│   └── TranscriptionService.ts      # 文字起こしサービス
├── types/              # TypeScript型定義
│   └── index.ts                     # アプリケーション共通型
└── utils/              # ユーティリティ関数
```

## ⚙️ 開発・デバッグ

### コード品質チェック
```bash
npm run lint          # ESLintでコード品質チェック
```

### テスト実行
```bash
npm test             # Jestでテスト実行
```

### 開発サーバー起動
```bash
npm start            # Metro bundler起動
```

## 🔧 設定・カスタマイズ

### Gemini API設定
- `src/services/TranscriptionService.ts`でAPI設定をカスタマイズ可能
- プロンプトの調整により文字起こし精度を向上可能

### 音質設定
- `src/services/RecordingService.ts`で録音品質設定を調整可能

## 📄 ライセンス

このプロジェクトはプライベートプロジェクトです。

## 🤝 コントリビューション

バグ報告や機能要望がございましたら、Issueを作成してください。

---

**開発者**: Einherjar1632  
**最終更新**: 2025年6月