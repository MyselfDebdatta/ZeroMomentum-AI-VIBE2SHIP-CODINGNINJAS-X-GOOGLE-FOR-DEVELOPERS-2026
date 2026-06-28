import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Bot } from 'lucide-react';
import { fetchAILogs } from '../services/api';

export const ContextBroadcast: React.FC = () => {
  const { data: logs } = useQuery({
    queryKey: ['ai-logs'],
    queryFn: fetchAILogs,
    refetchInterval: 5000
  });

  const topBroadcast = logs && logs.length > 0 ? logs[0].action : 'Awaiting intelligence telemetry...';

  return (
    <motion.div 
      initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
      className="relative overflow-hidden bg-slate-900/80 backdrop-blur-md border border-slate-700/50 p-3.5 rounded-xl flex items-center gap-3 text-sm text-emerald-400 shadow-lg group mb-6"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-emerald-900/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
      <div className="p-1.5 bg-emerald-500/10 rounded-md border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
        <Bot size={16} className="text-emerald-400" />
      </div>
      <span className="font-bold uppercase text-[10px] tracking-widest shrink-0 text-emerald-300 flex items-center gap-2 mt-[1px]">
        Context Broadcast <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
      </span>
      <span className="text-slate-300 text-xs font-medium truncate relative z-10">{topBroadcast}</span>
    </motion.div>
  );
};
