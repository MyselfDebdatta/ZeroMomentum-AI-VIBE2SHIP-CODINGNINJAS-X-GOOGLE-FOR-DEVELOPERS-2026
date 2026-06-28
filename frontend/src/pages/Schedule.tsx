import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { fetchSchedules, generateRecoveryPlan } from '../services/api';
import { Zap, Loader2, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ContextBroadcast } from '../components/ContextBroadcast';

export const Schedule: React.FC = () => {
  const [recoveryPlan, setRecoveryPlan] = useState<any[] | null>(null);

  const { data: schedules, isLoading } = useQuery({
    queryKey: ['schedules'],
    queryFn: fetchSchedules,
  });

  const recoveryMutation = useMutation({
    mutationFn: generateRecoveryPlan,
    onSuccess: (data) => {
      setRecoveryPlan(data);
    }
  });

  return (
    <div className="space-y-8 w-full mx-auto">
      {/* HUD Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-slate-800/60 pb-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-blue-500/20 rounded-lg border border-blue-500/30 shrink-0">
            <Zap className="text-blue-400" size={28} /> 
          </div>
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-black text-white uppercase tracking-wide drop-shadow-md">
              Timeblocks & Recovery
            </h1>
            <p className="text-sm text-slate-400 font-medium flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse shadow-[0_0_8px_rgba(96,165,250,0.8)]" />
              Calculating dynamic schedule adjustments and emergency protocols.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="px-5 py-2.5 border border-blue-500/30 text-blue-400 text-sm font-black uppercase tracking-widest rounded-xl bg-blue-500/10 flex items-center gap-2">
            <ShieldAlert size={18} /> Schedule Active
          </div>
        </div>
      </div>
      
      <ContextBroadcast />
      
      {/* Emergency Routine Center */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-8 relative overflow-hidden group">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:20px_20px]" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-6">
          <div className="w-16 h-16 rounded-xl border border-rose-500/30 bg-rose-500/10 flex items-center justify-center shrink-0 shadow-[0_0_30px_rgba(225,29,72,0.15)] group-hover:shadow-[0_0_40px_rgba(225,29,72,0.3)] transition-shadow">
            <Zap size={32} className="text-rose-500" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-rose-500 uppercase tracking-widest mb-2">Emergency Routine Center</h2>
            <p className="text-sm text-slate-300 leading-relaxed max-w-3xl">
              Falling behind on algorithms submissions or accelerator paperwork? Trigger <span className="font-bold text-white">Smart Recovery Mode</span>. The system will dynamically wipe low-priority friction, shift chore blocks, and schedule tight emergency work-sprints.
            </p>
            <div className="mt-4 flex flex-col items-start gap-3">
              <button 
                onClick={() => recoveryMutation.mutate()}
                disabled={recoveryMutation.isPending}
                className="flex items-center gap-2 bg-rose-600 hover:bg-rose-500 text-white px-5 py-2.5 rounded-lg font-bold text-xs uppercase tracking-wider transition-colors shadow-[0_0_20px_rgba(225,29,72,0.4)] disabled:opacity-50"
              >
                {recoveryMutation.isPending ? <><Loader2 size={14} className="animate-spin" /> Wiping friction...</> : <><Zap size={14} /> Activate Recovery Matrix</>}
              </button>
              <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4 mt-2 max-w-2xl shadow-inner">
                <p className="text-xs text-slate-300 leading-relaxed font-medium">
                  <span className="text-rose-400 font-black uppercase tracking-widest text-[10px] mr-2 bg-rose-500/10 px-2 py-1 rounded border border-rose-500/20">System Notice</span> 
                  The Recovery Matrix operates as a sterile, in-memory overlay. It is 100% non-destructive and will never overwrite your permanent block schedule. 
                  <br/><br/>
                  <span className="text-slate-400">Because it is volatile, this timeline will wipe clean upon page refresh. <span className="text-slate-300 font-bold">If you lose it, simply hit the button to re-initialize a fresh matrix.</span></span>
                </p>
              </div>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {recoveryPlan && recoveryPlan.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-8 border-t border-rose-500/20 pt-6"
            >
              <h3 className="text-sm font-black text-rose-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <ShieldAlert size={16} /> Active Emergency Timeline
              </h3>
              <div className="space-y-3">
                {recoveryPlan.map((block, i) => (
                  <div key={i} className={`flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-xl border ${block.type === 'work' ? 'bg-rose-500/5 border-rose-500/20' : 'bg-cyan-500/5 border-cyan-500/20'}`}>
                    <div className={`text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full ${block.type === 'work' ? 'bg-rose-500/20 text-rose-400' : 'bg-cyan-500/20 text-cyan-400'}`}>
                      {block.timeWindow}
                    </div>
                    <div className="flex-1">
                      <h4 className="text-white font-bold text-sm">{block.taskTitle}</h4>
                      <p className="text-xs text-slate-400 mt-1">{block.context}</p>
                    </div>
                    <div className={`text-[10px] font-bold uppercase tracking-widest ${block.type === 'work' ? 'text-rose-500' : 'text-cyan-500'}`}>
                      {block.type}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Autonomous Block Planner */}
      <div>
        <div className="mb-8 flex items-center gap-4">
          <div className="p-2.5 bg-blue-500/10 rounded-xl border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.15)] shrink-0">
            <Zap className="text-blue-400" size={24} />
          </div>
          <div>
            <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-wide drop-shadow-md">
              Autonomous Block Planner
            </h2>
            <p className="text-sm text-slate-400 font-medium mt-1">
              Chronological micro-scheduled hours allocated for deep tasks
            </p>
          </div>
        </div>

        <div className="border border-slate-800 rounded-xl bg-slate-900/30 p-8 min-h-[400px] flex flex-col relative overflow-hidden">
          {/* Timeline Grid Background */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] opacity-30" />
          
          <div className="relative z-10 flex-1">
            {isLoading ? (
              <div className="h-full flex items-center justify-center">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Scanning timeline dimensions...</span>
              </div>
            ) : schedules && schedules.length > 0 ? (
              <div className="space-y-8">
                {Object.values(
                  schedules.reduce((acc: any, block: any) => {
                    const taskId = block.task.id;
                    if (!acc[taskId]) acc[taskId] = { task: block.task, blocks: [] };
                    acc[taskId].blocks.push(block);
                    return acc;
                  }, {})
                ).map((group: any, groupIndex: number) => {
                  const task = group.task;
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

                  return (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: groupIndex * 0.1 }}
                      key={task.id} 
                      className="border border-blue-500/20 bg-blue-500/5 rounded-xl overflow-hidden shadow-[0_0_30px_rgba(59,130,246,0.05)]"
                    >
                      {/* Task Header Segment */}
                      <div className="p-6 border-b border-blue-500/20 bg-slate-900/40 relative">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-[50px] -mr-10 -mt-10 rounded-full" />
                        <h3 className="text-lg font-black text-emerald-400 uppercase tracking-widest mb-2 relative z-10">
                          {task.cardNumber && <span className="text-sm font-mono bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700 text-indigo-300 mr-3 align-middle">{task.cardNumber}</span>}
                          {task.title}
                        </h3>
                        
                        <div className="flex flex-wrap items-center gap-2 mb-3 relative z-10">
                          <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border flex items-center gap-1 shadow-inner bg-slate-800/80 text-slate-300 border-slate-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400 opacity-80" /> {categoryTag}
                          </span>
                          {impactTag && (
                            <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border bg-indigo-900/30 text-indigo-300 border-indigo-700/50">
                              Impact: {impactTag}
                            </span>
                          )}
                          {autoScheduleTag && (
                            <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border flex items-center gap-1 bg-emerald-900/30 text-emerald-300 border-emerald-700/50">
                              <Zap size={10} /> Auto-Scheduled
                            </span>
                          )}
                        </div>

                        {displayDescription && (
                          <p className="text-sm text-slate-300 max-w-3xl leading-relaxed relative z-10">{displayDescription}</p>
                        )}
                      </div>

                      {/* Timeblocks Segments */}
                      <div className="flex flex-col">
                        {group.blocks.map((block: any, index: number) => {
                          const start = new Date(block.startTime);
                          const end = new Date(block.endTime);
                          const timeStr = `${start.getHours().toString().padStart(2, '0')}:${start.getMinutes().toString().padStart(2, '0')} - ${end.getHours().toString().padStart(2, '0')}:${end.getMinutes().toString().padStart(2, '0')}`;
                          
                          if (start.getTime() === end.getTime()) {
                            // This is a breach flag block!
                            return (
                               <div key={block.id} className={`flex items-stretch ${index !== group.blocks.length - 1 ? 'border-b border-rose-900/50' : ''}`}>
                                  <div className="w-40 shrink-0 border-r border-rose-900/50 p-4 bg-rose-950/20 flex flex-col justify-center relative">
                                    <div className="absolute top-0 right-0 bottom-0 w-1 bg-rose-500/50" />
                                    <p className="text-lg font-black text-rose-500">BREACHED</p>
                                  </div>
                                  <div className="flex-1 p-6 bg-rose-950/10">
                                    <h4 className="text-sm font-bold text-rose-400 mb-1">Timeline Failure Logged</h4>
                                    <p className="text-xs text-rose-300/70 leading-relaxed font-mono">This task exceeded its execution timeline. The autonomous engine has logged a permanent failure record. Further emergency scheduling is restricted.</p>
                                  </div>
                               </div>
                            );
                          }

                          // Recalculate Context Broadcast Reason
                          const hour = start.getHours();
                          let reason = "Extreme late-night block allocated to guarantee strict timeline adherence.";
                          if (hour === 6) reason = "Early 6 AM alignment scheduled to leverage peak morning cognitive momentum.";
                          else if (hour === 7) reason = "Strategic 7 AM execution block assigned for uninterrupted priority focus.";
                          else if (hour === 8) reason = "Core 8 AM timeline secured to aggressively mitigate deadline failure.";
                          else if (hour === 9) reason = "Active 9 AM structural block deployed for maximum morning efficiency.";
                          else if (hour === 10) reason = "Late morning 10 AM sequence initiated to wrap up early execution goals.";
                          else if (hour === 11) reason = "Pre-lunch 11 AM execution block deployed to maintain continuous progress.";
                          else if (hour === 12) reason = "Mid-day 12 PM alignment scheduled to aggressively drive task completion.";
                          else if (hour === 13) reason = "Post-lunch 1 PM timeline optimized to bridge morning and afternoon workloads.";
                          else if (hour === 14) reason = "High-priority 2 PM execution block assigned to the deep-work afternoon slot.";
                          else if (hour === 15) reason = "Mid-afternoon 3 PM sequence initiated to ensure steady progression.";
                          else if (hour === 16) reason = "Late afternoon 4 PM structural timeline reserved to transition into evening.";
                          else if (hour === 17) reason = "Evening 5 PM buffer activated to aggressively close the remaining workload.";
                          else if (hour === 18) reason = "Snack phase 6 PM locked in for uninterrupted evening execution.";
                          else if (hour === 19) reason = "Night 7 PM alignment scheduled to finalize pending deliverables.";
                          else if (hour === 20) reason = "Night 8 PM structural block reserved for critical task completion.";
                          else if (hour === 21) reason = "Late-night 9 PM emergency execution block deployed to strictly prevent failure.";
                          else if (hour === 22) reason = "Nocturnal 10 PM sequence initiated for absolute critical recovery.";
                          
                          return (
                            <div key={block.id} className={`flex items-stretch ${index !== group.blocks.length - 1 ? 'border-b border-slate-800/50' : ''}`}>
                              <div className="w-40 shrink-0 border-r border-slate-800/50 p-4 bg-slate-900/20 flex flex-col justify-center relative">
                                <div className="absolute top-0 right-0 bottom-0 w-1 bg-blue-500/20" />
                                <p className="text-lg font-black text-slate-200">{timeStr}</p>
                                <p className="text-[9px] text-blue-400 uppercase tracking-widest font-bold mt-0.5">{start.toLocaleDateString()}</p>
                              </div>
                              <div className="flex-1 p-4 flex flex-col justify-center bg-slate-900/10">
                                <h4 className="text-[10px] font-bold uppercase tracking-widest text-emerald-500/70 mb-1">Context Broadcast</h4>
                                <p className="text-xs text-slate-400 leading-relaxed font-mono">{reason}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="h-full min-h-[300px] border border-dashed border-slate-700/50 rounded-xl bg-slate-950/50 flex items-center justify-center">
                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest text-center px-4 leading-relaxed max-w-[90%]">No active time blocks generated. Create a task with details to generate work blocks!</span>
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
};
