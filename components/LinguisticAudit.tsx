
import React, { useState } from 'react';
import { AlertTriangle, CheckCircle2, Search, ChevronDown, ChevronUp, FileCode } from 'lucide-react';
import { MedicalTokens } from '../types';

interface Props {
  score: number;
  isRisk: boolean;
  tokens: MedicalTokens;
}

const LinguisticAudit: React.FC<Props> = ({ score, isRisk, tokens }) => {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className={`rounded-2xl border transition-all duration-500 overflow-hidden ${isRisk ? 'bg-white border-red-200 shadow-xl shadow-red-100' : 'bg-blue-50 border-blue-200'}`}>
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Search size={20} className={isRisk ? 'text-red-600' : 'text-blue-600'} />
              <h3 className="font-bold text-lg">Universal Translation Audit</h3>
            </div>
            <p className="text-sm opacity-80 mb-4">
              Jaccard Index: (Original ∩ Back) / (Original ∪ Back)
            </p>
          </div>
          <div className="text-right">
            <div className={`text-3xl font-black ${isRisk ? 'text-red-600' : 'text-blue-600'}`}>
              {(score * 100).toFixed(1)}%
            </div>
            <div className="text-[10px] font-bold uppercase tracking-widest opacity-60">Safety Score</div>
          </div>
        </div>

        {isRisk ? (
          <div className="flex items-center gap-3 p-4 bg-red-600 text-white rounded-xl shadow-lg shadow-red-200 animate-pulse">
            <AlertTriangle size={24} className="shrink-0" />
            <div>
              <div className="font-bold">CRITICAL LINGUISTIC RISK</div>
              <div className="text-xs opacity-90 font-medium">Medical token divergence detected. Manual verification mandated.</div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 p-4 bg-blue-600 text-white rounded-xl shadow-md">
            <CheckCircle2 size={24} className="shrink-0" />
            <div>
              <div className="font-bold">SAFE LINGUISTIC ALIGNMENT</div>
              <div className="text-xs opacity-90 font-medium">All critical medical entities successfully verified.</div>
            </div>
          </div>
        )}

        <button 
          onClick={() => setShowDetails(!showDetails)}
          className="mt-4 w-full flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-blue-400 hover:text-blue-600 transition-colors"
        >
          {showDetails ? 'Hide Token Breakdown' : 'View Audit Breakdown'}
          {showDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {showDetails && (
        <div className="px-6 pb-6 pt-2 bg-white/40 border-t border-white/50 space-y-4 animate-in slide-in-from-top-2 duration-300">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="text-[9px] font-black text-blue-400 uppercase tracking-widest">Original Entities</h4>
              <div className="flex flex-wrap gap-1">
                {tokens.originalEntities.map((e, i) => (
                  <span key={i} className="px-2 py-1 bg-white border border-blue-50 rounded text-[10px] text-blue-800 font-medium">{e}</span>
                ))}
                {tokens.originalEntities.length === 0 && <span className="text-[10px] text-slate-300 italic">None detected</span>}
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="text-[9px] font-black text-blue-400 uppercase tracking-widest">Back-Translated</h4>
              <div className="flex flex-wrap gap-1">
                {tokens.backTranslatedEntities.map((e, i) => (
                  <span key={i} className="px-2 py-1 bg-white border border-blue-50 rounded text-[10px] text-blue-800 font-medium">{e}</span>
                ))}
              </div>
            </div>
          </div>

          <div className="p-3 bg-white/60 rounded-xl border border-white">
            <h4 className="text-[9px] font-black text-blue-600 uppercase tracking-widest mb-2 flex items-center gap-1">
              <CheckCircle2 size={10} /> Validated Intersection
            </h4>
            <div className="flex flex-wrap gap-1">
              {tokens.matchedEntities.map((e, i) => (
                <span key={i} className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px] font-bold">{e}</span>
              ))}
              {tokens.matchedEntities.length === 0 && <span className="text-[10px] text-slate-300 italic">No overlap found</span>}
            </div>
          </div>

          {tokens.missedEntities.length > 0 && (
            <div className="p-3 bg-red-50/60 rounded-xl border border-red-100">
              <h4 className="text-[9px] font-black text-red-600 uppercase tracking-widest mb-2 flex items-center gap-1">
                <AlertTriangle size={10} /> Discrepancies (Linguistic Drift)
              </h4>
              <div className="flex flex-wrap gap-1">
                {tokens.missedEntities.map((e, i) => (
                  <span key={i} className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-[10px] font-bold">{e}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LinguisticAudit;
