import { useState } from "react";
import { useConnection, useWallet, useAnchorWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { StrategyTransactions, CreateStrategyParams, ListStrategyParams, BuyStrategyParams } from "../lib/transactions/strategyTransactions";

export interface TransactionState {
    loading: boolean;
    error: string | null;
    signature: string | null;
}

export function useStrategyTransactions() {
    const { connection } = useConnection();
    const { publicKey } = useWallet();
    const wallet = useAnchorWallet();

    const [createState, setCreateState] = useState<TransactionState>({ loading: false, error: null, signature: null });
    const [buyState, setBuyState] = useState<TransactionState>({ loading: false, error: null, signature: null });
    const [listState, setListState] = useState<TransactionState>({ loading: false, error: null, signature: null });

    const createStrategy = async (params: CreateStrategyParams) => {
        if (!wallet || !publicKey) {
            throw new Error("Wallet not connected");
        }

        setCreateState({ loading: true, error: null, signature: null });

        try {
            const txBuilder = new StrategyTransactions(connection, wallet);
            const { transaction, strategyPda, strategyMint } = await txBuilder.createStrategy(params);
            const signature = await txBuilder.sendTransaction(transaction);

            setCreateState({ loading: false, error: null, signature });
            return { signature, strategyPda: strategyPda.toBase58(), strategyMint: strategyMint.toBase58() };
        } catch (error: any) {
            const errorMsg = error.message || "Transaction failed";
            setCreateState({ loading: false, error: errorMsg, signature: null });
            throw error;
        }
    };

    const buyStrategy = async (params: BuyStrategyParams) => {
        if (!wallet || !publicKey) {
            throw new Error("Wallet not connected");
        }

        setBuyState({ loading: true, error: null, signature: null });

        try {
            const txBuilder = new StrategyTransactions(connection, wallet);
            const { transaction } = await txBuilder.buyStrategy(params);
            const signature = await txBuilder.sendTransaction(transaction);

            setBuyState({ loading: false, error: null, signature });
            return { signature };
        } catch (error: any) {
            const errorMsg = error.message || "Purchase failed";
            setBuyState({ loading: false, error: errorMsg, signature: null });
            throw error;
        }
    };

    const listStrategy = async (params: ListStrategyParams) => {
        if (!wallet || !publicKey) {
            throw new Error("Wallet not connected");
        }

        setListState({ loading: true, error: null, signature: null });

        try {
            const txBuilder = new StrategyTransactions(connection, wallet);
            const { transaction } = await txBuilder.listStrategy(params);
            const signature = await txBuilder.sendTransaction(transaction);

            setListState({ loading: false, error: null, signature });
            return { signature };
        } catch (error: any) {
            const errorMsg = error.message || "Listing failed";
            setListState({ loading: false, error: errorMsg, signature: null });
            throw error;
        }
    };

    return {
        createStrategy,
        buyStrategy,
        listStrategy,
        states: {
            create: createState,
            buy: buyState,
            list: listState,
        },
    };
}
