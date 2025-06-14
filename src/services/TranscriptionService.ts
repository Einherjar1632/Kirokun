import { Recording, Speaker, TranscriptionSegment } from '../types';
import { GEMINI_API_KEY } from '@env';
import RNFS from 'react-native-fs';

export class TranscriptionService {
  private static API_KEY = GEMINI_API_KEY;
  private static API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

  static async transcribeAudio(audioFilePath: string): Promise<{ 
    transcription: string; 
    speakers: Speaker[] 
  }> {
    try {
      console.log('=== 文字起こし開始 ===');
      console.log('APIキー確認:', this.API_KEY ? 'あり' : 'なし');
      console.log('音声ファイルパス:', audioFilePath);
      
      // 音声ファイルの存在確認
      const fileExists = await RNFS.exists(audioFilePath);
      console.log('ファイル存在:', fileExists);
      
      if (!fileExists) {
        throw new Error('音声ファイルが見つかりません');
      }

      // ファイルサイズチェック
      const fileStat = await RNFS.stat(audioFilePath);
      console.log('ファイルサイズ:', fileStat.size, 'bytes');
      
      if (fileStat.size === 0) {
        throw new Error('音声ファイルが空です。録音が正常に行われていない可能性があります。');
      }

      // 音声ファイルをBase64にエンコード
      const base64Audio = await RNFS.readFile(audioFilePath, 'base64');
      console.log('Base64音声データサイズ:', base64Audio.length);

      // Gemini API リクエスト
      const requestBody = {
        contents: [
          {
            parts: [
              {
                text: `この音声ファイルを文字起こししてください。短い音声や小声でも聞き取り可能な内容は必ず抽出してください。

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
日本語で応答してください。`
              },
              {
                inline_data: {
                  mime_type: 'audio/mp4',
                  data: base64Audio
                }
              }
            ]
          }
        ]
      };

      console.log('Gemini APIリクエスト送信中...');
      const response = await fetch(`${this.API_URL}?key=${this.API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('API レスポンス ステータス:', response.status);
      const responseData = await response.json();
      console.log('API レスポンス:', JSON.stringify(responseData, null, 2));

      if (!response.ok) {
        throw new Error(`Gemini API エラー: ${response.status} - ${JSON.stringify(responseData)}`);
      }

      if (!responseData.candidates || !responseData.candidates[0] || !responseData.candidates[0].content) {
        console.log('Gemini APIレスポンス詳細:', JSON.stringify(responseData, null, 2));
        
        // 特定のエラーケースをチェック
        if (responseData.candidates && responseData.candidates[0] && 
            responseData.candidates[0].finishReason === 'OTHER') {
          throw new Error('音声が短すぎるか、音声内容が検出できませんでした。もう少し長く録音してみてください。');
        }
        
        if (responseData.error) {
          throw new Error(`API エラー: ${responseData.error.message || '不明なエラー'}`);
        }
        
        throw new Error('音声データがないため、文字起こしを行うことができません');
      }

      const transcriptionText = responseData.candidates[0].content.parts[0].text;
      console.log('文字起こし結果:', transcriptionText);

      // 音声内容が検出できなかった場合の処理
      if (transcriptionText.includes('音声内容を検出できませんでした') || 
          transcriptionText.includes('検出できません') ||
          transcriptionText.trim() === '') {
        throw new Error('音声が短すぎるか、音声内容が検出できませんでした。もう少し長く、はっきりと録音してみてください。');
      }

      const { text, speakers } = this.parseTranscription(transcriptionText);

      console.log('=== Gemini API 文字起こし完了 ===');
      return { transcription: text, speakers };
    } catch (error) {
      console.error('=== 文字起こしエラー ===');
      console.error('エラー詳細:', error);
      console.error('エラーメッセージ:', error instanceof Error ? error.message : 'Unknown error');
      
      throw error;
    }
  }

  private static parseTranscription(text: string): {
    text: string;
    speakers: Speaker[];
  } {
    const speakers: Speaker[] = [];
    const speakerMap = new Map<string, Speaker>();
    
    // 話者パターンを検出（例: "話者1:", "営業担当:", など）
    const lines = text.split('\n');
    let currentTime = 0;
    
    lines.forEach((line) => {
      const speakerMatch = line.match(/^(.+?)[:：]\s*(.+)$/);
      if (speakerMatch) {
        const speakerName = speakerMatch[1].trim();
        const content = speakerMatch[2].trim();
        
        if (!speakerMap.has(speakerName)) {
          const speaker: Speaker = {
            id: `speaker_${speakerMap.size + 1}`,
            name: speakerName,
            segments: []
          };
          speakerMap.set(speakerName, speaker);
          speakers.push(speaker);
        }
        
        const speaker = speakerMap.get(speakerName)!;
        const segment: TranscriptionSegment = {
          text: content,
          startTime: currentTime,
          endTime: currentTime + 5000, // 仮の時間（5秒ずつ）
          speakerId: speaker.id
        };
        
        speaker.segments.push(segment);
        currentTime += 5000;
      }
    });

    // 話者が識別できなかった場合
    if (speakers.length === 0) {
      speakers.push({
        id: 'speaker_1',
        name: '話者',
        segments: [{
          text: text,
          startTime: 0,
          endTime: currentTime || 10000,
          speakerId: 'speaker_1'
        }]
      });
    }

    return { text, speakers };
  }

  private static async mockTranscription(): Promise<{
    text: string;
    speakers: Speaker[];
  }> {
    // モックデータ（開発用）
    await new Promise(resolve => setTimeout(resolve, 2000)); // 2秒待機
    
    const speakers: Speaker[] = [
      {
        id: 'speaker1',
        name: '営業担当者',
        segments: [
          {
            text: 'おはようございます。本日はお時間をいただき、ありがとうございます。',
            startTime: 0,
            endTime: 3000,
            speakerId: 'speaker1',
          },
          {
            text: '弊社の新しいサービスについてご説明させていただきたいと思います。',
            startTime: 5000,
            endTime: 8000,
            speakerId: 'speaker1',
          },
        ],
      },
      {
        id: 'speaker2',
        name: 'お客様',
        segments: [
          {
            text: 'こちらこそ、よろしくお願いします。',
            startTime: 3000,
            endTime: 5000,
            speakerId: 'speaker2',
          },
          {
            text: 'はい、ぜひお聞かせください。',
            startTime: 8000,
            endTime: 10000,
            speakerId: 'speaker2',
          },
        ],
      },
    ];

    const text = speakers
      .flatMap(speaker => 
        speaker.segments.map(segment => `${speaker.name}: ${segment.text}`)
      )
      .join('\n');

    return { text, speakers };
  }

  static async generateSummary(transcription: string): Promise<string> {
    try {
      console.log('=== 要約生成開始 ===');
      console.log('文字起こしテキスト長:', transcription.length);
      
      if (!transcription.trim()) {
        throw new Error('文字起こしテキストが空です');
      }

      // Gemini API リクエスト
      const requestBody = {
        contents: [
          {
            parts: [
              {
                text: `以下の文字起こしテキストを要約してください。以下の点に注意して処理をお願いします：

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
${transcription}

上記の内容を分析し、ビジネス要約として整理してください。`
              }
            ]
          }
        ]
      };

      console.log('Gemini API要約リクエスト送信中...');
      const response = await fetch(`${this.API_URL}?key=${this.API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('要約API レスポンス ステータス:', response.status);
      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(`Gemini API エラー: ${response.status} - ${JSON.stringify(responseData)}`);
      }

      if (!responseData.candidates || !responseData.candidates[0] || !responseData.candidates[0].content) {
        console.log('要約APIレスポンス詳細:', JSON.stringify(responseData, null, 2));
        throw new Error('要約の生成に失敗しました');
      }

      const summaryText = responseData.candidates[0].content.parts[0].text;
      console.log('要約結果:', summaryText);
      console.log('=== 要約生成完了 ===');

      return summaryText;
    } catch (error) {
      console.error('=== 要約生成エラー ===');
      console.error('エラー詳細:', error);
      throw error;
    }
  }

  static async processRecording(recording: Recording): Promise<Recording> {
    try {
      const { transcription, speakers } = await this.transcribeAudio(recording.filePath);
      
      return {
        ...recording,
        transcription,
        speakers,
      };
    } catch (error) {
      console.error('録音処理エラー:', error);
      throw error;
    }
  }
}