import * as anchor from "@coral-xyz/anchor";
import { Connection, PublicKey } from "@solana/web3.js";
import { getAssociatedTokenAddress, getAccount } from "@solana/spl-token";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

dotenv.config();

const RPC_URL = process.env.RPC_URL || "https://api.devnet.solana.com";
const PROGRAM_ID = new PublicKey(process.env.PROGRAM_ID!);
const STRATEGY_PUBKEY = new PublicKey(process.env.STRATEGY_PUBKEY!);

import { StrategyMarketplace } from "../../../target/types/strategy_marketplace";

export class SolanaClient {
    connection: Connection;
    program: anchor.Program<StrategyMarketplace>;
    strategyMint: PublicKey | null = null;

    constructor() {
        this.connection = new Connection(RPC_URL, "confirmed");

        // Load IDL
        const idlPath = path.join(__dirname, "../../../target/idl/strategy_marketplace.json");
        if (!fs.existsSync(idlPath)) {
            throw new Error("IDL not found at " + idlPath);
        }
        const idl = JSON.parse(fs.readFileSync(idlPath, "utf-8"));

        // Create a dummy provider (read-only)
        const provider = new anchor.AnchorProvider(
            this.connection,
            new anchor.Wallet(anchor.web3.Keypair.generate()),
            {}
        );

        // Cast to Program<StrategyMarketplace>
        this.program = new anchor.Program(idl as any, provider) as anchor.Program<StrategyMarketplace>;
    }

    async init() {
        console.log("Initializing Solana Client...");
        // Fetch Strategy Account to get the Mint
        const strategyAccount = await this.program.account.strategy.fetch(STRATEGY_PUBKEY);
        this.strategyMint = strategyAccount.strategyMint as PublicKey;
        console.log("Strategy Mint loaded:", this.strategyMint.toBase58());
    }

    async hasAccess(walletPubkeyStr: string): Promise<boolean> {
        if (!this.strategyMint) {
            await this.init();
        }

        try {
            const walletPubkey = new PublicKey(walletPubkeyStr);
            const ata = await getAssociatedTokenAddress(
                this.strategyMint!,
                walletPubkey
            );

            const account = await getAccount(this.connection, ata);
            return Number(account.amount) > 0;
        } catch (e) {
            console.error("Error checking access:", e);
            return false; // ATA doesn't exist or other error -> No access
        }
    }
}
