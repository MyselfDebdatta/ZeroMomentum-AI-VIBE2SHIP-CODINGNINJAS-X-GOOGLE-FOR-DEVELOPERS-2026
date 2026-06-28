import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  LayoutDashboard, CheckSquare, Calendar, Bot, MessageSquare, BookOpen, 
  Activity, ChevronDown, ChevronRight, Zap, Target, Shield, Command, Eye, 
  Cpu, Network, Focus, BrainCircuit, Mic, Workflow, Clock,
  Mail, MapPin, Phone, Menu, X
} from 'lucide-react';

// --- Custom Brand Icons (Missing from older lucide-react versions) ---
const GithubIcon = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.2c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

const LinkedinIcon = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect x="2" y="9" width="4" height="12" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

const InstagramIcon = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

const WhatsappIcon = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
  </svg>
);

// --- Shared Animation Components ---
const FadeIn = ({ children, delay = 0, direction = "up" }: any) => {
  const yOffset = direction === "up" ? 40 : direction === "down" ? -40 : 0;
  const xOffset = direction === "left" ? 40 : direction === "right" ? -40 : 0;
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: yOffset, x: xOffset }} 
      whileInView={{ opacity: 1, y: 0, x: 0 }} 
      viewport={{ once: true, margin: "-100px" }} 
      transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
};

