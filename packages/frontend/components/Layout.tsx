import React, { createContext, useContext, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import Image from "next/image";

// Dashboard context for global state
type DashboardMode = "trader" | "developer";

interface DashboardContextType {
    mode: DashboardMode;
    setMode: (mode: DashboardMode) => void;
}

const DashboardContext = createContext<DashboardContextType>({
    mode: "trader",
    setMode: () => { }
});

export const useDashboard = () => useContext(DashboardContext);

export default function Layout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const { publicKey } = useWallet();
    const [mode, setMode] = useState<DashboardMode>("trader");

    // Persist mode in localStorage
    useEffect(() => {
        if (typeof window !== "undefined") {
            const saved = localStorage.getItem("dashboardMode") as DashboardMode;
            if (saved) setMode(saved);
        }
    }, []);

    const handleModeChange = (newMode: DashboardMode) => {
        setMode(newMode);
        localStorage.setItem("dashboardMode", newMode);
        // Navigate to appropriate home
        if (newMode === "trader") {
            router.push("/");
        } else {
            router.push("/developer");
        }
    };

    // Navigation links based on mode
    const traderLinks = [
        { href: "/", label: "Discover" },
        { href: "/portfolio", label: "My Strategies" },
    ];

    const developerLinks = [
        { href: "/developer", label: "Dashboard" },
        { href: "/developer/create", label: "Create" },
        { href: "/developer/strategies", label: "My Strategies" },
    ];

    const navLinks = mode === "trader" ? traderLinks : developerLinks;

    return (
        <DashboardContext.Provider value={{ mode, setMode }}>
            <div className="app-container">
                <nav className="nav">
                    {/* Left: Logo & Partners */}
                    <div className="nav-brand">
                        <div className="nav-partners">
                            <img
                                src="/images/polymarket-logo.png"
                                alt="Polymarket"
                                height={24}
                                style={{ height: "24px", width: "auto" }}
                            />
                            <span className="nav-partner-divider">×</span>
                            <img
                                src="/images/solana.svg"
                                alt="Solana"
                                width={24}
                                height={24}
                            />
                        </div>

                        <Link href={mode === "trader" ? "/" : "/developer"} className="nav-logo-link">
                            <img
                                src="/images/polytrader-logo.png"
                                alt="Polytrader"
                                style={{ height: "40px", width: "auto" }}
                            />
                        </Link>
                    </div>

                    {/* Center: Mode Toggle */}
                    <div className="mode-toggle">
                        <button
                            className={`mode-btn ${mode === "trader" ? "active" : ""}`}
                            onClick={() => handleModeChange("trader")}
                        >
                            Trader
                        </button>
                        <button
                            className={`mode-btn ${mode === "developer" ? "active" : ""}`}
                            onClick={() => handleModeChange("developer")}
                        >
                            Developer
                        </button>
                    </div>

                    {/* Right: Nav Links + Wallet */}
                    <div className="nav-right">
                        <div className="nav-links">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={`nav-link ${router.pathname === link.href ? "active" : ""}`}
                                >
                                    {link.label}
                                </Link>
                            ))}
                        </div>
                        <WalletMultiButton />
                    </div>
                </nav>

                <main className="main">
                    {children}
                </main>
            </div>

            <style jsx>{`
                .mode-toggle {
                    display: flex;
                    background: var(--color-paper);
                    border: 1px solid var(--color-paper-warm);
                    padding: 4px;
                }
                .mode-btn {
                    width: 100px;
                    padding: 0.5rem 0;
                    font-size: 0.8125rem;
                    font-weight: 500;
                    background: transparent;
                    border: none;
                    color: var(--color-ink-muted);
                    cursor: pointer;
                    transition: all 0.2s ease;
                    text-align: center;
                }
                .mode-btn.active {
                    background: var(--color-ink);
                    color: var(--color-cream);
                }
                .mode-btn:hover:not(.active) {
                    color: var(--color-ink);
                }
            `}</style>
        </DashboardContext.Provider>
    );
}
