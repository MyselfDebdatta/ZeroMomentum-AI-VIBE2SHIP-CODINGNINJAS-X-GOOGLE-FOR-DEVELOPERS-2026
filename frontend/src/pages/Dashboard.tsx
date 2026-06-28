import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { fetchTasks, fetchDiagnostics, fetchAILogs, acknowledgeLog } from '../services/api';
import { useUIStore } from '../store/uiStore';
import { Bot, Zap, Plus, AlertCircle, MonitorOff, Activity, Mail, CheckSquare, Code, ShieldAlert, CheckCircle, ChevronDown, ChevronUp, Search, Camera, Home } from 'lucide-react';

import { ContextBroadcast } from '../components/ContextBroadcast';

export const Dashboard: React.FC = () => {
  const { toggleTaskModal, toggleChat } = useUIStore();
  const navigate = useNavigate();
  const [activeFilter] = useState('All');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const [telemetryLogs, setTelemetryLogs] = useState<{time: string, msg: string}[]>([{ time: new Date().toLocaleTimeString(), msg: 'Standby mode.' }]);
  const [isLocked, setIsLocked] = useState(false);
  const [attentionScore, setAttentionScore] = useState<number | null>(null);
  const [mlStatus, setMlStatus] = useState<string>('Standby');
  const [isFaceLost, setIsFaceLost] = useState(false);

  // New Analytics State
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [sessionDuration, setSessionDuration] = useState<number>(0);
  const [distractionCount, setDistractionCount] = useState<number>(0);
  const [averageScore, setAverageScore] = useState<number>(100);
  const scoreHistoryRef = React.useRef<number[]>([]);
  const isCurrentlyDistractedRef = React.useRef<boolean>(false);

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s < 10 ? '0' : ''}${s}s`;
  };

  const getFocusState = () => {
    if (attentionScore === null || attentionScore === 0) return { label: 'ACQUIRING...', color: 'text-slate-400', border: 'border-slate-500/30' };
    if (attentionScore >= 85) return { label: 'PEAK FLOW', color: 'text-blue-400', border: 'border-blue-500/50' };
    if (attentionScore >= 50) return { label: 'ACTIVE', color: 'text-emerald-400', border: 'border-emerald-500/50' };
    return { label: 'DISTRACTED', color: 'text-rose-400', border: 'border-rose-500/50' };
  };
  
  const focusData = getFocusState();
  const multiplier = isLocked ? Math.max(1.0, 1.0 + (averageScore - 50) / 100).toFixed(2) : '1.00';

  const videoRef = React.useRef<HTMLVideoElement>(null);
  const streamRef = React.useRef<MediaStream | null>(null);
  const modelRef = React.useRef<any>(null);
  const requestRef = React.useRef<number | null>(null);

  const acknowledgeMutation = useMutation({
    mutationFn: acknowledgeLog,
    onSuccess: () => {
      refetchLogs();
    }
  });

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, []);

  useEffect(() => {
    let timer: any;
    if (isLocked && sessionStartTime) {
      timer = setInterval(() => {
        setSessionDuration(Math.floor((Date.now() - sessionStartTime) / 1000));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isLocked, sessionStartTime]);

  const addTelemetry = (msg: string) => {
    setTelemetryLogs(prev => {
      const newLogs = [{ time: new Date().toLocaleTimeString(), msg }, ...prev];
      return newLogs.slice(0, 3);
    });
  };

  const detectFace = async () => {
    if (!videoRef.current || !modelRef.current || !streamRef.current) return;

    try {
      const predictions = await modelRef.current.estimateFaces(videoRef.current, false);
      if (predictions.length > 0) {
        if (isFaceLost) {
          setIsFaceLost(false);
          addTelemetry('Subject acquired. Tracking engaged.');
        }
        
        // Map confidence (0-1) to an attention score (90-99%)
        const confidence = (predictions[0].probability[0] as number);
        let uiScore = Math.min(99, Math.max(90, Math.floor((confidence * 100) - (Math.random() * 5))));

        // Analyze spatial landmarks to detect sleeping / head down
        const landmarks = predictions[0].landmarks;
        if (landmarks && landmarks.length >= 4) {
          const rightEye = landmarks[0] as [number, number];
          const leftEye = landmarks[1] as [number, number];
          const nose = landmarks[2] as [number, number];
          const mouth = landmarks[3] as [number, number];

          // 1. Calculate Head Tilt (Roll)
          const dx = leftEye[0] - rightEye[0];
          const dy = leftEye[1] - rightEye[1];
          const angle = Math.abs(Math.atan2(dy, dx) * (180 / Math.PI));
          const tilt = Math.min(Math.abs(angle), Math.abs(180 - angle), Math.abs(360 - angle));

          let penalty = 0;
          if (tilt > 15) {
            penalty += (tilt - 15) * 2; // Penalize tilted head (sleeping on desk)
          }

          // 2. Calculate Head Pitch (Looking down)
          const eyeCenterY = (rightEye[1] + leftEye[1]) / 2;
          const eyeToNose = Math.abs(nose[1] - eyeCenterY);
          const noseToMouth = Math.abs(mouth[1] - nose[1]);
          
          if (noseToMouth > 0 && (eyeToNose / noseToMouth) > 1.8) {
             penalty += 45; // Penalize looking heavily downwards
          }

          uiScore = Math.max(0, Math.min(99, Math.floor(uiScore - penalty)));
        }

        setAttentionScore(uiScore);
        if (uiScore < 50) {
          setMlStatus('Distracted / Low Focus');
        } else {
          setMlStatus('Scanning');
        }

        scoreHistoryRef.current.push(uiScore);
        if (scoreHistoryRef.current.length > 20) scoreHistoryRef.current.shift();
        setAverageScore(Math.round(scoreHistoryRef.current.reduce((a, b) => a + b, 0) / scoreHistoryRef.current.length));

        if (uiScore < 40 && !isCurrentlyDistractedRef.current) {
          isCurrentlyDistractedRef.current = true;
          setDistractionCount(prev => prev + 1);
        } else if (uiScore >= 40) {
          isCurrentlyDistractedRef.current = false;
        }
      } else {
        setAttentionScore(0);
        setMlStatus('Subject Lost');
        if (!isFaceLost) {
          setIsFaceLost(true);
          addTelemetry('Warning: Subject lost from visual frame.');
        }

        scoreHistoryRef.current.push(0);
        if (scoreHistoryRef.current.length > 20) scoreHistoryRef.current.shift();
        setAverageScore(Math.round(scoreHistoryRef.current.reduce((a, b) => a + b, 0) / scoreHistoryRef.current.length));

        if (!isCurrentlyDistractedRef.current) {
          isCurrentlyDistractedRef.current = true;
          setDistractionCount(prev => prev + 1);
        }
      }
    } catch (e: any) {
      // frame error, ignore
    }
    
    // Throttle to save CPU
    setTimeout(() => {
      if (streamRef.current) {
        requestRef.current = requestAnimationFrame(detectFace);
      }
    }, 250);
  };

  const toggleLock = async () => {
    if (isLocked) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      setIsLocked(false);
      setAttentionScore(null);
      setMlStatus('Standby');
      setIsFaceLost(false);
      
      setSessionStartTime(null);
      isCurrentlyDistractedRef.current = false;
      addTelemetry('Lock disengaged. Visual stream closed.');
    } else {
      setIsLocked(true);
      setMlStatus('Initializing ML Engine...');
      addTelemetry('Requesting visual stream permissions...');
      
      setSessionStartTime(Date.now());
      setSessionDuration(0);
      setDistractionCount(0);
      setAverageScore(100);
      scoreHistoryRef.current = [];
      isCurrentlyDistractedRef.current = false;
      
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: "user" } 
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
        addTelemetry('Visual stream connected.');
        setMlStatus('Loading BlazeFace...');
        
        await (window as any).tf.ready();
        const model = await (window as any).blazeface.load();
        modelRef.current = model;
        
        addTelemetry('BlazeFace ML loaded. Scanning started.');
        setMlStatus('Tracking Active');
        
        detectFace();
      } catch (err: any) {
        setMlStatus('Failed');
        addTelemetry('Camera access denied or hardware error.');
        setIsLocked(false);
      }
    }
  };

  const { data: tasks, isLoading: tasksLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: fetchTasks,
  });

  const { data: diagnostics, isLoading: diagLoading } = useQuery({
    queryKey: ['diagnostics'],
    queryFn: fetchDiagnostics,
  });

  const { data: logs, refetch: refetchLogs } = useQuery({
    queryKey: ['ai-logs'],
    queryFn: fetchAILogs,
    refetchInterval: 3000,
  });

  const activeTasks = tasks?.filter((t: any) => t.status !== 'completed' && t.status !== 'deleted') || [];
  const activeCardNumbers = new Set(activeTasks.map((t: any) => t.cardNumber));

  const filteredLogs = logs?.filter((log: any) => {
    // Extract cardNumber from agentName (e.g., "AI Supervisor (TSK-GLUN)" or "AI Supervisor (TSK-1RGE)")
    const match = log.agentName.match(/\((TSK-[A-Z0-9]+)\)/i);
    if (match) {
      const cardNumber = match[1];
      if (!activeCardNumbers.has(cardNumber)) return false;
    }
    return activeFilter === 'All' || log.agentName === activeFilter;
  }) || [];
  
  const getDynamicRisk = (t: any) => {
    const baseRisk = t.baseMissRisk || 0;
    if (!t.deadline) return baseRisk;
    const diff = new Date(t.deadline).getTime() - Date.now();
    if (diff < 86400000 && diff > 0) {
      const penalty = Math.floor((1 - (diff / 86400000)) * (100 - baseRisk));
      return Math.min(100, baseRisk + penalty);
    }
    if (diff <= 0) return 100;
    return baseRisk;
  };

  // Escalate tasks to critical if AI marks them P3, or if true dynamic mathematical miss risk exceeds 90%
  const criticalTasks = activeTasks.filter((t: any) => t.priority === 3 || getDynamicRisk(t) > 90);



  return (
    <div className="space-y-6 pb-20 w-full mx-auto">
      {/* Top Header Row */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-slate-800/60 pb-6 mb-2">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-4">
          <div className="p-2 bg-emerald-500/20 rounded-lg border border-emerald-500/30 shrink-0">
            <Activity className="text-emerald-400" size={28} /> 
          </div>
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-black text-white uppercase tracking-wide drop-shadow-md">
              Command Center Dashboard
            </h1>
            <p className="text-sm text-slate-400 font-medium flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
              Live status: <span className="text-white">{activeTasks.length} workload</span>, <span className="text-rose-400 drop-shadow-[0_0_8px_rgba(225,29,72,0.5)]">{criticalTasks.length} critical deadlines.</span>
            </p>
          </div>
        </motion.div>
        
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-wrap items-center justify-end gap-3 w-full md:w-auto">
          <button 
            onClick={() => navigate('/')}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-gradient-to-b from-emerald-500 to-emerald-700 hover:from-emerald-400 hover:to-emerald-600 text-white px-5 py-2.5 rounded-lg font-bold text-xs uppercase tracking-wider transition-all duration-300 shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:shadow-[0_0_30px_rgba(16,185,129,0.6)] hover:-translate-y-0.5 border border-emerald-400/30"
          >
            <Home size={16} /> Back
          </button>
          <button 
            onClick={toggleChat}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-gradient-to-b from-indigo-500 to-indigo-700 hover:from-indigo-400 hover:to-indigo-600 text-white px-5 py-2.5 rounded-lg font-bold text-xs uppercase tracking-wider transition-all duration-300 shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:shadow-[0_0_30px_rgba(99,102,241,0.6)] hover:-translate-y-0.5 border border-indigo-400/30"
          >
            <Bot size={16} className="animate-pulse drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]" /> AI Assistant
          </button>
          <button 
            onClick={toggleTaskModal} 
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-gradient-to-b from-blue-500 to-blue-700 hover:from-blue-400 hover:to-blue-600 text-white px-5 py-2.5 rounded-lg font-bold text-xs uppercase tracking-wider transition-all duration-300 shadow-[0_0_20px_rgba(37,99,235,0.4)] hover:shadow-[0_0_30px_rgba(59,130,246,0.6)] hover:-translate-y-0.5 border border-blue-400/30"
          >
            <Plus size={16} /> Deploy Task Agent
          </button>
        </motion.div>
      </div>
      
      <ContextBroadcast />


      {/* Giant Workspace Header - Premium Glassmorphic Redesign */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative p-[1px] rounded-2xl overflow-hidden group shadow-2xl shadow-blue-900/20"
      >
        {/* Animated Gradient Border */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600 opacity-30 group-hover:opacity-70 transition-opacity duration-1000 animate-pulse" />
        
        {/* Core Card */}
        <div className="relative bg-slate-950/90 backdrop-blur-2xl border border-white/5 p-8 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-8 overflow-hidden h-full">
          {/* Background grid & subtle glow */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-blue-900/20 via-slate-950/0 to-slate-950/0" />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:24px_24px] opacity-40" />
          
          <div className="relative z-10 flex-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                <Activity size={20} className="text-blue-400" />
              </div>
              <h1 className="text-2xl md:text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white via-blue-100 to-slate-300 uppercase tracking-wide drop-shadow-sm">
                Autonomous Intelligence Workspace
              </h1>
            </div>
            <p className="text-sm text-slate-400 max-w-2xl leading-relaxed font-medium">
              ZeroMomentum AI orchestrates specialized agents to actively calculate deadline failure percentages, parse inbox updates into schedules, and execute emergency timeline recoveries in real-time.
            </p>
          </div>

          <div className="relative z-10 flex gap-4 md:gap-6">
            <div className="bg-slate-900/80 border border-slate-700/50 px-6 py-4 rounded-xl flex flex-col items-center justify-center min-w-[120px] shadow-inner transition-transform hover:scale-105">
              <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1 flex items-center gap-1.5"><CheckSquare size={12}/> Pending Load</p>
              <p className="text-4xl font-black text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">{tasksLoading ? '-' : activeTasks.length}</p>
            </div>
            <div className="bg-rose-950/30 border border-rose-900/50 px-6 py-4 rounded-xl flex flex-col items-center justify-center min-w-[120px] shadow-[inset_0_0_20px_rgba(225,29,72,0.05)] transition-transform hover:scale-105">
              <p className="text-[10px] uppercase tracking-widest text-rose-500 font-bold mb-1 flex items-center gap-1.5"><AlertCircle size={12}/> Critical Threat</p>
              <p className="text-4xl font-black text-rose-400 drop-shadow-[0_0_15px_rgba(225,29,72,0.6)]">{tasksLoading ? '-' : criticalTasks.length}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main Widgets Layout */}
      <div className="flex flex-col gap-8">
        
      {/* Top Widgets Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* Widget 2: Context Broadcasts */}
        <div className="relative group bg-slate-950/60 backdrop-blur-xl border border-slate-700/50 p-6 rounded-2xl flex flex-col overflow-hidden shadow-lg hover:shadow-[0_0_30px_rgba(59,130,246,0.15)] transition-all duration-500 hover:-translate-y-1 h-[500px]">
          <div className="absolute inset-0 bg-gradient-to-bl from-emerald-600/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
          
          <div className="relative z-10 flex justify-between items-start mb-4">
            <div>
              <h3 className="text-xs uppercase tracking-widest font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-300">Context Broadcasts</h3>
            </div>
            <span className="text-[10px] text-emerald-400 uppercase tracking-widest font-bold flex items-center gap-1.5 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping absolute" />
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full relative" />
              Live Link
            </span>
          </div>

          <div className="relative z-10 space-y-3 flex-1 overflow-y-auto custom-scrollbar pr-2 pb-2">
            {filteredLogs.length > 0 ? filteredLogs.map((log: any) => {
              const isExpanded = expandedLogId === log.id;
              const isAcknowledged = log.isAcknowledged;

              return (
                <div key={log.id} className={`border p-4 rounded-xl backdrop-blur-sm transition-all duration-300 shadow-inner overflow-hidden ${
                  isAcknowledged ? 'bg-slate-900/30 border-slate-800/30 opacity-70' : 'bg-slate-900/60 border-slate-700/50 hover:bg-slate-800/60 hover:border-slate-600/50'
                }`}>
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex-1">
                      <p className={`text-[11px] font-bold tracking-wide flex items-center gap-2 mb-2 ${isAcknowledged ? 'text-slate-500' : 'text-emerald-400'}`}>
                        <span className={`p-1 rounded border transition-colors ${isAcknowledged ? 'bg-slate-800/50 border-slate-700' : 'bg-emerald-500/10 border-emerald-500/20'}`}>
                          <Bot size={12}/>
                        </span>
                        {log.agentName}
                      </p>
                      <p className={`text-sm leading-relaxed ${isAcknowledged ? 'text-slate-500 line-through' : 'text-slate-300'}`}>{log.action}</p>
                    </div>
                    
                    {!isAcknowledged && (
                      <button 
                        onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded border border-slate-700 text-slate-400 hover:text-white transition-colors"
                        title="View JSON Payload"
                      >
                        {isExpanded ? <ChevronUp size={14} /> : <Code size={14} />}
                      </button>
                    )}
                  </div>
                  
                  {isExpanded && !isAcknowledged && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }} 
                      animate={{ height: 'auto', opacity: 1 }} 
                      className="mt-4 pt-4 border-t border-slate-700/50"
                    >
                      <div className="mb-4 text-xs text-slate-300 bg-slate-900/50 border border-slate-700/50 p-3 rounded-lg shadow-inner">
                        {log.details?.taskTitle && <p className="mb-1"><strong className="text-emerald-400">Task Target:</strong> {log.details.taskTitle}</p>}
                        {log.details?.baseMissRisk !== undefined && <p className="mb-1"><strong className="text-emerald-400">Calculated Baseline Risk:</strong> {log.details.baseMissRisk}%</p>}
                        {log.details?.deadline && log.details.deadline !== 'None specified' && (
                          <p className="mb-1"><strong className="text-emerald-400">Deadline:</strong> {new Date(log.details.deadline).toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' })}</p>
                        )}
                        
                        {log.details?.generatedSubtasks && log.details.generatedSubtasks.length > 0 && (
                          <div className="mt-2">
                            <strong className="text-emerald-400">Execution Strategy:</strong>
                            <ul className="list-disc pl-5 mt-1 space-y-1">
                              {log.details.generatedSubtasks.map((st: string, idx: number) => (
                                <li key={idx} className="text-slate-400">{st}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {/* Fallback for general chat logs */}
                        {log.details?.task && !log.details?.generatedSubtasks && (
                          <div className="space-y-2 mt-1">
                            <p className="mb-1"><strong className="text-emerald-400">Parsed Task:</strong> {log.details.task.title}</p>
                            {log.details.task.deadline && (
                              <p className="mb-1"><strong className="text-emerald-400">Deadline:</strong> {new Date(log.details.task.deadline).toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' })}</p>
                            )}
                            {log.details.task.subtasks && log.details.task.subtasks.length > 0 && (
                              <div className="mt-2">
                                <strong className="text-emerald-400">Execution Strategy:</strong>
                                <ul className="list-disc pl-5 mt-1 space-y-1">
                                  {log.details.task.subtasks.map((st: string, idx: number) => (
                                    <li key={idx} className="text-slate-400">{st}</li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {log.details.schedule && log.details.schedule.length > 0 && (
                              <div className="mt-3 border-t border-slate-700/50 pt-3">
                                <strong className="text-indigo-400 uppercase tracking-widest text-[9px] mb-2 block">Scheduling Logic / Reasoning</strong>
                                <ul className="space-y-2">
                                  {log.details.schedule.map((sch: any, idx: number) => (
                                    <li key={idx} className="text-slate-400 flex flex-col bg-slate-950/40 p-2 rounded border border-slate-800/50">
                                      <span className="text-slate-300 italic mb-1">"{sch.reason}"</span>
                                      <span className="text-[9px] text-slate-500 uppercase tracking-widest font-mono">
                                        Block: {new Date(sch.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} — {new Date(sch.endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                      </span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="bg-[#0b1120] border border-slate-800 p-3 rounded-lg mb-4 overflow-x-auto custom-scrollbar">
                        <pre className="text-[10px] font-mono text-emerald-300/80">
                          {JSON.stringify(log.details, null, 2)}
                        </pre>
                      </div>
                      
                      <div className="flex gap-2">
                        <button 
                          onClick={() => {
                            toggleChat();
                          }}
                          className="flex-1 py-1.5 flex justify-center items-center gap-1.5 text-[10px] uppercase tracking-widest font-bold bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded shadow-inner transition-colors"
                        >
                          <Search size={12} /> Investigate
                        </button>
                        <button 
                          onClick={() => {
                            acknowledgeMutation.mutate(log.id);
                            setExpandedLogId(null);
                          }}
                          disabled={acknowledgeMutation.isPending}
                          className="flex-1 py-1.5 flex justify-center items-center gap-1.5 text-[10px] uppercase tracking-widest font-bold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded shadow-inner transition-colors disabled:opacity-50"
                        >
                          {acknowledgeMutation.isPending ? 'Saving...' : <><CheckCircle size={12} /> Acknowledge</>}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </div>
              );
            }) : (
              <div className="h-full flex items-center justify-center border border-slate-800/50 rounded-xl bg-slate-950/50 p-6 shadow-inner">
                <p className="text-slate-500 text-sm font-medium">No recent agent activity matching filter.</p>
              </div>
            )}
          </div>
        </div>

        {/* Widget 3: System Diagnostics */}
        <div className="relative group bg-slate-950/60 backdrop-blur-xl border border-slate-700/50 p-6 rounded-2xl flex flex-col overflow-hidden shadow-lg hover:shadow-[0_0_30px_rgba(59,130,246,0.15)] transition-all duration-500 hover:-translate-y-1 h-[500px]">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 via-indigo-900/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          
          <div className="relative z-10">
            <h3 className="text-xs uppercase tracking-widest font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-300 mb-1 flex items-center gap-2">
              <Activity size={14} className="text-blue-400" /> System Diagnostics
            </h3>
            <p className="text-[10px] text-slate-500 mb-8 font-medium">Real-time dynamic environment database records</p>
          </div>

          <div className="grid grid-cols-2 gap-4 flex-1 relative z-10">
            {[
              { label: 'Dynamic Tasks Logged', value: diagLoading ? '-' : diagnostics?.dynamicTasks || 0 },
              { label: 'Completed Workloads', value: diagLoading ? '-' : diagnostics?.completedWorkloads || 0 },
              { label: 'Habits Enrolled', value: diagLoading ? '-' : diagnostics?.habitsEnrolled || 0 },
              { label: 'Inbox Email Stacks', value: diagLoading ? '-' : diagnostics?.inboxStacks || 0 },
            ].map((stat, i) => (
              <div key={i} className="group/stat relative bg-slate-900/40 backdrop-blur-md border border-slate-700/50 rounded-xl p-4 overflow-hidden shadow-inner hover:shadow-[0_0_20px_rgba(59,130,246,0.15)] hover:border-blue-500/30 hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-transparent opacity-0 group-hover/stat:opacity-100 transition-opacity duration-500 pointer-events-none" />
                
                <div className="relative z-10 flex items-center gap-2 mb-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-700 group-hover/stat:bg-blue-400 transition-colors duration-300 shadow-[0_0_5px_currentColor]" />
                  <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest font-sans group-hover/stat:text-blue-300 transition-colors leading-tight">
                    {stat.label}
                  </span>
                </div>
                
                <div className="relative z-10 text-white font-black text-4xl tracking-wide group-hover/stat:text-blue-50 transition-colors">
                  {stat.value}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 relative z-10 overflow-hidden border border-indigo-500/30 bg-slate-900/80 backdrop-blur-sm p-4 rounded-xl flex items-start gap-3 shadow-[0_0_15px_rgba(99,102,241,0.1)] group-hover:shadow-[0_0_20px_rgba(99,102,241,0.2)] transition-shadow duration-500">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-transparent opacity-50" />
            <Zap className="text-indigo-400 shrink-0 mt-0.5 animate-pulse relative z-10" size={16} />
            <p className="text-xs text-indigo-300 font-medium leading-relaxed relative z-10">
              Every task added triggers autonomous analysis of failure risks and generates 3-5 subtasks!
            </p>
          </div>
        </div>
      </div>
    </div>


{/* Widget 1: Deep Focus Meter (Full Width Cinematic Box) */}
        <div className="relative group bg-slate-950/80 backdrop-blur-2xl border border-slate-700/50 p-8 rounded-3xl flex flex-col overflow-hidden shadow-lg transition-all duration-500 hover:shadow-[0_0_60px_rgba(16,185,129,0.1)]">
           <div className="absolute inset-0 bg-gradient-to-b from-emerald-900/10 via-transparent to-transparent opacity-50" />
           
           <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
             <div>
               <h3 className="text-sm uppercase tracking-widest font-black text-emerald-400 mb-1 flex items-center gap-2">
                 <Camera size={16} /> Deep Focus Meter
               </h3>
               <p className="text-[11px] text-slate-400 font-medium tracking-wide">Live facial telemetry active. Machine learning spatial tracking enabled.</p>
             </div>
             
             <div className="flex items-center gap-6">
               <div className="text-right">
                 <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">Attention Focus</p>
                 <p className={`text-4xl font-black transition-colors ${attentionScore !== null && attentionScore > 0 ? 'text-emerald-400' : 'text-slate-600'}`}>{attentionScore !== null ? `${attentionScore}%` : '--%'}</p>
               </div>
               
               <button 
                 onClick={toggleLock}
                 className={`px-6 py-3 border text-xs font-bold rounded-full shadow-inner flex items-center gap-2 backdrop-blur-sm transition-all cursor-pointer ${isLocked ? 'border-emerald-500/50 bg-emerald-900/30 text-emerald-400 hover:bg-emerald-900/50 hover:shadow-[0_0_20px_rgba(16,185,129,0.4)]' : 'border-slate-700/80 bg-slate-900/80 text-slate-400 hover:bg-slate-800'}`}
               >
                 <div className={`w-2.5 h-2.5 rounded-full ${isLocked ? 'bg-emerald-500 animate-pulse' : 'bg-slate-600'}`} /> {isLocked ? 'Hardware Locked' : 'Standby Mode'}
               </button>
             </div>
           </div>
           
           <div className="relative z-10 flex-1 flex flex-col items-center justify-center border border-slate-800/80 rounded-2xl bg-[#030712] shadow-[inset_0_0_50px_rgba(0,0,0,1)] p-0 mb-6 group/scan overflow-hidden aspect-video w-full max-h-[550px]">


             {isLocked ? (
               <>
                 <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-screen" muted playsInline />
                 <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.15)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.15)_1px,transparent_1px)] bg-[size:30px_30px] pointer-events-none" />
                 <div className="absolute top-0 left-0 w-full h-1 bg-emerald-400 shadow-[0_0_20px_rgba(16,185,129,1)]" style={{ animation: 'scan 2.5s linear infinite' }} />
                 <div className="absolute inset-0 pointer-events-none border-2 border-emerald-500/20 m-8 rounded-3xl" />
                 
                 {/* Neural HUD Overlays */}
                 <div className="absolute top-12 left-12 flex flex-col gap-3">
                   <div className="px-4 py-2 bg-black/60 backdrop-blur-md border border-slate-700/50 rounded-lg flex flex-col shadow-[0_0_20px_rgba(0,0,0,0.8)]">
                     <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Session Duration</span>
                     <span className="text-xl font-black text-emerald-400 font-mono tracking-wider">{formatDuration(sessionDuration)}</span>
                   </div>
                   <div className="px-4 py-2 bg-black/60 backdrop-blur-md border border-rose-900/50 rounded-lg flex flex-col shadow-[0_0_20px_rgba(0,0,0,0.8)]">
                     <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Distraction Events</span>
                     <span className="text-xl font-black text-rose-400 font-mono tracking-wider">{distractionCount} <span className="text-xs text-rose-500/50">detected</span></span>
                   </div>
                 </div>

                 <div className="absolute top-12 right-12 flex flex-col gap-3 items-end">
                   <div className="px-4 py-2 bg-black/60 backdrop-blur-md border border-slate-700/50 rounded-lg flex flex-col items-end shadow-[0_0_20px_rgba(0,0,0,0.8)]">
                     <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Session Average</span>
                     <span className="text-xl font-black text-blue-400 font-mono tracking-wider">{averageScore}%</span>
                   </div>
                   <div className="px-4 py-2 bg-black/60 backdrop-blur-md border border-purple-900/50 rounded-lg flex flex-col items-end shadow-[0_0_20px_rgba(0,0,0,0.8)]">
                     <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Productivity Multiplier</span>
                     <span className="text-xl font-black text-purple-400 font-mono tracking-wider">{multiplier}x <span className="text-xs text-purple-500/50">output</span></span>
                   </div>
                 </div>

                 <div className="absolute bottom-6 left-6 px-5 py-3 bg-black/70 backdrop-blur-md border border-slate-700/80 rounded-xl flex flex-col shadow-[0_0_30px_rgba(0,0,0,0.9)]">
                   <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Neural State Classification</span>
                   <div className={`text-2xl font-black tracking-widest ${focusData.color} drop-shadow-md`}>
                     {focusData.label}
                   </div>
                 </div>

                 <div className="absolute bottom-6 right-6 px-4 py-2 bg-black/60 backdrop-blur-md border border-emerald-500/30 rounded-lg flex items-center gap-3 shadow-[0_0_20px_rgba(0,0,0,0.8)]">
                   <div className={`w-2 h-2 rounded-full ${attentionScore !== null && attentionScore > 0 ? 'bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,1)]' : 'bg-rose-500 shadow-[0_0_10px_rgba(225,29,72,1)]'}`} />
                   <span className="text-xs font-black text-slate-200 uppercase tracking-widest">{mlStatus}</span>
                 </div>
               </>
             ) : (
               <>
                 <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-800/30 to-transparent opacity-50 group-hover/scan:opacity-100 transition-opacity" />
                 <Camera size={48} className="text-slate-700 mb-6 drop-shadow-lg transition-transform group-hover/scan:scale-110 duration-700" />
                 <p className="text-lg font-black text-slate-500 tracking-widest uppercase">Visual Telemetry Offline</p>
                 <p className="text-xs text-slate-600 mt-2 font-medium tracking-wide">Click 'Standby Mode' to initialize neural network.</p>
               </>
             )}
           </div>

           <div className="relative z-10 border border-slate-700/50 rounded-xl p-4 bg-slate-900/60 backdrop-blur-md">
             <div className="flex justify-between items-center mb-3">
               <span className="text-xs text-slate-400 uppercase tracking-widest font-bold flex items-center gap-2"><Activity size={14} className="text-emerald-500" /> Terminal Telemetry Logs</span>
             </div>
             <div className="space-y-1.5 h-[60px] overflow-hidden">
               {telemetryLogs.map((log, idx) => (
                 <p key={idx} className={`text-xs font-mono truncate ${idx === 0 ? 'text-emerald-400/90' : 'text-slate-600'}`}><span className={`${idx === 0 ? 'text-emerald-600' : 'text-slate-700'} mr-3`}>[{log.time}]</span>{log.msg}</p>
               ))}
             </div>
           </div>
        </div>

            {/* Bottom Data Table: Critical Deadlines Log */}
      <div className="relative group bg-slate-950/60 backdrop-blur-xl border border-slate-700/50 p-6 rounded-2xl overflow-hidden shadow-lg transition-all duration-500 hover:shadow-[0_0_30px_rgba(225,29,72,0.1)] hover:-translate-y-1">
        <div className="absolute inset-0 bg-gradient-to-t from-rose-900/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 border-b border-slate-800/60 pb-4">
          <h3 className="text-xs uppercase tracking-widest font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-300 flex items-center gap-2">
            <AlertCircle size={14} className="text-blue-400" /> Critical Deadlines Log
          </h3>
          <button 
            onClick={() => navigate('/tasks')}
            className="text-[10px] text-white uppercase tracking-widest font-bold cursor-pointer transition-all duration-300 bg-gradient-to-b from-blue-600 to-blue-800 px-4 py-2 rounded-lg border border-blue-400/30 shadow-[0_0_15px_rgba(37,99,235,0.3)] hover:shadow-[0_0_25px_rgba(37,99,235,0.5)] hover:from-blue-500 hover:to-blue-700 flex items-center gap-1.5 hover:-translate-y-0.5"
          >
            View All Analyzer Controls <span className="text-blue-200">→</span>
          </button>
        </div>
        
        <div className="w-full relative z-10 overflow-x-auto pb-4 custom-scrollbar">
          <div className="min-w-[600px] md:min-w-0">
            <div className="grid grid-cols-12 gap-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-800/80 pb-3 mb-2 px-3 bg-slate-900/30 rounded-t-lg pt-3">
            <div className="col-span-1">Priority</div>
            <div className="col-span-5">Task Designation</div>
            <div className="col-span-3">Time Estimate</div>
            <div className="col-span-3 text-right">Status Code</div>
          </div>
          
          {criticalTasks.length > 0 ? criticalTasks.map((task: any) => (
            <div key={task.id} className="grid grid-cols-12 gap-4 items-center text-sm py-3 px-3 border-b border-slate-800/40 last:border-0 hover:bg-slate-800/40 transition-colors group/row rounded-lg">
              <div className="col-span-1">
                <span className="text-[10px] text-rose-400 font-bold uppercase tracking-widest bg-rose-500/10 border border-rose-500/30 px-2 py-1 rounded shadow-[0_0_10px_rgba(225,29,72,0.2)] group-hover/row:bg-rose-500/20 group-hover/row:shadow-[0_0_15px_rgba(225,29,72,0.4)] transition-all">P{task.priority || 3}</span>
              </div>
              <div className="col-span-5 font-bold text-slate-300 truncate group-hover/row:text-white transition-colors">
                {task.cardNumber ? <span className="text-[10px] text-slate-500 mr-2 tracking-wider">[{task.cardNumber}]</span> : null}
                {task.title}
              </div>
              <div className="col-span-3 font-mono text-xs text-slate-400 group-hover/row:text-blue-300 transition-colors">{task.estimatedTime} min</div>
              <div className="col-span-3 text-right flex justify-end">
                <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 rounded shadow-inner flex items-center gap-1.5 group-hover/row:bg-emerald-500/20 transition-all">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" /> Active_Scan
                </span>
              </div>
            </div>
          )) : (
            <div className="text-center py-10 mt-2 text-sm text-slate-500 font-medium border border-slate-800/50 rounded-xl bg-slate-900/30 shadow-inner">
              No critical deadlines detected in the current telemetry window.
            </div>
          )}
          </div>
        </div>
      </div>
    </div>
  );
};
