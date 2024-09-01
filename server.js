// server.js

import fetch from 'node-fetch';

const express = require('express');
const app = express();
const port = 3000; // You can use any available port

// Middleware to parse JSON bodies
app.use(express.json());

// Endpoint to get AI suggestions
app.post('/api/suggest', async (req, res) => {
    const { field } = req.body;

    if (!field) {
        return res.status(400).json({ error: 'Field is required' });
    }

    const apiUrl = 'https://gemini.googleapis.com/v1/suggestions'; // Replace with actual Gemini API URL
    const apiKey = 'YOUR_GEMINI_API_KEY'; // Replace with your actual API key

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({ field }),
        });

        if (!response.ok) {
            throw new Error('AI service request failed');
        }

        const data = await response.json();
        res.json({ suggestion: data.suggestion });
    } catch (error) {
        console.error('Error fetching AI suggestion:', error);
        res.status(500).json({ error: 'Failed to fetch suggestion' });
    }
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