const BentoCard = ({ title, desc, icon, span = 1, gradient = "from-indigo-500/10 to-blue-500/10" }: any) => (
  <motion.div 
    whileHover={{ y: -5 }} 
    className={`p-6 md:p-8 rounded-3xl bg-slate-900/60 border border-slate-700/50 backdrop-blur-xl shadow-2xl flex flex-col gap-4 relative overflow-hidden group hover:border-slate-500/50 hover:shadow-[0_0_40px_rgba(59,130,246,0.15)] transition-all duration-300 ${span === 2 ? 'md:col-span-2' : ''} ${span === 3 ? 'md:col-span-3' : ''}`}
  >
    <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-700`} />
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    
    <div className="p-3 bg-slate-950/80 border border-slate-700/50 rounded-2xl w-max shadow-inner group-hover:scale-110 transition-transform duration-500 relative z-10">
      {icon}
    </div>
    <div className="relative z-10">
      <h3 className="text-xl font-black text-slate-100 mb-2 tracking-wide">{title}</h3>
      <p className="text-sm text-slate-400 leading-relaxed font-medium">{desc}</p>
    </div>
  </motion.div>
);

const SectionHeader = ({ title, subtitle, icon, centered = false }: any) => (
  <div className={`mb-12 md:mb-20 flex flex-col ${centered ? "items-center text-center" : "items-start text-left"}`}>
    <div className={`flex flex-col md:flex-row items-center gap-5 mb-6 ${centered ? "justify-center" : "justify-start"}`}>
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        whileInView={{ scale: 1, opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="p-4 bg-slate-900/80 rounded-2xl border border-slate-700/50 shadow-[0_0_30px_rgba(59,130,246,0.15)] shrink-0"
      >
        {icon}
      </motion.div>
      <FadeIn>
        <h2 className="text-3xl md:text-5xl font-black text-white uppercase tracking-wide">
          {title}
        </h2>
      </FadeIn>
    </div>
    <FadeIn delay={0.1}>
      <p className="text-lg text-slate-400 max-w-2xl font-medium tracking-wide">
        {subtitle}
      </p>
    </FadeIn>
  </div>
);

// --- Space Background Animation ---
const SpaceBackground = () => {
  const stars = Array.from({ length: 150 }).map((_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    size: Math.random() * 2 + 0.5,
    delay: Math.random() * 5,
    duration: Math.random() * 4 + 2,
  }));

  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-[#020617]">
      {/* Dense Starfield */}
      {stars.map((star) => (
        <motion.div
          key={star.id}
          initial={{ opacity: Math.random() * 0.5 }}
          animate={{ opacity: [0.1, 0.8, 0.1] }}
          transition={{ duration: star.duration, repeat: Infinity, delay: star.delay, ease: "easeInOut" }}
          className="absolute rounded-full bg-white"
          style={{
            left: star.left,
            top: star.top,
            width: `${star.size}px`,
            height: `${star.size}px`,
            boxShadow: star.size > 1.5 ? '0 0 4px rgba(255,255,255,0.8)' : 'none'
          }}
        />
      ))}
      
      {/* Occasional Shooting Stars */}
      <motion.div 
        initial={{ x: '120vw', y: '-10vh', opacity: 0 }}
        animate={{ x: '-20vw', y: '120vh', opacity: [0, 1, 1, 0] }}
        transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 8, ease: "linear" }}
        className="absolute w-[2px] h-32 bg-gradient-to-b from-white to-transparent rotate-45 blur-[1px]"
        style={{ right: '20%', top: '-10%' }}
      />
    </div>
  );
};

// --- Module Layout Components ---
const FeatureRow = ({ title, desc, icon, index = 0 }: any) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.6, delay: index * 0.1 }}
    className="flex flex-col md:flex-row items-center gap-6 p-6 md:p-8 bg-slate-900/40 backdrop-blur-md border border-slate-700/50 rounded-3xl hover:bg-slate-900/60 hover:border-slate-500/50 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group"
  >
    <div className="p-4 bg-slate-800/50 rounded-2xl border border-slate-700/50 shrink-0 group-hover:scale-110 transition-transform duration-500">
      {icon}
    </div>
    <div>
      <h3 className="text-xl font-black text-white mb-2 tracking-wide uppercase">{title}</h3>
      <p className="text-slate-400 leading-relaxed font-medium">{desc}</p>
    </div>
  </motion.div>
);

const StatCard = ({ title, desc, icon, value }: any) => (
  <motion.div 
    whileHover={{ y: -5 }}
    className="p-6 bg-slate-900/40 backdrop-blur-md border border-slate-700/50 rounded-3xl flex flex-col items-center text-center gap-4 relative overflow-hidden group shadow-lg hover:shadow-2xl hover:border-slate-500/50 hover:bg-slate-900/60 transition-all duration-300"
  >
    <div className="absolute -top-4 -right-4 p-4 text-slate-500 opacity-20 group-hover:opacity-40 transition-opacity scale-[2]">{icon}</div>
    <div className="text-4xl md:text-5xl font-black text-white drop-shadow-md">{value}</div>
    <div className="relative z-10">
      <h4 className="text-sm font-black text-slate-200 uppercase tracking-widest mb-2">{title}</h4>
      <p className="text-xs text-slate-500 leading-relaxed font-medium">{desc}</p>
    </div>
  </motion.div>
);

const TechTerminal = ({ title, desc, command, delay = 0 }: any) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.6, delay }}
    whileHover={{ y: -5 }}
    className="bg-[#0a0f1c] border border-slate-800 rounded-2xl overflow-hidden shadow-2xl font-mono relative group hover:border-slate-600 hover:shadow-[0_0_40px_rgba(16,185,129,0.15)] transition-all duration-300"
  >
    <div className="px-4 py-3 bg-[#111827] border-b border-slate-800 flex items-center gap-2">
      <div className="w-2.5 h-2.5 rounded-full bg-rose-500/50" />
      <div className="w-2.5 h-2.5 rounded-full bg-amber-500/50" />
      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/50" />
      <span className="ml-3 text-slate-500 text-[10px] uppercase tracking-widest">agent_node.exe</span>
    </div>
    <div className="p-6 md:p-8">
      <div className="flex items-center gap-3 text-emerald-400 mb-6 font-bold">
        <span>$</span>
        <span className="opacity-80 group-hover:opacity-100 transition-opacity">{command}</span>
      </div>
      <h3 className="text-lg font-black text-white uppercase tracking-wider mb-3">{title}</h3>
      <p className="text-sm text-slate-400 leading-relaxed opacity-90">{desc}</p>
    </div>
  </motion.div>
);

const InboxRow = ({ sender, subject, summary, isPriority, delay = 0 }: any) => (
  <motion.div 
    initial={{ opacity: 0, x: -20 }}
    whileInView={{ opacity: 1, x: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5, delay }}
    whileHover={{ x: 10 }}
    className={`p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-l-4 ${isPriority ? 'border-l-sky-400 bg-sky-900/20 hover:bg-sky-900/30' : 'border-l-slate-700 bg-slate-900/40 hover:bg-slate-900/60'} border-y border-r border-y-slate-800/50 border-r-slate-800/50 rounded-r-2xl backdrop-blur-sm transition-all duration-300 cursor-default hover:shadow-lg`}
  >
    <div className="flex-1">
      <div className="flex items-center gap-3 mb-2">
        <span className="font-bold text-slate-200">{sender}</span>
        {isPriority && <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-sky-500/20 text-sky-400 uppercase tracking-widest shadow-inner">Priority</span>}
      </div>
      <h4 className="text-base text-slate-300 font-bold mb-3">{subject}</h4>
      <p className="text-sm text-slate-400 leading-relaxed border-l-2 border-slate-700/50 pl-4 italic">{summary}</p>
    </div>
  </motion.div>
);

const HolographicCore = ({ onLogoClick }: { onLogoClick?: () => void }) => (
  <div className="relative w-[350px] h-[350px] md:w-[450px] md:h-[450px] flex items-center justify-center group">
    <div className="absolute inset-0 rounded-full border border-emerald-500/30 shadow-[0_0_50px_rgba(16,185,129,0.1)] animate-[spin_10s_linear_infinite]" style={{ transformStyle: 'preserve-3d', transform: 'rotateX(70deg) rotateY(20deg)' }} />
    <div className="absolute inset-8 rounded-full border border-cyan-500/40 shadow-[0_0_40px_rgba(6,182,212,0.2)] animate-[spin_15s_linear_infinite_reverse]" style={{ transformStyle: 'preserve-3d', transform: 'rotateX(50deg) rotateY(-30deg)' }} />
    <div className="absolute inset-16 rounded-full border border-indigo-500/50 shadow-[0_0_30px_rgba(99,102,241,0.3)] animate-[spin_20s_linear_infinite]" style={{ transformStyle: 'preserve-3d', transform: 'rotateX(60deg) rotateY(10deg)' }} />

    <motion.div animate={{ y: [-15, 15, -15] }} transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }} className="absolute -top-4 -left-4 w-12 h-12 bg-slate-900/80 border border-emerald-500/50 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.5)] z-20 backdrop-blur-xl">
      <Eye size={24} className="text-emerald-400" />
    </motion.div>
    <motion.div animate={{ y: [15, -15, 15] }} transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 1 }} className="absolute bottom-10 -right-4 w-12 h-12 bg-slate-900/80 border border-cyan-500/50 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.5)] z-20 backdrop-blur-xl">
      <BrainCircuit size={24} className="text-cyan-400" />
    </motion.div>
    <motion.div animate={{ y: [-20, 20, -20] }} transition={{ repeat: Infinity, duration: 6, ease: "easeInOut", delay: 2 }} className="absolute -bottom-10 left-10 w-12 h-12 bg-slate-900/80 border border-indigo-500/50 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.5)] z-20 backdrop-blur-xl">
      <Workflow size={24} className="text-indigo-400" />
    </motion.div>

    <motion.div 
      animate={{ y: [-10, 10, -10] }} 
      transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
      className="relative z-10 w-48 h-48 bg-slate-950/60 border border-slate-700/80 rounded-3xl backdrop-blur-md shadow-[0_0_50px_rgba(0,0,0,0.8),inset_0_0_30px_rgba(255,255,255,0.05)] flex items-center justify-center group-hover:scale-110 transition-transform duration-500 overflow-hidden"
    >
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:12px_12px] opacity-30" />
      <motion.img 
        src="/logo.png" 
        alt="ZeroMomentum AI" 
        className={`w-28 h-28 drop-shadow-[0_0_40px_rgba(59,130,246,1)] relative z-20 ${onLogoClick ? 'cursor-pointer' : ''}`}
        onClick={onLogoClick}
        animate={{ rotateY: 360 }}
        transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
      />
      <motion.div 
        className="absolute left-0 right-0 h-[3px] bg-emerald-400/80 shadow-[0_0_20px_rgba(16,185,129,1)] z-30"
        animate={{ top: ['0%', '100%', '0%'] }}
        transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
      />
    </motion.div>
    
    <div className="absolute -bottom-8 md:-bottom-12 left-1/2 -translate-x-1/2 whitespace-nowrap px-5 py-2 bg-slate-900/90 border border-slate-700/50 rounded-full shadow-[0_10px_30px_rgba(0,0,0,0.5)] backdrop-blur-md">
      <p className="text-[10px] md:text-xs font-mono text-emerald-400 tracking-widest uppercase flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.8)] animate-ping"></span>
        NEURAL ENGINE OVERDRIVE
      </p>
    </div>
  </div>
);

// --- Main Page Component ---
export const LandingPage: React.FC = () => {
  const [showIntro, setShowIntro] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const tagline = "FROM DEADLINES TO DONE, TURNED INTENTIONS INTO ACHIEVEMENTS.";

  useEffect(() => {
    if (showIntro) {
      const timer = setTimeout(() => {
        setShowIntro(false);
      }, 7000);
      return () => clearTimeout(timer);
    }
  }, [showIntro]);

  return (
    <div className="min-h-screen bg-transparent text-slate-50 font-sans overflow-x-hidden selection:bg-indigo-500/30 relative">
      <SpaceBackground />
      
      {/* Intro Overlay */}
      <AnimatePresence>
        {showIntro && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.5 } }}
            className="fixed inset-0 z-[100] bg-slate-950 flex flex-col items-center justify-center cursor-pointer overflow-hidden"
            onClick={() => setShowIntro(false)}
          >
            <div className="absolute inset-0 z-0 pointer-events-none">
              <SpaceBackground />
            </div>
            <motion.div 
              initial={{ scale: 0.5, opacity: 0, rotateY: 90 }}
              animate={{ scale: 1, opacity: 1, rotateY: 0 }}
              transition={{ duration: 1.5, type: "spring", bounce: 0.4 }}
              className="mb-10 scale-[0.7] md:scale-[0.9]"
            >
              <HolographicCore />
            </motion.div>
            <div className="text-center max-w-3xl font-mono tracking-[0.1em] md:tracking-[0.2em] uppercase text-xs md:text-lg font-bold leading-loose px-6 relative z-10">
              {tagline.split("").map((char, index) => {
                const isHighlight = index >= 24;
                return (
                  <motion.span
                    key={index}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.04, delay: 1 + index * 0.04 }}
                    className={isHighlight ? "text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.4)]" : "text-slate-300"}
                  >
                    {char}
                  </motion.span>
                );
              })}
              <motion.span 
                animate={{ opacity: [1, 0] }} 
                transition={{ repeat: Infinity, duration: 0.8 }}
                className="w-2 h-4 md:w-3 md:h-5 bg-emerald-400 ml-1 inline-block align-middle"
              />
            </div>
            <motion.p 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 4 }}
              className="absolute bottom-10 text-slate-600 text-xs tracking-widest uppercase animate-pulse"
            >
              Click anywhere to enter
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* NAVBAR */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/50">
        <div className="w-full px-6 md:px-12 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setShowIntro(true)}>
            <img src="/logo.png" alt="ZeroMomentum" className="w-8 h-8 group-hover:scale-110 transition-transform" />
            <span className="font-bold tracking-widest text-white text-sm group-hover:text-emerald-400 transition-colors">ZeroMomentum AI</span>
          </div>
          <div className="hidden xl:flex items-center gap-6 text-sm font-bold text-slate-300">
            <a href="#overview" className="hover:text-emerald-400 transition-colors">Overview</a>
            <a href="#telemetry" className="hover:text-emerald-400 transition-colors">Telemetry</a>
            <a href="#deadlines" className="hover:text-rose-400 transition-colors">Deadlines</a>
            <a href="#timeblocks" className="hover:text-blue-400 transition-colors">Timeblocks</a>
            <a href="#habits" className="hover:text-purple-400 transition-colors">Habits</a>
            <a href="#hub" className="hover:text-indigo-400 transition-colors">AI Hub</a>
            <a href="#communications" className="hover:text-sky-400 transition-colors">Comms</a>
            <a href="#reflections" className="hover:text-amber-400 transition-colors">Reflections</a>
            <a href="#faq" className="hover:text-slate-100 transition-colors">FAQ</a>
          </div>
          
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="px-5 py-2.5 bg-slate-100 text-slate-950 font-black uppercase tracking-widest text-xs rounded-lg hover:bg-white transition-colors shadow-lg">
              Launch Hub
            </Link>
            
            <button 
              className="xl:hidden p-2 text-slate-300 hover:text-white focus:outline-none"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="xl:hidden overflow-hidden bg-slate-950/95 border-b border-slate-800/50 backdrop-blur-xl"
            >
              <div className="flex flex-col px-6 py-6 gap-4 text-sm font-bold text-slate-300">
                <a href="#overview" onClick={() => setMobileMenuOpen(false)} className="hover:text-emerald-400 transition-colors py-2 border-b border-slate-800/30">Overview</a>
                <a href="#telemetry" onClick={() => setMobileMenuOpen(false)} className="hover:text-emerald-400 transition-colors py-2 border-b border-slate-800/30">Telemetry</a>
                <a href="#deadlines" onClick={() => setMobileMenuOpen(false)} className="hover:text-rose-400 transition-colors py-2 border-b border-slate-800/30">Deadlines</a>
                <a href="#timeblocks" onClick={() => setMobileMenuOpen(false)} className="hover:text-blue-400 transition-colors py-2 border-b border-slate-800/30">Timeblocks</a>
                <a href="#habits" onClick={() => setMobileMenuOpen(false)} className="hover:text-purple-400 transition-colors py-2 border-b border-slate-800/30">Habits</a>
                <a href="#hub" onClick={() => setMobileMenuOpen(false)} className="hover:text-indigo-400 transition-colors py-2 border-b border-slate-800/30">AI Hub</a>
                <a href="#communications" onClick={() => setMobileMenuOpen(false)} className="hover:text-sky-400 transition-colors py-2 border-b border-slate-800/30">Comms</a>
                <a href="#reflections" onClick={() => setMobileMenuOpen(false)} className="hover:text-amber-400 transition-colors py-2 border-b border-slate-800/30">Reflections</a>
                <a href="#faq" onClick={() => setMobileMenuOpen(false)} className="hover:text-slate-100 transition-colors py-2">FAQ</a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* 1. HERO SECTION */}
      <section className="relative min-h-screen flex items-center pt-24 pb-20 overflow-hidden bg-transparent">
        <div className="container mx-auto px-6 max-w-7xl relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-8 items-center">
            
            {/* Left Column: Copy & CTA */}
            <motion.div 
              initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, ease: "easeOut" }}
              className="flex flex-col items-start text-left"
            >
              {/* Badge */}
              <div className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-slate-700/60 bg-slate-800/40 backdrop-blur-md mb-4 shadow-sm">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
                </span>
                <span className="text-xs font-bold uppercase tracking-widest text-slate-300">
                  Neural Architecture &bull; Local Execution
                </span>
              </div>
              
              {/* Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black uppercase tracking-wide leading-[1.1] mb-8 text-white drop-shadow-sm flex flex-col gap-1 md:gap-2">
                <span>Friction is eliminated.</span>
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 drop-shadow-[0_0_20px_rgba(52,211,153,0.3)] pb-2">
                  Momentum is inevitable.
                </span>
              </h1>
              
              {/* Subtext */}
              <p className="text-lg md:text-xl text-slate-400 font-medium tracking-wide max-w-2xl mb-10 leading-relaxed">
                ZeroMomentum AI actively monitors your cognitive state via visual telemetry, deploys localized multi-agent workflows, and enforces absolute focus — 
                <span className="text-slate-200 font-bold"> guaranteeing execution.</span> Every action is tracked. Every distraction is penalized.
              </p>
              
              {/* Buttons */}
              <div className="flex flex-wrap items-center gap-4">
                <Link 
                  to="/dashboard" 
                  className="px-6 py-3 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black uppercase tracking-widest text-sm rounded-xl transition-all shadow-[0_0_25px_rgba(52,211,153,0.4)] hover:shadow-[0_0_40px_rgba(52,211,153,0.6)] hover:-translate-y-0.5 flex items-center gap-2"
                >
                  Initialize Hub <ChevronRight size={18} />
                </Link>
              </div>
            </motion.div>
            
            {/* Right Column: Abstract Graphic representation of the Engine */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }} 
              animate={{ opacity: 1, scale: 1 }} 
              transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
              className="relative w-full h-[500px] flex items-center justify-center perspective-[1000px]"
            >
              {/* Complex 3D Holographic Assembly */}
              <HolographicCore onLogoClick={() => setShowIntro(true)} />
            </motion.div>

          </div>
        </div>
      </section>

      {/* 2. THE PROBLEM & APPROACH */}
      <section id="overview" className="py-32 relative">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="grid md:grid-cols-2 gap-8 items-stretch">
            {/* PROBLEM CARD */}
            <FadeIn direction="up">
              <div className="h-full bg-slate-900/40 backdrop-blur-md border border-rose-500/20 rounded-3xl p-10 flex flex-col relative overflow-hidden group hover:shadow-[0_0_50px_rgba(244,63,94,0.15)] hover:-translate-y-2 hover:border-rose-500/40 transition-all duration-500">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-500 to-red-500" />
                <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-full blur-3xl group-hover:bg-rose-500/10 transition-colors" />
                
                <h2 className="text-3xl md:text-4xl lg:text-[42px] font-black uppercase tracking-wide mb-6 leading-[1.1] text-white relative z-10">
                  THE FRICTION<br/>
                  <span className="text-rose-500">PROBLEM.</span>
                </h2>
                
                <div className="space-y-4 text-slate-400 text-base md:text-lg leading-relaxed relative z-10 flex-grow">
                  <p>
                    Modern productivity is fundamentally broken. We are forced to juggle disparate applications for task management, calendar scheduling, habit tracking, and note-taking.
                  </p>
                  <p>
                    This extreme context-switching severely drains cognitive bandwidth, introduces decision fatigue, and destroys your ability to maintain flow state.
                  </p>
                  <ul className="mt-4 space-y-2 text-sm text-rose-200/70 font-medium">
                    <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span> Fragmented Workflows</li>
                    <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span> Infinite Context-Switching</li>
                    <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span> Unmonitored Burnout</li>
                  </ul>
                </div>

                <div className="mt-8 px-6 py-4 bg-rose-950/40 border border-rose-500/10 rounded-xl shadow-inner relative z-10">
                  <p className="text-rose-400 font-bold uppercase tracking-widest text-[12px] leading-relaxed">
                    RESULT: 40% OF PRODUCTIVE TIME IS LOST TO FATIGUE.
                  </p>
                </div>
              </div>
            </FadeIn>

            {/* APPROACH CARD */}
            <FadeIn direction="up" delay={0.2}>
              <div className="h-full bg-slate-900/40 backdrop-blur-md border border-indigo-500/20 rounded-3xl p-10 flex flex-col relative overflow-hidden group hover:shadow-[0_0_50px_rgba(99,102,241,0.15)] hover:-translate-y-2 hover:border-indigo-500/40 transition-all duration-500">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-cyan-500" />
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl group-hover:bg-indigo-500/10 transition-colors" />
                
                <h2 className="text-3xl md:text-4xl lg:text-[42px] font-black uppercase tracking-wide mb-6 leading-[1.1] text-white relative z-10">
                  THE <span className="text-indigo-400 normal-case">ZeroMomentum</span><br/>
                  APPROACH.
                </h2>
                
                <div className="space-y-4 text-slate-400 text-base md:text-lg leading-relaxed relative z-10 flex-grow">
                  <p>
                    ZeroMomentum AI replaces passive data silos with an active, unified Multi-Agent Engine that thinks alongside you within a single dashboard.
                  </p>
                  <p>
                    The system actively monitors your psychological state via visual telemetry, automatically deploys AI agents to execute your workflows, and mathematically enforces consistency.
                  </p>
                  <ul className="mt-4 space-y-2 text-sm text-indigo-200/70 font-medium">
                    <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span> Machine Vision Telemetry</li>
                    <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span> Localized Multi-Agent Swarm</li>
                    <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span> Deterministic Priority Lock-in</li>
                  </ul>
                </div>

                <div className="mt-8 px-6 py-4 bg-indigo-950/40 border border-indigo-500/10 rounded-xl flex items-center gap-4 shadow-inner relative z-10">
                  <BrainCircuit className="text-indigo-400 shrink-0" size={24} />
                  <p className="text-indigo-300 font-bold uppercase tracking-widest text-[12px] leading-relaxed">
                    CENTRALIZED NEURAL ARCHITECTURE.
                  </p>
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* --- THE 7 MODULES (EACH A DEDICATED SECTION WITH BENTO LAYOUT) --- */}
      
      {/* Module 1: Visual Telemetry Dashboard */}
      <section id="telemetry" className="py-32 relative">
        <div className="container mx-auto px-6 max-w-6xl">
          <SectionHeader 
            title="Visual Telemetry Dashboard" 
            subtitle="Real-time ML face tracking. The system knows when you lose focus."
            icon={<LayoutDashboard size={40} className="text-emerald-400" />}
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <BentoCard span={2} title="Live Neural HUD" desc="A gamified 'Mission Control' overlay that tracks your physical presence. Utilizing Google's BlazeFace neural network, it calculates a live Attention Score." icon={<Eye size={24} className="text-emerald-400" />} gradient="from-emerald-500/10 to-teal-500/10" />
            <BentoCard title="Distraction Events" desc="Aggressive spatial geometry algorithms detect head tilts and slouching, instantly logging a 'Distraction Event' if you look at your phone or fall asleep." icon={<Activity size={24} className="text-emerald-400" />} gradient="from-emerald-500/10 to-teal-500/10" />
            <BentoCard title="Productivity Multiplier" desc="Maintain 'Peak Flow' state (95%+ focus) for extended periods to ramp up your session multiplier, gamifying deep work." icon={<Zap size={24} className="text-emerald-400" />} gradient="from-emerald-500/10 to-teal-500/10" />
            <BentoCard span={2} title="Real-time Terminal" desc="A live, scrolling developer console that logs every cognitive state shift and system action directly to the UI for absolute transparency." icon={<Command size={24} className="text-emerald-400" />} gradient="from-emerald-500/10 to-teal-500/10" />
          </div>
        </div>
      </section>

      {/* Module 2: Deadlines & Analyzer */}
      <section id="deadlines" className="py-32 relative">
        <div className="container mx-auto px-6 max-w-6xl">
          <SectionHeader 
            title="Deadlines & Analyzer" 
            subtitle="Never miss a critical objective. Let the AI triage your chaos."
            icon={<CheckSquare size={40} className="text-rose-400" />}
          />
          <div className="flex flex-col gap-6">
            <FeatureRow index={0} title="AI Priority Triaging" desc="Dump raw thoughts into the analyzer. The LLM evaluates dependencies, deadlines, and stress factors to automatically assign exact priority weights (P0, P1, P2)." icon={<Target size={28} className="text-rose-400" />} />
            <FeatureRow index={1} title="Dynamic Boards" desc="Kanban-style fluidity. Tasks move seamlessly from Backlog to In Progress to Completed, with strict visual hierarchy." icon={<LayoutDashboard size={28} className="text-rose-400" />} />
            <FeatureRow index={2} title="Friction Metrics" desc="Each task tracks its own 'Time-in-State'. If a task sits in 'In Progress' for too long, the UI flags it as high-friction, demanding immediate tactical intervention." icon={<Activity size={28} className="text-rose-400" />} />
          </div>
        </div>
      </section>

      {/* Module 3: Timeblocks & Recovery */}
      <section id="timeblocks" className="py-32 relative">
        <div className="container mx-auto px-6 max-w-6xl">
          <SectionHeader 
            title="Timeblocks & Recovery" 
            subtitle="The ultimate engine for structuring deep work and strategic rest."
            icon={<Calendar size={40} className="text-blue-400" />}
          />
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Main Asymmetrical Panel */}
            <motion.div whileHover={{ y: -5 }} className="lg:w-2/3 p-8 md:p-12 bg-slate-900/40 backdrop-blur-md border border-slate-700/50 rounded-3xl relative overflow-hidden group hover:shadow-[0_0_50px_rgba(59,130,246,0.15)] hover:border-blue-500/30 transition-all duration-300">
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl" />
              <div className="p-4 bg-slate-800/50 rounded-2xl border border-slate-700/50 inline-block mb-6">
                <Calendar size={32} className="text-blue-400" />
              </div>
              <h3 className="text-3xl font-black text-white mb-4">Contextual Scheduling</h3>
              <p className="text-lg text-slate-400 leading-relaxed max-w-xl">
                Drag and drop blocks of time dedicated to specific contexts (e.g., Deep Code, Admin, Strategy). The timeline enforces rigid boundaries and prevents schedule overlap.
              </p>
            </motion.div>
            
            {/* Side Stack */}
            <div className="lg:w-1/3 flex flex-col gap-6">
              <motion.div whileHover={{ x: -5 }} className="flex-1 p-6 md:p-8 bg-slate-900/40 backdrop-blur-md border border-slate-700/50 rounded-3xl hover:shadow-[0_0_30px_rgba(59,130,246,0.1)] hover:border-blue-500/30 transition-all duration-300">
                <Clock size={24} className="text-blue-400 mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">The Pomodoro Engine</h3>
                <p className="text-sm text-slate-400 leading-relaxed">Integrated directly into the scheduler. A localized timer forces strict adherence to work/rest cycles, syncing with your visual telemetry.</p>
              </motion.div>
              <motion.div whileHover={{ x: -5 }} className="flex-1 p-6 md:p-8 bg-slate-900/40 backdrop-blur-md border border-slate-700/50 rounded-3xl hover:shadow-[0_0_30px_rgba(59,130,246,0.1)] hover:border-blue-500/30 transition-all duration-300">
                <Shield size={24} className="text-blue-400 mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">Strategic Recovery</h3>
                <p className="text-sm text-slate-400 leading-relaxed">When transitioning between tasks, the engine forces a 'Context Buffer'—a 5-minute cognitive reset protocol to prevent task-bleed.</p>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Module 4: Habits Galaxy */}
      <section id="habits" className="py-32 relative">
        <div className="container mx-auto px-6 max-w-6xl">
          <SectionHeader 
            title="Habits Galaxy Grid" 
            subtitle="Transforming atomic habits into an interactive, visual constellation."
            icon={<Activity size={40} className="text-purple-400" />}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard title="GitHub Heatmaps" desc="Beautiful 365-day contribution graphs tracking daily consistency." icon={<Network size={32} className="text-purple-400" />} value="365" />
            <StatCard title="Active Streaks" desc="Psychological pressure to maintain consecutive chain links." icon={<Zap size={32} className="text-purple-400" />} value="12x" />
            <StatCard title="Auto Verification" desc="Telemetry automatically checks off 'Deep Work' metrics." icon={<CheckSquare size={32} className="text-purple-400" />} value="AI" />
            <StatCard title="Consistency Rate" desc="Mathematical evaluation of your habit execution ratio." icon={<Focus size={32} className="text-purple-400" />} value="94%" />
          </div>
        </div>
      </section>

      {/* Module 5: AI Command Hub */}
      <section id="hub" className="py-32 relative">
        <div className="container mx-auto px-6 max-w-6xl">
          <SectionHeader 
            title="AI Command Hub" 
            subtitle="A coalition of autonomous, specialized AI agents at your disposal."
            icon={<Bot size={40} className="text-indigo-400" />}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <TechTerminal delay={0} title="Multi-Agent Coalition" desc="Engage with specialized nodes: The Research Specialist, The Execution Engineer, and The Motivation Coach." command="spawn agent --role='Execution Engineer'" />
            <TechTerminal delay={0.2} title="Context Isolation" desc="Each agent runs in isolation, holding specific system prompts and memories tailored to their exact role." command="isolate --memory-buffer=4096" />
            <TechTerminal delay={0.4} title="Terminal Interface" desc="Interact with agents through a sleek, hacker-style command line interface." command="execute ./system_commands.sh" />
            <TechTerminal delay={0.6} title="Zero Hallucination" desc="Strict LLM parameters prevent cross-contamination of contexts between different specialized nodes." command="set temperature 0.0" />
          </div>
        </div>
      </section>

      {/* Module 6: Communications Engine */}
      <section id="communications" className="py-32 relative">
        <div className="container mx-auto px-6 max-w-6xl">
          <SectionHeader 
            title="Communications Engine" 
            subtitle="Automated email triage and intelligent summarization."
            icon={<MessageSquare size={40} className="text-sky-400" />}
          />
          <div className="max-w-4xl mx-auto flex flex-col gap-4">
            <InboxRow delay={0} isPriority={true} sender="System AI: Action Required" subject="Communications Triaged" summary="The AI scans incoming communications, separating critical intel from background noise." />
            <InboxRow delay={0.1} isPriority={false} sender="TL;DR Summarization Engine" subject="Thread Compressed" summary="Massive email threads are instantly compressed into 3-bullet summaries." />
            <InboxRow delay={0.2} isPriority={true} sender="Task Analyzer Pipeline" subject="Deadline Detected" summary="If a communication contains a deadline, the engine automatically ports it directly into your backlog." />
          </div>
        </div>
      </section>

      {/* Module 7: Evening Reflections */}
      <section id="reflections" className="py-32 relative">
        <div className="container mx-auto px-6 max-w-6xl">
          <SectionHeader 
            title="Evening Reflections" 
            subtitle="Close the daily loop. Analyze cognition. Lock in tomorrow."
            icon={<BookOpen size={40} className="text-amber-400" />}
          />
          <motion.div 
            whileHover={{ y: -10 }}
            className="w-full relative rounded-[2.5rem] overflow-hidden bg-slate-900/40 backdrop-blur-md border border-slate-700/50 p-10 md:p-16 text-center shadow-2xl group"
          >
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-900/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            
            <div className="flex justify-center gap-4 mb-8 relative z-10">
              <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl"><Mic size={32} className="text-amber-400" /></div>
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl"><Activity size={32} className="text-emerald-400" /></div>
              <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl"><Target size={32} className="text-rose-400" /></div>
            </div>

            <h3 className="text-4xl md:text-5xl font-black text-white mb-6 uppercase tracking-wide relative z-10">Voice-to-Text Mission Debrief</h3>
            <p className="text-lg md:text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed mb-10 relative z-10">
              Utilizing the Web Speech API, perform a live audio interrogation. Speak your daily reflection directly into the system. The Motivation Agent analyzes your blockers, maps a 21-day psychological heatmap, and automatically locks in your top 3 non-negotiable priorities for the next morning.
            </p>
          </motion.div>
        </div>
      </section>

      {/* INTERACTIVE FAQ SECTION */}
      <section id="faq" className="py-32 relative">
        <div className="container mx-auto px-6 max-w-6xl">
          <SectionHeader title="System FAQ" subtitle="Common inquiries regarding the ZeroMomentum architecture." icon={<Cpu size={40} className="text-slate-400" />} />
          <div className="space-y-4">
            <FAQItem question="Does the Visual Telemetry store video data?" answer="No. The BlazeFace model runs entirely client-side in your browser. It calculates spatial coordinate geometry in real-time and instantly discards the frame. No video data is ever sent to a server." />
            <FAQItem question="How do the AI Agents retain context?" answer="Each agent operates with isolated short-term memory buffers. They do not cross-contaminate data, ensuring the Code Engineer doesn't get confused by the Motivation Coach's context." />
            <FAQItem question="Can I use this without a webcam?" answer="Yes. The system defaults to 'Standby Mode'. You can utilize the Task Analyzer, Scheduling, and Agents completely independent of the Visual Telemetry HUD." />
            <FAQItem question="Is the data persistent?" answer="Yes. The application utilizes an integrated backend with Prisma ORM to ensure your tasks, habits, and reflections are securely archived in the database." />
          </div>
        </div>
      </section>

      {/* PROFESSIONAL WATERMARK FOOTER */}
      <footer className="relative bg-[#020617] pt-24 pb-8 border-t border-slate-800/80 overflow-hidden">
        {/* Giant Watermark Background Text */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full text-center pointer-events-none select-none flex justify-center">
          <h2 className="text-[10vw] font-black tracking-wide text-slate-800/60 whitespace-nowrap opacity-50">
            ZeroMomentum AI
          </h2>
        </div>
        
        <div className="container mx-auto px-6 max-w-7xl relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-20">
            
            {/* Column 1: Brand & Social */}
            <div className="lg:col-span-1 flex flex-col">
              <div className="flex items-center gap-3 mb-6">
                <img src="/logo.png" alt="Logo" className="w-8 h-8 drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                <span className="font-bold text-lg text-slate-100 tracking-wide whitespace-nowrap">ZeroMomentum AI</span>
              </div>
              <p className="text-sm text-slate-400 font-medium leading-relaxed mb-6">
                ZeroMomentum AI is a unified neural architecture engineered to eradicate friction and enforce absolute focus through visual telemetry, localized multi-agent intelligence, and deterministic workflows.
              </p>
              <div className="flex gap-4">
                <a href="mailto:myselfdeb11@gmail.com" target="_blank" rel="noreferrer" className="text-slate-400 hover:text-red-500 transition-colors"><Mail size={18} /></a>
                <a href="https://github.com/MyselfDebdatta" target="_blank" rel="noreferrer" className="text-slate-400 hover:text-white transition-colors"><GithubIcon size={18} /></a>
                <a href="https://www.linkedin.com/in/debdatta-panda-dp11" target="_blank" rel="noreferrer" className="text-slate-400 hover:text-blue-500 transition-colors"><LinkedinIcon size={18} /></a>
                <a href="https://whatsapp.com/dl/" target="_blank" rel="noreferrer" className="text-slate-400 hover:text-green-500 transition-colors"><WhatsappIcon size={18} /></a>
                <a href="https://www.instagram.com/itz__debdatta?igsh=MXRydjliNmdycDFrdg==" target="_blank" rel="noreferrer" className="text-slate-400 hover:text-purple-500 transition-colors"><InstagramIcon size={18} /></a>
              </div>
            </div>

            {/* Column 2: Core Architectures (Spans 2 cols) */}
            <div className="lg:col-span-2 lg:ml-8">
              <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-500 mb-6">Core Architectures</h4>
              <div className="grid grid-cols-2 gap-4 text-sm font-medium text-slate-300">
                <ul className="space-y-4">
                  <li><a href="#telemetry" className="hover:text-emerald-400 transition-colors">Visual Telemetry Dashboard</a></li>
                  <li><a href="#deadlines" className="hover:text-rose-400 transition-colors">Deadlines & Analyzer</a></li>
                  <li><a href="#timeblocks" className="hover:text-blue-400 transition-colors">Timeblocks & Recovery</a></li>
                  <li><a href="#habits" className="hover:text-purple-400 transition-colors">Habits Galaxy</a></li>
                </ul>
                <ul className="space-y-4">
                  <li><a href="#hub" className="hover:text-indigo-400 transition-colors">AI Command Hub</a></li>
                  <li><a href="#communications" className="hover:text-sky-400 transition-colors">Communications Engine</a></li>
                  <li><a href="#reflections" className="hover:text-amber-400 transition-colors">Evening Reflections</a></li>
                </ul>
              </div>
            </div>

            {/* Column 4: Resources */}
            <div className="lg:col-span-1">
              <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-500 mb-6">Resources</h4>
              <ul className="space-y-4 text-sm font-medium text-slate-300">
                <li><a href="#" className="hover:text-blue-400 transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-blue-400 transition-colors">Local Deployment</a></li>
                <li><a href="#" className="hover:text-blue-400 transition-colors">Prisma Schema</a></li>
                <li><a href="#" className="hover:text-blue-400 transition-colors">Security</a></li>
              </ul>
            </div>

            {/* Column 5: Contact Us */}
            <div className="lg:col-span-1">
              <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-500 mb-6">Contact Us</h4>
              <ul className="space-y-5 text-sm font-medium text-slate-300">
                <li className="flex items-start gap-3">
                  <MapPin size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                  <span className="leading-tight">Kolkata, West Bengal<br/>India 700091</span>
                </li>
                <li className="flex items-center gap-3">
                  <Mail size={16} className="text-sky-400 shrink-0" />
                  <a href="mailto:myselfdeb11@gmail.com" className="hover:text-blue-400 transition-colors">myselfdeb11@gmail.com</a>
                </li>
                <li className="flex items-center gap-3">
                  <Phone size={16} className="text-indigo-400 shrink-0" />
                  <span>+91 8637377080</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Copyright Row */}
          <div className="pt-8 border-t border-slate-800/60 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-medium text-slate-500">
            <p>&copy; {new Date().getFullYear()} ZeroMomentum AI by Debdatta Panda. All rights reserved.</p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-slate-300 transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-slate-300 transition-colors">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

// --- FAQ Accordion Component ---
const FAQItem = ({ question, answer }: { question: string, answer: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950/50 backdrop-blur-sm transition-colors hover:border-slate-700">
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="w-full px-6 py-5 flex items-center justify-between text-left focus:outline-none"
      >
        <span className="font-bold text-slate-200 tracking-wide">{question}</span>
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.3 }}>
          <ChevronDown className="text-slate-500" size={20} />
        </motion.div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }} 
            animate={{ height: "auto", opacity: 1 }} 
            exit={{ height: 0, opacity: 0 }} 
            transition={{ duration: 0.3 }}
          >
            <div className="px-6 pb-5 text-slate-400 leading-relaxed text-sm">
              {answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
