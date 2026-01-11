
import React from 'react';
import { Smartphone, Monitor, ChevronRight, X, ShieldCheck, Info } from 'lucide-react';

interface Props {
  onClose: () => void;
}

const MicrophoneGuide: React.FC<Props> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
        <div className="bg-blue-600 p-6 flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <ShieldCheck className="text-white" size={24} />
            <h3 className="font-bold text-lg">Permission Protocol</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
          <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex gap-4">
            <Info className="text-blue-600 shrink-0" size={24} />
            <p className="text-sm text-blue-800 leading-relaxed italic">
              "To act as your health guard in real-time, Aura-Align requires microphone access. Your privacy is protected by encrypted end-to-end sessions."
            </p>
          </div>

          <section className="space-y-4">
            <div className="flex items-center gap-2 text-slate-900 font-bold">
              <Monitor size={20} className="text-blue-400" />
              <h4>Web Browser (Chrome/Safari/Edge)</h4>
            </div>
            <ol className="space-y-3 text-sm text-slate-600">
              <li className="flex gap-3 items-start">
                <span className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center text-[10px] font-black text-blue-600 shrink-0 mt-0.5">1</span>
                <span>Look for the <strong>lock icon</strong> or <strong>settings slider</strong> next to the URL in your browser's address bar.</span>
              </li>
              <li className="flex gap-3 items-start">
                <span className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center text-[10px] font-black text-blue-600 shrink-0 mt-0.5">2</span>
                <span>Ensure the "Microphone" toggle is set to <strong>Allow</strong>.</span>
              </li>
              <li className="flex gap-3 items-start">
                <span className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center text-[10px] font-black text-blue-600 shrink-0 mt-0.5">3</span>
                <span>Refresh the page if the prompt does not reappear automatically.</span>
              </li>
            </ol>
          </section>

          <hr className="border-blue-50" />

          <section className="space-y-4">
            <div className="flex items-center gap-2 text-slate-900 font-bold">
              <Smartphone size={20} className="text-blue-400" />
              <h4>Mobile Devices (iOS & Android)</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100">
                <h5 className="text-xs font-black uppercase tracking-widest text-blue-400 mb-2">iOS (iPhone)</h5>
                <p className="text-xs leading-relaxed">Settings > Privacy & Security > Microphone > Toggle 'Browser' to ON.</p>
              </div>
              <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100">
                <h5 className="text-xs font-black uppercase tracking-widest text-blue-400 mb-2">Android</h5>
                <p className="text-xs leading-relaxed">Settings > Apps > Browser > Permissions > Microphone > Select 'Allow only while using the app'.</p>
              </div>
            </div>
          </section>
        </div>

        <div className="p-6 bg-blue-50 border-t border-blue-100">
          <button 
            onClick={onClose}
            className="w-full py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
          >
            Acknowledge & Continue
          </button>
        </div>
      </div>
    </div>
  );
};

export default MicrophoneGuide;
