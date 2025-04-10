// FILE: app/api/generate-questions/route.js
import { GoogleGenerativeAI } from '@google/generative-ai';

// --- Helper function to clean API response text ---
// (Keep your existing cleanApiResponseText function here)
function cleanApiResponseText(text) {
    if (!text || typeof text !== 'string') return '';
    let cleaned = text;
    cleaned = cleaned.replace(/^```(?:json|markdown|text)?\s*$/gm, '');
    cleaned = cleaned.replace(/^\s*```/, '');
    cleaned = cleaned.replace(/```\s*$/, '');
    cleaned = cleaned.trim();
    cleaned = cleaned.replace(/^[\s,'"[{(–—*>#:;\.`\-*]+/, (match) => { return /^[?("']/.test(match.slice(-1)) ? match.slice(0, -1) : ''; });
    cleaned = cleaned.replace(/[\s,'"[{(–—>`:;]+$/, '');
    if (cleaned.startsWith('"') && cleaned.endsWith('"')) { try { const parsed = JSON.parse(cleaned); if (typeof parsed === 'string') cleaned = parsed; } catch (e) { cleaned = cleaned.substring(1, cleaned.length - 1); } }
    return cleaned.trim();
}

// --- Helper function to parse questions from text ---
// (Keep your existing parseQuestions function here)
function parseQuestions(text) {
    if (!text) return [];
    const potentialQuestions = text.split('\n') .map(line => line.trim()) .map(line => line.replace(/^\s*[\d-*]+\.?\s*/, '').trim()) .filter(line => line.length > 10 && line.includes('?'));
    const validQuestions = potentialQuestions.filter(q => q.endsWith('?') && !q.match(/^[?!\s]*$/));
    const uniqueQuestions = [...new Set(validQuestions)];
    return uniqueQuestions.slice(0, 3).map((q, index) => ({ id: index + 1, text: q }));
}

// --- EXPORTED POST HANDLER ---
export async function POST(request) {
    // 1. Check for API Key *inside* the handler
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!apiKey) {
        console.error("GENERATE_QUESTIONS: Missing API Key.");
        return Response.json({ error: "Server configuration error: API key missing." }, { status: 500 });
    }

    // 2. Initialize genAI *inside* the handler
    let genAI;
    try {
         genAI = new GoogleGenerativeAI(apiKey);
    } catch (initError) {
         console.error("GENERATE_QUESTIONS: Failed to initialize GoogleGenerativeAI:", initError);
         return Response.json({ error: "Server configuration error: Failed to initialize AI." }, { status: 500 });
    }

    // 3. Process Request Body
    let requestBody;
    try {
        requestBody = await request.json();
    } catch (e) {
        console.error("GENERATE_QUESTIONS Error parsing request body:", e);
        return Response.json({ error: "Invalid request format." }, { status: 400 });
    }
    const { context } = requestBody;

    console.log("GENERATE_QUESTIONS RECEIVED - Context Length:", context?.length);

    // 4. Validate Input
    if (!context || typeof context !== 'string' || context.trim().length < 10) {
        console.warn("GENERATE_QUESTIONS Validation failed: Context insufficient.");
        return Response.json({ error: "Context description required (min 10 chars)." }, { status: 400 });
    }

    // 5. AI Call Logic (as before)
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
    const generationConfig = { temperature: 0.5, maxOutputTokens: 150 };
    const questionPrompt = `You are an expert at identifying ambiguities in user descriptions. Read the context. Formulate up to **three distinct, concise, open-ended questions** in British English that would clarify the situation. **Output format:** Each question on a new line. NO numbering, intro, or conclusion. Just the questions. Context: """${context}""" Your clarifying questions:`;

    console.log("--- GENERATE_QUESTIONS Prompt being sent (first 300 chars): ---");
    console.log(questionPrompt.substring(0, 300) + "...\n");

    try {
        const result = await model.generateContent(questionPrompt, generationConfig);
        const response = await result.response;
        if (!response) { throw new Error("No response received from AI model."); }
        const candidateText = response.candidates?.[0]?.content?.parts?.[0]?.text;
        const rawText = candidateText || '';
        console.log("GENERATE_QUESTIONS Raw Response Text:", JSON.stringify(rawText));
        const cleanedText = cleanApiResponseText(rawText);
        const questions = parseQuestions(cleanedText);
        console.log("GENERATE_QUESTIONS Parsed Questions:", questions);

        return Response.json({ questions: questions || [] });

    } catch (error) {
        console.error("GENERATE_QUESTIONS Error generating content:", error);
        let errorMessage = `Question Generation Error: ${error.message || 'Unknown error'}`;
        if (error.message?.includes("API key not valid")) { errorMessage = "Question Generation Error: Invalid API Key"; }
        else if (error.message?.includes("quota")) { errorMessage = "Question Generation Error: API Quota Exceeded"; }
        else if (error.message?.includes("SAFETY")) { errorMessage = "Question Generation Error: Content blocked by safety filter"; }
        else if (error.message?.includes("timed out")) { errorMessage = "Question Generation Error: Request timed out"; }
        console.warn("GENERATE_QUESTIONS Failed:", errorMessage);
        // Return 500 to indicate server-side failure during AI call
        return Response.json({ questions: [], error: errorMessage }, { status: 500 });
    }
}

// Optional: Add OPTIONS handler if necessary, though unlikely needed for 405 POST error
// export async function OPTIONS(request) {
//   return new Response(null, { status: 204, headers: { 'Allow': 'POST, OPTIONS' } });
// }