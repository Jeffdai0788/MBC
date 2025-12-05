import express from "express";
import cors from "cors";
import { SolanaClient } from "./solanaClient";
import { StrategyEngine } from "./engine";
import { polymarketClient } from "./polymarketClient";
import { ipfsClient } from "./ipfsClient";
import { strategyExecutor } from "./strategyExecutor";
import * as nacl from "tweetnacl";
import { PublicKey } from "@solana/web3.js";
import bs58 from "bs58";
import { randomUUID } from "crypto";

const app = express();
app.use(express.json({ limit: "1mb" })); // Allow larger payloads for code
app.use(cors());

const PORT = process.env.PORT || 3000;

const solanaClient = new SolanaClient();
const engine = new StrategyEngine();

// Middleware to verify signature
const verifySignature = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const { publicKey, signature, timestamp } = req.body;

    if (!publicKey || !signature || !timestamp) {
        return res.status(400).json({ error: "Missing publicKey, signature, or timestamp" });
    }

    const now = Date.now();
    if (Math.abs(now - timestamp) > 5 * 60 * 1000) {
        return res.status(401).json({ error: "Timestamp expired" });
    }

    try {
        const message = `Login to Strategy Marketplace: ${timestamp}`;
        const messageBytes = new TextEncoder().encode(message);
        const signatureBytes = bs58.decode(signature);
        const publicKeyBytes = new PublicKey(publicKey).toBytes();

        const verified = nacl.sign.detached.verify(messageBytes, signatureBytes, publicKeyBytes);

        if (!verified) {
            return res.status(401).json({ error: "Invalid signature" });
        }

        next();
    } catch (e) {
        console.error("Signature verification failed:", e);
        return res.status(401).json({ error: "Signature verification failed" });
    }
};

// ==================== SOLANA STRATEGY ENDPOINTS ====================

app.get("/api/strategies", async (req, res) => {
    try {
        // 1. Fetch on-chain strategies
        // const onChainStrategies = await solanaClient.getAllStrategies();
        const onChainStrategies: any[] = []; // Disabled for demo to clear exchange

        // 2. Fetch local DB strategies
        const db = await getDatabase();
        const dbStrategies = await db.all("SELECT * FROM created_strategies");

        // 3. Map DB strategies to StrategyData interface
        const localStrategies = dbStrategies.map(s => ({
            publicKey: s.id, // Use UUID as pseudo-pubkey
            strategyId: s.id,
            apiId: s.name,
            creator: s.creator_address,
            strategyMint: "", // No mint yet
            paymentMint: "",
            listed: s.status === 'listed',
            listPrice: s.list_price * 1_000_000, // Convert to units if needed, but StrategyData uses number. Assuming USDC units? solanaClient divides by 1M for display. So here we should probably store as raw units or handle consistently. Let's assume DB stores raw units or we convert.
            // Wait, solanaClient.getMarketplaceStats divides by 1_000_000. So listPrice in StrategyData is likely in atomic units (6 decimals).
            // If user enters 50 USDC, we should store 50 * 1M.
            // Let's assume DB stores in MAJOR units (USDC) for readability, so we multiply by 1M here.
            seller: s.creator_address,
            lastMidBps: 0,
            lastUpdateTs: Math.floor(new Date(s.created_at).getTime() / 1000),
            // Extra fields for frontend to identify
            isLocal: true,
            category: s.category,
            description: s.description,
            status: s.status
        }));

        // 4. Merge (prefer on-chain if collision, though IDs shouldn't collide)
        // Actually, we might want to show BOTH if they are different stages.
        // But for now, just concat.
        res.json([...onChainStrategies, ...localStrategies]);
    } catch (e) {
        console.error("Error fetching strategies:", e);
        res.status(500).json({ error: "Failed to fetch strategies" });
    }
});

