import { AgentState } from '../state';
import { groqComplexAgent } from '../llm';
import { SystemMessage, HumanMessage } from '@langchain/core/messages';
import { z } from 'zod';
import { StructuredOutputParser } from '@langchain/core/output_parsers';

const parser = StructuredOutputParser.fromZodSchema(
  z.object({
    title: z.string().optional().describe("The clean, concise title of the task"),
    description: z.string().optional().describe("A brief description or context of the task"),
    priority: z.number().min(1).max(3).optional().describe("Priority: 1 (Low), 2 (Medium), 3 (High)"),
    estimatedTime: z.number().optional().describe("Estimated time to complete the task in minutes"),
    deadline: z.string().optional().describe("ISO 8601 string of the exact deadline. IF the user mentions a specific time in their query (e.g. '1:40 PM'), you MUST parse it as today's date and output the ISO string. Otherwise, inherit it from the context."),
    existingCardNumber: z.string().optional().describe("If the user's query refers to an existing task in the context (e.g., TSK-1234), put that exact ID here. Otherwise leave empty."),
    subtasks: z.array(z.string()).optional().describe("List of subtasks if the task is complex, otherwise empty array")
  })
);

export const taskIntelligenceNode = async (state: AgentState): Promise<Partial<AgentState>> => {
  const { originalQuery } = state;
  const formatInstructions = parser.getFormatInstructions();

  const now = new Date();
  const localTimeStr = now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata', dateStyle: 'full', timeStyle: 'long' });

  const systemMsg = new SystemMessage(`You are the Task Intelligence & Execution Agent for ZeroMomentum AI.
Your job is to analyze the user's input, extract the core task or action required, estimate effort in minutes, calculate priority (1-3), and ACT as an Execution Agent by breaking it down into actionable subtasks.
IMPORTANT: If the user is referring to or asking to schedule an EXISTING task in the provided Database Context, you MUST NOT generate a new "Investigate" task. Instead, output the exact Task ID (e.g., TSK-1234) in the existingCardNumber field.
CRITICAL: If the user explicitly states a deadline in their query (e.g., "my deadline is 1 PM"), you MUST override the context and output that exact time as an ISO 8601 string for today. The current local time is: ${localTimeStr}.
ONLY generate a completely new task if the user is asking you to do something NOT in the context.
You MUST output ONLY valid JSON that conforms to the requested schema. If you provide existingCardNumber, you may omit the other fields. Do not add markdown formatting or extra text.
${formatInstructions}`);

  const userMsg = new HumanMessage(`Analyze this request: "${originalQuery}"`);

  try {
    const response = await groqComplexAgent.invoke([systemMsg, userMsg]);
    const parsedData = await parser.parse(response.content as string);

    return {
      taskData: parsedData,
      nextNode: 'scheduler' // Send to scheduler next
    };
  } catch (error) {
    console.error("Task Intelligence Error:", error);
    return {
      finalResponse: "I'm sorry, I couldn't properly understand the request. Could you rephrase it?",
      nextNode: 'END'
    };
  }
};
