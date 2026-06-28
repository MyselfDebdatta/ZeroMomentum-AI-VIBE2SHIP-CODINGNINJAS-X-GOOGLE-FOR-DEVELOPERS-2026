import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUIStore } from '../store/uiStore';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createTask } from '../services/api';
import { X, Sparkles, Calendar, ChevronDown, Clock, Target, ShieldAlert, Zap } from 'lucide-react';

const CATEGORIES = ['General', 'Academics', 'Business', 'Personal Finance', 'Engineering', 'Health'];
const IMPACT_LEVELS = ['Low (Routine)', 'Medium (Standard)', 'High (Critical)', 'Extreme (Mission Critical)'];

export const TaskIntelModal: React.FC = () => {
  const { isTaskModalOpen, toggleTaskModal } = useUIStore();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  
  // Split date and time for more professional UI
  const [targetDate, setTargetDate] = useState('');
  const [targetTime, setTargetTime] = useState('');
  const dateRef = useRef<HTMLInputElement>(null);
  const timeRef = useRef<HTMLInputElement>(null);
  
  const [category, setCategory] = useState('General');
  const [impact, setImpact] = useState('Medium (Standard)');
  const [autoSchedule, setAutoSchedule] = useState(true);

  const createMutation = useMutation({
    mutationFn: createTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['diagnostics'] });
      setTitle('');
      setDescription('');
      setTargetDate('');
      setTargetTime('');
      setCategory('General');
      setImpact('Medium (Standard)');
      toggleTaskModal();
    }
  });

  if (!isTaskModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;

    // Compile deadline
    let finalDeadline = new Date().toISOString();
    if (targetDate && targetTime) {
      finalDeadline = new Date(`${targetDate}T${targetTime}`).toISOString();
    } else if (targetDate) {
      finalDeadline = new Date(targetDate).toISOString();
    }

    // Pack complex parameters into description for AI context
    const enrichedDescription = `[Category: ${category}] [Impact: ${impact}] [Auto-Schedule: ${autoSchedule}] ${description}`;

    let priorityNum = 1;
    if (impact.includes('High')) priorityNum = 3;
    if (impact.includes('Medium')) priorityNum = 2;

    createMutation.mutate({
      title,
      description: enrichedDescription,
      deadline: finalDeadline,
      priority: priorityNum,
    });
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={toggleTaskModal}
          className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-3xl bg-[#0b0d14] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex justify-between items-center p-6 border-b border-slate-800/80 bg-slate-900/40 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent pointer-events-none" />
            <div className="relative z-10">
              <h2 className="text-xl font-black text-white uppercase tracking-wide flex items-center gap-3">
                <Sparkles className="text-blue-500" size={24} /> Deploy AI Task Agent
              </h2>
              <p className="text-xs text-slate-500 uppercase tracking-widest mt-1">Autonomous AI Enrichment Pipeline</p>
            </div>
            <button onClick={toggleTaskModal} className="text-slate-500 hover:text-white transition-colors relative z-10 bg-slate-900 p-2 rounded-lg border border-slate-800">
              <X size={20} />
            </button>
          </div>

          {/* Form */}
          <div className="overflow-y-auto p-8 custom-scrollbar">
            <form id="intel-form" onSubmit={handleSubmit} className="space-y-8">
              
              {/* Primary Info */}
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Target size={12} className="text-blue-500"/> Task Identity
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Architect Core Neural Network Logic"
                    className="w-full bg-[#12151f] border border-slate-800 rounded-xl px-5 py-4 text-sm font-bold text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-inner"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <ShieldAlert size={12} className="text-blue-500"/> Context & Parameters
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Specify constraints, requirements, and key success metrics for the AI to analyze..."
                    rows={4}
                    className="w-full bg-[#12151f] border border-slate-800 rounded-xl px-5 py-4 text-sm text-slate-300 placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all resize-none shadow-inner"
                  />
                </div>
              </div>

              <div className="h-px w-full bg-gradient-to-r from-transparent via-slate-800 to-transparent" />

              {/* Advanced Parameters */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* Column 1 */}
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <Calendar size={12} className="text-emerald-500"/> Target Date
                    </label>
                    <div onClick={() => dateRef.current?.showPicker()} className="relative w-full bg-[#12151f] border border-slate-800 rounded-xl px-5 py-3 text-sm text-slate-300 hover:border-emerald-500/50 focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500 transition-all cursor-pointer">
                      <span className={targetDate ? "text-emerald-400 font-bold" : "text-slate-500"}>
                        {targetDate ? new Date(`${targetDate}T12:00:00`).toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' }) : 'Select Date...'}
                      </span>
                      <Calendar size={16} className="absolute right-4 top-3.5 text-slate-500 pointer-events-none" />
                      <input
                        ref={dateRef}
                        type="date"
                        required
                        value={targetDate}
                        onChange={(e) => setTargetDate(e.target.value)}
                        className="absolute w-0 h-0 opacity-0 overflow-hidden"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Classification Category</label>
                    <div className="relative">
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full bg-[#12151f] border border-slate-800 rounded-xl pl-5 pr-10 py-3 text-sm text-slate-300 focus:outline-none focus:border-blue-500 transition-all appearance-none cursor-pointer"
                      >
                        {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                      </select>
                      <ChevronDown size={16} className="absolute right-4 top-3.5 text-slate-600 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Column 2 */}
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <Clock size={12} className="text-emerald-500"/> Absolute Deadline Time
                    </label>
                    <div onClick={() => timeRef.current?.showPicker()} className="relative w-full bg-[#12151f] border border-slate-800 rounded-xl px-5 py-3 text-sm text-slate-300 hover:border-emerald-500/50 focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500 transition-all cursor-pointer">
                      <span className={targetTime ? "text-emerald-400 font-bold font-mono tracking-wider" : "text-slate-500"}>
                        {targetTime ? new Date(`1970-01-01T${targetTime}`).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : 'Select Time...'}
                      </span>
                      <Clock size={16} className="absolute right-4 top-3.5 text-slate-500 pointer-events-none" />
                      <input
                        ref={timeRef}
                        type="time"
                        required
                        value={targetTime}
                        onChange={(e) => setTargetTime(e.target.value)}
                        className="absolute w-0 h-0 opacity-0 overflow-hidden"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Expected Impact Level</label>
                    <div className="relative">
                      <select
                        value={impact}
                        onChange={(e) => setImpact(e.target.value)}
                        className="w-full bg-[#12151f] border border-slate-800 rounded-xl pl-5 pr-10 py-3 text-sm text-slate-300 focus:outline-none focus:border-blue-500 transition-all appearance-none cursor-pointer"
                      >
                        {IMPACT_LEVELS.map(level => <option key={level} value={level}>{level}</option>)}
                      </select>
                      <ChevronDown size={16} className="absolute right-4 top-3.5 text-slate-600 pointer-events-none" />
                    </div>
                  </div>
                </div>

              </div>

              {/* AI Auto-Schedule Toggle */}
              <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4 flex items-center justify-between cursor-pointer" onClick={() => setAutoSchedule(!autoSchedule)}>
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${autoSchedule ? 'bg-blue-600' : 'bg-slate-800'} transition-colors`}>
                    <Zap size={20} className={autoSchedule ? 'text-white' : 'text-slate-500'} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-200">Autonomous Timeline Generation</h3>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-0.5">Let AI automatically distribute subtasks into your schedule</p>
                  </div>
                </div>
                <div className={`w-12 h-6 rounded-full p-1 transition-colors ${autoSchedule ? 'bg-blue-600' : 'bg-slate-800'}`}>
                  <div className={`w-4 h-4 rounded-full bg-white transition-transform ${autoSchedule ? 'translate-x-6' : 'translate-x-0'}`} />
                </div>
              </div>

            </form>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-slate-800/80 bg-slate-900/40">
            <button
              form="intel-form"
              type="submit"
              disabled={createMutation.isPending}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white rounded-xl py-4 text-sm font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_30px_rgba(37,99,235,0.5)] uppercase tracking-wider"
            >
              {createMutation.isPending ? (
                <span className="animate-pulse flex items-center gap-2"><Sparkles size={16} /> Deploying Agent...</span>
              ) : (
                <><Sparkles size={16} /> Initialize Task Agent</>
              )}
            </button>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
};
