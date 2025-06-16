import AsyncStorage from '@react-native-async-storage/async-storage';

export interface PromptSettings {
  transcriptionPrompt: string;
  summaryPrompt: string;
}

export class PromptSettingsService {
  private static readonly STORAGE_KEY = 'prompt_settings';

  private static readonly DEFAULT_TRANSCRIPTION_PROMPT = `この音声ファイルを文字起こししてください。短い音声や小声でも聞き取り可能な内容は必ず抽出してください。

【最重要指示】
1. 音声の長さに関係なく、わずかでも音声内容があれば必ず文字起こしを実行してください
2. 短時間の録音（数秒〜30秒程度）でも、単語レベルで聞き取れる内容があれば出力してください
3. 小声や不明瞭な音声でも、推測可能な内容は「[推測]」を付けて出力してください
4. 無音部分が多くても、音声部分があれば処理を続行してください
5. 環境音、雑音がある中でも人の声を優先的に認識してください

【音声処理の詳細指示】
• 録音開始・終了時のクリック音やノイズは無視してください
• 「あー」「えー」「うーん」などのフィラー音は削除してください
• 「えっと」「その」「まあ」などの不要な言葉は削除してください
• 咳、笑い声、物音は除外し、人の発話のみを抽出してください
• 言い直しや重複は最終的な内容にまとめてください
• 単語が途切れていても文脈から推測できる場合は補完してください

【出力品質の向上】
• 話者が複数いる場合は「話者1:」「話者2:」で区別してください
• 一人の場合は「話者:」として出力してください
• 商談・会議として適切な敬語と文体に整えてください
• 断片的な発話でも意味が通る文章に整理してください
• 音量が小さく不明瞭な部分は[不明瞭]と記載してください

【出力形式】
話者1: [整理された発言内容]
話者2: [整理された発言内容]

【重要】音声が全く存在しない場合のみ「音声内容を検出できませんでした」と回答してください。
わずかでも人の声や発話があれば、必ず何らかの文字起こし結果を提供してください。
日本語で応答してください。`;

  private static readonly DEFAULT_SUMMARY_PROMPT = `以下の文字起こしテキストを要約してください。以下の点に注意して処理をお願いします：

【重要な指示】
1. 商談や会議の内容として、重要なポイントを簡潔にまとめてください
2. 話し合われた議題、決定事項、次回のアクションなどを整理してください
3. 参加者の役割や立場が分かる場合は明記してください
4. 3-5個の箇条書きで要約してください
5. 日本語で、ビジネス文書として適切な表現で記載してください
6. 不要な詳細は省略し、要点のみを抽出してください

【出力形式】
■ 議題・目的：[会議や商談の目的]
■ 主要な内容：
  • [重要ポイント1]
  • [重要ポイント2]
  • [重要ポイント3]
■ 決定事項・合意点：[決まったこと]
■ 次回アクション：[今後の予定や課題]

【文字起こしテキスト】
{transcription}

上記の内容を分析し、ビジネス要約として整理してください。`;

  static async getSettings(): Promise<PromptSettings> {
    try {
      const storedSettings = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (storedSettings) {
        return JSON.parse(storedSettings);
      }
    } catch (error) {
      console.error('設定の読み込みエラー:', error);
    }

    // デフォルト設定を返す
    return this.getDefaultSettings();
  }

  static getDefaultSettings(): PromptSettings {
    return {
      transcriptionPrompt: this.DEFAULT_TRANSCRIPTION_PROMPT,
      summaryPrompt: this.DEFAULT_SUMMARY_PROMPT,
    };
  }

  static async saveSettings(settings: PromptSettings): Promise<void> {
    try {
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(settings));
      console.log('プロンプト設定を保存しました');
    } catch (error) {
      console.error('設定の保存エラー:', error);
      throw error;
    }
  }

  static async resetToDefault(): Promise<void> {
    try {
      const defaultSettings = this.getDefaultSettings();
      await this.saveSettings(defaultSettings);
      console.log('プロンプト設定をデフォルトにリセットしました');
    } catch (error) {
      console.error('設定のリセットエラー:', error);
      throw error;
    }
  }
}