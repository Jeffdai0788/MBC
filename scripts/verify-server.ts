import fetch from "node-fetch";
import { Keypair } from "@solana/web3.js";
import * as nacl from "tweetnacl";
import bs58 from "bs58";
import * as fs from "fs";
import * as path from "path";

async function main() {
    const keysDir = path.join(__dirname, "../keys");
    const buyerKeyPath = path.join(keysDir, "buyer.json");

    if (!fs.existsSync(buyerKeyPath)) {
        throw new Error("Buyer key not found. Run bootstrap-devnet.ts first.");
    }

    const buyerSecret = Uint8Array.from(JSON.parse(fs.readFileSync(buyerKeyPath, "utf-8")));
    const buyer = Keypair.fromSecretKey(buyerSecret);

    console.log("Testing with Buyer (NFT Holder):", buyer.publicKey.toBase58());

    // 1. Test Authorized Access
    await testAccess(buyer, "Authorized");

    // 2. Test Unauthorized Access
    const randomUser = Keypair.generate();
    console.log("\nTesting with Random User (No NFT):", randomUser.publicKey.toBase58());
    await testAccess(randomUser, "Unauthorized");
}

async function testAccess(user: Keypair, expected: "Authorized" | "Unauthorized") {
    const timestamp = Date.now();
    const message = `Login to Strategy Marketplace: ${timestamp}`;
    const messageBytes = new TextEncoder().encode(message);
    const signature = nacl.sign.detached(messageBytes, user.secretKey);
    const signatureBase58 = bs58.encode(signature);

    try {
        const res = await fetch("http://localhost:3000/signal", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                publicKey: user.publicKey.toBase58(),
                signature: signatureBase58,
                timestamp: timestamp
            })
        });

        const data = await res.json();
        console.log(`[${expected}] Status:`, res.status);
        console.log(`[${expected}] Response:`, data);

        if (expected === "Authorized") {
            if (res.status === 200 && data.signal) {
                console.log("✅ Authorized access succeeded");
            } else {
                console.error("❌ Authorized access failed");
                process.exit(1);
            }
        } else {
            if (res.status === 403) {
                console.log("✅ Unauthorized access blocked correctly");
            } else {
                console.error("❌ Unauthorized access NOT blocked");
                process.exit(1);
            }
        }

    } catch (e) {
        console.error(`Error testing ${expected} access:`, e);
        process.exit(1);
    }
}

main().catch(console.error);
