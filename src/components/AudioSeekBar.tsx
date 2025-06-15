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
      <View style={styles.timeContainer}>
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
      
      <View style={styles.controlsContainer}>
        <TouchableOpacity style={styles.controlButton} onPress={handleRewind}>
          <Text style={styles.controlButtonText}>⏪</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.playButton} onPress={onPlayPause}>
          <Text style={styles.playButtonText}>{isPlaying ? '⏸️' : '▶️'}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.controlButton} onPress={handleFastForward}>
          <Text style={styles.controlButtonText}>⏩</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.speedButton} onPress={handleSpeedChange}>
          <Text style={styles.speedButtonText}>{playbackRate.toFixed(1)}x</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 10,
    marginTop: 10,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  slider: {
    flex: 1,
    height: 40,
  },
  timeText: {
    fontSize: 12,
    color: '#4A2F2A',
    minWidth: 45,
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    gap: 15,
  },
  controlButton: {
    width: 40,
    height: 40,
    backgroundColor: '#FFB199',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlButtonText: {
    fontSize: 16,
  },
  playButton: {
    width: 50,
    height: 50,
    backgroundColor: '#FF8C69',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButtonText: {
    fontSize: 20,
  },
  speedButton: {
    width: 45,
    height: 40,
    backgroundColor: '#E6D5C3',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  speedButtonText: {
    fontSize: 12,
    color: '#4A2F2A',
    fontWeight: 'bold',
  },
});