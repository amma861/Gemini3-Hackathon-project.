
import React, { useState, useRef, useEffect } from 'react';
import { Camera, Send, Activity, BookOpen, Globe, User, MessageSquare, AlertCircle, Loader2, Heart, ShieldCheck, Mic, MicOff, Volume2, HelpCircle, Languages, ChevronDown, Info, Zap, History, Save, Trash2, X, CheckCircle2, RefreshCw } from 'lucide-react';
import { GoogleGenAI, Modality } from "@google/genai";
import { GeminiService } from './services/geminiService';
import { AnalysisState, TranscriptionTurn, FeedbackEntry, SavedSession } from './types';
import PanicAlert from './components/PanicAlert';
import LinguisticAudit from './components/LinguisticAudit';
import MicrophoneGuide from './components/MicrophoneGuide';
import InteractiveText from './components/InteractiveText';
import TranslationFeedback from './components/TranslationFeedback';

const GLOBAL_LANGUAGES = [
  { name: 'Igbo', label: 'Asụsụ Igbo', region: 'West Africa' },
  { name: 'Swahili', label: 'Kiswahili', region: 'East Africa' },
  { name: 'Yoruba', label: 'Èdè Yorùbá', region: 'West Africa' },
  { name: 'Hausa', label: 'Harshen Hausa', region: 'West Africa' },
  { name: 'Zulu', label: 'isiZulu', region: 'Southern Africa' },
  { name: 'Amharic', label: 'አማርኛ', region: 'East Africa' },
  { name: 'Somali', label: 'Af-Soomaali', region: 'East Africa' },
  { name: 'Oromo', label: 'Afaan Oromoo', region: 'East Africa' },
  { name: 'Kinyarwanda', label: 'Ikinyarwanda', region: 'Central Africa' },
  { name: 'Bengali', label: 'বাংলা', region: 'South Asia' },
  { name: 'Hindi', label: 'हिन्दी', region: 'South Asia' },
  { name: 'Urdu', label: 'اردو', region: 'South Asia' },
  { name: 'Vietnamese', label: 'Tiếng Việt', region: 'Southeast Asia' },
  { name: 'Thai', label: 'ภาษาไทย', region: 'Southeast Asia' },
  { name: 'Indonesian', label: 'Bahasa Indonesia', region: 'Southeast Asia' },
  { name: 'Arabic', label: 'العربية', region: 'Middle East/Africa' },
  { name: 'Spanish', label: 'Español', region: 'Global' },
  { name: 'French', label: 'Français', region: 'Global' },
  { name: 'Portuguese', label: 'Português', region: 'Global' }
];

