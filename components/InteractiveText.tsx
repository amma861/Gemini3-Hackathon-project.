
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { GeminiService } from '../services/geminiService';
import { WordDefinition } from '../types';
import { Loader2, Info, Heart, Sparkles, AlertCircle, MapPin, Globe } from 'lucide-react';

interface Props {
  text: string;
  language: string;
}

const definitionCache = new Map<string, WordDefinition>();

const InteractiveText: React.FC<Props> = ({ text, language }) => {
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [definition, setDefinition] = useState<WordDefinition | null>(null);
  const [loading, setLoading] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);
  
  const hoverTimeoutRef = useRef<number | null>(null);
  const hideTimeoutRef = useRef<number | null>(null);
  const gemini = useMemo(() => new GeminiService(), []);

  const triggerDefinition = async (e: React.MouseEvent | React.TouchEvent, word: string) => {
    const cleanWord = word.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "").trim();
    if (!cleanWord || cleanWord.length < 2) return;

    if (hideTimeoutRef.current) window.clearTimeout(hideTimeoutRef.current);
    
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = rect.left;
    const y = rect.top + window.scrollY;

    if (hoverTimeoutRef.current) window.clearTimeout(hoverTimeoutRef.current);

    const cacheKey = `${language}:${cleanWord.toLowerCase()}`;
    
    setSelectedWord(cleanWord);
    setPosition({ x, y });
    setIsVisible(true);

    if (definitionCache.has(cacheKey)) {
      setDefinition(definitionCache.get(cacheKey)!);
      setLoading(false);
    } else {
      setLoading(true);
      try {
        const data = await gemini.getWordDefinition(cleanWord, text, language);
        definitionCache.set(cacheKey, data);
        setDefinition(data);
      } catch (err) {
        setIsVisible(false);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleMouseEnter = (e: React.MouseEvent, word: string) => {
    hoverTimeoutRef.current = window.setTimeout(() => triggerDefinition(e, word), 100);
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) window.clearTimeout(hoverTimeoutRef.current);
    hideTimeoutRef.current = window.setTimeout(() => {
      setIsVisible(false);
      setSelectedWord(null);
    }, 400);
  };

  const handleClick = (e: React.MouseEvent, word: string) => {
    if (hideTimeoutRef.current) window.clearTimeout(hideTimeoutRef.current);
    triggerDefinition(e, word);
  };

  const words = text.split(/\s+/);

  return (
    <div className="relative">
      <p className="text-3xl md:text-4xl font-medium leading-[1.8] text-slate-800 dark:text-slate-200 tracking-tight">
        {words.map((word, i) => (
          <span
            key={i}
            onMouseEnter={(e) => handleMouseEnter(e, word)}
            onMouseLeave={handleMouseLeave}
            onClick={(e) => handleClick(e, word)}
            className={`word-hover cursor-help px-1 rounded-lg inline-block decoration-teal-500/20 underline underline-offset-8 decoration-2 transition-all duration-200 ${
              selectedWord === word.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "").trim() && isVisible 
              ? 'text-teal-600 dark:text-teal-400 bg-teal-50/80 dark:bg-teal-900/40 decoration-teal-500 shadow-sm scale-105' 
              : 'hover:text-teal-600 dark:hover:text-teal-400 hover:bg-teal-50/50 dark:hover:bg-teal-900/20'
            }`}
          >
            {word}{' '}
          </span>
        ))}
      </p>

      {isVisible && selectedWord && (
        <div 
          className="fixed z-[500] animate-in fade-in zoom-in slide-in-from-top-2 duration-200 pointer-events-auto"
          style={{ 
            left: `${Math.max(10, Math.min(position.x - 20, window.innerWidth - 390))}px`,
            top: `${position.y - window.scrollY + 60}px`,
            width: 'min(380px, 95vw)'
          }}
          onMouseEnter={() => {
            if (hideTimeoutRef.current) window.clearTimeout(hideTimeoutRef.current);
          }}
          onMouseLeave={handleMouseLeave}
        >
          <div className="glass-effect rounded-[3rem] shadow-[0_40px_100px_rgba(0,0,0,0.25)] border-white dark:border-slate-800 p-8 bg-white/98 dark:bg-slate-950/98 relative overflow-hidden backdrop-blur-3xl">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-teal-500 via-indigo-500 to-rose-500" />
            
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="p-2.5 bg-gradient-to-br from-teal-500 to-teal-700 text-white rounded-2xl shadow-lg">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-tighter text-[11px]">Clinical Intelligence</h4>
                  <p className="text-[9px] font-bold text-teal-600 dark:text-teal-400 uppercase tracking-widest">{selectedWord}</p>
                </div>
              </div>
              {definition && !loading && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl border border-indigo-100 dark:border-indigo-800">
                  <MapPin size={12} className="text-indigo-600 dark:text-indigo-400" />
                  <span className="text-[9px] font-black text-indigo-700 dark:text-indigo-300 uppercase tracking-widest">{definition.regionalAlignment.split(' ')[0]}</span>
                </div>
              )}
            </div>

            {loading ? (
              <div className="py-12 flex flex-col items-center gap-6">
                <div className="relative">
                  <div className="absolute -inset-4 bg-teal-500/10 rounded-full animate-ping" />
                  <Loader2 className="animate-spin text-teal-600 relative z-10" size={40} />
                </div>
                <span className="text-[10px] font-black text-teal-500 uppercase tracking-[0.4em] animate-pulse">Neural Node Accessing...</span>
              </div>
            ) : definition ? (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="p-6 bg-slate-50/50 dark:bg-slate-900/50 rounded-[2rem] border border-slate-100 dark:border-slate-800">
                  <div className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2 mb-3">
                    <Info size={14} /> Medical Analysis
                  </div>
                  <p className="text-lg text-slate-900 dark:text-slate-100 font-bold leading-relaxed">
                    {definition.definition}
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div className="p-6 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-[2rem] border-2 border-indigo-100/50 dark:border-indigo-900/30">
                    <div className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest flex items-center gap-2 mb-3">
                      <Globe size={14} /> Regional Alignment
                    </div>
                    <p className="text-sm text-indigo-900 dark:text-indigo-200 font-bold leading-relaxed">
                      {definition.regionalAlignment}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-5 bg-rose-50/50 dark:bg-rose-950/20 rounded-2xl border border-rose-100/50 dark:border-rose-900/30">
                    <div className="text-[9px] font-black text-rose-500 uppercase mb-2 tracking-widest flex items-center gap-1.5">
                      <Heart size={10} fill="currentColor" /> Connotation
                    </div>
                    <p className="text-[11px] text-rose-900 dark:text-rose-200 font-bold leading-tight italic">"{definition.culturalConnotation}"</p>
                  </div>
                  <div className="p-5 bg-amber-50/50 dark:bg-amber-950/20 rounded-2xl border border-amber-100/50 dark:border-amber-900/30">
                    <div className="text-[9px] font-black text-amber-600 uppercase mb-2 tracking-widest flex items-center gap-1.5">
                      <AlertCircle size={10} /> Crisis Impact
                    </div>
                    <p className="text-[11px] text-amber-900 dark:text-amber-200 font-bold leading-tight uppercase tracking-tight">{definition.crisisSignificance}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6 bg-rose-50 dark:bg-rose-950/20 rounded-2xl flex items-center gap-4 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30">
                <AlertCircle size={24} />
                <span className="text-sm font-black uppercase tracking-tight">Linguistic Node Synthesis Failure</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default InteractiveText;
