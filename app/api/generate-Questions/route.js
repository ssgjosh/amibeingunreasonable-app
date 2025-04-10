// FILE: src/app/api/generate-questions/route.js
import { GoogleGenerativeAI } from '@google/generative-ai';

// Ensure correct API key handling
const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
if (!apiKey) {
    console.error("CRITICAL: API Key for GoogleGenerativeAI is missing in environment variables.");
}
const genAI = new GoogleGenerativeAI(apiKey);

// --- Helper function to clean API response text ---
function cleanApiResponseText(text) {
    if (!text || typeof text !== 'string') return '';
    let cleaned = text;
    cleaned = cleaned.replace(/^```(?:json|markdown|text)?\s*$/gm, '');
    cleaned = cleaned.replace(/^\s*```/, '');
    cleaned = cleaned.replace(/```\s*$/, '');
    cleaned = cleaned.trim();
    // Relaxed leading character removal
    cleaned = cleaned.replace(/^[\s,'"[{(–—*>#:;`\-*]+/, (match) => {
        // Keep essential punctuation if it's likely part of the question
        return /^[?("']/.test(match.slice(-1)) ? match.slice(0, -1) : '';
    });
     // Relaxed trailing character removal - keep question marks!
    cleaned = cleaned.replace(/[\s,'"[{(–—>`:;]+$/, ''); // Removed '\?' and simplified
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
    const potentialQuestions = text.split('\n')
        .map(line => line.trim())
        .map(line => line.replace(/^\s*[\d-*]+\.?\s*/, '').trim()) // Remove list markers
        .filter(line => line.length > 10 && line.includes('?')); // Stricter length and require '?'

    // Basic check for sentence structure (ends with ?, doesn't look like just noise)
    const validQuestions = potentialQuestions.filter(q => q.endsWith('?') && !q.match(/^[?!\s]*$/));

    const uniqueQuestions = [...new Set(validQuestions)];
    return uniqueQuestions.slice(0, 3).map((q, index) => ({ id: index + 1, text: q }));
}


export async function POST(request) {
    // Ensure API key is available before processing
    if (!apiKey) {
        console.error("GENERATE_QUESTIONS: Missing API Key.");
        return Response.json({ error: "Server configuration error: API key missing." }, { status: 500 });
    }

    let requestBody;
    try {
        requestBody = await request.json();
    } catch (e) {
        console.error("GENERATE_QUESTIONS Error parsing request body:", e);
        return Response.json({ error: "Invalid request format." }, { status: 400 });
    }
    const { context } = requestBody;

    console.log("GENERATE_QUESTIONS RECEIVED - Context Length:", context?.length);

    if (!context || typeof context !== 'string' || context.trim().length < 10) {
        console.warn("GENERATE_QUESTIONS Validation failed: Context insufficient.");
        return Response.json({ error: "Context description required (min 10 chars)." }, { status: 400 });
    }

    // Define model and config within the handler if needed, or reuse instance
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
    const generationConfig = {
        temperature: 0.5,
        maxOutputTokens: 150
    };

    const questionPrompt = `You are an expert at identifying ambiguities in user descriptions. Read the context. Formulate up to **three distinct, concise, open-ended questions** in British English that would clarify the situation. **Output format:** Each question on a new line. NO numbering, intro, or conclusion. Just the questions. Context: """${context}""" Your clarifying questions:`;
    console.log("--- GENERATE_QUESTIONS Prompt being sent (first 300 chars): ---");
    console.log(questionPrompt.substring(0, 300) + "...\n");

    try {
        const result = await model.generateContent(questionPrompt, generationConfig); // Pass config explicitly
        const response = await result.response;

        // Add robust check for response existence before accessing text()
        if (!response) {
             throw new Error("No response received from AI model.");
        }

        const candidateText = response.candidates?.[0]?.content?.parts?.[0]?.text; // More robust access
        const rawText = candidateText || ''; // Fallback to empty string

        console.log("GENERATE_QUESTIONS Raw Response Text:", JSON.stringify(rawText));
        const cleanedText = cleanApiResponseText(rawText);
        const questions = parseQuestions(cleanedText);
        console.log("GENERATE_QUESTIONS Parsed Questions:", questions);

        // Return successfully with questions array (might be empty)
        return Response.json({ questions: questions || [] });

    } catch (error) {
        console.error("GENERATE_QUESTIONS Error generating content:", error);
        let errorMessage = `Question Generation Error: ${error.message || 'Unknown error'}`;
         // Specific error handling
        if (error.message?.includes("API key not valid")) { errorMessage = "Question Generation Error: Invalid API Key"; }
        else if (error.message?.includes("quota")) { errorMessage = "Question Generation Error: API Quota Exceeded"; }
        else if (error.message?.includes("SAFETY")) { errorMessage = "Question Generation Error: Content blocked by safety filter"; }
        else if (error.message?.includes("timed out")) { errorMessage = "Question Generation Error: Request timed out"; }

        console.warn("GENERATE_QUESTIONS Failed:", errorMessage);
        // Gracefully return empty questions array, frontend handles this
        return Response.json({ questions: [], error: errorMessage }); // Optionally include error message
    }
}