const App: React.FC = () => {
  const [initialized, setInitialized] = useState(false);
  const [targetLang, setTargetLang] = useState(GLOBAL_LANGUAGES[0]);
  const [inputText, setInputText] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [state, setState] = useState<AnalysisState>({ status: 'idle', transcriptions: [] });
  const [showMicGuide, setShowMicGuide] = useState(false);
  const [isLiveActive, setIsLiveActive] = useState(false);
  const [feedbackCount, setFeedbackCount] = useState(0);
  const [history, setHistory] = useState<SavedSession[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const frameIntervalRef = useRef<number | null>(null);

  const gemini = new GeminiService();

  useEffect(() => {
    const feedback: FeedbackEntry[] = JSON.parse(localStorage.getItem('aura_align_feedback') || '[]');
    setFeedbackCount(feedback.length);

    const savedHistory: SavedSession[] = JSON.parse(localStorage.getItem('aura_align_history') || '[]');
    setHistory(savedHistory);
  }, [state.status]);

  // Helper for Live API
  const decode = (base64: string) => {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i);
    return bytes;
  };

  const decodeAudioData = async (data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> => {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
    return buffer;
  };

  const encode = (bytes: Uint8Array) => {
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  };

  const createBlob = (data: Float32Array) => {
    const int16 = new Int16Array(data.length);
    for (let i = 0; i < data.length; i++) int16[i] = data[i] * 32768;
    return { data: encode(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' };
  };

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const saveCurrentSession = () => {
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
    setTimeout(() => setIsSaved(false), 3000);
  };

  const deleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updatedHistory = history.filter(s => s.id !== id);
    localStorage.setItem('aura_align_history', JSON.stringify(updatedHistory));
    setHistory(updatedHistory);
  };

  const loadSession = (session: SavedSession) => {
    setState({ status: 'completed', data: session.data });
    setInputText(session.inputText);
    setImage(session.image || null);
    const lang = GLOBAL_LANGUAGES.find(l => l.name === session.targetLanguage) || GLOBAL_LANGUAGES[0];
    setTargetLang(lang);
    setIsHistoryOpen(false);
  };

  const resetState = () => {
    stopLiveVoice();
    setState({status: 'idle', transcriptions: [], error: undefined});
    setInputText('');
    setImage(null);
  };

  const startLiveVoice = async () => {
    try {
      if (!navigator.onLine) {
        throw new Error('Network interruption detected. Please verify your internet connection and try again.');
      }

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      } catch (mediaErr: any) {
        if (mediaErr.name === 'NotAllowedError' || mediaErr.name === 'PermissionDeniedError') {
          throw new Error('Microphone and Camera access denied. Please enable these permissions in your browser settings to continue with the live medical guard.');
        } else if (mediaErr.name === 'NotFoundError' || mediaErr.name === 'DevicesNotFoundError') {
          throw new Error('No audio or video hardware detected. Ensure your microphone and camera are connected and not in use by another application.');
        } else {
          throw new Error(`Media access failure: ${mediaErr.message || 'Unknown hardware error'}. Please refresh the page and try again.`);
        }
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioContextRef.current = outputCtx;

      setState(prev => ({ ...prev, status: 'listening', step: 'Live Multimodal Guard Active', error: undefined }));
      setIsLiveActive(true);

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            const source = inputCtx.createMediaStreamSource(stream);
            const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              sessionPromise.then(s => s.sendRealtimeInput({ media: createBlob(inputData) })).catch(err => {
                console.debug("Failed to send audio input:", err);
              });
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputCtx.destination);

            frameIntervalRef.current = window.setInterval(() => {
              if (videoRef.current && canvasRef.current) {
                const video = videoRef.current;
                const canvas = canvasRef.current;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                  canvas.width = video.videoWidth;
                  canvas.height = video.videoHeight;
                  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                  canvas.toBlob(async (blob) => {
                    if (blob) {
                      const base64Data = await blobToBase64(blob);
                      sessionPromise.then(s => s.sendRealtimeInput({
                        media: { data: base64Data, mimeType: 'image/jpeg' }
                      })).catch(err => console.debug("Video send error:", err));
                    }
                  }, 'image/jpeg', 0.6);
                }
              }
            }, 1000);

            if (image) {
              const base64Image = image.split(',')[1];
              sessionPromise.then(s => s.sendRealtimeInput({
                media: { data: base64Image, mimeType: 'image/jpeg' }
              })).catch(err => console.debug("Initial image send error:", err));
            }
          },
          onmessage: async (message) => {
            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio) {
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputCtx.currentTime);
              const buffer = await decodeAudioData(decode(base64Audio), outputCtx, 24000, 1);
              const source = outputCtx.createBufferSource();
              source.buffer = buffer;
              source.connect(outputCtx.destination);
              source.addEventListener('ended', () => sourcesRef.current.delete(source));
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
              sourcesRef.current.add(source);
            }

            if (message.serverContent?.outputTranscription) {
              const text = message.serverContent.outputTranscription.text;
              setState(prev => {
                const last = prev.transcriptions?.[prev.transcriptions.length - 1];
                if (last?.role === 'model') {
                  const updated = [...prev.transcriptions!];
                  updated[updated.length - 1] = { ...last, text: last.text + text };
                  return { ...prev, transcriptions: updated };
                }
                return { ...prev, transcriptions: [...(prev.transcriptions || []), { role: 'model', text, timestamp: Date.now() }] };
              });
            }

            if (message.serverContent?.inputTranscription) {
              const text = message.serverContent.inputTranscription.text;
              setState(prev => {
                const last = prev.transcriptions?.[prev.transcriptions.length - 1];
                if (last?.role === 'user') {
                  const updated = [...prev.transcriptions!];
                  updated[updated.length - 1] = { ...last, text: last.text + text };
                  return { ...prev, transcriptions: updated };
                }
                return { ...prev, transcriptions: [...(prev.transcriptions || []), { role: 'user', text, timestamp: Date.now() }] };
              });
            }

            if (message.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => s.stop());
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
          },
          onerror: (e: any) => {
            console.error('Live session error:', e);
            let userMessage = 'Connection to the medical node was lost. This often happens due to network instability.';
            
            const errString = e.message || e.toString() || '';
            if (errString.includes('Requested entity was not found')) {
              userMessage = 'API Configuration Error. The medical node is currently unreachable. Please verify your project permissions or contact administration.';
            } else if (!navigator.onLine) {
              userMessage = 'Network connection interrupted. Please restore your internet access and try to reconnect.';
            } else if (errString.includes('limit') || errString.includes('quota')) {
              userMessage = 'System rate limit reached. The node is currently overloaded. Please wait 60 seconds before trying again.';
            } else if (errString.includes('403')) {
              userMessage = 'Access denied. Your current credentials do not have permission to access the medical node.';
            }
            
            setState(prev => ({ ...prev, status: 'error', error: userMessage }));
            stopLiveVoice();
          },
          onclose: (e: CloseEvent) => {
            if (!e.wasClean) {
              setState(prev => {
                // If we already have a specific error message from 'onerror', keep it
                if (prev.status === 'error' && prev.error) return prev;
                return { ...prev, status: 'error', error: 'The crisis session closed unexpectedly. This may be due to a timeout or connection drop.' };
              });
            }
            stopLiveVoice();
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          outputAudioTranscription: {},
          inputAudioTranscription: {},
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
          systemInstruction: `You are Aura-Align, a medical crisis responder. Communicate with calmness and authority. You have access to the user's audio and camera feed. Analyze the environment, patient appearance, and medical documents shown to you. Provide real-time translation and guidance between English and ${targetLang.name}.`
        }
      });

      sessionRef.current = await sessionPromise;
    } catch (err: any) {
      console.error('startLiveVoice Exception:', err);
      let errMsg = err.message || 'An internal error occurred while initializing the hardware.';
      
      if (errMsg.includes('access denied')) {
        setShowMicGuide(true);
      }
      
      setState(prev => ({ ...prev, status: 'error', error: errMsg }));
      stopLiveVoice();
    }
  };

  const stopLiveVoice = () => {
    if (sessionRef.current) {
      sessionRef.current.close();
      sessionRef.current = null;
    }
    if (frameIntervalRef.current) {
      clearInterval(frameIntervalRef.current);
      frameIntervalRef.current = null;
    }
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsLiveActive(false);
    setState(prev => ({ ...prev, status: prev.status === 'listening' ? 'idle' : prev.status }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProcess = async () => {
    if (!inputText && !image) return;
    setState({ status: 'processing', step: 'Aligning with Knowledge Base...', transcriptions: [] });
    try {
      const result = await gemini.processMedicalDocument(inputText, targetLang.name, image || undefined);
      setState({ status: 'completed', data: result });
      setIsSaved(false);
    } catch (err: any) {
      console.error('Translation process failed:', err);
      let errMsg = 'An unexpected error occurred during translation. Please verify your internet connectivity and try again.';
      
      if (err.message?.includes('Requested entity was not found')) {
        errMsg = 'API Configuration Error. The medical node could not be reached. Please check your settings or try again.';
      } else if (!navigator.onLine) {
        errMsg = 'Network connection unavailable. Please check your internet connectivity to continue with the translation.';
      } else if (err.message?.includes('quota') || err.message?.includes('limit')) {
        errMsg = 'System capacity temporarily reached. Please wait a moment and try again.';
      }
      
      setState({ status: 'error', error: errMsg });
    }
  };

  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-blue-50/50">
        <div className="max-w-2xl w-full glass-effect rounded-[2.5rem] p-10 shadow-2xl border border-white text-center animate-in fade-in zoom-in duration-500">
          <div className="inline-flex items-center justify-center p-4 bg-blue-600 text-white rounded-3xl shadow-xl shadow-blue-200 mb-8 animate-bounce">
            <Activity size={40} />
          </div>
          <h2 className="text-sm font-black text-blue-600 uppercase tracking-[0.3em] mb-2">Node Initialization</h2>
          <h1 className="text-5xl font-black text-slate-900 mb-6 tracking-tighter">Aura-Align</h1>
          
          <div className="mb-8 p-6 bg-blue-50 rounded-3xl border border-blue-100">
            <div className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-4">Select Regional Target Node</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-[400px] overflow-y-auto p-1 scrollbar-thin scrollbar-thumb-blue-200">
              {GLOBAL_LANGUAGES.map((lang) => (
                <button
                  key={lang.name}
                  onClick={() => setTargetLang(lang)}
                  className={`flex flex-col items-start px-4 py-3 rounded-2xl transition-all border text-left ${targetLang.name === lang.name ? 'bg-white border-blue-200 shadow-md ring-2 ring-blue-50' : 'bg-transparent border-transparent hover:bg-white/50'}`}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="text-sm font-black text-slate-900">{lang.label}</div>
                    {targetLang.name === lang.name && <ShieldCheck className="text-blue-600" size={14} />}
                  </div>
                  <div className="text-[9px] text-blue-400 uppercase tracking-widest font-bold">{lang.region}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <button onClick={() => setInitialized(true)} className="w-full py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-lg transition-all shadow-xl shadow-blue-200">
              Bido Oge / Launch Node
            </button>
            {history.length > 0 && (
              <button onClick={() => setIsHistoryOpen(true)} className="w-full py-3 bg-white border border-blue-100 text-blue-600 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 hover:bg-blue-50/50">
                <History size={16} /> View History ({history.length})
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 md:py-12 animate-in fade-in duration-1000">
      {showMicGuide && <MicrophoneGuide onClose={() => setShowMicGuide(false)} />}
      
      {isHistoryOpen && (
        <div className="fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-md bg-white h-full shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col">
            <div className="p-6 bg-blue-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <History size={20} className="text-white" />
                <h2 className="text-lg font-bold">Session History</h2>
              </div>
              <button onClick={() => setIsHistoryOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {history.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-blue-200 gap-4 opacity-50">
                  <BookOpen size={48} />
                  <p className="font-bold uppercase text-[10px] tracking-widest">No sessions saved yet</p>
                </div>
              ) : (
                history.map((session) => (
                  <div 
                    key={session.id}
                    onClick={() => loadSession(session)}
                    className="p-4 bg-blue-50/30 border border-blue-100 rounded-2xl cursor-pointer hover:border-blue-400 hover:shadow-md transition-all group"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="text-[10px] font-black text-blue-400 uppercase tracking-widest">
                        {new Date(session.timestamp).toLocaleString()}
                      </div>
                      <button 
                        onClick={(e) => deleteSession(session.id, e)}
                        className="p-1.5 text-blue-300 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <div className="text-sm font-bold text-slate-900 mb-1 line-clamp-1">{session.inputText || 'Multimodal/Image Analysis'}</div>
                    <div className="flex items-center gap-2">
                      <div className="px-2 py-0.5 bg-blue-100 text-blue-600 rounded text-[9px] font-black uppercase tracking-widest">
                        {session.targetLanguage}
                      </div>
                      <div className="text-[9px] text-blue-400 font-bold uppercase tracking-widest">
                        Safety: {(session.data.jaccardScore * 100).toFixed(0)}%
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      <header className="mb-12 text-center relative">
        <button onClick={() => setInitialized(false)} className="absolute left-0 top-0 p-2 text-blue-400 hover:text-blue-900 transition-colors"><ChevronDown className="rotate-90" size={20} /></button>
        <div className="absolute right-0 top-0 flex gap-2">
          <button onClick={() => setIsHistoryOpen(true)} className="p-2 text-blue-400 hover:text-blue-900 transition-colors relative">
            <History size={20} />
            {history.length > 0 && <span className="absolute top-1 right-1 w-2 h-2 bg-blue-600 rounded-full border border-white" />}
          </button>
          <button onClick={() => setShowMicGuide(true)} className="p-2 text-blue-400 hover:text-blue-900 transition-colors"><HelpCircle size={20} /></button>
        </div>
        <div className="inline-flex items-center justify-center p-3 bg-blue-600 text-white rounded-2xl shadow-xl shadow-blue-200 mb-6"><Activity size={32} /></div>
        <h1 className="text-4xl font-black text-slate-900 tracking-tighter mb-1">AURA-ALIGN</h1>
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center justify-center gap-2 text-blue-600 font-bold text-xs uppercase tracking-widest">
            <Globe size={14} /> Global Node: {targetLang.name} v3.1
          </div>
          {feedbackCount > 0 && (
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 text-[9px] font-black rounded-full border border-blue-200 animate-pulse">
              <Zap size={10} fill="currentColor" /> ADAPTIVE TRAINING: {feedbackCount} SESSIONS
            </div>
          )}
        </div>
      </header>

      <div className="grid grid-cols-1 gap-8">
        {state.status === 'error' && (
          <div className="p-8 bg-white border-2 border-red-200 rounded-[2.5rem] animate-in slide-in-from-top-4 duration-500 shadow-xl shadow-red-100/30">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-red-600 text-white rounded-2xl shadow-lg shadow-red-200">
                <AlertCircle size={28} />
              </div>
              <div>
                <h2 className="text-xl font-black text-red-600 uppercase tracking-tighter">Medical Node Error</h2>
                <p className="text-xs text-red-400 font-black uppercase tracking-widest">Critical Session Interruption</p>
              </div>
            </div>
            <p className="text-red-800 font-bold text-lg mb-8 leading-relaxed">
              {state.error || 'An unexpected failure occurred in the crisis communication pipeline.'}
            </p>
            <div className="flex gap-4">
              <button 
                onClick={resetState}
                className="flex-1 py-4 bg-white border-2 border-red-100 text-red-600 font-bold rounded-2xl hover:bg-red-50 transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                <X size={20} /> Reset System
              </button>
              <button 
                onClick={() => {
                  if (isLiveActive) startLiveVoice();
                  else handleProcess();
                }}
                className="flex-1 py-4 bg-red-600 text-white font-bold rounded-2xl hover:bg-red-700 shadow-lg shadow-red-200 transition-all flex items-center justify-center gap-2"
              >
                <RefreshCw size={20} /> Reconnect Node
              </button>
            </div>
          </div>
        )}

        {state.status !== 'completed' && state.status !== 'error' && (
          <div className="glass-effect p-8 rounded-[2rem] shadow-xl shadow-blue-200/30 border border-white">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-600 text-white rounded-lg"><MessageSquare size={20} /></div>
                <h2 className="text-xl font-bold">Multimodal Intake</h2>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={isLiveActive ? stopLiveVoice : startLiveVoice}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all ${isLiveActive ? 'bg-red-600 text-white ring-4 ring-red-100 shadow-lg shadow-red-100' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}
                >
                  {isLiveActive ? <MicOff size={18} /> : <Mic size={18} />}
                  {isLiveActive ? 'Stop Multimodal' : 'Live Mode'}
                </button>
              </div>
            </div>

            {!isLiveActive ? (
              <>
                <textarea
                  className="w-full h-40 p-5 rounded-2xl bg-blue-50/30 border-none ring-1 ring-blue-100 focus:ring-2 focus:ring-blue-600 transition-all text-lg resize-none placeholder:text-blue-200"
                  placeholder={`Describe medical emergency or paste reports for ${targetLang.name} translation...`}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                />
                <div className="mt-6 flex flex-wrap gap-4 items-center">
                  <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white border border-blue-100 hover:bg-blue-50 font-semibold text-blue-700 relative overflow-hidden">
                    {image ? (
                      <div className="absolute inset-0 bg-blue-500/10 flex items-center justify-center">
                        <CheckCircle2 size={14} className="text-blue-600" />
                      </div>
                    ) : null}
                    <Camera size={18} /> {image ? 'Image Ready' : 'Attach Image'}
                  </button>
                  <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                  <div className="flex-1" />
                  <button disabled={(!inputText && !image) || state.status === 'processing'} onClick={handleProcess} className="flex items-center gap-2 px-8 py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold transition-all shadow-lg shadow-blue-200">
                    {state.status === 'processing' ? <Loader2 className="animate-spin" /> : <Send size={20} />}
                    {state.status === 'processing' ? 'Processing...' : 'Secure Translate'}
                  </button>
                </div>
              </>
            ) : (
              <div className="flex flex-col md:flex-row gap-6">
                <div className="w-full md:w-1/3 space-y-4">
                  <div className="relative rounded-3xl overflow-hidden bg-slate-900 aspect-video md:aspect-square shadow-2xl border-4 border-white group">
                    <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]" />
                    <canvas ref={canvasRef} className="hidden" />
                    <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1 bg-blue-600 text-white text-[10px] font-black rounded-full animate-pulse">
                      LIVE VISION
                    </div>
                  </div>
                  <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
                    <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                      <ShieldCheck size={12} className="text-blue-500" /> AI Alignment Status
                    </h4>
                    <p className="text-xs text-blue-600 font-medium">Model is processing environmental visuals & audio tokens in real-time.</p>
                  </div>
                </div>

                <div className="flex-1 min-h-[300px] bg-blue-950 rounded-[2rem] p-8 overflow-y-auto space-y-4 shadow-inner relative">
                  <div className="sticky top-0 right-0 flex justify-end mb-4">
                    <div className="px-3 py-1 bg-blue-500 text-white text-[10px] font-black rounded-full animate-pulse shadow-lg shadow-blue-900/50">PANIC MONITOR ACTIVE</div>
                  </div>
                  {state.transcriptions?.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-48 text-blue-400 gap-4">
                      <Loader2 className="animate-spin" size={32} />
                      <p className="text-sm font-bold uppercase tracking-widest">Listening for multimodal input...</p>
                    </div>
                  )}
                  {state.transcriptions?.map((turn, i) => (
                    <div key={i} className={`flex gap-3 animate-in slide-in-from-bottom-2 ${turn.role === 'model' ? 'flex-row' : 'flex-row-reverse'}`}>
                      <div className={`p-5 rounded-3xl max-w-[85%] ${turn.role === 'model' ? 'bg-white/10 text-white border border-white/20 shadow-xl' : 'bg-blue-600 text-white shadow-lg shadow-blue-900/40'}`}>
                        <div className="flex items-center gap-2 mb-2 opacity-50 text-[10px] font-black uppercase tracking-widest">
                          {turn.role === 'model' ? <Activity size={12} /> : <User size={12} />}
                          {turn.role === 'model' ? 'Aura Guard' : 'Voice Input'}
                        </div>
                        <p className="text-base font-medium leading-relaxed tracking-tight">{turn.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {state.status === 'processing' && (
          <div className="text-center py-20 bg-white/50 rounded-[2.5rem] border border-white">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-8"></div>
            <p className="font-black text-slate-900 text-2xl tracking-tighter">{state.step}</p>
            <p className="text-blue-400 text-sm mt-2 font-bold uppercase tracking-widest">Applying Human Corrections & Verifying Tokens</p>
          </div>
        )}

        {state.status === 'completed' && state.data && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center justify-between">
              <button onClick={resetState} className="text-xs font-black text-blue-400 hover:text-blue-900 uppercase tracking-widest flex items-center gap-2 group transition-colors">
                <span className="group-hover:-translate-x-1 transition-transform">&larr;</span> Reset System
              </button>
              <div className="flex items-center gap-3">
                <button 
                  onClick={saveCurrentSession}
                  className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${isSaved ? 'bg-emerald-600 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                >
                  {isSaved ? <CheckCircle2 size={14} /> : <Save size={14} />}
                  {isSaved ? 'Session Saved' : 'Save Session'}
                </button>
                <div className="px-4 py-1.5 bg-blue-950 text-white text-[10px] font-black rounded-full border border-blue-800">NODE: EN-{targetLang.name.substring(0,2).toUpperCase()} READY</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <PanicAlert data={state.data.panic} />
              <LinguisticAudit score={state.data.jaccardScore} isRisk={state.data.criticalRisk} tokens={state.data.tokens} />
            </div>

            <div className="glass-effect rounded-[2.5rem] overflow-hidden border border-white shadow-2xl shadow-blue-100">
              <div className="bg-blue-950 text-white p-6 flex items-center justify-between w-full">
                <div className="flex items-center gap-3">
                  <Languages size={20} className="text-blue-400" />
                  <h3 className="font-bold uppercase tracking-tighter">Interactive Translation ({targetLang.name})</h3>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-black text-blue-400 uppercase tracking-widest">
                  <Info size={14} /> Medical Glossary Hover Active
                </div>
              </div>
              
              <div className="p-10 space-y-10 bg-white">
                <InteractiveText text={state.data.igboTranslation} language={targetLang.name} />

                <hr className="border-blue-50" />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  <div className="space-y-6">
                    <div className="flex items-center gap-2 text-blue-300 uppercase text-[10px] font-black tracking-widest border-b border-blue-50 pb-2">
                      <User size={14} /> Critical Patient Summary
                    </div>
                    <ul className="space-y-5">
                      {state.data.summary.map((point, i) => (
                        <li key={i} className="flex gap-4 text-slate-900 font-semibold leading-[1.6]">
                          <span className="shrink-0 w-8 h-8 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-black shadow-sm">
                            {i + 1}
                          </span>
                          <span className="text-base">{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="space-y-6">
                    <div className="flex items-center gap-2 text-blue-300 uppercase text-[10px] font-black tracking-widest border-b border-blue-50 pb-2">
                      <Heart size={14} /> Cultural & Local Context
                    </div>
                    <div className="p-8 bg-blue-50/50 rounded-[2rem] text-base italic text-slate-700 font-medium leading-[1.8] border border-blue-100 relative shadow-inner">
                      <div className="absolute top-0 right-8 transform -translate-y-1/2 p-2.5 bg-white rounded-full border border-blue-100 shadow-md">
                        <ShieldCheck className="text-blue-500" size={18} />
                      </div>
                      "{state.data.culturalNotes}"
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <TranslationFeedback 
              sourceText={inputText} 
              translation={state.data.igboTranslation} 
              language={targetLang.name} 
              auditScore={state.data.jaccardScore}
            />
          </div>
        )}
      </div>

      <footer className="mt-20 pt-8 border-t border-blue-100 text-center text-blue-400 text-[10px] font-black uppercase tracking-[0.4em]">
        Aura-Align • Mission Critical Medical Guard • {targetLang.region} Sector
      </footer>
    </div>
  );
};

export default App;
