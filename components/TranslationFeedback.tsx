
import React, { useState } from 'react';
import { ThumbsUp, ThumbsDown, CheckCircle, Database, ShieldCheck } from 'lucide-react';
import { FeedbackEntry, TranslationResult } from '../types';

interface Props {
  sourceText: string;
  translation: string;
  language: string;
  auditScore: number;
}

const TranslationFeedback: React.FC<Props> = ({ sourceText, translation, language, auditScore }) => {
  const [submitted, setSubmitted] = useState(false);
  const [hoverRating, setHoverRating] = useState<'positive' | 'negative' | null>(null);

  const handleFeedback = (rating: 'positive' | 'negative') => {
    const newEntry: FeedbackEntry = {
      id: crypto.randomUUID(),
      sourceText,
      translatedText: translation,
      language,
      rating,
      auditScore,
      timestamp: Date.now()
    };

    // Store in localStorage
    const existingFeedback = JSON.parse(localStorage.getItem('aura_align_feedback') || '[]');
    localStorage.setItem('aura_align_feedback', JSON.stringify([...existingFeedback, newEntry]));

    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="glass-effect p-6 rounded-3xl border border-blue-100 bg-blue-50/30 flex items-center justify-between animate-in fade-in zoom-in duration-500">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-200">
            <ShieldCheck size={20} />
          </div>
          <div>
            <h4 className="font-black text-slate-900 uppercase tracking-tighter text-sm">Feedback Logged</h4>
            <p className="text-xs text-slate-500 font-medium italic">Accuracy data stored for node optimization.</p>
          </div>
        </div>
        <div className="px-4 py-1.5 bg-white border border-blue-200 rounded-full text-[10px] font-black text-blue-600 uppercase tracking-widest">
          Audit Verified
        </div>
      </div>
    );
  }

  return (
    <div className="glass-effect p-8 rounded-[2.5rem] border border-white shadow-xl shadow-blue-100">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-950 text-white rounded-xl shadow-md">
            <Database size={18} />
          </div>
          <div>
            <h3 className="font-bold text-lg leading-tight">Linguistic Quality Control</h3>
            <p className="text-[10px] text-blue-400 font-black uppercase tracking-widest">Global Node Accuracy Check</p>
          </div>
        </div>
      </div>

      <div className="bg-blue-50/50 rounded-2xl p-6 border border-blue-100 mb-6">
        <p className="text-sm text-slate-600 font-medium mb-4 italic text-center">
          "As a medical responder, was this translation medically accurate and culturally aligned for the {language} node?"
        </p>
        
        <div className="grid grid-cols-2 gap-4">
          <button
            onMouseEnter={() => setHoverRating('positive')}
            onMouseLeave={() => setHoverRating(null)}
            onClick={() => handleFeedback('positive')}
            className="group relative flex flex-col items-center gap-3 p-6 bg-white border border-blue-100 rounded-3xl hover:border-blue-500 hover:ring-4 hover:ring-blue-50 transition-all duration-300"
          >
            <div className={`p-3 rounded-2xl transition-colors ${hoverRating === 'positive' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
              <ThumbsUp size={24} />
            </div>
            <span className="text-xs font-black uppercase tracking-widest text-slate-400 group-hover:text-blue-600">Accurate</span>
          </button>

          <button
            onMouseEnter={() => setHoverRating('negative')}
            onMouseLeave={() => setHoverRating(null)}
            onClick={() => handleFeedback('negative')}
            className="group relative flex flex-col items-center gap-3 p-6 bg-white border border-blue-100 rounded-3xl hover:border-red-500 hover:ring-4 hover:ring-red-50 transition-all duration-300"
          >
            <div className={`p-3 rounded-2xl transition-colors ${hoverRating === 'negative' ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
              <ThumbsDown size={24} />
            </div>
            <span className="text-xs font-black uppercase tracking-widest text-slate-400 group-hover:text-red-600">Drift Detected</span>
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 text-[9px] font-black text-blue-300 uppercase tracking-widest text-center justify-center">
        <Database size={10} /> Data used for future local model alignment
      </div>
    </div>
  );
};

export default TranslationFeedback;
