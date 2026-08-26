export type Role = 'owner' | 'kasir';

export type User = {
    id: number;
    name: string;
    email: string;
    avatar?: string;
    email_verified_at: string | null;
    two_factor_confirmed_at?: string | null;
    role: Role;
    role_label?: string;
    [key: string]: unknown;
};

export type Auth = {
    user: User | null;
};

/** Shop identity shared with every page. */
export type Brand = {
    name: string;
    tagline: string;
    logo: string | null;
};

/** Session policy shared with every page — drives the keep-alive heartbeat. */
export type SessionInfo = {
    lifetimeMinutes: number;
    keepAlive: boolean;
    neverExpires: boolean;
};

export type TwoFactorSetupData = {
    svg: string;
    url: string;
};

export type TwoFactorSecretKey = {
    secretKey: string;
};
