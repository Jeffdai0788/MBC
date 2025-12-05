import { getDatabase } from './db';

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

export class ProfileService {
    async getProfile(address: string): Promise<UserProfile | null> {
        const db = await getDatabase();

        const profile = await db.get(
            `SELECT * FROM user_profiles WHERE wallet_address = ?`,
            [address]
        );

        if (!profile) {
            // Auto-create profile for any wallet address
            const now = new Date().toISOString();

            await db.run(
                `INSERT INTO user_profiles (wallet_address, joined_date) VALUES (?, ?)`,
                [address, now]
            );

            return {
                walletAddress: address,
                username: null,
                bio: null,
                avatarUrl: null,
                joinedDate: now,
                privacySetting: 'public',
                followersCount: 0,
                followingCount: 0
            };
        }

        // Get follower/following counts
        const followersCount = await db.get(
            `SELECT COUNT(*) as count FROM social_connections WHERE following_address = ?`,
            [address]
        );
        const followingCount = await db.get(
            `SELECT COUNT(*) as count FROM social_connections WHERE follower_address = ?`,
            [address]
        );

        return {
            walletAddress: profile.wallet_address,
            username: profile.username,
            bio: profile.bio,
            avatarUrl: profile.avatar_url,
            joinedDate: profile.joined_date,
            privacySetting: profile.privacy_setting,
            followersCount: followersCount.count,
            followingCount: followingCount.count
        };
    }

    async getTraderStats(address: string): Promise<TraderStats> {
        const db = await getDatabase();

        // Get total P/L
        const pnlResult = await db.get(
            `SELECT SUM(pnl) as total FROM trades WHERE user_address = ?`,
            [address]
        );
        const totalPnL = pnlResult?.total || 0;

        // Get win rate
        const winCount = await db.get(
            `SELECT COUNT(*) as count FROM trades WHERE user_address = ? AND pnl > 0`,
            [address]
        );
        const totalTrades = await db.get(
            `SELECT COUNT(*) as count FROM trades WHERE user_address = ?`,
            [address]
        );
        const winRate = totalTrades.count > 0 ? (winCount.count / totalTrades.count) * 100 : 0;

        // Get strategies held
        const strategiesHeld = await db.get(
            `SELECT COUNT(*) as count FROM user_strategies WHERE user_address = ? AND status = 'active'`,
            [address]
        );

        // Get capital deployed
        const capitalResult = await db.get(
            `SELECT SUM(capital_allocated) as total FROM user_strategies WHERE user_address = ? AND status = 'active'`,
            [address]
        );
        const capitalDeployed = capitalResult?.total || 0;

        // Get best strategy
        const bestStrategy = await db.get(
            `SELECT strategy_id, SUM(pnl) as total_return 
             FROM trades 
             WHERE user_address = ? 
             GROUP BY strategy_id 
             ORDER BY total_return DESC 
             LIMIT 1`,
            [address]
        );

        // Get trading since date
        const firstTrade = await db.get(
            `SELECT MIN(timestamp) as first FROM trades WHERE user_address = ?`,
            [address]
        );

        // TODO: Calculate ranking (requires comparing with all traders)
        const ranking = 0;

        return {
            totalPnL,
            winRate,
            strategiesHeld: strategiesHeld.count,
            capitalDeployed,
            bestStrategy: bestStrategy ? { id: bestStrategy.strategy_id, return: bestStrategy.total_return } : null,
            tradingSince: firstTrade?.first || new Date().toISOString(),
            ranking
        };
    }

    async getDeveloperStats(address: string): Promise<DeveloperStats> {
        const db = await getDatabase();

        // Get strategies created (from on-chain data via solanaClient)
        // For now, we'll just count from user_strategies where this person is the creator
        // This requires joining with strategy table which has creator info

        // Temporary: Just count distinct strategies
        const strategiesCreated = 5; // TODO: Query from blockchain

        // Get total subscribers
        const subscriberResult = await db.get(
            `SELECT COUNT(DISTINCT user_address) as count 
             FROM user_strategies 
             WHERE strategy_id IN (
                 SELECT strategy_id FROM user_strategies WHERE user_address = ?
             )`,
            [address]
        );
        const totalSubscribers = subscriberResult?.count || 0;

        // TODO: Calculate revenue from listPrice * subscriber count
        const totalRevenue = totalSubscribers * 10; // Mock: $10 per subscriber

        // TODO: Calculate avg performance across all strategies
        const avgPerformance = 15.5; // Mock

        // Get developing since date
        const developingSince = new Date().toISOString(); // TODO: Get from first strategy creation

        // TODO: Calculate ranking
        const ranking = 0;

        return {
            strategiesCreated,
            totalSubscribers,
            totalRevenue,
            avgPerformance,
            developingSince,
            ranking
        };
    }

    async getActivityFeed(address: string, limit: number = 20): Promise<any[]> {
        const db = await getDatabase();

        const events = await db.all(
            `SELECT * FROM activity_events 
             WHERE user_address = ? 
             ORDER BY timestamp DESC 
             LIMIT ?`,
            [address, limit]
        );

        return events.map(event => ({
            id: event.id,
            type: event.event_type,
            data: JSON.parse(event.event_data || '{}'),
            timestamp: event.timestamp
        }));
    }

    async getFollowers(address: string): Promise<string[]> {
        const db = await getDatabase();
        const followers = await db.all(
            `SELECT follower_address FROM social_connections WHERE following_address = ?`,
            [address]
        );
        return followers.map(f => f.follower_address);
    }

    async getFollowing(address: string): Promise<string[]> {
        const db = await getDatabase();
        const following = await db.all(
            `SELECT following_address FROM social_connections WHERE follower_address = ?`,
            [address]
        );
        return following.map(f => f.following_address);
    }

    async isFollowing(follower: string, following: string): Promise<boolean> {
        const db = await getDatabase();
        const result = await db.get(
            `SELECT 1 FROM social_connections WHERE follower_address = ? AND following_address = ?`,
            [follower, following]
        );
        return !!result;
    }
}

export const profileService = new ProfileService();
