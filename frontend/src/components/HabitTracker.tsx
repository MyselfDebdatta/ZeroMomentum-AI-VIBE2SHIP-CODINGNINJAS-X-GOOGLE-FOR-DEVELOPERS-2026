import React, { useState, useEffect } from 'react';
import { Flame, CheckCircle, Circle, Plus, Loader2 } from 'lucide-react';
import { fetchHabits, toggleHabit, createHabit } from '../services/api';

export const HabitTracker = () => {
  const [habits, setHabits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTitle, setNewTitle] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadHabits = async () => {
    try {
      const data = await fetchHabits();
      setHabits(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHabits();
  }, []);

  const handleToggle = async (id: string) => {
    try {
      // Optimistic update
      setHabits(prev => prev.map(h => {
        if (h.id === id) {
          const isCompleting = !h.completedToday;
          return {
            ...h,
            completedToday: isCompleting,
            streak: isCompleting ? h.streak + 1 : Math.max(0, h.streak - 1)
          };
        }
        return h;
      }));

      await toggleHabit(id);
    } catch (err) {
      console.error(err);
      loadHabits(); // Revert on failure
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    
    setSubmitting(true);
    try {
      await createHabit({ title: newTitle, category: 'General' });
      setNewTitle('');
      loadHabits(); // Refresh list
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm flex flex-col h-full max-h-[500px]">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-sm uppercase tracking-widest font-black text-orange-400 drop-shadow-[0_0_10px_rgba(249,115,22,0.3)] flex items-center gap-2">
          <Flame size={16} /> Routine Alignment
        </h2>
        {loading && <Loader2 size={14} className="animate-spin text-slate-500" />}
      </div>
      
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-3 mb-4">
        {habits.length === 0 && !loading && (
          <p className="text-xs text-slate-500 text-center py-6">No routines established yet. Configure micro-habits below.</p>
        )}
        
        {habits.map(habit => (
          <div 
            key={habit.id} 
            onClick={() => handleToggle(habit.id)}
            className={`flex items-center justify-between p-3 rounded-xl border transition-all duration-300 cursor-pointer group ${
              habit.completedToday 
                ? 'bg-emerald-950/20 border-emerald-900/30 hover:border-emerald-500/30' 
                : 'bg-slate-800/30 border-slate-700/30 hover:border-slate-600/50 hover:bg-slate-800/50'
            }`}
          >
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="shrink-0 transition-transform group-hover:scale-110">
                {habit.completedToday ? (
                  <CheckCircle className="text-emerald-500 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" size={18} />
                ) : (
                  <Circle className="text-slate-500" size={18} />
                )}
              </div>
              <span className={`text-sm font-semibold truncate transition-all ${
                habit.completedToday ? 'text-slate-500 line-through decoration-emerald-900/50' : 'text-slate-300'
              }`}>
                {habit.title}
              </span>
            </div>
            
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border shadow-inner transition-colors ${
              habit.streak > 0 
                ? 'bg-orange-500/10 border-orange-500/20' 
                : 'bg-slate-900/50 border-slate-800/50'
            }`}>
              <Flame className={habit.streak > 0 ? "text-orange-500 animate-pulse" : "text-slate-600"} size={14} />
              <span className={`text-xs font-black ${habit.streak > 0 ? "text-orange-400" : "text-slate-500"}`}>
                {habit.streak}
              </span>
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={handleCreate} className="relative mt-auto pt-4 border-t border-slate-800/50">
        <input 
          type="text" 
          placeholder="Install new behavior..." 
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          className="w-full bg-slate-950/50 border border-slate-700 rounded-lg pl-4 pr-10 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-slate-600"
        />
        <button 
          type="submit" 
          disabled={!newTitle.trim() || submitting}
          className="absolute right-2 top-[26px] p-1.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-md transition-colors"
        >
          {submitting ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
        </button>
      </form>
    </div>
  );
};
