import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
} from 'react-native';
import { RecordingService } from '../services/RecordingService';
import { StorageService } from '../services/StorageService';
import { TranscriptionService } from '../services/TranscriptionService';
import { Recording, RecordingStatus } from '../types';

interface RecordingScreenProps {
  recordingService: RecordingService;
}

export const RecordingScreen: React.FC<RecordingScreenProps> = ({ recordingService }) => {
  const [recordingStatus, setRecordingStatus] = useState<RecordingStatus>('idle');
  const [recordTime, setRecordTime] = useState<number>(0);
  const [showTitleModal, setShowTitleModal] = useState(false);
  const [recordingTitle, setRecordingTitle] = useState('');
  const [recordingMemo, setRecordingMemo] = useState('');
  const [currentRecordingPath, setCurrentRecordingPath] = useState<string>('');

  const handleStartRecording = async () => {
    try {
      const path = await recordingService.startRecording((time) => {
        setRecordTime(time);
      });
      setCurrentRecordingPath(path);
      setRecordingStatus('recording');
    } catch (error) {
      Alert.alert('エラー', '録音を開始できませんでした');
    }
  };

  const handleStopRecording = async () => {
    try {
      const result = await recordingService.stopRecording();
      setRecordingStatus('stopped');
      setShowTitleModal(true);
    } catch (error) {
      Alert.alert('エラー', '録音を停止できませんでした');
    }
  };

  const handlePauseRecording = async () => {
    try {
      await recordingService.pauseRecording();
      setRecordingStatus('paused');
    } catch (error) {
      Alert.alert('エラー', '録音を一時停止できませんでした');
    }
  };

  const handleResumeRecording = async () => {
    try {
      await recordingService.resumeRecording();
      setRecordingStatus('recording');
    } catch (error) {
      Alert.alert('エラー', '録音を再開できませんでした');
    }
  };

  const handleSaveRecording = async () => {
    try {
      const recording: Recording = {
        id: Date.now().toString(),
        title: recordingTitle || `録音 ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`,
        memo: recordingMemo,
        filePath: currentRecordingPath,
        duration: recordTime,
        createdAt: new Date(),
      };

      await StorageService.saveRecording(recording);
      
      Alert.alert(
        '録音を保存しました',
        '文字起こしを開始しますか？',
        [
          { text: 'あとで', style: 'cancel' },
          { 
            text: '開始', 
            onPress: () => handleTranscription(recording.id),
          },
        ]
      );

      resetRecording();
    } catch (error) {
      Alert.alert('エラー', '録音の保存に失敗しました');
    }
  };

  const handleTranscription = async (recordingId: string) => {
    try {
      const recordings = await StorageService.getAllRecordings();
      const recording = recordings.find(r => r.id === recordingId);
      
      if (!recording) return;

      Alert.alert('文字起こし中', 'しばらくお待ちください...');
      
      const transcribedRecording = await TranscriptionService.processRecording(recording);
      await StorageService.updateRecording(recordingId, {
        transcription: transcribedRecording.transcription,
        speakers: transcribedRecording.speakers,
      });

      Alert.alert('完了', '文字起こしが完了しました');
    } catch (error) {
      Alert.alert('エラー', '文字起こしに失敗しました');
    }
  };

  const resetRecording = () => {
    setRecordingStatus('idle');
    setRecordTime(0);
    setRecordingTitle('');
    setRecordingMemo('');
    setCurrentRecordingPath('');
    setShowTitleModal(false);
  };

  const getRecordingButtonText = () => {
    switch (recordingStatus) {
      case 'idle':
      case 'stopped':
        return '録音開始';
      case 'recording':
        return '録音停止';
      case 'paused':
        return '録音停止';
      default:
        return '録音開始';
    }
  };

  const getRecordingButtonColor = () => {
    switch (recordingStatus) {
      case 'recording':
        return '#DC2626';
      case 'paused':
        return '#D97706';
      default:
        return '#FFB199';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.timeContainer}>
        <Text style={styles.timeText}>
          {recordingService.formatTime(recordTime)}
        </Text>
        <Text style={styles.statusText}>
          {recordingStatus === 'recording' && '録音中'}
          {recordingStatus === 'paused' && '一時停止中'}
          {recordingStatus === 'idle' && '待機中'}
          {recordingStatus === 'stopped' && '録音完了'}
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.recordButton,
            { backgroundColor: getRecordingButtonColor() },
          ]}
          onPress={
            recordingStatus === 'idle' || recordingStatus === 'stopped'
              ? handleStartRecording
              : handleStopRecording
          }
        >
          <Text style={styles.recordButtonText}>
            {getRecordingButtonText()}
          </Text>
        </TouchableOpacity>

        {recordingStatus === 'recording' && (
          <TouchableOpacity
            style={[styles.controlButton, styles.pauseButton]}
            onPress={handlePauseRecording}
          >
            <Text style={styles.controlButtonText}>一時停止</Text>
          </TouchableOpacity>
        )}

        {recordingStatus === 'paused' && (
          <TouchableOpacity
            style={[styles.controlButton, styles.resumeButton]}
            onPress={handleResumeRecording}
          >
            <Text style={styles.controlButtonText}>再開</Text>
          </TouchableOpacity>
        )}
      </View>

      <Modal
        visible={showTitleModal}
        transparent
        animationType="slide"
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>録音を保存</Text>
              
              <TextInput
                style={styles.input}
                placeholder="タイトル（省略可）"
                value={recordingTitle}
                onChangeText={setRecordingTitle}
                returnKeyType="next"
                blurOnSubmit={false}
              />
              
              <TextInput
                style={[styles.input, styles.memoInput]}
                placeholder="メモ（省略可）"
                value={recordingMemo}
                onChangeText={setRecordingMemo}
                multiline
                returnKeyType="done"
                blurOnSubmit={true}
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={resetRecording}
                >
                  <Text style={styles.cancelButtonText}>キャンセル</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.modalButton, styles.saveButton]}
                  onPress={handleSaveRecording}
                >
                  <Text style={styles.saveButtonText}>保存</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F0E8',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  timeContainer: {
    alignItems: 'center',
    marginBottom: 60,
    backgroundColor: '#F9F3E8',
    padding: 32,
    borderRadius: 24,
    shadowColor: '#8B5A3C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
    minWidth: 280,
    borderWidth: 2,
    borderColor: '#E6D5C3',
  },
  timeText: {
    fontSize: 52,
    fontWeight: '800',
    color: '#8B5A3C',
    marginBottom: 8,
    letterSpacing: -1,
  },
  statusText: {
    fontSize: 18,
    color: '#B5845A',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  buttonContainer: {
    alignItems: 'center',
  },
  recordButton: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#8B5A3C',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  recordButtonText: {
    color: '#F9F3E8',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  controlButton: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 28,
    shadowColor: '#8B5A3C',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
  pauseButton: {
    backgroundColor: '#D97706',
  },
  resumeButton: {
    backgroundColor: '#059669',
  },
  controlButtonText: {
    color: '#F9F3E8',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(139, 90, 60, 0.6)',
  },
  scrollContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#F9F3E8',
    padding: 28,
    borderRadius: 20,
    width: '85%',
    shadowColor: '#8B5A3C',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
    borderWidth: 2,
    borderColor: '#E6D5C3',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 24,
    color: '#8B5A3C',
  },
  input: {
    borderWidth: 2,
    borderColor: '#E6D5C3',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    fontSize: 16,
    color: '#8B5A3C',
    backgroundColor: '#FFFFFF',
  },
  memoInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#E6D5C3',
    marginRight: 12,
  },
  saveButton: {
    backgroundColor: '#8B5A3C',
    marginLeft: 12,
  },
  cancelButtonText: {
    color: '#8B5A3C',
    fontWeight: '600',
    fontSize: 16,
  },
  saveButtonText: {
    color: '#F9F3E8',
    fontWeight: '700',
    fontSize: 16,
  },
});