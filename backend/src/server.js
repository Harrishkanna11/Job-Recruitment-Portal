import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { initDb } from './database/db.js';
import apiRoutes from './routes/index.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// 1. Security Headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// 2. CORS Configuration
const allowedOrigins = [CLIENT_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'];
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, true); // Permissive in dev, can restrict in production
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

// 3. Request Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// 4. Rate Limiting for Auth & Sensitive Endpoints
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes.',
  },
});
app.use('/api', generalLimiter);

// 5. Body Parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 6. Ensure uploads folder exists
const uploadDir = path.resolve('uploads/resumes');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 7. Mount Core API Routes
app.use('/api', apiRoutes);

// 8. Root Welcome Route
app.get('/', (req, res) => {
  res.json({
    name: 'HireHub API Server',
    status: 'online',
    version: '1.0.0',
    documentation: '/api/health',
  });
});

// 9. 404 Route Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `API route ${req.method} ${req.originalUrl} not found.`,
  });
});

// 10. Centralized Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Application Error:', err);

  // Multer file upload errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      message: 'File size exceeds maximum allowed limit (5 MB).',
    });
  }

  if (err.message && err.message.includes('Only PDF files are permitted')) {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  // Prevent exposing sensitive stack traces in production
  const isDev = process.env.NODE_ENV !== 'production';
  return res.status(err.status || 500).json({
    success: false,
    message: isDev ? err.message : 'An unexpected internal server error occurred.',
    ...(isDev && { stack: err.stack }),
  });
});

// 11. Server Bootstrapping
let server = null;

const startServer = async () => {
  try {
    await initDb();
    server = app.listen(PORT, () => {
      console.log(`🚀 HireHub Backend API listening on port ${PORT}`);
      console.log(`📡 Client URL: ${CLIENT_URL}`);
      console.log(`⚡ Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (err) {
    console.error('Failed to initialize server:', err);
    process.exit(1);
  }
};

// Graceful Shutdown
const handleShutdown = () => {
  console.log('\nReceived termination signal. Closing HireHub HTTP server gracefully...');
  if (server) {
    server.close(() => {
      console.log('HTTP server closed cleanly.');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
};

process.on('SIGTERM', handleShutdown);
process.on('SIGINT', handleShutdown);

startServer();

export default app;
