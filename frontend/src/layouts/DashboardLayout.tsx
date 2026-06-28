import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, Link } from 'react-router-dom';
import { LayoutDashboard, CheckSquare, Calendar, Bot, Activity, MessageSquare, BookOpen, Clock, Menu } from 'lucide-react';
import { AIChatSidebar } from '../components/AIChatSidebar';
import { TaskIntelModal } from '../components/TaskIntelModal';

export const DashboardLayout: React.FC = () => {
  const [time, setTime] = useState(new Date());
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const h = time.getHours();
  const m = time.getMinutes();
  const s = time.getSeconds();
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 || 12;
  const pad = (n: number) => n.toString().padStart(2, '0');
  
  return (
    <div className="flex h-screen w-full bg-slate-950 text-slate-50 overflow-hidden relative font-sans">
      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Premium Sidebar Navigation */}
      <aside 
        className={`fixed inset-y-0 left-0 md:relative z-50 w-72 bg-slate-950/95 md:bg-slate-950/40 backdrop-blur-3xl border-r border-slate-800/40 flex flex-col shadow-[10px_0_40px_-10px_rgba(0,0,0,0.5)] transition-transform duration-300 md:translate-x-0 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-blue-900/5 via-transparent to-transparent pointer-events-none" />
        
        <div className="p-6 pb-5 border-b border-slate-800/50 mb-2 relative z-10">
          <Link to="/" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3.5 group cursor-pointer">
            <div className="relative shrink-0">
              {/* Premium glowing backdrop on hover */}
              <div className="absolute -inset-2 bg-gradient-to-r from-blue-600/20 to-indigo-600/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              <img 
                src="/logo.png" 
                alt="ZeroMomentum AI" 
                className="h-10 w-10 object-contain relative z-10 drop-shadow-[0_0_8px_rgba(255,255,255,0.1)] group-hover:scale-105 group-hover:drop-shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all duration-500" 
              />
            </div>
            <div className="flex flex-col justify-center">
              <h1 className="text-[13px] font-black tracking-widest bg-clip-text text-transparent bg-gradient-to-br from-white via-blue-50 to-slate-400 drop-shadow-sm transition-all duration-300">
                ZeroMomentum AI
              </h1>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
                </span>
                <p className="text-[8px] tracking-[0.25em] font-bold text-slate-500 uppercase group-hover:text-blue-300/80 transition-colors duration-300">
                  Multi-Agent Engine
                </p>
              </div>
            </div>
          </Link>
        </div>
        
        <div className="px-5 mt-4 relative z-10">
          <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-600 mb-3 px-3 flex items-center gap-2">
            <span className="w-2 h-0.5 bg-slate-700 rounded-full" /> Core Modules
          </p>
          <nav className="space-y-1.5">
            <NavItem icon={<LayoutDashboard size={18}/>} label="Main Dashboard" to="/dashboard" onClick={() => setMobileMenuOpen(false)} />
            <NavItem icon={<CheckSquare size={18}/>} label="Deadlines & Analyzer" to="/tasks" onClick={() => setMobileMenuOpen(false)} />
            <NavItem icon={<Calendar size={18}/>} label="Timeblocks & Recovery" to="/schedule" onClick={() => setMobileMenuOpen(false)} />
            <NavItem icon={<Activity size={18}/>} label="Habits & Galaxy Grid" to="/galaxy" onClick={() => setMobileMenuOpen(false)} />
          </nav>
        </div>

        <div className="px-5 mt-8 flex-1 relative z-10">
          <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-600 mb-3 px-3 flex items-center gap-2">
            <span className="w-2 h-0.5 bg-slate-700 rounded-full" /> Intelligence
          </p>
          <nav className="space-y-1.5">
            <NavItem icon={<Bot size={18}/>} label="AI Command Hub" to="/agents" onClick={() => setMobileMenuOpen(false)} />
            <NavItem icon={<MessageSquare size={18}/>} label="Communications" to="/comms" onClick={() => setMobileMenuOpen(false)} />
            <NavItem icon={<BookOpen size={18}/>} label="Evening Reflections" to="/reflections" onClick={() => setMobileMenuOpen(false)} />
          </nav>
        </div>

        <div className="p-6 mt-auto relative z-10">
          <div className="relative group bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-5 flex flex-col items-center justify-center overflow-hidden shadow-lg hover:shadow-[0_0_30px_rgba(59,130,246,0.15)] transition-all duration-500 hover:-translate-y-1 cursor-default">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-blue-500/20 transition-colors duration-700" />
            
            <span className="relative z-10 text-[10px] font-bold text-blue-400 uppercase tracking-[0.2em] mb-2 flex items-center gap-2 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20 shadow-inner">
              <Clock size={12} className="text-blue-400 animate-pulse" />
              {time.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </span>
            
            <div className="flex items-baseline gap-1.5 relative z-10 mt-1">
              <span className="text-3xl font-black text-slate-100 font-mono tracking-wide drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">
                {pad(hour12)}:{pad(m)}
              </span>
              <span className="text-sm font-black text-emerald-400 font-mono w-[2ch] drop-shadow-[0_0_8px_rgba(52,211,153,0.6)]">
                {pad(s)}
              </span>
            </div>
            
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-2 z-10 group-hover:text-slate-300 transition-colors">
              {ampm} Local Time
            </span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative z-20 bg-slate-950 w-full overflow-hidden">
        {/* Mobile Topbar */}
        <div className="md:hidden flex items-center justify-between p-4 border-b border-slate-800/50 bg-slate-950/80 backdrop-blur-md sticky top-0 z-30">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Logo" className="w-6 h-6" />
            <span className="font-black tracking-widest text-[10px] uppercase text-white">Command Center</span>
          </div>
          <button onClick={() => setMobileMenuOpen(true)} className="p-2 text-slate-300 hover:text-white">
            <Menu size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-4 md:p-8 relative z-10 custom-scrollbar">
          <Outlet />
        </div>
      </main>

      <AIChatSidebar />
      <TaskIntelModal />
    </div>
  );
};

const NavItem = ({ icon, label, to, onClick }: { icon: React.ReactNode, label: string, to: string, onClick?: () => void }) => (
  <NavLink 
    to={to} 
    onClick={onClick}
    className={({ isActive }) => `group relative flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all duration-500 overflow-hidden ${
      isActive 
        ? 'text-white shadow-lg' 
        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/30'
    }`}
  >
    {({ isActive }) => (
      <>
        {/* Active Background Glow */}
        {isActive && (
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/80 to-indigo-600/80 backdrop-blur-md" />
        )}
        
        {/* Animated Hover Mesh for inactive items */}
        {!isActive && (
          <div className="absolute inset-0 bg-gradient-to-r from-slate-800/0 to-slate-800/0 group-hover:from-blue-900/10 group-hover:to-transparent transition-all duration-500" />
        )}

        {/* Active Border Accent */}
        {isActive && (
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]" />
        )}

        <div className={`relative z-10 transition-transform duration-500 ${isActive ? 'scale-110 drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]' : 'group-hover:scale-110 group-hover:text-blue-400'}`}>
          {icon}
        </div>
        
        <span className={`relative z-10 text-sm tracking-wide font-medium ${isActive ? 'font-bold' : ''}`}>
          {label}
        </span>
      </>
    )}
  </NavLink>
);
