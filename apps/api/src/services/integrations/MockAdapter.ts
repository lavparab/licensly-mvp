import { IntegrationAdapter, OAuthCredentials, AuthResult, LicenseData, UserData } from '../../types/integration';

// This is a generic Mock Adapter to simulate bringing in data from other platforms
export class MockAdapter implements IntegrationAdapter {
    platformId: string;

    constructor(platformId: string) {
        this.platformId = platformId;
    }

    getAuthUrl(state: string, redirectUri: string): string {
        return `https://mock.auth.com/authorize?client_id=mock&state=${state}&redirect_uri=${redirectUri}`;
    }

    async authenticate(credentials: OAuthCredentials, redirectUri: string): Promise<AuthResult> {
        // Simulate token exchange
        return {
            accessToken: `mock_access_token_for_${this.platformId}_${Date.now()}`,
            expiresIn: 3600,
        };
    }

    async fetchLicenses(accessToken: string): Promise<LicenseData[]> {
        // Generate some mock license data
        return [
            {
                platform: this.platformId,
                planName: 'Enterprise',
                seatsPurchased: 20,
                seatsUsed: 15,
                costPerSeat: 45.00,
                billingCycle: 'annual',
                renewalDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            },
            {
                platform: this.platformId,
                planName: 'Pro',
                seatsPurchased: 10,
                seatsUsed: 10,
                costPerSeat: 15.00,
                billingCycle: 'monthly',
                renewalDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            }
        ];
    }

    async fetchUsers(accessToken: string): Promise<UserData[]> {
        const users: UserData[] = [];
        // Generate 15 active/idle users
        for (let i = 1; i <= 15; i++) {
            const isIdle = Math.random() > 0.7;
            users.push({
                email: `user${i}@acmecorp.com`,
                status: isIdle ? 'idle' : 'active',
                lastActiveAt: new Date(Date.now() - (isIdle ? 40 : 2) * 24 * 60 * 60 * 1000).toISOString(),
            });
        }
        return users;
    }

    async testConnection(accessToken: string): Promise<boolean> {
        return true;
    }
}
