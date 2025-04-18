import { getOpenRouterCompletion } from '@/lib/openRouterClient'; // Changed import
import { NextResponse } from 'next/server';
import { therapistPersona } from '@/app/prompts/therapist'; // Import detailed prompts
import { analystPersona } from '@/app/prompts/analyst';
import { coachPersona } from '@/app/prompts/coach';

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

// Map persona IDs to their detailed system prompts
const personaSystemPrompts = {
    "Therapist": therapistPersona.system,
    "Analyst": analystPersona.system,
    "Coach": coachPersona.system
};

const validPersonaNames = Object.keys(personaSystemPrompts); // Use keys from the map


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

    // --- API Key Check (Updated) ---
    if (!process.env.OPENROUTER_API_KEY) { // Changed check
        console.error("ASK_FOLLOWUP API Key Error: OPENROUTER_API_KEY env var missing.");
        return NextResponse.json({ error: "Server configuration error: API key missing." }, { status: 500 });
    }

    // --- Get Persona System Prompt ---
    const systemPrompt = personaSystemPrompts[personaId];
    if (!systemPrompt) {
        // This should technically be caught by the validation above, but as a safeguard:
        console.error(`ASK_FOLLOWUP Error: Could not find system prompt for valid persona ID "${personaId}". This indicates an internal inconsistency.`);
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

    // --- Construct User Prompt ---
    const userPromptContent = `
--- Original Situation Context ---
"""${context}"""

--- Your Original Query ---
"${query}"
${conversationHistoryString}
--- Your Current Follow-up Question ---
You ask: "${question}"

---
**Instructions for this Follow-up Response:**
1.  Embody the persona defined in the system prompt (tone, focus, constraints like avoiding advice if Therapist/Analyst).
2.  Respond *directly* and *conversationally* to the CURRENT follow-up question ("${question}"). **Do NOT repeat your role definition or persona description.**
3.  Focus on providing a clear, concise answer to the specific question asked, integrating insights from the original context/query and conversation history as needed.
4.  Use paragraph breaks (two newlines) for readability. Use **bold text using double asterisks** for emphasis on key insights where appropriate.
5.  Output *only* the natural language response. Do NOT output JSON or follow any JSON structure rules mentioned in the system prompt.
`;
    console.log(`ASK_FOLLOWUP: Sending prompt to ${personaId} (User prompt first 400 chars): ${userPromptContent.substring(0, 400)}...`);

    // --- Define model parameters (used in getOpenRouterCompletion calls) ---
    const modelName = "openai/gpt-4.1"; // Target model
    const defaultTemperature = 0.6;

    // --- Call OpenRouter API ---
    try {
        // Create messages array for OpenRouter
        const messages = [
            { role: 'system', content: systemPrompt }, // Use the detailed system prompt
            { role: 'user', content: userPromptContent }
        ];

        // Call OpenRouter API
        const rawText = await getOpenRouterCompletion(
            messages,
            modelName,
            defaultTemperature,
            undefined // Pass undefined for maxTokens
        );
        
        console.log(`ASK_FOLLOWUP Raw ${personaId} Response:`, JSON.stringify(rawText?.substring(0,100))+"...");

        // Handle empty response without throwing immediately
        if (rawText === null || rawText.trim() === "") {
            console.error(`ASK_FOLLOWUP Empty response from ${personaId} for question: ${question}`);
            return NextResponse.json({ error: "Analysis Error: Empty response received from AI." }, { status: 500 });
        }

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

        // Handle OpenRouter specific errors
        if (error.message) {
            if (error.message.includes("API key") || error.status === 401) {
                errorMessage = "Server configuration error: Invalid API Key.";
                statusCode = 500;
            } else if (error.message.includes("quota") || error.status === 429) {
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
