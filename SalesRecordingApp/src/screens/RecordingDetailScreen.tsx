import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import Share from 'react-native-share';
import { Recording } from '../types';

interface Props {
  recording: Recording;
  onBack: () => void;
}

export const RecordingDetailScreen: React.FC<Props> = ({ recording, onBack }) => {
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

  const renderTranscriptionWithSpeakers = () => {
    if (!recording.speakers || recording.speakers.length === 0) {
      return (
        <Text style={styles.transcriptionText}>
          {recording.transcription}
        </Text>
      );
    }

    const allSegments = recording.speakers
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
        
        <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
          <Text style={styles.shareButtonText}>共有</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.infoContainer}>
          <Text style={styles.title}>{recording.title}</Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>録音日時:</Text>
            <Text style={styles.infoValue}>
              {recording.createdAt.toLocaleDateString()} {recording.createdAt.toLocaleTimeString()}
            </Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>録音時間:</Text>
            <Text style={styles.infoValue}>{formatDuration(recording.duration)}</Text>
          </View>

          {recording.memo && (
            <View style={styles.memoContainer}>
              <Text style={styles.memoLabel}>メモ:</Text>
              <Text style={styles.memoText}>{recording.memo}</Text>
            </View>
          )}
        </View>

        <View style={styles.transcriptionContainer}>
          <Text style={styles.transcriptionTitle}>文字起こし結果</Text>
          
          {recording.transcription ? (
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
  shareButton: {
    backgroundColor: '#007bff',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 5,
  },
  shareButtonText: {
    color: 'white',
    fontSize: 14,
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
});