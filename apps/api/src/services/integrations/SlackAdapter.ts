import { IntegrationAdapter, OAuthCredentials, AuthResult, LicenseData, UserData } from '../../types/integration';
import axios from 'axios';

// Simple in-memory cache to avoid hitting Slack rate limits
const cache: Record<string, { data: any; expiresAt: number }> = {};

function getCached(key: string) {
    const entry = cache[key];
    if (entry && entry.expiresAt > Date.now()) return entry.data;
    return null;
}

function setCached(key: string, data: any, ttlMs = 60_000) {
    cache[key] = { data, expiresAt: Date.now() + ttlMs };
}

export class SlackAdapter implements IntegrationAdapter {
    platformId = 'slack';
    private clientId = process.env.SLACK_CLIENT_ID || '';
    private clientSecret = process.env.SLACK_CLIENT_SECRET || '';

    getAuthUrl(state: string, redirectUri: string): string {
        return `https://slack.com/oauth/v2/authorize?client_id=${this.clientId}&redirect_uri=${redirectUri}&state=${state}&scope=users:read,users:read.email,team:read`;
    }

    async authenticate(credentials: OAuthCredentials, redirectUri: string): Promise<AuthResult> {
        const response = await axios.post('https://slack.com/api/oauth.v2.access', null, {
            params: {
                client_id: this.clientId,
                client_secret: this.clientSecret,
                code: credentials.code,
                redirect_uri: redirectUri
            }
        });

        const data = response.data;
        if (!data.ok) throw new Error(data.error || 'Slack authentication failed');

        return {
            accessToken: data.access_token,
            metadata: {
                teamId: data.team.id,
                teamName: data.team.name,
                botToken: data.access_token
            }
        };
    }

    // Private method — fetches users.list once and caches for 60 seconds
    private async getUsersList(accessToken: string): Promise<any[]> {
        const cacheKey = `slack_users_${accessToken.slice(-8)}`;
        const cached = getCached(cacheKey);
        if (cached) {
            console.log('Slack users served from cache');
            return cached;
        }

        const response = await axios.get('https://slack.com/api/users.list', {
            headers: { Authorization: `Bearer ${accessToken}` },
            params: { limit: 200 }
        });

        if (!response.data.ok) throw new Error(response.data.error || 'Failed to fetch Slack users');

        setCached(cacheKey, response.data.members, 60_000); // cache for 60 seconds
        return response.data.members;
    }

    // Private method — fetches team.info once and caches for 60 seconds
    private async getTeamInfo(accessToken: string): Promise<any> {
        const cacheKey = `slack_team_${accessToken.slice(-8)}`;
        const cached = getCached(cacheKey);
        if (cached) {
            console.log('Slack team info served from cache');
            return cached;
        }

        const response = await axios.get('https://slack.com/api/team.info', {
            headers: { Authorization: `Bearer ${accessToken}` }
        });

        if (!response.data.ok) throw new Error(response.data.error || 'Failed to fetch team info');

        setCached(cacheKey, response.data.team, 60_000);
        return response.data.team;
    }

    async fetchUsers(accessToken: string): Promise<UserData[]> {
        const members = await this.getUsersList(accessToken);
        return members
            .filter((m: any) => !m.is_bot && m.id !== 'USLACKBOT')
            .map((member: any) => ({
                email: member.profile?.email || `${member.name}@slack.local`,
                name: member.profile?.real_name || member.name,
                role: member.is_admin ? 'Admin' : 'Member',
                status: (member.deleted ? 'idle' : 'active') as any,
                lastActiveAt: new Date().toISOString()
            }));
    }

    async fetchLicenses(accessToken: string): Promise<LicenseData[]> {
        const team = await this.getTeamInfo(accessToken);
        const members = await this.getUsersList(accessToken);
        const totalMembers = members.filter(
            (m: any) => !m.is_bot && !m.deleted && m.id !== 'USLACKBOT'
        ).length;

        return [{
            platform: 'slack',
            planName: `Slack ${team.plan || 'Pro'}`,
            seatsPurchased: totalMembers + 5,
            seatsUsed: totalMembers,
            costPerSeat: 7.25,
            billingCycle: 'monthly',
            renewalDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        }];
    }

    async testConnection(accessToken: string): Promise<boolean> {
        try {
            const response = await axios.post('https://slack.com/api/auth.test', null, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            return !!response.data.ok;
        } catch {
            return false;
        }
    }

    async fetchWorkspaceMembers(accessToken: string): Promise<any[]> {
        const members = await this.getUsersList(accessToken);
        return members
            .filter((m: any) => !m.is_bot && !m.deleted && m.id !== 'USLACKBOT')
            .map((m: any) => ({
                id: m.id,
                name: m.name,
                realName: m.profile?.real_name || m.name,
                email: m.profile?.email,
                isAdmin: !!m.is_admin,
                isOwner: !!m.is_owner,
                status: 'active',
                lastActiveAt: new Date().toISOString(),
                avatarUrl: m.profile?.image_72
            }));
    }

    async fetchWorkspaceInfo(accessToken: string): Promise<any> {
        const team = await this.getTeamInfo(accessToken);
        return {
            id: team.id,
            name: team.name,
            plan: team.plan || 'free',
            domain: team.domain
        };
    }
}