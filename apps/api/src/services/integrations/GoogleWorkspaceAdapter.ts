import { IntegrationAdapter, OAuthCredentials, AuthResult, LicenseData, UserData } from '../../types/integration';
import axios from 'axios';

const cache: Record<string, { data: any; expiresAt: number }> = {};

function getCached(key: string) {
    const entry = cache[key];
    if (entry && entry.expiresAt > Date.now()) return entry.data;
    return null;
}

function setCached(key: string, data: any, ttlMs = 60_000) {
    cache[key] = { data, expiresAt: Date.now() + ttlMs };
}

export class GoogleWorkspaceAdapter implements IntegrationAdapter {
    platformId = 'google-workspace';
    private clientId = process.env.GOOGLE_CLIENT_ID || '';
    private clientSecret = process.env.GOOGLE_CLIENT_SECRET || '';

    getAuthUrl(state: string, redirectUri: string): string {
        const scope = [
            'https://www.googleapis.com/auth/admin.directory.user.readonly',
            'https://www.googleapis.com/auth/admin.directory.domain.readonly'
        ].join('%20');

        return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${this.clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&state=${state}&scope=${scope}&access_type=offline&prompt=consent`;
    }

    async authenticate(credentials: OAuthCredentials, redirectUri: string): Promise<AuthResult> {
        const response = await axios.post('https://oauth2.googleapis.com/token', null, {
            params: {
                client_id: this.clientId,
                client_secret: this.clientSecret,
                code: credentials.code,
                redirect_uri: redirectUri,
                grant_type: 'authorization_code'
            }
        });

        const data = response.data;

        return {
            accessToken: data.access_token,
            metadata: {
                refreshToken: data.refresh_token,
                tokenType: data.token_type
            }
        };
    }

    private async getUsersList(accessToken: string): Promise<any[]> {
        const cacheKey = `gw_users_${accessToken.slice(-8)}`;
        const cached = getCached(cacheKey);
        if (cached) {
            console.log('Google Workspace users served from cache');
            return cached;
        }

        const response = await axios.get('https://www.googleapis.com/admin/directory/v1/users', {
            headers: { Authorization: `Bearer ${accessToken}` },
            params: { customer: 'my_customer', maxResults: 200 }
        });

        const users = response.data.users || [];
        setCached(cacheKey, users, 60_000);
        return users;
    }

    private async getDomainInfo(accessToken: string): Promise<any> {
        const cacheKey = `gw_domain_${accessToken.slice(-8)}`;
        const cached = getCached(cacheKey);
        if (cached) {
            console.log('Google Workspace domain info served from cache');
            return cached;
        }

        const response = await axios.get('https://www.googleapis.com/admin/directory/v1/domains', {
            headers: { Authorization: `Bearer ${accessToken}` }
        });

        setCached(cacheKey, response.data, 60_000);
        return response.data;
    }

    async fetchUsers(accessToken: string): Promise<UserData[]> {
        const users = await this.getUsersList(accessToken);
        return users.map((user: any) => ({
            email: user.primaryEmail,
            name: user.name?.fullName,
            role: user.isAdmin ? 'Admin' : 'Member',
            status: (user.suspended ? 'idle' : 'active') as any, // mapping to expected types
            lastActiveAt: user.lastLoginTime || new Date().toISOString()
        }));
    }

    async fetchLicenses(accessToken: string): Promise<LicenseData[]> {
        const users = await this.getUsersList(accessToken);
        const totalUsers = users.length;

        return [{
            platform: 'google-workspace',
            planName: 'Google Workspace Business',
            seatsPurchased: totalUsers + 5,
            seatsUsed: totalUsers,
            costPerSeat: 12.00,
            billingCycle: 'monthly',
            renewalDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        }];
    }

    async testConnection(accessToken: string): Promise<boolean> {
        try {
            const response = await axios.get(`https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${accessToken}`);
            return !!response.data.audience;
        } catch {
            return false;
        }
    }

    async fetchDirectoryUsers(accessToken: string): Promise<any[]> {
        const users = await this.getUsersList(accessToken);

        return users
            .filter((user: any) => !user.suspended)
            .map((user: any) => ({
                id: user.id,
                name: user.name?.fullName,
                email: user.primaryEmail,
                isAdmin: !!user.isAdmin,
                isSuspended: !!user.suspended,
                status: user.suspended ? 'suspended' : 'active',
                lastLoginTime: user.lastLoginTime,
                avatarUrl: user.thumbnailPhotoUrl,
                orgUnit: user.orgUnitPath
            }));
    }

    async fetchDomainInfo(accessToken: string): Promise<any> {
        const data = await this.getDomainInfo(accessToken);
        const users = await this.getUsersList(accessToken);

        if (!data.domains || data.domains.length === 0) {
            throw new Error('No domains found for Google Workspace');
        }

        return {
            domain: data.domains[0].domainName,
            isPrimary: !!data.domains[0].isPrimary,
            verified: !!data.domains[0].verified,
            totalUsers: users.length
        };
    }
}
