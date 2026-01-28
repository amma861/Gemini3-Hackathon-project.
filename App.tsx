
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Camera, Send, Activity, Globe, MessageSquare, AlertCircle, Loader2, Heart, ShieldCheck, Mic, MicOff, Volume2, HelpCircle, Languages, ChevronDown, Info, History, Save, Trash2, X, CheckCircle2, RefreshCw, AlertTriangle, WifiOff, Sparkles, VolumeX, Zap, ZapOff, Scan, Upload, Moon, Sun, Plus, Layers, FileImage, Cpu, Search, Filter, Settings, User } from 'lucide-react';
import { GoogleGenAI, Modality, Type, LiveServerMessage } from "@google/genai";
import { GeminiService } from './services/geminiService';
import { AnalysisState, SavedSession, FeedbackEntry } from './types';
import PanicAlert from './components/PanicAlert';
import LinguisticAudit from './components/LinguisticAudit';
import CulturalGuard from './components/CulturalGuard';
import MicrophoneGuide from './components/MicrophoneGuide';
import InteractiveText from './components/InteractiveText';
import TranslationFeedback from './components/TranslationFeedback';

const GLOBAL_LANGUAGES = [
  // Africa
  { name: 'Igbo', label: 'Asụsụ Igbo', region: 'Africa', color: 'border-amber-200' },
  { name: 'Swahili', label: 'Kiswahili', region: 'Africa', color: 'border-teal-200' },
  { name: 'Yoruba', label: 'Yorùbá', region: 'Africa', color: 'border-orange-200' },
  { name: 'Hausa', label: 'Harshen Hausa', region: 'Africa', color: 'border-green-200' },
  { name: 'Amharic', label: 'አማርኛ', region: 'Africa', color: 'border-rose-200' },
  { name: 'Zulu', label: 'isiZulu', region: 'Africa', color: 'border-yellow-200' },
  { name: 'Afrikaans', label: 'Afrikaans', region: 'Africa', color: 'border-slate-200' },
  // Middle East
  { name: 'Arabic', label: 'العربية', region: 'Middle East', color: 'border-indigo-200' },
  { name: 'Turkish', label: 'Türkçe', region: 'Middle East', color: 'border-cyan-200' },
  { name: 'Persian', label: 'فርሲ', region: 'Middle East', color: 'border-emerald-200' },
  { name: 'Hebrew', label: 'עבריት', region: 'Middle East', color: 'border-blue-200' },
  // Asia
  { name: 'Mandarin', label: '普通话', region: 'Asia', color: 'border-red-200' },
  { name: 'Japanese', label: '日本語', region: 'Asia', color: 'border-rose-200' },
  { name: 'Korean', label: '한국어', region: 'Asia', color: 'border-indigo-300' },
  { name: 'Hindi', label: 'हिन्दी', region: 'Asia', color: 'border-orange-300' },
  { name: 'Bengali', label: 'বাংলা', region: 'Asia', color: 'border-fuchsia-200' },
  { name: 'Urdu', label: 'اردو', region: 'Asia', color: 'border-slate-300' },
  { name: 'Vietnamese', label: 'Tiếng Việt', region: 'Asia', color: 'border-red-300' },
  { name: 'Thai', label: 'ภาษาไทย', region: 'Asia', color: 'border-amber-300' },
  { name: 'Indonesian', label: 'Bahasa Indonesia', region: 'Asia', color: 'border-teal-300' },
  // Europe & Americas
  { name: 'Spanish', label: 'Español', region: 'Europe & Americas', color: 'border-sky-200' },
  { name: 'French', label: 'Français', region: 'Europe & Americas', color: 'border-violet-200' },
  { name: 'German', label: 'Deutsch', region: 'Europe & Americas', color: 'border-slate-300' },
  { name: 'Italian', label: 'Italiano', region: 'Europe & Americas', color: 'border-lime-200' },
  { name: 'Portuguese', label: 'Português', region: 'Europe & Americas', color: 'border-teal-200' },
  { name: 'Russian', label: 'Русский', region: 'Eurasia', color: 'border-orange-400' },
  { name: 'Polish', label: 'Polski', region: 'Europe & Americas', color: 'border-indigo-100' },
  { name: 'Dutch', label: 'Nederlands', region: 'Europe & Americas', color: 'border-amber-100' },
  { name: 'Greek', label: 'Ελληνικά', region: 'Europe & Americas', color: 'border-blue-100' },
];

const TTS_VOICES = ['Zephyr', 'Puck', 'Charon', 'Kore', 'Fenrir'];

type FlashMode = 'off' | 'on' | 'auto';

