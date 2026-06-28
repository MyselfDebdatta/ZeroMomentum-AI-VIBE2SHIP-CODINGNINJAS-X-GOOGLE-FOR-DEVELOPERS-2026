import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { AuthRequest } from '../middlewares/auth.middleware';
import { groqFastAgent, groqComplexAgent, geminiSupervisor } from '../agents/llm';
import { SystemMessage, HumanMessage } from '@langchain/core/messages';


export const createTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, description, priority, deadline, estimatedTime, subtasks } = req.body;
    // user uid comes from auth token, if not present we fall back to a dummy string for local dev
    const userId = req.user?.uid || 'test-user-uid';

    // Make sure user exists in DB or create it
    let user = await prisma.user.findUnique({ where: { firebaseUid: userId } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          firebaseUid: userId,
          email: req.user?.email || `${userId}@example.com`,
          name: req.user?.name || 'Test User',
        }
      });
    }

    let finalSubtasks = subtasks;
    
    // Auto-generate subtasks and calculate initial risk using Llama 3
    let baseMissRisk = 15;
    if (!finalSubtasks || finalSubtasks.length === 0) {
      try {
        const sysMsg = new SystemMessage(`You are an elite execution AI for ZeroMomentum. The user is creating a task: "${title}". Context: "${description || 'None'}". Deadline: ${deadline || 'None'}. Break this task down into 3-5 highly actionable, specific subtasks. Also, determine a "baseRisk" percentage (0-100) indicating how complex/risky this task is at baseline based on its nature and deadline. Return ONLY a valid JSON object matching exactly this structure: { "subtasks": ["Step 1", "Step 2"], "baseRisk": 45 }. Do not add markdown or conversational text.`);
        const response = await groqComplexAgent.invoke([sysMsg, new HumanMessage("Generate subtasks and base risk.")]);
        
        let jsonStr = (response.content as string).trim();
        if (jsonStr.startsWith('\`\`\`json')) {
          jsonStr = jsonStr.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim();
        } else if (jsonStr.startsWith('\`\`\`')) {
          jsonStr = jsonStr.replace(/\`\`\`/g, '').trim();
        }
        
        
        const parsed = JSON.parse(jsonStr);
        finalSubtasks = parsed.subtasks || [];
        baseMissRisk = parsed.baseRisk || 15;
      } catch (err) {
        console.error("AI Subtask & Risk Generation failed:", err);
        finalSubtasks = [];
      }
    }

    const generatedCardNumber = `TSK-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const task = await prisma.task.create({
      data: {
        title,
        cardNumber: generatedCardNumber,
        description,
        priority,
        deadline: deadline ? new Date(deadline) : null,
        estimatedTime,
        baseMissRisk,
        userId: user.id,
        subtasks: finalSubtasks && finalSubtasks.length > 0 ? {
          create: finalSubtasks.map((st: string) => ({ title: st }))
        } : undefined
      } as any, // Cast to any to bypass TS compiler error until user re-runs prisma generate
      include: { subtasks: true }
    });

    // Log the AI Action for Context Broadcasts if AI was triggered
    if (!subtasks || subtasks.length === 0) {
      await prisma.aILog.create({
        data: {
          agentName: `AI Supervisor (${(task as any).cardNumber})`,
          action: `Generated ${finalSubtasks.length} execution subtasks and calculated a Baseline Risk of ${baseMissRisk}%. (Note: Total risk will dynamically escalate as the deadline approaches).`,
          details: {
            taskTitle: title,
            baseMissRisk: baseMissRisk,
            generatedSubtasks: finalSubtasks,
            deadline: deadline || 'None specified'
          } as any
        }
      });
    }

    res.status(201).json(task);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
};

export const getTasks = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.uid || 'test-user-uid';
    const user = await prisma.user.findUnique({ where: { firebaseUid: userId } });
    
    if (!user) {
      res.status(200).json([]);
      return;
    }

    const tasks = await prisma.task.findMany({
      where: { userId: user.id },
      include: { subtasks: true, scheduleBlocks: true },
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
};

export const updateTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, title, description, priority } = req.body;

    const task = await prisma.task.update({
      where: { id: id as string },
      data: { 
        status: status ? (String(status) as any) : undefined, 
        title: title ? (String(title) as any) : undefined, 
        description: description ? (String(description) as any) : undefined, 
        priority: priority ? (Number(priority) as any) : undefined 
      },
    });

    if (status === 'deleted') {
      const allLogs = await prisma.aILog.findMany();
      const logsToDelete = allLogs.filter(log => {
        const details = log.details as any;
        const matchesTitle = details?.taskTitle === task.title || details?.task?.title === task.title;
        const matchesCard = task.cardNumber && log.agentName.includes(task.cardNumber);
        return matchesTitle || matchesCard;
      });
      
      if (logsToDelete.length > 0) {
        await prisma.aILog.deleteMany({
          where: { id: { in: logsToDelete.map(l => l.id) } }
        });
      }
    }

    res.status(200).json(task);
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
};

export const deleteTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    // Get task before deleting to know its title for log cleanup
    const taskToDelete = await prisma.task.findUnique({ where: { id: id as string } });
    
    // Cascade delete associated records first to avoid foreign key violations
    await prisma.subtask.deleteMany({ where: { taskId: id as string } });
    await prisma.scheduleBlock.deleteMany({ where: { taskId: id as string } });

    await prisma.task.delete({
      where: { id: id as string }
    });

    // Clean up Context Broadcast logs related to this task
    if (taskToDelete) {
      const allLogs = await prisma.aILog.findMany();
      const logsToDelete = allLogs.filter(log => {
        const details = log.details as any;
        const matchesTitle = details?.taskTitle === taskToDelete.title || details?.task?.title === taskToDelete.title;
        const matchesCard = taskToDelete.cardNumber && log.agentName.includes(taskToDelete.cardNumber);
        return matchesTitle || matchesCard;
      });
      
      if (logsToDelete.length > 0) {
        await prisma.aILog.deleteMany({
          where: { id: { in: logsToDelete.map(l => l.id) } }
        });
      }
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
};

export const updateSubtask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const subtask = await prisma.subtask.update({
      where: { id: id as string },
      data: { status: status as string }
    });
    
    res.status(200).json(subtask);
  } catch (error) {
    console.error('Error updating subtask:', error);
    res.status(500).json({ error: 'Failed to update subtask' });
  }
};

