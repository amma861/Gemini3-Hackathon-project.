
import React from 'react';
import { ShieldAlert, Zap, CheckCircle2 } from 'lucide-react';
import { PanicAnalysis } from '../types';

interface Props {
  data: PanicAnalysis;
}

const PanicAlert: React.FC<Props> = ({ data }) => {
  const isHigh = data.score > 50;

  return (
    <div className={`p-8 rounded-[2.5rem] border-2 transition-all duration-700 relative overflow-hidden ${isHigh ? 'bg-rose-50 dark:bg-rose-950/10 border-rose-200 dark:border-rose-900/30 shadow-xl shadow-rose-100 dark:shadow-rose-950/20' : 'bg-teal-50 dark:bg-teal-950/10 border-teal-200 dark:border-teal-900/30'}`}>
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-2xl ${isHigh ? 'bg-rose-500 text-white animate-pulse' : 'bg-teal-500 text-white'}`}>
            <ShieldAlert size={28} />
          </div>
          <div>
            <h3 className="font-black text-xl text-slate-900 dark:text-slate-100">Psychological Node</h3>
            <p className="text-[10px] font-bold uppercase tracking-widest opacity-40 dark:opacity-60">Triage Sentiment Scan</p>
          </div>
        </div>
        <div className="text-right">
          <div className={`text-4xl font-black ${isHigh ? 'text-rose-600 dark:text-rose-400' : 'text-teal-600 dark:text-teal-400'}`}>
            {data.score}
          </div>
          <div className="text-[10px] font-black uppercase tracking-widest opacity-50">Vulnerability Index</div>
        </div>
      </div>

      {isHigh && (
        <div className="space-y-6">
          <div className="p-6 bg-white/60 dark:bg-slate-900/60 rounded-[2rem] border border-rose-100 dark:border-rose-900/30">
            <div className="flex items-center gap-3 text-rose-700 dark:text-rose-400 font-black text-xs uppercase tracking-widest mb-4">
              <Zap size={16} fill="currentColor" />
              <h4>De-escalation Directives</h4>
            </div>
            <ul className="space-y-3">
              {data.deEscalationSteps.map((step, i) => (
                <li key={i} className="flex gap-4 items-start text-sm text-rose-800 dark:text-rose-300 font-medium">
                  <div className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0" />
                  {step}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {!isHigh && (
        <div className="flex items-center gap-3 text-teal-800 dark:text-teal-300 p-4 bg-white/40 dark:bg-slate-900/40 rounded-2xl border border-teal-100 dark:border-teal-900/30 font-bold text-sm">
          <CheckCircle2 className="text-teal-500 dark:text-teal-400" size={20} />
          Patient psychological state aligned for procedure.
        </div>
      )}
    </div>
  );
};

export default PanicAlert;
