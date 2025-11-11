require('dotenv').config();
const express = require('express');

// We use the standard 'openai' SDK for Groq API
const { OpenAI } = require('openai'); 
const cors = require('cors'); 
const app = express();
const port = 3000; 

// --- 1. CONFIGURE GROQ CLIENT ---
// This initializes the client for the ultra-fast Groq API.
// It automatically picks up the GROQ_API_KEY environment variable set on Render.
const groq = new OpenAI({
    baseURL: "https://api.groq.com/openai/v1",
    apiKey: process.env.GROQ_API_KEY, 
});
// ------------------------------------

// --- 2. CONFIGURE CORS FOR YOUR LIVE DOMAIN ---
// This explicit setting solves the "CORS policy has been blocked" error.
const allowedOrigin = 'https://promptyyai.netlify.app';

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests from your specific Netlify domain
        if (origin === allowedOrigin) {
            callback(null, true);
        } 
        // Allow requests with no origin (like local development or curl)
        else if (!origin) {
            callback(null, true);
        }
        // Deny all other origins (important for security)
        else {
            callback(new Error('Not allowed by CORS'), false);
        }
    }
}));
// ----------------------------------------------

app.use(express.json()); 

app.post('/generate', async (req, res) => {
    try {
        const { category, userNeed } = req.body; 

        if (!userNeed || !category) {
            return res.status(400).json({ error: 'category and userNeed are required' });
        }

        // --- 3. AI Persona Logic ---
        let expertPersona = "";
        switch (category) {
            case "student":
                expertPersona = "You are an expert professor and learning coach.";
                break;
            case "creative":
                expertPersona = "You are an award-winning art director and creative strategist.";
                break;
            case "business":
                expertPersona = "You are a top-tier marketing executive and business consultant.";
                break;
            case "developer":
                expertPersona = "You are a 10x principal software engineer and system architect.";
                break;
            case "general":
            default:
                expertPersona = "You are a helpful and highly skilled general assistant.";
                break;
        }
        
        // Final Prompt Construction
        const masterPrompt = `
            ${expertPersona}
            
            A user has a simple need: "${userNeed}".
            
            Your task is to generate a single, highly detailed, and professional prompt
            that the user can copy and paste into another AI tool.
            
            Return ONLY the generated prompt.
        `;

        // --- 4. GROQ API Call ---
        const response = await groq.chat.completions.create({
            // The currently supported and fast model
            model: "llama-3.1-8b-instant", 
            messages: [{ role: "user", content: masterPrompt }],
            temperature: 0.7, 
        });
        
        const generatedPromptText = response.choices[0].message.content;

        res.json({ generatedPrompt: generatedPromptText });

    } catch (error) {
        console.error('Error generating prompt:', error);
        // This response will be caught by the frontend
        res.status(500).json({ error: 'Failed to generate prompt. Check Groq API key and Render logs.' });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
    console.log('Waiting for requests at /generate ...');
});
