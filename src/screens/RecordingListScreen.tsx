import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import Slider from '@react-native-community/slider';
import Share from 'react-native-share';
import { StorageService } from '../services/StorageService';
import { TranscriptionService } from '../services/TranscriptionService';
import { RecordingService } from '../services/RecordingService';
import { Recording } from '../types';

interface Props {
  onSelectRecording: (recording: Recording) => void;
}

export const RecordingListScreen: React.FC<Props> = ({ onSelectRecording }) => {
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [loading, setLoading] = useState(true);
  const [playingRecordingId, setPlayingRecordingId] = useState<string | null>(null);
  const [currentPosition, setCurrentPosition] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [recordingService] = useState(() => new RecordingService());
  const [isSliding, setIsSliding] = useState<boolean>(false);

  useEffect(() => {
    loadRecordings();
  }, []);

  const loadRecordings = async () => {
    try {
      const recordingList = await StorageService.getAllRecordings();
      recordingList.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      setRecordings(recordingList);
    } catch (error) {
      Alert.alert('エラー', '録音一覧の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRecording = async (id: string) => {
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
              await StorageService.deleteRecording(id);
              await loadRecordings();
            } catch (error) {
              Alert.alert('エラー', '録音の削除に失敗しました');
            }
          },
        },
      ]
    );
  };

  const handleTranscribeRecording = async (recording: Recording) => {
    if (recording.transcription) {
      Alert.alert('既に文字起こし済み', 'この録音は既に文字起こしが完了しています');
      return;
    }

    Alert.alert(
      '文字起こし開始',
      'この録音を文字起こししますか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '開始',
          onPress: async () => {
            try {
              Alert.alert('文字起こし中', 'しばらくお待ちください...');
              
              const transcribedRecording = await TranscriptionService.processRecording(recording);
              await StorageService.updateRecording(recording.id, {
                transcription: transcribedRecording.transcription,
                speakers: transcribedRecording.speakers,
              });

              await loadRecordings();
              Alert.alert('完了', '文字起こしが完了しました');
            } catch (error) {
              console.error('文字起こしエラー:', error);
              Alert.alert('エラー', `文字起こしに失敗しました: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
          },
        },
      ]
    );
  };

  const handlePlayRecording = async (recording: Recording) => {
    try {
      if (playingRecordingId === recording.id) {
        if (recordingService.getIsPlaying()) {
          await recordingService.pausePlayback();
        } else {
          await recordingService.resumePlayback();
        }
        return;
      }

      if (playingRecordingId) {
        await recordingService.stopPlayback();
      }

      setPlayingRecordingId(recording.id);
      setCurrentPosition(0);
      setDuration(recording.duration);

      // filePathまたはuriを使用
      const audioPath = recording.filePath || recording.uri;
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
      Alert.alert('エラー', `音声の再生に失敗しました: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setPlayingRecordingId(null);
    }
  };

  const handleStopPlayback = async () => {
    try {
      await recordingService.stopPlayback();
      setPlayingRecordingId(null);
      setCurrentPosition(0);
      setDuration(0);
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

  const handleShareRecording = async (recording: Recording) => {
    if (!recording.transcription) {
      Alert.alert('文字起こしが必要', '先に文字起こしを実行してください');
      return;
    }

    try {
      const shareContent = `
【${recording.title}】
録音日時: ${recording.createdAt.toLocaleDateString()} ${recording.createdAt.toLocaleTimeString()}
録音時間: ${formatDuration(recording.duration)}

${recording.memo ? `メモ: ${recording.memo}\n\n` : ''}文字起こし内容:
${recording.transcription}
      `.trim();

      await Share.open({
        message: shareContent,
        title: recording.title,
      });
    } catch (error) {
      console.log('共有がキャンセルされました');
    }
  };

  const formatDuration = (milliseconds: number): string => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}分${seconds}秒`;
  };

  const getPreviewText = (recording: Recording): string => {
    if (recording.transcription) {
      return recording.transcription.substring(0, 50) + '...';
    }
    return '文字起こし未実行';
  };

  const renderRecordingItem = ({ item }: { item: Recording }) => (
    <TouchableOpacity
      style={styles.itemContainer}
      onPress={() => onSelectRecording(item)}
    >
      <View style={styles.itemHeader}>
        <Text style={styles.itemTitle}>{item.title}</Text>
        <Text style={styles.itemDate}>
          {item.createdAt.toLocaleDateString()}
        </Text>
      </View>
      
      <Text style={styles.itemDuration}>
        {formatDuration(item.duration)}
      </Text>
      
      <Text style={styles.itemPreview}>
        {getPreviewText(item)}
      </Text>

      {item.memo && (
        <Text style={styles.itemMemo}>メモ: {item.memo}</Text>
      )}

      {playingRecordingId === item.id ? (
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
                minimumTrackTintColor="#FFB199"
                maximumTrackTintColor="#E6D5C3"
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
      ) : null}

      <View style={styles.itemActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.playButton]}
          onPress={() => handlePlayRecording(item)}
        >
          <Text style={styles.actionButtonText}>
            {playingRecordingId === item.id && recordingService.getIsPlaying() ? '一時停止' : '再生'}
          </Text>
        </TouchableOpacity>
        
        {!item.transcription && (
          <TouchableOpacity
            style={[styles.actionButton, styles.transcribeButton]}
            onPress={() => handleTranscribeRecording(item)}
          >
            <Text style={styles.actionButtonText}>文字起こし</Text>
          </TouchableOpacity>
        )}
        
        {item.transcription && (
          <TouchableOpacity
            style={[styles.actionButton, styles.shareButton]}
            onPress={() => handleShareRecording(item)}
          >
            <Text style={styles.actionButtonText}>共有</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDeleteRecording(item.id)}
        >
          <Text style={styles.actionButtonText}>削除</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <Text>読み込み中...</Text>
      </View>
    );
  }

  if (recordings.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyText}>録音がありません</Text>
        <Text style={styles.emptySubText}>録音ボタンから新しい録音を開始してください</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={recordings}
        renderItem={renderRecordingItem}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F0E8',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  listContainer: {
    padding: 16,
  },
  emptyText: {
    fontSize: 20,
    color: '#8B5A3C',
    textAlign: 'center',
    marginBottom: 12,
    fontWeight: '600',
  },
  emptySubText: {
    fontSize: 16,
    color: '#B5845A',
    textAlign: 'center',
  },
  itemContainer: {
    backgroundColor: '#F9F3E8',
    padding: 20,
    marginBottom: 16,
    borderRadius: 16,
    shadowColor: '#8B5A3C',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 2,
    borderColor: '#E6D5C3',
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#8B5A3C',
    flex: 1,
  },
  itemDate: {
    fontSize: 13,
    color: '#B5845A',
    fontWeight: '500',
  },
  itemDuration: {
    fontSize: 15,
    color: '#FFB199',
    marginBottom: 8,
    fontWeight: '600',
  },
  itemPreview: {
    fontSize: 15,
    color: '#8B5A3C',
    lineHeight: 22,
    marginBottom: 8,
  },
  itemMemo: {
    fontSize: 13,
    color: '#B5845A',
    fontStyle: 'italic',
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E6D5C3',
  },
  itemActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    shadowColor: '#8B5A3C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  playButton: {
    backgroundColor: '#2563EB',
  },
  transcribeButton: {
    backgroundColor: '#059669',
  },
  shareButton: {
    backgroundColor: '#FFB199',
  },
  stopButton: {
    backgroundColor: '#78716C',
  },  
  deleteButton: {
    backgroundColor: '#DC2626',
  },
  actionButtonText: {
    color: '#F9F3E8',
    fontSize: 13,
    fontWeight: '600',
  },
  playerContainer: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginTop: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#E6D5C3',
    shadowColor: '#8B5A3C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  playerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sliderContainer: {
    flex: 1,
    marginHorizontal: 12,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  timeText: {
    fontSize: 13,
    color: '#8B5A3C',
    minWidth: 50,
    textAlign: 'center',
    fontWeight: '500',
  },
});