import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  AppState,
} from 'react-native';
import { RecordingScreen } from './src/screens/RecordingScreen';
import { RecordingListScreen } from './src/screens/RecordingListScreen';
import { RecordingDetailScreen } from './src/screens/RecordingDetailScreen';
import { Recording } from './src/types';

type Screen = 'recording' | 'list' | 'detail';

function App(): React.JSX.Element {
  const [currentScreen, setCurrentScreen] = useState<Screen>('recording');
  const [selectedRecording, setSelectedRecording] = useState<Recording | null>(null);

  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'background') {
        console.log('アプリがバックグラウンドに移行しました');
      } else if (nextAppState === 'active') {
        console.log('アプリがアクティブになりました');
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription?.remove();
    };
  }, []);

  const handleSelectRecording = (recording: Recording) => {
    setSelectedRecording(recording);
    setCurrentScreen('detail');
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'recording':
        return <RecordingScreen />;
      case 'list':
        return <RecordingListScreen onSelectRecording={handleSelectRecording} />;
      case 'detail':
        return selectedRecording ? (
          <RecordingDetailScreen 
            recording={selectedRecording} 
            onBack={() => setCurrentScreen('list')}
          />
        ) : null;
      default:
        return <RecordingScreen />;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>きろくん</Text>
      </View>

      {currentScreen !== 'detail' && (
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[
              styles.tab,
              currentScreen === 'recording' && styles.activeTab,
            ]}
            onPress={() => setCurrentScreen('recording')}
          >
            <Text style={[
              styles.tabText,
              currentScreen === 'recording' && styles.activeTabText,
            ]}>
              録音
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.tab,
              currentScreen === 'list' && styles.activeTab,
            ]}
            onPress={() => setCurrentScreen('list')}
          >
            <Text style={[
              styles.tabText,
              currentScreen === 'list' && styles.activeTabText,
            ]}>
              録音一覧
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.content}>
        {renderScreen()}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F0E8',
  },
  header: {
    backgroundColor: '#8B5A3C',
    paddingVertical: 20,
    paddingHorizontal: 24,
    alignItems: 'center',
    shadowColor: '#8B5A3C',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#F5F0E8',
    letterSpacing: 0.5,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F9F3E8',
    borderBottomWidth: 1,
    borderBottomColor: '#E6D5C3',
    shadowColor: '#8B5A3C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    backgroundColor: '#F9F3E8',
    borderRadius: 0,
  },
  activeTab: {
    backgroundColor: '#F9F3E8',
    borderBottomWidth: 3,
    borderBottomColor: '#FFB199',
    transform: [{ translateY: 1 }],
  },
  tabText: {
    fontSize: 16,
    color: '#8B5A3C',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#FFB199',
    fontWeight: '700',
  },
  content: {
    flex: 1,
  },
});

export default App;