app.get("/api/strategies/:pubkey", async (req, res) => {
    try {
        const { pubkey } = req.params;
        const strategy = await solanaClient.getStrategy(pubkey);
        if (!strategy) {
            return res.status(404).json({ error: "Strategy not found" });
        }
        res.json(strategy);
    } catch (e) {
        console.error("Error fetching strategy:", e);
        res.status(500).json({ error: "Failed to fetch strategy" });
    }
});

app.get("/api/stats", async (req, res) => {
    try {
        const stats = await solanaClient.getMarketplaceStats();
        res.json(stats);
    } catch (e) {
        console.error("Error fetching stats:", e);
        res.status(500).json({ error: "Failed to fetch stats" });
    }
});

app.get("/api/nft-balance/:wallet/:mint", async (req, res) => {
    try {
        const { wallet, mint } = req.params;
        const balance = await solanaClient.checkNftBalance(wallet, mint);
        res.json({ balance, hasAccess: balance > 0 });
    } catch (e) {
        console.error("Error checking NFT balance:", e);
        res.status(500).json({ error: "Failed to check NFT balance" });
    }
});

app.get("/api/signal-status", (req, res) => {
    const signal = engine.getSignal();
    res.json({
        signal: signal.signal,
        lastUpdate: signal.lastUpdate,
    });
});

app.post("/signal", verifySignature, async (req, res) => {
    const { publicKey } = req.body;

    try {
        const hasAccess = await solanaClient.hasAccess(publicKey);

        if (!hasAccess) {
            return res.status(403).json({ error: "Access denied. You must hold the Strategy NFT." });
        }

        const signal = engine.getSignal();
        res.json(signal);

    } catch (e) {
        console.error("Error in /signal:", e);
        res.status(500).json({ error: "Internal server error" });
    }
});

// ==================== POLYMARKET ENDPOINTS ====================

app.get("/api/polymarket/markets", async (req, res) => {
    try {
        const limit = parseInt(req.query.limit as string) || 20;
        const markets = await polymarketClient.getMarkets(limit);
        res.json(markets);
    } catch (e) {
        console.error("Error fetching Polymarket markets:", e);
        res.status(500).json({ error: "Failed to fetch markets" });
    }
});

app.get("/api/polymarket/markets/search", async (req, res) => {
    try {
        const query = req.query.q as string || "";
        const markets = await polymarketClient.searchMarkets(query);
        res.json(markets);
    } catch (e) {
        console.error("Error searching markets:", e);
        res.status(500).json({ error: "Failed to search markets" });
    }
});

app.get("/api/polymarket/markets/:id", async (req, res) => {
    try {
        const market = await polymarketClient.getMarket(req.params.id);
        if (!market) {
            return res.status(404).json({ error: "Market not found" });
        }
        res.json(market);
    } catch (e) {
        console.error("Error fetching market:", e);
        res.status(500).json({ error: "Failed to fetch market" });
    }
});

app.get("/api/polymarket/prices/:id", async (req, res) => {
    try {
        const prices = await polymarketClient.getPrices(req.params.id);
        res.json(prices);
    } catch (e) {
        console.error("Error fetching prices:", e);
        res.status(500).json({ error: "Failed to fetch prices" });
    }
});

app.get("/api/polymarket/positions/:address", async (req, res) => {
    try {
        const positions = await polymarketClient.getPositions(req.params.address);
        res.json(positions);
    } catch (e) {
        console.error("Error fetching positions:", e);
        res.status(500).json({ error: "Failed to fetch positions" });
    }
});

// ==================== STRATEGY CODE ENDPOINTS ====================

