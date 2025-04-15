// FILE: app/api/generateFollowUpQuestions/route.js
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY);

// Helper function to clean API response text
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
        console.error("ROUTE Error parsing request body:", e);
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

    // API Key Check
    if (!process.env.GEMINI_API_KEY && !process.env.GOOGLE_API_KEY) {
        console.error("FOLLOW-UP ROUTE API Key Error: Env var missing.");
        return Response.json({ error: "Server configuration error: API key missing." }, { status: 500 });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-thinking-exp-01-21" });
    const generationConfig = {
        temperature: 0.7,
        maxOutputTokens: 500
    };

    // Generate Follow-Up Questions
    console.log("\n--- FOLLOW-UP ROUTE: Constructing Follow-Up Questions Prompt ---");
    const followUpPrompt = `
    You are an expert at identifying information gaps in user queries. Based on the context and initial query provided, generate 2-3 targeted follow-up questions that would help provide a more comprehensive analysis.

    These follow-up questions should:
    1. Address potential information gaps in the original context
    2. Seek clarification on ambiguous aspects of the situation
    3. Explore relevant perspectives that might be missing
    4. Be specific, concise, and directly related to the situation
    5. Use British English spelling and phrasing

    Format your response as a JSON array of questions, like this:
    ["Question 1?", "Question 2?", "Question 3?"]

    Context: """${context}"""

    User's Initial Query: "${query}"

    Generate 2-3 follow-up questions:`;

    console.log("--- FINAL Follow-Up Questions Prompt being sent (first 300 chars): ---");
    console.log(followUpPrompt.substring(0, 300) + "...\n");

    try {
        const result = await model.generateContent(followUpPrompt, generationConfig);
        const response = await result.response;
        const rawText = response.text ? response.text() : '';
        console.log("FOLLOW-UP ROUTE Raw Response:", rawText);
        
        let cleanedText = cleanApiResponseText(rawText);
        console.log("FOLLOW-UP ROUTE Cleaned Response:", cleanedText);
        
        // Try to parse as JSON
        let questions = [];
        try {
            // Handle cases where the model might return JSON with or without code fences
            if (cleanedText.startsWith('[') && cleanedText.endsWith(']')) {
                questions = JSON.parse(cleanedText);
            } else {
                // Try to extract JSON array from text
                const jsonMatch = cleanedText.match(/\[.*\]/s);
                if (jsonMatch) {
                    questions = JSON.parse(jsonMatch[0]);
                }
            }
            
            // Validate questions
            if (!Array.isArray(questions) || questions.length === 0) {
                throw new Error("Invalid questions format");
            }
            
            // Limit to 3 questions maximum and remove duplicates
            questions = [...new Set(questions)].slice(0, 3);
            
            // Ensure all questions are strings and end with question marks
            questions = questions.map(q => {
                if (typeof q !== 'string') return "Additional information needed?";
                return q.trim().endsWith('?') ? q.trim() : `${q.trim()}?`;
            });
            
            return Response.json({ questions });
            
        } catch (parseError) {
            console.error("FOLLOW-UP ROUTE Error parsing questions:", parseError);
            
            // Fallback: Try to extract questions using regex
            const questionRegex = /(?:^|\n)(?:\d+\.\s*|\*\s*|"\s*)(.*?\?)/g;
            const matches = [...cleanedText.matchAll(questionRegex)];
            
            if (matches.length > 0) {
                questions = matches.map(m => m[1].trim()).slice(0, 3);
                return Response.json({ questions });
            }
            
            // Last resort fallback
            return Response.json({ 
                questions: [
                    "Could you provide more details about the specific actions or words exchanged?",
                    "What was your relationship with the other person(s) before this situation?",
                    "What outcome are you hoping for in this situation?"
                ],
                error: "Generated questions could not be parsed properly. Using default questions."
            });
        }
    } catch (error) {
        console.error("FOLLOW-UP ROUTE Error generating follow-up questions:", error);
        return Response.json({ 
            error: `Failed to generate follow-up questions: ${error.message || 'Unknown error'}`,
            questions: [
                "Could you provide more details about the specific actions or words exchanged?",
                "What was your relationship with the other person(s) before this situation?",
                "What outcome are you hoping for in this situation?"
            ]
        }, { status: 500 });
    }
}