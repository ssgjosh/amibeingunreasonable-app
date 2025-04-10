// FILE: src/app/api/generate-questions/route.js
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY);

// --- Helper function to clean API response text ---
function cleanApiResponseText(text) {
    if (!text || typeof text !== 'string') return '';
    let cleaned = text;
    cleaned = cleaned.replace(/^```(?:json|markdown|text)?\s*$/gm, '');
    cleaned = cleaned.replace(/^\s*```/, '');
    cleaned = cleaned.replace(/```\s*$/, '');
    cleaned = cleaned.trim();
    cleaned = cleaned.replace(/^[\s,'"\[{(–—*>#:;\.`\-\*]+/, '');
    cleaned = cleaned.replace(/[\s,'"\]})–—>`:;]+$/, ''); // Removed '\.' and '\*'
    if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
        try {
            const parsed = JSON.parse(cleaned);
            if (typeof parsed === 'string') cleaned = parsed;
        } catch (e) {
            cleaned = cleaned.substring(1, cleaned.length - 1);
        }
    }
    return cleaned.trim();
}

// --- Helper function to parse questions from text ---
function parseQuestions(text) {
    if (!text) return [];
    // Split by newline, filter empty lines, remove leading numbers/bullets, trim
    const lines = text.split('\n')
                      .map(line => line.trim())
                      .filter(line => line.length > 5) // Basic check for actual content
                      .map(line => line.replace(/^\s*[\d-*]+\.?\s*/, '').trim()) // Remove list markers
                      .filter(line => line.length > 5 && line.includes('?')); // Ensure it looks like a question

    // Return unique questions, max 3
    const uniqueQuestions = [...new Set(lines)];
    // Assign sequential IDs
    return uniqueQuestions.slice(0, 3).map((q, index) => ({ id: index + 1, text: q }));
}


export async function POST(request) {
    let requestBody;
    try {
        requestBody = await request.json();
    } catch (e) {
        console.error("GENERATE_QUESTIONS Error parsing request body:", e);
        return new Response(JSON.stringify({ error: "Invalid request format." }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }
    const { context } = requestBody;

    console.log("GENERATE_QUESTIONS RECEIVED - Context Length:", context?.length);

    // --- Input Validation ---
    if (!context || typeof context !== 'string' || context.trim().length < 10) {
        console.warn("GENERATE_QUESTIONS Validation failed: Context insufficient.");
        return new Response(JSON.stringify({ error: "Context description required (min 10 chars)." }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // --- API Key Check ---
    if (!process.env.GEMINI_API_KEY && !process.env.GOOGLE_API_KEY) {
         console.error("GENERATE_QUESTIONS API Key Error: Env var missing.");
         return new Response(JSON.stringify({ error: "Server configuration error: API key missing." }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" }); // Use a fast model
    const generationConfig = {
        temperature: 0.5,
        maxOutputTokens: 150 // Lower token limit for just questions
    };

    // --- Generate Questions Prompt ---
    const questionPrompt = `
    You are an expert at identifying ambiguities in user descriptions. Read the following context carefully. Based ONLY on this context, formulate up to **three distinct, concise, open-ended questions** in British English that, if answered by the user, would significantly clarify the situation or the perspectives involved.

    **Focus on:**
    *   Missing information (e.g., specific actions, timing, locations).
    *   Unclear motivations or feelings (if hinted at but not stated).
    *   Ambiguous statements or potential misunderstandings.

    **Output format:**
    *   Each question on a new line.
    *   Do NOT number the questions.
    *   Do NOT include any introduction, conclusion, or explanation. Just the questions.
    *   Example:
        What exactly did they say after you mentioned the deadline?
        How did you feel immediately after that conversation ended?
        Has this type of disagreement happened before?

    Context Provided:
    """${context}"""

    Your clarifying questions:
    `;
    console.log("--- GENERATE_QUESTIONS Prompt being sent (first 300 chars): ---");
    console.log(questionPrompt.substring(0, 300) + "...\n");

    try {
        const result = await model.generateContent(questionPrompt); // Using default config potentially okay here, or specify 'generationConfig'
        const response = await result.response;
        const rawText = response.text ? response.text() : '';
        console.log("GENERATE_QUESTIONS Raw Response:", JSON.stringify(rawText));
        const cleanedText = cleanApiResponseText(rawText);
        const questions = parseQuestions(cleanedText);
        console.log("GENERATE_QUESTIONS Parsed Questions:", questions);

        // Always return a valid JSON structure, even if no questions
        return new Response(JSON.stringify({ questions: questions || [] }), { status: 200, headers: { 'Content-Type': 'application/json' } });

    } catch (error) {
        console.error("GENERATE_QUESTIONS Error:", error);
        let errorMessage = `[Question Generation Error: ${error.message || 'Unknown error'}]`;
        if (error.message && error.message.includes("API key not valid")) { errorMessage = "[Question Generation Error: Invalid API Key]"; }
        else if (error.message && error.message.includes("quota")) { errorMessage = "[Question Generation Error: API Quota Exceeded]"; }
        else if (error.message && error.message.includes("SAFETY")) { errorMessage = "[Question Generation Error: Content blocked by safety filter]"; }

        console.warn("GENERATE_QUESTIONS Failed:", errorMessage);
        // Gracefully fail by returning no questions, allowing frontend to proceed
        return new Response(JSON.stringify({ questions: [] }), { status: 200, headers: { 'Content-Type': 'application/json' } });
        // Or if you want to signal a server error:
        // return new Response(JSON.stringify({ error: errorMessage }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
}