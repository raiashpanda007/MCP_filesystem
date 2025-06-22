import asyncHandler from "../utils/asyncHandler";
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();
const promptController = asyncHandler(async (req, res) => {
    const { prompt } = req.body;
    if (!prompt) {
        return res.status(400).json({ error: 'Missing prompt' });
    }
    if (!process.env.OPENROUTER_API_KEY) {
        return res.status(500).json({ error: 'OPENROUTER_API_KEY is not set' });
    }
    const response = await axios.post(
        'https://openrouter.ai/api/v1/chat/completions',
        {
            model: 'mistralai/mistral-7b-instruct-v0.1',
            messages: [
                { role: 'system', content: 'You are a helpful assistant.' },
                { role: 'user', content: prompt },
            ],
        },
        {
            headers: {
                Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
            },
        }
    );

    const reply = response.data.choices?.[0]?.message?.content || '(no content)';
    res.json({ modelResponse: reply });

})

export default promptController;