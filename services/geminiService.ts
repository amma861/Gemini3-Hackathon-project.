
import { GoogleGenAI, Type } from "@google/genai";
import { TranslationResult, PanicAnalysis, FeedbackEntry } from "../types";

const MODEL_NAME = 'gemini-3-pro-preview';
const FAST_MODEL = 'gemini-3-flash-preview';

export class GeminiService {
  constructor() {}

  private getAI() {
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  private getLearnedContext(): string {
    try {
      const feedback: FeedbackEntry[] = JSON.parse(localStorage.getItem('aura_align_feedback') || '[]');
      if (feedback.length === 0) return "";

      // Prioritize negative feedback for correction and positive for standard setting
      const negative = feedback.filter(f => f.rating === 'negative').slice(-5);
      const positive = feedback.filter(f => f.rating === 'positive').slice(-5);

      let context = "\n### CRITICAL: LEARNED KNOWLEDGE BASE (USER FEEDBACK ALIGNMENT)\n";
      context += "You must align your translation logic with the following human-verified feedback:\n";

      if (negative.length > 0) {
        context += "\n[CORRECTIONS REQUIRED - PREVIOUS DRIFT DETECTED]:\n";
        negative.forEach(f => {
          context += `- Source: "${f.sourceText}"\n  Previous Error: "${f.translatedText}"\n  Action: Improve medical accuracy and cultural alignment for this type of input.\n`;
        });
      }

      if (positive.length > 0) {
        context += "\n[VERIFIED STANDARDS - MAINTAIN THIS QUALITY]:\n";
        positive.forEach(f => {
          context += `- Source: "${f.sourceText}"\n  Correct Output: "${f.translatedText}"\n`;
        });
      }

      return context;
    } catch (e) {
      console.error("Error reading feedback context", e);
      return "";
    }
  }

  async processMedicalDocument(
    textInput: string,
    targetLanguage: string = "Igbo",
    imageInput?: string
  ): Promise<TranslationResult> {
    const ai = this.getAI();
    const learnedContext = this.getLearnedContext();

    const prompt = `
      Perform a high-stakes medical analysis and translation for the Aura-Align Global South Node.
      
      TARGET LANGUAGE: ${targetLanguage}
      ${learnedContext}
      
      STEP 1: PANIC NOTICE
      Analyze the emotional state. Provide a panic score (0-100), key indicators, and de-escalation protocol.
      
      STEP 2: MULTIMODAL MEDICAL ENTITY EXTRACTION
      Identify every critical medical entity: Medications, Dosages, Conditions, Vital Signs, and Procedures.
      
      STEP 3: UNIVERSAL TRANSLATION LOOP (Phase 1: Translation)
      Translate the source into high-fidelity medical ${targetLanguage}. 
      Ensure cultural alignment and accessibility. Refer to the LEARNED KNOWLEDGE BASE above for stylistic and accuracy alignment.
      
      STEP 4: UNIVERSAL TRANSLATION LOOP (Phase 2: Back-Translation Audit)
      Translate your ${targetLanguage} output back to English.
      Extract medical entities from this back-translation.
      
      STEP 5: SUMMARY & CULTURAL GUARD
      Provide a 3-bullet patient summary and cultural context notes.
      
      SOURCE:
      ${textInput}
    `;

    const parts: any[] = [{ text: prompt }];
    if (imageInput) {
      parts.push({
        inlineData: {
          data: imageInput.split(',')[1],
          mimeType: 'image/jpeg'
        }
      });
    }

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: { parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            panic: {
              type: Type.OBJECT,
              properties: {
                score: { type: Type.NUMBER },
                indicators: { type: Type.ARRAY, items: { type: Type.STRING } },
                deEscalationSteps: { type: Type.ARRAY, items: { type: Type.STRING } }
              },
              required: ["score", "indicators", "deEscalationSteps"]
            },
            originalMedicalEntities: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            backTranslatedMedicalEntities: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            translation: { type: Type.STRING },
            backTranslation: { type: Type.STRING },
            summary: { type: Type.ARRAY, items: { type: Type.STRING } },
            culturalNotes: { type: Type.STRING }
          },
          required: ["panic", "originalMedicalEntities", "backTranslatedMedicalEntities", "translation", "backTranslation", "summary", "culturalNotes"]
        }
      }
    });

    const result = JSON.parse(response.text.trim()) as any;
    
    const originalSet = new Set((result.originalMedicalEntities as string[]).map((s: string) => s.toLowerCase().trim()));
    const backSet = new Set((result.backTranslatedMedicalEntities as string[]).map((s: string) => s.toLowerCase().trim()));
    const matched = [...originalSet].filter(x => backSet.has(x));
    const missed = [...originalSet].filter(x => !backSet.has(x));
    const union = new Set([...originalSet, ...backSet]);
    const jaccardScore = union.size === 0 ? 1 : matched.length / union.size;

    return {
      igboTranslation: result.translation,
      backTranslation: result.backTranslation,
      summary: result.summary,
      culturalNotes: result.culturalNotes,
      jaccardScore,
      criticalRisk: jaccardScore < 0.7,
      panic: result.panic,
      tokens: {
        originalEntities: result.originalMedicalEntities as string[],
        backTranslatedEntities: result.backTranslatedMedicalEntities as string[],
        matchedEntities: matched,
        missedEntities: missed
      }
    };
  }

  async getWordDefinition(word: string, context: string, sourceLang: string) {
    const ai = this.getAI();
    const prompt = `
      Provide a medical definition for the word "${word}" within the context of this medical text: "${context}".
      The word is currently in ${sourceLang}.
      
      Format the response in JSON:
      {
        "definition": "Simple medical explanation",
        "crisisSignificance": "Why this word matters in an emergency",
        "globalTranslations": {
          "Spanish": "translation",
          "French": "translation",
          "Arabic": "translation"
        }
      }
    `;

    const response = await ai.models.generateContent({
      model: FAST_MODEL,
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });

    return JSON.parse(response.text.trim());
  }
}
