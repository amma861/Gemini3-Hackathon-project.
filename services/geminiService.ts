
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { TranslationResult, WordDefinition, FeedbackEntry } from "../types";

const PRO_MODEL = 'gemini-3-pro-preview';
const FLASH_MODEL = 'gemini-3-flash-preview';
const TTS_MODEL = 'gemini-2.5-flash-preview-tts';

export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  private async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    initialDelay: number = 1000
  ): Promise<T> {
    let lastError: any;
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await operation();
      } catch (err: any) {
        lastError = err;
        const status = err.status || (err.message?.includes('429') ? 429 : 500);
        
        // Retry logic for transient errors (429, 500, 503, 504)
        if (status === 429 || status >= 500) {
          const delay = initialDelay * Math.pow(2, i);
          console.warn(`Transient node disruption (${status}). Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        throw err;
      }
    }
    throw lastError;
  }

  decode(base64: string) {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }

  encode(bytes: Uint8Array) {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  async decodeAudioData(
    data: Uint8Array,
    ctx: AudioContext,
    sampleRate: number,
    numChannels: number,
  ): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
      }
    }
    return buffer;
  }

  private getLearnedContext(): string {
    try {
      const feedback: FeedbackEntry[] = JSON.parse(localStorage.getItem('aura_align_feedback') || '[]');
      if (feedback.length === 0) return "";
      const negative = feedback.filter(f => f.rating === 'negative').slice(-5);
      const positive = feedback.filter(f => f.rating === 'positive').slice(-5);
      let context = "\n### LEARNED KNOWLEDGE BASE\n";
      if (negative.length > 0) {
        context += "AVOID ERRORS:\n" + negative.map(f => `- "${f.sourceText}" -> X "${f.translatedText}"`).join('\n') + "\n";
      }
      if (positive.length > 0) {
        context += "VALIDATED EXAMPLES:\n" + positive.map(f => `- "${f.sourceText}" -> OK "${f.translatedText}"`).join('\n') + "\n";
      }
      return context;
    } catch (e) { return ""; }
  }

  async processMedicalDocument(
    textInput: string,
    targetLanguage: string,
    imageInput?: string
  ): Promise<TranslationResult> {
    try {
      const learnedContext = this.getLearnedContext();
      
      const responseText = await this.withRetry(async () => {
        const response = await this.ai.models.generateContent({
          model: PRO_MODEL,
          contents: {
            parts: [
              { text: `Translate to ${targetLanguage}. 
                ### CLINICAL PROTOCOL
                1. ACCURACY: Precision is paramount. Use clinical terminology that is regionally appropriate for ${targetLanguage}.
                2. CULTURAL ALIGNMENT: Identify medical concepts that may be misunderstood (e.g., organ donation, blood transfusions, psychiatric care) in ${targetLanguage} contexts. Provide specific regional nuances.
                3. TABOOS: Note terms or conditions that are taboo in ${targetLanguage} cultures and suggest respectful phrasing.
                4. AUDIT: Identify critical medical entities in both source and translation.
                5. JACCARD: Provide a similarity score for entity preservation.
                ${learnedContext}
                SOURCE: ${textInput}` },
              ...(imageInput ? [{ inlineData: { data: imageInput.split(',')[1], mimeType: 'image/jpeg' } }] : [])
            ]
          },
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                translatedText: { type: Type.STRING },
                backTranslation: { type: Type.STRING },
                summary: { type: Type.ARRAY, items: { type: Type.STRING } },
                culturalNotes: { type: Type.STRING },
                culturalAnalysis: {
                  type: Type.OBJECT,
                  properties: {
                    regionalNuances: { type: Type.ARRAY, items: { type: Type.STRING } },
                    potentialMisunderstandings: { type: Type.ARRAY, items: { type: Type.STRING } },
                    tabooConsiderations: { type: Type.ARRAY, items: { type: Type.STRING } },
                    recommendedPhasing: { type: Type.STRING }
                  },
                  required: ["regionalNuances", "potentialMisunderstandings", "tabooConsiderations", "recommendedPhasing"]
                },
                jaccardScore: { type: Type.NUMBER },
                criticalRisk: { type: Type.BOOLEAN },
                panic: {
                  type: Type.OBJECT,
                  properties: {
                    score: { type: Type.NUMBER },
                    indicators: { type: Type.ARRAY, items: { type: Type.STRING } },
                    deEscalationSteps: { type: Type.ARRAY, items: { type: Type.STRING } }
                  },
                  required: ["score", "indicators", "deEscalationSteps"]
                },
                tokens: {
                  type: Type.OBJECT,
                  properties: {
                    originalEntities: { type: Type.ARRAY, items: { type: Type.STRING } },
                    backTranslatedEntities: { type: Type.ARRAY, items: { type: Type.STRING } },
                    matchedEntities: { type: Type.ARRAY, items: { type: Type.STRING } },
                    missedEntities: { type: Type.ARRAY, items: { type: Type.STRING } }
                  },
                  required: ["originalEntities", "backTranslatedEntities", "matchedEntities", "missedEntities"]
                }
              },
              required: ["translatedText", "backTranslation", "summary", "culturalNotes", "culturalAnalysis", "jaccardScore", "criticalRisk", "panic", "tokens"]
            }
          }
        });
        return response.text;
      });

      return JSON.parse(responseText);
    } catch (err: any) {
      const status = err.status;
      const message = err.message?.toLowerCase() || '';

      if (message.includes('safety')) {
        const safetyError = new Error("Clinical safety protocol violation. Content contains restricted medical patterns.");
        (safetyError as any).isTransient = false;
        throw safetyError;
      }

      if (status === 429) {
        const rateError = new Error("Linguistic node saturated. Rate limit protocol active for current project.");
        (rateError as any).isTransient = true;
        throw rateError;
      }

      if (status >= 500 || message.includes('fetch')) {
        const netError = new Error("Neural node disconnected. Network or server disruption detected.");
        (netError as any).isTransient = true;
        throw netError;
      }

      const defaultError = new Error("Unknown protocol disruption. Synthesis aborted unexpectedly after multiple retries.");
      (defaultError as any).isTransient = true;
      throw defaultError;
    }
  }

  async getWordDefinition(word: string, context: string, language: string): Promise<WordDefinition> {
    return this.withRetry(async () => {
      const response = await this.ai.models.generateContent({
        model: FLASH_MODEL,
        contents: `Clinical and regional analysis of "${word}" in context of: "${context}". Target linguistic node: ${language}.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              definition: { type: Type.STRING },
              culturalConnotation: { type: Type.STRING },
              crisisSignificance: { type: Type.STRING },
              regionalAlignment: { type: Type.STRING }
            },
            required: ["definition", "culturalConnotation", "crisisSignificance", "regionalAlignment"]
          }
        }
      });
      return JSON.parse(response.text);
    });
  }

  async generateSpeech(text: string, voiceName: string = 'Kore'): Promise<string> {
    return this.withRetry(async () => {
      const response = await this.ai.models.generateContent({
        model: TTS_MODEL,
        contents: [{ parts: [{ text: `Speak calmly as a first responder: ${text.substring(0, 1000)}` }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName } } }
        }
      });
      return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || "";
    });
  }
}
