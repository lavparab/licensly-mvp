export interface LicenseData {
    platform: string;
    planName: string;
    seatsPurchased: number;
    seatsUsed: number;
    costPerSeat: number;
    billingCycle: 'monthly' | 'annual';
    renewalDate: string;
}

export interface UserData {
    email: string;
    name?: string;
    role?: string;
    status: 'active' | 'idle' | 'unused';
    lastActiveAt?: string;
}

export interface AuthResult {
    accessToken: string;
    refreshToken?: string;
    expiresIn?: number;
    metadata?: any;
}

export interface OAuthCredentials {
    code?: string;
    state?: string;
    [key: string]: any;
}

export interface IntegrationAdapter {
    platformId: string;

    // Auth flows
    getAuthUrl(state: string, redirectUri: string): string;
    authenticate(credentials: OAuthCredentials, redirectUri: string): Promise<AuthResult>;

    // Data sync
    fetchLicenses(accessToken: string): Promise<LicenseData[]>;
    fetchUsers(accessToken: string): Promise<UserData[]>;
    testConnection(accessToken: string): Promise<boolean>;
}
