import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { FrontendSolanaClient } from "../lib/solanaClient";
import axios from "axios";
import bs58 from "bs58";

const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL!;

export default function Home() {
    const { publicKey, signMessage } = useWallet();
    const [strategy, setStrategy] = useState<any>(null);
    const [nftBalance, setNftBalance] = useState<number>(0);
    const [signalData, setSignalData] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const client = new FrontendSolanaClient();

    useEffect(() => {
        fetchStrategy();
    }, []);

    useEffect(() => {
        if (publicKey) {
            fetchNftBalance();
        } else {
            setNftBalance(0);
            setSignalData(null);
        }
    }, [publicKey]);

    const fetchStrategy = async () => {
        try {
            const data = await client.getStrategy();
            setStrategy(data);
        } catch (e) {
            console.error("Failed to fetch strategy:", e);
            setError("Failed to load strategy data.");
        }
    };

    const fetchNftBalance = async () => {
        if (!publicKey) return;
        try {
            const balance = await client.getNftBalance(publicKey);
            setNftBalance(balance);
        } catch (e) {
            console.error("Failed to fetch NFT balance:", e);
        }
    };

    const getSignal = async () => {
        if (!publicKey || !signMessage) return;
        setLoading(true);
        setError(null);

        try {
            const timestamp = Date.now();
            const message = `Login to Strategy Marketplace: ${timestamp}`;
            const messageBytes = new TextEncoder().encode(message);

            const signature = await signMessage(messageBytes);
            const signatureBase58 = bs58.encode(signature);

            const res = await axios.post(`${SERVER_URL}/signal`, {
                publicKey: publicKey.toBase58(),
                signature: signatureBase58,
                timestamp: timestamp
            });

            setSignalData(res.data);
        } catch (e: any) {
            console.error("Failed to get signal:", e);
            setError(e.response?.data?.error || "Failed to fetch signal.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white p-8 font-sans">
            <header className="flex justify-between items-center mb-12">
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
                    Strategy Marketplace
                </h1>
                <WalletMultiButton className="!bg-purple-600 hover:!bg-purple-700" />
            </header>

            <main className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Strategy Metadata Card */}
                <div className="bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-700">
                    <h2 className="text-xl font-semibold mb-4 text-purple-300">Strategy Details</h2>
                    {strategy ? (
                        <div className="space-y-4">
                            <div>
                                <label className="text-gray-400 text-sm">Strategy ID</label>
                                <p className="font-mono text-sm">{strategy.strategyId.toString()}</p>
                            </div>
                            <div>
                                <label className="text-gray-400 text-sm">API ID</label>
                                <p className="font-mono text-sm">{strategy.apiId}</p>
                            </div>
                            <div>
                                <label className="text-gray-400 text-sm">List Price</label>
                                <p className="text-lg font-bold">
                                    {strategy.listed ? `${strategy.listPrice.toNumber() / 1_000_000} USDC` : "Not Listed"}
                                </p>
                            </div>
                            <div>
                                <label className="text-gray-400 text-sm">Last Mid Price</label>
                                <p className="text-lg">{(strategy.lastMidBps / 100).toFixed(2)}%</p>
                            </div>
                            <div>
                                <label className="text-gray-400 text-sm">Last Update</label>
                                <p className="text-sm text-gray-300">
                                    {new Date(strategy.lastUpdateTs.toNumber() * 1000).toLocaleString()}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <p className="text-gray-400 animate-pulse">Loading strategy...</p>
                    )}
                </div>

                {/* User Action Panel */}
                <div className="bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-700 flex flex-col justify-between">
                    <div>
                        <h2 className="text-xl font-semibold mb-4 text-purple-300">Your Access</h2>
                        {publicKey ? (
                            <div className="mb-6">
                                <p className="text-sm text-gray-400 mb-2">Connected Wallet</p>
                                <p className="font-mono text-xs bg-gray-900 p-2 rounded text-gray-300 truncate">
                                    {publicKey.toBase58()}
                                </p>

                                <div className={`mt-4 p-3 rounded-lg border ${nftBalance > 0 ? 'border-green-500 bg-green-900/20' : 'border-red-500 bg-red-900/20'}`}>
                                    <p className={`font-bold ${nftBalance > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                        {nftBalance > 0 ? "✅ You own this Strategy NFT" : "❌ You do not own this NFT"}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <p className="text-gray-400 mb-6">Connect your wallet to check access.</p>
                        )}
                    </div>

                    <div>
                        <button
                            onClick={getSignal}
                            disabled={!publicKey || nftBalance === 0 || loading}
                            className={`w-full py-4 rounded-lg font-bold text-lg transition-all ${!publicKey || nftBalance === 0
                                    ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                                    : "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-lg hover:shadow-purple-500/25"
                                }`}
                        >
                            {loading ? "Fetching Signal..." : "Get Live Signal"}
                        </button>

                        {error && (
                            <div className="mt-4 p-3 bg-red-900/50 border border-red-500 rounded text-red-200 text-sm">
                                {error}
                            </div>
                        )}

                        {signalData && (
                            <div className="mt-6 p-4 bg-gray-900 rounded-lg border border-purple-500/30">
                                <h3 className="text-sm text-purple-400 uppercase tracking-wider mb-2">Current Signal</h3>
                                <div className="flex items-center justify-between">
                                    <span className={`text-3xl font-black ${signalData.signal === 'BUY_YES' ? 'text-green-400' :
                                            signalData.signal === 'SELL_YES' ? 'text-red-400' : 'text-yellow-400'
                                        }`}>
                                        {signalData.signal}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                        {new Date(signalData.lastUpdate).toLocaleTimeString()}
                                    </span>
                                </div>
                                <p className="text-xs text-gray-400 mt-2">{signalData.description}</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
