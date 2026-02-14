import type { VercelRequest, VercelResponse } from '@vercel/node';
import { v2 as cloudinary } from 'cloudinary';
import formidable from 'formidable';

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

export const config = {
    api: {
        bodyParser: false, // Disable default body parser to handle FormData
    },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const form = formidable();
        const [fields, files] = await form.parse(req);

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

        return res.status(200).json({
            success: true,
            imageUrl: uploadResult.secure_url
        });

    } catch (error: any) {
        console.error('Upload Error:', error);
        return res.status(500).json({ error: error.message || 'Internal server error' });
    }
}