const App: React.FC = () => {
  const [initialized, setInitialized] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('aura_align_theme') === 'dark' || 
           (!localStorage.getItem('aura_align_theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });
  const [targetLang, setTargetLang] = useState(GLOBAL_LANGUAGES[0]);
  const [isLangPortalOpen, setIsLangPortalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [langSearch, setLangSearch] = useState('');
  
  const [inputText, setInputText] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [state, setState] = useState<AnalysisState>({ status: 'idle', transcriptions: [] });
  const [showMicGuide, setShowMicGuide] = useState(false);
  const [history, setHistory] = useState<SavedSession[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  
  // Settings with persistence
  const [autoplayAudio, setAutoplayAudio] = useState(() => localStorage.getItem('aura_align_autoplay') === 'true');
  const [selectedVoice, setSelectedVoice] = useState(() => localStorage.getItem('aura_align_voice') || 'Kore');

  // Camera States
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [capturedFrames, setCapturedFrames] = useState<string[]>([]);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [flashMode, setFlashMode] = useState<FlashMode>('off');
  const [torchSupported, setTorchSupported] = useState(false);

  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [voiceTranscription, setVoiceTranscription] = useState('');
  const [modelThinking, setModelThinking] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const liveSessionRef = useRef<any>(null);
  const gemini = useRef(new GeminiService());

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('aura_align_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('aura_align_theme', 'light');
    }
  }, [isDarkMode]);

  useEffect(() => {
    localStorage.setItem('aura_align_autoplay', String(autoplayAudio));
  }, [autoplayAudio]);

  useEffect(() => {
    localStorage.setItem('aura_align_voice', selectedVoice);
  }, [selectedVoice]);

  useEffect(() => {
    const savedHistory: SavedSession[] = JSON.parse(localStorage.getItem('aura_align_history') || '[]');
    setHistory(savedHistory);
  }, []);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const applyFlash = async () => {
      if (videoRef.current?.srcObject && torchSupported) {
        const track = (videoRef.current.srcObject as MediaStream).getVideoTracks()[0];
        if (track) {
          try {
            await track.applyConstraints({
              advanced: [{ torch: flashMode === 'on' || flashMode === 'auto' } as any]
            });
          } catch (e) {
            console.warn("Could not apply flash constraints", e);
          }
        }
      }
    };
    applyFlash();
  }, [flashMode, torchSupported, isCameraActive]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  const resetState = useCallback(() => {
    stopLiveVoice();
    stopCurrentAudio();
    stopCamera();
    setState({status: 'idle', transcriptions: [], error: undefined});
    setInputText('');
    setImage(null);
    setCapturedFrames([]);
    setAudioError(null);
    setCameraError(null);
  }, []);

  const stopCurrentAudio = useCallback(() => {
    if (audioSourceRef.current) {
      try {
        audioSourceRef.current.stop();
      } catch (e) {}
      audioSourceRef.current = null;
    }
    setIsPlayingAudio(false);
  }, []);

  const saveCurrentSession = useCallback(() => {
    if (!state.data) return;
    const newSession: SavedSession = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      inputText: inputText,
      image: image,
      targetLanguage: targetLang.name,
      data: state.data
    };
    const updatedHistory = [newSession, ...history];
    localStorage.setItem('aura_align_history', JSON.stringify(updatedHistory));
    setHistory(updatedHistory);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  }, [state.data, inputText, image, targetLang.name, history]);

  const handleProcess = useCallback(async () => {
    if (!inputText && !image) return;
    if (isOffline) {
      setState({ 
        status: 'error', 
        error: 'System currently disconnected. Neural sync requires an active uplink.',
        step: 'Connectivity Guard',
        isTransient: true
      });
      return;
    }
    stopCurrentAudio();
    setState({ status: 'processing', step: 'Syncing Global Nodes...', transcriptions: [] });
    try {
      const result = await gemini.current.processMedicalDocument(inputText, targetLang.name, image || undefined);
      setState({ status: 'completed', data: result });
      setIsSaved(false);
      if (autoplayAudio) { 
        // Small delay to ensure state update and transition
        setTimeout(() => playTranslationAudio(result.translatedText), 1000);
      }
    } catch (err: any) {
      setState({ 
        status: 'error', 
        error: err.message || 'Linguistic node timeout. Disruption detected.',
        step: 'Neural Sync Interrupted',
        isTransient: err.isTransient ?? true
      });
    }
  }, [inputText, image, targetLang.name, autoplayAudio, isOffline]);

  const playTranslationAudio = async (textOverride?: string) => {
    const textToSpeak = textOverride || state.data?.translatedText;
    if (!textToSpeak) return;
    if (isOffline) {
      setAudioError("Vocal synthesis offline.");
      return;
    }
    if (isPlayingAudio) {
      stopCurrentAudio();
      return;
    }
    setIsAudioLoading(true);
    setAudioError(null);
    try {
      const base64 = await gemini.current.generateSpeech(textToSpeak, selectedVoice);
      if (!base64) throw new Error("Audio empty");
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioContextRef.current = ctx;
      const bytes = gemini.current.decode(base64);
      const buffer = await gemini.current.decodeAudioData(bytes, ctx, 24000, 1);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.onended = () => {
        setIsPlayingAudio(false);
        audioSourceRef.current = null;
      };
      audioSourceRef.current = source;
      source.start();
      setIsPlayingAudio(true);
    } catch (err: any) {
      setAudioError("Audio disruption. Retry sync.");
      setIsPlayingAudio(false);
    } finally {
      setIsAudioLoading(false);
    }
  };

  const startLiveVoice = async () => {
    if (isVoiceActive) {
      stopLiveVoice();
      return;
    }
    if (isOffline) {
      setState({ 
        status: 'error', 
        error: 'Voice protocol offline. Connectivity required for neural stream.',
        step: 'Live Feed Guard',
        isTransient: true
      });
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            const source = inputCtx.createMediaStreamSource(stream);
            const processor = inputCtx.createScriptProcessor(4096, 1, 1);
            processor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              let sum = 0;
              for (let i = 0; i < inputData.length; i++) sum += inputData[i] * inputData[i];
              setAudioLevel(Math.sqrt(sum / inputData.length));

              const int16 = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) int16[i] = inputData[i] * 32768;
              const base64 = gemini.current.encode(new Uint8Array(int16.buffer));
              sessionPromise.then(s => s.sendRealtimeInput({ media: { data: base64, mimeType: 'audio/pcm;rate=16000' } }));
            };
            source.connect(processor);
            processor.connect(inputCtx.destination);
            setIsVoiceActive(true);
            liveSessionRef.current = { stream, inputCtx, processor };
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.inputTranscription) {
              setVoiceTranscription(message.serverContent.inputTranscription.text);
              setModelThinking(true);
            }
            if (message.serverContent?.turnComplete) setModelThinking(false);

            if (message.toolCall) {
              for (const fc of message.toolCall.functionCalls) {
                if (fc.name === 'translate_document') handleProcess();
                else if (fc.name === 'save_session') saveCurrentSession();
                else if (fc.name === 'clear_terminal') resetState();
                
                sessionPromise.then(s => s.sendToolResponse({
                  functionResponses: { id: fc.id, name: fc.name, response: { result: "ok" } }
                }));
              }
            }
          },
          onclose: () => setIsVoiceActive(false),
          onerror: () => setIsVoiceActive(false),
        },
        config: {
          responseModalities: [Modality.AUDIO],
          inputAudioTranscription: {},
          tools: [{
            functionDeclarations: [
              { name: 'translate_document', parameters: { type: Type.OBJECT, properties: {} } },
              { name: 'save_session', parameters: { type: Type.OBJECT, properties: {} } },
              { name: 'clear_terminal', parameters: { type: Type.OBJECT, properties: {} } }
            ]
          }]
        }
      });
    } catch (err) {
      setShowMicGuide(true);
    }
  };

  const stopLiveVoice = () => {
    if (liveSessionRef.current) {
      liveSessionRef.current.stream.getTracks().forEach((t: any) => t.stop());
      liveSessionRef.current.inputCtx.close();
      liveSessionRef.current.processor.disconnect();
      liveSessionRef.current = null;
    }
    setIsVoiceActive(false);
  };

  const startCamera = async () => {
    setCameraError(null);
    if (!navigator.mediaDevices) return;
    setIsCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        const track = stream.getVideoTracks()[0];
        if (track) {
          const capabilities = track.getCapabilities() as any;
          setTorchSupported(!!capabilities.torch);
        }
      }
    } catch (err) {
      setCameraError("Camera unavailable.");
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
    setIsCameraActive(false);
    setCapturedFrames([]);
    setFlashMode('off');
  };

  const toggleFlash = () => {
    setFlashMode(prev => {
      if (prev === 'off') return 'on';
      if (prev === 'on') return 'auto';
      return 'off';
    });
  };

  const captureFrame = () => {
    if (videoRef.current && canvasRef.current) {
      const v = videoRef.current;
      const c = canvasRef.current;
      c.width = v.videoWidth;
      c.height = v.videoHeight;
      const ctx = c.getContext('2d');
      if (ctx) {
        ctx.drawImage(v, 0, 0);
        setCapturedFrames(prev => [...prev, c.toDataURL('image/jpeg', 0.85)]);
      }
    }
  };

  const removeFrame = (index: number) => {
    setCapturedFrames(prev => prev.filter((_, i) => i !== index));
  };

  const stitchFrames = async () => {
    if (capturedFrames.length === 0) return;
    setState({ status: 'processing', step: 'Synthesizing Multimodal Scan...', transcriptions: [] });
    try {
      const imgs = await Promise.all(capturedFrames.map(src => {
        return new Promise<HTMLImageElement>(r => {
          const i = new Image();
          i.onload = () => r(i);
          i.src = src;
        });
      }));
      const maxWidth = Math.max(...imgs.map(i => i.width));
      const totalHeight = imgs.reduce((s, i) => s + i.height, 0);
      const canvas = document.createElement('canvas');
      canvas.width = maxWidth;
      canvas.height = totalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error();
      let y = 0;
      imgs.forEach(i => { ctx.drawImage(i, 0, y); y += i.height; });
      setImage(canvas.toDataURL('image/jpeg', 0.8));
      setIsCameraActive(false);
      setCapturedFrames([]);
      setState({ status: 'idle', transcriptions: [] });
    } catch (e) {
      setState({ status: 'error', error: 'Synthesis failed.' });
    }
  };

  const loadSession = (s: SavedSession) => {
    stopCurrentAudio();
    setState({ status: 'completed', data: s.data });
    setInputText(s.inputText);
    setImage(s.image || null);
    setIsHistoryOpen(false);
  };

  const filteredLanguagesByRegion = useMemo(() => {
    const search = langSearch.toLowerCase();
    const filtered = GLOBAL_LANGUAGES.filter(l => 
      l.name.toLowerCase().includes(search) || 
      l.label.toLowerCase().includes(search) ||
      l.region.toLowerCase().includes(search)
    );
    
    return filtered.reduce((acc, lang) => {
      if (!acc[lang.region]) acc[lang.region] = [];
      acc[lang.region].push(lang);
      return acc;
    }, {} as Record<string, typeof GLOBAL_LANGUAGES>);
  }, [langSearch]);

  const LanguagePortal = ({ isOpen, onClose, onSelect }: { isOpen: boolean, onClose: () => void, onSelect: (l: typeof GLOBAL_LANGUAGES[0]) => void }) => {
    if (!isOpen) return null;
    return (
      <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 sm:p-6 backdrop-blur-3xl animate-in fade-in duration-300">
        <div className="absolute inset-0 bg-slate-900/40" onClick={onClose} />
        <div className="bg-white dark:bg-slate-950 w-full max-w-4xl rounded-[3rem] shadow-[0_50px_100px_rgba(0,0,0,0.3)] border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh] relative z-10 overflow-hidden">
          <div className="p-8 sm:p-12 border-b border-slate-100 dark:border-slate-900 flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">Linguistic Node Registry</h3>
                <p className="text-xs font-black text-indigo-500 uppercase tracking-[0.4em] mt-1">Select Target Synchronization Node</p>
              </div>
              <button onClick={onClose} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-3xl text-slate-400 transition-colors">
                <X size={28} />
              </button>
            </div>
            
            <div className="relative group">
              <div className="absolute inset-y-0 left-6 flex items-center text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                <Search size={20} />
              </div>
              <input 
                autoFocus
                type="text" 
                placeholder="Search language, dialect, or region..." 
                className="w-full pl-16 pr-8 py-5 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border-2 border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 transition-all text-lg font-bold outline-none"
                value={langSearch}
                onChange={(e) => setLangSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-8 sm:p-12 space-y-12 custom-scrollbar">
            {Object.entries(filteredLanguagesByRegion).length > 0 ? Object.entries(filteredLanguagesByRegion).map(([region, langs]) => (
              <div key={region} className="space-y-6">
                <div className="flex items-center gap-4">
                  <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.6em] whitespace-nowrap">{region}</h4>
                  <div className="h-px w-full bg-slate-100 dark:bg-slate-900" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {langs.map(lang => (
                    <button
                      key={lang.name}
                      onClick={() => { onSelect(lang); onClose(); }}
                      className={`group flex items-center justify-between p-5 rounded-[1.5rem] border-2 transition-all text-left ${targetLang.name === lang.name ? 'bg-indigo-600 border-indigo-600 shadow-xl shadow-indigo-100 dark:shadow-none' : 'bg-white dark:bg-slate-900/40 border-slate-100 dark:border-slate-800 hover:border-indigo-400'}`}
                    >
                      <div className="flex flex-col">
                        <span className={`text-sm font-black tracking-tight ${targetLang.name === lang.name ? 'text-white' : 'text-slate-900 dark:text-white'}`}>{lang.label}</span>
                        <span className={`text-[10px] font-bold uppercase tracking-widest mt-1 ${targetLang.name === lang.name ? 'text-indigo-100 opacity-70' : 'text-slate-400'}`}>{lang.name}</span>
                      </div>
                      <Globe size={18} className={`transition-transform group-hover:rotate-12 ${targetLang.name === lang.name ? 'text-white' : 'text-slate-200 dark:text-slate-700'}`} />
                    </button>
                  ))}
                </div>
              </div>
            )) : (
              <div className="py-20 text-center space-y-4">
                <div className="p-6 bg-slate-50 dark:bg-slate-900 rounded-full w-20 h-20 flex items-center justify-center mx-auto text-slate-300">
                  <Languages size={40} />
                </div>
                <h5 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">No Linguistic Nodes Found</h5>
                <p className="text-sm text-slate-400 font-medium">Retry with alternate regional parameters.</p>
              </div>
            )}
          </div>

          <div className="p-8 bg-slate-50 dark:bg-slate-900/30 flex items-center justify-between">
            <div className="flex items-center gap-3 text-slate-400 text-[10px] font-black uppercase tracking-widest">
              <ShieldCheck size={16} /> Precision Calibration Node
            </div>
            <p className="text-slate-300 dark:text-slate-700 text-[10px] font-black uppercase tracking-[0.4em]">v3.4.2 Global Registry</p>
          </div>
        </div>
      </div>
    );
  };

  const SettingsPortal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
    if (!isOpen) return null;
    return (
      <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4 backdrop-blur-3xl animate-in fade-in duration-300">
        <div className="absolute inset-0 bg-slate-900/40" onClick={onClose} />
        <div className="bg-white dark:bg-slate-950 w-full max-w-lg rounded-[3rem] shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col relative z-10 overflow-hidden">
          <div className="p-10 border-b border-slate-100 dark:border-slate-900 flex items-center justify-between bg-indigo-600 text-white">
            <div>
              <h3 className="text-2xl font-black tracking-tighter">System Configuration</h3>
              <p className="text-[9px] font-bold uppercase tracking-[0.4em] opacity-70">Hardware & Synthesis Settings</p>
            </div>
            <button onClick={onClose} className="p-3 hover:bg-white/10 rounded-2xl transition-colors">
              <X size={24} />
            </button>
          </div>

          <div className="p-10 space-y-10">
            {/* Autoplay Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-tight text-sm">Autoplay Synthesis</h4>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest mt-1">Automatic voice output on translation</p>
              </div>
              <button 
                onClick={() => setAutoplayAudio(!autoplayAudio)}
                className={`w-16 h-8 rounded-full transition-all relative ${autoplayAudio ? 'bg-teal-500' : 'bg-slate-200 dark:bg-slate-800'}`}
              >
                <div className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-sm transition-all ${autoplayAudio ? 'left-9' : 'left-1'}`} />
              </button>
            </div>

            {/* Voice Selection */}
            <div className="space-y-4">
              <div>
                <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-tight text-sm">Neural Voice Model</h4>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest mt-1">Select TTS persona for clinical output</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {TTS_VOICES.map(voice => (
                  <button
                    key={voice}
                    onClick={() => setSelectedVoice(voice)}
                    className={`flex items-center gap-3 px-5 py-3 rounded-2xl border-2 transition-all font-bold text-xs ${selectedVoice === voice ? 'bg-indigo-50 border-indigo-600 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-500 hover:border-indigo-400'}`}
                  >
                    <User size={14} className={selectedVoice === voice ? 'text-indigo-600' : 'text-slate-300'} />
                    {voice}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="p-8 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-400 text-[9px] font-black uppercase tracking-widest">
              <Cpu size={14} /> Neural Core Optimized
            </div>
            <button 
              onClick={onClose}
              className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg active:scale-95 transition-all"
            >
              Apply Changes
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 mesh-gradient">
        {isOffline && (
          <div className="fixed top-0 left-0 right-0 z-[2000] bg-rose-600 text-white py-2 px-4 flex items-center justify-center gap-3 animate-in slide-in-from-top duration-300">
            <WifiOff size={16} />
            <span className="text-[10px] font-black uppercase tracking-[0.3em]">Neural Node Disconnected: System Offline</span>
          </div>
        )}
        <div className="max-w-4xl w-full glass-effect rounded-[4rem] p-12 sm:p-20 shadow-2xl text-center relative overflow-hidden animate-in zoom-in duration-700">
          <div className="inline-flex items-center justify-center p-6 bg-gradient-to-br from-teal-500 to-indigo-600 text-white rounded-[2.5rem] shadow-2xl mb-12 relative">
            <Activity size={60} />
            <div className="absolute -inset-4 bg-indigo-500/10 rounded-full animate-ping" />
          </div>
          
          <div className="space-y-4 mb-12">
            <h2 className="text-sm font-black text-indigo-500 uppercase tracking-[0.8em] animate-pulse">Neural Health Guard Engine</h2>
            <h1 className="text-7xl sm:text-8xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">Aura-Align</h1>
          </div>

          <div className="flex flex-col gap-6 max-w-md mx-auto">
            <div className="p-8 bg-white/60 dark:bg-slate-900/60 rounded-[2.5rem] border border-slate-200/50 dark:border-slate-800 shadow-inner group">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-4">Selected Node</div>
              <button 
                onClick={() => setIsLangPortalOpen(true)}
                className="w-full flex items-center justify-between px-8 py-5 bg-white dark:bg-slate-950 rounded-3xl border-2 border-indigo-100 dark:border-indigo-900/30 hover:border-indigo-500 transition-all text-left"
              >
                <div>
                  <div className="text-xl font-black text-slate-900 dark:text-white leading-tight">{targetLang.label}</div>
                  <div className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mt-1">{targetLang.region} • {targetLang.name}</div>
                </div>
                <ChevronDown className="text-slate-300" />
              </button>
            </div>

            <button 
              onClick={() => setInitialized(true)} 
              className="w-full py-8 bg-gradient-to-r from-teal-600 via-indigo-700 to-indigo-900 text-white rounded-[2.5rem] font-black text-2xl shadow-[0_20px_50px_rgba(79,70,229,0.3)] flex items-center justify-center gap-4 hover:scale-[1.03] active:scale-95 transition-all relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              <Zap size={24} className="group-hover:animate-bounce" />
              Initialize Clinical Protocol
            </button>
          </div>
          
          <div className="mt-16 text-[9px] font-black text-slate-400 uppercase tracking-[0.5em] opacity-40">
             Multimodal Linguistic Synchronization • Protocol v3.4.2
          </div>
        </div>
        <LanguagePortal isOpen={isLangPortalOpen} onClose={() => setIsLangPortalOpen(false)} onSelect={setTargetLang} />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-12 md:py-20 animate-in fade-in duration-1000 relative">
      {isOffline && (
        <div className="fixed top-0 left-0 right-0 z-[2000] bg-rose-600 text-white py-2 px-4 flex items-center justify-center gap-3 animate-in slide-in-from-top duration-300">
          <WifiOff size={16} />
          <span className="text-[10px] font-black uppercase tracking-[0.3em]">Neural Node Disconnected: System Offline</span>
        </div>
      )}
      <header className="mb-16 flex flex-col items-center relative">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-xl"><Activity size={32} /></div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">AURA-ALIGN</h1>
        </div>
        
        <button 
          onClick={() => setIsLangPortalOpen(true)}
          className="group px-6 py-3 bg-white/80 dark:bg-slate-900 rounded-full border border-indigo-100 dark:border-slate-800 text-indigo-600 dark:text-indigo-400 font-black text-[11px] uppercase tracking-widest flex items-center gap-3 transition-all hover:border-indigo-500 hover:shadow-lg hover:shadow-indigo-50"
        >
          <Globe size={14} className="group-hover:rotate-12 transition-transform" /> 
          Node: {targetLang.name}
          <ChevronDown size={14} className="text-slate-300" />
        </button>

        <div className="absolute right-0 top-1/2 -translate-y-1/2 flex gap-3">
          <button onClick={() => setIsSettingsOpen(true)} className="p-3 bg-white dark:bg-slate-900 shadow-sm border rounded-2xl hover:scale-110 transition-all text-slate-600 dark:text-slate-400">
            <Settings size={20} />
          </button>
          <button onClick={toggleTheme} className="p-3 bg-white dark:bg-slate-900 shadow-sm border rounded-2xl hover:scale-110 transition-all text-slate-600 dark:text-slate-400">
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button onClick={() => setIsHistoryOpen(true)} className="p-3 bg-white dark:bg-slate-900 shadow-sm border rounded-2xl hover:scale-110 transition-all text-slate-600 dark:text-slate-400 relative">
            <History size={20} />
            {history.length > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-teal-500 text-white text-[8px] font-black flex items-center justify-center rounded-full border-2 border-white">{history.length}</span>}
          </button>
        </div>
      </header>

      {isCameraActive && (
        <div className="fixed inset-0 z-[1500] bg-slate-950 flex flex-col animate-in fade-in">
          <div className="absolute top-8 left-8 right-8 z-10 flex items-center justify-between">
            <div className="px-6 py-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 text-white font-black text-xs uppercase tracking-widest flex items-center gap-3">
               <Scan size={18} className="text-teal-400" /> Multi-Part Scan: {capturedFrames.length}
            </div>
            
            <div className="flex items-center gap-3">
              {torchSupported && (
                <button 
                  onClick={toggleFlash} 
                  className={`p-4 rounded-2xl transition-all flex items-center gap-2 font-black text-[10px] uppercase tracking-widest ${flashMode !== 'off' ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30' : 'bg-white/10 text-white border border-white/20'}`}
                >
                  {flashMode === 'off' ? <ZapOff size={20} /> : <Zap size={20} className={flashMode === 'on' ? 'animate-pulse' : ''} />}
                  <span className="hidden sm:inline">Flash: {flashMode}</span>
                </button>
              )}
              <button onClick={stopCamera} className="p-4 bg-rose-500 text-white rounded-2xl shadow-xl hover:bg-rose-600 transition-all"><X size={24} /></button>
            </div>
          </div>
          
          <video ref={videoRef} autoPlay playsInline className="flex-1 object-contain" />
          <canvas ref={canvasRef} className="hidden" />
          
          <div className="bg-slate-900/90 p-8 flex flex-col gap-6 backdrop-blur-3xl">
            <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
              {capturedFrames.map((f, i) => (
                <div key={i} className="relative group shrink-0">
                  <img src={f} className="w-32 h-20 object-cover rounded-xl border-2 border-teal-500" />
                  <button onClick={() => removeFrame(i)} className="absolute -top-2 -right-2 p-1 bg-rose-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={12} /></button>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-center gap-12">
              <button onClick={captureFrame} className="w-20 h-20 bg-white rounded-full border-[6px] border-teal-500 active:scale-90 transition-all shadow-[0_0_50px_rgba(20,184,166,0.5)]" />
              <button disabled={capturedFrames.length === 0} onClick={stitchFrames} className="px-10 py-5 bg-teal-500 text-white rounded-[1.5rem] font-black uppercase tracking-widest shadow-xl disabled:opacity-20 flex items-center gap-3 active:scale-95 transition-all">
                <Layers size={18} /> Finalize Synthesis
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-12">
        {state.status === 'error' && (
          <div className="glass-effect p-12 rounded-[3rem] border-2 border-rose-500 animate-in zoom-in text-center shadow-2xl shadow-rose-100 dark:shadow-none">
            <div className="p-6 bg-rose-100 dark:bg-rose-950/20 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-8 border-4 border-rose-500/20">
               <AlertCircle size={48} className="text-rose-500" />
            </div>
            <h2 className="text-3xl font-black mb-4 uppercase tracking-tighter text-slate-900 dark:text-white">Protocol Disruption</h2>
            <div className="bg-rose-50 dark:bg-rose-950/30 p-6 rounded-3xl border border-rose-200 dark:border-rose-900/40 mb-10">
              <p className="text-rose-600 dark:text-rose-400 font-black uppercase tracking-widest text-sm leading-relaxed">{state.error}</p>
              <div className="mt-2 text-[10px] font-black text-rose-400/60 uppercase tracking-widest">Diagnostic Step: {state.step}</div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
              <button onClick={resetState} className="w-full sm:w-auto px-10 py-4 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl text-slate-400 hover:text-slate-600 font-black uppercase text-xs tracking-widest transition-all">
                Discard Terminal
              </button>
              {state.isTransient && (
                <button 
                  onClick={handleProcess} 
                  className="w-full sm:w-auto px-12 py-5 bg-rose-600 text-white rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl shadow-rose-200 dark:shadow-none hover:bg-rose-700 transition-all active:scale-95 animate-neural-pulse"
                >
                  <RefreshCw size={18} /> Re-sync Node
                </button>
              )}
            </div>
          </div>
        )}

        {state.status !== 'completed' && state.status !== 'error' && (
          <div className="glass-effect p-10 rounded-[3rem] shadow-2xl relative overflow-hidden">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100">Patient Intake Terminal</h2>
              <button onClick={startLiveVoice} className={`flex items-center gap-3 px-6 py-3 rounded-2xl transition-all font-black text-xs uppercase tracking-widest ${isVoiceActive ? 'bg-indigo-600 text-white shadow-xl' : 'bg-white border text-slate-400 dark:bg-slate-900 dark:border-slate-800'}`}>
                <Mic size={18} /> {isVoiceActive ? 'Listening...' : 'Voice HUD'}
              </button>
            </div>
            <textarea
              className="w-full h-64 p-10 rounded-[2.5rem] bg-white border-2 focus:border-indigo-400 transition-all text-2xl leading-relaxed resize-none dark:bg-slate-900 dark:border-slate-800 dark:text-white"
              placeholder={`Provide clinical context for the ${targetLang.name} node...`}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
            />
            <div className="mt-8 flex flex-wrap gap-6 items-center">
              <button onClick={startCamera} className="px-8 py-4 bg-teal-500 text-white rounded-2xl font-black uppercase flex items-center gap-3 shadow-lg hover:bg-teal-600 transition-all">
                <Scan size={18} /> Clinical Scan
              </button>
              <button onClick={() => fileInputRef.current?.click()} className="px-8 py-4 bg-white border rounded-2xl font-bold uppercase flex items-center gap-3 dark:bg-slate-900 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-all">
                <Upload size={18} /> {image ? 'Captured' : 'Local Node'}
              </button>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) { const r = new FileReader(); r.onload = (re) => setImage(re.target?.result as string); r.readAsDataURL(f); }
              }} />
              <div className="flex-1" />
              {image && (
                <div className="relative group">
                  <img src={image} className="w-16 h-16 rounded-xl border-2 border-teal-500 object-cover" />
                  <button onClick={() => setImage(null)} className="absolute -top-2 -right-2 p-1 bg-rose-500 text-white rounded-full"><X size={12} /></button>
                </div>
              )}
              <button disabled={(!inputText && !image) || state.status === 'processing'} onClick={handleProcess} className="px-12 py-6 bg-gradient-to-r from-teal-600 to-indigo-700 text-white rounded-[2rem] font-black text-lg shadow-2xl transition-all active:scale-95 disabled:opacity-50 hover:shadow-indigo-200">
                {state.status === 'processing' ? <Loader2 className="animate-spin" /> : <Send size={20} />} Protocol Begin
              </button>
            </div>
          </div>
        )}

        {state.status === 'completed' && state.data && (
          <div className="space-y-12 animate-in slide-in-from-bottom-8">
            <div className="flex items-center justify-between">
              <button onClick={resetState} className="px-10 py-4 bg-white border rounded-[1.5rem] text-slate-400 font-black uppercase text-xs flex items-center gap-3 hover:text-rose-500 dark:bg-slate-900 dark:border-slate-800 transition-all">
                <Trash2 size={16} /> Close Intake
              </button>
              <div className="flex gap-4">
                <button onClick={saveCurrentSession} className={`px-10 py-4 rounded-[1.5rem] font-black uppercase text-[11px] transition-all ${isSaved ? 'bg-teal-500 text-white' : 'bg-white border text-slate-400 dark:bg-slate-900 dark:border-slate-800'}`}>
                  {isSaved ? <CheckCircle2 size={16} /> : <Save size={16} />} Session Archived
                </button>
                <div className="px-8 py-4 bg-teal-50 dark:bg-teal-950/20 text-teal-600 dark:text-teal-400 rounded-[1.5rem] text-[10px] font-black uppercase flex items-center gap-2 border border-teal-100 dark:border-teal-900/30">
                  <ShieldCheck size={20} /> Validation Passed
                </div>
              </div>
            </div>

            <CulturalGuard analysis={state.data.culturalAnalysis} language={targetLang.name} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <PanicAlert data={state.data.panic} />
              <LinguisticAudit score={state.data.jaccardScore} isRisk={state.data.criticalRisk} tokens={state.data.tokens} />
            </div>

            <div className="glass-effect rounded-[4rem] overflow-hidden border shadow-2xl medical-paper dark:border-slate-800">
              <div className="bg-gradient-to-r from-teal-600 to-indigo-700 text-white px-12 py-12 flex justify-between items-center">
                <div className="flex flex-col gap-1">
                  <h3 className="text-2xl font-black uppercase tracking-tight">Clinical Result: {targetLang.name}</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] opacity-70 font-bold uppercase tracking-widest">Vocal Sync: {selectedVoice}</span>
                    {autoplayAudio && <span className="px-2 py-0.5 bg-white/20 rounded text-[8px] font-black uppercase">Autoplay Active</span>}
                  </div>
                </div>
                <button onClick={() => playTranslationAudio()} disabled={isAudioLoading} className={`px-10 py-5 rounded-3xl font-black uppercase text-xs transition-all ${isPlayingAudio ? 'bg-rose-500 text-white shadow-xl shadow-rose-500/30' : 'bg-white text-indigo-700 hover:shadow-lg'}`}>
                  {isAudioLoading ? <Loader2 className="animate-spin" /> : <Volume2 size={20} />} {isPlayingAudio ? 'Stop Synthesis' : 'Synthesize Voice'}
                </button>
              </div>
              <div className="p-12 md:p-24">
                <InteractiveText text={state.data.translatedText} language={targetLang.name} />
              </div>
            </div>
            <TranslationFeedback sourceText={inputText} translation={state.data.translatedText} language={targetLang.name} auditScore={state.data.jaccardScore} />
          </div>
        )}
      </div>

      {isHistoryOpen && (
        <div className="fixed inset-0 z-[1200] bg-slate-900/60 flex items-center justify-center p-6 backdrop-blur-xl">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[4rem] overflow-hidden flex flex-col border shadow-2xl dark:border-slate-800">
            <div className="bg-indigo-600 p-10 flex justify-between text-white">
              <h3 className="text-3xl font-black tracking-tighter">Registry Node</h3>
              <button onClick={() => setIsHistoryOpen(false)}><X size={32} /></button>
            </div>
            <div className="p-10 overflow-y-auto max-h-[60vh] space-y-4 custom-scrollbar">
              {history.map(s => (
                <div key={s.id} onClick={() => loadSession(s)} className="p-6 bg-slate-50 dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 hover:border-indigo-500 transition-all cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center font-black dark:bg-slate-900 uppercase text-xs">{s.targetLanguage.substring(0,2)}</div>
                    <div>
                      <div className="text-[10px] opacity-50 font-black uppercase tracking-widest">{new Date(s.timestamp).toLocaleDateString()}</div>
                      <h4 className="font-black text-lg dark:text-white">{(s.inputText || 'Visual Synthesis').substring(0, 40)}...</h4>
                    </div>
                  </div>
                </div>
              ))}
              {history.length === 0 && <p className="text-center text-slate-400 py-10 uppercase font-black text-xs tracking-widest">No history synced.</p>}
            </div>
          </div>
        </div>
      )}

      {state.status === 'processing' && state.step === 'Synthesizing Multimodal Scan...' && (
        <div className="fixed inset-0 z-[2000] bg-slate-950/95 backdrop-blur-3xl flex flex-col items-center justify-center p-12 text-center animate-in fade-in">
          <div className="relative mb-16">
            <div className="absolute -inset-24 bg-teal-500/10 rounded-full animate-pulse" />
            <Layers size={80} className="text-teal-500 animate-bounce" />
          </div>
          <h2 className="text-4xl font-black text-white mb-4 uppercase tracking-tighter">Synthesis Core Active</h2>
          <p className="text-teal-400 font-black uppercase tracking-[0.4em] text-xs">Integrating Clinical Multimodal Nodes</p>
        </div>
      )}

      <footer className="mt-40 pb-20 pt-16 border-t border-slate-100 dark:border-slate-800 opacity-30 text-center">
        <p className="text-[10px] font-black uppercase tracking-[0.8em] dark:text-slate-500">Aura-Align &bull; Global Neural Health Node &bull; v3.4.2</p>
      </footer>
      <LanguagePortal isOpen={isLangPortalOpen} onClose={() => setIsLangPortalOpen(false)} onSelect={setTargetLang} />
      <SettingsPortal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      {showMicGuide && <MicrophoneGuide onClose={() => setShowMicGuide(false)} />}
    </div>
  );
};

export default App;
