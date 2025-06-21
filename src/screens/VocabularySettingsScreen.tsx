import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { VocabularyService, VocabularyItem } from '../services/VocabularyService';

interface VocabularySettingsScreenProps {
  onBack: () => void;
}


export const VocabularySettingsScreen: React.FC<VocabularySettingsScreenProps> = ({ onBack }) => {
  const [vocabularyItems, setVocabularyItems] = useState<VocabularyItem[]>([]);
  const [newWord, setNewWord] = useState('');
  const [newReading, setNewReading] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editWord, setEditWord] = useState('');
  const [editReading, setEditReading] = useState('');

  useEffect(() => {
    loadVocabulary();
  }, []);

  const loadVocabulary = async () => {
    try {
      const items = await VocabularyService.getVocabularyItems();
      setVocabularyItems(items);
    } catch (error) {
      console.error('単語帳の読み込みエラー:', error);
    }
  };

  const addVocabularyItem = async () => {
    if (!newWord.trim()) {
      Alert.alert('エラー', '単語を入力してください');
      return;
    }

    try {
      await VocabularyService.addVocabularyItem(newWord.trim(), newReading.trim());
      await loadVocabulary();
      setNewWord('');
      setNewReading('');
    } catch (error) {
      console.error('単語追加エラー:', error);
      Alert.alert('エラー', '単語の追加に失敗しました');
    }
  };

  const startEdit = (item: VocabularyItem) => {
    setEditingId(item.id);
    setEditWord(item.word);
    setEditReading(item.reading);
  };

  const saveEdit = async () => {
    if (!editWord.trim()) {
      Alert.alert('エラー', '単語を入力してください');
      return;
    }

    try {
      if (editingId) {
        await VocabularyService.updateVocabularyItem(editingId, editWord.trim(), editReading.trim());
        await loadVocabulary();
        setEditingId(null);
      }
    } catch (error) {
      console.error('単語更新エラー:', error);
      Alert.alert('エラー', '単語の更新に失敗しました');
    }
  };

  const deleteVocabularyItem = (id: string) => {
    Alert.alert(
      '削除確認',
      'この単語を削除しますか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除',
          style: 'destructive',
          onPress: async () => {
            try {
              await VocabularyService.deleteVocabularyItem(id);
              await loadVocabulary();
            } catch (error) {
              console.error('単語削除エラー:', error);
              Alert.alert('エラー', '単語の削除に失敗しました');
            }
          },
        },
      ]
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.backButtonContainer}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backButtonText}>← 戻る</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.titleContainer}>
          <Text style={styles.title}>単語帳設定</Text>
          <Text style={styles.subtitle}>登録した単語は文字起こし・要約時に優先的に使用されます</Text>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.sectionTitle}>新しい単語を追加</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="単語"
              value={newWord}
              onChangeText={setNewWord}
              placeholderTextColor="#999"
            />
            <TextInput
              style={styles.input}
              placeholder="読み方（任意）"
              value={newReading}
              onChangeText={setNewReading}
              placeholderTextColor="#999"
            />
          </View>
          <TouchableOpacity style={styles.addButton} onPress={addVocabularyItem}>
            <Text style={styles.addButtonText}>追加</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.listContainer}>
          <Text style={styles.sectionTitle}>登録済みの単語</Text>
          {vocabularyItems.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>まだ単語が登録されていません</Text>
            </View>
          ) : (
            vocabularyItems.map(item => (
              <View key={item.id} style={styles.vocabularyItem}>
                {editingId === item.id ? (
                  <View style={styles.editContainer}>
                    <View style={styles.editInputRow}>
                      <TextInput
                        style={styles.editInput}
                        value={editWord}
                        onChangeText={setEditWord}
                        placeholderTextColor="#999"
                      />
                      <TextInput
                        style={styles.editInput}
                        value={editReading}
                        onChangeText={setEditReading}
                        placeholderTextColor="#999"
                      />
                    </View>
                    <View style={styles.editButtonRow}>
                      <TouchableOpacity style={styles.saveButton} onPress={saveEdit}>
                        <Text style={styles.saveButtonText}>保存</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={styles.cancelButton} 
                        onPress={() => setEditingId(null)}
                      >
                        <Text style={styles.cancelButtonText}>キャンセル</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <View style={styles.itemContent}>
                    <View style={styles.wordContainer}>
                      <Text style={styles.wordText}>{item.word}</Text>
                      {item.reading && (
                        <Text style={styles.readingText}>（{item.reading}）</Text>
                      )}
                    </View>
                    <View style={styles.actionButtons}>
                      <TouchableOpacity 
                        style={styles.editButton} 
                        onPress={() => startEdit(item)}
                      >
                        <Text style={styles.editButtonText}>編集</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={styles.deleteButton} 
                        onPress={() => deleteVocabularyItem(item.id)}
                      >
                        <Text style={styles.deleteButtonText}>削除</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F0E8',
  },
  content: {
    flex: 1,
  },
  backButtonContainer: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 20,
  },
  backButton: {
    backgroundColor: '#E6D5C3',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  backButtonText: {
    color: '#8B5A3C',
    fontSize: 16,
    fontWeight: '600',
  },
  titleContainer: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#8B5A3C',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
  },
  inputContainer: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#8B5A3C',
    marginBottom: 16,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  input: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E6D5C3',
    color: '#333',
  },
  addButton: {
    backgroundColor: '#FFB199',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignSelf: 'flex-end',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  listContainer: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  emptyState: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E6D5C3',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#999',
  },
  vocabularyItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E6D5C3',
    overflow: 'hidden',
  },
  itemContent: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  wordContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  wordText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  readingText: {
    fontSize: 14,
    color: '#666',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    backgroundColor: '#E6D5C3',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  editButtonText: {
    color: '#8B5A3C',
    fontSize: 14,
    fontWeight: '500',
  },
  deleteButton: {
    backgroundColor: '#FFCCCB',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  deleteButtonText: {
    color: '#D32F2F',
    fontSize: 14,
    fontWeight: '500',
  },
  editContainer: {
    padding: 16,
  },
  editInputRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  editInput: {
    flex: 1,
    backgroundColor: '#F5F0E8',
    borderRadius: 6,
    padding: 8,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E6D5C3',
    color: '#333',
  },
  editButtonRow: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'flex-end',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  cancelButton: {
    backgroundColor: '#E6D5C3',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  cancelButtonText: {
    color: '#8B5A3C',
    fontSize: 14,
    fontWeight: '500',
  },
});