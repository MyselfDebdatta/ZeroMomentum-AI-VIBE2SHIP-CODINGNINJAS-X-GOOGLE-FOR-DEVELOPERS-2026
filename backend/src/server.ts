import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
  },
});

import taskRoutes from './routes/task.routes';
import agentRoutes from './routes/agent.routes';
import reflectionRoutes from './routes/reflection.routes';

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'ZeroMomentum AI Backend' });
});

app.use('/api/tasks', taskRoutes);
app.use('/api/agents', agentRoutes);
app.use('/api/journal', reflectionRoutes);

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
