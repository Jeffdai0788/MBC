
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';

async function deleteStrategies() {
    const dbPath = path.join(__dirname, '../packages/server/database.sqlite');
    console.log(`Opening database at ${dbPath}...`);

    const db = await open({
        filename: dbPath,
        driver: sqlite3.Database
    });

    // Check what we are about to delete
    const toDelete = await db.all(`
        SELECT id, name, creator_address FROM created_strategies 
        WHERE name LIKE 'BTC Momentum%' OR name LIKE 'AUTH%'
    `);

    console.log("Found strategies to delete:", toDelete);

    if (toDelete.length > 0) {
        await db.run(`
            DELETE FROM created_strategies 
            WHERE name LIKE 'BTC Momentum%' OR name LIKE 'AUTH%'
        `);
        console.log(`Deleted ${toDelete.length} strategies.`);
    } else {
        console.log("No matching strategies found.");
    }
}

deleteStrategies().catch(console.error);
