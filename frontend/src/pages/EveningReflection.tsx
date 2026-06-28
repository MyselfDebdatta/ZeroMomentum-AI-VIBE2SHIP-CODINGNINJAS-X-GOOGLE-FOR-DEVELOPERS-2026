import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BookOpen, Sparkles, CheckCircle2, Loader2, ArrowRight, Clock, Trash2, Mic, Activity } from 'lucide-react';
import { createReflection, fetchReflections, deleteReflection } from '../services/api';
import { ContextBroadcast } from '../components/ContextBroadcast';

export const EveningReflection: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'reflect' | 'history'>('reflect');
  const [journalText, setJournalText] = useState('');
  const [interimText, setInterimText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = React.useRef<any>(null);
  const queryClient = useQueryClient();

  React.useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      
      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript + ' ';
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          setJournalText((prev) => prev + finalTranscript);
        }
        setInterimText(interimTranscript);
      };

      recognition.onerror = () => setIsRecording(false);
      recognition.onend = () => setIsRecording(false);
      recognitionRef.current = recognition;
    }
  }, []);

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
    } else {
      if (recognitionRef.current) {
        setInterimText('');
        recognitionRef.current.start();
        setIsRecording(true);
      } else {
        alert("Your browser does not support the Web Speech API. Try Chrome or Edge.");
      }
    }
  };

  const { data: history = [], isLoading: isLoadingHistory } = useQuery({
    queryKey: ['reflections'],
    queryFn: fetchReflections,
  });

  const analyzeMutation = useMutation({
    mutationFn: createReflection,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reflections'] });
      setJournalText('');
      setActiveTab('history');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteReflection,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reflections'] });
    },
  });

  const handleSubmit = () => {
    if (!journalText.trim()) return;
    if (isRecording) toggleRecording(); // Stop recording before submitting
    analyzeMutation.mutate(journalText);
  };

  const last21Days = Array.from({length: 21}).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (20 - i));
    return d.toISOString().split('T')[0];
  });

  const getMoodColor = (mood: string) => {
    const m = mood?.toLowerCase() || '';
    if (m.includes('flow') || m.includes('productive') || m.includes('motivated') || m.includes('excited') || m.includes('focused')) return 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]';
    if (m.includes('anxious') || m.includes('stressed') || m.includes('tired') || m.includes('frustrated') || m.includes('overwhelmed')) return 'bg-rose-500 shadow-[0_0_10px_rgba(225,29,72,0.5)]';
    if (m.includes('calm') || m.includes('neutral') || m.includes('reflective')) return 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]';
    return 'bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]'; // Default
  };

  return (
    <div className="space-y-6 w-full mx-auto relative min-h-full flex flex-col pb-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end pb-4 border-b border-slate-800/60 relative z-20 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-500/10 rounded-xl border border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.15)]">
            <BookOpen size={24} className="text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white uppercase tracking-wide flex items-center gap-3">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-indigo-100 to-slate-300 drop-shadow-sm">
                AI Evening Reflection Journal
              </span>
            </h1>
            <p className="text-sm text-slate-400 font-medium mt-1">
              Close your daily productivity loop through mindful, structured journaling and automated target planning.
            </p>
          </div>
        </div>
      </div>

      <div className="shrink-0 z-20 relative">
        <ContextBroadcast />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative p-[1px] rounded-2xl overflow-hidden group shadow-2xl shadow-indigo-900/10 flex-1 min-h-[600px] flex flex-col"
      >
        {/* Animated Gradient Border */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/30 via-blue-600/10 to-purple-600/30 opacity-30 transition-opacity duration-1000 group-hover:opacity-60 animate-pulse" />
        
        {/* Core Card */}
        <div className="relative flex-1 bg-slate-950/90 backdrop-blur-2xl border border-white/5 p-6 md:p-8 rounded-2xl flex flex-col z-10 overflow-hidden">
          {/* Background grid */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-indigo-900/10 via-slate-950/0 to-slate-950/0" />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:24px_24px] opacity-40" />

          {/* Header row with tabs */}
          <div className="relative z-20 flex justify-between items-center mb-8 border-b border-slate-800/60 pb-4">
            <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold max-w-md hidden md:block">
              Explain what went well, what blocked you, and how you felt today. The Motivation Agent will analyze your mood and secure tomorrow's priorities.
            </p>
            
            <div className="flex bg-slate-900/80 rounded-lg p-1 border border-slate-700/50">
              <button 
                onClick={() => setActiveTab('reflect')}
                className={`px-4 py-1.5 text-xs font-bold uppercase tracking-widest rounded-md transition-all ${activeTab === 'reflect' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shadow-inner' : 'text-slate-500 hover:text-slate-300'}`}
              >
                Reflect
              </button>
              <button 
                onClick={() => setActiveTab('history')}
                className={`px-4 py-1.5 text-xs font-bold uppercase tracking-widest rounded-md transition-all flex items-center gap-2 ${activeTab === 'history' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shadow-inner' : 'text-slate-500 hover:text-slate-300'}`}
              >
                History <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded-full">{history.length}</span>
              </button>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="relative z-20 flex-1 flex flex-col min-h-0 overflow-hidden">
            <AnimatePresence mode="wait">
              {activeTab === 'reflect' ? (
                <motion.div 
                  key="reflect" 
                  initial={{ opacity: 0, x: -10 }} 
                  animate={{ opacity: 1, x: 0 }} 
                  exit={{ opacity: 0, x: 10 }}
                  className="flex-1 flex flex-col h-full"
                >
                  <div className="relative flex-1 mb-6 flex flex-col">
                    <textarea
                      value={isRecording ? journalText + (interimText ? ' ' + interimText : '') : journalText}
                      onChange={(e) => setJournalText(e.target.value)}
                      disabled={isRecording}
                      placeholder="Today, I made great progress on the pitch slides but felt anxious about the algorithms assignment. Procrastinated for an hour in the afternoon..."
                      className={`flex-1 bg-slate-900/40 border border-slate-800 rounded-xl p-6 text-slate-300 text-sm leading-relaxed focus:outline-none focus:border-indigo-500/50 focus:bg-slate-900/60 transition-all resize-none shadow-inner ${isRecording ? 'opacity-80' : ''}`}
                    />
                    
                    {/* Voice-to-Text Mission Debrief Overlay */}
                    <div className="absolute bottom-4 right-4 flex items-center gap-3">
                      {isRecording && (
                        <div className="flex items-center gap-2 px-4 py-1.5 bg-rose-500/10 border border-rose-500/30 rounded-full shadow-[0_0_15px_rgba(225,29,72,0.2)]">
                          <div className="flex gap-1 items-center h-2">
                            <motion.div animate={{ height: [4, 12, 4] }} transition={{ repeat: Infinity, duration: 0.8 }} className="w-1 bg-rose-500 rounded-full" />
                            <motion.div animate={{ height: [4, 16, 4] }} transition={{ repeat: Infinity, duration: 0.6 }} className="w-1 bg-rose-500 rounded-full" />
                            <motion.div animate={{ height: [4, 8, 4] }} transition={{ repeat: Infinity, duration: 1.0 }} className="w-1 bg-rose-500 rounded-full" />
                          </div>
                          <span className="text-[10px] uppercase font-black tracking-widest text-rose-400 ml-1">Live Interrogation...</span>
                        </div>
                      )}
                      <button 
                        onClick={toggleRecording}
                        className={`p-3 rounded-xl transition-all shadow-lg border ${isRecording ? 'bg-rose-500 hover:bg-rose-600 border-rose-400 shadow-[0_0_20px_rgba(225,29,72,0.6)]' : 'bg-slate-800 hover:bg-indigo-600 border-slate-700 hover:border-indigo-500'}`}
                        title="Mission Debrief (Voice to Text)"
                      >
                        <Mic size={20} className={isRecording ? 'text-white' : 'text-slate-400'} />
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={handleSubmit}
                    disabled={!journalText.trim() || analyzeMutation.isPending}
                    className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-black uppercase tracking-widest text-sm py-4 rounded-xl shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:shadow-[0_0_30px_rgba(79,70,229,0.5)] transition-all disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed border border-indigo-400/30"
                  >
                    {analyzeMutation.isPending ? (
                      <><Loader2 size={18} className="animate-spin" /> Analyzing Cognition...</>
                    ) : (
                      <><Sparkles size={18} /> Analyze & Complete Day</>
                    )}
                  </button>
                </motion.div>
              ) : (
                <motion.div 
                  key="history" 
                  initial={{ opacity: 0, x: 10 }} 
                  animate={{ opacity: 1, x: 0 }} 
                  exit={{ opacity: 0, x: -10 }}
                  className="flex-1 overflow-y-auto pr-2 custom-scrollbar flex flex-col gap-6 pb-6"
                >
                  {/* Cognitive State Heatmap */}
                  {history.length > 0 && (
                    <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-5 shrink-0 shadow-inner">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                          <Activity size={14} className="text-indigo-400" /> Cognitive State Tracker (21 Days)
                        </h4>
                      </div>
                      <div className="flex gap-2 justify-between">
                        {last21Days.map((dateStr) => {
                           const entry = history.find((e: any) => e.createdAt.startsWith(dateStr));
                           return (
                             <div 
                               key={dateStr}
                               title={entry ? `${dateStr}: ${entry.moodDetection}` : dateStr}
                               className={`flex-1 aspect-square rounded-md border ${entry ? getMoodColor(entry.moodDetection) + ' border-transparent' : 'bg-slate-800/30 border-slate-700/30'} transition-all hover:scale-110 cursor-help`}
                             />
                           )
                        })}
                      </div>
                      <div className="flex justify-between mt-3 text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                         <span>21 Days Ago</span>
                         <span>Today</span>
                      </div>
                    </div>
                  )}

                  {isLoadingHistory ? (
                    <div className="flex justify-center items-center py-20 text-slate-500">
                      <Loader2 className="animate-spin mr-2" size={20} /> Loading archives...
                    </div>
                  ) : history.length === 0 ? (
                    <div className="flex flex-col items-center justify-center text-center py-20 border border-slate-800/50 rounded-xl bg-slate-900/30 backdrop-blur-sm shadow-inner">
                      <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-4">
                        <BookOpen size={28} className="text-indigo-400" />
                      </div>
                      <h3 className="text-sm font-black text-white uppercase tracking-widest mb-2">No Reflections Yet</h3>
                      <p className="text-xs text-slate-500 font-medium max-w-sm">
                        Complete your first day above to start building your cognitive history and tomorrow's lock-in priorities.
                      </p>
                    </div>
                  ) : (
                    history.map((entry: any) => (
                      <div key={entry.id} className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-6 flex flex-col gap-4 shadow-lg hover:border-indigo-500/30 transition-colors group relative overflow-hidden">
                        <div className="flex justify-between items-start border-b border-slate-800 pb-4">
                          <div className="flex items-center gap-3">
                            <span className="bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-md text-xs font-black uppercase tracking-widest border border-indigo-500/30">
                              {entry.moodDetection}
                            </span>
                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-1.5">
                              <Clock size={12} className="text-slate-600" />
                              {new Date(entry.createdAt).toLocaleDateString()} &bull; {new Date(entry.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <button
                            onClick={() => {
                              if(window.confirm('Delete this reflection history?')) {
                                deleteMutation.mutate(entry.id);
                              }
                            }}
                            disabled={deleteMutation.isPending}
                            className="text-slate-500 hover:text-red-400 transition-colors p-1 rounded-md hover:bg-red-400/10"
                            title="Delete Entry"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                        
                        <div className="space-y-4">
                          <div>
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Coach Insight</h4>
                            <p className="text-sm text-slate-300 italic leading-relaxed border-l-2 border-indigo-500/50 pl-4 py-1">
                              "{entry.coachInsight}"
                            </p>
                          </div>
                          
                          <div className="bg-slate-950/50 rounded-lg p-5 border border-slate-800/80 shadow-inner">
                            <h4 className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                              <CheckCircle2 size={14} /> Locked-In Priorities for Tomorrow
                            </h4>
                            <ul className="space-y-3">
                              {Array.isArray(entry.lockInPriorities) && entry.lockInPriorities.map((priority: string, idx: number) => (
                                <li key={idx} className="flex items-start gap-3">
                                  <div className="w-5 h-5 rounded-md bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-[10px] font-bold text-emerald-500 shrink-0 mt-0.5">
                                    {idx + 1}
                                  </div>
                                  <span className="text-sm text-slate-200 font-medium leading-relaxed">{priority}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
