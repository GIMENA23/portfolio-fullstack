import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { originMatcher } from './config/cors.js';
import { env } from './config/env.js';
import { errorHandler, notFound } from './middlewares/errorHandler.js';
import { limit } from './middlewares/rateLimit.js';
import adminRoutes from './routes/admin.js';
import authRoutes from './routes/auth.js';
import inquiryRoutes from './routes/inquiries.js';
import profileRoutes from './routes/profile.js';
import projectRoutes from './routes/projects.js';
import serviceRoutes from './routes/services.js';
import statsRoutes from './routes/stats.js';
import uploadRoutes from './routes/uploads.js';
import userRoutes from './routes/users.js';
import visitRoutes from './routes/visits.js';
import { ok } from './utils/respond.js';

export function createApp() {
  const app = express();
  const isAllowedOrigin = originMatcher(env.clientUrls);

  app.set('trust proxy', env.trustProxy); // Render pasa por un proxy; sin esto todas las IP serían la misma
  app.use(helmet());
  app.use(
    cors({
      // Sin Origin (curl, el monitor de uptime, el servidor mismo) no hay nada que bloquear: CORS es cosa del navegador.
      origin: (origin, callback) => callback(null, !origin || isAllowedOrigin(origin)),
      allowedHeaders: ['Content-Type', 'Authorization'],
      maxAge: 600, // el navegador recuerda el permiso 10 minutos y no repite el pedido previo (preflight)
    }),
  );
  // Las respuestas de la API son de cada persona (sesión, consultas, datos de admin): ninguna caché, ni la del
  // navegador ni la de un intermediario, tiene que guardarlas.
  app.use('/api', (_req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
  });
  // Tope general por IP, después de CORS para que el 429 también lo pueda leer el navegador.
  app.use('/api', limit({ windowMs: 60 * 1000, max: 300, message: 'Demasiados pedidos seguidos. Esperá un minuto.' }));
  app.use(express.json({ limit: '100kb' }));

  app.get('/api/health', (_req, res) => ok(res, { status: 'up' }));
  app.use('/api/auth', authRoutes);
  app.use('/api/profile', profileRoutes);
  app.use('/api/projects', projectRoutes);
  app.use('/api/services', serviceRoutes);
  app.use('/api/inquiries', inquiryRoutes);
  app.use('/api/uploads', uploadRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/visits', visitRoutes);
  app.use('/api/stats', statsRoutes);
  app.use('/api/admin', adminRoutes);

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