export const getSchedules = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.uid || 'test-user-uid';
    const user = await prisma.user.findUnique({ where: { firebaseUid: userId } });
    
    if (!user) {
      res.status(200).json([]);
      return;
    }

    const schedules = await prisma.scheduleBlock.findMany({
      where: {
        task: { 
          userId: user.id,
          status: { notIn: ['completed', 'deleted'] }
        }
      },
      include: {
        task: true
      },
      orderBy: { startTime: 'asc' }
    });

    res.status(200).json(schedules);
  } catch (error) {
    console.error('Error fetching schedules:', error);
    res.status(500).json({ error: 'Failed to fetch schedules' });
  }
};

export const getDiagnostics = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.uid || 'test-user-uid';
    const user = await prisma.user.findUnique({ where: { firebaseUid: userId } });
    
    if (!user) {
      res.status(200).json({ dynamicTasks: 0, completedWorkloads: 0, habitsEnrolled: 0, inboxStacks: 0 });
      return;
    }

    const [dynamicTasks, completedWorkloads, habitsEnrolled] = await Promise.all([
      prisma.task.count({ where: { userId: user.id, status: { notIn: ['completed', 'deleted'] } } }),
      prisma.task.count({ where: { userId: user.id, status: 'completed' } }),
      prisma.habit.count({ where: { userId: user.id, isArchived: false } }).catch(() => 0) 
    ]);

    res.status(200).json({
      dynamicTasks,
      completedWorkloads,
      habitsEnrolled,
      inboxStacks: 0
    });
  } catch (error) {
    console.error('Error fetching diagnostics:', error);
    res.status(500).json({ error: 'Failed to fetch diagnostics' });
  }
};

