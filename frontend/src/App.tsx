import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DashboardLayout } from './layouts/DashboardLayout';
import { Dashboard } from './pages/Dashboard';
import { Tasks } from './pages/Tasks';
import { Schedule } from './pages/Schedule';
import { AIAgents } from './pages/AIAgents';
import { Settings } from './pages/Settings';
import { HabitsGalaxy } from './pages/HabitsGalaxy';

import { Communications } from './pages/Communications';
import { EveningReflection } from './pages/EveningReflection';
import { LandingPage } from './pages/LandingPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false, // Prevent refetching when switching tabs
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/schedule" element={<Schedule />} />
            <Route path="/galaxy" element={<HabitsGalaxy />} />
            <Route path="/agents" element={<AIAgents />} />
            <Route path="/comms" element={<Communications />} />
            <Route path="/reflections" element={<EveningReflection />} />
            <Route path="/settings" element={<Settings />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
