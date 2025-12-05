import * as anchor from "@coral-xyz/anchor";
import { Connection, PublicKey } from "@solana/web3.js";
import { getAssociatedTokenAddress, getAccount } from "@solana/spl-token";
import idl from "../anchor/idl/strategy_marketplace.json";
import { StrategyMarketplace } from "../anchor/types/strategy_marketplace";

const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL!;
const PROGRAM_ID = new PublicKey(process.env.NEXT_PUBLIC_PROGRAM_ID!);
const STRATEGY_PUBKEY = new PublicKey(process.env.NEXT_PUBLIC_STRATEGY_PUBKEY!);
const STRATEGY_MINT = new PublicKey(process.env.NEXT_PUBLIC_STRATEGY_MINT!);

export class FrontendSolanaClient {
    connection: Connection;
    program: anchor.Program<StrategyMarketplace>;

    constructor() {
        this.connection = new Connection(RPC_URL, "confirmed");

        // Read-only provider
        const provider = new anchor.AnchorProvider(
            this.connection,
            { publicKey: PublicKey.default } as any,
            {}
        );

        this.program = new anchor.Program(idl as any, provider) as anchor.Program<StrategyMarketplace>;
    }

    async getStrategy() {
        return await this.program.account.strategy.fetch(STRATEGY_PUBKEY);
    }

    async getNftBalance(owner: PublicKey): Promise<number> {
        try {
            const ata = await getAssociatedTokenAddress(
                STRATEGY_MINT,
                owner
            );
            const account = await getAccount(this.connection, ata);
            return Number(account.amount);
        } catch (e) {
            return 0;
        }
    }
}
