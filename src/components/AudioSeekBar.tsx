import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
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
}

export const AudioSeekBar: React.FC<AudioSeekBarProps> = ({
  currentPosition,
  duration,
  isSliding,
  onSeekStart,
  onSeekChange,
  onSeekComplete,
  recordingService,
}) => {
  return (
    <View style={styles.container}>
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
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    marginTop: 10,
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
});