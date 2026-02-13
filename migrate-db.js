import { createClient } from '@libsql/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function migrate() {
    console.log('🚀 Starting Turso Database Migration...');

    const url = process.env.TURSO_DATABASE_URL;
    const authToken = process.env.TURSO_AUTH_TOKEN;

    if (!url || !authToken) {
        console.error('❌ Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN in environment variables.');
        return;
    }

    const client = createClient({
        url: url,
        authToken: authToken,
    });

    try {
        console.log('📡 Connecting to Turso...');

        // Define SQLite compatible schema
        const schema = [
            `CREATE TABLE IF NOT EXISTS projects (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                description TEXT,
                image_url TEXT,
                target_amount REAL NOT NULL DEFAULT 0,
                current_amount REAL NOT NULL DEFAULT 0,
                is_important INTEGER DEFAULT 0,
                status TEXT DEFAULT 'active',
                created_at INTEGER NOT NULL
            )`,
            `CREATE TABLE IF NOT EXISTS reports (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                description TEXT,
                total_collected REAL NOT NULL DEFAULT 0,
                date INTEGER NOT NULL
            )`,
            `CREATE TABLE IF NOT EXISTS settings (
                id INTEGER PRIMARY KEY,
                mosque_name TEXT NOT NULL DEFAULT 'سبيل الخير',
                rip TEXT DEFAULT ''
            )`,
            `CREATE TABLE IF NOT EXISTS global_balance (
                id INTEGER PRIMARY KEY,
                amount REAL NOT NULL DEFAULT 0
            )`,
            `INSERT OR IGNORE INTO settings (id, mosque_name, rip) VALUES (1, 'سبيل الخير', '')`,
            `INSERT OR IGNORE INTO global_balance (id, amount) VALUES (1, 0)`
        ];

        for (const sql of schema) {
            await client.execute(sql);
            console.log('✅ Executed:', sql.substring(0, 50) + '...');
        }

        console.log('🎉 Migration Successful! All tables created on Turso.');

    } catch (error) {
        console.error('❌ Migration Failed:', error.message);
    }
}

migrate();