export const createHabit = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, category } = req.body;
    const userId = req.user?.uid || 'test-user-uid';
    const user = await prisma.user.findUnique({ where: { firebaseUid: userId } });
    if (!user) return;

    const habit = await prisma.habit.create({
      data: {
        title,
        category: category || 'Focus',
        frequency: 'daily',
        userId: user.id
      } as any
    });
    res.status(201).json(habit);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create habit' });
  }
};

export const getHabits = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.uid || 'test-user-uid';
    const user = await prisma.user.findUnique({ where: { firebaseUid: userId } });
    if (!user) { res.status(200).json([]); return; }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const status = req.query.status as string;
    const whereClause: any = { userId: user.id };
    if (status === 'archived') {
      whereClause.isArchived = true;
    } else {
      whereClause.isArchived = false;
    }

    const habits = await prisma.habit.findMany({
      where: whereClause,
      include: {
        habitLogs: {
          where: { date: today }
        }
      } as any,
      orderBy: { createdAt: 'desc' }
    });

    const formattedHabits = habits.map((h: any) => ({
      ...h,
      completedToday: h.habitLogs && h.habitLogs.length > 0
    }));

    res.status(200).json(formattedHabits);
  } catch (error) {
    console.error('Error fetching habits:', error);
    res.status(500).json({ error: 'Failed to fetch habits' });
  }
};

export const toggleHabit = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.uid || 'test-user-uid';
    const user = await prisma.user.findUnique({ where: { firebaseUid: userId } });
    if (!user) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existingLog = await (prisma as any).habitLog.findUnique({
      where: {
        habitId_date: { habitId: id, date: today }
      }
    });

    let newStreak = 0;
    let earnedShield = false;
    let shieldsToUpdate = (user as any).shields || 0;

    if (existingLog) {
      await (prisma as any).habitLog.delete({ where: { id: existingLog.id } });
      const habit = await prisma.habit.update({
        where: { id: id as string },
        data: { streak: { decrement: 1 } }
      });
      newStreak = habit.streak;
    } else {
      await (prisma as any).habitLog.create({
        data: {
          habitId: id,
          userId: user.id,
          date: today
        }
      });
      const habit = await prisma.habit.findUnique({ where: { id: id as string } });
      newStreak = (habit?.streak || 0) + 1;
      
      if (newStreak > 0 && newStreak % 7 === 0) {
        shieldsToUpdate += 1;
        earnedShield = true;
      }

      await prisma.habit.update({
        where: { id: id as string },
        data: { streak: newStreak }
      });
      
      if (earnedShield) {
        await prisma.user.update({
          where: { id: user.id },
          data: { shields: shieldsToUpdate } as any
        });
      }
    }

    res.status(200).json({ success: true, completedToday: !existingLog, streak: Math.max(0, newStreak), earnedShield, shields: shieldsToUpdate });
  } catch (error) {
    console.error('Toggle error:', error);
    res.status(500).json({ error: 'Failed to toggle habit' });
  }
};

