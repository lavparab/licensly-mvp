"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const dotenv_1 = __importDefault(require("dotenv"));
const Sentry = __importStar(require("@sentry/node"));
const profiling_node_1 = require("@sentry/profiling-node");
// Load env vars before anything else
dotenv_1.default.config();
// Route imports
const integrations_1 = __importDefault(require("./routes/integrations"));
const ai_1 = __importDefault(require("./routes/ai"));
const reports_1 = __importDefault(require("./routes/reports"));
const dashboard_1 = __importDefault(require("./routes/dashboard"));
const licenses_1 = __importDefault(require("./routes/licenses"));
const compliance_1 = __importDefault(require("./routes/compliance"));
const settings_1 = __importDefault(require("./routes/settings"));
const onboarding_1 = __importDefault(require("./routes/onboarding"));
// Middleware imports
const errorHandler_1 = require("./middleware/errorHandler");
const rateLimit_1 = require("./middleware/rateLimit");
// Jobs
const sync_1 = require("./jobs/sync");
const compliance_2 = require("./jobs/compliance");
// Utils
const logger_1 = require("./utils/logger");
// Initialize Sentry
Sentry.init({
    dsn: process.env.SENTRY_DSN || "",
    integrations: [
        (0, profiling_node_1.nodeProfilingIntegration)(),
    ],
    tracesSampleRate: 1.0,
});
const app = (0, express_1.default)();
const port = process.env.PORT || 4000;
// ── Global Middleware ──
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || '*',
    credentials: true,
}));
app.use((0, helmet_1.default)());
app.use(express_1.default.json({ limit: '10mb' }));
app.use(rateLimit_1.defaultLimiter);
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
app.use('/api/dashboard', dashboard_1.default);
app.use('/api/licenses', licenses_1.default);
app.use('/api/integrations', integrations_1.default);
app.use('/api/compliance', compliance_1.default);
app.use('/api/settings', settings_1.default);
app.use('/api/onboarding', onboarding_1.default);
app.use('/api/ai', ai_1.default);
app.use('/api/reports', reports_1.default);
// ── Global Error Handler (must be after routes) ──
app.use(errorHandler_1.errorHandler);
// ── Initialize Background Jobs ──
(0, sync_1.initCronJobs)();
(0, compliance_2.initComplianceCronJobs)();
// ── Start Server ──
app.listen(port, () => {
    logger_1.logger.info(`🚀 API server running on port ${port}`);
    logger_1.logger.info(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
});
exports.default = app;
