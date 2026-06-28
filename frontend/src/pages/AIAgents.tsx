import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchAILogs, commandHubChat, clearCommandHubLogs, clearAllAILogs } from '../services/api';
import { Bot, Terminal, Activity, Mic, Send, Volume2, Loader2, Zap, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { ContextBroadcast } from '../components/ContextBroadcast';

const AGENT_TABS = [
  'AI Orchestrator', 'Task Intel Agent', 'Scheduler Agent', 
  'Context Agent', 'Habit Agent', 'Recovery Agent', 
  'Motivation Coach', 'Execution Agent'
];

const AGENT_WELCOME_MESSAGES: Record<string, string> = {
  'AI Orchestrator': 'Welcome to ZeroMomentum AI. As your AI Orchestrator, I can coordinate your workflow, manage system telemetry, and assign tasks to specialized agents. What is our objective today?',
  'Task Intel Agent': 'Task Intel Agent online. Provide me with a high-level goal, and I will break it down, estimate completion times, and calculate your miss risk.',
  'Scheduler Agent': 'Scheduler Agent ready. How much deep work time do you have available today? I will organize your tasks into an optimal chronological sequence.',
  'Context Agent': 'Context Agent active. I am monitoring your real-world variables. Need advice on how to sequence your day based on environmental constraints?',
  'Habit Agent': 'Habit Agent standing by. Consistency is key. Want an update on your active streaks or need help diagnosing why a habit is slipping?',
  'Recovery Agent': 'Recovery Agent deployed. Overwhelmed? Tell me what is stressing you out, and I will help you defer low-priority tasks and build a catch-up sprint.',
  'Motivation Coach': 'Motivation Coach here. Mental endurance is the foundation of productivity. Do you need a reality check, a pep talk, or a burnout countermeasure?',
  'Execution Agent': 'Execution Agent active. Less talk, more action. Tell me your immediate goal and I will generate a step-by-step blueprint or study guide.'
};

interface ChatMessage {
  role: 'user' | 'agent';
  text: string;
  timestamp: string;
}

const renderMessageText = (text: string) => {
  const lines = text.split('\n');
  return lines.map((line, lineIdx) => {
    // Match bullet points (* or - at start of line)
    const bulletMatch = line.trim().match(/^[*|-]\s+(.*)/);
    
    let content = line;
    let isBullet = false;
    
    if (bulletMatch) {
      content = bulletMatch[1];
      isBullet = true;
    }

    const parts = content.split(/(\*\*.*?\*\*)/g);
    const parsedParts = parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-bold">{part.slice(2, -2)}</strong>;
      }
      return <span key={i}>{part}</span>;
    });

    if (isBullet) {
      return (
        <div key={lineIdx} className="flex gap-3 mt-1.5 mb-1.5 ml-2">
          <span className="font-bold select-none">•</span>
          <div className="flex-1">{parsedParts}</div>
        </div>
      );
    }

    return (
      <div key={lineIdx} className="min-h-[1.25rem]">
        {parsedParts}
      </div>
    );
  });
};

