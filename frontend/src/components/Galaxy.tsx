import React, { useState, useEffect } from 'react';
import { Activity, Beaker, Loader2 } from 'lucide-react';
import { fetchHeatmapData } from '../services/api';

interface HeatmapData {
  date: string;
  intensity: number;
}

export const ProductivityGalaxy = () => {
  const [heatmap, setHeatmap] = useState<HeatmapData[]>([]);
  const [loading, setLoading] = useState(true);
  const [simulated, setSimulated] = useState(false);

  useEffect(() => {
    loadHeatmapData();
  }, []);

  const loadHeatmapData = async () => {
    try {
      setLoading(true);
      const data = await fetchHeatmapData();
      setHeatmap(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getSimulatedData = () => {
    const sim = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      // Generate highly productive fake data
      const isWeekend = d.getDay() === 0 || d.getDay() === 6;
      const intensity = isWeekend ? Math.floor(Math.random() * 2) : Math.floor(Math.random() * 4) + 1;
      sim.push({ date: dateStr, intensity });
    }
    return sim;
  };

  const activeData = simulated ? getSimulatedData() : heatmap;

  const getColorClass = (intensity: number) => {
    if (intensity === 0) return 'bg-slate-800/40 border-slate-700/30';
    if (intensity === 1) return 'bg-indigo-900/40 border-indigo-800/50';
    if (intensity === 2) return 'bg-indigo-700/60 border-indigo-600/50 shadow-[0_0_10px_rgba(67,56,202,0.3)]';
    if (intensity === 3) return 'bg-indigo-500/80 border-indigo-400/50 shadow-[0_0_15px_rgba(99,102,241,0.5)]';
    return 'bg-indigo-400 border-indigo-300 shadow-[0_0_20px_rgba(129,140,248,0.8)] animate-pulse';
  };

  return (
    <div className="w-full h-full bg-slate-900/40 backdrop-blur-sm border border-slate-800 rounded-2xl flex flex-col overflow-hidden p-6 max-h-[500px]">
      
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-sm uppercase tracking-widest font-black text-indigo-400 drop-shadow-[0_0_10px_rgba(99,102,241,0.3)] flex items-center gap-2 mb-1">
            <Activity size={16} /> Deep Work Matrix
          </h3>
          <p className="text-[10px] text-slate-500 font-medium tracking-wide">30-Day Productivity Density Heatmap</p>
        </div>
        
        <button 
          onClick={() => setSimulated(!simulated)}
          className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 border transition-all ${
            simulated 
              ? 'bg-rose-500/10 border-rose-500/30 text-rose-400 shadow-[0_0_15px_rgba(225,29,72,0.2)]' 
              : 'bg-slate-800/50 border-slate-700 hover:bg-slate-700 text-slate-400'
          }`}
        >
          <Beaker size={12} /> {simulated ? 'Disable Simulation' : 'Simulate Logs'}
        </button>
      </div>

      <div className="flex-1 flex flex-col justify-center items-center">
        {loading && !simulated ? (
          <Loader2 size={32} className="animate-spin text-indigo-500" />
        ) : (
          <div className="w-full relative">
            <div className="grid grid-cols-7 gap-2 md:gap-3 place-items-center">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-2">{day}</div>
              ))}
              
              {/* Calculate empty slots to align first day to correct weekday */}
              {activeData.length > 0 && Array.from({ length: new Date(activeData[0].date).getDay() }).map((_, i) => (
                <div key={`empty-${i}`} className="w-8 h-8 rounded-md opacity-0" />
              ))}

              {activeData.map((data, i) => (
                <div 
                  key={data.date}
                  title={`${data.date}: ${data.intensity} logs`}
                  className={`w-8 h-8 md:w-10 md:h-10 rounded-md border transition-all duration-500 ${getColorClass(data.intensity)}`}
                />
              ))}
            </div>
            
            {simulated && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                <div className="bg-rose-950/80 backdrop-blur-md border border-rose-500/50 px-6 py-2 rounded-full transform -rotate-12">
                  <span className="text-rose-400 font-black tracking-[0.2em] text-sm uppercase">Simulated Data</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      
      <div className="mt-4 pt-4 border-t border-slate-800/50 flex justify-between items-center text-[9px] text-slate-500 font-bold uppercase tracking-widest">
        <span>Less</span>
        <div className="flex gap-1.5 mx-4">
          <div className="w-3 h-3 rounded-sm bg-slate-800/40 border border-slate-700/30" />
          <div className="w-3 h-3 rounded-sm bg-indigo-900/40 border border-indigo-800/50" />
          <div className="w-3 h-3 rounded-sm bg-indigo-700/60 border border-indigo-600/50" />
          <div className="w-3 h-3 rounded-sm bg-indigo-500/80 border border-indigo-400/50" />
          <div className="w-3 h-3 rounded-sm bg-indigo-400 border border-indigo-300" />
        </div>
        <span>More</span>
      </div>
    </div>
  );
};
