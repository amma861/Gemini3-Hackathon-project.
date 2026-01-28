
import React from 'react';
import { Globe, BookOpen, AlertCircle, Heart, Quote } from 'lucide-react';
import { CulturalAnalysis } from '../types';

interface Props {
  analysis: CulturalAnalysis;
  language: string;
}

const CulturalGuard: React.FC<Props> = ({ analysis, language }) => {
  return (
    <div className="p-8 rounded-[3rem] bg-white dark:bg-slate-900 border-2 border-indigo-100 dark:border-indigo-900/30 shadow-2xl relative overflow-hidden transition-all hover:shadow-indigo-100 dark:hover:shadow-none">
      <div className="absolute top-0 right-0 p-10 opacity-5">
        <Globe size={140} />
      </div>

      <div className="flex items-center gap-6 mb-10 relative z-10">
        <div className="p-4 bg-indigo-600 text-white rounded-[1.5rem] shadow-xl shadow-indigo-200 dark:shadow-none">
          <Globe size={32} />
        </div>
        <div>
          <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">Cultural Alignment Guard</h3>
          <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-[0.4em]">Node Sensitivity Calibration: {language}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
        <div className="space-y-6">
          <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
            <h4 className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-500 mb-4">
              <BookOpen size={16} /> Regional Nuances
            </h4>
            <ul className="space-y-2">
              {analysis.regionalNuances.map((n, i) => (
                <li key={i} className="text-sm font-medium text-slate-700 dark:text-slate-300 flex gap-3">
                  <div className="w-1 h-1 rounded-full bg-indigo-400 mt-2 shrink-0" />
                  {n}
                </li>
              ))}
            </ul>
          </div>

          <div className="p-6 bg-rose-50 dark:bg-rose-950/20 rounded-2xl border border-rose-100 dark:border-rose-900/30">
            <h4 className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-rose-500 mb-4">
              <AlertCircle size={16} /> Taboo Considerations
            </h4>
            <div className="flex flex-wrap gap-2">
              {analysis.tabooConsiderations.map((t, i) => (
                <span key={i} className="px-3 py-1 bg-white dark:bg-rose-900/40 text-rose-700 dark:text-rose-200 rounded-lg text-xs font-bold border border-rose-200 dark:border-rose-800">
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="p-6 bg-amber-50 dark:bg-amber-950/20 rounded-2xl border border-amber-100 dark:border-amber-900/30">
            <h4 className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-amber-600 mb-4">
              <AlertCircle size={16} /> Misunderstanding Risks
            </h4>
            <ul className="space-y-2">
              {analysis.potentialMisunderstandings.map((m, i) => (
                <li key={i} className="text-sm font-medium text-amber-900 dark:text-amber-200 flex gap-3">
                  <div className="w-1 h-1 rounded-full bg-amber-400 mt-2 shrink-0" />
                  {m}
                </li>
              ))}
            </ul>
          </div>

          <div className="p-8 bg-indigo-600 text-white rounded-[2.5rem] shadow-xl shadow-indigo-100 dark:shadow-none relative group">
            <div className="absolute top-4 right-4 opacity-20 group-hover:scale-110 transition-transform">
              <Quote size={40} />
            </div>
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] mb-4 opacity-70 flex items-center gap-2">
              <Heart size={14} /> Recommended Phrasing
            </h4>
            <p className="text-lg font-bold leading-relaxed italic tracking-tight">
              "{analysis.recommendedPhasing}"
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CulturalGuard;
