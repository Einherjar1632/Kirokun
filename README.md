# Kirokun

A React Native app for unified management of business meeting audio recording, transcription, and summarization.

## 📱 Overview

"Kirokun" is a mobile application designed to streamline audio recording in business scenarios. From recording to transcription and summary generation, everything is handled within a single app, making it easy to manage and share business meeting and negotiation content.

## ✨ Key Features

### 🎙️ Audio Recording
- **High-quality audio recording** with pause and resume functionality
- **Real-time recording time display** for visual recording status confirmation
- **Title and memo functionality** to record detailed information about recordings

### 📝 AI-Powered Transcription
- **Gemini API integration** using Google's latest AI technology for high-precision transcription
- **Speaker identification** automatically identifies and separates multiple speakers
- **Noise removal** automatically removes filler words and unnecessary speech patterns
- **Business text conversion** automatically formats into natural, readable text

### 📊 Summary Generation
- **Automatic summarization** extracts key points from transcription content
- **Structured summaries** organize agenda items, decisions, and next actions
- **Business document format** ready to use as reports

### 📂 Recording Management
- **Recording list display** manages past recordings in chronological order
- **Audio playback control** play, pause, and seek through recordings with visual slider
- **Detailed view functionality** integrated display of transcription, summary, and memos
- **Sharing functionality** share content with other apps or via email
- **Delete functionality** remove unwanted recordings

## 🛠️ Tech Stack

- **Framework**: React Native 0.74.0
- **Language**: TypeScript 5.0.4
- **AI API**: Google Gemini 1.5 Flash
- **Audio Processing**: react-native-audio-recorder-player
- **Data Storage**: @react-native-async-storage/async-storage
- **File Management**: react-native-fs
- **Permission Management**: react-native-permissions
- **Sharing Functionality**: react-native-share
- **UI Components**: @react-native-community/slider
- **Environment Variables**: react-native-dotenv
- **Type Safety**: Complete TypeScript type definitions with @types packages
- **Design**: Modern warm color theme (Coral Pink, Warm Brown, Cream palette)

## 🚀 Setup

### Prerequisites

- Node.js >= 18
- React Native development environment
- iOS development environment (Xcode) or Android development environment (Android Studio)
- Gemini API key

### Installation Steps

1. **Clone the repository**
```bash
git clone <repository-url>
cd Kirokun
```

2. **Install dependencies**
```bash
npm install
```

3. **Install iOS dependencies**
```bash
npx pod-install
```

4. **Environment variable setup**
Create a `.env` file and set your Gemini API key:
```env
GEMINI_API_KEY=your_gemini_api_key_here
```

**Note**: To use transcription and summarization features, please obtain a Gemini API key from Google AI Studio.

### Running the App

**iOS (Simulator)**
```bash
npm run ios
```

**iOS (Device)**
```bash
npx react-native run-ios --device
```

**Android**
```bash
npm run android
```

## 🎯 Usage

### 1. Audio Recording
1. Launch the app and select the "Recording" tab
2. Tap the "Start Recording" button to begin recording
3. Use "Pause" and "Resume" functions as needed
4. Tap "Stop Recording" to end recording
5. Enter title and memo, then save

### 2. Transcription
1. When saving a recording, select "Start" when prompted "Start transcription?", or
2. Tap the "Transcribe" button in the recording list screen
3. AI automatically analyzes audio and performs transcription
4. Speaker identification and content formatting are executed automatically

### 3. Summary Generation
1. After transcription completion, tap the "Summary" button in the recording detail screen
2. AI extracts key points from transcription content to generate summary
3. Generated summary is saved to the recording data

### 4. Recording Management and Sharing
1. Check past recordings in the "Recording List" tab
2. Tap a recording to display the detail screen
3. **Audio playback**: Use play/pause controls and slider to navigate through recordings
4. **View content**: Check transcription with speaker identification and summary
5. **Share recordings**: Use the "Share" button to export content with title, memo, transcription, and summary
6. **Delete recordings**: Remove unwanted recordings using the "Delete" button

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components (currently empty)
├── screens/            # Screen components
│   ├── RecordingScreen.tsx          # Recording screen with timer and controls
│   ├── RecordingListScreen.tsx      # Recording list with playback controls
│   └── RecordingDetailScreen.tsx    # Recording detail with full functionality
├── services/           # Business logic & API integration
│   ├── RecordingService.ts          # Audio recording and playback services
│   ├── StorageService.ts            # AsyncStorage data persistence
│   └── TranscriptionService.ts      # Gemini AI transcription and summarization
├── types/              # TypeScript type definitions
│   └── index.ts                     # Recording, Speaker, and app-wide types
└── utils/              # Utility functions (currently empty)
```

## ⚙️ Development & Debugging

### Code Quality Check
```bash
npm run lint          # Code quality check with ESLint
```

### Run Tests
```bash
npm test             # Run tests with Jest
```

### Start Development Server
```bash
npm start            # Start Metro bundler
```

### Clear Cache
```bash
npx react-native start --reset-cache
```

## 🔧 Settings & Customization

### Design Theme
- **Color Palette**: Warm theme matching the app icon design
  - Primary: Coral Pink (`#FFB199`) - accent colors and active states
  - Secondary: Warm Brown (`#8B5A3C`) - text and main elements
  - Background: Cream (`#F5F0E8`) - main background
  - Cards: Beige (`#F9F3E8`) - card backgrounds
  - Borders: Light Brown (`#E6D5C3`) - borders and dividers
- **Typography**: Enhanced with proper font weights and letter spacing
- **Shadows**: Consistent elevation system for depth
- **Modern UI**: Rounded corners, proper spacing, and visual hierarchy

### Gemini API Settings
- API settings can be customized in `src/services/TranscriptionService.ts`
- Transcription accuracy can be improved by adjusting prompts

### Audio Quality Settings
- Recording quality settings can be adjusted in `src/services/RecordingService.ts`

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

If you have bug reports or feature requests, please create an Issue.

---

**Developer**: Einherjar1632  
**Last Updated**: June 15, 2025