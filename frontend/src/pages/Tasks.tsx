import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchTasks, updateTask, updateSubtask, deleteTask, chatWithAgent } from '../services/api';
import { useUIStore } from '../store/uiStore';
import { ContextBroadcast } from '../components/ContextBroadcast';
import { Clock, Plus, AlertCircle, CheckCircle2, ChevronDown, ChevronUp, ListTodo, Timer, Zap, Trash2, CheckCircle, History, ArrowLeft, Activity } from 'lucide-react';

export const ConfirmModal = ({ isOpen, title, message, onConfirm, onCancel, isDestructive = true }: any) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-md w-full p-6 transform transition-all animate-in zoom-in-95 duration-200">
        <div className="flex items-center gap-3 mb-4">
          <div className={`p-2 rounded-full ${isDestructive ? 'bg-rose-500/20 text-rose-500' : 'bg-blue-500/20 text-blue-500'}`}>
            <AlertCircle size={24} />
          </div>
          <h2 className="text-xl font-bold text-white">{title}</h2>
        </div>
        <p className="text-sm text-slate-400 mb-8 leading-relaxed">{message}</p>
        <div className="flex justify-end gap-3">
          <button 
            onClick={onCancel} 
            className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={onConfirm} 
            className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-semibold text-white transition-colors shadow-lg ${
              isDestructive ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-500/20' : 'bg-blue-600 hover:bg-blue-500 shadow-blue-500/20'
            }`}
          >
            {isDestructive && <Trash2 size={16} />} Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

export const Tasks: React.FC = () => {
  const { toggleTaskModal } = useUIStore();
  const queryClient = useQueryClient();
  const { data: tasks, isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: fetchTasks,
  });

  const [showHistory, setShowHistory] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [confirmConfig, setConfirmConfig] = useState<any>(null);

  const activeTasks = tasks?.filter((t: any) => t.status !== 'completed' && t.status !== 'deleted') || [];
  const historyTasks = tasks?.filter((t: any) => t.status === 'completed' || t.status === 'deleted') || [];

  const displayTasks = showHistory ? historyTasks : activeTasks;
  const regularTasks = displayTasks.filter((t: any) => !t.cardNumber || !t.cardNumber.startsWith('MAIL-'));

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
          await Promise.all(historyTasks.map((t: any) => deleteTask(t.id)));
          queryClient.invalidateQueries({ queryKey: ['tasks'] });
          showToast('All history tasks permanently deleted.');
        } catch (e: any) {
          showToast('Error clearing history.');
        }
      }
    );
  };

  return (
    <div className="space-y-6 w-full mx-auto relative">
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
          <div className="p-2 bg-rose-500/20 rounded-lg border border-rose-500/30 shrink-0">
            <Activity className="text-rose-400" size={28} /> 
          </div>
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-black text-white uppercase tracking-wide drop-shadow-md">
              Task Intelligence & Diagnostics
            </h1>
            <p className="text-sm text-slate-400 font-medium flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse shadow-[0_0_8px_rgba(251,113,133,0.8)]" />
              Monitoring active deadlines and automated execution protocols.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="px-5 py-2.5 border border-rose-500/30 text-rose-400 text-sm font-black uppercase tracking-widest rounded-xl bg-rose-500/10 flex items-center gap-2">
            <CheckCircle2 size={18} /> System Synced
          </div>
        </div>
      </div>
      <ContextBroadcast />
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative p-[1px] rounded-2xl overflow-hidden group shadow-2xl shadow-blue-900/10 min-h-[70vh] flex flex-col"
      >
        {/* Animated Gradient Border */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/30 via-purple-600/10 to-emerald-600/30 opacity-30 transition-opacity duration-1000 group-hover:opacity-60 animate-pulse" />
        
        {/* Core Card */}
        <div className="relative flex-1 bg-slate-950/90 backdrop-blur-2xl border border-white/5 p-8 rounded-2xl flex flex-col z-10 overflow-hidden">
          {/* Background grid & subtle glow */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-blue-900/10 via-slate-950/0 to-slate-950/0" />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:24px_24px] opacity-40" />

          {/* Header Row */}
          <div className="relative z-20 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10 border-b border-slate-800/60 pb-6">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl border shadow-lg ${showHistory ? 'bg-slate-800/50 border-slate-700 shadow-slate-900/50' : 'bg-blue-500/10 border-blue-500/20 shadow-blue-900/30'}`}>
                {showHistory ? <History size={24} className="text-slate-400" /> : <ListTodo size={24} className="text-blue-400" />}
              </div>
              <div>
                <h1 className="text-2xl font-black text-white uppercase tracking-wide flex items-center gap-3">
                  {showHistory ? (
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-slate-300 to-slate-500">Archived Telemetry & History</span>
                  ) : (
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-blue-100 to-slate-300 drop-shadow-sm">Looming Deadlines & Task Intelligence</span>
                  )}
                  {showHistory && <span className="text-[10px] bg-slate-800/80 px-2 py-1 rounded text-slate-400 border border-slate-700 shadow-inner">READ-ONLY</span>}
                </h1>
                <p className="text-sm text-slate-400 font-medium mt-1">
                  {showHistory ? 'Historical log of all completed and deleted intelligence tasks.' : 'Every task is autonomously analyzed to determine risk level, buffer limits, and custom execution checkpoints.'}
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
              
              {showHistory && historyTasks.length > 0 && (
                <button 
                  onClick={handleClearHistory} 
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-slate-900 hover:bg-rose-950/40 text-rose-400 hover:text-rose-300 px-5 py-2.5 rounded-lg font-bold text-xs uppercase tracking-wider transition-all duration-300 border border-rose-900/50 hover:border-rose-500/50 shadow-[0_0_15px_rgba(225,29,72,0.1)] hover:shadow-[0_0_25px_rgba(225,29,72,0.3)] hover:-translate-y-0.5 shrink-0"
                >
                  <Trash2 size={16} /> Clear All History
                </button>
              )}
              
              {!showHistory && (
                <button onClick={toggleTaskModal} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-gradient-to-b from-blue-500 to-blue-700 hover:from-blue-400 hover:to-blue-600 text-white px-5 py-2.5 rounded-lg font-bold text-xs uppercase tracking-wider transition-all duration-300 shadow-[0_0_20px_rgba(37,99,235,0.4)] hover:shadow-[0_0_30px_rgba(59,130,246,0.6)] hover:-translate-y-0.5 border border-blue-400/30 shrink-0">
                  <Plus size={16} /> Deploy Task Agent
                </button>
              )}
            </div>
          </div>
          
          <div className="relative z-20 space-y-8">
            {isLoading ? (
              <div className="text-slate-500 text-sm text-center py-10 font-medium">Initializing database records...</div>
            ) : regularTasks.length > 0 ? (
              <div className="space-y-4">
                {regularTasks.map((task: any) => <AdvancedTaskCard key={task.id} task={task} showToast={showToast} isHistory={showHistory} showConfirm={showConfirm} />)}
              </div>
            ) : (
              <div className="text-slate-500 text-sm text-center py-12 border border-slate-800/50 rounded-xl bg-slate-900/30 backdrop-blur-sm shadow-inner font-medium">
                {showHistory ? 'No historical tasks found in the archive.' : 'No active tasks found. Click \'Deploy Task Agent\' to generate telemetry.'}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export const AdvancedTaskCard = ({ task, showToast, isHistory, showConfirm }: { task: any, showToast: (msg: string) => void, isHistory: boolean, showConfirm: any }) => {
  const queryClient = useQueryClient();
  const { addChatMessage, toggleChat, isChatOpen } = useUIStore();
  const [missRisk, setMissRisk] = useState(isHistory ? 0 : task.baseMissRisk || 15);
  const isHighPriority = task.priority === 3 || missRisk > 90;
  const subtasks = task.subtasks || [];
  const completedSubtasks = subtasks.filter((s: any) => s.status === 'completed').length;
  const progressPct = subtasks.length > 0 ? Math.round((completedSubtasks / subtasks.length) * 100) : task.status === 'completed' ? 100 : 0;
  
  const [showSubtasks, setShowSubtasks] = useState(false);
  const needsWarning = !isHistory && isHighPriority && progressPct < 50;

  let displayDescription = task.description || '';
  let categoryTag = 'General';
  let impactTag = '';
  let autoScheduleTag = false;

  const catMatch = displayDescription.match(/\[Category:\s*(.+?)\]/i);
  if (catMatch) { categoryTag = catMatch[1]; displayDescription = displayDescription.replace(catMatch[0], '').trim(); }
  
  const impMatch = displayDescription.match(/\[Impact:\s*(.+?)\]/i);
  if (impMatch) { impactTag = impMatch[1]; displayDescription = displayDescription.replace(impMatch[0], '').trim(); }

  const autoMatch = displayDescription.match(/\[Auto-Schedule:\s*(true|false)\]/i);
  if (autoMatch) { autoScheduleTag = autoMatch[1].toLowerCase() === 'true'; displayDescription = displayDescription.replace(autoMatch[0], '').trim(); }

  const effort = task.estimatedTime ? `${task.estimatedTime}m` : isHighPriority ? '120m (Est.)' : task.priority === 2 ? '60m (Est.)' : '30m (Est.)';

  const completeMutation = useMutation({
    mutationFn: () => updateTask(task.id, { status: 'completed' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      showToast('Task marked as completed and moved to History.');
    }
  });

  const softDeleteMutation = useMutation({
    mutationFn: () => updateTask(task.id, { status: 'deleted' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      showToast('Task successfully deleted and moved to History.');
    }
  });

  const permanentDeleteMutation = useMutation({
    mutationFn: () => deleteTask(task.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      showToast('Task permanently deleted from database.');
    }
  });

  const handlePermanentDelete = () => {
    showConfirm(
      'Permanently Delete Task',
      `Are you sure you want to permanently delete "${task.title}"? This action cannot be undone.`,
      () => {
        permanentDeleteMutation.mutate();
      }
    );
  };

  const toggleSubtaskMutation = useMutation({
    mutationFn: ({ subtaskId, newStatus }: { subtaskId: string, newStatus: string }) => updateSubtask(subtaskId, { status: newStatus }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    }
  });

  const deployEmergencyMutation = useMutation({
    mutationFn: async () => {
      if (!isChatOpen) toggleChat();
      
      const prompt = `Schedule emergency timeblocks for task ${task.cardNumber || task.title}`;
      addChatMessage({ role: 'user', content: prompt });
      
      const response = await chatWithAgent(prompt);
      addChatMessage({ role: 'agent', content: response.reply });
      
      return response;
    },
    onSuccess: () => {
      showToast('Emergency timeblocks deployed. View AI Supervisor for details.');
      queryClient.invalidateQueries({ queryKey: ['ai-logs'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    }
  });

  const handleToggleSubtask = (st: any) => {
    if (isHistory) return;
    const newStatus = st.status === 'completed' ? 'pending' : 'completed';
    toggleSubtaskMutation.mutate({ subtaskId: st.id, newStatus });
  };

  const [timeLeftStr, setTimeLeftStr] = useState('');
  useEffect(() => {
    if (!task.deadline) {
      setTimeLeftStr('No strict deadline');
      return;
    }
    if (isHistory) {
      setMissRisk(0);
      if (task.status === 'completed') setTimeLeftStr('VERIFIED COMPLETED');
      else setTimeLeftStr('ARCHIVED (DELETED)');
      return;
    }

    const updateCountdown = () => {
      const now = new Date().getTime();
      const deadline = new Date(task.deadline).getTime();
      const diff = deadline - now;
      const baseRisk = task.baseMissRisk || 15;
      
      if (diff <= 0) {
        setTimeLeftStr('CRITICAL: DEADLINE BREACHED');
        setMissRisk(100);
        return;
      }
      
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diff % (1000 * 60)) / 1000);
      
      setTimeLeftStr(`REMAINING TIME: ${days > 0 ? `${days}d ` : ''}${hours}h ${mins}m ${secs}s`);

      // Dynamic AI Miss Risk penalty within final 24 hours (86,400,000 ms)
      if (diff < 86400000) {
        const penalty = Math.floor((1 - (diff / 86400000)) * (100 - baseRisk));
        setMissRisk(Math.min(100, baseRisk + penalty));
      } else {
        setMissRisk(baseRisk);
      }
    };
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [task.deadline, isHistory, task.status, task.baseMissRisk]);

  return (
    <div className={`border bg-slate-950/80 rounded-xl p-6 transition-colors relative overflow-hidden group ${isHistory ? 'opacity-70 border-slate-800' : isHighPriority ? 'border-rose-900/50 hover:border-rose-700/80' : 'border-slate-800 hover:border-slate-700'}`}>
      {!isHistory && (
        <div className={`absolute top-0 right-0 w-48 h-48 rounded-full blur-[100px] -mr-16 -mt-16 pointer-events-none transition-opacity ${
          isHighPriority ? 'bg-rose-500/20' : 'bg-blue-500/10'
        }`} />
      )}

      <div className="flex justify-between items-start mb-6 relative z-10">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border ${
              isHistory ? 'bg-slate-800 text-slate-500 border-slate-700' :
              isHighPriority ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' : 
              task.priority === 2 ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 
              'bg-blue-500/10 text-blue-500 border-blue-500/20'
            }`}>
              {isHistory ? (task.status === 'deleted' ? 'Deleted' : 'Completed') : isHighPriority ? 'High Priority' : task.priority === 2 ? 'Med Priority' : 'Low Priority'}
            </span>
            <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border flex items-center gap-1 shadow-inner ${isHistory ? 'bg-slate-900 text-slate-600 border-slate-800' : 'bg-slate-800/80 text-slate-300 border-slate-700'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isHistory ? 'bg-slate-700' : 'bg-slate-400 opacity-80'}`} /> {categoryTag}
            </span>
            {impactTag && (
              <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border ${isHistory ? 'bg-slate-900 text-slate-600 border-slate-800' : 'bg-indigo-900/30 text-indigo-300 border-indigo-700/50'}`}>
                Impact: {impactTag}
              </span>
            )}
            {autoScheduleTag && (
              <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border flex items-center gap-1 ${isHistory ? 'bg-slate-900 text-slate-600 border-slate-800' : 'bg-emerald-900/30 text-emerald-300 border-emerald-700/50'}`}>
                <Zap size={10} /> Auto-Scheduled
              </span>
            )}
          </div>
          <h2 className={`text-xl font-black mb-2 ${isHistory && task.status === 'deleted' ? 'text-slate-500 line-through' : isHistory ? 'text-slate-400' : 'text-slate-100'}`}>
            {task.cardNumber && <span className="text-sm font-mono bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700 text-indigo-300 mr-3 align-middle select-all">{task.cardNumber}</span>}
            {task.title}
          </h2>
          {displayDescription && <p className="text-sm text-slate-400 max-w-2xl leading-relaxed">{displayDescription}</p>}
        </div>

        {!isHistory && (
          <div className="flex flex-col items-center justify-center shrink-0">
            <div className={`w-14 h-14 rounded-full border-4 flex items-center justify-center text-sm font-black ${
              missRisk > 70 ? 'border-rose-500 text-rose-500 shadow-[0_0_20px_rgba(225,29,72,0.4)]' : 
              missRisk > 30 ? 'border-amber-500 text-amber-500' : 'border-emerald-500 text-emerald-500'
            }`}>
              {missRisk}%
            </div>
            <p className="text-[9px] uppercase tracking-widest text-slate-500 mt-2 font-bold">Miss Risk</p>
          </div>
        )}
      </div>

      <div className="border-t border-slate-800/80 pt-4 mb-4 relative z-10 flex flex-wrap gap-4 justify-between items-center text-xs font-mono">
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-md border ${isHistory ? 'bg-slate-900 border-slate-800 text-slate-500' : timeLeftStr.includes('BREACHED') ? 'bg-rose-500/10 border-rose-500/30 text-rose-500 animate-pulse' : 'bg-slate-900 border-slate-700 text-slate-300 shadow-inner'}`}>
          <Timer size={14} className={isHistory ? 'text-slate-600' : timeLeftStr.includes('BREACHED') ? 'text-rose-500' : 'text-emerald-500'} /> 
          <span className="font-bold tracking-wider">{timeLeftStr}</span>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-md border shadow-inner ${isHistory ? 'bg-slate-900 border-slate-800 text-slate-600' : 'bg-slate-900 border-slate-700 text-amber-400'}`}>
          <Clock size={14} />
          <span className="font-bold tracking-wider">Estimated Bandwidth: {effort}</span>
        </div>
      </div>

      <div className="relative z-10">
        <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
          <span>Subtask Execution Progress</span>
          <span className={progressPct === 100 && !isHistory ? 'text-emerald-400' : 'text-slate-300'}>{completedSubtasks}/{subtasks.length} ({progressPct}%)</span>
        </div>
        <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
          <div 
            className={`h-full rounded-full transition-all duration-1000 ${
              isHistory ? 'bg-slate-700' : progressPct === 100 ? 'bg-emerald-500' : isHighPriority ? 'bg-rose-500' : 'bg-blue-500'
            }`} 
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>



      {needsWarning && (
        <div className="mt-6 border border-rose-500/30 bg-rose-950/40 shadow-[inset_0_0_20px_rgba(225,29,72,0.1)] p-5 rounded-xl flex items-start gap-4 relative z-10">
          <div className="mt-1 bg-rose-500/20 p-2 rounded-lg border border-rose-500/30">
            <AlertCircle className="text-rose-400 shrink-0" size={18} />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-black text-rose-400 uppercase tracking-widest mb-2 flex items-center gap-2">
              Critical Trajectory Alert
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              <span className="font-bold text-rose-300">Execution deficit detected.</span> With the deadline approaching and progress below 50%, there is an extremely high probability of task failure. Deploy emergency timeblocks immediately to prevent timeline collapse.
            </p>
            {task.scheduleBlocks && task.scheduleBlocks.length > 0 ? (
              task.scheduleBlocks.some((b: any) => new Date(b.startTime).getTime() === new Date(b.endTime).getTime()) ? (
                <div className="bg-rose-950/50 p-4 rounded-lg border border-rose-800 flex flex-col gap-2">
                  <div className="inline-flex items-center gap-2 text-rose-500 text-xs font-black uppercase tracking-widest">
                    <AlertCircle size={16} /> Timeline Breach Logged
                  </div>
                  <p className="text-[10px] text-rose-400/80 font-medium mt-1">
                    The AI cannot deploy emergency blocks for tasks that have already failed. A permanent breach record has been added to your Autonomous Block Planner.
                  </p>
                </div>
              ) : (
                <div className="bg-slate-950/50 p-4 rounded-lg border border-slate-800 flex flex-col gap-2">
                  <div className="inline-flex items-center gap-2 text-emerald-400 text-xs font-black uppercase tracking-widest">
                    <CheckCircle2 size={16} /> Emergency Timeblocks Deployed
                  </div>
                  <p className="text-[10px] text-slate-400 font-medium mt-1">
                    The AI has intervened. Proceed to the <span className="text-blue-400 font-bold">Emergency Routine Center</span> on your Schedule page to review the autonomous timeline.
                  </p>
                </div>
              )
            ) : (
              <button
                onClick={() => deployEmergencyMutation.mutate()}
                disabled={deployEmergencyMutation.isPending}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-rose-600 to-rose-800 text-white hover:from-rose-500 hover:to-rose-700 rounded-lg text-[10px] font-bold uppercase tracking-widest shadow-[0_0_15px_rgba(225,29,72,0.4)] hover:shadow-[0_0_25px_rgba(225,29,72,0.6)] transition-all disabled:opacity-50"
              >
                {deployEmergencyMutation.isPending ? 'Deploying...' : <><Zap size={14} /> Deploy Emergency Timeblocks</>}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Footer controls */}
      {isHistory ? (
        <div className="mt-6 pt-4 flex justify-between items-center relative z-10 border-t border-slate-800/50">
          <button 
            onClick={() => setShowSubtasks(!showSubtasks)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-700 bg-slate-800/50 text-slate-400 hover:bg-slate-700 hover:text-slate-300 text-xs font-bold uppercase tracking-widest transition-all"
          >
            <ListTodo size={14} /> 
            {showSubtasks ? 'Hide Subtasks' : 'View Subtasks'}
            {showSubtasks ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          
          <button 
            onClick={handlePermanentDelete}
            disabled={permanentDeleteMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 hover:border-rose-500/50 text-xs font-bold uppercase tracking-widest transition-all disabled:opacity-50"
          >
            {permanentDeleteMutation.isPending ? 'Deleting...' : <><Trash2 size={14} /> Permanently Delete</>}
          </button>
        </div>
      ) : (
        <div className="mt-6 pt-4 flex justify-between items-center relative z-10 border-t border-slate-800/50">
          <button 
            onClick={() => setShowSubtasks(!showSubtasks)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-blue-500/30 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 hover:border-blue-500/50 text-xs font-bold uppercase tracking-widest transition-all"
          >
            <ListTodo size={14} /> 
            {showSubtasks ? 'Hide Subtasks' : 'View Subtasks'}
            {showSubtasks ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={() => softDeleteMutation.mutate()}
              disabled={softDeleteMutation.isPending}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-rose-500/20 text-rose-500 hover:bg-rose-500/10 hover:border-rose-500/40 text-xs font-bold uppercase tracking-widest transition-all disabled:opacity-50"
              title="Archive Task"
            >
              {softDeleteMutation.isPending ? <span className="animate-pulse">...</span> : <Trash2 size={14} />}
            </button>

            {progressPct === 100 ? (
              <div className="px-4 py-2 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-widest rounded-lg bg-emerald-500/10 flex items-center gap-2">
                <CheckCircle2 size={16} /> Verified Completed
              </div>
            ) : (
              <button 
                onClick={() => completeMutation.mutate()}
                disabled={completeMutation.isPending}
                className="flex items-center gap-2 px-4 py-2 border border-slate-600 text-slate-300 hover:text-white hover:border-emerald-500 hover:bg-emerald-500/20 text-xs font-bold uppercase tracking-widest rounded-lg bg-slate-800/50 transition-all disabled:opacity-50"
              >
                {completeMutation.isPending ? <span className="animate-pulse">Marking...</span> : <><CheckCircle2 size={14} /> Mark Completed</>}
              </button>
            )}
          </div>
        </div>
      )}

      {showSubtasks && (
        <div className="mt-4 p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-3 relative z-10">
          <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3 border-b border-slate-800 pb-2">Identified Sub-Objectives</h4>
          {subtasks.length > 0 ? (
            subtasks.map((st: any) => (
              <div 
                key={st.id} 
                onClick={() => handleToggleSubtask(st)}
                className={`flex items-start gap-3 p-2 rounded-lg transition-colors ${isHistory ? '' : 'cursor-pointer hover:bg-slate-800/50'}`}
              >
                {st.status === 'completed' ? (
                  <CheckCircle size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                ) : (
                  <div className="w-3.5 h-3.5 rounded-full border border-slate-600 shrink-0 mt-0.5 transition-colors group-hover:border-slate-400" />
                )}
                <span className={`text-sm select-none ${st.status === 'completed' ? 'text-slate-500 line-through' : 'text-slate-300'}`}>{st.title}</span>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-500 italic">No AI sub-objectives generated for this task.</p>
          )}
        </div>
      )}
    </div>
  );
};
