import type { VercelRequest, VercelResponse } from '@vercel/node';
import client from '../lib/db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        // GET - Fetch all projects
        if (req.method === 'GET') {
            const result = await client.execute('SELECT * FROM projects ORDER BY created_at DESC');
            const projects = result.rows.map(row => ({
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
            await client.execute({
                sql: 'INSERT INTO projects (id, title, description, image_url, target_amount, current_amount, is_important, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
                args: [id, title, description, imageUrl, targetAmount, currentAmount || 0, isImportant ? 1 : 0, status || 'active', createdAt]
            });
            return res.status(201).json({ success: true });
        }

        // PUT - Update project
        if (req.method === 'PUT') {
            const { id, title, description, imageUrl, targetAmount, currentAmount, isImportant, status } = req.body;
            await client.execute({
                sql: 'UPDATE projects SET title = ?, description = ?, image_url = ?, target_amount = ?, current_amount = ?, is_important = ?, status = ? WHERE id = ?',
                args: [title, description, imageUrl, targetAmount, currentAmount, isImportant ? 1 : 0, status, id]
            });
            return res.status(200).json({ success: true });
        }

        // DELETE - Delete project
        if (req.method === 'DELETE') {
            const { id } = req.query;
            await client.execute({
                sql: 'DELETE FROM projects WHERE id = ?',
                args: [id as string]
            });
            return res.status(200).json({ success: true });
        }

        return res.status(405).json({ error: 'Method not allowed' });
    } catch (error: any) {
        console.error('API Error:', error);
        return res.status(500).json({ error: error.message || 'Internal server error' });
    }
}
