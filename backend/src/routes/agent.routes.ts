import { Router } from 'express';
import { chatWithAgent, getLogs, acknowledgeLog, commandHubChat, clearCommandHubLogs, clearAllLogs } from '../controllers/agent.controller';
import { authenticateUser } from '../middlewares/auth.middleware';

const router = Router();

// Apply auth middleware
router.use(authenticateUser);

router.post('/chat', chatWithAgent);
router.post('/command-hub', commandHubChat);
router.delete('/command-hub/logs', clearCommandHubLogs);
router.get('/logs', getLogs);
router.delete('/logs', clearAllLogs);
router.put('/logs/:id/acknowledge', acknowledgeLog);

export default router;
