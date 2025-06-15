import React, {useState, useEffect} from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import Slider from '@react-native-community/slider';
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
      const newRate = playbackRate >= 2.0 ? 0.2 : playbackRate + 0.2;
      await recordingService.setPlaybackRate(newRate);
      setPlaybackRate(newRate);
    } catch (error) {
      console.error('再生速度変更エラー:', error);
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
          <Text style={styles.controlButtonText}>⏪</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.controlButton, styles.playButton]} 
          onPress={onPlayPause}
          activeOpacity={0.8}
        >
          <Text style={styles.playButtonText}>
            {isPlaying ? '■' : '▶'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.controlButton} 
          onPress={handleFastForward}
          activeOpacity={0.8}
        >
          <Text style={styles.controlButtonText}>⏩</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.speedButton} 
          onPress={handleSpeedChange}
          activeOpacity={0.8}
        >
          <Text style={styles.speedButtonText}>{playbackRate.toFixed(1)}×</Text>
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
    width: 50,
    height: 50,
    borderRadius: 25,
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
    width: 50,
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
});