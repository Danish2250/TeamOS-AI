
import 'dotenv/config';
import http from 'http';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { Server } from 'socket.io';

import authRoutes from './routes/auth.js';
import projectRoutes from './routes/projects.js';
import taskRoutes from './routes/tasks.js';
import aiRoutes from './routes/ai.js';
import { requireAuth } from './middleware/auth.js';

const app = express();
const server = http.createServer(app);

const CLIENT_URL =
  process.env.CLIENT_URL || 'http://localhost:5173';

const io = new Server(server, {
  cors: {
    origin: CLIENT_URL,
    methods: ['GET', 'POST', 'PATCH', 'DELETE']
  }
});

app.set('io', io);

app.use(cors({ origin: CLIENT_URL }));
app.use(express.json({ limit: '1mb' }));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    app: 'TeamOS AI API'
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', requireAuth, projectRoutes);
app.use('/api/tasks', requireAuth, taskRoutes);
app.use('/api/ai', requireAuth, aiRoutes);

// Socket connection
io.on('connection', socket => {
  socket.on('join-user', userId => {
    socket.join(`user:${userId}`);
  });
});

const PORT = process.env.PORT || 5000;

// MongoDB connection
async function startServer() {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error(
        'MONGO_URI is missing. Check backend/.env'
      );
    }

    console.log('Connecting to MongoDB Atlas...');

    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 15000
    });

    console.log('Connected to MongoDB successfully.');

    server.listen(PORT, () => {
      console.log(
        `TeamOS API running on http://localhost:${PORT}`
      );
    });

  } catch (error) {
    console.error('\n========== DATABASE ERROR ==========');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);

    if (error.reason) {
      console.error('Topology details:', error.reason);
    }

    if (error.cause) {
      console.error('Cause:', error.cause);
    }

    console.error('====================================\n');

    process.exit(1);
  }
}

startServer();
