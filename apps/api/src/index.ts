import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

// Load env vars before anything else
dotenv.config();

// Route imports
import integrationRoutes from './routes/integrations';
import aiRoutes from './routes/ai';
import reportsRoutes from './routes/reports';
import dashboardRoutes from './routes/dashboard';
import licensesRoutes from './routes/licenses';
import complianceRoutes from './routes/compliance';
import settingsRoutes from './routes/settings';
import onboardingRoutes from './routes/onboarding';

// Middleware imports
import { errorHandler } from './middleware/errorHandler';
import { defaultLimiter } from './middleware/rateLimit';

// Jobs
import { initCronJobs } from './jobs/sync';
import { initComplianceCronJobs } from './jobs/compliance';

// Utils
import { logger } from './utils/logger';

// Initialize Sentry
Sentry.init({
    dsn: process.env.SENTRY_DSN || "",
    integrations: [
        nodeProfilingIntegration(),
    ],
    tracesSampleRate: 1.0,
});

const app = express();
const port = process.env.PORT || 4000;

// ── Global Middleware ──
app.use(cors({
    origin: process.env.FRONTEND_URL || '*',
    credentials: true,
}));
app.use(helmet());
app.use(express.json({ limit: '10mb' }));
app.use(defaultLimiter);

// ── Health Check ──
app.get('/health', (_req, res) => {
    res.json({
        status: 'ok',
        service: 'licensly-api',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
    });
});

// ── API Routes ──
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/licenses', licensesRoutes);
app.use('/api/integrations', integrationRoutes);
app.use('/api/compliance', complianceRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/onboarding', onboardingRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/reports', reportsRoutes);

// ── Global Error Handler (must be after routes) ──
app.use(errorHandler);

// ── Initialize Background Jobs ──
initCronJobs();
initComplianceCronJobs();

// ── Start Server ──
app.listen(port, () => {
    logger.info(`🚀 API server running on port ${port}`);
    logger.info(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
