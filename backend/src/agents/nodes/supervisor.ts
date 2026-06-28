import { AgentState } from '../state';
import { groqComplexAgent } from '../llm';
import { SystemMessage, HumanMessage } from '@langchain/core/messages';

export const supervisorNode = async (state: AgentState): Promise<Partial<AgentState>> => {
  const { originalQuery, taskData, scheduleData } = state;

  // If the task wasn't parsed, just return
  if (!taskData) {
    return {
      nextNode: 'END'
    };
  }

  const systemMsg = new SystemMessage(`You are AI Supervisor, the world's most advanced autonomous productivity companion.
Your job is to provide a highly detailed, comprehensive summary to the user based on the actions taken by your sub-agents.
Speak as an intelligent executive assistant. Be professional, slightly futuristic, and motivating.
You MUST provide a VERY DETAILED response. If the user asked a question (like "why is miss risk high"), explain the logic based on the provided context.
You MUST explicitly list out the execution strategy (subtasks) and the exact Scheduling Blocks that were generated for them.
Do NOT output JSON. Output structured, readable text.`);

  const userMsg = new HumanMessage(`Original User Request: "${originalQuery}"

The Task Intelligence Agent extracted this Execution Strategy:
Title: ${taskData.title}
Subtasks:
${taskData.subtasks?.map(st => `- ${st}`).join('\n') || 'None'}
Estimated Time: ${taskData.estimatedTime} mins

The Scheduler Agent scheduled this for:
${scheduleData ? scheduleData.map(s => `- ${s.startTime} to ${s.endTime} (${s.reason})`).join('\n') : 'No schedule generated'}

Provide a highly detailed response answering the user's original query, detailing the execution strategy, and confirming the exact schedule blocks.`);

  try {
    const response = await groqComplexAgent.invoke([systemMsg, userMsg]);
    
    return {
      finalResponse: response.content as string,
      nextNode: 'END'
    };
  } catch (error) {
    console.error("Supervisor Error:", error);
    return {
      finalResponse: "I successfully processed your task, but encountered an error generating the final summary.",
      nextNode: 'END'
    };
  }
};
