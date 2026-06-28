import { StateGraph, START, END } from '@langchain/langgraph';
import { AgentState, agentStateChannels } from './state';
import { taskIntelligenceNode } from './nodes/taskIntelligence';
import { schedulerNode } from './nodes/scheduler';
import { supervisorNode } from './nodes/supervisor';

// Initialize the graph
const workflow = new StateGraph<AgentState>({
  channels: agentStateChannels
});

// Add nodes
workflow.addNode('taskIntelligence', taskIntelligenceNode);
workflow.addNode('scheduler', schedulerNode);
workflow.addNode('supervisor', supervisorNode);

// Define edges
workflow.addEdge(START, 'taskIntelligence' as any);

// Logic for conditional routing
workflow.addConditionalEdges(
  'taskIntelligence' as any,
  (state: AgentState) => state.nextNode,
  {
    scheduler: 'scheduler' as any,
    END: END as any
  }
);

workflow.addConditionalEdges(
  'scheduler' as any,
  (state: AgentState) => state.nextNode,
  {
    supervisor: 'supervisor' as any,
    END: END as any
  }
);

workflow.addConditionalEdges(
  'supervisor' as any,
  (state: AgentState) => state.nextNode,
  {
    END: END as any
  }
);

// Compile graph
export const appGraph = workflow.compile();
