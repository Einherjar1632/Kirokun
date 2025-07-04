import { Recording, Speaker, TranscriptionSegment } from '../types';
import { GEMINI_API_KEY } from '@env';
import RNFS from 'react-native-fs';
import { PromptSettingsService } from './PromptSettingsService';
import { VocabularyService } from './VocabularyService';

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

      // プロンプト設定を取得
      const settings = await PromptSettingsService.getSettings();
      console.log('文字起こし用プロンプト設定を取得しました');

      // 単語帳データを取得して文字起こしプロンプトに追加
      const vocabularyItems = await VocabularyService.getVocabularyItems();
      const vocabularyPrompt = VocabularyService.generateVocabularyPrompt(vocabularyItems);
      const enhancedTranscriptionPrompt = vocabularyPrompt + '\n\n' + settings.transcriptionPrompt;
      
      console.log('単語帳アイテム数:', vocabularyItems.length);
      if (vocabularyItems.length > 0) {
        console.log('単語帳プロンプトを文字起こしに適用しました');
      }

      // Gemini API リクエスト
      const requestBody = {
        contents: [
          {
            parts: [
              {
                text: enhancedTranscriptionPrompt
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

      // プロンプト設定を取得
      const settings = await PromptSettingsService.getSettings();
      console.log('要約用プロンプト設定を取得しました');

      // 単語帳データを取得して要約プロンプトに追加
      const vocabularyItems = await VocabularyService.getVocabularyItems();
      const vocabularyPrompt = VocabularyService.generateVocabularyPrompt(vocabularyItems);
      
      // プロンプトテンプレートに文字起こしテキストを挿入し、単語帳情報も追加
      let enhancedSummaryPrompt = settings.summaryPrompt.replace('{transcription}', transcription);
      if (vocabularyItems.length > 0) {
        enhancedSummaryPrompt = vocabularyPrompt + '\n\n' + enhancedSummaryPrompt;
        console.log('単語帳プロンプトを要約に適用しました');
      }
      const promptWithTranscription = enhancedSummaryPrompt;

      // Gemini API リクエスト
      const requestBody = {
        contents: [
          {
            parts: [
              {
                text: promptWithTranscription
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