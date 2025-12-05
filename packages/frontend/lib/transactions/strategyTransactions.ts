import * as anchor from "@coral-xyz/anchor";
import { AnchorWallet } from "@solana/wallet-adapter-react";
import { Connection, PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from "@solana/spl-token";
import idl from "../anchor/idl/strategy_marketplace.json";
import { StrategyMarketplace } from "../anchor/types/strategy_marketplace";

const PROGRAM_ID = new PublicKey(idl.address);
const USDC_MINT = new PublicKey(process.env.NEXT_PUBLIC_USDC_MINT || "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"); // Devnet USDC

export interface CreateStrategyParams {
    strategyId: number;
    strategyHash: number[];
    apiId: string;
    paymentMint?: PublicKey;
}

export interface ListStrategyParams {
    strategyPublicKey: PublicKey;
    price: number;
}

export interface BuyStrategyParams {
    strategyPublicKey: PublicKey;
}

/**
 * Transaction builders for Strategy Marketplace
 */
export class StrategyTransactions {
    private connection: Connection;
    private wallet: AnchorWallet;
    private program: anchor.Program<StrategyMarketplace>;

    constructor(connection: Connection, wallet: AnchorWallet) {
        this.connection = connection;
        this.wallet = wallet;

        const provider = new anchor.AnchorProvider(connection, wallet, {
            commitment: "confirmed",
        });

        this.program = new anchor.Program(idl as any, provider) as anchor.Program<StrategyMarketplace>;
    }

    /**
     * Create and mint a new strategy NFT
     */
    async createStrategy(params: CreateStrategyParams) {
        const { strategyId, strategyHash, apiId, paymentMint = USDC_MINT } = params;

        // Derive PDAs
        const [strategyPda] = PublicKey.findProgramAddressSync(
            [Buffer.from("strategy"), this.wallet.publicKey.toBuffer(), new anchor.BN(strategyId).toArrayLike(Buffer, "le", 8)],
            this.program.programId
        );

        const [strategyMint] = PublicKey.findProgramAddressSync(
            [Buffer.from("strategy_mint"), strategyPda.toBuffer()],
            this.program.programId
        );

        const creatorNftAta = await getAssociatedTokenAddress(strategyMint, this.wallet.publicKey);
        const escrowNftAta = await getAssociatedTokenAddress(strategyMint, strategyPda, true);

        const tx = await this.program.methods
            .createStrategy(new anchor.BN(strategyId), strategyHash, apiId)
            .accounts({
                creator: this.wallet.publicKey,
                strategy: strategyPda,
                strategyMint,
                creatorNftAta,
                escrowNftAta,
                paymentMint,
                systemProgram: SystemProgram.programId,
                tokenProgram: TOKEN_PROGRAM_ID,
                associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
                rent: anchor.web3.SYSVAR_RENT_PUBKEY,
            })
            .transaction();

        return { transaction: tx, strategyPda, strategyMint };
    }

    /**
     * List a strategy for sale
     */
    async listStrategy(params: ListStrategyParams) {
        const { strategyPublicKey, price } = params;

        // Fetch strategy account to get mint
        const strategyAccount = await this.program.account.strategy.fetch(strategyPublicKey);
        const strategyMint = strategyAccount.strategyMint as PublicKey;

        const sellerNftAta = await getAssociatedTokenAddress(strategyMint, this.wallet.publicKey);
        const escrowNftAta = await getAssociatedTokenAddress(strategyMint, strategyPublicKey, true);

        const tx = await this.program.methods
            .listStrategy(new anchor.BN(price * 1_000_000)) // Convert to lamports/smallest unit
            .accounts({
                seller: this.wallet.publicKey,
                strategy: strategyPublicKey,
                strategyMint,
                sellerNftAta,
                escrowNftAta,
                tokenProgram: TOKEN_PROGRAM_ID,
                associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
                systemProgram: SystemProgram.programId,
            })
            .transaction();

        return { transaction: tx };
    }

    /**
     * Buy a listed strategy
     */
    async buyStrategy(params: BuyStrategyParams) {
        const { strategyPublicKey } = params;

        // Fetch strategy account
        const strategyAccount = await this.program.account.strategy.fetch(strategyPublicKey);
        const strategyMint = strategyAccount.strategyMint as PublicKey;
        const paymentMint = strategyAccount.paymentMint as PublicKey;
        const seller = strategyAccount.seller as PublicKey;

        const buyerPaymentAta = await getAssociatedTokenAddress(paymentMint, this.wallet.publicKey);
        const sellerPaymentAta = await getAssociatedTokenAddress(paymentMint, seller);
        const escrowNftAta = await getAssociatedTokenAddress(strategyMint, strategyPublicKey, true);
        const buyerNftAta = await getAssociatedTokenAddress(strategyMint, this.wallet.publicKey);

        const tx = await this.program.methods
            .buyStrategy()
            .accounts({
                buyer: this.wallet.publicKey,
                strategy: strategyPublicKey,
                strategyMint,
                paymentMint,
                buyerPaymentAta,
                sellerPaymentAta,
                escrowNftAta,
                buyerNftAta,
                tokenProgram: TOKEN_PROGRAM_ID,
                associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
                systemProgram: SystemProgram.programId,
            })
            .transaction();

        return { transaction: tx };
    }

    /**
     * Unlist a strategy
     */
    async unlistStrategy(strategyPublicKey: PublicKey) {
        const strategyAccount = await this.program.account.strategy.fetch(strategyPublicKey);
        const strategyMint = strategyAccount.strategyMint as PublicKey;

        const sellerNftAta = await getAssociatedTokenAddress(strategyMint, this.wallet.publicKey);
        const escrowNftAta = await getAssociatedTokenAddress(strategyMint, strategyPublicKey, true);

        const tx = await this.program.methods
            .unlistStrategy()
            .accounts({
                seller: this.wallet.publicKey,
                strategy: strategyPublicKey,
                strategyMint,
                sellerNftAta,
                escrowNftAta,
                tokenProgram: TOKEN_PROGRAM_ID,
            })
            .transaction();

        return { transaction: tx };
    }

    /**
     * Send and confirm transaction
     */
    async sendTransaction(transaction: Transaction) {
        const { blockhash, lastValidBlockHeight } = await this.connection.getLatestBlockhash();
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = this.wallet.publicKey;

        const signed = await this.wallet.signTransaction(transaction);
        const signature = await this.connection.sendRawTransaction(signed.serialize());

        await this.connection.confirmTransaction({
            signature,
            blockhash,
            lastValidBlockHeight,
        });

        return signature;
    }
}
