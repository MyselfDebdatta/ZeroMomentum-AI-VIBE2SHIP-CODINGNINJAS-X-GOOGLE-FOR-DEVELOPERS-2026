import { Request, Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { appGraph } from '../agents/graph';
import prisma from '../utils/prisma';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { groqFastAgent } from '../agents/llm';

const AGENT_PROMPTS: Record<string, string> = {
  'AI Orchestrator': 'You are the AI Orchestrator, the general manager of the ZeroMomentum workspace. Coordinate the overall team, synthesize high-level strategy, and direct the user to specialized agents if needed. Be professional and slightly futuristic.',
  'Task Intel Agent': 'You are the Task Intel Agent. Analyze deadlines, break down high-level objectives into actionable sub-tasks, and evaluate risk percentages for the user. Be analytical and precise.',
  'Scheduler Agent': 'You are the Scheduler Agent. Build chronological micro-schedules and optimize daily deep-work slots based on the user\'s tasks. Be highly organized and time-conscious.',
  'Context Agent': 'You are the Context Agent. Cross-reference real-world variables, routines, and environmental data to give warnings or contextual advice. Be observant and proactive.',
  'Habit Agent': 'You are the Habit Agent. Track daily rituals, disciplines, and streak progress. Encourage consistency and discipline. Be firm but supportive.',
  'Recovery Agent': 'You are the Recovery Agent. Step in during crisis states to defer low-priority tasks and outline emergency hourly catch-up sprints. Prioritize mental health and burnout prevention.',
  'Motivation Coach': 'You are the Motivation Coach. Focus on mental endurance, recommend burnout countermeasures, and provide encouragement. Be highly empathetic and inspiring.',
  'Execution Agent': 'You are the Execution Agent. Generate direct, actionable resources such as study guides, focus blueprints, or step-by-step execution plans. Be extremely practical and action-oriented.'
};

export const chatWithAgent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { message } = req.body;
    const userId = req.user?.uid || 'test-user-uid';

    if (!message) {
      res.status(400).json({ error: 'Message is required' });
      return;
    }

    const user = await prisma.user.findUnique({ 
      where: { firebaseUid: userId },
      include: { tasks: { where: { status: { not: 'completed' } } } }
    });

    let contextString = 'User has no active tasks in the database.';
    if (user && user.tasks && user.tasks.length > 0) {
      contextString = user.tasks.map((t: any) => {
        const formattedDeadline = t.deadline 
          ? new Date(t.deadline).toLocaleString('en-US', { timeZone: 'Asia/Kolkata', dateStyle: 'full', timeStyle: 'short' }) 
          : 'None';
        return `Task ID: ${t.cardNumber || 'Unknown'} | Title: ${t.title} | Risk: ${t.baseMissRisk}% | Deadline: ${formattedDeadline}`;
      }).join('\n');
    }

    const enhancedMessage = `CURRENT DATABASE CONTEXT (User's Active Tasks):\n${contextString}\n\nUSER QUERY: ${message}`;

    // Run the LangGraph
    const initialState = {
      messages: [new HumanMessage(enhancedMessage)],
      originalQuery: enhancedMessage,
      nextNode: 'taskIntelligence',
      userId: user?.id || userId
    };

    const result = (await appGraph.invoke(initialState)) as unknown as import('../agents/state').AgentState;

    // If tasks were generated, let's actually save them to DB
    let createdTask = null;
    if (result.taskData) {
      const user = await prisma.user.findUnique({ where: { firebaseUid: userId } });
      
      if (user) {
        if ((result.taskData as any).existingCardNumber) {
          createdTask = await (prisma.task as any).findFirst({
            where: { cardNumber: (result.taskData as any).existingCardNumber, userId: user.id }
          });
          
          if (createdTask) {
             createdTask = await (prisma.task as any).update({
                where: { id: createdTask.id },
                data: {
                   priority: result.taskData.priority,
                   estimatedTime: result.taskData.estimatedTime,
                   ...(result.taskData.deadline && { deadline: new Date(result.taskData.deadline) })
                }
             });
          }
        }

        if (!createdTask) {
          const generatedCardNumber = `TSK-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

          createdTask = await prisma.task.create({
            data: {
              userId: user.id,
              cardNumber: generatedCardNumber,
              title: result.taskData.title,
              description: result.taskData.description,
              priority: result.taskData.priority,
              deadline: result.taskData.deadline ? new Date(result.taskData.deadline) : null,
              estimatedTime: result.taskData.estimatedTime,
              subtasks: result.taskData.subtasks && result.taskData.subtasks.length > 0 ? {
                create: result.taskData.subtasks.map((st: string) => ({ title: st }))
              } : undefined
            } as any
          });
        }

        // Save schedule blocks if available
        console.log("SCHEDULE DATA TO SAVE:", result.scheduleData);
        if (result.scheduleData && result.scheduleData.length > 0) {
          console.log("CREATING SCHEDULE BLOCKS FOR TASK:", createdTask.id);
          for (const block of result.scheduleData) {
            await prisma.scheduleBlock.create({
              data: {
                taskId: createdTask.id,
                startTime: new Date(block.startTime),
                endTime: new Date(block.endTime),
              }
            });
          }
          console.log("FINISHED CREATING SCHEDULE BLOCKS");
        } else {
          console.log("NO SCHEDULE DATA FOUND OR IT IS EMPTY");
        }
        
        // Log Agent Action
        await prisma.aILog.create({
          data: {
            agentName: `AI Supervisor (${(createdTask as any)?.cardNumber || 'NEW'})`,
            action: 'Processed Task Query',
            details: {
              taskTitle: result.taskData.title,
              task: result.taskData,
              schedule: result.scheduleData
            } as any
          }
        });
      }
    }

    res.status(200).json({
      reply: result.finalResponse,
      taskGenerated: createdTask
    });
  } catch (error) {
    console.error('Error chatting with agent:', error);
    res.status(500).json({ error: 'Failed to process agent request' });
  }
};

export const getLogs = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    
    const logs = await prisma.aILog.findMany({
      where: {
        OR: [
          { action: { not: 'Command Hub Interaction' } },
          { 
            action: 'Command Hub Interaction',
            timestamp: { gte: fiveMinutesAgo }
          }
        ]
      },
      orderBy: { timestamp: 'desc' },
      take: 50
    });
    res.status(200).json(logs);
  } catch (error) {
    console.error('Error fetching logs:', error);
    res.status(500).json({ error: 'Failed to fetch AI logs' });
  }
};

export const clearCommandHubLogs = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Delete all Command Hub Interaction logs for a fresh state
    await prisma.aILog.deleteMany({
      where: { action: 'Command Hub Interaction' }
    });
    res.status(200).json({ success: true, message: 'Command Hub logs cleared successfully' });
  } catch (error) {
    console.error('Error clearing command hub logs:', error);
    res.status(500).json({ error: 'Failed to clear command hub logs' });
  }
};

export const clearAllLogs = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await prisma.aILog.deleteMany();
    res.status(200).json({ success: true, message: 'All system logs cleared successfully' });
  } catch (error) {
    console.error('Error clearing all logs:', error);
    res.status(500).json({ error: 'Failed to clear all logs' });
  }
};

export const acknowledgeLog = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const log = await prisma.aILog.update({
      where: { id: id as string },
      data: { isAcknowledged: true }
    });
    res.status(200).json(log);
  } catch (error) {
    console.error('Error acknowledging log:', error);
    res.status(500).json({ error: 'Failed to acknowledge log' });
  }
};

export const commandHubChat = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { agentName, message } = req.body;
    const userId = req.user?.uid || 'test-user-uid';

    if (!agentName || !message) {
      res.status(400).json({ error: 'agentName and message are required' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { firebaseUid: userId } });
    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Live Database Injection
    const pendingTasks = await prisma.task.findMany({
      where: { userId: user.id, status: 'pending' },
      take: 5,
      orderBy: { priority: 'desc' }
    });

    const activeHabits = await prisma.habit.findMany({
      where: { userId: user.id, isArchived: false }
    });

    let contextStr = `--- LIVE WORKSPACE STATE ---\n`;
    contextStr += `Pending Tasks: ${pendingTasks.length > 0 ? pendingTasks.map(t => `[${t.priority === 3 ? 'HIGH' : t.priority === 2 ? 'MED' : 'LOW'}] ${t.title}`).join(', ') : 'None'}\n`;
    contextStr += `Active Habits: ${activeHabits.length > 0 ? activeHabits.map(h => `${h.title} (Streak: ${h.streak})`).join(', ') : 'None'}\n`;
    contextStr += `----------------------------\n`;

    const basePrompt = AGENT_PROMPTS[agentName] || AGENT_PROMPTS['AI Orchestrator'];
    const systemPrompt = new SystemMessage(`${basePrompt}\n\nUse the following live database context to ground your responses:\n${contextStr}`);
    
    const response = await groqFastAgent.invoke([
      systemPrompt,
      new HumanMessage(message)
    ]);

    // Log the interaction
    await prisma.aILog.create({
      data: {
        agentName,
        action: 'Command Hub Interaction',
        details: { message, response: response.content } as any
      }
    });

    res.json({ 
      response: response.content,
      agentName
    });

  } catch (error: any) {
    console.error('Error in command hub chat:', error);
    res.status(500).json({ error: 'Failed to communicate with agent' });
  }
};