// Upload strategy code to IPFS and save to DB
app.post("/api/strategy/upload", async (req, res) => {
    try {
        const { code, metadata } = req.body;

        if (!code || typeof code !== "string") {
            return res.status(400).json({ error: "Code is required" });
        }

        // 1. Upload to IPFS
        // const result = await ipfsClient.uploadCode(code, metadata);
        const result: { success: boolean; cid: string; url: string; error?: string } = { success: true, cid: `QmLocal${randomUUID()}`, url: "" }; // Mock for local demo

        if (!result.success) {
            return res.status(500).json({ error: result.error || "Upload failed" });
        }

        // 2. Save to DB
        const db = await getDatabase();
        const id = randomUUID();
        const { name, description, creator, category } = metadata;

        await db.run(
            `INSERT INTO created_strategies (id, creator_address, name, description, ipfs_cid, category, status)
             VALUES (?, ?, ?, ?, ?, ?, 'unlisted')`,
            [id, creator, name, description, result.cid, category || 'Other']
        );

        res.json({
            success: true,
            cid: result.cid,
            url: result.url,
            id: id // Return the local ID
        });
    } catch (e) {
        console.error("Error uploading strategy:", e);
        res.status(500).json({ error: "Failed to upload strategy" });
    }
});

// List strategy for sale
app.post("/api/strategy/list", async (req, res) => {
    try {
        const { strategyId, price, walletAddress } = req.body;

        if (!strategyId || !price || !walletAddress) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const db = await getDatabase();

        // Verify ownership
        const strategy = await db.get("SELECT * FROM created_strategies WHERE id = ?", [strategyId]);
        if (!strategy) {
            return res.status(404).json({ error: "Strategy not found" });
        }
        if (strategy.creator_address !== walletAddress) {
            return res.status(403).json({ error: "Unauthorized" });
        }

        // Update status and price
        await db.run(
            `UPDATE created_strategies SET status = 'listed', list_price = ? WHERE id = ?`,
            [price, strategyId]
        );

        res.json({ success: true });
    } catch (e) {
        console.error("Error listing strategy:", e);
        res.status(500).json({ error: "Failed to list strategy" });
    }
});

// Test strategy code (dry run)
app.post("/api/strategy/test", async (req, res) => {
    try {
        const { code, params } = req.body;

        if (!code || typeof code !== "string") {
            return res.status(400).json({ error: "Code is required" });
        }

        const result = await strategyExecutor.execute(code, params);
        res.json(result);
    } catch (e) {
        console.error("Error testing strategy:", e);
        res.status(500).json({ error: "Failed to test strategy" });
    }
});

// Execute strategy from IPFS
app.post("/api/strategy/execute", async (req, res) => {
    try {
        const { cid, params } = req.body;

        if (!cid || typeof cid !== "string") {
            return res.status(400).json({ error: "CID is required" });
        }

        const result = await strategyExecutor.executeFromIPFS(cid, params);
        res.json(result);
    } catch (e) {
        console.error("Error executing strategy:", e);
        res.status(500).json({ error: "Failed to execute strategy" });
    }
});

// Fetch strategy code from IPFS
app.get("/api/strategy/code/:cid", async (req, res) => {
    try {
        const data = await ipfsClient.fetchCode(req.params.cid);
        if (!data) {
            return res.status(404).json({ error: "Strategy not found" });
        }
        res.json(data);
    } catch (e) {
        console.error("Error fetching strategy code:", e);
        res.status(500).json({ error: "Failed to fetch strategy code" });
    }
});

// ==================== USER PROFILE & PORTFOLIO ENDPOINTS ====================

import { initDatabase, getDatabase } from "./db";
import { profileService } from "./profileService";

// Initialize DB on startup
initDatabase().catch(console.error);

app.post("/api/user/profile", async (req, res) => {
    try {
        const { walletAddress, apiKey, secret, passphrase } = req.body;
        if (!walletAddress || !apiKey || !secret || !passphrase) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const db = await getDatabase();
        await db.run(
            `INSERT OR REPLACE INTO users (wallet_address, polymarket_api_key, polymarket_secret, polymarket_passphrase)
             VALUES (?, ?, ?, ?)`,
            [walletAddress, apiKey, secret, passphrase]
        );

        res.json({ success: true });
    } catch (e) {
        console.error("Error updating profile:", e);
        res.status(500).json({ error: "Failed to update profile" });
    }
});

