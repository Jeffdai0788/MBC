export interface TraderStats {
    totalPnL: number;
    winRate: number;
    strategiesHeld: number;
    capitalDeployed: number;
    bestStrategy: { id: string; return: number } | null;
    tradingSince: string;
    ranking: number;
}

export interface DeveloperStats {
    strategiesCreated: number;
    totalSubscribers: number;
    totalRevenue: number;
    avgPerformance: number;
    developingSince: string;
    ranking: number;
}

export interface UserProfile {
    walletAddress: string;
    username: string | null;
    bio: string | null;
    avatarUrl: string | null;
    joinedDate: string;
    privacySetting: string;
    followersCount: number;
    followingCount: number;
}

export class MockProfileService {
    // Generate deterministic mock data based on address
    getProfile(address: string): UserProfile {
        const hash = this.hashString(address);

        return {
            walletAddress: address,
            username: `Trader_${address.slice(0, 4)}`,
            bio: "Building automated strategies for Polymarket. Crypto native since 2020.",
            avatarUrl: `https://api.dicebear.com/7.x/identicon/svg?seed=${address}`,
            joinedDate: new Date(Date.now() - (hash % 1000) * 86400000).toISOString(),
            privacySetting: 'public',
            followersCount: 10 + (hash % 500),
            followingCount: 5 + (hash % 50)
        };
    }

    getTraderStats(address: string): TraderStats {
        const hash = this.hashString(address);

        return {
            totalPnL: 500 + (hash % 5000),
            winRate: 45 + (hash % 40),
            strategiesHeld: 1 + (hash % 5),
            capitalDeployed: 1000 + (hash % 10000),
            bestStrategy: { id: "mock_strategy", return: 10 + (hash % 90) },
            tradingSince: new Date(Date.now() - (hash % 500) * 86400000).toISOString(),
            ranking: 1 + (hash % 100)
        };
    }

    getDeveloperStats(address: string): DeveloperStats {
        const hash = this.hashString(address);

        return {
            strategiesCreated: 1 + (hash % 3),
            totalSubscribers: 5 + (hash % 100),
            totalRevenue: 50 + (hash % 5000),
            avgPerformance: 5 + (hash % 20),
            developingSince: new Date(Date.now() - (hash % 500) * 86400000).toISOString(),
            ranking: 1 + (hash % 100)
        };
    }

    getActivityFeed(address: string, limit: number = 20): any[] {
        return [
            {
                id: "1",
                type: "STRATEGY_CREATE",
                data: { name: "Momentum Alpha" },
                timestamp: new Date().toISOString()
            },
            {
                id: "2",
                type: "TRADE",
                data: { market: "Polymarket", side: "BUY" },
                timestamp: new Date(Date.now() - 86400000).toISOString()
            }
        ];
    }

    async updateProfile(address: string, data: Partial<UserProfile>): Promise<boolean> {
        // In a real app we would save to DB. 
        // For serverless demo, we just return success.
        console.log(`[Mock] Updated profile for ${address}`, data);
        return true;
    }

    private hashString(str: string): number {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return Math.abs(hash);
    }
}

export const profileService = new MockProfileService();
