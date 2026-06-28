import { Router } from 'express';
import { authenticateUser } from '../middlewares/auth.middleware';
import { analyzeReflection, getReflections, deleteReflection } from '../controllers/reflection.controller';

const router = Router();

// Apply auth middleware to all reflection routes
router.use(authenticateUser);

router.post('/', analyzeReflection);
router.get('/', getReflections);
router.delete('/:id', deleteReflection);

export default router;