app.get("/api/user/profile/:address", async (req, res) => {
    try {
        const db = await getDatabase();
        const user = await db.get(
            "SELECT wallet_address, created_at FROM users WHERE wallet_address = ?",
            [req.params.address]
        );

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        res.json({
            walletAddress: user.wallet_address,
            hasApiKeys: true, // We don't return the actual keys
            createdAt: user.created_at
        });
    } catch (e) {
        console.error("Error fetching profile:", e);
        res.status(500).json({ error: "Failed to fetch profile" });
    }
});

app.get("/api/user/portfolio/:address", async (req, res) => {
    try {
        const db = await getDatabase();
        // Fetch both allocated strategies and bought strategies (joined with details)
        const strategies = await db.all(
            `SELECT 
                us.*,
                cs.name as apiId,
                cs.description,
                cs.creator_address as creator,
                cs.status as strategyStatus,
                cs.list_price as listPrice,
                cs.created_at as lastUpdateTs
             FROM user_strategies us
             LEFT JOIN created_strategies cs ON us.strategy_id = cs.id
             WHERE us.user_address = ?`,
            [req.params.address]
        );

        // Map to match frontend expectations
        const mappedStrategies = strategies.map(s => ({
            publicKey: s.strategy_id,
            strategyId: s.strategy_id,
            apiId: s.apiId,
            creator: s.creator,
            listed: s.strategyStatus === 'listed',
            listPrice: s.listPrice * 1_000_000, // Convert back to atomic units for consistency
            lastUpdateTs: Math.floor(new Date(s.lastUpdateTs).getTime() / 1000),
            // Add other fields as needed
            capitalAllocated: s.capital_allocated,
            status: s.status
        }));

        res.json(mappedStrategies);
    } catch (e) {
        console.error("Error fetching portfolio:", e);
        res.status(500).json({ error: "Failed to fetch portfolio" });
    }
});

app.post("/api/strategy/buy", async (req, res) => {
    try {
        const { walletAddress, strategyId, price } = req.body;

        if (!walletAddress || !strategyId) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const db = await getDatabase();

        // Check if already owned
        const existing = await db.get(
            "SELECT * FROM user_strategies WHERE user_address = ? AND strategy_id = ?",
            [walletAddress, strategyId]
        );

        if (existing) {
            return res.status(400).json({ error: "Strategy already owned" });
        }

        // Record purchase/allocation
        await db.run(
            `INSERT INTO user_strategies (user_address, strategy_id, capital_allocated, status)
             VALUES (?, ?, 0, 'active')`,
            [walletAddress, strategyId]
        );

        // Log activity event
        await db.run(
            `INSERT INTO activity_events (user_address, event_type, event_data)
             VALUES (?, 'strategy_purchased', ?)`,
            [walletAddress, JSON.stringify({ strategyId, price })]
        );

        res.json({ success: true });
    } catch (e) {
        console.error("Error buying strategy:", e);
        res.status(500).json({ error: "Failed to buy strategy" });
    }
});

app.post("/api/user/strategy/allocate", async (req, res) => {
    try {
        const { walletAddress, strategyId, amount, action } = req.body; // action: 'allocate' or 'pause'

        const db = await getDatabase();

        if (action === 'pause') {
            await db.run(
                `UPDATE user_strategies SET status = 'paused' WHERE user_address = ? AND strategy_id = ?`,
                [walletAddress, strategyId]
            );
        } else {
            await db.run(
                `INSERT OR REPLACE INTO user_strategies (user_address, strategy_id, capital_allocated, status)
                 VALUES (?, ?, ?, 'active')`,
                [walletAddress, strategyId, amount]
            );
        }

        res.json({ success: true });
    } catch (e) {
        console.error("Error allocating capital:", e);
        res.status(500).json({ error: "Failed to update strategy allocation" });
    }
});

// ==================== SOCIAL PROFILE ENDPOINTS ====================

