import { ChatGroq } from '@langchain/groq';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import dotenv from 'dotenv';

dotenv.config();

// The main reasoning brain - Gemini 2.5 Pro
export const geminiSupervisor = new ChatGoogleGenerativeAI({
  model: 'gemini-2.5-flash',
  apiKey: process.env.GEMINI_API_KEY,
  temperature: 0.2,
});

// The fast execution engines - Groq (Llama 3)
export const groqFastAgent = new ChatGroq({
  model: 'llama-3.1-8b-instant',
  apiKey: process.env.GROQ_API_KEY,
  temperature: 0.1,
});

export const groqComplexAgent = new ChatGroq({
  model: 'llama-3.3-70b-versatile',
  apiKey: process.env.GROQ_API_KEY,
  temperature: 0.3,
});
