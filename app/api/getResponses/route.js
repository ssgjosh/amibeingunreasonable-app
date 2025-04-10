// FILE: src/app/api/getResponses/route.js
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
         // Keep essential punctuation if it's likely part of the text
        return /^[("']/.test(match.slice(-1)) ? match.slice(0, -1) : '';
    });
    // Relaxed trailing character removal
    cleaned = cleaned.replace(/[\s,'")\]}–—>`:;]+$/, ''); // Keep trailing periods, question marks, exclamation points, asterisks
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

// --- PERSONA PROMPTS (v5.6 - Refined prompts) ---
const personas = [
    {
        name: "Therapist (Interaction Dynamics)",
        prompt: `You are an objective psychotherapist using **British English**. Address 'you'. Analyse the interaction dynamics in the context, considering the user's query and any clarifications. Use paragraphs (\\n\\n) and **bold** key insights. Be concise.\n**Core psychological dynamic:** Identify the main conflict.\n**Emotional Drivers/Assumptions:** Briefly analyse both parties.\n**Communication Breakdown:** Identify the main issue/loop.\n**Biases:** Briefly note potential biases in *your* analysis.`
    },
    {
        name: "Analyst (Logical Assessment)",
        prompt: `You are a logical analyst using **British English**. Address 'you'. Use paragraphs (\\n\\n) and **bold** key terms. Be concise and definitive.\n**Conclusion:** Immediately state Yes/No/Partially to the user's query, considering context and clarifications.\n**Justification:** Identify **Unsupported assumptions**, **Primary trigger**, **Proportionality** of reaction, **Effectiveness** of actions.\n**Reiterate Conclusion:** Briefly state Yes/No/Partially with the core logical reason.`
    },
    {
        name: "Coach (Strategic Action)",
        prompt: `You are a strategic coach using **British English**. Address 'you'. Use paragraphs (\\n\\n) and **bold** key actions/phrasing. Use plain language. Be concise.\n**Current Strategy:** Assess effectiveness (effective/ineffective).\n**Objective:** State the critical strategic goal now.\n**Action Plan:** Provide clear steps in **separate paragraphs** (NO LISTS/BULLETS). Use **bold** for actions/phrasing.\n**Superiority:** Explain why this plan is strategically better for the underlying goal.`
    },
];

// --- Helper function to format answers ---
function formatOptionalAnswers(answers) {
    if (!answers || typeof answers !== 'object' || Object.keys(answers).length === 0) {
        return "No optional clarifications provided.";
    }
    const formatted = Object.entries(answers)
        .filter(([_, value]) => typeof value === 'string' && value.trim())
        .map(([key, value], index) => `Clarification ${index + 1}: ${value.trim()}`)
        .join('\n');
    return formatted || "No optional clarifications provided.";
}


export async function POST(request) {
    // Ensure API key is available
    if (!apiKey) {
        console.error("GETRESPONSES: Missing API Key.");
        return Response.json({ error: "Server configuration error: API key missing." }, { status: 500 });
    }

    let requestBody;
    try {
        requestBody = await request.json();
    } catch (e) {
        console.error("GETRESPONSES Error parsing request body:", e);
        return Response.json({ error: "Invalid request format." }, { status: 400 });
    }
    const { context, query, answers } = requestBody;

    console.log("GETRESPONSES RECEIVED - Context:", context?.length, "Query:", query, "Answers:", answers ? Object.keys(answers).length : 0);

    if (!context || typeof context !== 'string' || context.trim().length < 10) { /* ... validation ... */ return Response.json({ error: "Context required (min 10 chars)." }, { status: 400 }); }
    if (!query || typeof query !== 'string' || query.trim().length < 5) { /* ... validation ... */ return Response.json({ error: "Query required (min 5 chars)." }, { status: 400 }); }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
    const generationConfig = { temperature: 0.6, maxOutputTokens: 900 };
    const summaryGenerationConfig = { temperature: 0.6, maxOutputTokens: 450 };
    const paraphraseGenerationConfig = { temperature: 0.6, maxOutputTokens: 100 };

    let accumulatedErrorMessage = null; // Store errors encountered

    // === Generate Paraphrase ===
    console.log("\n--- GETRESPONSES: Generating Paraphrase ---");
    const paraphrasePrompt = `You are an expert summariser using **British English**. Read the context. Paraphrase the absolute core essence **from the user's perspective** in **one single, concise sentence** (max 30 words). Focus on the central conflict/circumstances. No analysis/opinion. Use British English. Context: """${context}""" Your one-sentence paraphrase:`;
    let paraphraseText = "[Paraphrase generation failed]"; // Default error state
    try {
        const paraphraseResult = await model.generateContent(paraphrasePrompt, paraphraseGenerationConfig);
        const paraphraseResponse = await paraphraseResult.response;
        if (!paraphraseResponse) throw new Error("No response for paraphrase.");
        const rawParaphrase = paraphraseResponse.candidates?.[0]?.content?.parts?.[0]?.text || '';
        paraphraseText = cleanApiResponseText(rawParaphrase);
        if (!paraphraseText || paraphraseText.startsWith("[")) { paraphraseText = "[Paraphrase could not be generated reliably]"; console.warn("Paraphrase generation failed or empty."); }
        else if (paraphraseText.split(' ').length > 35) { console.warn("Paraphrase exceeded length constraint."); }
         console.log("GETRESPONSES Cleaned Paraphrase:", JSON.stringify(paraphraseText));
    } catch (error) {
        const errorMsg = `Paraphrase Error: ${error.message?.substring(0,50) || 'Unknown'}`;
        paraphraseText = `[${errorMsg}]`;
        accumulatedErrorMessage = errorMsg;
        console.error("Paraphrase error:", error);
    }


    // === Generate Persona Responses ===
    const formattedAnswers = formatOptionalAnswers(answers);
    const personaPromises = personas.map(async ({ name, prompt }) => {
        console.log(`\n--- GETRESPONSES: Constructing ${name} Prompt ---`);
        const fullPrompt = `${prompt}\n\n---\nContext Provided:\n"""${context}"""\n\n---\nUser's Specific Query/Worry:\n"${query}"\n\n---\nOptional Clarifications Provided:\n"""\n${formattedAnswers}\n"""\n---\n\nYour direct, concise response (using \\n\\n for paragraphs, **bold**):`;
        console.log(`--- FINAL ${name} Prompt (first 400): ${fullPrompt.substring(0, 400)}...`);
        try {
            const result = await model.generateContent(fullPrompt, generationConfig);
            const response = await result.response;
            if (!response) throw new Error(`No response for ${name}.`);
            const rawText = response.candidates?.[0]?.content?.parts?.[0]?.text || '';
            let text = cleanApiResponseText(rawText);
            console.log(`GETRESPONSES Cleaned ${name} (first 100):`, JSON.stringify(text.substring(0,100))+"...");
            if (!text || text.length < 10) { text = `[Analysis Error for ${name}: Empty response received]`; }
            // Post-cleaning checks can remain if needed
            return { persona: name, response: text };
        } catch (error) {
             let personaError = `Analysis Error (${name}): ${error.message?.substring(0,50) || 'Unknown'}`;
             if (error.message?.includes("SAFETY")) { personaError = `[Analysis Error (${name}): Content blocked]`; }
             console.error(`Persona ${name} error:`, error);
             return { persona: name, response: `[${personaError}]` };
        }
    });
    const responses = await Promise.all(personaPromises);
    const validResponses = responses.filter(r => r.response && !r.response.startsWith("[")); // Filter out error responses

    // Aggregate errors from personas
    const personaErrors = responses
        .map(r => r.response)
        .filter(r => r && r.startsWith("["))
        .map(e => e.replace(/^\[|\]$/g, '')); // Clean brackets
    if (personaErrors.length > 0) {
        accumulatedErrorMessage = `${accumulatedErrorMessage ? accumulatedErrorMessage + '; ' : ''}Issues: ${[...new Set(personaErrors)].join('; ')}`;
    }


    // === Generate Summary ===
    let summaryText = "[Summary generation failed]"; // Default error state
    if (validResponses.length > 0) { // Only attempt if there are valid perspectives
         console.log(`\n--- GETRESPONSES: Constructing Summary Prompt (${validResponses.length} valid responses) ---`);
         // Refined Summary Prompt: Explicitly tell it *not* to use forbidden patterns
         const summaryPrompt = `Synthesize the critical conclusions from the analyses below regarding the user's query. Address 'you'. Use **plain British English**. Be direct, definitive, helpful. Use paragraphs (\\n\\n) and **bold**. Target 90-120 words. **CRITICAL INSTRUCTIONS:** DO NOT mention "therapist", "analyst", "coach", "synthesis", "template", "summarize". DO NOT start with "Okay, I understand", "Here's a summary", "Based on the analyses", "In summary,". Start directly with the synthesized verdict. Analyses Provided:\n${validResponses.map(r => `### ${r.persona}\n${r.response}`).join('\n\n')}\n\n---\nYour Synthesized Verdict (following all instructions):`;
         console.log(`--- FINAL Summary Prompt (first 500): ${summaryPrompt.substring(0, 500)}...`);
         try {
            const summaryResult = await model.generateContent(summaryPrompt, summaryGenerationConfig);
            const summaryResponse = await summaryResult.response;
            if (!summaryResponse) throw new Error("No response for summary.");
            const rawSummary = summaryResponse.candidates?.[0]?.content?.parts?.[0]?.text || '';
            summaryText = cleanApiResponseText(rawSummary);
            // Simplified Validation: Check if it's still the error state or too short. More complex checks were problematic.
            if (!summaryText || summaryText.startsWith("[")) {
                 summaryText = "[Summary could not be generated reliably]";
                 console.warn("Summary generation failed or empty.");
                 accumulatedErrorMessage = `${accumulatedErrorMessage ? accumulatedErrorMessage + '; ' : ''}Summary generation failed.`;
            } else if (summaryText.length < 15) {
                 summaryText = "[Summary generated was too short to be useful]";
                 console.warn("Summary too short.");
                 accumulatedErrorMessage = `${accumulatedErrorMessage ? accumulatedErrorMessage + '; ' : ''}Summary too short.`;
            }
            console.log("GETRESPONSES Cleaned Summary:", JSON.stringify(summaryText));
         } catch (error) {
             const errorMsg = `Summary Error: ${error.message?.substring(0,50) || 'Unknown'}`;
             summaryText = `[${errorMsg}]`;
             accumulatedErrorMessage = `${accumulatedErrorMessage ? accumulatedErrorMessage + '; ' : ''}${errorMsg}`;
             console.error("Summary error:", error);
         }
    } else if (!accumulatedErrorMessage) {
        // Only add this message if no other errors were recorded and no valid responses
        accumulatedErrorMessage = "Summary skipped: No valid analysis perspectives were generated.";
        summaryText = `[${accumulatedErrorMessage}]`;
    }


    // --- Final Response ---
    console.log("GETRESPONSES Returning final response:", { error: accumulatedErrorMessage, summary: summaryText.substring(0,50)+"...", paraphrase: paraphraseText.substring(0,50)+"...", responsesCount: validResponses.length });
    // Return 200 OK, include accumulated errors in the payload
    return Response.json({
        responses: responses, // Send ALL responses (including errors) so frontend can see issues
        summary: summaryText,
        paraphrase: paraphraseText,
        error: accumulatedErrorMessage // Consolidated error string
    });
}