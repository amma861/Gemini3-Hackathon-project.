
import React, { useState, useMemo } from 'react';
import { AlertTriangle, CheckCircle2, Search, ChevronDown, ChevronUp, Beaker, Terminal, Layers, Info, RefreshCw, ShieldCheck, XCircle, Activity, Fingerprint, Microscope, ListFilter } from 'lucide-react';
import { MedicalTokens } from '../types';

interface Props {
  score: number;
  isRisk: boolean;
  tokens: MedicalTokens;
}

const LinguisticAudit: React.FC<Props> = ({ score, isRisk, tokens }) => {
  const [showDetails, setShowDetails] = useState(false);
  const [testActive, setTestActive] = useState(false);

  const auditTest = useMemo(() => {
    const setA = new Set(tokens.originalEntities.map(t => t.toLowerCase().trim()));
    const setB = new Set(tokens.backTranslatedEntities.map(t => t.toLowerCase().trim()));
    
    const intersection = new Set([...setA].filter(x => setB.has(x)));
    const union = new Set([...setA, ...setB]);
    
    const calculatedScore = union.size === 0 ? 0 : intersection.size / union.size;
    const matchesAI = Math.abs(calculatedScore - score) < 0.05;

    const originalWithStatus = tokens.originalEntities.map(t => ({
      text: t,
      isMatched: setB.has(t.toLowerCase().trim())
    }));

    const backTranslatedWithStatus = tokens.backTranslatedEntities.map(t => ({
      text: t,
      isMatched: setA.has(t.toLowerCase().trim())
    }));

    return {
      intersection: Array.from(intersection),
      unionSize: union.size,
      intersectionSize: intersection.size,
      calculatedScore,
      matchesAI,
      originalWithStatus,
      backTranslatedWithStatus,
      matchedCount: intersection.size,
      missingCount: tokens.originalEntities.length - intersection.size,
      hallucinatedCount: tokens.backTranslatedEntities.length - intersection.size
    };
  }, [tokens, score]);

  const runTest = () => {
    setTestActive(true);
    setTimeout(() => setTestActive(false), 2000);
  };

  return (
    <div className={`p-8 rounded-[2.5rem] border-2 transition-all duration-700 relative overflow-hidden ${isRisk ? 'bg-white border-rose-200 shadow-xl shadow-rose-100 dark:shadow-rose-950/20 dark:bg-slate-900/50 dark:border-rose-900/30' : 'bg-indigo-50 dark:bg-indigo-950/10 border-indigo-200 dark:border-indigo-900/30'}`}>
      <div className="absolute top-0 right-0 p-8 opacity-5 dark:opacity-10">
        <Microscope size={120} />
      </div>

      <div className="flex items-center justify-between mb-8 relative z-10">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-2xl ${isRisk ? 'bg-rose-500 text-white animate-pulse' : 'bg-indigo-600 text-white'}`}>
            <Fingerprint size={28} />
          </div>
          <div>
            <h3 className="font-black text-xl text-slate-900 dark:text-slate-100">Jaccard Audit Core</h3>
            <p className="text-[10px] font-bold uppercase tracking-widest opacity-40 dark:opacity-60">Linguistic Integrity Test</p>
          </div>
        </div>
        <div className="text-right">
          <div className={`text-4xl font-black ${isRisk ? 'text-rose-600 dark:text-rose-400' : 'text-indigo-600 dark:text-indigo-400'}`}>
            {(score * 100).toFixed(1)}%
          </div>
          <div className="text-[10px] font-black uppercase tracking-widest opacity-50">Similarity Index</div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 relative z-10">
        {isRisk ? (
          <div className="flex items-center gap-4 p-5 bg-rose-500 text-white rounded-[1.5rem] shadow-lg shadow-rose-200 dark:shadow-none animate-neural-pulse">
            <AlertTriangle size={24} className="shrink-0" />
            <div>
              <div className="font-black text-xs uppercase tracking-widest">Protocol Failure: Linguistic Drift</div>
              <div className="text-[11px] opacity-90 font-bold leading-tight mt-1 uppercase">Critical entities vanished in translation. Manual node verification required.</div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-4 p-5 bg-indigo-600 text-white rounded-[1.5rem] shadow-lg shadow-indigo-200 dark:shadow-none">
            <CheckCircle2 size={24} className="shrink-0" />
            <div>
              <div className="font-black text-xs uppercase tracking-widest">Linguistic Safe-Zone</div>
              <div className="text-[11px] opacity-90 font-bold leading-tight mt-1 uppercase">Entity preservation confirmed via neural back-propagation.</div>
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <button 
            onClick={() => setShowDetails(!showDetails)}
            className="flex-1 flex items-center justify-between px-6 py-4 bg-white/50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all group"
          >
            <span className="flex items-center gap-2">
              <ListFilter size={14} className="group-hover:rotate-12 transition-transform" /> 
              {showDetails ? 'Conceal Test Matrix' : 'Expose Token Matrix'}
            </span>
            {showDetails ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          
          <button 
            onClick={runTest}
            className={`px-6 py-4 rounded-2xl border-2 transition-all font-black text-[10px] uppercase tracking-widest flex items-center gap-2 ${testActive ? 'bg-teal-500 border-teal-500 text-white scale-105 shadow-lg' : 'bg-white dark:bg-slate-900 border-indigo-100 dark:border-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:border-indigo-400'}`}
          >
            {testActive ? <RefreshCw className="animate-spin" size={14} /> : <Beaker size={14} />}
            {testActive ? 'Calculating...' : 'Run Similarity Test'}
          </button>
        </div>
      </div>

      {showDetails && (
        <div className="mt-8 space-y-8 animate-in slide-in-from-top-4 duration-500 relative z-10">
          {/* Mathematical Proof Box */}
          <div className="p-8 bg-slate-950 rounded-[2rem] border border-slate-800 text-indigo-400 font-mono shadow-inner">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Terminal size={16} />
                <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Jaccard Mathematical Proof</span>
              </div>
              {auditTest.matchesAI && (
                <div className="flex items-center gap-2 text-teal-400 text-[9px] font-black uppercase">
                  <ShieldCheck size={12} /> Model Verification Passed
                </div>
              )}
            </div>
            
            <div className="flex flex-wrap items-center gap-4 text-sm font-black border-b border-slate-800 pb-6 mb-6">
              <span className="text-slate-500">J(A, B) =</span>
              <div className="flex flex-col items-center">
                <span className="border-b border-indigo-400/30 px-4">| A ∩ B |</span>
                <span className="px-4">| A ∪ B |</span>
              </div>
              <span className="text-slate-500">=</span>
              <div className="flex flex-col items-center">
                <span className="border-b border-indigo-400/30 px-4">{auditTest.intersectionSize}</span>
                <span className="px-4">{auditTest.unionSize}</span>
              </div>
              <span className="text-white">≈ {auditTest.calculatedScore.toFixed(3)}</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Set A Column */}
              <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                  <div className="flex items-center gap-2">
                    <Activity size={14} className="text-indigo-400" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Set A: Source Entities ({tokens.originalEntities.length})</span>
                  </div>
                  <div className="flex gap-2">
                     <span className="text-[8px] font-black px-1.5 py-0.5 bg-teal-500/10 text-teal-400 rounded">OK: {auditTest.matchedCount}</span>
                     <span className="text-[8px] font-black px-1.5 py-0.5 bg-rose-500/10 text-rose-400 rounded">MISSING: {auditTest.missingCount}</span>
                  </div>
                </div>
                <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  {auditTest.originalWithStatus.map((entity, i) => (
                    <div 
                      key={i} 
                      className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${
                        entity.isMatched 
                        ? 'border-indigo-500/20 bg-indigo-500/5 text-indigo-100' 
                        : 'border-rose-900/40 bg-rose-950/40 text-rose-300'
                      }`}
                    >
                      <span className="text-xs font-bold truncate">{entity.text}</span>
                      <div className="flex items-center gap-2">
                        {entity.isMatched ? (
                          <>
                            <span className="text-[8px] font-black uppercase tracking-tighter opacity-60">PRESERVED</span>
                            <CheckCircle2 size={12} className="text-teal-400" />
                          </>
                        ) : (
                          <>
                            <span className="text-[8px] font-black uppercase tracking-tighter opacity-60">MISSING</span>
                            <XCircle size={12} className="text-rose-500" />
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Set B Column */}
              <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                  <div className="flex items-center gap-2">
                    <RefreshCw size={14} className="text-teal-400" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Set B: Neural Feedback ({tokens.backTranslatedEntities.length})</span>
                  </div>
                  <div className="flex gap-2">
                     <span className="text-[8px] font-black px-1.5 py-0.5 bg-indigo-500/10 text-indigo-400 rounded">VERIFIED: {auditTest.matchedCount}</span>
                     <span className="text-[8px] font-black px-1.5 py-0.5 bg-amber-500/10 text-amber-400 rounded">ANOMALY: {auditTest.hallucinatedCount}</span>
                  </div>
                </div>
                <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  {auditTest.backTranslatedWithStatus.map((entity, i) => (
                    <div 
                      key={i} 
                      className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${
                        entity.isMatched 
                        ? 'border-teal-500/20 bg-teal-500/5 text-teal-100' 
                        : 'border-amber-900/40 bg-amber-950/40 text-amber-300'
                      }`}
                    >
                      <span className="text-xs font-bold truncate">{entity.text}</span>
                      <div className="flex items-center gap-2">
                        {entity.isMatched ? (
                          <>
                            <span className="text-[8px] font-black uppercase tracking-tighter opacity-60">VERIFIED</span>
                            <ShieldCheck size={12} className="text-teal-400" />
                          </>
                        ) : (
                          <>
                            <span className="text-[8px] font-black uppercase tracking-tighter opacity-60">ANOMALY</span>
                            <Info size={12} className="text-amber-500" />
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-6 bg-white/60 dark:bg-slate-900/60 rounded-[1.5rem] border border-slate-100 dark:border-slate-800">
              <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                <CheckCircle2 size={14} /> Entity Sync Confirmation
              </h4>
              <div className="flex flex-wrap gap-2">
                {tokens.matchedEntities.map((e, i) => (
                  <span key={i} className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-xl text-xs font-bold border border-indigo-100 dark:border-indigo-800">{e}</span>
                ))}
                {tokens.matchedEntities.length === 0 && <span className="text-xs text-slate-300 italic">No shared nodes identified.</span>}
              </div>
            </div>

            <div className="p-6 bg-rose-50/60 dark:bg-rose-950/20 rounded-[1.5rem] border border-rose-100 dark:border-rose-900/30">
              <h4 className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                <AlertTriangle size={14} /> Entity Context Degradation
              </h4>
              <div className="flex flex-wrap gap-2">
                {tokens.missedEntities.map((e, i) => (
                  <span key={i} className="px-3 py-1 bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-200 rounded-xl text-xs font-bold border border-rose-200 dark:border-rose-800">{e}</span>
                ))}
                {tokens.missedEntities.length === 0 && <span className="text-xs text-teal-600 dark:text-teal-400 font-bold flex items-center gap-1"><ShieldCheck size={12} /> Zero linguistic drift detected.</span>}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-800/30 text-indigo-600 dark:text-indigo-400">
             <Info size={16} className="shrink-0" />
             <p className="text-[10px] font-bold uppercase tracking-widest leading-relaxed">This audit exposes the entity mismatch between the source document and the neural back-translation. "MISSING" items in Set A represent clinical data lost during synchronization. "ANOMALY" items in Set B represent potential hallucinations or contextual drift introduced by the model.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default LinguisticAudit;
