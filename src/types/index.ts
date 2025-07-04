export interface Recording {
  id: string;
  title: string;
  memo?: string;
  filePath: string;
  uri?: string;
  duration: number;
  createdAt: Date;
  transcription?: string;
  speakers?: Speaker[];
  summary?: string;
}

export interface Speaker {
  id: string;
  name: string;
  segments: TranscriptionSegment[];
}

export interface TranscriptionSegment {
  text: string;
  startTime: number;
  endTime: number;
  speakerId: string;
}

export type RecordingStatus = 'idle' | 'recording' | 'paused' | 'stopped';