import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import { Platform, PermissionsAndroid } from 'react-native';
import { Recording, RecordingStatus } from '../types';

export class RecordingService {
  private audioRecorderPlayer: AudioRecorderPlayer;
  private currentRecordTime: number = 0;
  private onRecordUpdate?: (time: number) => void;

  constructor() {
    this.audioRecorderPlayer = new AudioRecorderPlayer();
  }

  async requestPermissions(): Promise<boolean> {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: '録音権限',
            message: 'このアプリは録音機能のためにマイクへのアクセスが必要です。',
            buttonNeutral: '後で聞く',
            buttonNegative: 'キャンセル',
            buttonPositive: 'OK',
          },
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true;
  }

  async startRecording(onUpdate?: (time: number) => void): Promise<string> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        throw new Error('録音権限が許可されていません');
      }

      this.onRecordUpdate = onUpdate;
      
      const path = Platform.select({
        ios: 'recording.m4a',
        android: 'recording.mp4',
      });

      const uri = await this.audioRecorderPlayer.startRecorder(path);
      
      this.audioRecorderPlayer.addRecordBackListener((e) => {
        this.currentRecordTime = e.currentPosition;
        if (this.onRecordUpdate) {
          this.onRecordUpdate(e.currentPosition);
        }
      });

      console.log('録音開始:', uri);
      return uri;
    } catch (error) {
      console.error('録音開始エラー:', error);
      throw error;
    }
  }

  async stopRecording(): Promise<{ uri: string; duration: number }> {
    try {
      const result = await this.audioRecorderPlayer.stopRecorder();
      this.audioRecorderPlayer.removeRecordBackListener();
      
      console.log('録音停止:', result);
      return {
        uri: result,
        duration: this.currentRecordTime,
      };
    } catch (error) {
      console.error('録音停止エラー:', error);
      throw error;
    }
  }

  async pauseRecording(): Promise<void> {
    try {
      await this.audioRecorderPlayer.pauseRecorder();
    } catch (error) {
      console.error('録音一時停止エラー:', error);
      throw error;
    }
  }

  async resumeRecording(): Promise<void> {
    try {
      await this.audioRecorderPlayer.resumeRecorder();
    } catch (error) {
      console.error('録音再開エラー:', error);
      throw error;
    }
  }

  formatTime(milliseconds: number): string {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
}