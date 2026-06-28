import React from 'react';
import { User, Bell, Shield, Moon, Monitor, LogOut } from 'lucide-react';
import { ContextBroadcast } from '../components/ContextBroadcast';

export const Settings: React.FC = () => {
  return (
    <div className="space-y-6 max-w-4xl">
      {/* HUD Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-slate-800/60 pb-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-slate-500/20 rounded-lg border border-slate-500/30 shrink-0">
            <User className="text-slate-400" size={28} /> 
          </div>
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-black text-white uppercase tracking-wide drop-shadow-md">
              Settings & Configuration
            </h1>
            <p className="text-sm text-slate-400 font-medium flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-slate-400 animate-pulse shadow-[0_0_8px_rgba(148,163,184,0.8)]" />
              Managing system preferences, API keys, and workspace parameters.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="px-5 py-2.5 border border-slate-500/30 text-slate-400 text-sm font-black uppercase tracking-widest rounded-xl bg-slate-500/10 flex items-center gap-2">
            <Shield size={18} /> System Secured
          </div>
        </div>
      </div>
      <ContextBroadcast />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Settings */}
        <div className="col-span-2 space-y-6">
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm">
            <h2 className="text-xl font-semibold mb-6 text-slate-100 flex items-center gap-2">
              <User size={20} className="text-blue-400" /> Profile Information
            </h2>
            
            <div className="flex items-center gap-6 mb-8">
              <div className="w-20 h-20 rounded-full bg-blue-600 flex items-center justify-center text-2xl font-bold text-white shadow-lg shadow-blue-500/20">
                U
              </div>
              <div>
                <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-sm font-medium transition-colors border border-slate-700">
                  Change Avatar
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-400">Full Name</label>
                <input type="text" defaultValue="Test User" className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 transition-colors" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-400">Email Address</label>
                <input type="email" defaultValue="test@example.com" disabled className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-500 cursor-not-allowed" />
              </div>
            </div>
            
            <div className="mt-6 flex justify-end">
              <button className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-medium transition-colors shadow-lg shadow-blue-500/20">
                Save Changes
              </button>
            </div>
          </div>

          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm">
            <h2 className="text-xl font-semibold mb-6 text-slate-100 flex items-center gap-2">
              <Bell size={20} className="text-amber-400" /> Notifications
            </h2>
            
            <div className="space-y-4">
              <ToggleRow title="Push Notifications" description="Receive alerts when agents schedule tasks." enabled={true} />
              <ToggleRow title="Email Summaries" description="Daily digest of your productivity score." enabled={false} />
              <ToggleRow title="Agent Sounds" description="Play a sound when AI completes a subtask." enabled={true} />
            </div>
          </div>
        </div>

        {/* Sidebar Settings */}
        <div className="col-span-1 space-y-6">
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm">
            <h2 className="text-xl font-semibold mb-6 text-slate-100 flex items-center gap-2">
              <Monitor size={20} className="text-emerald-400" /> Appearance
            </h2>
            
            <div className="space-y-3">
              <button className="w-full flex items-center justify-between p-3 rounded-xl border border-blue-500/30 bg-blue-500/10 text-blue-400">
                <div className="flex items-center gap-2"><Moon size={16} /> Dark Mode</div>
                <div className="w-4 h-4 rounded-full bg-blue-500" />
              </button>
              <button className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-700 bg-slate-800/50 text-slate-300 hover:bg-slate-800 transition-colors">
                <div className="flex items-center gap-2"><Monitor size={16} /> System Default</div>
              </button>
            </div>
          </div>

          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm">
            <h2 className="text-xl font-semibold mb-6 text-slate-100 flex items-center gap-2">
              <Shield size={20} className="text-rose-400" /> Security
            </h2>
            <button className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-colors font-medium">
              <LogOut size={16} /> Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ToggleRow = ({ title, description, enabled }: { title: string, description: string, enabled: boolean }) => (
  <div className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-800/30 transition-colors">
    <div>
      <h3 className="font-medium text-slate-200">{title}</h3>
      <p className="text-sm text-slate-500">{description}</p>
    </div>
    <div className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors ${enabled ? 'bg-emerald-500' : 'bg-slate-700'}`}>
      <div className={`w-4 h-4 rounded-full bg-white transition-transform ${enabled ? 'translate-x-6' : 'translate-x-0'}`} />
    </div>
  </div>
);
