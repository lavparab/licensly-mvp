"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.integrationManager = exports.IntegrationManager = void 0;
const MockAdapter_1 = require("./MockAdapter");
class IntegrationManager {
    adapters = new Map();
    constructor() {
        // Initialize adapters
        // In a real scenario, these would be specific classes (SlackAdapter, GithubAdapter, etc.)
        // For the MVP MVP demo, using MockAdapters simulates data pipelines.
        this.registerAdapter(new MockAdapter_1.MockAdapter('Slack'));
        this.registerAdapter(new MockAdapter_1.MockAdapter('Microsoft Teams'));
        this.registerAdapter(new MockAdapter_1.MockAdapter('Google Workspace'));
        this.registerAdapter(new MockAdapter_1.MockAdapter('Microsoft 365'));
        this.registerAdapter(new MockAdapter_1.MockAdapter('Adobe Creative Cloud'));
        this.registerAdapter(new MockAdapter_1.MockAdapter('Zoom'));
        this.registerAdapter(new MockAdapter_1.MockAdapter('GitHub'));
        this.registerAdapter(new MockAdapter_1.MockAdapter('Dropbox'));
    }
    registerAdapter(adapter) {
        this.adapters.set(adapter.platformId.toLowerCase().replace(/\s+/g, '-'), adapter);
    }
    getAdapter(platformId) {
        const key = platformId.toLowerCase().replace(/\s+/g, '-');
        const adapter = this.adapters.get(key);
        // Fallback to exactly string match if formatted differently
        if (!adapter) {
            for (const val of this.adapters.values()) {
                if (val.platformId === platformId)
                    return val;
            }
            throw new Error(`Integration adapter for platform '${platformId}' not found.`);
        }
        return adapter;
    }
    listAvailablePlatforms() {
        return Array.from(this.adapters.values()).map(a => a.platformId);
    }
}
exports.IntegrationManager = IntegrationManager;
exports.integrationManager = new IntegrationManager();
