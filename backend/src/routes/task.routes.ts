import { Router } from 'express';
import { createTask, getTasks, updateTask, deleteTask, updateSubtask, getSchedules, getDiagnostics, getHabits, createHabit, toggleHabit, getHeatmapData, getHabitInsights, archiveHabit, unarchiveHabit, generateRecoveryPlan, parseEmails } from '../controllers/task.controller';
import { authenticateUser } from '../middlewares/auth.middleware';

const router = Router();

// Apply auth middleware to all task routes
router.use(authenticateUser);

router.post('/', createTask);
router.get('/', getTasks);
router.get('/schedules', getSchedules);
router.post('/recovery-plan', generateRecoveryPlan);
router.post('/parse-emails', parseEmails);
router.get('/diagnostics', getDiagnostics);
router.put('/:id', updateTask);
router.delete('/:id', deleteTask);
router.put('/subtasks/:id', updateSubtask);

// Habits (routing through tasks for now since it's the same controller)
router.get('/habits/heatmap', getHeatmapData);
router.get('/habits/insights', getHabitInsights);
router.put('/habits/:id/archive', archiveHabit);
router.put('/habits/:id/unarchive', unarchiveHabit);
router.post('/habits/:id/toggle', toggleHabit);
router.post('/habits', createHabit);
router.get('/habits', getHabits);

export default router;
