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
        const strategies = await solanaClient.getAllStrategies();
        res.json(strategies);
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

// Upload strategy code to IPFS
app.post("/api/strategy/upload", async (req, res) => {
    try {
        const { code, metadata } = req.body;

        if (!code || typeof code !== "string") {
            return res.status(400).json({ error: "Code is required" });
        }

        const result = await ipfsClient.uploadCode(code, metadata);

        if (!result.success) {
            return res.status(500).json({ error: result.error || "Upload failed" });
        }

        res.json({
            success: true,
            cid: result.cid,
            url: result.url
        });
    } catch (e) {
        console.error("Error uploading strategy:", e);
        res.status(500).json({ error: "Failed to upload strategy" });
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

// ==================== SERVER START ====================

app.listen(PORT, async () => {
    console.log(`Server running on port ${PORT}`);
    await solanaClient.init();
});
