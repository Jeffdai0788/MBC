import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';

let db: Database | null = null;

export async function initDatabase() {
    if (db) return db;

    const dbPath = path.join(__dirname, '../database.sqlite');

    db = await open({
        filename: dbPath,
        driver: sqlite3.Database
    });

    await db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            wallet_address TEXT PRIMARY KEY,
            polymarket_api_key TEXT,
            polymarket_secret TEXT,
            polymarket_passphrase TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS user_profiles (
            wallet_address TEXT PRIMARY KEY,
            username TEXT,
            bio TEXT,
            avatar_url TEXT,
            privacy_setting TEXT DEFAULT 'public', -- public, private, followers_only
            joined_date DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (wallet_address) REFERENCES users(wallet_address)
        );

        CREATE TABLE IF NOT EXISTS user_strategies (
            user_address TEXT,
            strategy_id TEXT,
            capital_allocated REAL DEFAULT 0,
            status TEXT DEFAULT 'active', -- active, paused
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (user_address, strategy_id)
        );

        CREATE TABLE IF NOT EXISTS trades (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_address TEXT,
            strategy_id TEXT,
            market_id TEXT,
            side TEXT, -- BUY, SELL
            price REAL,
            size REAL,
            pnl REAL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS signals (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            strategy_id TEXT,
            market_id TEXT,
            prediction TEXT, -- YES, NO
            confidence REAL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS social_connections (
            follower_address TEXT,
            following_address TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (follower_address, following_address)
        );

        CREATE TABLE IF NOT EXISTS achievements (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_address TEXT,
            achievement_type TEXT, -- first_trade, 10_wins, profitable_month, etc.
            achievement_data TEXT, -- JSON for additional info
            earned_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS activity_events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_address TEXT,
            event_type TEXT, -- strategy_purchased, signal_executed, strategy_published, milestone_achieved
            event_data TEXT, -- JSON with event details
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS strategy_reviews (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            strategy_id TEXT,
            user_address TEXT,
            rating INTEGER, -- 1-5
            comment TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    `);

    console.log('Database initialized at', dbPath);
    return db;
}

export async function getDatabase() {
    if (!db) {
        return await initDatabase();
    }
    return db;
}