app.get("/api/profile/:address", async (req, res) => {
    try {
        const profile = await profileService.getProfile(req.params.address);
        if (!profile) {
            return res.status(404).json({ error: "Profile not found" });
        }
        res.json(profile);
    } catch (e) {
        console.error("Error fetching profile:", e);
        res.status(500).json({ error: "Failed to fetch profile" });
    }
});

app.post("/api/profile/update", async (req, res) => {
    try {
        const { walletAddress, username, bio, avatarUrl, privacySetting } = req.body;
        const db = await getDatabase();

        await db.run(
            `INSERT OR REPLACE INTO user_profiles (wallet_address, username, bio, avatar_url, privacy_setting)
             VALUES (?, ?, ?, ?, ?)`,
            [walletAddress, username, bio, avatarUrl, privacySetting || 'public']
        );

        res.json({ success: true });
    } catch (e) {
        console.error("Error updating profile:", e);
        res.status(500).json({ error: "Failed to update profile" });
    }
});

app.get("/api/profile/:address/trader-stats", async (req, res) => {
    try {
        const stats = await profileService.getTraderStats(req.params.address);
        res.json(stats);
    } catch (e) {
        console.error("Error fetching trader stats:", e);
        res.status(500).json({ error: "Failed to fetch trader stats" });
    }
});

app.get("/api/profile/:address/developer-stats", async (req, res) => {
    try {
        const stats = await profileService.getDeveloperStats(req.params.address);
        res.json(stats);
    } catch (e) {
        console.error("Error fetching developer stats:", e);
        res.status(500).json({ error: "Failed to fetch developer stats" });
    }
});

app.get("/api/profile/:address/activity", async (req, res) => {
    try {
        const limit = parseInt(req.query.limit as string) || 20;
        const activity = await profileService.getActivityFeed(req.params.address, limit);
        res.json(activity);
    } catch (e) {
        console.error("Error fetching activity:", e);
        res.status(500).json({ error: "Failed to fetch activity" });
    }
});

app.post("/api/social/follow", async (req, res) => {
    try {
        const { followerAddress, followingAddress } = req.body;
        const db = await getDatabase();

        await db.run(
            `INSERT OR IGNORE INTO social_connections (follower_address, following_address)
             VALUES (?, ?)`,
            [followerAddress, followingAddress]
        );

        res.json({ success: true });
    } catch (e) {
        console.error("Error following user:", e);
        res.status(500).json({ error: "Failed to follow user" });
    }
});

app.delete("/api/social/unfollow/:address", async (req, res) => {
    try {
        const { followerAddress } = req.body;
        const db = await getDatabase();

        await db.run(
            `DELETE FROM social_connections WHERE follower_address = ? AND following_address = ?`,
            [followerAddress, req.params.address]
        );

        res.json({ success: true });
    } catch (e) {
        console.error("Error unfollowing user:", e);
        res.status(500).json({ error: "Failed to unfollow user" });
    }
});

app.get("/api/social/followers/:address", async (req, res) => {
    try {
        const followers = await profileService.getFollowers(req.params.address);
        res.json(followers);
    } catch (e) {
        console.error("Error fetching followers:", e);
        res.status(500).json({ error: "Failed to fetch followers" });
    }
});

app.get("/api/social/following/:address", async (req, res) => {
    try {
        const following = await profileService.getFollowing(req.params.address);
        res.json(following);
    } catch (e) {
        console.error("Error fetching following:", e);
        res.status(500).json({ error: "Failed to fetch following" });
    }
});

app.get("/api/social/is-following/:follower/:following", async (req, res) => {
    try {
        const isFollowing = await profileService.isFollowing(req.params.follower, req.params.following);
        res.json({ isFollowing });
    } catch (e) {
        console.error("Error checking follow status:", e);
        res.status(500).json({ error: "Failed to check follow status" });
    }
});

// ==================== SERVER START ====================

app.listen(PORT, async () => {
    console.log(`Server running on port ${PORT}`);
    await solanaClient.init();
});
