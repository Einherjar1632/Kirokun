import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { RecordingScreen } from './src/screens/RecordingScreen';
import { RecordingListScreen } from './src/screens/RecordingListScreen';
import { RecordingDetailScreen } from './src/screens/RecordingDetailScreen';
import { Recording } from './src/types';

type Screen = 'recording' | 'list' | 'detail';

function App(): React.JSX.Element {
  const [currentScreen, setCurrentScreen] = useState<Screen>('recording');
  const [selectedRecording, setSelectedRecording] = useState<Recording | null>(null);

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
        <Text style={styles.headerTitle}>商談録音アプリ</Text>
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
    backgroundColor: '#fff',
  },
  header: {
    backgroundColor: '#007bff',
    paddingVertical: 15,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  activeTab: {
    backgroundColor: 'white',
    borderBottomWidth: 2,
    borderBottomColor: '#007bff',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
  },
  activeTabText: {
    color: '#007bff',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
});

export default App;
