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
                  minimumTrackTintColor="#3B82F6"
                  maximumTrackTintColor="#E2E8F0"
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
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  backButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  backButtonText: {
    fontSize: 16,
    color: '#3B82F6',
    fontWeight: '600',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  playButton: {
    backgroundColor: '#0EA5E9',
  },
  shareButton: {
    backgroundColor: '#3B82F6',
  },
  summaryButton: {
    backgroundColor: '#10B981',
  },
  deleteButton: {
    backgroundColor: '#EF4444',
  },
  stopButton: {
    backgroundColor: '#6B7280',
  },
  disabledButton: {
    backgroundColor: '#9CA3AF',
    opacity: 0.6,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  infoContainer: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    marginBottom: 12,
    borderRadius: 16,
    marginHorizontal: 16,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 15,
    color: '#64748B',
    fontWeight: '600',
    width: 90,
  },
  infoValue: {
    fontSize: 15,
    color: '#475569',
    flex: 1,
    fontWeight: '500',
  },
  memoContainer: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  memoLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 8,
  },
  memoText: {
    fontSize: 15,
    color: '#1E293B',
    lineHeight: 24,
  },
  transcriptionContainer: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  transcriptionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 20,
  },
  transcriptionContent: {
    backgroundColor: '#F8FAFC',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  transcriptionText: {
    fontSize: 15,
    color: '#475569',
    lineHeight: 24,
  },
  segmentContainer: {
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  segmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  speakerName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#3B82F6',
  },
  segmentTime: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  segmentText: {
    fontSize: 15,
    color: '#475569',
    lineHeight: 24,
    marginLeft: 12,
  },
  noTranscriptionContainer: {
    alignItems: 'center',
    padding: 40,
  },
  noTranscriptionText: {
    fontSize: 18,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: '600',
  },
  noTranscriptionSubText: {
    fontSize: 15,
    color: '#94A3B8',
    textAlign: 'center',
  },
  playerContainer: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    marginBottom: 12,
    borderRadius: 16,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  playerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sliderContainer: {
    flex: 1,
    marginHorizontal: 16,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  timeText: {
    fontSize: 13,
    color: '#475569',
    minWidth: 50,
    textAlign: 'center',
    fontWeight: '500',
  },
  summaryContainer: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 20,
  },
  summaryContent: {
    backgroundColor: '#F0FDF4',
    padding: 20,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  summaryText: {
    fontSize: 15,
    color: '#166534',
    lineHeight: 24,
  },
});