export const getHeatmapData = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.uid || 'test-user-uid';
    const user = await prisma.user.findUnique({ where: { firebaseUid: userId } });
    if (!user) { res.status(200).json([]); return; }

    const hundredTwentyDaysAgo = new Date();
    hundredTwentyDaysAgo.setDate(hundredTwentyDaysAgo.getDate() - 120);
    hundredTwentyDaysAgo.setHours(0,0,0,0);

    const logs = await (prisma as any).habitLog.findMany({
      where: {
        userId: user.id,
        date: { gte: hundredTwentyDaysAgo }
      }
    });

    const completedTasks = await prisma.task.findMany({
      where: {
        userId: user.id,
        status: 'completed',
        updatedAt: { gte: hundredTwentyDaysAgo }
      }
    });

    const densityMap: Record<string, number> = {};

    logs.forEach((log: any) => {
      const dateStr = log.date.toISOString().split('T')[0];
      densityMap[dateStr] = (densityMap[dateStr] || 0) + 1;
    });

    completedTasks.forEach((t: any) => {
      const dateStr = t.updatedAt.toISOString().split('T')[0];
      densityMap[dateStr] = (densityMap[dateStr] || 0) + 2; 
    });

    const heatmap = [];
    for (let i = 119; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      heatmap.push({
        date: dateStr,
        intensity: densityMap[dateStr] || 0
      });
    }

    res.status(200).json(heatmap);
  } catch (error) {
    console.error('Heatmap error:', error);
    res.status(500).json({ error: 'Failed to get heatmap' });
  }
};

export const archiveHabit = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await prisma.habit.update({
      where: { id: id as string },
      data: { isArchived: true } as any
    });
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to archive habit' });
  }
};

export const unarchiveHabit = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await prisma.habit.update({
      where: { id: id as string },
      data: { isArchived: false } as any
    });
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to unarchive habit' });
  }
};

export const getHabitInsights = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.uid || 'test-user-uid';
    const user = await prisma.user.findUnique({ where: { firebaseUid: userId } });
    if (!user) { res.status(200).json({ insight: 'User not found.' }); return; }

    const habits = await prisma.habit.findMany({
      where: { userId: user.id, isArchived: false } as any,
    });

    if (habits.length === 0) {
      res.status(200).json({ insight: 'No active habits found. Install new behaviors above.' });
      return;
    }

    const prompt = `You are a behavioral analyst AI for a high-performance workspace. 
    Analyze the following user habits and provide exactly ONE short, punchy, actionable paragraph (max 3 sentences) of advice. Do not use pleasantries.
    Habits:
    ${habits.map((h: any) => `- ${h.title} (Category: ${h.category || 'General'}, Streak: ${h.streak})`).join('\n')}
    `;

    const response = await groqFastAgent.invoke([{ role: 'user', content: prompt }]);
    
    res.status(200).json({ insight: response.content, shields: (user as any).shields || 0 });
  } catch (error) {
    console.error('Insights error:', error);
    res.status(500).json({ insight: 'Could not generate behavioral insights at this time.' });
  }
};

export const generateRecoveryPlan = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const firebaseUid = req.user?.uid || 'test-user-uid';

    const user = await prisma.user.findUnique({ where: { firebaseUid } });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Fetch critical/medium tasks
    const tasks = await prisma.task.findMany({
      where: {
        userId: user.id,
        status: 'pending',
        priority: { gt: 1 }
      },
      select: {
        id: true,
        title: true,
        priority: true,
        estimatedTime: true,
        deadline: true
      }
    });

    if (tasks.length === 0) {
       res.status(200).json([]);
       return;
    }

    const taskList = tasks.map(t => `- ${t.title} (Priority: ${t.priority}, Est: ${t.estimatedTime || 60}m)`).join('\n');
    const now = new Date();
    const currentHour = now.getHours();

    const prompt = `You are an aggressive emergency productivity architect. The user is falling behind and has triggered the Recovery Matrix.
It is currently ${currentHour}:00.
Here are the user's critical pending tasks:
${taskList}

Generate a strict, aggressive, highly-focused recovery schedule for the next 4 hours.
Rules:
1. Ignore low priority friction. Focus only on making progress on the provided tasks.
2. The schedule MUST contain alternating "work" blocks (focused sprints) and short "breather" blocks (to prevent burnout).
3. Return ONLY a valid JSON array of objects. Do not wrap in markdown tags like \`\`\`json.
Object format:
{
  "timeWindow": "HH:MM - HH:MM",
  "taskTitle": "Short title or Breather",
  "context": "Aggressive reason for this block",
  "type": "work" | "breather"
}
Output nothing else but the JSON array.`;

    const response = await groqFastAgent.invoke([{ role: 'user', content: prompt }]);
    let plan = [];
    try {
      const content = typeof response.content === 'string' ? response.content : JSON.stringify(response.content);
      const cleanedContent = content.replace(/```json/g, '').replace(/```/g, '').trim();
      plan = JSON.parse(cleanedContent);
    } catch (e) {
      console.error("Failed to parse recovery plan JSON:", response.content);
    }
    
    res.status(200).json(plan);
  } catch (error) {
    console.error('Recovery Plan error:', error);
    res.status(500).json({ message: 'Could not generate recovery plan' });
  }
};

