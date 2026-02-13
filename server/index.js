const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const { v2: cloudinary } = require('cloudinary');
const formidable = require('formidable');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Lazy initialization of the pool
let pool = null;

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

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Projects API
app.get('/api/projects', async (req, res) => {
    try {
        const db = getPool();
        const [rows] = await db.query('SELECT * FROM projects ORDER BY created_at DESC');
        const projects = (rows).map(row => ({
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
        res.json(projects);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/projects', async (req, res) => {
    try {
        const { id, title, description, imageUrl, targetAmount, currentAmount, isImportant, status, createdAt } = req.body;
        const db = getPool();
        await db.execute(
            'INSERT INTO projects (id, title, description, image_url, target_amount, current_amount, is_important, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [id, title, description, imageUrl, targetAmount, currentAmount || 0, isImportant || false, status || 'active', createdAt]
        );
        res.status(201).json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/projects', async (req, res) => {
    try {
        const { id, title, description, imageUrl, targetAmount, currentAmount, isImportant, status } = req.body;
        const db = getPool();
        await db.execute(
            'UPDATE projects SET title = ?, description = ?, image_url = ?, target_amount = ?, current_amount = ?, is_important = ?, status = ? WHERE id = ?',
            [title, description, imageUrl, targetAmount, currentAmount, isImportant, status, id]
        );
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/projects', async (req, res) => {
    try {
        const { id } = req.query;
        const db = getPool();
        await db.execute('DELETE FROM projects WHERE id = ?', [id]);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Reports API
app.get('/api/reports', async (req, res) => {
    try {
        const db = getPool();
        const [rows] = await db.query('SELECT * FROM reports ORDER BY date DESC');
        const reports = (rows).map(row => ({
            id: row.id,
            title: row.title,
            description: row.description,
            totalCollected: Number(row.total_collected),
            date: Number(row.date)
        }));
        res.json(reports);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/reports', async (req, res) => {
    try {
        const { id, title, description, totalCollected, date } = req.body;
        const db = getPool();
        await db.execute(
            'INSERT INTO reports (id, title, description, total_collected, date) VALUES (?, ?, ?, ?, ?)',
            [id, title, description, totalCollected, date]
        );
        res.status(201).json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/reports', async (req, res) => {
    try {
        const { id, title, description } = req.body;
        const db = getPool();
        await db.execute(
            'UPDATE reports SET title = ?, description = ? WHERE id = ?',
            [title, description, id]
        );
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/reports', async (req, res) => {
    try {
        const { id } = req.query;
        const db = getPool();
        await db.execute('DELETE FROM reports WHERE id = ?', [id]);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Settings API
app.get('/api/settings', async (req, res) => {
    try {
        const db = getPool();
        const [rows] = await db.query('SELECT * FROM settings WHERE id = 1');
        if ((rows).length === 0) {
            return res.json({ mosqueName: 'سبيل الخير', rip: '' });
        }
        res.json({
            mosqueName: (rows)[0].mosque_name,
            rip: (rows)[0].rip
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/settings', async (req, res) => {
    try {
        const { mosqueName, rip } = req.body;
        const db = getPool();
        await db.execute(
            'UPDATE settings SET mosque_name = ?, rip = ? WHERE id = 1',
            [mosqueName, rip]
        );
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Balance API
app.get('/api/balance', async (req, res) => {
    try {
        const db = getPool();
        const [rows] = await db.query('SELECT amount FROM global_balance WHERE id = 1');
        if ((rows).length === 0) {
            return res.json({ amount: 0 });
        }
        res.json({ amount: Number((rows)[0].amount) });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/balance', async (req, res) => {
    try {
        const { amount } = req.body;
        const db = getPool();
        await db.execute(
            'UPDATE global_balance SET amount = ? WHERE id = 1',
            [amount]
        );
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Upload API
app.post('/api/upload', async (req, res) => {
    try {
        const form = formidable();
        form.parse(req, async (err, fields, files) => {
            if (err) return res.status(500).json({ error: err.message });

            if (!files.image) {
                return res.status(400).json({ error: 'No image file provided' });
            }

            const file = Array.isArray(files.image) ? files.image[0] : files.image;
            if (!file) {
                return res.status(400).json({ error: 'Invalid file upload' });
            }

            const uploadResult = await cloudinary.uploader.upload(file.filepath, {
                folder: 'sabil-al-khair/projects',
            });

            res.json({
                success: true,
                imageUrl: uploadResult.secure_url
            });
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
