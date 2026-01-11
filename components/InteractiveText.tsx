
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { GeminiService } from '../services/geminiService';
import { Loader2, Info, X, ShieldCheck, Zap } from 'lucide-react';

interface Props {
  text: string;
  language: string;
}

// Simple in-memory cache for word definitions to prevent redundant API calls
const definitionCache = new Map<string, any>();

const InteractiveText: React.FC<Props> = ({ text, language }) => {
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [definition, setDefinition] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);
  
  const hoverTimeoutRef = useRef<number | null>(null);
  const hideTimeoutRef = useRef<number | null>(null);
  const gemini = useMemo(() => new GeminiService(), []);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) window.clearTimeout(hoverTimeoutRef.current);
      if (hideTimeoutRef.current) window.clearTimeout(hideTimeoutRef.current);
    };
  }, []);

  const handleMouseEnter = (e: React.MouseEvent, word: string) => {
    const cleanWord = word.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "").trim();
    if (!cleanWord || cleanWord.length < 2) return;

    if (hideTimeoutRef.current) window.clearTimeout(hideTimeoutRef.current);
    
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    const x = rect.left;
    const y = rect.top + window.scrollY;

    if (hoverTimeoutRef.current) window.clearTimeout(hoverTimeoutRef.current);

    hoverTimeoutRef.current = window.setTimeout(async () => {
      // Key includes language to ensure correct context if user switches nodes
      const cacheKey = `${language}:${cleanWord.toLowerCase()}`;
      
      if (cleanWord !== selectedWord || !isVisible) {
        setSelectedWord(cleanWord);
        setPosition({ x, y });
        setIsVisible(true);

        if (definitionCache.has(cacheKey)) {
          setDefinition(definitionCache.get(cacheKey));
          setLoading(false);
        } else {
          setLoading(true);
          setDefinition(null);
          try {
            const data = await gemini.getWordDefinition(cleanWord, text, language);
            definitionCache.set(cacheKey, data);
            setDefinition(data);
          } catch (err) {
            console.error("Failed to fetch definition", err);
            setIsVisible(false);
          } finally {
            setLoading(false);
          }
        }
      }
    }, 300); // Optimized debounce for medical responsiveness
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) window.clearTimeout(hoverTimeoutRef.current);
    
    // Grace period to allow user to move mouse into the tooltip
    hideTimeoutRef.current = window.setTimeout(() => {
      setIsVisible(false);
      setSelectedWord(null);
      setDefinition(null);
    }, 400);
  };

  const handleTooltipEnter = () => {
    if (hideTimeoutRef.current) window.clearTimeout(hideTimeoutRef.current);
  };

  const words = text.split(/\s+/);

  return (
    <div className="relative">
      <p className="font-clinical text-xl font-medium leading-[1.9] text-slate-900">
        {words.map((word, i) => (
          <span
            key={i}
            onMouseEnter={(e) => handleMouseEnter(e, word)}
            onMouseLeave={handleMouseLeave}
            className={`cursor-help transition-all duration-200 px-0.5 rounded inline-block decoration-2 underline-offset-4 ${
              selectedWord === word.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "").trim() && isVisible 
              ? 'text-blue-600 bg-blue-50 underline decoration-blue-300' 
              : 'hover:text-blue-600 hover:bg-blue-50/50'
            }`}
          >
            {word}{' '}
          </span>
        ))}
      </p>

      {isVisible && selectedWord && (
        <div 
          className="absolute z-[100] animate-in fade-in zoom-in slide-in-from-top-2 duration-200 pointer-events-auto"
          onMouseEnter={handleTooltipEnter}
          onMouseLeave={handleMouseLeave}
          style={{ 
            left: `${Math.max(10, Math.min(position.x - 40, window.innerWidth - 340))}px`,
            top: `${position.y - window.scrollY + 35}px`,
            width: '320px'
          }}
        >
          <div className="glass-effect rounded-[2rem] shadow-2xl border border-blue-100 p-6 overflow-hidden bg-white/98 ring-1 ring-blue-50">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-200">
                  <Info size={14} />
                </div>
                <h4 className="font-black text-slate-900 uppercase tracking-tighter text-xs">Medical Insight: {selectedWord}</h4>
              </div>
              {!loading && definition && (
                <div className="flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full text-[8px] font-black uppercase tracking-widest border border-emerald-100">
                  <ShieldCheck size={10} /> Verified
                </div>
              )}
            </div>

            {loading ? (
              <div className="py-10 flex flex-col items-center gap-4">
                <div className="relative">
                  <Loader2 className="animate-spin text-blue-600" size={32} />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Zap size={12} className="text-blue-400 animate-pulse" />
                  </div>
                </div>
                <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest animate-pulse">Analyzing Bio-Context...</span>
              </div>
            ) : definition ? (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-1 duration-300">
                <div>
                  <div className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                    <div className="w-1 h-1 rounded-full bg-blue-400" /> Clinical Meaning
                  </div>
                  <p className="text-sm text-slate-700 font-medium leading-relaxed">{definition.definition}</p>
                </div>

                <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100 shadow-inner group">
                  <div className="text-[9px] font-black text-blue-600 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                    <ShieldCheck size={10} /> Emergency Priority
                  </div>
                  <p className="text-xs text-blue-900 italic font-bold leading-tight group-hover:text-blue-700 transition-colors">
                    "{definition.crisisSignificance}"
                  </p>
                </div>

                <div>
                  <div className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                    <div className="w-1 h-1 rounded-full bg-blue-400" /> Regional Node Alignment
                  </div>
                  <div className="grid grid-cols-1 gap-1.5">
                    {Object.entries(definition.globalTranslations || {}).map(([lang, trans]: any) => (
                      <div key={lang} className="flex items-center justify-between px-3 py-2 bg-white rounded-xl border border-blue-50 hover:border-blue-200 transition-colors shadow-sm">
                        <span className="text-[9px] text-blue-400 font-black uppercase tracking-wider">{lang}</span>
                        <span className="text-xs text-slate-900 font-bold">{trans}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-red-50 rounded-2xl text-xs text-red-600 font-bold flex items-center gap-3 border border-red-100">
                <X size={18} className="shrink-0" /> 
                <span>Unable to fetch real-time medical alignment for this token.</span>
              </div>
            )}
          </div>
          {/* Subtle arrow pointing to the word */}
          <div className="absolute -top-2 left-10 w-4 h-4 bg-white border-l border-t border-blue-100 rotate-45 rounded-sm" />
        </div>
      )}
    </div>
  );
};

export default InteractiveText;
