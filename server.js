require('dotenv').config();
const express = require('express');
const cors = require('cors'); // We are now using generic CORS to fix the deployment issue
const { OpenAI } = require('openai'); // Used for Groq compatibility

const app = express();
const port = 3000; 

// --- 1. CONFIGURE GROQ CLIENT ---
// Initializes the client for the ultra-fast Groq API.
// It uses the GROQ_API_KEY environment variable.
const groq = new OpenAI({
    baseURL: "https://api.groq.com/openai/v1",
    apiKey: process.env.GROQ_API_KEY, 
});
// ------------------------------------

// --- 2. BULLETPROOF CORS CONFIGURATION ---
// This is the fix to allow your Netlify frontend to talk to the Render backend.
app.use(cors()); 
// -----------------------------------------

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
                expertPersona = "You are an expert professor and learning coach focused on clarity, structure, and academic rigor.";
                break;
            case "creative":
                expertPersona = "You are an award-winning art director and creative strategist, specializing in visual language and tone.";
                break;
            case "business":
                expertPersona = "You are a top-tier marketing executive and business consultant, specializing in ROI and clear objectives.";
                break;
            case "developer":
                expertPersona = "You are a 10x principal software engineer and system architect, specializing in logic, efficiency, and specific language syntax.";
                break;
            case "general":
            default:
                expertPersona = "You are a helpful and highly skilled general assistant. Maintain a friendly yet professional tone.";
                break;
        }
        
        // Final Prompt Construction
        const masterPrompt = `
            ${expertPersona}
            
            A user has a simple need: "${userNeed}".
            
            Your task is to generate a single, highly detailed, and professional prompt
            that the user can copy and paste into another AI tool (like a large language model or image generator).
            
            The generated prompt must be highly effective for the user's selected role.
            
            Return ONLY the generated prompt.
        `;

        // --- 4. GROQ API Call ---
        const response = await groq.chat.completions.create({
            model: "llama-3.1-8b-instant", // The current, fast model
            messages: [{ role: "user", content: masterPrompt }],
            temperature: 0.7, 
        });
        
        const generatedPromptText = response.choices[0].message.content;

        res.json({ generatedPrompt: generatedPromptText });

    } catch (error) {
        console.error('Error generating prompt:', error);
        res.status(500).json({ error: 'Failed to generate prompt. Check Groq API key and Render logs.' });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
    console.log('Waiting for requests at /generate ...');
});
