// FILE: app/api/generateFollowUpQuestions/route.js
// Removed: import { GoogleGenerativeAI } from '@google/generative-ai';
import { getOpenRouterCompletion } from '@/lib/openRouterClient'; // Added
// Removed ChatCompletionMessageParam import as it's not strictly needed in JS and might cause issues if openai types aren't fully available

// Removed: const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY);

// Helper function to clean API response text (remains the same)
function cleanApiResponseText(text) {
    if (!text || typeof text !== 'string') return '';
    let cleaned = text;

    // If the text contains a JSON array after code fences, extract just that
    const jsonMatch = text.match(/```json\s*(\[[\s\S]*?\])\s*```/);
    if (jsonMatch) {
        return jsonMatch[1];
    }

    // Otherwise try to find any JSON array
    const arrayMatch = text.match(/\[[\s\S]*?\]/);
    if (arrayMatch) {
        return arrayMatch[0];
    }

    // If no JSON array found, clean up the text normally
    cleaned = cleaned.replace(/```(?:json|markdown|text)?/g, '');
    cleaned = cleaned.trim();

    return cleaned;
}

export async function POST(request) {
    let requestBody;
    try {
        requestBody = await request.json();
    } catch (e) {
        console.error("FOLLOW-UP ROUTE Error parsing request body:", e);
        return Response.json({ error: "Invalid request format. Ensure you are sending valid JSON." }, { status: 400 });
    }

    const { context, query } = requestBody;

    console.log("FOLLOW-UP ROUTE RECEIVED - Context Type:", typeof context, "Length:", context?.length);
    console.log("FOLLOW-UP ROUTE RECEIVED - Query Type:", typeof query, "Length:", query?.length);
    console.log("FOLLOW-UP ROUTE RECEIVED - Query Value:", query);

    // Input Validation
    if (!context || typeof context !== 'string' || context.trim().length < 10) {
        console.warn("FOLLOW-UP ROUTE Validation failed: Context insufficient.");
        return Response.json({ error: "Context description required (min 10 chars)." }, { status: 400 });
    }
    if (!query || typeof query !== 'string' || query.trim().length < 5) {
        console.warn("FOLLOW-UP ROUTE Validation failed: Query insufficient.");
        return Response.json({ error: "Specific query/worry required (min 5 chars)." }, { status: 400 });
    }

    // API Key Check (Updated)
    if (!process.env.OPENROUTER_API_KEY) { // Changed check
        console.error("FOLLOW-UP ROUTE API Key Error: OPENROUTER_API_KEY env var missing.");
        return Response.json({ error: "Server configuration error: API key missing." }, { status: 500 });
    }

    // Removed: const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-thinking-exp-01-21" });
    // Model config parameters (will be passed to the helper)
    const modelName = "openai/gpt-4o-mini"; // Use the same model as judge route
    const temperature = 0.7;
    // const maxTokens = 500; // REMOVED hardcoded limit

    // --- Construct Prompt Components for OpenRouter ---
    console.log("\n--- FOLLOW-UP ROUTE: Constructing Follow-Up Questions Prompt ---");

    const systemPrompt = `
You are an expert at identifying information gaps in user queries. Based on the context and initial query provided, generate 2-3 targeted follow-up questions that would help provide a more comprehensive analysis.

These follow-up questions should:
1. Address potential information gaps in the original context
2. Seek clarification on ambiguous aspects of the situation
3. Explore relevant perspectives that might be missing
4. Be specific, concise, and directly related to the situation
5. Use British English spelling and phrasing

Format your response ONLY as a valid JSON array of strings, like this:
["Question 1?", "Question 2?", "Question 3?"]
Do NOT include any other text, explanations, or markdown formatting (like \`\`\`json) before or after the JSON array.
    `;

    const userPrompt = `
Context: """${context}"""

User's Initial Query: "${query}"

Generate 2-3 follow-up questions based on the instructions in the system prompt. Output ONLY the JSON array.
    `;

    const messages = [ // Define messages array
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
    ];

    console.log("--- FINAL Follow-Up Questions Prompt being sent (System + User): ---");
    console.log("System Prompt (start):", systemPrompt.substring(0, 150) + "...");
    console.log("User Prompt (start):", userPrompt.substring(0, 150) + "...\n");

    try {
        // Call OpenRouter client
        const rawText = await getOpenRouterCompletion(
            messages,
            modelName,
            temperature,
            undefined // *** CHANGED: Pass undefined for maxTokens ***
        );

        console.log("FOLLOW-UP ROUTE Raw Response:", rawText);

        if (rawText === null || rawText.trim() === "") {
             console.error("FOLLOW-UP ROUTE: Empty response received from OpenRouter model.");
             // Throw error to trigger fallback
             throw new Error("AI model returned an empty response.");
        }

        let cleanedText = cleanApiResponseText(rawText);
        console.log("FOLLOW-UP ROUTE Cleaned Response:", cleanedText);

        // Try to parse as JSON
        let questions = [];
        try {
            // Handle cases where the model might return JSON with or without code fences
            if (cleanedText.startsWith('[') && cleanedText.endsWith(']')) {
                questions = JSON.parse(cleanedText);
            } else {
                 // If cleaning didn't isolate the array, try one more time
                 const arrayMatch = cleanedText.match(/\[[\s\S]*?\]/);
                 if (arrayMatch) {
                    questions = JSON.parse(arrayMatch[0]);
                 } else {
                    throw new Error("Could not find JSON array in response.");
                 }
            }

            // Validate questions
            if (!Array.isArray(questions) || questions.length === 0) {
                throw new Error("Invalid questions format received from model.");
            }

            // Limit to 3 questions maximum and remove duplicates
            questions = [...new Set(questions)].slice(0, 3);

            // Ensure all questions are strings and end with question marks
            questions = questions.map(q => {
                if (typeof q !== 'string') return "Additional information needed?"; // Fallback for non-string items
                return q.trim().endsWith('?') ? q.trim() : `${q.trim()}?`;
            });

            // Successfully generated and parsed questions
            return Response.json({ questions }); // Return 200 OK implicitly

        } catch (parseError) {
            console.error("FOLLOW-UP ROUTE Error parsing questions:", parseError);
            console.error("FOLLOW-UP ROUTE Failing Cleaned Text:", cleanedText); // Log the text that failed parsing

            // Fallback: Try to extract questions using regex (less reliable)
            const questionRegex = /(?:^|\n)(?:\d+\.\s*|\*\s*|"\s*)(.*?\?)/g;
            const matches = [...cleanedText.matchAll(questionRegex)];

            if (matches.length > 0) {
                console.warn("FOLLOW-UP ROUTE: Falling back to regex extraction for questions.");
                questions = matches.map(m => m[1].trim()).slice(0, 3);
                // Return 200 OK but include error indicating fallback
                return Response.json({
                    error: `Failed to parse AI response, used regex fallback: ${parseError.message}.`,
                    questions
                });
            }

            // Last resort fallback (if regex also fails)
            console.error("FOLLOW-UP ROUTE: Regex extraction failed. Using default questions.");
            // Throw to trigger outer catch block's fallback
            throw new Error("Could not parse or extract questions from AI response.");
        }
    } catch (error) {
        console.error("FOLLOW-UP ROUTE Error generating follow-up questions:", error);
        // Use default questions as fallback, but return 200 OK with an error message
        return Response.json({
            error: `Failed to generate/parse follow-up questions: ${error.message || 'Unknown error'}. Using default questions.`, // Keep error message
            questions: [
                "Could you provide more details about the specific actions or words exchanged?",
                "What was your relationship with the other person(s) before this situation?",
                "What outcome are you hoping for in this situation?"
            ]
        }, { status: 200 }); // *** Return 200 OK even on fallback ***
    }
}