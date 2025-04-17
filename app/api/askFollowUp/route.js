import { GoogleGenerativeAI } from '@google/generative-ai';
// Removed Redis import as we get context/query directly
// import { Redis } from '@upstash/redis';
import { NextResponse } from 'next/server';

// Initialize AI client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY);
// Removed Redis client initialization
// const redis = new Redis({
//   url: process.env.STORAGE_KV_REST_API_URL,
//   token: process.env.STORAGE_KV_REST_API_TOKEN,
// });

// --- ROBUST Helper function to clean API response text (Copied from getResponses) ---
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

// --- PERSONA PROMPTS (Copied from getResponses - ensure consistency) ---
const personas = [
    {
        name: "Therapist (Interaction Dynamics)",
        prompt: `
You are an objective psychotherapist analysing interaction dynamics. **Strictly adhere to British English spelling, grammar, and phrasing.** Address 'you' directly. Use paragraph breaks (two newlines) for readability. Use **bold text using double asterisks** for emphasis on key insights where appropriate, but do not rely on it for structure. Be **concise**.

Based *exclusively* on the provided context and considering the user's query:
*   Identify the **core psychological dynamic** at play.
*   Identify the **primary psychological conflict** evident. **Validate objective concerns** first if applicable.
*   Briefly analyse the likely **emotional drivers and assumptions** for **both** parties shown.
*   Identify the main **communication breakdown** and **negative feedback loop**.
*   Briefly reflect on any **apparent biases** evident in *your description*.
        `
    },
    {
        name: "Analyst (Logical Assessment)",
        prompt: `
You are a ruthless logical analyst. **Strictly adhere to British English spelling, grammar, and phrasing.** Address 'you' directly. Use paragraph breaks (two newlines). Use **bold text using double asterisks** for emphasis on key terms/conclusions where appropriate, but do not rely on it for structure. **Be extremely concise and definitive.** NO hedging.

State your definitive conclusion (Yes/No/Partially) to the user's query **first**.

Then, justify this by assessing the logic: Identify any **Unsupported assumptions**. State the **Primary trigger**. Assess the **Proportionality** of the reaction. Evaluate the **Effectiveness** of your described reaction.

Finally, reiterate your conclusion with the core logical reason. **Avoid numbered lists**; use flowing paragraphs separated by two newlines.
        `
    },
    {
        name: "Coach (Strategic Action)",
        prompt: `
You are a results-oriented strategic coach. **Strictly adhere to British English spelling, grammar, and phrasing.** Address 'you' directly. Use paragraph breaks (two newlines). Use **bold text using double asterisks** for emphasis on key actions/wording where appropriate, but do not rely on it for structure. Use plain language. **Be concise.**

First, state your assessment of the effectiveness of the user's described reaction (e.g., 'effective', 'ineffective/counterproductive').

Then:
*   Clearly state the **most critical strategic objective** now.
*   Provide the **most strategically advantageous** action plan as a series of clear steps using distinct paragraphs separated by two newlines. Use **bold text (double asterisks)** for key actions or suggested phrasing. **CRITICAL: Do NOT use numbered lists (1, 2, 3) or bullet points (-). Use PARAGRAPHS ONLY, separated by two newlines.**
*   Address the query's *underlying goal*: Explain why this action plan is **strategically superior**.
Focus ruthlessly on the best possible outcome.
        `
    },
];

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
    if (!personaId || typeof personaId !== 'string') {
        console.warn("ASK_FOLLOWUP Validation failed: Persona ID missing or invalid.");
        return NextResponse.json({ error: "Persona ID required." }, { status: 400 });
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
    // Removed validation for originalContextId
    // if (!originalContextId || typeof originalContextId !== 'string') { ... }

    // --- API Key Check ---
    if (!process.env.GEMINI_API_KEY && !process.env.GOOGLE_API_KEY) {
        console.error("ASK_FOLLOWUP API Key Error: Env var missing.");
        return NextResponse.json({ error: "Server configuration error: API key missing." }, { status: 500 });
    }
    // Removed Redis check
    // if (!process.env.STORAGE_KV_REST_API_URL || !process.env.STORAGE_KV_REST_API_TOKEN) { ... }

    // --- Retrieve Original Context (Removed - context/query now passed directly) ---
    // const redisKey = `result:${originalContextId}`;
    // let originalData;
    // try {
    //     originalData = await redis.hgetall(redisKey);
    //     if (!originalData || !originalData.context || !originalData.query) { ... }
    //     console.log(`ASK_FOLLOWUP: Successfully retrieved original context for ${redisKey}`);
    // } catch (redisError) { ... }

    // --- Find Persona Prompt ---
    const selectedPersona = personas.find(p => p.name === personaId);
    if (!selectedPersona) {
        console.error(`ASK_FOLLOWUP Error: Persona ID "${personaId}" not found.`);
        return NextResponse.json({ error: `Invalid persona specified: ${personaId}` }, { status: 400 });
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

    // --- Construct Prompt (Using direct context/query) ---
    const fullPrompt = `
${selectedPersona.prompt}

--- Original Situation Context ---
"""${context}"""

--- Original User Query ---
"${query}"
${conversationHistoryString}
--- Current Follow-up Question from User ---
User asks: "${question}"

---
**Instructions for this Follow-up Response:**
Respond *directly* and *conversationally* to the user's CURRENT follow-up question ("${question}").
Maintain your core ${personaId} perspective (e.g., strategic for Coach, logical for Analyst, psychological for Therapist), but **DO NOT rigidly follow the multi-part structure** outlined in your initial persona instructions above.
Focus on providing a clear, concise answer to the specific question asked, integrating insights from the original context/query and conversation history as needed.
Use paragraph breaks (two newlines) and **bold text** for emphasis where appropriate. Aim for approximately 100-150 words.
`;
    console.log(`ASK_FOLLOWUP: Sending prompt to ${personaId} (first 400 chars): ${fullPrompt.substring(0, 400)}...`);

    // --- Call AI Model ---
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-thinking-exp-01-21" }); // Use same model as getResponses
    const generationConfig = {
        temperature: 0.6,
        maxOutputTokens: 800 // Use same config as getResponses
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
        if (error.message && error.message.includes("API key not valid")) { errorMessage = "[Analysis Error: Invalid API Key]"; }
        else if (error.message && error.message.includes("quota")) { errorMessage = "[Analysis Error: API Quota Exceeded]"; }
        else if (error.message && error.message.includes("SAFETY")) { errorMessage = "[Analysis Error: Content blocked by safety filter]"; }

        // Return specific error status codes if possible
        let statusCode = 500;
        if (errorMessage.includes("Invalid API Key")) statusCode = 500; // Internal config issue
        if (errorMessage.includes("API Quota Exceeded")) statusCode = 429; // Too Many Requests
        if (errorMessage.includes("safety filter")) statusCode = 400; // Bad Request (problematic content)

        return NextResponse.json({ error: errorMessage.replace(/^\[|\]$/g, '') }, { status: statusCode });
    }
}