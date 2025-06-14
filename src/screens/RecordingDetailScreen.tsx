import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import Slider from '@react-native-community/slider';
import Share from 'react-native-share';
import { Recording } from '../types';
import { RecordingService } from '../services/RecordingService';
import { StorageService } from '../services/StorageService';
import { TranscriptionService } from '../services/TranscriptionService';

interface Props {
  recording: Recording;
  onBack: () => void;
  onRecordingUpdated?: () => void;
}

export const RecordingDetailScreen: React.FC<Props> = ({ recording, onBack, onRecordingUpdated }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPosition, setCurrentPosition] = useState<number>(0);
  const [duration, setDuration] = useState<number>(recording.duration);
  const [recordingService] = useState(() => new RecordingService());
  const [isSliding, setIsSliding] = useState<boolean>(false);
  const [isSummarizing, setIsSummarizing] = useState<boolean>(false);
  const [currentRecording, setCurrentRecording] = useState<Recording>(recording);
  const formatDuration = (milliseconds: number): string => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}分${seconds}秒`;
  };

  const formatTime = (milliseconds: number): string => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleShare = async () => {
    if (!currentRecording.transcription) {
      Alert.alert('文字起こしが必要', '先に文字起こしを実行してください');
      return;
    }

    try {
      const shareContent = `
【${currentRecording.title}】
録音日時: ${currentRecording.createdAt.toLocaleDateString()} ${currentRecording.createdAt.toLocaleTimeString()}
録音時間: ${formatDuration(currentRecording.duration)}

