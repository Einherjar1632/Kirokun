import { Recording, Speaker, TranscriptionSegment } from '../types';

export class TranscriptionService {
  private static GEMINI_API_KEY = 'YOUR_GEMINI_API_KEY'; // 実際のAPIキーに置き換えてください

  static async transcribeAudio(audioFilePath: string): Promise<{ 
    transcription: string; 
    speakers: Speaker[] 
  }> {
    try {
      // 実際のGemini API実装はここに追加
      // 現在はモックデータを返します
      const mockTranscription = await this.mockTranscription();
      
      return {
        transcription: mockTranscription.text,
        speakers: mockTranscription.speakers,
      };
    } catch (error) {
      console.error('文字起こしエラー:', error);
      throw error;
    }
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