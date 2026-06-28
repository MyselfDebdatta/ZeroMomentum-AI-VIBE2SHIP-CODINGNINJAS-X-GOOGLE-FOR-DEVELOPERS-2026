import { BaseMessage } from '@langchain/core/messages';
import { StateGraphArgs } from '@langchain/langgraph';

// Define the state of the agent graph
export interface AgentState {
  messages: BaseMessage[];
  nextNode: string;
  originalQuery: string;
  userId?: string;
  taskData?: {
    title?: string;
    description?: string;
    priority?: number;
    estimatedTime?: number;
    deadline?: string;
    subtasks?: string[];
    existingCardNumber?: string;
  };
  scheduleData?: {
    startTime: string;
    endTime: string;
    reason: string;
  }[];
  finalResponse?: string;
}

// LangGraph state channels definition
export const agentStateChannels: StateGraphArgs<AgentState>["channels"] = {
  messages: {
    value: (x: BaseMessage[], y: BaseMessage[]) => x.concat(y),
    default: () => [],
  },
  nextNode: {
    value: (x: string, y: string) => y ?? x,
    default: () => "supervisor",
  },
  originalQuery: {
    value: (x: string, y: string) => y ?? x,
    default: () => "",
  },
  userId: {
    value: (x, y) => y ?? x,
    default: () => undefined,
  },
  taskData: {
    value: (x, y) => y ?? x,
    default: () => undefined,
  },
  scheduleData: {
    value: (x, y) => y ?? x,
    default: () => undefined,
  },
  finalResponse: {
    value: (x, y) => y ?? x,
    default: () => undefined,
  }
};
