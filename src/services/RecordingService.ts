import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import { Platform, PermissionsAndroid } from 'react-native';
import RNFS from 'react-native-fs';
import { Recording, RecordingStatus } from '../types';
import { TrackPlayerService } from './TrackPlayerService';

export class RecordingService {
  private audioRecorderPlayer: AudioRecorderPlayer;
  private trackPlayerService: TrackPlayerService;
  private currentRecordTime: number = 0;
  private onRecordUpdate?: (time: number) => void;
  private isPlaying: boolean = false;

  constructor() {
    this.audioRecorderPlayer = new AudioRecorderPlayer();
    this.trackPlayerService = TrackPlayerService.getInstance();
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
      
      // ユニークなファイル名を生成
      const timestamp = new Date().getTime();
      const fileName = Platform.select({
        ios: `recording_${timestamp}.m4a`,
        android: `recording_${timestamp}.mp4`,
      });

      console.log('生成されたファイル名:', fileName);
      console.log('Documents Path:', RNFS.DocumentDirectoryPath);

      // バックグラウンド録音対応の録音設定
      const audioSet = {
        AudioEncoderAndroid: 'aac',
        AudioSamplingRateAndroid: 44100,
        AudioSourceAndroid: 'mic',
        AVEncoderAudioQualityKeyIOS: 'medium',
        AVNumberOfChannelsKeyIOS: 1,
        AVFormatIDKeyIOS: 'aac' as any,
        AVAudioSessionCategoryIOS: 'playAndRecord',
        AVAudioSessionModeIOS: 'measurement',
        AVAudioSessionCategoryOptionsIOS: ['mixWithOthers', 'allowBluetooth'],
      };

      // まず相対パスで試す
      try {
        console.log('相対パスで録音開始を試行:', fileName);
        const uri = await this.audioRecorderPlayer.startRecorder(fileName, audioSet as any);
        
        this.audioRecorderPlayer.addRecordBackListener((e) => {
          this.currentRecordTime = e.currentPosition;
          if (this.onRecordUpdate) {
            this.onRecordUpdate(e.currentPosition);
          }
        });

        console.log('録音開始成功 (相対パス):', uri);
        return uri;
      } catch (relativeError) {
        console.log('相対パスでの録音失敗:', relativeError instanceof Error ? relativeError.message : 'Unknown error');
        
        // 相対パスで失敗した場合、フルパスで試す
        const fullPath = `${RNFS.DocumentDirectoryPath}/${fileName}`;
        console.log('フルパスで録音開始を試行:', fullPath);
        
        const uri = await this.audioRecorderPlayer.startRecorder(fullPath, audioSet as any);
        
        this.audioRecorderPlayer.addRecordBackListener((e) => {
          this.currentRecordTime = e.currentPosition;
          if (this.onRecordUpdate) {
            this.onRecordUpdate(e.currentPosition);
          }
        });

        console.log('録音開始成功 (フルパス):', uri);
        return uri;
      }
    } catch (error) {
      console.error('録音開始エラー:', error);
      console.error('エラー詳細:', error instanceof Error ? error.message : 'Unknown error');
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

  async startPlayback(uri: string, onUpdate?: (currentPosition: number, duration: number) => void): Promise<void> {
    try {
      if (this.isPlaying) {
        await this.stopPlayback();
      }

      this.isPlaying = true;
      
      // ファイルパスの確認とフォーマット
      let playPath = uri;
      if (!playPath.startsWith('file://') && !playPath.startsWith('/')) {
        // 相対パスの場合、絶対パスに変換
        playPath = Platform.OS === 'ios' ? uri : `file://${uri}`;
      }

      await this.trackPlayerService.startPlayback(playPath, onUpdate);
    } catch (error) {
      console.error('再生開始エラー:', error);
      this.isPlaying = false;
      throw error;
    }
  }

  async stopPlayback(): Promise<void> {
    try {
      this.isPlaying = false;
      await this.trackPlayerService.stopPlayback();
      console.log('再生停止');
    } catch (error) {
      console.error('再生停止エラー:', error);
      throw error;
    }
  }

  async pausePlayback(): Promise<void> {
    try {
      await this.trackPlayerService.pausePlayback();
      this.isPlaying = false;
      console.log('再生一時停止');
    } catch (error) {
      console.error('再生一時停止エラー:', error);
      throw error;
    }
  }

  async resumePlayback(): Promise<void> {
    try {
      await this.trackPlayerService.resumePlayback();
      this.isPlaying = true;
      console.log('再生再開');
    } catch (error) {
      console.error('再生再開エラー:', error);
      throw error;
    }
  }

  async seekToTime(position: number): Promise<void> {
    try {
      await this.trackPlayerService.seekToTime(position);
      console.log('シーク成功:', position);
    } catch (error) {
      console.error('シークエラー:', error);
      throw error;
    }
  }

  getIsPlaying(): boolean {
    return this.isPlaying;
  }

  formatTime(milliseconds: number): string {
    return this.trackPlayerService.formatTime(milliseconds);
  }

  async setPlaybackRate(rate: number): Promise<void> {
    try {
      await this.trackPlayerService.setPlaybackRate(rate);
    } catch (error) {
      console.error('再生速度設定エラー:', error);
      throw error;
    }
  }

  getPlaybackRate(): number {
    return this.trackPlayerService.getPlaybackRate();
  }

  async seekRelative(offsetSeconds: number): Promise<void> {
    try {
      await this.trackPlayerService.seekRelative(offsetSeconds);
    } catch (error) {
      console.error('相対シークエラー:', error);
      throw error;
    }
  }
}