import AsyncStorage from '@react-native-async-storage/async-storage';
import { Recording } from '../types';

const RECORDINGS_KEY = 'recordings';

export class StorageService {
  static async saveRecording(recording: Recording): Promise<void> {
    try {
      const recordings = await this.getAllRecordings();
      recordings.push(recording);
      await AsyncStorage.setItem(RECORDINGS_KEY, JSON.stringify(recordings));
    } catch (error) {
      console.error('録音の保存に失敗しました:', error);
      throw error;
    }
  }

  static async getAllRecordings(): Promise<Recording[]> {
    try {
      const recordingsJson = await AsyncStorage.getItem(RECORDINGS_KEY);
      if (!recordingsJson) return [];
      
      const recordings = JSON.parse(recordingsJson);
      return recordings.map((recording: any) => ({
        ...recording,
        createdAt: new Date(recording.createdAt),
      }));
    } catch (error) {
      console.error('録音の取得に失敗しました:', error);
      return [];
    }
  }

  static async updateRecording(id: string, updates: Partial<Recording>): Promise<void> {
    try {
      const recordings = await this.getAllRecordings();
      const index = recordings.findIndex(r => r.id === id);
      
      if (index === -1) {
        throw new Error('録音が見つかりません');
      }

      recordings[index] = { ...recordings[index], ...updates };
      await AsyncStorage.setItem(RECORDINGS_KEY, JSON.stringify(recordings));
    } catch (error) {
      console.error('録音の更新に失敗しました:', error);
      throw error;
    }
  }

  static async deleteRecording(id: string): Promise<void> {
    try {
      const recordings = await this.getAllRecordings();
      const filteredRecordings = recordings.filter(r => r.id !== id);
      await AsyncStorage.setItem(RECORDINGS_KEY, JSON.stringify(filteredRecordings));
    } catch (error) {
      console.error('録音の削除に失敗しました:', error);
      throw error;
    }
  }
}