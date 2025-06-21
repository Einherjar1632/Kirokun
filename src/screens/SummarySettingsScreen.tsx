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

interface SummaryTemplate {
  id: string;
  name: string;
  prompt: string;
}

const SUMMARY_TEMPLATES: SummaryTemplate[] = [
  {
    id: 'simple',
    name: 'シンプル用',
    prompt: `以下の文字起こしテキストを簡潔に要約してください。

【重要な指示】
1. 3-5行程度で要点をまとめてください
2. 重要なキーワードや数字は含めてください
3. 分かりやすい日本語で記載してください

【文字起こしテキスト】
{transcription}

上記の内容を簡潔に要約してください。`
  },
  {
    id: 'meeting',
    name: '会議用',
    prompt: `以下の文字起こしテキストを要約してください。以下の点に注意して処理をお願いします：

【重要な指示】
1. 商談や会議の内容として、重要なポイントを簡潔にまとめてください
2. 話し合われた議題、決定事項、次回のアクションなどを整理してください
3. 参加者の役割や立場が分かる場合は明記してください
4. 3-5個の箇条書きで要約してください
5. 日本語で、ビジネス文書として適切な表現で記載してください
6. 不要な詳細は省略し、要点のみを抽出してください

【出力形式】
■ 議題・目的：[会議や商談の目的]
■ 主要な内容：
  • [重要ポイント1]
  • [重要ポイント2]
  • [重要ポイント3]
■ 決定事項・合意点：[決まったこと]
■ 次回アクション：[今後の予定や課題]

【文字起こしテキスト】
{transcription}

上記の内容を分析し、ビジネス要約として整理してください。`
  },
  {
    id: 'learning',
    name: '学習・教育用',
    prompt: `以下の文字起こしテキストを学習用に要約してください。

【重要な指示】
1. 重要な概念やキーワードを抽出してください
2. 覚えるべきポイントを明確にしてください
3. 理解しやすい構造で整理してください
4. 専門用語がある場合は説明を含めてください

【出力形式】
■ 主要テーマ：[内容のテーマ]
■ 重要概念：
  • [概念1]：[説明]
  • [概念2]：[説明]
■ キーポイント：
  • [覚えるべきポイント1]
  • [覚えるべきポイント2]
■ 補足情報：[追加で知っておくべきこと]

【文字起こしテキスト】
{transcription}

上記の内容を学習用に整理してください。`
  },
  {
    id: 'interview',
    name: 'インタビュー・ヒアリング用',
    prompt: `以下の文字起こしテキストをインタビュー・ヒアリング用に要約してください。

【重要な指示】
1. 質問と回答の構造を明確にしてください
2. 重要な発言や意見を抽出してください
3. 回答者の背景や立場が分かる場合は記載してください
4. 具体的な事例や数字があれば含めてください

【出力形式】
■ 回答者情報：[回答者の背景・立場]
■ 主要な質問と回答：
  Q: [質問1]
  A: [回答1の要約]
  
  Q: [質問2]
  A: [回答2の要約]
■ 重要な発言：[特に注目すべき発言]
■ 次回確認事項：[追加で聞くべきこと]

【文字起こしテキスト】
{transcription}

上記の内容をインタビュー要約として整理してください。`
  },
  {
    id: 'presentation',
    name: 'プレゼンテーション用',
    prompt: `以下の文字起こしテキストをプレゼンテーション用に要約してください。

【重要な指示】
1. プレゼンの主要メッセージを抽出してください
2. 提案内容や重要な数字・データを含めてください
3. 質疑応答があれば整理してください
4. アクションアイテムがあれば明記してください

【出力形式】
■ プレゼンテーマ：[発表のテーマ]
■ 主要メッセージ：
  • [メッセージ1]
  • [メッセージ2]
  • [メッセージ3]
■ 提案・数字：[具体的な提案内容や数値]
■ 質疑応答：[重要な質問と回答]
■ アクションアイテム：[今後のアクション]

【文字起こしテキスト】
{transcription}

上記の内容をプレゼンテーション要約として整理してください。`
  }
];

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

  const applyTemplate = (template: SummaryTemplate) => {
    setSummaryPrompt(template.prompt);
  };

  const getCurrentTemplate = (): string | null => {
    for (const template of SUMMARY_TEMPLATES) {
      if (summaryPrompt.trim() === template.prompt.trim()) {
        return template.id;
      }
    }
    return null;
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
          <Text style={styles.sectionTitle}>テンプレート選択</Text>
          <Text style={styles.sectionSubtitle}>以下のテンプレートから選択するか、自由に編集してください</Text>
          <View style={styles.templateContainer}>
            {SUMMARY_TEMPLATES.map((template) => {
              const isSelected = getCurrentTemplate() === template.id;
              return (
                <TouchableOpacity
                  key={template.id}
                  style={[
                    styles.templateButton,
                    isSelected && styles.templateButtonSelected
                  ]}
                  onPress={() => applyTemplate(template)}
                >
                  <Text style={[
                    styles.templateButtonText,
                    isSelected && styles.templateButtonTextSelected
                  ]}>
                    {template.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>プロンプト</Text>
          <Text style={styles.sectionSubtitle}>選択したテンプレートを編集することも可能です</Text>
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
            <Text style={styles.resetButtonText}>システムデフォルト</Text>
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
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  templateContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  templateButton: {
    backgroundColor: '#E6D5C3',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#D4C3B0',
  },
  templateButtonSelected: {
    backgroundColor: '#FFB199',
    borderColor: '#FF9068',
    shadowColor: '#8B5A3C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  templateButtonText: {
    color: '#8B5A3C',
    fontSize: 14,
    fontWeight: '600',
  },
  templateButtonTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
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