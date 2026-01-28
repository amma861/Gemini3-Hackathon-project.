
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

export interface CulturalAnalysis {
  regionalNuances: string[];
  potentialMisunderstandings: string[];
  tabooConsiderations: string[];
  recommendedPhasing: string;
}

export interface TranslationResult {
  translatedText: string; 
  backTranslation: string;
  summary: string[];
  culturalNotes: string;
  culturalAnalysis: CulturalAnalysis;
  jaccardScore: number;
  criticalRisk: boolean;
  panic: PanicAnalysis;
  tokens: MedicalTokens;
}

export interface WordDefinition {
  definition: string;
  culturalConnotation: string;
  crisisSignificance: string;
  regionalAlignment: string;
}

export interface TranscriptionTurn {
  role: 'user' | 'model' | 'system';
  text: string;
  timestamp: number;
}

export interface AnalysisState {
  status: 'idle' | 'processing' | 'completed' | 'error' | 'listening';
  data?: TranslationResult;
  error?: string;
  step?: string;
  isTransient?: boolean;
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
