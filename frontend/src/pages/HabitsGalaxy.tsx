import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchHabits, createHabit, toggleHabit, fetchHeatmapData, fetchHabitInsights, archiveHabit, unarchiveHabit } from '../services/api';
import { Activity, TrendingUp, Flame, Play, Shield, Archive, X, Brain, Loader2, Eye, EyeOff, RotateCcw, ChevronDown, ChevronUp, Info } from 'lucide-react';
import { ContextBroadcast } from '../components/ContextBroadcast';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';

const CATEGORIES = ['Focus', 'Health', 'Coding', 'Learning', 'Admin', 'Social', 'Finance'];

export const HabitsGalaxy: React.FC = () => {
  const queryClient = useQueryClient();
  const [newHabit, setNewHabit] = useState('');
  const [category, setCategory] = useState('Focus');
  const [catOpen, setCatOpen] = useState(false);
  const [simulated, setSimulated] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  
  // Custom Timer Setup State
  const [showTimerSetup, setShowTimerSetup] = useState(false);
  const [timerInputMins, setTimerInputMins] = useState(25);
  const [pendingHabitId, setPendingHabitId] = useState<string | null>(null);

  // Active Timer State
  const [timerActive, setTimerActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [activeHabitId, setActiveHabitId] = useState<string | null>(null);

  const { data: habits, isLoading: habitsLoading } = useQuery({
    queryKey: ['habits', showArchived],
    queryFn: () => fetchHabits(showArchived ? 'archived' : undefined),
  });

  const { data: heatmapData } = useQuery({
    queryKey: ['heatmap'],
    queryFn: fetchHeatmapData,
  });

  const { data: insightsData, isLoading: insightsLoading } = useQuery({
    queryKey: ['habitInsights'],
    queryFn: fetchHabitInsights,
    refetchInterval: 300000, 
  });

  const createHabitMutation = useMutation({
    mutationFn: createHabit,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      setNewHabit('');
    },
  });

  const toggleHabitMutation = useMutation({
    mutationFn: toggleHabit,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      queryClient.invalidateQueries({ queryKey: ['heatmap'] });
      queryClient.invalidateQueries({ queryKey: ['habitInsights'] });
    },
  });

  const archiveHabitMutation = useMutation({
    mutationFn: archiveHabit,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
    },
  });

  const unarchiveHabitMutation = useMutation({
    mutationFn: unarchiveHabit,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (newHabit.trim()) {
      createHabitMutation.mutate({ title: newHabit, category });
      setCatOpen(false);
    }
  };

  useEffect(() => {
    let interval: any = null;
    if (timerActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timerActive && timeLeft === 0) {
      setTimerActive(false);
      if (activeHabitId) {
        toggleHabitMutation.mutate(activeHabitId);
      }
      setActiveHabitId(null);
    }
    return () => clearInterval(interval);
  }, [timerActive, timeLeft, activeHabitId, toggleHabitMutation]);

  const initiateTimerSetup = (id: string) => {
    setPendingHabitId(id);
    setTimerInputMins(25);
    setShowTimerSetup(true);
  };

  const confirmTimer = () => {
    if (pendingHabitId && timerInputMins > 0) {
      setActiveHabitId(pendingHabitId);
      setTimeLeft(timerInputMins * 60);
      setShowTimerSetup(false);
      setTimerActive(true);
      setPendingHabitId(null);
    }
  };

  const getSimulatedData = () => {
    const sim = [];
    for (let i = 119; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const isWeekend = d.getDay() === 0 || d.getDay() === 6;
      const intensity = isWeekend ? Math.floor(Math.random() * 2) : Math.floor(Math.random() * 4) + 1;
      sim.push({ date: d.toISOString().split('T')[0], intensity });
    }
    return sim;
  };

  const realMatrix = heatmapData && heatmapData.length >= 119 ? heatmapData.slice(heatmapData.length - 119) : Array.from({ length: 119 }).map(() => ({ intensity: 0 }));
  const activeMatrix = simulated ? getSimulatedData() : realMatrix;

  const getColorClass = (intensity: number) => {
    if (intensity === 0) return 'bg-slate-900/50 border border-slate-800/30';
    if (intensity === 1) return 'bg-blue-900/40 border border-blue-900/20';
    if (intensity === 2) return 'bg-blue-700/60';
    if (intensity === 3) return 'bg-blue-600';
    return 'bg-cyan-400';
  };

  const completedTodayCount = habits?.filter((h: any) => h.completedToday).length || 0;
  const consistencyScore = habits?.length ? Math.round((completedTodayCount / habits.length) * 100) : 0;
  const shields = insightsData?.shields || 0;

  const categoryCount = habits?.reduce((acc: any, h: any) => {
    acc[h.category || 'Focus'] = (acc[h.category || 'Focus'] || 0) + (h.streak || 1);
    return acc;
  }, { Focus: 0, Health: 0, Admin: 0, Learning: 0, Social: 0, Coding: 0, Finance: 0 }) || {};

  const radarData = Object.keys(categoryCount).map(key => ({
    subject: key,
    A: categoryCount[key] + 1, 
    fullMark: 100,
  }));

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const premiumCardStyle = "bg-slate-900/60 backdrop-blur-2xl border-t border-l border-slate-700/50 border-r border-b border-slate-800/80 rounded-[2rem] p-8 shadow-2xl relative overflow-hidden group flex flex-col";

  return (
    <div className="w-full mx-auto relative min-h-screen text-slate-300 pb-24">
      
      {/* 1. Custom Timer Setup Modal */}
      {showTimerSetup && (
        <div className="fixed top-0 right-0 bottom-0 left-0 md:left-72 z-[60] flex items-center justify-center bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-blue-500/30 p-10 rounded-[2rem] shadow-[0_0_50px_rgba(37,99,235,0.15)] text-center relative max-w-sm w-full">
            <h3 className="text-xl font-black text-white uppercase tracking-widest mb-2">Engage Focus</h3>
            <p className="text-xs text-slate-400 mb-8 font-mono">Set duration for deep work protocol.</p>
            
            <div className="flex items-center justify-center gap-6 mb-10">
              <button 
                onClick={() => setTimerInputMins(Math.max(1, timerInputMins - 5))} 
                className="w-12 h-12 flex items-center justify-center bg-slate-800 rounded-full text-slate-300 hover:text-white hover:bg-slate-700 hover:scale-110 transition-all shadow-lg"
              >-</button>
              <div className="text-6xl font-black text-blue-500 font-mono w-28 text-center drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]">
                {timerInputMins}
              </div>
              <button 
                onClick={() => setTimerInputMins(timerInputMins + 5)} 
                className="w-12 h-12 flex items-center justify-center bg-slate-800 rounded-full text-slate-300 hover:text-white hover:bg-slate-700 hover:scale-110 transition-all shadow-lg"
              >+</button>
            </div>
            
            <div className="flex gap-4">
              <button onClick={() => setShowTimerSetup(false)} className="flex-1 py-4 bg-transparent border border-slate-700 text-slate-400 font-bold tracking-widest uppercase text-xs rounded-xl hover:text-white hover:border-slate-500 transition-all">Abort</button>
              <button onClick={confirmTimer} className="flex-1 py-4 bg-blue-600 text-white font-bold tracking-widest uppercase text-xs rounded-xl hover:bg-blue-500 shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-all">Initialize</button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Full Screen Active Timer Modal */}
      {timerActive && (
        <div className="fixed top-0 right-0 bottom-0 left-0 md:left-72 z-[70] flex items-center justify-center bg-slate-950/95 backdrop-blur-xl">
          <div className="text-center relative w-full max-w-lg">
            <button onClick={() => setTimerActive(false)} className="absolute -top-16 right-0 text-slate-600 hover:text-white transition-colors">
              <X size={32} />
            </button>
            <div className="mb-8">
              <Brain size={64} className="mx-auto text-cyan-400 animate-pulse drop-shadow-[0_0_30px_rgba(34,211,238,0.8)]" />
            </div>
            <h2 className="text-2xl text-slate-400 font-black uppercase tracking-[0.3em] mb-12">Deep Focus Protocol Active</h2>
            <div className="text-[140px] leading-none font-black text-white font-mono tracking-wide mb-12 drop-shadow-[0_0_40px_rgba(255,255,255,0.2)]">
              {formatTime(timeLeft)}
            </div>
            <p className="text-base text-slate-500 max-w-sm mx-auto font-mono">
              Do not close this window. At T-Zero, your objective is automatically verified.
            </p>
          </div>
        </div>
      )}

      {/* HUD Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-slate-800/60 pb-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-blue-500/20 rounded-lg border border-blue-500/30 shrink-0">
            <Activity className="text-blue-500" size={28} /> 
          </div>
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-black text-white uppercase tracking-wide drop-shadow-md">
              Habit Tracker & Galaxy Grid
            </h1>
            <p className="text-sm text-slate-400 font-medium flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
              Tracking consistency scores, momentum streaks, and shield protocols.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="px-5 py-2.5 border border-blue-500/30 text-blue-400 text-sm font-black uppercase tracking-widest rounded-xl bg-blue-500/10 flex items-center gap-2">
            <TrendingUp size={18} /> {consistencyScore}% Consistency
          </div>
        </div>
      </div>

      <ContextBroadcast />

      {/* Gamification & Rewards Banner */}
      <div className="bg-gradient-to-r from-cyan-950/40 to-blue-950/20 border-t border-l border-cyan-500/20 border-r border-b border-blue-900/30 rounded-[2rem] p-6 md:p-8 mb-10 flex flex-col md:flex-row justify-between items-center shadow-lg gap-6">
        <div className="flex items-start gap-4 flex-1">
          <div className="p-3 bg-cyan-500/10 rounded-xl border border-cyan-500/20 hidden md:block">
            <Info size={24} className="text-cyan-400" />
          </div>
          <div>
            <h3 className="text-cyan-400 font-black tracking-widest uppercase text-base mb-2 flex items-center gap-2">
              <Shield size={18} /> Shield Protocol & Rewards
            </h3>
            <p className="text-slate-300 text-sm font-medium max-w-2xl leading-relaxed">
              <strong>RULE:</strong> Maintain a continuous streak for <strong className="text-cyan-300">7 days</strong> on any habit to forge 1 Shield. Shields act as automated momentum protection—if you miss a day, a shield is consumed to protect your streak from resetting to zero.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-6 border-t md:border-t-0 md:border-l border-cyan-900/50 pt-4 md:pt-0 md:pl-10 w-full md:w-auto justify-center">
          <div className="text-center">
            <div className="text-6xl font-black text-cyan-300 leading-none mb-1">
              {shields}
            </div>
            <div className="text-[10px] text-cyan-600 font-bold uppercase tracking-widest">Active Shields</div>
          </div>
        </div>
      </div>

      {/* ROW 1: Daily Routine & AI Diagnostics */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8 relative z-50">
        
        {/* Left Card: Daily Routine Alignment */}
        <div className={`${premiumCardStyle} !overflow-visible`}>
          <div className="flex justify-between items-center mb-8 relative z-10">
            <h2 className="text-sm uppercase tracking-widest text-white font-black border-l-4 border-blue-500 pl-3">Daily Routine Alignment</h2>
            <button 
              onClick={() => setShowArchived(!showArchived)}
              className={`flex items-center gap-2 text-xs uppercase tracking-widest font-bold transition-all px-4 py-2 rounded-full border ${
                showArchived 
                  ? 'bg-rose-500 text-white border-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.3)]' 
                  : 'bg-rose-950/30 text-rose-500 border-rose-900/50 hover:bg-rose-900/40 hover:text-rose-400'
              }`}
            >
              {showArchived ? <EyeOff size={14} /> : <Eye size={14} />}
              {showArchived ? 'Hide Graveyard' : 'Graveyard'}
            </button>
          </div>
          
          <div className="h-[280px] space-y-4 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent relative z-10">
            {habitsLoading ? (
              <div className="text-xs font-mono text-slate-500 py-8 flex items-center gap-2"><Loader2 size={14} className="animate-spin" /> Synchronizing...</div>
            ) : habits && habits.length > 0 ? (
              habits.map((habit: any) => (
                <div 
                  key={habit.id} 
                  className={`relative overflow-hidden p-3 px-4 rounded-xl flex items-center justify-between group transition-all duration-300 ${
                    habit.completedToday && !showArchived
                      ? 'bg-blue-950/20 border border-blue-900/30' 
                      : 'bg-slate-900/50 border border-slate-800/80 hover:bg-slate-800/80 hover:border-slate-700 hover:shadow-lg'
                  } ${showArchived ? 'opacity-70 grayscale border-rose-900/20 bg-rose-950/5' : ''}`}
                >
                  <div className="flex items-center gap-4 flex-1 cursor-pointer z-10" onClick={() => !showArchived && toggleHabitMutation.mutate(habit.id)}>
                    {!showArchived && (
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${habit.completedToday ? 'border-blue-500 bg-blue-500/20' : 'border-slate-600 group-hover:border-blue-500/50'}`}>
                        {habit.completedToday && <div className="w-2 h-2 bg-blue-400 rounded-full"></div>}
                      </div>
                    )}
                    <div className="flex flex-col">
                      <span className={`text-sm font-bold tracking-wide transition-colors ${habit.completedToday && !showArchived ? 'text-blue-400/50 line-through' : 'text-slate-200'}`}>
                        {habit.title}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono tracking-widest uppercase">{habit.category}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 z-10">
                    {habit.streak > 0 && !showArchived && (
                      <div className="flex items-center gap-1.5 px-2 py-1 bg-gradient-to-r from-orange-500/20 to-rose-500/10 border border-orange-500/20 rounded-lg">
                        <Flame className="text-orange-500 animate-pulse" size={14} />
                        <span className="text-xs font-black text-orange-400">{habit.streak}</span>
                      </div>
                    )}
                    
                    {!habit.completedToday && !showArchived && (
                      <button 
                        onClick={() => initiateTimerSetup(habit.id)}
                        className="p-2 text-slate-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all"
                        title="Engage Focus Engine"
                      >
                        <Play size={16} />
                      </button>
                    )}

                    {!showArchived && (
                      <button 
                        onClick={() => archiveHabitMutation.mutate(habit.id)}
                        className="p-2 text-rose-500 hover:text-rose-400 bg-rose-500/5 hover:bg-rose-500/20 rounded-lg transition-all"
                        title="Send to Graveyard"
                      >
                        <Archive size={16} />
                      </button>
                    )}

                    {showArchived && (
                      <button 
                        onClick={() => unarchiveHabitMutation.mutate(habit.id)}
                        className="px-4 py-2 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 rounded-xl transition-all border border-emerald-500/20 flex items-center gap-2 text-xs font-bold uppercase tracking-widest"
                        title="Restore Habit"
                      >
                        <RotateCcw size={14} /> Restore
                      </button>
                    )}
                  </div>
                  
                  {/* Subtle completed background fill */}
                  {habit.completedToday && !showArchived && (
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-900/10 to-transparent pointer-events-none"></div>
                  )}
                </div>
              ))
            ) : (
              <div className="border border-dashed border-slate-700/50 bg-slate-900/30 p-12 rounded-2xl flex items-center justify-center h-[200px]">
                 <span className="text-xs font-mono text-slate-500 uppercase tracking-widest text-center leading-loose">
                   {showArchived ? 'GRAVEYARD EMPTY.' : 'NO PROTOCOLS ALIGNED.'}
                 </span>
              </div>
            )}
          </div>

          {!showArchived && (
            <div className="mt-8 pt-6 relative border-t border-slate-800/50 z-50">
              <form onSubmit={handleCreate} className="flex flex-col sm:flex-row gap-3 relative">
                <input 
                  type="text" 
                  value={newHabit}
                  onChange={(e) => setNewHabit(e.target.value)}
                  placeholder="Initialize new behavior..." 
                  className="flex-1 bg-slate-950/50 border border-slate-700 rounded-2xl px-6 py-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors shadow-inner"
                />
                
                {/* Custom Dropdown UI */}
                <div className="relative">
                  <button 
                    type="button" 
                    onClick={() => setCatOpen(!catOpen)} 
                    className="h-full bg-slate-900 border border-slate-700 rounded-2xl px-6 py-4 text-sm font-bold text-slate-300 focus:outline-none focus:border-blue-500 flex justify-between items-center min-w-[140px] hover:bg-slate-800 transition-colors"
                  >
                    {category} {catOpen ? <ChevronUp size={16} className="text-slate-500 ml-2"/> : <ChevronDown size={16} className="text-slate-500 ml-2"/>}
                  </button>
                  
                  {catOpen && (
                    <div className="absolute top-[110%] left-0 w-full bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden z-50 flex flex-col py-2 backdrop-blur-xl">
                      {CATEGORIES.map(c => (
                        <div 
                          key={c} 
                          onClick={() => { setCategory(c); setCatOpen(false); }} 
                          className={`px-6 py-3 text-sm font-bold cursor-pointer transition-colors ${category === c ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-700 hover:text-white'}`}
                        >
                          {c}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button type="submit" disabled={!newHabit.trim() || createHabitMutation.isPending} className="bg-cyan-600 hover:bg-cyan-500 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest transition-all disabled:opacity-50 disabled:bg-slate-800">
                  Add
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Right Card: AI Routine Diagnostics */}
        <div className={premiumCardStyle}>
          <h2 className="text-sm uppercase tracking-widest text-white font-black border-l-4 border-emerald-500 pl-3 mb-10 relative z-10">AI Routine Diagnostics</h2>
          
          <div className="flex-1 flex flex-col justify-center relative z-10 px-4 md:px-8">
            <div className="flex items-center gap-6 mb-8">
              <div className="p-4 bg-emerald-950/40 border border-emerald-900/50 rounded-[1.5rem] relative">
                <Brain className="text-emerald-400 relative z-10" size={40} />
              </div>
              <div>
                <h2 className="text-xl font-black text-white tracking-wide">Behavioral Analyst</h2>
                <div className="flex items-center gap-2 text-[10px] text-emerald-400 font-mono tracking-widest uppercase mt-2 bg-emerald-950/50 border border-emerald-900/50 px-3 py-1 rounded-full inline-flex">
                  {insightsLoading ? <><Loader2 size={10} className="animate-spin" /> Processing...</> : <><div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></div> Live Feed Active</>}
                </div>
              </div>
            </div>

            <div className="text-lg md:text-xl text-slate-300 leading-relaxed font-serif pl-4 border-l-4 border-emerald-500/30 py-2">
              {insightsData?.insight || "System ready. Consistently log habits to generate high-fidelity behavioral analysis. The autonomous engine will interpret your momentum."}
            </div>
          </div>
        </div>

      </div>

      {/* ROW 2: Deep Work Matrix & Activity Radar */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        
        {/* Left Card: Deep Work Matrix */}
        <div className={premiumCardStyle}>
          <div className="flex justify-between items-center mb-8 relative z-10">
            <div>
              <h2 className="text-sm uppercase tracking-widest text-white font-black border-l-4 border-indigo-500 pl-3 mb-1">Deep Work Matrix</h2>
              <p className="text-[10px] text-slate-500 font-mono pl-4">120-Day continuous output matrix.</p>
            </div>
            
            <label className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-slate-500 cursor-pointer hover:text-slate-300 transition-colors bg-slate-900/50 px-4 py-2 rounded-full border border-slate-700 shadow-inner">
              <input 
                type="checkbox" 
                checked={simulated}
                onChange={(e) => setSimulated(e.target.checked)}
                className="rounded border-slate-700 bg-slate-950 text-indigo-500 focus:ring-indigo-500/20 cursor-pointer w-3.5 h-3.5" 
              /> 
              Simulate Output
            </label>
          </div>

          <div className="flex-1 flex flex-col justify-center relative z-10">
            <div className="relative flex overflow-x-auto justify-start md:justify-center px-2 md:px-4 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent pb-6 w-full">
              <div className="grid grid-rows-7 grid-flow-col gap-1.5 relative z-10 p-2 shrink-0">
                {activeMatrix.map((data: any, i: number) => (
                  <div 
                    key={i} 
                    title={data.date ? `${data.date}: Intensity ${data.intensity}` : 'Empty Slot'}
                    className={`w-5 h-5 rounded-[4px] transition-all duration-500 hover:scale-125 hover:z-20 ${getColorClass(data.intensity)}`} 
                  />
                ))}
              </div>
              
              {simulated && (
                <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
                  <div className="bg-blue-950/80 backdrop-blur-sm border border-blue-500/50 px-8 py-3 rounded-full shadow-2xl">
                    <span className="text-blue-400 font-black tracking-widest text-[10px] uppercase">Simulation Overriding Live Data</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 flex items-center justify-center text-[10px] uppercase tracking-widest font-bold text-slate-500 gap-3 relative z-10 border-t border-slate-800/50 pt-4">
            <span>Inactive</span>
            <div className="flex gap-[3px]">
              <div className="w-3.5 h-3.5 rounded-[2px] bg-slate-900/50 border border-slate-800/30"></div>
              <div className="w-3.5 h-3.5 rounded-[2px] bg-blue-900/40 border border-blue-900/20"></div>
              <div className="w-3.5 h-3.5 rounded-[2px] bg-blue-700/60"></div>
              <div className="w-3.5 h-3.5 rounded-[2px] bg-blue-600"></div>
              <div className="w-3.5 h-3.5 rounded-[2px] bg-cyan-400"></div>
            </div>
            <span>Active</span>
          </div>
        </div>

        {/* Right Card: Activity Radar Profile */}
        <div className={premiumCardStyle}>
          <h2 className="text-sm uppercase tracking-widest text-white font-black border-l-4 border-cyan-500 pl-3 mb-8 relative z-10">Activity Radar Profile</h2>
          
          <div className="w-full h-full min-h-[300px] flex-1 relative z-10 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="85%" data={radarData}>
                <PolarGrid stroke="#334155" strokeDasharray="3 3" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#cbd5e1', fontSize: 13, fontWeight: 'bold' }} />
                <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={false} axisLine={false} />
                <Radar name="Activity" dataKey="A" stroke="#22d3ee" strokeWidth={2} fill="#22d3ee" fillOpacity={0.25} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

    </div>
  );
};
