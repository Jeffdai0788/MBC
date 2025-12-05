
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { randomUUID } from 'crypto';

const ADJECTIVES = [
    "Alpha", "Quantum", "Rapid", "Steady", "Dynamic", "Global", "Smart", "Elite",
    "Prime", "Neural", "Deep", "Liquid", "Absolute", "Relative", "Systematic",
    "Automated", "High-Frequency", "Long-Term", "Swing", "Trend", "Value", "Growth"
];

const NOUNS = [
    "Momentum", "Flow", "Signals", "Arbitrage", "Yield", "Growth", "Value", "Trend",
    "Reversion", "Scalping", "Hedging", "Index", "Portfolio", "Fund", "Capital",
    "Ventures", "Systems", "Logic", "Intelligence", "Prediction", "Forecast"
];

const CATEGORIES = ["Crypto", "Sports", "Politics", "Finance", "Weather", "AI"];

async function seed() {
    const dbPath = path.join(__dirname, '../packages/server/database.sqlite');
    console.log(`Seeding database at ${dbPath}...`);

    const db = await open({
        filename: dbPath,
        driver: sqlite3.Database
    });

    // Clear existing strategies (optional, but good for clean slate as requested earlier)
    // await db.run("DELETE FROM created_strategies"); 
    // Actually, user said "generate 100 different strategies", maybe append? 
    // But earlier we cleared it. Let's append to whatever is there (which is likely empty or has 1-2 test ones).

    const stmt = await db.prepare(`
        INSERT INTO created_strategies (id, creator_address, name, description, ipfs_cid, category, status, list_price)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (let i = 0; i < 100; i++) {
        const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
        const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
        const name = `${adj} ${noun} ${Math.floor(Math.random() * 100)}`;

        const category = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
        const price = Math.floor(Math.random() * 9900) + 100; // 100 to 10000
        const id = randomUUID();
        const cid = `QmMock${randomUUID().replace(/-/g, '')}`;

        // Mock creator address
        const creator = `MockUser${Math.floor(Math.random() * 1000)}`;

        await stmt.run(
            id,
            creator,
            name,
            `A ${category.toLowerCase()} trading strategy focusing on ${noun.toLowerCase()} with ${adj.toLowerCase()} execution.`,
            cid,
            category,
            'listed',
            price
        );

        if (i % 10 === 0) process.stdout.write('.');
    }

    await stmt.finalize();
    console.log("\nSeeding complete! Added 100 strategies.");
}

seed().catch(console.error);
