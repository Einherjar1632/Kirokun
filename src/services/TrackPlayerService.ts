import TrackPlayer, {
  Capability,
  State,
  Event,
  AppKilledPlaybackBehavior,
  Track,
  Progress,
} from 'react-native-track-player';

export class TrackPlayerService {
  private static instance: TrackPlayerService | null = null;
  private isPlayerInitialized: boolean = false;
  private onProgressUpdate?: (currentPosition: number, duration: number) => void;
  private currentTrackId: string = '';
  private playbackRate: number = 1.0;
  private eventListeners: any[] = [];

  private constructor() {}

  static getInstance(): TrackPlayerService {
    if (!TrackPlayerService.instance) {
      TrackPlayerService.instance = new TrackPlayerService();
    }
    return TrackPlayerService.instance;
  }

  async initialize(): Promise<void> {
    if (this.isPlayerInitialized) {
      return;
    }

    try {
      // まず既存のプレイヤーをリセット
      try {
        await TrackPlayer.reset();
      } catch (resetError) {
        // プレイヤーが未初期化の場合はエラーを無視
      }

      await TrackPlayer.setupPlayer({
        waitForBuffer: true,
      });

      await TrackPlayer.updateOptions({
        android: {
          appKilledPlaybackBehavior: AppKilledPlaybackBehavior.StopPlaybackAndRemoveNotification,
        },
        capabilities: [
          Capability.Play,
          Capability.Pause,
          Capability.SeekTo,
        ],
        compactCapabilities: [
          Capability.Play,
          Capability.Pause,
        ],
        progressUpdateEventInterval: 100, // 100ms間隔で更新
      });

      // イベントリスナーを設定して警告を消す
      this.setupEventListeners();

      this.isPlayerInitialized = true;
      console.log('TrackPlayer初期化完了');
    } catch (error) {
      if (error instanceof Error && error.message.includes('already been initialized')) {
        this.isPlayerInitialized = true;
        console.log('TrackPlayer既に初期化済み');
        return;
      }
      console.error('TrackPlayer初期化エラー:', error);
      throw error;
    }
  }

  private setupEventListeners(): void {
    // 既存のリスナーをクリア
    this.removeEventListeners();

    // 必要なイベントリスナーを設定
    const stateListener = TrackPlayer.addEventListener(Event.PlaybackState, () => {
      // 状態変更をログに記録（必要に応じて）
    });

    const trackChangeListener = TrackPlayer.addEventListener(Event.PlaybackActiveTrackChanged, () => {
      // トラック変更をログに記録（必要に応じて）
    });

    const progressListener = TrackPlayer.addEventListener(Event.PlaybackProgressUpdated, () => {
      // プログレス更新をログに記録（必要に応じて）
    });

    const playWhenReadyListener = TrackPlayer.addEventListener(Event.PlaybackPlayWhenReadyChanged, () => {
      // PlayWhenReady変更をログに記録（必要に応じて）
    });

    this.eventListeners = [stateListener, trackChangeListener, progressListener, playWhenReadyListener];
  }

  private removeEventListeners(): void {
    this.eventListeners.forEach(listener => {
      if (listener && listener.remove) {
        listener.remove();
      }
    });
    this.eventListeners = [];
  }

  async startPlayback(uri: string, onUpdate?: (currentPosition: number, duration: number) => void): Promise<void> {
    try {
      await this.initialize();
      
      this.onProgressUpdate = onUpdate;
      this.currentTrackId = uri;

      // 既存のトラックをクリア
      await TrackPlayer.reset();

      const track: Track = {
        id: uri,
        url: uri,
        title: '録音ファイル',
        artist: 'キロクン',
      };

      await TrackPlayer.add(track);
      await TrackPlayer.setRate(this.playbackRate);
      
      // プログレス更新のリスナーを設定
      this.setupProgressListener();
      
      await TrackPlayer.play();
      
      console.log('TrackPlayer再生開始:', uri);
    } catch (error) {
      console.error('TrackPlayer再生開始エラー:', error);
      throw error;
    }
  }

  private setupProgressListener(): void {
    // 既存のリスナーをクリア
    TrackPlayer.removeUpcomingTracks();
    
    // プログレス更新のポーリングを開始
    this.startProgressPolling();
  }

  private progressInterval: NodeJS.Timeout | null = null;

  private startProgressPolling(): void {
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
    }
    
    this.progressInterval = setInterval(async () => {
      try {
        if (this.onProgressUpdate) {
          const position = await TrackPlayer.getPosition();
          const duration = await TrackPlayer.getDuration();
          
          if (position !== undefined && duration !== undefined) {
            this.onProgressUpdate(position * 1000, duration * 1000);
          }
        }
      } catch (error) {
        // プレイヤーが停止している場合はエラーを無視
      }
    }, 100);
  }

  private stopProgressPolling(): void {
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
      this.progressInterval = null;
    }
  }

  async pausePlayback(): Promise<void> {
    try {
      await TrackPlayer.pause();
      console.log('TrackPlayer一時停止');
    } catch (error) {
      console.error('TrackPlayer一時停止エラー:', error);
      throw error;
    }
  }

  async resumePlayback(): Promise<void> {
    try {
      await TrackPlayer.play();
      console.log('TrackPlayer再開');
    } catch (error) {
      console.error('TrackPlayer再開エラー:', error);
      throw error;
    }
  }

  async stopPlayback(): Promise<void> {
    try {
      this.stopProgressPolling();
      await TrackPlayer.stop();
      await TrackPlayer.reset();
      this.currentTrackId = '';
      this.onProgressUpdate = undefined;
      console.log('TrackPlayer停止');
    } catch (error) {
      console.error('TrackPlayer停止エラー:', error);
      throw error;
    }
  }

  async seekToTime(position: number): Promise<void> {
    try {
      await TrackPlayer.seekTo(position / 1000); // TrackPlayerは秒単位
      console.log('TrackPlayerシーク:', position);
    } catch (error) {
      console.error('TrackPlayerシークエラー:', error);
      throw error;
    }
  }

  async seekRelative(offsetSeconds: number): Promise<void> {
    try {
      const currentPosition = await TrackPlayer.getPosition();
      const newPosition = Math.max(0, currentPosition + offsetSeconds);
      await TrackPlayer.seekTo(newPosition);
      console.log('TrackPlayer相対シーク:', offsetSeconds, '秒');
    } catch (error) {
      console.error('TrackPlayer相対シークエラー:', error);
      throw error;
    }
  }

  async setPlaybackRate(rate: number): Promise<void> {
    try {
      this.playbackRate = Math.max(1.0, Math.min(2.0, rate));
      await TrackPlayer.setRate(this.playbackRate);
      console.log('TrackPlayer再生速度設定:', this.playbackRate);
    } catch (error) {
      console.error('TrackPlayer再生速度設定エラー:', error);
      throw error;
    }
  }

  getPlaybackRate(): number {
    return this.playbackRate;
  }

  async getIsPlaying(): Promise<boolean> {
    try {
      const state = await TrackPlayer.getState();
      return state === State.Playing;
    } catch (error) {
      console.error('TrackPlayer状態取得エラー:', error);
      return false;
    }
  }

  formatTime(milliseconds: number): string {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  async cleanup(): Promise<void> {
    try {
      this.stopProgressPolling();
      this.removeEventListeners();
      await TrackPlayer.destroy();
      this.isPlayerInitialized = false;
      console.log('TrackPlayerクリーンアップ完了');
    } catch (error) {
      console.error('TrackPlayerクリーンアップエラー:', error);
    }
  }
}