"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const axios_1 = __importDefault(require("axios"));
const router = (0, express_1.Router)();
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';
// Trigger full AI organization analysis
router.post('/analyze', auth_1.requireAuth, async (req, res) => {
    try {
        const orgId = req.orgId;
        // Call the Python FastAPI microservice
        const response = await axios_1.default.post(`${AI_SERVICE_URL}/api/ai/analyze/${orgId}`);
        res.json({ success: true, ...response.data });
    }
    catch (error) {
        console.error('AI Analysis trigger failed:', error.message);
        res.status(500).json({ error: 'Failed to trigger AI optimization analysis' });
    }
});
// Fetch active recommendations
router.get('/recommendations', auth_1.requireAuth, async (req, res) => {
    try {
        const orgId = req.orgId;
        const response = await axios_1.default.get(`${AI_SERVICE_URL}/api/ai/recommendations/${orgId}`);
        res.json(response.data);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch recommendations' });
    }
});
// Fetch total projected savings
router.get('/savings', auth_1.requireAuth, async (req, res) => {
    try {
        const orgId = req.orgId;
        const response = await axios_1.default.get(`${AI_SERVICE_URL}/api/ai/savings-estimate/${orgId}`);
        res.json(response.data);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch savings estimate' });
    }
});
exports.default = router;
