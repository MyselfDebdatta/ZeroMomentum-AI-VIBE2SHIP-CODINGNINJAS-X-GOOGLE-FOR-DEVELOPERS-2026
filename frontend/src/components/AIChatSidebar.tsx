import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Send, X, User, Sparkles, Trash2 } from 'lucide-react';
import { useUIStore } from '../store/uiStore';
import { chatWithAgent } from '../services/api';

const renderFormattedLine = (line: string) => {
  // Quick regex to parse **bold** text
  const parts = line.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index} className="text-white font-semibold">{part.slice(2, -2)}</strong>;
    }
    // Replace standalone asterisks used for bullets
    if (part.trim() === '*') {
      return <span key={index} className="mr-1 text-emerald-400">•</span>;
    }
    return <span key={index}>{part.replace(/^\*\s/, '• ')}</span>;
  });
};

export const AIChatSidebar = () => {
  const { isChatOpen, toggleChat, chatMessages, addChatMessage, clearChat } = useUIStore();
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages, isTyping]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim()) return;

    const userText = input;
    setInput('');
    addChatMessage({ role: 'user', content: userText });
    setIsTyping(true);

    try {
      const response = await chatWithAgent(userText);
      addChatMessage({ 
        role: 'agent', 
        content: response.reply || 'I processed your request.' 
      });
    } catch (error) {
      addChatMessage({ 
        role: 'agent', 
        content: 'Error: Cannot connect to the LangGraph agents. Is the backend running?' 
      });
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <AnimatePresence>
      {isChatOpen && (
        <motion.div 
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed top-0 right-0 w-96 h-full bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col z-50"
        >
          {/* Header */}
          <div className="h-16 border-b border-slate-800 flex items-center justify-between px-6 bg-slate-900/50 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                <Bot size={18} className="text-white" />
              </div>
              <h2 className="font-semibold text-slate-100 flex items-center gap-2">
                Agent Interface <Sparkles size={14} className="text-blue-400" />
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={clearChat} className="p-1.5 rounded-md text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors" title="Clear Chat History">
                <Trash2 size={16} />
              </button>
              <button onClick={toggleChat} className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {chatMessages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    msg.role === 'user' ? 'bg-emerald-600' : 'bg-blue-600'
                  }`}>
                    {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                  </div>
                  <div className={`p-3 rounded-2xl text-sm ${
                    msg.role === 'user' 
                      ? 'bg-emerald-600 text-white rounded-tr-none' 
                      : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-tl-none'
                  }`}>
                    {msg.content.split('\n').map((line, i) => {
                      const trimmed = line.trim();
                      const isBullet = trimmed.startsWith('-') || (trimmed.startsWith('*') && !trimmed.startsWith('**'));
                      return (
                        <React.Fragment key={i}>
                          <span className={isBullet ? 'block ml-4 mb-1 text-slate-300' : 'block mb-1.5 text-slate-200'}>
                            {renderFormattedLine(line)}
                          </span>
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex justify-start">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
                    <Bot size={16} className="text-white" />
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-800 border border-slate-700 rounded-tl-none flex gap-1">
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" />
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-100" />
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-200" />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-slate-800 bg-slate-900">
            <form onSubmit={handleSend} className="flex gap-2">
              <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask me to schedule a task..." 
                className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
              />
              <button 
                type="submit"
                disabled={isTyping || !input.trim()}
                className="w-12 h-12 bg-blue-600 hover:bg-blue-500 rounded-xl flex items-center justify-center text-white transition-colors disabled:opacity-50"
              >
                <Send size={18} />
              </button>
            </form>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
