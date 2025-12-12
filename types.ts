export interface Step {
  stepNumber: number;
  title: string;
  description: string;
  codeSnippet?: string; // Optional code block
  timestamp?: string; // e.g., "02:15"
  estimatedTime?: string; // e.g., "5 mins"
}

export interface Guide {
  id: string;
  videoUrl: string;
  videoId: string;
  playlistId?: string;
  title: string;
  summary: string;
  estimatedTime: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  prerequisites: string[];
  tools: string[];
  steps: Step[];
  createdAt: number;
  sources?: { title: string; uri: string }[];
}

export enum AppStatus {
  IDLE = 'IDLE',
  FETCHING_TRANSCRIPT = 'FETCHING_TRANSCRIPT',
  ANALYZING = 'ANALYZING',
  GENERATING = 'GENERATING',
  COMPLETE = 'COMPLETE',
  ERROR = 'ERROR'
}

export interface LoadingState {
  status: AppStatus;
  message: string;
  progress: number; // 0 to 100
}