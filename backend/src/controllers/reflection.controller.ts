import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { geminiSupervisor } from '../agents/llm';
import { AuthRequest } from '../middlewares/auth.middleware';

const prisma = new PrismaClient();

export const analyzeReflection = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { text } = req.body;
    const firebaseUid = req.user?.uid || 'test-user-uid';

    let user = await prisma.user.findUnique({ where: { firebaseUid } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          firebaseUid,
          email: req.user?.email || `${firebaseUid}@example.com`,
          name: req.user?.name || 'Test User',
        }
      });
    }

    if (!text) {
      res.status(400).json({ error: 'Journal text is required' });
      return;
    }

    // Call Gemini to analyze the journal
    const prompt = `
You are the ZeroMomentum Motivation Agent, a highly empathetic and analytical productivity coach.
Analyze the following end-of-day reflection journal from the user.

Journal Entry:
"${text}"

Extract the following information and return ONLY a valid JSON object matching this schema:
{
  "moodDetection": "A 1-3 word classification of their mental state (e.g., 'Anxious but Productive', 'Fatigued', 'Highly Focused')",
  "coachInsight": "A supportive 1-2 sentence analytical summary detailing what went well and what blocked their progress.",
  "lockInPriorities": ["Priority 1", "Priority 2", "Priority 3"] // Exactly 3 concrete, actionable priorities for tomorrow based on their journal
}

Ensure the response is raw JSON without markdown formatting (\`\`\`json).
`;

    const response = await geminiSupervisor.invoke(prompt);
    const content = response.content.toString().trim();
    
    // Clean up potential markdown formatting from Gemini response
    const jsonStr = content.replace(/^```json/i, '').replace(/^```/i, '').replace(/```$/i, '').trim();
    
    const parsed = JSON.parse(jsonStr);

    // Save to Prisma
    // @ts-ignore - Ignore type error if prisma generate hasn't successfully updated types yet
    const reflection = await prisma.eveningReflection.create({
      data: {
        rawInput: text,
        moodDetection: parsed.moodDetection,
        coachInsight: parsed.coachInsight,
        lockInPriorities: parsed.lockInPriorities,
        userId: user.id,
      }
    });

    res.json(reflection);
  } catch (error: any) {
    console.error('Error analyzing reflection:', error);
    res.status(500).json({ error: 'Failed to analyze reflection' });
  }
};

export const getReflections = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const firebaseUid = req.user?.uid || 'test-user-uid';
    
    const user = await prisma.user.findUnique({ where: { firebaseUid } });
    if (!user) {
      res.json([]);
      return;
    }

    // @ts-ignore
    const reflections = await prisma.eveningReflection.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' }
    });

    res.json(reflections);
  } catch (error) {
    console.error('Error fetching reflections:', error);
    res.status(500).json({ error: 'Failed to fetch reflections' });
  }
};

export const deleteReflection = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const firebaseUid = req.user?.uid || 'test-user-uid';
    
    const user = await prisma.user.findUnique({ where: { firebaseUid } });
    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // @ts-ignore
    await prisma.eveningReflection.deleteMany({
      where: { 
        id,
        userId: user.id
      }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting reflection:', error);
    res.status(500).json({ error: 'Failed to delete reflection' });
  }
};
