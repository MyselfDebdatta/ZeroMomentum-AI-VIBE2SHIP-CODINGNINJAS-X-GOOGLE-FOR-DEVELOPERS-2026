import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

// Mocked token since we haven't wired up the full Firebase frontend yet
// In a real app, we would get this from Firebase Auth onAuthStateChanged
api.interceptors.request.use((config) => {
  config.headers.Authorization = `Bearer test-token`;
  return config;
});

export const fetchTasks = async () => {
  const { data } = await api.get('/tasks');
  return data;
};

export const createTask = async (payload: { title: string, description: string, deadline: string, priority?: number }) => {
  const { data } = await api.post('/tasks', payload);
  return data;
};

export const parseEmails = async (payload: { emails: any[] }) => {
  const { data } = await api.post('/tasks/parse-emails', payload);
  return data;
};

export const updateTask = async (id: string, payload: any) => {
  const { data } = await api.put(`/tasks/${id}`, payload);
  return data;
};

export const deleteTask = async (id: string) => {
  const { data } = await api.delete(`/tasks/${id}`);
  return data;
};

export const updateSubtask = async (id: string, payload: { status: string }) => {
  const { data } = await api.put(`/tasks/subtasks/${id}`, payload);
  return data;
};

export const chatWithAgent = async (message: string) => {
  const { data } = await api.post('/agents/chat', { message });
  return data;
};

export const commandHubChat = async (agentName: string, message: string) => {
  const response = await api.post('/agents/command-hub', { agentName, message });
  return response.data;
};

export const clearCommandHubLogs = async () => {
  const response = await api.delete('/agents/command-hub/logs');
  return response.data;
};

export const clearAllAILogs = async () => {
  const response = await api.delete('/agents/logs');
  return response.data;
};

export const fetchSchedules = async () => {
  const { data } = await api.get('/tasks/schedules');
  return data;
};

export const acknowledgeLog = async (id: string) => {
  const { data } = await api.put(`/agents/logs/${id}/acknowledge`);
  return data;
};

export const fetchDiagnostics = async () => {
  const { data } = await api.get('/tasks/diagnostics');
  return data;
};

export const fetchHabits = async (status?: string) => {
  const url = status ? `/tasks/habits?status=${status}` : '/tasks/habits';
  const { data } = await api.get(url);
  return data;
};

export const createHabit = async (payload: { title: string, category: string }) => {
  const { data } = await api.post('/tasks/habits', payload);
  return data;
};

export const fetchAILogs = async () => {
  const { data } = await api.get('/agents/logs');
  return data;
};

export const toggleHabit = async (id: string) => {
  const { data } = await api.post(`/tasks/habits/${id}/toggle`);
  return data;
};

export const fetchHeatmapData = async () => {
  const { data } = await api.get('/tasks/habits/heatmap');
  return data;
};

export const fetchHabitInsights = async () => {
  const { data } = await api.get('/tasks/habits/insights');
  return data;
};

export const archiveHabit = async (id: string) => {
  const { data } = await api.put(`/tasks/habits/${id}/archive`);
  return data;
};

export const unarchiveHabit = async (id: string) => {
  const { data } = await api.put(`/tasks/habits/${id}/unarchive`);
  return data;
};

export default api;

export const generateRecoveryPlan = async () => {
  const res = await api.post('/tasks/recovery-plan');
  return res.data;
};

export const createReflection = async (text: string) => {
  const { data } = await api.post('/journal', { text });
  return data;
};

export const fetchReflections = async () => {
  const { data } = await api.get('/journal');
  return data;
};

export const deleteReflection = async (id: string) => {
  const { data } = await api.delete(`/journal/${id}`);
  return data;
};
