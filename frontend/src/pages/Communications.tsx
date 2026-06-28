import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Mail, Plus, RefreshCw, Inbox, CheckCircle2, Clock, Send, X, Check, History, ArrowLeft, Trash2, ListTodo } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { parseEmails, fetchTasks, deleteTask } from '../services/api';
import { AdvancedTaskCard, ConfirmModal } from './Tasks';
import { ContextBroadcast } from '../components/ContextBroadcast';

export const Communications: React.FC = () => {
  const [isSimulating, setIsSimulating] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  
  const [mockEmails, setMockEmails] = useState<any[]>(() => {
    const saved = localStorage.getItem('mockEmails');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.map((e: any) => ({ ...e, date: new Date(e.date) }));
      } catch (e) {
        return [];
      }
    }
    return [];
  });
  const [formData, setFormData] = useState({ from: '', subject: '', body: '' });

  const queryClient = useQueryClient();
  const [showHistory, setShowHistory] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [confirmConfig, setConfirmConfig] = useState<any>(null);

  const { data: tasks } = useQuery({
    queryKey: ['tasks'],
    queryFn: fetchTasks,
  });
  
  const allAiTasks = tasks?.filter((t: any) => t.cardNumber && t.cardNumber.startsWith('MAIL-')) || [];
  const activeAiTasks = allAiTasks.filter((t: any) => t.status !== 'completed' && t.status !== 'deleted');
  const historyAiTasks = allAiTasks.filter((t: any) => t.status === 'completed' || t.status === 'deleted');
  const displayAiTasks = showHistory ? historyAiTasks : activeAiTasks;

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  const showConfirm = (title: string, message: string, onConfirm: () => void, isDestructive = true) => {
    setConfirmConfig({ 
      title, 
      message, 
      onConfirm: () => {
        onConfirm();
        setConfirmConfig(null);
      }, 
      isDestructive 
    });
  };

  const handleClearHistory = () => {
    showConfirm(
      'Clear All History',
      'Are you sure you want to permanently delete all history tasks? This action cannot be undone and will permanently wipe these records from the database.',
      async () => {
        try {
          await Promise.all(historyAiTasks.map((t: any) => deleteTask(t.id)));
          queryClient.invalidateQueries({ queryKey: ['tasks'] });
          showToast('All AI history tasks permanently deleted.');
        } catch (e) {
          showToast('Error deleting history.');
        }
      }
    );
  };

  useEffect(() => {
    localStorage.setItem('mockEmails', JSON.stringify(mockEmails));
  }, [mockEmails]);

  const premiumCardStyle = "bg-slate-900/60 shadow-inner border border-slate-800/80 rounded-2xl p-6 relative overflow-hidden flex flex-col";

  const parseMutation = useMutation({
    mutationFn: parseEmails,
    onSuccess: (data) => {
      // Mark parsed emails as successfully parsed in the UI
      const parsedIds = data.parsed.map((p: any) => p.id);
      setMockEmails(prev => prev.map(email => 
        parsedIds.includes(email.id) ? { ...email, isParsed: true } : email
      ));
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
    onSettled: () => {
      setIsSyncing(false);
    }
  });

  const handleSimulate = () => {
    if (!formData.subject || !formData.body) return;
    setMockEmails([{ 
      ...formData, 
      id: Date.now().toString(), 
      date: new Date(),
      isParsed: false
    }, ...mockEmails]);
    setFormData({ from: '', subject: '', body: '' });
    setIsSimulating(false);
  };

  const handleSync = () => {
    setIsSyncing(true);
    const unparsed = mockEmails.filter(e => !e.isParsed);
    if (unparsed.length === 0) {
      setIsSyncing(false);
      return;
    }
    parseMutation.mutate({ emails: unparsed });
  };

  return (
    <div className="space-y-8 w-full mx-auto relative">
      <ConfirmModal 
        isOpen={!!confirmConfig} 
        {...confirmConfig} 
        onCancel={() => setConfirmConfig(null)} 
      />

      {createPortal(
        <div className={`fixed bottom-10 right-10 z-[100] transition-all duration-500 transform ${toastMsg ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0 pointer-events-none'}`}>
          <div className="bg-slate-800 border border-slate-700 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3">
            <CheckCircle2 className="text-emerald-500" size={20} />
            <span className="font-bold text-sm tracking-wide">{toastMsg}</span>
          </div>
        </div>,
        document.body
      )}

      {/* HUD Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-slate-800/60 pb-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-indigo-500/20 rounded-lg border border-indigo-500/30 shrink-0">
            <Mail className="text-indigo-400" size={28} /> 
          </div>
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-black text-white uppercase tracking-wide drop-shadow-md">
              Communications & Integrations
            </h1>
            <p className="text-sm text-slate-400 font-medium flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse shadow-[0_0_8px_rgba(129,140,248,0.8)]" />
              Monitoring external API pipelines and automated inbox syncing.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="px-5 py-2.5 border border-indigo-500/30 text-indigo-400 text-sm font-black uppercase tracking-widest rounded-xl bg-indigo-500/10 flex items-center gap-2">
            <CheckCircle2 size={18} /> Inboxes Synced
          </div>
        </div>
      </div>
      <ContextBroadcast />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left Column: Smart Gmail Inbox Sync */}
        <div className="bg-slate-900/60 shadow-inner border border-slate-800/80 rounded-2xl p-6 relative overflow-hidden flex flex-col lg:h-[600px]">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:24px_24px]" />
            
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 relative z-10">
            <h2 className="text-lg md:text-xl font-black text-white uppercase tracking-wide flex items-center gap-3 drop-shadow-md">
              <div className="p-1.5 bg-indigo-500/20 rounded-md border border-indigo-500/30 shadow-[0_0_10px_rgba(99,102,241,0.2)]">
                <Mail className="text-indigo-400" size={18} />
              </div>
              Smart Gmail Inbox Sync
            </h2>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setIsSimulating(true)}
                className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400 hover:text-white hover:border-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all"
                title="Simulate Incoming Email"
              >
                <Plus size={18} />
              </button>
              <button 
                onClick={handleSync}
                disabled={isSyncing || mockEmails.filter(e => !e.isParsed).length === 0}
                className="flex items-center gap-2 text-xs uppercase tracking-widest font-black px-5 py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-500 hover:to-indigo-500 shadow-[0_0_20px_rgba(79,70,229,0.4)] hover:shadow-[0_0_30px_rgba(79,70,229,0.6)] transition-all disabled:opacity-50 disabled:grayscale"
              >
                <RefreshCw size={14} className={isSyncing ? "animate-spin" : ""} />
                {isSyncing ? 'Parsing...' : 'Sync'}
              </button>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 relative flex flex-col overflow-hidden z-10">
            <AnimatePresence mode="wait">
              {isSimulating ? (
                <motion.div 
                  key="simulator"
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                  className="absolute inset-0 bg-slate-900/90 backdrop-blur-xl border border-slate-700 rounded-xl p-6 flex flex-col z-20 shadow-2xl"
                >
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Incoming Email Simulator</h3>
                    <button onClick={() => setIsSimulating(false)} className="text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-slate-300">
                      Cancel
                    </button>
                  </div>
                  
                  <div className="flex flex-col gap-4 flex-1">
                    <div className="grid grid-cols-2 gap-4">
                      <input 
                        type="text" placeholder="From (e.g. boss@corp.com)" 
                        value={formData.from} onChange={(e) => setFormData({...formData, from: e.target.value})}
                        className="bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500/50"
                      />
                      <input 
                        type="text" placeholder="Subject (e.g. Q3 Report Submission)" 
                        value={formData.subject} onChange={(e) => setFormData({...formData, subject: e.target.value})}
                        className="bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500/50"
                      />
                    </div>
                    <textarea 
                      placeholder="Email Body (e.g. Please submit the Q3 slide deck by Friday June 26th noon...)"
                      value={formData.body} onChange={(e) => setFormData({...formData, body: e.target.value})}
                      className="bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-blue-500/50 flex-1 resize-none"
                    />
                  </div>
                  
                  <button 
                    onClick={handleSimulate}
                    className="mt-4 w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold text-sm py-3 rounded-lg flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(79,70,229,0.3)] transition-all"
                  >
                    <Send size={16} /> Simulate Incoming Email
                  </button>
                </motion.div>
              ) : mockEmails.length > 0 ? (
                <motion.div key="inbox-list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 flex-1 overflow-y-auto pr-3 custom-scrollbar h-full">
                  {mockEmails.map((email, i) => (
                    <div key={email.id} className={`${email.isParsed ? 'bg-slate-950/40 border-emerald-900/30 opacity-60 hover:opacity-80' : 'bg-slate-800/40 border-slate-600 hover:border-indigo-500/50 hover:bg-slate-800/60 shadow-md hover:shadow-[0_0_20px_rgba(99,102,241,0.25)]'} border rounded-xl p-5 flex flex-col group hover:-translate-y-1 transition-all duration-300 relative overflow-hidden`}>
                      {email.isParsed && (
                        <div className="absolute top-3 right-3 text-emerald-500 flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest border border-emerald-500/20">
                          <Check size={12} /> Parsed
                        </div>
                      )}
                      <button 
                        onClick={(e) => { e.stopPropagation(); setMockEmails(prev => prev.filter(m => m.id !== email.id)); }}
                        className={`absolute top-3 ${email.isParsed ? 'right-24' : 'right-3'} p-1 hover:bg-slate-800 rounded text-slate-500 hover:text-rose-400 transition-colors`}
                        title="Delete Email"
                      >
                        <Trash2 size={14} />
                      </button>
                      <div className="flex justify-between items-start mb-2 pr-20">
                        <span className="text-xs font-bold text-slate-300">{email.from || 'Unknown Sender'}</span>
                      </div>
                      <h4 className={`text-sm font-bold mb-1 ${email.isParsed ? 'text-emerald-400' : 'text-white'}`}>{email.subject}</h4>
                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed pr-2">{email.body}</p>
                      <div className="mt-2 text-[10px] font-medium text-slate-500">
                        Received: {email.date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </div>
                    </div>
                  ))}
                </motion.div>
              ) : (
                <motion.div key="inbox-empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col items-center justify-center text-slate-500 opacity-60">
                  <div className="w-16 h-16 border border-slate-700 rounded-2xl flex items-center justify-center bg-slate-800/30 mb-4">
                    <Inbox size={28} className="text-slate-400" />
                  </div>
                  <h3 className="text-xs font-black uppercase tracking-widest mb-1">Inbox Clear</h3>
                  <p className="text-[10px] font-medium">Simulate an email with the '+' button above!</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right Column: Email Intelligence Capabilities */}
        <div className="bg-slate-900/60 shadow-inner border border-slate-800/80 rounded-2xl p-6 md:p-8 relative overflow-hidden flex flex-col lg:h-[600px]">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:24px_24px]" />

            <h2 className="text-lg md:text-xl font-black text-white uppercase tracking-wide mb-4 drop-shadow-md relative z-10">
              Email Intelligence Capabilities
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed font-medium mb-8 relative z-10">
              The autonomous <span className="font-bold text-indigo-300">Email Agent</span> actively reads custom messages parsed through your communications streams to isolate high-risk deliverables.
            </p>

            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-6 flex flex-col gap-8 mb-8 flex-1 relative z-10 shadow-inner">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20 mt-0.5 shrink-0 shadow-[0_0_10px_rgba(16,185,129,0.1)]">
                  <CheckCircle2 size={18} className="text-emerald-400" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-white tracking-wide uppercase mb-1">Automatic Extraction</h4>
                  <p className="text-xs text-slate-400 leading-relaxed font-medium">Converts natural language instructions (dates, descriptions, task sizes) into structured deadlines instantly.</p>
                </div>
              </div>
            
              <div className="flex items-start gap-4">
                <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20 mt-0.5 shrink-0 shadow-[0_0_10px_rgba(16,185,129,0.1)]">
                  <Clock size={18} className="text-emerald-400" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-white tracking-wide uppercase mb-1">Effort Audits</h4>
                  <p className="text-xs text-slate-400 leading-relaxed font-medium">AI parses the scope of the email to estimate required working hours and flags late submission penalty structures.</p>
                </div>
              </div>
            </div>

            <div className="relative z-10 bg-indigo-950/30 p-5 rounded-xl border border-indigo-500/20 shadow-inner flex items-start gap-3">
              <div className="mt-1 w-2 h-2 rounded-full bg-indigo-400 animate-pulse shadow-[0_0_8px_rgba(129,140,248,0.8)] shrink-0" />
              <p className="text-xs text-slate-300 font-medium leading-relaxed">
                <span className="font-black text-indigo-400 uppercase tracking-widest text-[10px] block mb-2 drop-shadow-sm">System Testing Protocol</span>
                Click the <span className="font-bold text-indigo-300">+</span> in Gmail Inbox Sync, write an email detailing a deadline, and click <span className="font-bold text-indigo-300">Simulate Incoming Email</span>. Then click <span className="font-bold text-indigo-300">Sync</span> to watch the autonomous AI parser create matching tasks dynamically!
              </p>
            </div>
        </div>

      </div>

      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mt-12 relative p-[1px] rounded-2xl overflow-hidden group shadow-2xl shadow-indigo-900/10 min-h-[50vh] flex flex-col"
      >
        {/* Animated Gradient Border */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/30 via-blue-600/10 to-purple-600/30 opacity-30 transition-opacity duration-1000 group-hover:opacity-60 animate-pulse" />
        
        {/* Core Card */}
        <div className="relative flex-1 bg-slate-950/90 backdrop-blur-2xl border border-white/5 p-8 rounded-2xl flex flex-col z-10 overflow-hidden">
          {/* Background grid & subtle glow */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-indigo-900/10 via-slate-950/0 to-slate-950/0" />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:24px_24px] opacity-40" />

          <div className="relative z-20 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10 border-b border-slate-800/60 pb-6">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl border shadow-lg ${showHistory ? 'bg-slate-800/50 border-slate-700 shadow-slate-900/50' : 'bg-indigo-500/10 border-indigo-500/20 shadow-indigo-900/30'}`}>
                {showHistory ? <History size={24} className="text-slate-400" /> : <CheckCircle2 size={24} className="text-indigo-400" />}
              </div>
              <div>
                <h1 className="text-2xl font-black text-white uppercase tracking-wide flex items-center gap-3">
                  {showHistory ? (
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-slate-300 to-slate-500">Historical AI Extractions</span>
                  ) : (
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-indigo-100 to-slate-300 drop-shadow-sm">Successfully Extracted Tasks</span>
                  )}
                  {showHistory && <span className="text-[10px] bg-slate-800/80 px-2 py-1 rounded text-slate-400 border border-slate-700 shadow-inner">READ-ONLY</span>}
                </h1>
                <p className="text-sm text-slate-400 font-medium mt-1">
                  {showHistory ? 'Historical log of all completed and deleted intelligence tasks.' : 'Tasks autonomously extracted and formulated by the Email Agent.'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 w-full md:w-auto">
              <button 
                onClick={() => setShowHistory(!showHistory)} 
                className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg font-bold text-xs uppercase tracking-wider transition-all duration-300 border shadow-lg hover:-translate-y-0.5 ${showHistory ? 'bg-gradient-to-b from-blue-500 to-blue-700 hover:from-blue-400 hover:to-blue-600 text-white border-blue-400/30 shadow-blue-500/30' : 'bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border-slate-700 hover:border-slate-600'}`}
              >
                {showHistory ? <><ArrowLeft size={16} /> Back to Active Load</> : <><History size={16} /> View History</>}
              </button>
              
              {showHistory && historyAiTasks.length > 0 && (
                <button 
                  onClick={handleClearHistory} 
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-slate-900 hover:bg-rose-950/40 text-rose-400 hover:text-rose-300 px-5 py-2.5 rounded-lg font-bold text-xs uppercase tracking-wider transition-all duration-300 border border-rose-900/50 hover:border-rose-500/50 shadow-[0_0_15px_rgba(225,29,72,0.1)] hover:shadow-[0_0_25px_rgba(225,29,72,0.3)] hover:-translate-y-0.5 shrink-0"
                >
                  <Trash2 size={16} /> Clear All History
                </button>
              )}
            </div>
          </div>
          
          {displayAiTasks.length === 0 ? (
            <div className="relative z-20 flex flex-col items-center justify-center text-center py-16 border border-slate-800/50 rounded-xl bg-slate-900/30 backdrop-blur-sm shadow-inner">
              <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-4">
                {showHistory ? <History size={28} className="text-indigo-400" /> : <ListTodo size={28} className="text-indigo-400" />}
              </div>
              <h3 className="text-sm font-black text-white uppercase tracking-widest mb-2">
                {showHistory ? 'No Historical Records' : 'No Active AI Tasks'}
              </h3>
              <p className="text-xs text-slate-500 font-medium max-w-sm">
                {showHistory 
                  ? 'There are no completed or deleted intelligence tasks in the database archive.' 
                  : 'The Email Agent is standing by. Sync an inbox to automatically extract deliverables into active workload.'}
              </p>
            </div>
          ) : (
            <div className="relative z-20 space-y-4">
              {displayAiTasks.map((task: any) => (
                <AdvancedTaskCard key={task.id} task={task} showToast={showToast} isHistory={showHistory} showConfirm={showConfirm} />
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