export const parseEmails = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const firebaseUid = req.user?.uid || 'test-user-uid';
    const user = await prisma.user.findUnique({ where: { firebaseUid } });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const { emails } = req.body;
    if (!emails || !Array.isArray(emails) || emails.length === 0) {
       res.status(400).json({ error: 'No emails provided' });
       return;
    }

    const parsedResults = [];

    for (const email of emails) {
      const prompt = `
You are an expert project management AI. Extract a structured task from the following email.
Sender: ${email.from}
Subject: ${email.subject}
Body: ${email.body}

Rules:
1. Estimate effort in minutes based on the task description (e.g. reading a doc = 15m, making slides = 120m).
2. Assess baseMissRisk (0-100) based on strictness, penalty language, and urgency.
3. Determine priority (1 = Low, 2 = Medium, 3 = High).
4. Extract subtasks if there are distinct steps.
5. If there is a deadline mentioned, calculate a plausible future ISO string (assume current date is late June 2026 if context is vague). If no deadline, return null for deadline.
6. Return ONLY a valid JSON object matching this exact format.
7. NO MARKDOWN TAGS.
8. NO INLINE COMMENTS (//) inside the JSON.
9. NO EXPLANATIONS. OUTPUT NOTHING BUT THE VALID JSON.
{
  "title": "Clear concise task name",
  "description": "Task context",
  "priority": number,
  "estimatedTime": number,
  "baseMissRisk": number,
  "deadline": "ISO 8601 string or null",
  "subtasks": [{"title": "step 1", "status": "pending"}]
}
`;

      const response = await groqFastAgent.invoke([{ role: 'user', content: prompt }]);
      try {
        let content = typeof response.content === 'string' ? response.content : JSON.stringify(response.content);
        const match = content.match(/\{[\s\S]*\}/);
        if (match) {
          content = match[0];
        }
        // Strip JS single-line comments that Llama sometimes insists on adding
        content = content.replace(/\/\/.*$/gm, '');
        const extracted = JSON.parse(content);

        // Create the task in Prisma
        const task = await prisma.task.create({
          data: {
            cardNumber: `MAIL-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
            title: extracted.title,
            description: extracted.description + `\n\n[Parsed from Email: ${email.subject}]`,
            priority: extracted.priority || 2,
            estimatedTime: extracted.estimatedTime || 60,
            baseMissRisk: extracted.baseMissRisk || 50,
            deadline: extracted.deadline ? new Date(extracted.deadline) : null,
            userId: user.id,
            subtasks: {
              create: extracted.subtasks?.map((st: any) => ({
                title: st.title,
                status: 'pending'
              })) || []
            }
          }
        });
        
        parsedResults.push({ id: email.id, taskId: task.id });
      } catch (e: any) {
        console.error("Failed to parse email JSON from Gemini/Groq:", e.message, "\nResponse content:", response.content);
        parsedResults.push({ id: email.id, error: e.message, content: response.content });
      }
    }

    res.status(200).json({ parsed: parsedResults });
  } catch (error: any) {
    console.error('Email parsing error:', error);
    res.status(500).json({ message: 'Could not parse emails', error: error?.message || String(error) });
  }
};
