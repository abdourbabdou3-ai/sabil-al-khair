import type { VercelRequest, VercelResponse } from '@vercel/node';
import mysql from 'mysql2/promise';

// Lazy initialization of the pool
let pool: any = null;

function getPool() {
    if (!pool) {
        pool = mysql.createPool({
            uri: process.env.DATABASE_URL,
            waitForConnections: true,
            connectionLimit: 5,
            queueLimit: 0,
            ssl: {
                rejectUnauthorized: false
            }
        });
    }
    return pool;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        const db = getPool();

        // GET - Fetch all projects
        if (req.method === 'GET') {
            const [rows] = await db.query('SELECT * FROM projects ORDER BY created_at DESC');
            const projects = (rows as any[]).map(row => ({
                id: row.id,
                title: row.title,
                description: row.description,
                imageUrl: row.image_url,
                targetAmount: Number(row.target_amount),
                currentAmount: Number(row.current_amount),
                isImportant: Boolean(row.is_important),
                status: row.status,
                createdAt: Number(row.created_at)
            }));
            return res.status(200).json(projects);
        }

        // POST - Create new project
        if (req.method === 'POST') {
            const { id, title, description, imageUrl, targetAmount, currentAmount, isImportant, status, createdAt } = req.body;
            await db.execute(
                'INSERT INTO projects (id, title, description, image_url, target_amount, current_amount, is_important, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [id, title, description, imageUrl, targetAmount, currentAmount || 0, isImportant || false, status || 'active', createdAt]
            );
            return res.status(201).json({ success: true });
        }

        // PUT - Update project
        if (req.method === 'PUT') {
            const { id, title, description, imageUrl, targetAmount, currentAmount, isImportant, status } = req.body;
            await db.execute(
                'UPDATE projects SET title = ?, description = ?, image_url = ?, target_amount = ?, current_amount = ?, is_important = ?, status = ? WHERE id = ?',
                [title, description, imageUrl, targetAmount, currentAmount, isImportant, status, id]
            );
            return res.status(200).json({ success: true });
        }

        // DELETE - Delete project
        if (req.method === 'DELETE') {
            const { id } = req.query;
            await db.execute('DELETE FROM projects WHERE id = ?', [id]);
            return res.status(200).json({ success: true });
        }

        return res.status(405).json({ error: 'Method not allowed' });
    } catch (error: any) {
        console.error('API Error:', error);
        return res.status(500).json({ error: error.message || 'Internal server error' });
    }
}
