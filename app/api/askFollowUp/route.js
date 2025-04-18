import { GoogleGenerativeAI } from '@google/generative-ai';
// Removed Redis import as we get context/query directly
import { NextResponse } from 'next/server';

// Initialize AI client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY);

// --- ROBUST Helper function to clean API response text (Copied from getResponses) ---
// (Keep this function as it's still used for the follow-up response)
function cleanApiResponseText(text) {
    if (!text || typeof text !== 'string') return '';
    let cleaned = text;
    // 1. Remove markdown code fences first
    cleaned = cleaned.replace(/^```(?:json|markdown|text)?\s*$/gm, '');
    cleaned = cleaned.replace(/^\s*```/, '');
    cleaned = cleaned.replace(/```\s*$/, '');
    // 2. Trim outer whitespace
    cleaned = cleaned.trim();
    // 3. Remove leading junk (allow common opening chars)
    cleaned = cleaned.replace(/^[\s,'"\[{(–—*>#:;\.`\-\*]+/, '');
    // *** FIX: Refined trailing regex - DO NOT remove trailing asterisks '*' or periods '.' ***
    cleaned = cleaned.replace(/[\s,'"\]})–—>`:;]+$/, ''); // Removed '\.' and '\*' from this regex
    // 4. Handle potential JSON string escapes
    if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
        try {
            const parsed = JSON.parse(cleaned);
            if (typeof parsed === 'string') cleaned = parsed;
        } catch (e) {
            cleaned = cleaned.substring(1, cleaned.length - 1);
        }
    }
    // 5. Final trim
    return cleaned.trim();
}

// --- PERSONA DEFINITIONS (Simplified for this route) ---
// *** CHANGE: Use simple names matching the frontend/judge API ***
// We only need the names to validate the personaId and potentially use in prompts.
// The detailed prompts from /app/prompts/* are not directly used here.
const validPersonaNames = ["Therapist", "Analyst", "Coach"];

// Define the core perspective for prompt construction (can be simplified)
const personaPerspectives = {
    "Therapist": "objective psychotherapist analysing interaction dynamics",
    "Analyst": "ruthless logical analyst",
    "Coach": "results-oriented strategic coach"
};