export const AIAgents: React.FC = () => {
  const [activeAgent, setActiveAgent] = useState(() => {
    return localStorage.getItem('lastActiveAgent') || AGENT_TABS[0];
  });
  const [input, setInput] = useState('');
  const [chatHistory, setChatHistory] = useState<Record<string, ChatMessage[]>>(() => {
    const saved = localStorage.getItem('agentChatHistory');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error("Error parsing chat history:", e); }
    }
    return {};
  });
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    localStorage.setItem('agentChatHistory', JSON.stringify(chatHistory));
  }, [chatHistory]);

  useEffect(() => {
    localStorage.setItem('lastActiveAgent', activeAgent);
  }, [activeAgent]);

  const { data: logs, isLoading: isLoadingLogs } = useQuery({
    queryKey: ['ai-logs'],
    queryFn: fetchAILogs,
  });

  const chatMutation = useMutation({
    mutationFn: async (msg: string) => commandHubChat(activeAgent, msg),
    onSuccess: (data, variables) => {
      setChatHistory(prev => ({
        ...prev,
        [activeAgent]: [
          ...(prev[activeAgent] || []),
          { role: 'agent', text: data.response, timestamp: new Date().toISOString() }
        ]
      }));
      queryClient.invalidateQueries({ queryKey: ['ai-logs'] });
    }
  });

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || chatMutation.isPending) return;

    const userMsg = input.trim();
    setInput('');
    
    setChatHistory(prev => ({
      ...prev,
      [activeAgent]: [
        ...(prev[activeAgent] || []),
        { role: 'user', text: userMsg, timestamp: new Date().toISOString() }
      ]
    }));

    chatMutation.mutate(userMsg);
  };

  const handleClearChat = async () => {
    const newHistory = { ...chatHistory };
    delete newHistory[activeAgent];
    setChatHistory(newHistory);
    try {
      await clearCommandHubLogs();
      queryClient.invalidateQueries({ queryKey: ['ai-logs'] });
    } catch (e) {
      console.error('Failed to clear logs:', e);
    }
  };

  const handleClearAllLogs = async () => {
    try {
      await clearAllAILogs();
      queryClient.invalidateQueries({ queryKey: ['ai-logs'] });
    } catch (e) {
      console.error('Failed to clear all logs:', e);
    }
  };

  const handleListen = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser. Try Chrome or Edge.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    
    recognition.onstart = () => setIsListening(true);
    
    recognition.onresult = (e: any) => {
      let interimTranscript = '';
      let finalTranscript = '';
      
      for (let i = e.resultIndex; i < e.results.length; ++i) {
        if (e.results[i].isFinal) {
          finalTranscript += e.results[i][0].transcript;
        } else {
          interimTranscript += e.results[i][0].transcript;
        }
      }
      
      // Update input smoothly
      if (finalTranscript) {
        setInput(prev => (prev + ' ' + finalTranscript).trim());
      } else if (interimTranscript) {
        // Just a simple visual feedback for now, 
        // to avoid messy state loops, we only append final transcripts.
      }
    };
    
    recognition.onerror = (e: any) => {
      console.error('Speech recognition error:', e.error);
      setIsListening(false);
      alert(`Microphone error: ${e.error}. Please ensure microphone permissions are granted.`);
    };
    
    recognition.onend = () => setIsListening(false);
    
    try {
      recognition.start();
    } catch (err) {
      console.error('Speech recognition start error:', err);
    }
  };

  const handleSpeak = (text: string) => {
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    if ((chatHistory[activeAgent] && chatHistory[activeAgent].length > 0) || chatMutation.isPending) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [chatHistory, activeAgent, chatMutation.isPending]);

  const currentChat = chatHistory[activeAgent] || [];

  return (
    <div className="space-y-6 flex flex-col min-h-full pb-8 w-full max-w-6xl mx-auto">
      
      {/* RESTORED HUD Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-slate-800/60 pb-6 shrink-0">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-purple-500/20 rounded-lg border border-purple-500/30 shrink-0">
            <Bot className="text-purple-400" size={28} /> 
          </div>
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-black text-white uppercase tracking-wide drop-shadow-md">
              Agent Command Hub
            </h1>
            <p className="text-sm text-slate-400 font-medium flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse shadow-[0_0_8px_rgba(192,132,252,0.8)]" />
              Managing active LLM nodes and execution telemetry.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="px-5 py-2.5 border border-purple-500/30 text-emerald-400 text-sm font-black uppercase tracking-widest rounded-xl bg-purple-500/10 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> LIVE SYNC
          </div>
        </div>
      </div>

      <div className="shrink-0 z-20 relative">
        <ContextBroadcast />
      </div>

      {/* COMMAND HUB WINDOW */}
      <div className="flex-1 flex flex-col bg-[#0b0f19] border border-slate-800/80 rounded-2xl overflow-hidden shadow-2xl shadow-indigo-900/10 min-h-[600px] relative">

        {/* Internal Window Header & Control Panel */}
        <div className="flex flex-col border-b border-slate-800/80 bg-[#0a0d14] relative z-10">
          
          {/* Top Branding Bar */}
          <div className="flex justify-between items-center px-6 py-3 border-b border-slate-800/40">
            <div className="flex items-center gap-3">
              <div className="p-1.5 bg-pink-500/10 rounded-md border border-pink-500/20 shadow-[0_0_10px_rgba(236,72,153,0.1)]">
                <Terminal className="text-pink-400" size={16} /> 
              </div>
              <h2 className="text-xs font-black text-slate-300 uppercase tracking-widest">
                AI Console Window
              </h2>
            </div>
            <div className="flex items-center gap-2">
               <span className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-pulse" />
               <span className="text-[10px] text-pink-500/80 font-bold uppercase tracking-widest">System Online</span>
            </div>
          </div>

          {/* Agent Selection Panel */}
          <div className="px-6 py-5 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-[#0b0f19] to-slate-900/50">
            <div>
              <h3 className="text-slate-100 font-bold text-sm tracking-wide mb-1 flex items-center gap-2">
                <Bot size={16} className="text-pink-400" /> Choose Your Specialist Agent
              </h3>
              <p className="text-xs text-slate-400">Select from <span className="text-pink-400 font-semibold border-b border-pink-500/30">8 specialized personas</span> for targeted assistance.</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleClearChat}
                className="p-2.5 bg-[#13192b] hover:bg-red-500/10 text-slate-400 hover:text-red-400 border border-slate-700/80 hover:border-red-500/50 rounded-lg transition-all group shadow-sm"
                title="Clear Chat History"
              >
                <Trash2 size={16} className="group-hover:scale-110 transition-transform" />
              </button>
              <div className="relative w-full md:w-64 group">
                <select
                  value={activeAgent}
                  onChange={(e) => setActiveAgent(e.target.value)}
                  className="w-full appearance-none bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-400 hover:to-rose-400 border-none text-white font-bold py-3 px-5 pr-10 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-400 cursor-pointer shadow-[0_4px_15px_rgba(236,72,153,0.3)] transition-all"
                >
                  {AGENT_TABS.map(agent => (
                    <option key={agent} value={agent} className="bg-slate-900 text-white">{agent}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4">
                  <Zap size={16} className="text-white/90 drop-shadow-md" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar min-h-0 bg-[#0a0d14] relative z-10">
          {currentChat.length === 0 ? (
            <div className="border border-slate-800 rounded-xl bg-slate-900 p-6 flex flex-col gap-4 max-w-3xl">
              <div className="flex items-center justify-between text-xs font-black text-slate-500 uppercase tracking-widest">
                <span className="flex items-center gap-2"><Bot size={16} className="text-pink-400"/> {activeAgent}</span>
              </div>
              <p className="text-slate-300 text-sm leading-relaxed">
                {AGENT_WELCOME_MESSAGES[activeAgent] || 'Agent ready.'}
              </p>
            </div>
          ) : (
            currentChat.map((msg, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={`p-5 rounded-2xl border max-w-3xl shadow-lg ${
                  msg.role === 'user' 
                    ? 'border-pink-800/80 bg-pink-950/80 ml-auto rounded-tr-sm text-pink-50' 
                    : 'border-indigo-800/80 bg-indigo-950/80 mr-auto rounded-tl-sm text-indigo-50'
                }`}
              >
                <div className="flex items-center justify-between mb-3 gap-4">
                  <div className="flex items-center gap-3">
                    <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md ${msg.role === 'user' ? 'bg-pink-900 text-pink-200' : 'bg-indigo-600 text-indigo-100'}`}>
                      {msg.role === 'user' ? 'YOU' : activeAgent}
                    </span>
                    <span className={`text-[10px] font-bold ${msg.role === 'user' ? 'text-pink-300/60' : 'text-indigo-400/60'}`}>
                      {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </span>
                  </div>
                  {msg.role === 'agent' && (
                    <button 
                      onClick={() => handleSpeak(msg.text)}
                      className={`hover:text-indigo-400 transition-colors ${isSpeaking ? 'text-indigo-400 animate-pulse' : 'text-indigo-400/50'}`}
                      title="Read Aloud"
                    >
                      <Volume2 size={16} />
                    </button>
                  )}
                </div>
                <div className={`text-sm whitespace-pre-wrap leading-relaxed`}>
                  {renderMessageText(msg.text)}
                </div>
              </motion.div>
            ))
          )}
          {chatMutation.isPending && (
            <div className="p-4 rounded-xl border border-indigo-900/50 bg-indigo-950/50 max-w-3xl mr-auto flex items-center gap-3 text-indigo-200 text-sm">
              <Loader2 size={16} className="animate-spin text-indigo-400" />
              Synthesizing response...
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-6 bg-[#0a0d14] border-t border-slate-800/60 shrink-0 relative z-10">
          <form onSubmit={handleSubmit} className="flex items-center gap-3 max-w-5xl mx-auto">
            <div className="flex-1 bg-[#0b0f19] border border-slate-700 rounded-full px-5 py-3.5 flex items-center gap-3 focus-within:border-pink-300/60 focus-within:ring-2 focus-within:ring-pink-300/20 transition-all shadow-lg">
              <button 
                type="button" 
                onClick={handleListen}
                className={`text-slate-500 hover:text-pink-300 transition-colors ${isListening ? 'text-red-400 animate-pulse' : ''}`}
                title="Dictate with voice"
              >
                <Mic size={20} />
              </button>
              <input 
                type="text" 
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder={`Instruct ${activeAgent}...`}
                className="flex-1 bg-transparent border-none text-slate-200 text-sm focus:outline-none placeholder-slate-600 font-medium"
              />
              <button 
                type="submit"
                disabled={!input.trim() || chatMutation.isPending}
                className="text-pink-300 hover:text-pink-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-110 active:scale-95"
              >
                <Send size={18} />
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Action Logs */}
      <div className="bg-[#0b0f19] border border-slate-800/80 rounded-2xl overflow-hidden shadow-2xl shadow-emerald-900/10 shrink-0 mt-8 relative">
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-800/60 bg-slate-900/40 relative z-10 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-emerald-500/10 rounded-md border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.15)]">
              <Terminal className="text-emerald-400" size={18} /> 
            </div>
            <h2 className="text-sm font-black text-slate-200 uppercase tracking-widest drop-shadow-md">
              System Action Logs
            </h2>
          </div>
          
          <button 
            onClick={handleClearAllLogs}
            className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-red-400 bg-slate-800/50 hover:bg-red-500/10 border border-slate-700 hover:border-red-500/30 px-3 py-1.5 rounded-lg transition-all active:scale-95"
            title="Clear all system logs"
          >
            <Trash2 size={14} /> Clear Logs
          </button>
        </div>
        
        <div className="overflow-y-auto space-y-3 font-mono text-sm max-h-[300px] p-6 bg-[#0a0d14] custom-scrollbar relative z-10">
          {!isLoadingLogs && logs && logs.length > 0 ? logs.map((log: any, i: number) => (
            <div key={log.id} className="p-4 rounded-xl border border-slate-800/60 bg-slate-900/30 text-slate-300 shadow-sm hover:border-slate-700/80 transition-colors">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-slate-500 text-xs">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded text-xs">{log.agentName}</span>
              </div>
              <div className="pl-1 text-slate-300 font-medium">
                <span className="text-slate-500 mr-2">Action:</span> {log.action}
              </div>
              {log.details && (
                <div className="mt-3">
                  <pre className="text-[11px] text-emerald-300/70 overflow-x-auto bg-[#05070a] border border-slate-800/80 p-3 rounded-lg custom-scrollbar">
                    {JSON.stringify(log.details, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )) : (
            <div className="text-slate-500 flex items-center gap-3 bg-slate-900/20 border border-slate-800/40 p-4 rounded-xl">
              <Activity size={16} className="text-slate-600" />
              No logs found in the database.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
