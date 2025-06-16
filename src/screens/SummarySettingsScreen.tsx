import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { PromptSettingsService } from '../services/PromptSettingsService';

interface SummarySettingsScreenProps {
  onBack: () => void;
}

export const SummarySettingsScreen: React.FC<SummarySettingsScreenProps> = ({ onBack }) => {
  const [summaryPrompt, setSummaryPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const settings = await PromptSettingsService.getSettings();
      setSummaryPrompt(settings.summaryPrompt);
    } catch (error) {
      console.error('設定の読み込みエラー:', error);
    }
  };

  const saveSettings = async () => {
    try {
      setIsLoading(true);
      const currentSettings = await PromptSettingsService.getSettings();
      await PromptSettingsService.saveSettings({
        transcriptionPrompt: currentSettings.transcriptionPrompt,
        summaryPrompt,
      });
      Alert.alert('設定保存', '要約設定が正常に保存されました');
    } catch (error) {
      console.error('設定の保存エラー:', error);
      Alert.alert('エラー', '設定の保存に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const resetToDefault = async () => {
    try {
      const defaultSettings = await PromptSettingsService.getDefaultSettings();
      setSummaryPrompt(defaultSettings.summaryPrompt);
    } catch (error) {
      console.error('デフォルト設定の取得エラー:', error);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
    >
      <ScrollView 
        ref={scrollViewRef}
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
      >
        <View style={styles.backButtonContainer}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backButtonText}>← 戻る</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.titleContainer}>
          <Text style={styles.title}>📄 要約設定</Text>
          <Text style={styles.subtitle}>文字起こしした内容を要約する際に使用するAIへの指示文を設定できます</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>プロンプト</Text>
          <TextInput
            style={styles.textInput}
            value={summaryPrompt}
            onChangeText={setSummaryPrompt}
            multiline
            numberOfLines={6}
            placeholder="要約用のプロンプトを入力してください..."
            placeholderTextColor="#999"
            textAlignVertical="top"
            scrollEnabled={true}
            onFocus={() => {
              setTimeout(() => {
                scrollViewRef.current?.scrollToEnd({ animated: true });
              }, 100);
            }}
          />
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.resetButton}
            onPress={resetToDefault}
            disabled={isLoading}
          >
            <Text style={styles.resetButtonText}>デフォルトに戻す</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
            onPress={saveSettings}
            disabled={isLoading}
          >
            <Text style={styles.saveButtonText}>
              {isLoading ? '保存中...' : '保存'}
            </Text>
          </TouchableOpacity>
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
  scrollContainer: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
  },
  backButtonContainer: {
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
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#8B5A3C',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#8B5A3C',
    marginBottom: 16,
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    fontSize: 14,
    color: '#333',
    borderWidth: 1,
    borderColor: '#E6D5C3',
    height: 200,
    maxHeight: 200,
    shadowColor: '#8B5A3C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 40,
    gap: 16,
  },
  resetButton: {
    flex: 1,
    backgroundColor: '#E6D5C3',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  resetButtonText: {
    color: '#8B5A3C',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#FFB199',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#CCC',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});