${currentRecording.memo ? `メモ: ${currentRecording.memo}\n\n` : ''}文字起こし内容:
${currentRecording.transcription}
${currentRecording.summary ? `\n\n要約:\n${currentRecording.summary}` : ''}
      `.trim();

      await Share.open({
        message: shareContent,
        title: currentRecording.title,
      });
    } catch (error) {
      console.log('共有がキャンセルされました');
    }
  };

  const handlePlayRecording = async () => {
    try {
      if (isPlaying) {
        if (recordingService.getIsPlaying()) {
          await recordingService.pausePlayback();
        } else {
          await recordingService.resumePlayback();
        }
        return;
      }

      setIsPlaying(true);
      setCurrentPosition(0);
      setDuration(currentRecording.duration);

      const audioPath = currentRecording.filePath || currentRecording.uri;
      if (!audioPath) {
        throw new Error('音声ファイルのパスが見つかりません');
      }

      await recordingService.startPlayback(
        audioPath,
        (position, duration) => {
          if (!isSliding) {
            setCurrentPosition(position);
          }
          setDuration(duration);
        }
      );
    } catch (error) {
      console.error('再生エラー:', error);
      Alert.alert('エラー', `音声の再生に失敗しました: ${error.message}`);
      setIsPlaying(false);
    }
  };

  const handleStopPlayback = async () => {
    try {
      await recordingService.stopPlayback();
      setIsPlaying(false);
      setCurrentPosition(0);
      setDuration(currentRecording.duration);
    } catch (error) {
      console.error('停止エラー:', error);
    }
  };

  const handleSeekStart = () => {
    setIsSliding(true);
  };

  const handleSeekChange = (position: number) => {
    setCurrentPosition(position);
  };

  const handleSeekComplete = async (position: number) => {
    try {
      setIsSliding(false);
      await recordingService.seekToTime(position);
    } catch (error) {
      console.error('シークエラー:', error);
    }
  };

  const handleDeleteRecording = async () => {
    Alert.alert(
      '削除確認',
      'この録音を削除しますか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除',
          style: 'destructive',
          onPress: async () => {
            try {
              await recordingService.stopPlayback();
              await StorageService.deleteRecording(currentRecording.id);
              onRecordingUpdated?.();
              onBack();
            } catch (error) {
              Alert.alert('エラー', '録音の削除に失敗しました');
            }
          },
        },
      ]
    );
  };

  const handleSummarize = async () => {
    if (!currentRecording.transcription) {
      Alert.alert('文字起こしが必要', '先に文字起こしを実行してください');
      return;
    }

    if (currentRecording.summary) {
      Alert.alert('確認', 'すでに要約が存在します。新しく生成しますか？', [
        { text: 'キャンセル', style: 'cancel' },
        { text: '生成', onPress: () => generateSummary() }
      ]);
      return;
    }

    await generateSummary();
  };

  const generateSummary = async () => {
    try {
      setIsSummarizing(true);
      const summary = await TranscriptionService.generateSummary(currentRecording.transcription!);
      
      const updatedRecording = {
        ...currentRecording,
        summary
      };
      
      await StorageService.saveRecording(updatedRecording);
      setCurrentRecording(updatedRecording);
      onRecordingUpdated?.();
      
      Alert.alert('成功', '要約が生成されました');
    } catch (error) {
      console.error('要約生成エラー:', error);
      Alert.alert('エラー', `要約の生成に失敗しました: ${error.message}`);
    } finally {
      setIsSummarizing(false);
    }
  };

  const renderTranscriptionWithSpeakers = () => {
    if (!currentRecording.speakers || currentRecording.speakers.length === 0) {
      return (
        <Text style={styles.transcriptionText}>
          {currentRecording.transcription}
        </Text>
      );
    }

    const allSegments = currentRecording.speakers
      .flatMap(speaker => 
        speaker.segments.map(segment => ({
          ...segment,
          speakerName: speaker.name,
        }))
      )
      .sort((a, b) => a.startTime - b.startTime);

    return (
      <View>
        {allSegments.map((segment, index) => (
          <View key={index} style={styles.segmentContainer}>
            <View style={styles.segmentHeader}>
              <Text style={styles.speakerName}>{segment.speakerName}</Text>
              <Text style={styles.segmentTime}>
                {formatTime(segment.startTime)} - {formatTime(segment.endTime)}
              </Text>
            </View>
            <Text style={styles.segmentText}>{segment.text}</Text>
          </View>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>← 戻る</Text>
        </TouchableOpacity>
        
        <View style={styles.headerActions}>
          <TouchableOpacity style={[styles.actionButton, styles.playButton]} onPress={handlePlayRecording}>
            <Text style={styles.actionButtonText}>
              {isPlaying && recordingService.getIsPlaying() ? '一時停止' : '再生'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.actionButton, 
              styles.summaryButton,
              (!currentRecording.transcription || isSummarizing) && styles.disabledButton
            ]} 
            onPress={handleSummarize}
            disabled={!currentRecording.transcription || isSummarizing}
          >
            <Text style={styles.actionButtonText}>
              {isSummarizing ? '要約中...' : '要約'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.actionButton, styles.shareButton]} onPress={handleShare}>
            <Text style={styles.actionButtonText}>共有</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.actionButton, styles.deleteButton]} onPress={handleDeleteRecording}>
            <Text style={styles.actionButtonText}>削除</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.infoContainer}>
          <Text style={styles.title}>{currentRecording.title}</Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>録音日時:</Text>
            <Text style={styles.infoValue}>
              {currentRecording.createdAt.toLocaleDateString()} {currentRecording.createdAt.toLocaleTimeString()}
            </Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>録音時間:</Text>
            <Text style={styles.infoValue}>{formatDuration(currentRecording.duration)}</Text>
          </View>

          {currentRecording.memo && (
            <View style={styles.memoContainer}>
              <Text style={styles.memoLabel}>メモ:</Text>
              <Text style={styles.memoText}>{currentRecording.memo}</Text>
            </View>
          )}
        </View>

        {isPlaying && (
          <View style={styles.playerContainer}>
            <View style={styles.playerControls}>
              <Text style={styles.timeText}>
                {recordingService.formatTime(currentPosition)}
              </Text>
              <View style={styles.sliderContainer}>
                <Slider
                  style={styles.slider}
                  value={currentPosition}
                  minimumValue={0}
                  maximumValue={Math.max(duration, 1)}
                  onSlidingStart={handleSeekStart}
                  onValueChange={handleSeekChange}
                  onSlidingComplete={handleSeekComplete}
                  minimumTrackTintColor="#007bff"
                  maximumTrackTintColor="#ddd"
                />
              </View>
              <Text style={styles.timeText}>
                {recordingService.formatTime(duration)}
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.actionButton, styles.stopButton]}
              onPress={handleStopPlayback}
            >
              <Text style={styles.actionButtonText}>停止</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.transcriptionContainer}>
          <Text style={styles.transcriptionTitle}>文字起こし結果</Text>
          
          {currentRecording.transcription ? (
            <View style={styles.transcriptionContent}>
              {renderTranscriptionWithSpeakers()}
            </View>
          ) : (
            <View style={styles.noTranscriptionContainer}>
              <Text style={styles.noTranscriptionText}>
                文字起こしが実行されていません
              </Text>
              <Text style={styles.noTranscriptionSubText}>
                録音一覧画面から文字起こしを実行してください
              </Text>
            </View>
          )}
        </View>

        {currentRecording.summary && (
          <View style={styles.summaryContainer}>
            <Text style={styles.summaryTitle}>要約</Text>
            <View style={styles.summaryContent}>
              <Text style={styles.summaryText}>{currentRecording.summary}</Text>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007bff',
  },
  headerActions: {
    flexDirection: 'row',
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    marginLeft: 8,
  },
  playButton: {
    backgroundColor: '#17a2b8',
  },
  shareButton: {
    backgroundColor: '#007bff',
  },
  summaryButton: {
    backgroundColor: '#28a745',
  },
  deleteButton: {
    backgroundColor: '#dc3545',
  },
  stopButton: {
    backgroundColor: '#6c757d',
  },
  disabledButton: {
    backgroundColor: '#6c757d',
    opacity: 0.6,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  infoContainer: {
    backgroundColor: 'white',
    padding: 20,
    marginBottom: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
    width: 80,
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  memoContainer: {
    marginTop: 15,
    padding: 10,
    backgroundColor: '#f8f9fa',
    borderRadius: 5,
  },
  memoLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginBottom: 5,
  },
  memoText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  transcriptionContainer: {
    backgroundColor: 'white',
    padding: 20,
  },
  transcriptionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  transcriptionContent: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 5,
  },
  transcriptionText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 22,
  },
  segmentContainer: {
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  segmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  speakerName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#007bff',
  },
  segmentTime: {
    fontSize: 12,
    color: '#666',
  },
  segmentText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginLeft: 10,
  },
  noTranscriptionContainer: {
    alignItems: 'center',
    padding: 30,
  },
  noTranscriptionText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 5,
  },
  noTranscriptionSubText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  playerContainer: {
    backgroundColor: 'white',
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  playerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  sliderContainer: {
    flex: 1,
    marginHorizontal: 10,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  timeText: {
    fontSize: 12,
    color: '#666',
    minWidth: 40,
    textAlign: 'center',
  },
  summaryContainer: {
    backgroundColor: 'white',
    padding: 20,
    marginTop: 10,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  summaryContent: {
    backgroundColor: '#f0f8f0',
    padding: 15,
    borderRadius: 5,
    borderLeftWidth: 4,
    borderLeftColor: '#28a745',
  },
  summaryText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 22,
  },
});