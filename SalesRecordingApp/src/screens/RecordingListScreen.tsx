import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import Share from 'react-native-share';
import { StorageService } from '../services/StorageService';
import { TranscriptionService } from '../services/TranscriptionService';
import { Recording } from '../types';

interface Props {
  onSelectRecording: (recording: Recording) => void;
}

export const RecordingListScreen: React.FC<Props> = ({ onSelectRecording }) => {
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [loading, setLoading] = useState(true);

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
              Alert.alert('エラー', '文字起こしに失敗しました');
            }
          },
        },
      ]
    );
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

      <View style={styles.itemActions}>
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
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  listContainer: {
    padding: 10,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginBottom: 10,
  },
  emptySubText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  itemContainer: {
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
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  itemDate: {
    fontSize: 12,
    color: '#666',
  },
  itemDuration: {
    fontSize: 14,
    color: '#007bff',
    marginBottom: 5,
  },
  itemPreview: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 5,
  },
  itemMemo: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
    marginBottom: 10,
  },
  itemActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    marginLeft: 8,
  },
  transcribeButton: {
    backgroundColor: '#28a745',
  },
  shareButton: {
    backgroundColor: '#007bff',
  },
  deleteButton: {
    backgroundColor: '#dc3545',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
});