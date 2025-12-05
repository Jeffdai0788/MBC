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

export interface StrategyData {
    publicKey: string;
    strategyId: string;
    apiId: string;
    creator: string;
    strategyMint: string;
    paymentMint: string;
    listed: boolean;
    listPrice: number;
    seller: string;
    lastMidBps: number;
    lastUpdateTs: number;
}

export class SolanaClient {
    connection: Connection;
    program: anchor.Program<StrategyMarketplace>;
    strategyMint: PublicKey | null = null;
    strategyPubkey: PublicKey = STRATEGY_PUBKEY;

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

    async getStrategy(pubkey?: string): Promise<StrategyData | null> {
        try {
            const strategyPubkey = pubkey ? new PublicKey(pubkey) : STRATEGY_PUBKEY;
            const account = await this.program.account.strategy.fetch(strategyPubkey);

            return {
                publicKey: strategyPubkey.toBase58(),
                strategyId: account.strategyId.toString(),
                apiId: account.apiId,
                creator: (account.creator as PublicKey).toBase58(),
                strategyMint: (account.strategyMint as PublicKey).toBase58(),
                paymentMint: (account.paymentMint as PublicKey).toBase58(),
                listed: account.listed,
                listPrice: account.listPrice.toNumber(),
                seller: (account.seller as PublicKey).toBase58(),
                lastMidBps: account.lastMidBps,
                lastUpdateTs: account.lastUpdateTs.toNumber(),
            };
        } catch (e) {
            console.error("Error fetching strategy:", e);
            return null;
        }
    }

    async getAllStrategies(): Promise<StrategyData[]> {
        try {
            const accounts = await this.program.account.strategy.all();
            return accounts.map(({ publicKey, account }) => ({
                publicKey: publicKey.toBase58(),
                strategyId: account.strategyId.toString(),
                apiId: account.apiId,
                creator: (account.creator as PublicKey).toBase58(),
                strategyMint: (account.strategyMint as PublicKey).toBase58(),
                paymentMint: (account.paymentMint as PublicKey).toBase58(),
                listed: account.listed,
                listPrice: account.listPrice.toNumber(),
                seller: (account.seller as PublicKey).toBase58(),
                lastMidBps: account.lastMidBps,
                lastUpdateTs: account.lastUpdateTs.toNumber(),
            }));
        } catch (e) {
            console.error("Error fetching all strategies:", e);
            return [];
        }
    }

    async getMarketplaceStats() {
        const strategies = await this.getAllStrategies();
        const listedStrategies = strategies.filter(s => s.listed);

        // Calculate total volume (sum of all list prices)
        const totalVolume = strategies.reduce((sum, s) => sum + s.listPrice, 0);

        // Calculate average mid price (mock for now based on lastMidBps)
        const avgMidBps = strategies.length > 0
            ? strategies.reduce((sum, s) => sum + s.lastMidBps, 0) / strategies.length
            : 0;

        return {
            totalStrategies: strategies.length,
            listedStrategies: listedStrategies.length,
            totalVolume: totalVolume / 1_000_000, // Convert to USDC
            avgPerformance: (avgMidBps / 100).toFixed(1), // Convert bps to percentage
        };
    }

    async checkNftBalance(walletPubkeyStr: string, mintPubkeyStr: string): Promise<number> {
        try {
            const walletPubkey = new PublicKey(walletPubkeyStr);
            const mintPubkey = new PublicKey(mintPubkeyStr);
            const ata = await getAssociatedTokenAddress(mintPubkey, walletPubkey);
            const account = await getAccount(this.connection, ata);
            return Number(account.amount);
        } catch (e) {
            return 0;
        }
    }
}
