import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';

interface SettingsMenuScreenProps {
  onBack: () => void;
  onNavigateToTranscription: () => void;
  onNavigateToSummary: () => void;
  onNavigateToVocabulary: () => void;
}

export const SettingsMenuScreen: React.FC<SettingsMenuScreenProps> = ({ 
  onBack, 
  onNavigateToTranscription, 
  onNavigateToSummary,
  onNavigateToVocabulary 
}) => {
  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.backButtonContainer}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backButtonText}>← 戻る</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.titleContainer}>
          <Text style={styles.title}>設定</Text>
          <Text style={styles.subtitle}>プロンプトの設定を変更できます</Text>
        </View>

        <View style={styles.menuContainer}>
          <TouchableOpacity style={styles.menuItem} onPress={onNavigateToTranscription}>
            <View style={styles.menuIconContainer}>
              <Text style={styles.menuIcon}>📝</Text>
            </View>
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuTitle}>文字起こし設定</Text>
              <Text style={styles.menuDescription}>音声を文字起こしするときのプロンプトを設定</Text>
            </View>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={onNavigateToSummary}>
            <View style={styles.menuIconContainer}>
              <Text style={styles.menuIcon}>📄</Text>
            </View>
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuTitle}>要約設定</Text>
              <Text style={styles.menuDescription}>文字起こしを要約するときのプロンプトを設定</Text>
            </View>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={onNavigateToVocabulary}>
            <View style={styles.menuIconContainer}>
              <Text style={styles.menuIcon}>📖</Text>
            </View>
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuTitle}>単語帳設定</Text>
              <Text style={styles.menuDescription}>専門用語や固有名詞を登録して認識精度を向上</Text>
            </View>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
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
  menuContainer: {
    paddingHorizontal: 24,
  },
  menuItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#8B5A3C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E6D5C3',
  },
  menuIconContainer: {
    marginRight: 16,
  },
  menuIcon: {
    fontSize: 24,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#8B5A3C',
    marginBottom: 4,
  },
  menuDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  menuArrow: {
    fontSize: 24,
    color: '#8B5A3C',
    fontWeight: '300',
  },
});