import express from "express";
import { SolanaClient } from "./solanaClient";
import { StrategyEngine } from "./engine";
import * as nacl from "tweetnacl";
import { PublicKey } from "@solana/web3.js";
import bs58 from "bs58";

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

const solanaClient = new SolanaClient();
const engine = new StrategyEngine();

// Middleware to verify signature
const verifySignature = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const { publicKey, signature, timestamp } = req.body;

    if (!publicKey || !signature || !timestamp) {
        return res.status(400).json({ error: "Missing publicKey, signature, or timestamp" });
    }

    // 1. Verify timestamp (prevent replay attacks)
    const now = Date.now();
    if (Math.abs(now - timestamp) > 5 * 60 * 1000) { // 5 minutes window
        return res.status(401).json({ error: "Timestamp expired" });
    }

    // 2. Verify signature
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

app.post("/signal", verifySignature, async (req, res) => {
    const { publicKey } = req.body;

    try {
        // 3. Check NFT Access
        const hasAccess = await solanaClient.hasAccess(publicKey);

        if (!hasAccess) {
            return res.status(403).json({ error: "Access denied. You must hold the Strategy NFT." });
        }

        // 4. Return Signal
        const signal = engine.getSignal();
        res.json(signal);

    } catch (e) {
        console.error("Error in /signal:", e);
        res.status(500).json({ error: "Internal server error" });
    }
});

app.listen(PORT, async () => {
    console.log(`Server running on port ${PORT}`);
    await solanaClient.init();
});
