# PolyStrategies

PolyStrategies is the world's first decentralized marketplace for algorithmic trading strategies, built on Solana. We are pioneering the era of **Algorithmic Markets**, where trading logic itself—not just the asset it trades—becomes a tradable asset class.


## The Vision: Democratizing Algorithmic Trading

We believe the future of finance is automated, transparent, and accessible.
*   **Democratization**: Access to institutional-grade algorithmic trading has historically been gated by high capital requirements and technical barriers. PolyStrategies breaks down these walls, allowing anyone to build, monetize, or invest in sophisticated trading strategies.
*   **Algorithmic Markets**: This is the canonical **second generation of prediction markets**. While first-gen markets allow you to bet on an outcome, PolyStrategies allows you to invest in the *method* of achieving that outcome. It's not just about "who wins," but "how to win repeatedly."
*   **Returns on Autopilot**: For investors, it's a "set and forget" tokenized alpha. For developers, it's a direct channel to monetize intellectual property without intermediaries.

## Architecture & Data Exchange

The core innovation of PolyStrategies is the **tokenization of logic**.

### 1. Strategy as NFT
Every algorithm submitted to the platform is minted as a unique **Non-Fungible Token (NFT)** on the Solana blockchain.
*   **Ownership = Access**: Holding the NFT grants the wallet exclusive cryptographic access to the real-time execution signals of that strategy.
*   **Transferability**: Strategies can be bought, sold, or transferred on the secondary market, retaining their historical performance data.

### 2. On-Chain Storage & Verification
Trust is paramount. We utilize Solana's high-throughput ledger to prove performance before you buy.
*   **Immutable Registry**: The `Strategy` Program Derived Address (PDA) stores critical metadata:
    *   `creator`: The original architect of the code.
    *   `strategy_hash`: A cryptographic hash of the source code, ensuring version control and integrity.
    *   `last_mid_bps`: Real-time performance metrics (e.g., basis points return) written directly to the chain by oracles.
*   **Data Flow**:
    1.  **Execution**: The Strategy Engine runs the JS code off-chain in a secure sandbox.
    2.  **Oracle Update**: Verified results are pushed on-chain via the `update_oracle` instruction.
    3.  **Verification**: The frontend reads this on-chain data to render tamper-proof performance sparklines.

### 3. Atomic Exchange Protocol
Our custom Anchor smart contract (`programs/strategy_marketplace`) facilitates trustless exchange.
*   **Listing**: When a developer lists a strategy, the NFT is transferred to a Program Escrow Account.
*   **Buying**: The `buy_strategy` instruction executes an **atomic swap**:
    *   Payment (SPL Token) moves from Buyer → Seller.
    *   Strategy NFT moves from Escrow → Buyer.
    *   This happens in a single transaction, eliminating counterparty risk.

## Tech Stack

We leverage a cutting-edge stack to deliver a seamless, premium experience.

*   **Solana Blockchain (Anchor Framework)**: ensuring sub-second finality and low transaction costs for all on-chain interactions (Minting, Listing, Buying, Oracle Updates).
*   **Frontend (Next.js & TypeScript)**: A highly responsive, typified React application delivering a sophisticated dashboard for traders and developers.
*   **Styling (Tailwind CSS)**: Implementing a modern, "Glassmorphism" design system that feels premium and futuristic.
*   **Backend (Node.js)**: Handles metadata indexing, IPFS simulation, and the secure execution environment for strategy code.

## Getting Started

### Prerequisites
*   Node.js (v18+)
*   Rust & Cargo
*   Solana CLI & Anchor CLI

### Installation

1.  **Clone & Install**
    ```bash
    git clone <repo-url>
    npm install
    ```

2.  **Launch Local Environment**
    ```bash
    # Terminal 1: Start Solana Validator
    solana-test-validator

    # Terminal 2: Deploy Smart Contract
    anchor build && anchor deploy

    # Terminal 3: Start Backend
    cd packages/server && npm run dev

    # Terminal 4: Start Frontend
    cd packages/frontend && npm run dev
    ```

## Contract Addresses
*   **Program ID**: `71sBGrD8VytsD9EUnon83CiCmfHN41LMgoWt975AHewm` (Devnet)

---

Built for the Solana Hackathon 2025.
