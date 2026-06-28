import { create } from 'zustand';

interface ChatMessage {
  id: string;
  role: 'user' | 'agent';
  content: string;
  timestamp: Date;
}

interface UIState {
  isSidebarOpen: boolean;
  isChatOpen: boolean;
  isTaskModalOpen: boolean;
  chatMessages: ChatMessage[];
  
  toggleSidebar: () => void;
  toggleChat: () => void;
  toggleTaskModal: () => void;
  addChatMessage: (msg: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  clearChat: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  isSidebarOpen: true,
  isChatOpen: false,
  isTaskModalOpen: false,
  chatMessages: [
    {
      id: 'welcome',
      role: 'agent',
      content: 'Hello! I am ZeroMomentum. How can I help you be productive today?',
      timestamp: new Date()
    }
  ],

  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  toggleChat: () => set((state) => ({ isChatOpen: !state.isChatOpen })),
  toggleTaskModal: () => set((state) => ({ isTaskModalOpen: !state.isTaskModalOpen })),
  
  addChatMessage: (msg) => set((state) => ({
    chatMessages: [
      ...state.chatMessages,
      { ...msg, id: Math.random().toString(36).substr(2, 9), timestamp: new Date() }
    ]
  })),
  clearChat: () => set({
    chatMessages: [
      {
        id: 'welcome',
        role: 'agent',
        content: 'Hello! I am ZeroMomentum. How can I help you be productive today?',
        timestamp: new Date()
      }
    ]
  })
}));
