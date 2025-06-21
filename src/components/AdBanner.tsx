import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
} from 'react-native';

interface AdBannerProps {
  style?: any;
}

export const AdBanner: React.FC<AdBannerProps> = ({ style }) => {
  const handleAdPress = async () => {
    try {
      // 広告をタップした時の動作（例：ウェブサイトを開く）
      const url = 'https://example.com';
      const supported = await Linking.canOpenURL(url);
      
      if (supported) {
        await Linking.openURL(url);
      } else {
        console.log('URLを開けません:', url);
      }
    } catch (error) {
      console.error('広告URLを開く際にエラーが発生しました:', error);
    }
  };

  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity 
        style={styles.adBanner} 
        onPress={handleAdPress}
        activeOpacity={0.8}
      >
        <View style={styles.adContent}>
          <Text style={styles.adLabel}>PR</Text>
          <View style={styles.adTextContainer}>
            <Text style={styles.adTitle}>あなたのビジネスを次のレベルへ</Text>
            <Text style={styles.adDescription}>効率的な営業支援ツールで売上アップを実現</Text>
          </View>
          <View style={styles.adButton}>
            <Text style={styles.adButtonText}>詳細</Text>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F5F0E8',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  adBanner: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#8B5A3C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E6D5C3',
  },
  adContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  adLabel: {
    backgroundColor: '#FFB199',
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 12,
    textAlign: 'center',
    minWidth: 24,
  },
  adTextContainer: {
    flex: 1,
    marginRight: 12,
  },
  adTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8B5A3C',
    marginBottom: 2,
    lineHeight: 18,
  },
  adDescription: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
  },
  adButton: {
    backgroundColor: '#FFB199',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  adButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
});