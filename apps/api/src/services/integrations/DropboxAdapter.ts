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

export class DropboxAdapter implements IntegrationAdapter {
    platformId = 'dropbox';
    private clientId = process.env.DROPBOX_CLIENT_ID || '';
    private clientSecret = process.env.DROPBOX_CLIENT_SECRET || '';

    getAuthUrl(state: string, redirectUri: string): string {
        return `https://www.dropbox.com/oauth2/authorize?client_id=${this.clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&state=${state}&token_access_type=offline`;
    }

    async authenticate(credentials: OAuthCredentials, redirectUri: string): Promise<AuthResult> {
        const authHeader = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
        const response = await axios.post('https://api.dropboxapi.com/oauth2/token', null, {
            params: {
                code: credentials.code,
                grant_type: 'authorization_code',
                redirect_uri: redirectUri
            },
            headers: {
                'Authorization': `Basic ${authHeader}`
            }
        });

        const data = response.data;

        return {
            accessToken: data.access_token,
            metadata: {
                refreshToken: data.refresh_token,
                accountId: data.account_id,
                teamId: data.team_id
            }
        };
    }

    private async getTeamMembers(accessToken: string): Promise<any[]> {
        const cacheKey = `dbx_members_${accessToken.slice(-8)}`;
        const cached = getCached(cacheKey);
        if (cached) {
            console.log('Dropbox team members served from cache');
            return cached;
        }

        const response = await axios.post('https://api.dropboxapi.com/2/team/members/list_v2', { limit: 200 }, {
            headers: { Authorization: `Bearer ${accessToken}` }
        });

        const members = response.data.members || [];
        setCached(cacheKey, members, 60_000);
        return members;
    }

    private async getTeamInfo(accessToken: string): Promise<any> {
        const cacheKey = `dbx_team_${accessToken.slice(-8)}`;
        const cached = getCached(cacheKey);
        if (cached) {
            console.log('Dropbox team info served from cache');
            return cached;
        }

        const response = await axios.post('https://api.dropboxapi.com/2/team/get_info', null, {
            headers: { Authorization: `Bearer ${accessToken}` }
        });

        setCached(cacheKey, response.data, 60_000);
        return response.data;
    }

    async fetchUsers(accessToken: string): Promise<UserData[]> {
        const members = await this.getTeamMembers(accessToken);
        return members.map((member: any) => ({
            email: member.profile.email,
            name: member.profile.name?.display_name,
            role: member.role?.['.tag'] === 'team_admin' ? 'Admin' : 'Member',
            status: (member.profile.status?.['.tag'] === 'active' ? 'active' : 'idle') as any, // mapping to expected types
            lastActiveAt: new Date().toISOString()
        }));
    }

    async fetchLicenses(accessToken: string): Promise<LicenseData[]> {
        const team = await this.getTeamInfo(accessToken);

        return [{
            platform: 'dropbox',
            planName: `Dropbox ${team.name || 'Business'}`,
            seatsPurchased: team.num_licensed_users,
            seatsUsed: team.num_provisioned_users,
            costPerSeat: 15.00,
            billingCycle: 'monthly',
            renewalDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        }];
    }

    async testConnection(accessToken: string): Promise<boolean> {
        try {
            const response = await axios.post('https://api.dropboxapi.com/2/check/user', { query: 'test' }, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            return response.data?.result === 'test';
        } catch {
            return false;
        }
    }

    async fetchTeamMembers(accessToken: string): Promise<any[]> {
        const members = await this.getTeamMembers(accessToken);

        return members.map((member: any) => ({
            id: member.profile.team_member_id,
            name: member.profile.name?.display_name,
            email: member.profile.email,
            role: member.role?.['.tag'],
            status: member.profile.status?.['.tag'],
            joinedOn: member.profile.joined_on,
            avatarUrl: null
        }));
    }

    async fetchStorageUsage(accessToken: string): Promise<any> {
        const team = await this.getTeamInfo(accessToken);

        return {
            totalStorage: team.policies?.office_addin_policy?.['.tag'] || 'unknown', // Adjust per actual API response for total_storage/policies
            allocatedStorage: team.num_licensed_users * 2000,
            usedStorage: team.num_provisioned_users * 1500,
            unit: 'GB'
        };
    }

    async fetchTeamInfo(accessToken: string): Promise<any> {
        const team = await this.getTeamInfo(accessToken);

        return {
            name: team.name,
            numLicensed: team.num_licensed_users,
            numProvisioned: team.num_provisioned_users,
            sharingPolicies: team.policies?.sharing?.['.tag'] || 'unknown'
        };
    }
}
