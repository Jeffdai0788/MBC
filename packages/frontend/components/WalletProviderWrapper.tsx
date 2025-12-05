"use client";

import React from "react";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { PhantomWalletAdapter, SolflareWalletAdapter } from "@solana/wallet-adapter-wallets";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { clusterApiUrl } from "@solana/web3.js";

// Default styles
import "@solana/wallet-adapter-react-ui/styles.css";

interface WalletProviderWrapperProps {
    children: React.ReactNode;
}

const network = WalletAdapterNetwork.Devnet;
const endpoint = process.env.NEXT_PUBLIC_RPC_URL || clusterApiUrl(network);
const wallets = [
    new PhantomWalletAdapter(),
    new SolflareWalletAdapter(),
];

export default function WalletProviderWrapper({ children }: WalletProviderWrapperProps) {
    return (
        <ConnectionProvider endpoint={endpoint}>
            <WalletProvider wallets={wallets} autoConnect>
                <WalletModalProvider>
                    {children}
                </WalletModalProvider>
            </WalletProvider>
        </ConnectionProvider>
    );
}