export async function POST(request) {
    let requestBody;
    try {
        requestBody = await request.json();
    } catch (e) {
        console.error("ASK_FOLLOWUP Error parsing request body:", e);
        return NextResponse.json({ error: "Invalid request format. Ensure you are sending valid JSON." }, { status: 400 });
    }

    // Updated: Expect context and query directly, remove originalContextId
    const { question, personaId, context, query, history } = requestBody; // history is optional

    // --- Input Validation ---
    if (!question || typeof question !== 'string' || question.trim().length < 3) {
        console.warn("ASK_FOLLOWUP Validation failed: Question insufficient.");
        return NextResponse.json({ error: "Follow-up question required (min 3 chars)." }, { status: 400 });
    }
    if (!personaId || typeof personaId !== 'string' || !validPersonaNames.includes(personaId)) { // *** CHANGE: Validate against simple names ***
        console.warn(`ASK_FOLLOWUP Validation failed: Persona ID missing or invalid: ${personaId}`);
        return NextResponse.json({ error: `Invalid persona specified: ${personaId}` }, { status: 400 });
    }
    // Added validation for context and query
    if (!context || typeof context !== 'string' || context.trim().length < 10) {
        console.warn("ASK_FOLLOWUP Validation failed: Context insufficient.");
        return NextResponse.json({ error: "Context description required (min 10 chars)." }, { status: 400 });
    }
    if (!query || typeof query !== 'string' || query.trim().length < 5) {
        console.warn("ASK_FOLLOWUP Validation failed: Original query insufficient.");
        return NextResponse.json({ error: "Original query required (min 5 chars)." }, { status: 400 });
    }

    // --- API Key Check ---
    if (!process.env.GEMINI_API_KEY && !process.env.GOOGLE_API_KEY) {
        console.error("ASK_FOLLOWUP API Key Error: Env var missing.");
        return NextResponse.json({ error: "Server configuration error: API key missing." }, { status: 500 });
    }

    // --- Get Persona Perspective ---
    // *** CHANGE: Use the simple personaId directly ***
    const perspective = personaPerspectives[personaId];
    if (!perspective) {
        // This should technically be caught by the validation above, but as a safeguard:
        console.error(`ASK_FOLLOWUP Error: Could not find perspective for valid persona ID "${personaId}". This indicates an internal inconsistency.`);
        return NextResponse.json({ error: `Internal server error processing persona: ${personaId}` }, { status: 500 });
    }


    // --- Prepare Conversation History String (Optional) ---
    let conversationHistoryString = '';
    if (Array.isArray(history) && history.length > 0) {
        conversationHistoryString = `
--- Previous Conversation Turns ---
${history.map(turn => `You asked: ${turn.question}\n${personaId} answered: ${turn.answer}`).join('\n\n')}
--- End Previous Conversation ---
`;
    }

    // --- Construct Prompt (Using direct context/query and perspective) ---
    // *** CHANGE: Construct prompt using the perspective string ***
    const fullPrompt = `
You are acting as a ${perspective}.
**Strictly adhere to British English spelling, grammar, and phrasing.** Address 'you' directly. Use paragraph breaks (two newlines) for readability. Use **bold text using double asterisks** for emphasis on key insights where appropriate, but do not rely on it for structure. Be **concise**.

--- Original Situation Context ---
"""${context}"""

--- Your Original Query ---
"${query}"
${conversationHistoryString}
--- Your Current Follow-up Question ---
You ask: "${question}"

---
**Instructions for this Follow-up Response:**
Respond *directly* and *conversationally* to the CURRENT follow-up question ("${question}").
Maintain your core ${personaId} perspective (e.g., strategic for Coach, logical for Analyst, psychological for Therapist), but **DO NOT rigidly follow any multi-part structure** from previous instructions.
Focus on providing a clear, concise answer to the specific question asked, integrating insights from the original context/query and conversation history as needed.
Use paragraph breaks (two newlines) and **bold text** for emphasis where appropriate. Aim for approximately 100-150 words.
`;
    console.log(`ASK_FOLLOWUP: Sending prompt to ${personaId} (first 400 chars): ${fullPrompt.substring(0, 400)}...`);

    // --- Call AI Model ---
    // Consider using the same model as /api/judge if consistency is desired
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
    const generationConfig = {
        temperature: 0.6,
        maxOutputTokens: 800 // Keep sufficient tokens for conversational response
    };

    try {
        const result = await model.generateContent(fullPrompt, generationConfig);
        const response = await result.response;
        const rawText = response.text ? response.text() : '';
        console.log(`ASK_FOLLOWUP Raw ${personaId} Response:`, JSON.stringify(rawText.substring(0,100))+"...");
        let cleanedText = cleanApiResponseText(rawText);
        console.log(`ASK_FOLLOWUP Cleaned ${personaId} Response:`, JSON.stringify(cleanedText.substring(0,100))+"...");

        if (!cleanedText || cleanedText.length < 5 || cleanedText.startsWith("[")) {
             console.error(`ASK_FOLLOWUP Empty or invalid response from ${personaId} after cleaning for question: ${question}`);
             return NextResponse.json({ error: "Analysis Error: Empty or invalid response received from AI." }, { status: 500 });
        }

        // Basic check for UK English (optional, can be removed)
        if (/\b(analyze|behavior|color|center|realize|optimize)\b/i.test(cleanedText)) {
            console.warn(`ASK_FOLLOWUP Potential US spelling detected in ${personaId} response.`);
        }

        // Return the successful answer
        return NextResponse.json({ answer: cleanedText }, { status: 200 });

    } catch (error) {
        console.error(`ASK_FOLLOWUP Error generating response for ${personaId}:`, error);
        let errorMessage = `[Analysis Error: ${error.message || 'Unknown error'}]`;
        let statusCode = 500;
        const blockReason = error?.response?.promptFeedback?.blockReason;

        if (blockReason) {
            errorMessage = `Content blocked by safety filters: ${blockReason}`;
            statusCode = 400;
        } else if (error.message) {
            if (error.message.includes("API key not valid")) {
                errorMessage = "Server configuration error: Invalid API Key.";
                statusCode = 500;
            } else if (error.message.includes("quota")) {
                errorMessage = "API quota exceeded. Please try again later.";
                statusCode = 429;
            } else {
                errorMessage = `AI generation failed: ${error.message}`;
                statusCode = 500;
            }
        }

        return NextResponse.json({ error: errorMessage.replace(/^\[|\]$/g, '') }, { status: statusCode });
    }
}