require('dotenv').config();
const express = require('express');

// We use the standard 'openai' SDK
const { OpenAI } = require('openai'); 
const cors = require('cors'); 
const app = express();
const port = 3000; 

// --- NEW CLIENT INITIALIZATION FOR GROQ ---
// We initialize the OpenAI client but point it to the Groq API endpoint.
// It will automatically pick up the GROQ_API_KEY environment variable.
const groq = new OpenAI({
    baseURL: "https://api.groq.com/openai/v1", // Groq's standard endpoint
    apiKey: process.env.GROQ_API_KEY, 
});
// ------------------------------------------

app.use(cors()); 
app.use(express.json()); 

app.post('/generate', async (req, res) => {
    try {
        const { category, userNeed } = req.body; 

        if (!userNeed || !category) {
            return res.status(400).json({ error: 'category and userNeed are required' });
        }

        // --- AI Persona Logic (Unchanged) ---
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
        // ------------------------------------

        // The master prompt now dynamically includes the persona
        const masterPrompt = `
            ${expertPersona}
            
            A user has a simple need: "${userNeed}".
            
            Your task is to generate a single, highly detailed, and professional prompt
            that the user can copy and paste into another AI tool.
            
            Return ONLY the generated prompt.
        `;

        // --- NEW API CALL STRUCTURE (Groq) ---
        const response = await groq.chat.completions.create({
            // Groq's Llama model is optimized for high speed
            model: "llama-3.1-8b-instant", 
            messages: [{ role: "user", content: masterPrompt }],
            temperature: 0.7, 
        });
        
        // Extract the text from the new response format
        const generatedPromptText = response.choices[0].message.content;

        res.json({ generatedPrompt: generatedPromptText });

    } catch (error) {
        console.error('Error generating prompt:', error);
        res.status(500).json({ error: 'Failed to generate prompt. Check your API key and connection.' });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
    console.log('Waiting for requests at /generate ...');
});