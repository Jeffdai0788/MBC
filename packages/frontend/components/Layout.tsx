import React from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

export default function Layout({ children }: { children: React.ReactNode }) {
    const router = useRouter();

    const navLinks = [
        { href: "/", label: "Marketplace" },
        { href: "/create", label: "Create Strategy" },
        { href: "/my-strategies", label: "My Strategies" },
    ];

    return (
        <div className="app-container">
            <nav className="nav">
                <Link href="/" className="nav-logo">
                    Strategy Marketplace
                </Link>

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

                <div className="nav-right">
                    <WalletMultiButton />
                </div>
            </nav>

            <main className="main">
                {children}
            </main>
        </div>
    );
}
