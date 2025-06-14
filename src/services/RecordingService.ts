import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import { Platform, PermissionsAndroid } from 'react-native';
import RNFS from 'react-native-fs';
import { Recording, RecordingStatus } from '../types';

export class RecordingService {
  private audioRecorderPlayer: AudioRecorderPlayer;
  private currentRecordTime: number = 0;
  private onRecordUpdate?: (time: number) => void;
  private onPlayUpdate?: (currentPosition: number, duration: number) => void;
  private isPlaying: boolean = false;
  private hasStartedPlayback: boolean = false;
  private currentPlayPath: string = '';

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

      this.onPlayUpdate = onUpdate;
      this.isPlaying = true;
      this.hasStartedPlayback = true;
      
      // ファイルパスの確認とフォーマット
      let playPath = uri;
      if (!playPath.startsWith('file://') && !playPath.startsWith('/')) {
        // 相対パスの場合、絶対パスに変換
        playPath = Platform.OS === 'ios' ? uri : `file://${uri}`;
      }

      this.currentPlayPath = playPath;
      await this.audioRecorderPlayer.startPlayer(playPath);
      
      this.audioRecorderPlayer.addPlayBackListener((e) => {
        if (this.onPlayUpdate && this.hasStartedPlayback) {
          this.onPlayUpdate(e.currentPosition, e.duration);
        }
        
        if (e.currentPosition >= e.duration && e.duration > 0) {
          this.isPlaying = false; // 再生終了時はisPlayingのみfalseに
        }
      });
    } catch (error) {
      console.error('再生開始エラー:', error);
      this.isPlaying = false;
      this.hasStartedPlayback = false;
      this.currentPlayPath = '';
      throw error;
    }
  }

  async stopPlayback(): Promise<void> {
    try {
      this.isPlaying = false;
      this.hasStartedPlayback = false;
      this.currentPlayPath = '';
      
      try {
        await this.audioRecorderPlayer.stopPlayer();
        this.audioRecorderPlayer.removePlayBackListener();
      } catch (stopError) {
        // プレイヤーが既に停止している場合はエラーを無視
        console.log('プレイヤーは既に停止済み');
      }
      
      console.log('再生停止');
    } catch (error) {
      console.error('再生停止エラー:', error);
      throw error;
    }
  }

  async pausePlayback(): Promise<void> {
    try {
      await this.audioRecorderPlayer.pausePlayer();
      this.isPlaying = false;
      console.log('再生一時停止');
    } catch (error) {
      console.error('再生一時停止エラー:', error);
      throw error;
    }
  }

  async resumePlayback(): Promise<void> {
    try {
      await this.audioRecorderPlayer.resumePlayer();
      this.isPlaying = true;
      console.log('再生再開');
    } catch (error) {
      console.error('再生再開エラー:', error);
      throw error;
    }
  }

  async seekToTime(position: number): Promise<void> {
    try {
      if (!this.hasStartedPlayback || !this.currentPlayPath) {
        console.warn('再生が開始されていないためシークできません');
        return;
      }
      
      // 位置を有効な範囲に制限
      const seekPosition = Math.max(0, position);
      
      try {
        // 再生が終了している場合は、新しくプレイヤーを開始
        if (!this.isPlaying) {
          this.isPlaying = true;
          await this.audioRecorderPlayer.startPlayer(this.currentPlayPath);
        }
        
        await this.audioRecorderPlayer.seekToPlayer(seekPosition);
        console.log('シーク成功:', seekPosition);
      } catch (seekError) {
        // シークに失敗した場合は、プレイヤーを再開始してからシーク
        console.log('シーク失敗、プレイヤーを再開始:', seekError instanceof Error ? seekError.message : 'Unknown error');
        try {
          await this.audioRecorderPlayer.stopPlayer();
          this.isPlaying = true;
          await this.audioRecorderPlayer.startPlayer(this.currentPlayPath);
          await this.audioRecorderPlayer.seekToPlayer(seekPosition);
          console.log('再開始後のシーク成功:', seekPosition);
        } catch (restartError) {
          console.error('プレイヤー再開始エラー:', restartError);
          this.isPlaying = false;
          throw restartError;
        }
      }
    } catch (error) {
      console.error('シークエラー:', error);
      this.isPlaying = false;
      throw error;
    }
  }

  getIsPlaying(): boolean {
    return this.isPlaying;
  }

  formatTime(milliseconds: number): string {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
}