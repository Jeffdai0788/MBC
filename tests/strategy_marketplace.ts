import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { StrategyMarketplace } from "../target/types/strategy_marketplace";
import {
  createMint,
  createAssociatedTokenAccount,
  mintTo,
  getAccount,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { assert } from "chai";

describe("strategy_marketplace", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.StrategyMarketplace as Program<StrategyMarketplace>;

  const creator = anchor.web3.Keypair.generate();
  const buyer = anchor.web3.Keypair.generate();
  const payer = (provider.wallet as anchor.Wallet).payer;

  let paymentMint: anchor.web3.PublicKey;
  let creatorPaymentAta: anchor.web3.PublicKey;
  let buyerPaymentAta: anchor.web3.PublicKey;

  let strategyPda: anchor.web3.PublicKey;
  let strategyMintPda: anchor.web3.PublicKey;
  let creatorNftAta: anchor.web3.PublicKey;
  let escrowNftAta: anchor.web3.PublicKey;
  let buyerNftAta: anchor.web3.PublicKey;
  let sellerPaymentAta: anchor.web3.PublicKey;

  const strategyId = new anchor.BN(1);
  const strategyHash = Array.from(Buffer.alloc(32, 1)); // Dummy hash
  const apiId = "strategy-1";

  before(async () => {
    // Airdrop SOL to creator and buyer
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(creator.publicKey, 10 * anchor.web3.LAMPORTS_PER_SOL),
      "confirmed"
    );
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(buyer.publicKey, 10 * anchor.web3.LAMPORTS_PER_SOL),
      "confirmed"
    );

    // Create Payment Mint
    paymentMint = await createMint(
      provider.connection,
      payer,
      payer.publicKey,
      null,
      6
    );

    // Create ATAs and mint payment tokens
    creatorPaymentAta = await createAssociatedTokenAccount(
      provider.connection,
      payer,
      paymentMint,
      creator.publicKey
    );
    buyerPaymentAta = await createAssociatedTokenAccount(
      provider.connection,
      payer,
      paymentMint,
      buyer.publicKey
    );

    await mintTo(
      provider.connection,
      payer,
      paymentMint,
      buyerPaymentAta,
      payer,
      1000_000000 // 1000 tokens
    );
  });

  it("Creates a strategy", async () => {
    [strategyPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("strategy"),
        creator.publicKey.toBuffer(),
        strategyId.toArrayLike(Buffer, "le", 8),
      ],
      program.programId
    );

    [strategyMintPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("strategy_mint"), strategyPda.toBuffer()],
      program.programId
    );

    creatorNftAta = await anchor.utils.token.associatedAddress({
      mint: strategyMintPda,
      owner: creator.publicKey,
    });

    escrowNftAta = await anchor.utils.token.associatedAddress({
      mint: strategyMintPda,
      owner: strategyPda,
    });

    await program.methods
      .createStrategy(strategyId, strategyHash, apiId)
      .accounts({
        creator: creator.publicKey,
        strategy: strategyPda,
        strategyMint: strategyMintPda,
        creatorNftAta: creatorNftAta,
        escrowNftAta: escrowNftAta, // Added
        paymentMint: paymentMint,
        systemProgram: anchor.web3.SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .signers([creator])
      .rpc();

    const strategyAccount = await program.account.strategy.fetch(strategyPda);
    assert.ok(strategyAccount.creator.equals(creator.publicKey));
    assert.ok(strategyAccount.strategyMint.equals(strategyMintPda));
    assert.ok(strategyAccount.paymentMint.equals(paymentMint));
    assert.equal(strategyAccount.listed, false);
    assert.equal(strategyAccount.apiId, apiId);
    assert.deepEqual(strategyAccount.strategyHash, strategyHash);

    const nftAccount = await getAccount(provider.connection, creatorNftAta);
    assert.equal(Number(nftAccount.amount), 1);
  });

  it("Lists the strategy", async () => {
    const listPrice = new anchor.BN(500_000000); // 500 tokens

    // escrowNftAta was already calculated and initialized in createStrategy

    await program.methods
      .listStrategy(listPrice)
      .accounts({
        seller: creator.publicKey,
        strategy: strategyPda,
        strategyMint: strategyMintPda,
        sellerNftAta: creatorNftAta,
        escrowNftAta: escrowNftAta,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([creator])
      .rpc();

    const strategyAccount = await program.account.strategy.fetch(strategyPda);
    assert.equal(strategyAccount.listed, true);
    assert.ok(strategyAccount.listPrice.eq(listPrice));
    assert.ok(strategyAccount.seller.equals(creator.publicKey));

    const escrowAccount = await getAccount(provider.connection, escrowNftAta);
    assert.equal(Number(escrowAccount.amount), 1);

    const creatorAccount = await getAccount(provider.connection, creatorNftAta);
    assert.equal(Number(creatorAccount.amount), 0);
  });

  it("Buys the strategy", async () => {
    buyerNftAta = await anchor.utils.token.associatedAddress({
      mint: strategyMintPda,
      owner: buyer.publicKey,
    });

    // Manually create buyerNftAta since init_if_needed was removed
    await createAssociatedTokenAccount(
      provider.connection,
      payer,
      strategyMintPda,
      buyer.publicKey
    );

    // Seller payment ATA (creator's ATA)
    sellerPaymentAta = creatorPaymentAta;

    await program.methods
      .buyStrategy()
      .accounts({
        buyer: buyer.publicKey,
        strategy: strategyPda,
        strategyMint: strategyMintPda,
        paymentMint: paymentMint,
        buyerPaymentAta: buyerPaymentAta,
        sellerPaymentAta: sellerPaymentAta,
        escrowNftAta: escrowNftAta,
        buyerNftAta: buyerNftAta,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([buyer])
      .rpc();

    const strategyAccount = await program.account.strategy.fetch(strategyPda);
    assert.equal(strategyAccount.listed, false);
    assert.ok(strategyAccount.listPrice.eq(new anchor.BN(0)));
    assert.ok(strategyAccount.seller.equals(buyer.publicKey));

    const buyerNftAccount = await getAccount(provider.connection, buyerNftAta);
    assert.equal(Number(buyerNftAccount.amount), 1);

    const escrowAccount = await getAccount(provider.connection, escrowNftAta);
    assert.equal(Number(escrowAccount.amount), 0);

    const sellerPaymentAccount = await getAccount(provider.connection, sellerPaymentAta);
    assert.equal(Number(sellerPaymentAccount.amount), 500_000000); // Received 500
  });

  it("Updates the oracle", async () => {
    const midBps = 15000; // 1.5000
    const timestamp = new anchor.BN(Math.floor(Date.now() / 1000));

    await program.methods
      .updateOracle(midBps, timestamp)
      .accounts({
        authority: payer.publicKey,
        strategy: strategyPda,
      })
      .signers([]) // payer is implicit provider wallet
      .rpc();

    const strategyAccount = await program.account.strategy.fetch(strategyPda);
    assert.equal(strategyAccount.lastMidBps, midBps);
    assert.ok(strategyAccount.lastUpdateTs.eq(timestamp));
  });
});
