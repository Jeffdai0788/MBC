import * as anchor from "@coral-xyz/anchor";
import { Connection, Keypair, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { createMint, getOrCreateAssociatedTokenAccount, mintTo, getAssociatedTokenAddress } from "@solana/spl-token";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";
import { Program } from "@coral-xyz/anchor";
import { StrategyMarketplace } from "../target/types/strategy_marketplace";
import { createHash } from "crypto";

dotenv.config();

async function main() {
    // 1. Setup Connection
    const connection = new Connection("https://api.devnet.solana.com", "confirmed");
    console.log("Connected to Devnet");

    // 2. Load/Generate Keys
    const keysDir = path.join(__dirname, "../keys");
    if (!fs.existsSync(keysDir)) {
        fs.mkdirSync(keysDir);
    }

    const loadOrCreateKeypair = (name: string): Keypair => {
        const keyPath = path.join(keysDir, `${name}.json`);
        if (fs.existsSync(keyPath)) {
            const secretKey = Uint8Array.from(JSON.parse(fs.readFileSync(keyPath, "utf-8")));
            return Keypair.fromSecretKey(secretKey);
        } else {
            const keypair = Keypair.generate();
            fs.writeFileSync(keyPath, JSON.stringify(Array.from(keypair.secretKey)));
            return keypair;
        }
    };

    const creator = loadOrCreateKeypair("creator");
    const buyer = loadOrCreateKeypair("buyer");

    console.log("Creator:", creator.publicKey.toBase58());
    console.log("Buyer:", buyer.publicKey.toBase58());

    // 3. Airdrop SOL
    const airdrop = async (pubkey: PublicKey) => {
        const balance = await connection.getBalance(pubkey);
        if (balance < 1 * LAMPORTS_PER_SOL) {
            console.log(`Requesting airdrop for ${pubkey.toBase58()}...`);
            try {
                const sig = await connection.requestAirdrop(pubkey, 2 * LAMPORTS_PER_SOL);
                await connection.confirmTransaction(sig);
                console.log("Airdrop confirmed");
            } catch (e) {
                console.log("Airdrop failed (likely rate limited), proceeding anyway if balance > 0");
            }
        }
    };

    await airdrop(creator.publicKey);
    await airdrop(buyer.publicKey);

    // 4. Create Payment Mint
    console.log("Creating Payment Mint...");
    const paymentMint = await createMint(
        connection,
        creator,
        creator.publicKey,
        null,
        6
    );
    console.log("Payment Mint:", paymentMint.toBase58());

    // 5. Mint tokens to Buyer
    const buyerPaymentAta = await getOrCreateAssociatedTokenAccount(
        connection,
        creator, // Payer must be creator (funded)
        paymentMint,
        buyer.publicKey
    );
    await mintTo(
        connection,
        creator,
        paymentMint,
        buyerPaymentAta.address,
        creator,
        1_000_000_000 // 1000 tokens
    );
    console.log("Minted 1000 tokens to buyer");

    // 6. Initialize Anchor Program
    // We need a wallet for the provider, use creator
    const wallet = new anchor.Wallet(creator);
    const provider = new anchor.AnchorProvider(connection, wallet, {});
    anchor.setProvider(provider);

    // Load Program ID from Anchor.toml or target/idl
    // Assuming we run this after `anchor build`
    const idlPath = path.join(__dirname, "../target/idl/strategy_marketplace.json");
    if (!fs.existsSync(idlPath)) {
        throw new Error("IDL not found. Run `anchor build` first.");
    }
    const idl = JSON.parse(fs.readFileSync(idlPath, "utf-8"));
    const programId = new PublicKey(idl.address);
    const program = new Program(idl as any, provider) as Program<StrategyMarketplace>;

    console.log("Program ID:", programId.toBase58());

    // 7. Create Strategy
    const strategyId = new anchor.BN(Math.floor(Date.now() / 1000)); // Randomize ID
    console.log("Strategy ID:", strategyId.toString());
    const apiId = `strategy-${strategyId.toString()}`;
    const strategyHashContent = "polymarket-strategy-v1";
    const strategyHash = createHash("sha256").update(strategyHashContent).digest();
    const strategyHashArray = Array.from(strategyHash);

    const [strategyPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("strategy"), creator.publicKey.toBuffer(), strategyId.toArrayLike(Buffer, "le", 8)],
        programId
    );
    const [strategyMintPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("strategy_mint"), strategyPda.toBuffer()],
        programId
    );

    // Derive addresses (do not create yet, create_strategy does it)
    const creatorNftAta = await getAssociatedTokenAddress(
        strategyMintPda,
        creator.publicKey
    );

    const escrowNftAta = await getAssociatedTokenAddress(
        strategyMintPda,
        strategyPda,
        true // allowOwnerOffCurve
    );

    console.log("Creating Strategy...");
    try {
        await program.methods
            .createStrategy(strategyId, strategyHashArray, apiId)
            .accounts({
                creator: creator.publicKey,
                paymentMint: paymentMint,
            } as any)
            .signers([creator])
            .rpc();
        console.log("Strategy Created:", strategyPda.toBase58());
    } catch (e) {
        console.log("Strategy creation failed (maybe already exists):", e);
    }

    // 8. List Strategy
    const listPrice = new anchor.BN(1_000_000); // 1.0 token
    console.log("Listing Strategy...");
    try {
        await program.methods
            .listStrategy(listPrice)
            .accounts({
                seller: creator.publicKey,
                strategy: strategyPda,
                strategyMint: strategyMintPda,
                sellerNftAta: creatorNftAta,
                escrowNftAta: escrowNftAta,
                tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
                associatedTokenProgram: anchor.utils.token.ASSOCIATED_PROGRAM_ID,
                systemProgram: anchor.web3.SystemProgram.programId,
            } as any)
            .signers([creator])
            .rpc();
        console.log("Strategy Listed");
    } catch (e) {
        console.log("Listing failed (maybe already listed/sold):", e);
    }

    // 9. Buy Strategy
    console.log("Buying Strategy...");
    // Now mint exists, create buyer ATA
    const buyerNftAta = await getOrCreateAssociatedTokenAccount(
        connection,
        creator, // Payer must be creator (funded)
        strategyMintPda,
        buyer.publicKey
    );
    const creatorPaymentAta = await getOrCreateAssociatedTokenAccount(
        connection,
        creator,
        paymentMint,
        creator.publicKey
    );

    try {
        await program.methods
            .buyStrategy()
            .accounts({
                buyer: buyer.publicKey,
                strategy: strategyPda,
                strategyMint: strategyMintPda,
                paymentMint: paymentMint,
                buyerPaymentAta: buyerPaymentAta.address,
                sellerPaymentAta: creatorPaymentAta.address,
                escrowNftAta: escrowNftAta,
                buyerNftAta: buyerNftAta.address,
                tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
                associatedTokenProgram: anchor.utils.token.ASSOCIATED_PROGRAM_ID,
                systemProgram: anchor.web3.SystemProgram.programId,
            } as any)
            .signers([buyer])
            .rpc();
        console.log("Strategy Bought by Buyer");
    } catch (e) {
        console.log("Buying failed (maybe already owned):", e);
    }

    // 10. Write Config Files
    const serverDir = path.join(__dirname, "../packages/server");
    if (!fs.existsSync(serverDir)) {
        fs.mkdirSync(serverDir, { recursive: true });
    }

    const envContent = `RPC_URL=https://api.devnet.solana.com
PROGRAM_ID=${programId.toBase58()}
STRATEGY_PUBKEY=${strategyPda.toBase58()}
STRATEGY_MINT=${strategyMintPda.toBase58()}
PAYMENT_MINT=${paymentMint.toBase58()}
API_ID=${apiId}
POLYMARKET_TOKEN_ID=21742633143463906290569050155826241533067272736897614950488156847949938836455
`;

    fs.writeFileSync(path.join(serverDir, ".env"), envContent);

    const configDir = path.join(__dirname, "../config");
    if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir);
    }

    const addresses = {
        creator: creator.publicKey.toBase58(),
        buyer: buyer.publicKey.toBase58(),
        paymentMint: paymentMint.toBase58(),
        strategy: strategyPda.toBase58(),
        strategyMint: strategyMintPda.toBase58(),
        programId: programId.toBase58(),
    };

    fs.writeFileSync(path.join(configDir, "addresses.json"), JSON.stringify(addresses, null, 2));

    console.log("\nConfiguration Generated:");
    console.log(JSON.stringify(addresses, null, 2));
}

main().catch(console.error);
