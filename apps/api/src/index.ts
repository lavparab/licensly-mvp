import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import integrationRoutes from './routes/integrations';
import { initCronJobs } from './jobs/sync';
import { initComplianceCronJobs } from './jobs/compliance';

dotenv.config();

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

app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
}));
app.use(helmet());
app.use(express.json());

// Initialize Background Jobs
initCronJobs();
initComplianceCronJobs();

app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'licensly-api' });
});

import aiRoutes from './routes/ai';
import reportsRoutes from './routes/reports';

// API Routes
app.use('/api/integrations', integrationRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/reports', reportsRoutes);

app.listen(port, () => {
    console.log(`API server running on port ${port}`);
});
