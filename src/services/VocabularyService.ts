import AsyncStorage from '@react-native-async-storage/async-storage';

export interface VocabularyItem {
  id: string;
  word: string;
  reading: string;
}

export class VocabularyService {
  private static readonly VOCABULARY_STORAGE_KEY = '@vocabulary_items';

  static async getVocabularyItems(): Promise<VocabularyItem[]> {
    try {
      const savedVocabulary = await AsyncStorage.getItem(this.VOCABULARY_STORAGE_KEY);
      return savedVocabulary ? JSON.parse(savedVocabulary) : [];
    } catch (error) {
      console.error('単語帳の読み込みエラー:', error);
      return [];
    }
  }

  static async saveVocabularyItems(items: VocabularyItem[]): Promise<void> {
    try {
      await AsyncStorage.setItem(this.VOCABULARY_STORAGE_KEY, JSON.stringify(items));
    } catch (error) {
      console.error('単語帳の保存エラー:', error);
      throw error;
    }
  }

  static async addVocabularyItem(word: string, reading: string = ''): Promise<VocabularyItem> {
    try {
      const items = await this.getVocabularyItems();
      const newItem: VocabularyItem = {
        id: Date.now().toString(),
        word: word.trim(),
        reading: reading.trim(),
      };
      
      const updatedItems = [...items, newItem];
      await this.saveVocabularyItems(updatedItems);
      return newItem;
    } catch (error) {
      console.error('単語追加エラー:', error);
      throw error;
    }
  }

  static async updateVocabularyItem(id: string, word: string, reading: string = ''): Promise<void> {
    try {
      const items = await this.getVocabularyItems();
      const updatedItems = items.map(item => 
        item.id === id 
          ? { ...item, word: word.trim(), reading: reading.trim() }
          : item
      );
      await this.saveVocabularyItems(updatedItems);
    } catch (error) {
      console.error('単語更新エラー:', error);
      throw error;
    }
  }

  static async deleteVocabularyItem(id: string): Promise<void> {
    try {
      const items = await this.getVocabularyItems();
      const updatedItems = items.filter(item => item.id !== id);
      await this.saveVocabularyItems(updatedItems);
    } catch (error) {
      console.error('単語削除エラー:', error);
      throw error;
    }
  }

  static generateVocabularyPrompt(vocabularyItems: VocabularyItem[]): string {
    if (vocabularyItems.length === 0) {
      return '';
    }

    const vocabularyList = vocabularyItems.map(item => {
      return item.reading 
        ? `「${item.word}」（読み方：${item.reading}）`
        : `「${item.word}」`;
    }).join('、');

    return `
以下の単語帳に登録された専門用語や固有名詞があります。音声認識の際は、これらの単語を優先的に使用してください：

【登録単語】
${vocabularyList}

これらの単語が音声に含まれている可能性が高い場合は、音響的に類似した一般的な単語よりも、登録された単語を優先して認識してください。
`;
  }
}