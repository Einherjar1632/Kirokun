import React, {useState, useEffect} from 'react';
import {View, Text, StyleSheet, TouchableOpacity, Alert} from 'react-native';
import Slider from '@react-native-community/slider';
import Share from 'react-native-share';
import {RecordingService} from '../services/RecordingService';

interface AudioSeekBarProps {
  currentPosition: number;
  duration: number;
  isSliding: boolean;
  onSeekStart: () => void;
  onSeekChange: (value: number) => void;
  onSeekComplete: (value: number) => void;
  recordingService: RecordingService;
  isPlaying: boolean;
  onPlayPause: () => void;
  audioFilePath?: string;
  audioTitle?: string;
}

export const AudioSeekBar: React.FC<AudioSeekBarProps> = ({
  currentPosition,
  duration,
  isSliding,
  onSeekStart,
  onSeekChange,
  onSeekComplete,
  recordingService,
  isPlaying,
  onPlayPause,
  audioFilePath,
  audioTitle,
}) => {
  const [playbackRate, setPlaybackRate] = useState(1.0);

  useEffect(() => {
    setPlaybackRate(recordingService.getPlaybackRate());
  }, [recordingService]);

  const handleRewind = async () => {
    try {
      await recordingService.seekRelative(-5);
    } catch (error) {
      console.error('5秒戻しエラー:', error);
    }
  };

  const handleFastForward = async () => {
    try {
      await recordingService.seekRelative(5);
    } catch (error) {
      console.error('5秒送りエラー:', error);
    }
  };

  const handleSpeedChange = async () => {
    try {
      // 速度を配列で管理して精度問題を回避
      const speeds = [1.0, 1.2, 1.4, 1.6, 1.8, 2.0];
      const currentIndex = speeds.findIndex(speed => Math.abs(speed - playbackRate) < 0.01);
      const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % speeds.length : 0;
      const newRate = speeds[nextIndex];
      
      await recordingService.setPlaybackRate(newRate);
      setPlaybackRate(newRate);
    } catch (error) {
      console.error('再生速度変更エラー:', error);
    }
  };

  const handleShareAudio = async () => {
    if (!audioFilePath) {
      Alert.alert('エラー', '音声ファイルが見つかりません');
      return;
    }

    try {
      const shareOptions = {
        title: audioTitle || '録音ファイル',
        url: audioFilePath,
        type: 'audio/*',
      };

      await Share.open(shareOptions);
    } catch (error) {
      console.log('音声共有がキャンセルされました');
    }
  };
  return (
    <View style={styles.container}>
      {/* シークバーと時間表示 */}
      <View style={styles.seekBarContainer}>
        <Text style={styles.timeText}>
          {recordingService.formatTime(currentPosition)}
        </Text>
        <Slider
          style={styles.slider}
          value={currentPosition}
          minimumValue={0}
          maximumValue={Math.max(duration, 1)}
          onSlidingStart={onSeekStart}
          onValueChange={onSeekChange}
          onSlidingComplete={onSeekComplete}
          minimumTrackTintColor="#FFB199"
          maximumTrackTintColor="#E6D5C3"
        />
        <Text style={styles.timeText}>
          {recordingService.formatTime(duration)}
        </Text>
      </View>
      
      {/* コントロールボタン */}
      <View style={styles.controlsContainer}>
        <TouchableOpacity 
          style={styles.controlButton} 
          onPress={handleRewind}
          activeOpacity={0.8}
        >
          <Text style={styles.controlButtonText}>-5s</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.controlButton, styles.playButton]} 
          onPress={onPlayPause}
          activeOpacity={0.8}
        >
          {isPlaying ? (
            <View style={styles.pauseIcon}>
              <View style={styles.pauseLine} />
              <View style={styles.pauseLine} />
            </View>
          ) : (
            <Text style={styles.playButtonText}>▶</Text>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.controlButton} 
          onPress={handleFastForward}
          activeOpacity={0.8}
        >
          <Text style={styles.controlButtonText}>+5s</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.speedButton} 
          onPress={handleSpeedChange}
          activeOpacity={0.8}
        >
          <Text style={styles.speedButtonText}>{playbackRate.toFixed(1)}×</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.shareButton} 
          onPress={handleShareAudio}
          activeOpacity={0.8}
        >
          <Text style={styles.shareButtonText}>⇡</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 15,
    paddingVertical: 15,
  },
  seekBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  slider: {
    flex: 1,
    height: 40,
    marginHorizontal: 10,
  },
  timeText: {
    fontSize: 12,
    color: '#4A2F2A',
    minWidth: 45,
    textAlign: 'center',
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
  },
  controlButton: {
    width: 44,
    height: 44,
    backgroundColor: '#FFB199',
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    backgroundColor: '#FF8C69',
  },
  controlButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  playButtonText: {
    fontSize: 20,
    color: '#FFFFFF',
  },
  speedButton: {
    width: 44,
    height: 44,
    backgroundColor: '#E6D5C3',
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  speedButtonText: {
    fontSize: 11,
    color: '#4A2F2A',
    fontWeight: 'bold',
  },
  shareButton: {
    width: 44,
    height: 44,
    backgroundColor: '#B5845A',
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareButtonText: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  pauseIcon: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 3,
  },
  pauseLine: {
    width: 3,
    height: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 1.5,
  },
});