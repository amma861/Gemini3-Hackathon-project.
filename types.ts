
export interface PanicAnalysis {
  score: number;
  indicators: string[];
  deEscalationSteps: string[];
}

export interface MedicalTokens {
  originalEntities: string[];
  backTranslatedEntities: string[];
  matchedEntities: string[];
  missedEntities: string[];
}

export interface TranslationResult {
  igboTranslation: string; // Used for the target language (Swahili in current node)
  backTranslation: string;
  summary: string[];
  culturalNotes: string;
  jaccardScore: number;
  criticalRisk: boolean;
  panic: PanicAnalysis;
  tokens: MedicalTokens;
}

export interface TranscriptionTurn {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export interface AnalysisState {
  status: 'idle' | 'processing' | 'completed' | 'error' | 'listening';
  data?: TranslationResult;
  error?: string;
  step?: string;
  transcriptions?: TranscriptionTurn[];
}

export interface FeedbackEntry {
  id: string;
  sourceText: string;
  translatedText: string;
  language: string;
  rating: 'positive' | 'negative';
  auditScore: number;
  timestamp: number;
}

export interface SavedSession {
  id: string;
  timestamp: number;
  inputText: string;
  image?: string | null;
  targetLanguage: string;
  data: TranslationResult;
}
