import { IntegrationAdapter } from '../../types/integration';
import { MockAdapter } from './MockAdapter';

export class IntegrationManager {
    private adapters: Map<string, IntegrationAdapter> = new Map();

    constructor() {
        // Initialize adapters
        // In a real scenario, these would be specific classes (SlackAdapter, GithubAdapter, etc.)
        // For the MVP MVP demo, using MockAdapters simulates data pipelines.
        this.registerAdapter(new MockAdapter('Slack'));
        this.registerAdapter(new MockAdapter('Microsoft Teams'));
        this.registerAdapter(new MockAdapter('Google Workspace'));
        this.registerAdapter(new MockAdapter('Microsoft 365'));
        this.registerAdapter(new MockAdapter('Adobe Creative Cloud'));
        this.registerAdapter(new MockAdapter('Zoom'));
        this.registerAdapter(new MockAdapter('GitHub'));
        this.registerAdapter(new MockAdapter('Dropbox'));
    }

    private registerAdapter(adapter: IntegrationAdapter) {
        this.adapters.set(adapter.platformId.toLowerCase().replace(/\s+/g, '-'), adapter);
    }

    getAdapter(platformId: string): IntegrationAdapter {
        const key = platformId.toLowerCase().replace(/\s+/g, '-');
        const adapter = this.adapters.get(key);

        // Fallback to exactly string match if formatted differently
        if (!adapter) {
            for (const val of this.adapters.values()) {
                if (val.platformId === platformId) return val;
            }
            throw new Error(`Integration adapter for platform '${platformId}' not found.`);
        }
        return adapter;
    }

    listAvailablePlatforms(): string[] {
        return Array.from(this.adapters.values()).map(a => a.platformId);
    }
}

export const integrationManager = new IntegrationManager();
