
import React from 'react';
import { ShieldAlert, Info, HeartHandshake } from 'lucide-react';
import { PanicAnalysis } from '../types';

interface Props {
  data: PanicAnalysis;
}

const PanicAlert: React.FC<Props> = ({ data }) => {
  const isHigh = data.score > 50;

  return (
    <div className={`p-6 rounded-2xl border ${isHigh ? 'bg-orange-50 border-orange-200' : 'bg-blue-50 border-blue-100'} transition-all duration-500`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <ShieldAlert className={isHigh ? 'text-orange-600' : 'text-blue-600'} size={24} />
          <h3 className="font-bold text-lg">Panic Notice Analysis</h3>
        </div>
        <div className="flex flex-col items-end">
          <span className={`text-2xl font-black ${isHigh ? 'text-orange-600' : 'text-blue-600'}`}>
            {data.score}
          </span>
          <span className="text-xs uppercase tracking-widest font-semibold opacity-60">Panic Score</span>
        </div>
      </div>

      {isHigh && (
        <div className="space-y-4">
          <div className="p-4 bg-white/50 rounded-xl border border-orange-100">
            <div className="flex gap-2 text-orange-800 font-semibold mb-2">
              <HeartHandshake size={18} />
              <h4>Priority De-escalation Steps</h4>
            </div>
            <ul className="list-disc list-inside text-sm text-orange-700 space-y-1">
              {data.deEscalationSteps.map((step, i) => (
                <li key={i}>{step}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {!isHigh && (
        <p className="text-blue-800 text-sm flex items-center gap-2">
          <Info size={16} /> Emotional baseline aligned with operational safety.
        </p>
      )}
    </div>
  );
};

export default PanicAlert;
