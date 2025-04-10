// FILE: src/app/api/getResponses/route.js
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY);

// --- ROBUST Helper function to clean API response text ---
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


// --- PERSONA PROMPTS (v5.5 - Added placeholder for Optional Answers) ---
const personas = [
    {
        name: "Therapist (Interaction Dynamics)",
        prompt: `
You are an objective psychotherapist analysing interaction dynamics described in the context. **Strictly adhere to British English spelling, grammar, and phrasing.** Address 'you' directly. Use paragraph breaks (two newlines: '\\n\\n') for readability, **bold text using double asterisks** for key insights, and lists *only if absolutely essential* for clarity. Be **concise**.
**Lead with your assessment of the core psychological dynamic at play in the situation.**
Based *exclusively* on the provided context, the user's query, and any optional clarifications provided:
*   Identify the **primary psychological conflict** evident. **Validate objective concerns** first if applicable.
\n\n
*   Briefly analyse the likely **emotional drivers and assumptions** for **both** parties shown.
\n\n
*   Identify the main **communication breakdown** and **negative feedback loop**.
\n\n
*   Briefly reflect on any **apparent biases** evident in *your description*.
        `
    },
    {
        name: "Analyst (Logical Assessment)",
        prompt: `
You are a ruthless logical analyst. **Strictly adhere to British English spelling, grammar, and phrasing.** Address 'you' directly. Use paragraph breaks (two newlines: '\\n\\n') and **bold text using double asterisks** for key terms/conclusions. **Be extremely concise and definitive.** NO hedging.

**Immediately state your definitive conclusion (Yes/No/Partially) to the user's query, considering the context and any clarifications.**

Then, justify this by assessing the logic: Identify any **Unsupported assumptions**. State the **Primary trigger**. Assess the **Proportionality** of the reaction. Evaluate the **Effectiveness** of your described reaction.

Finally, reiterate your **Conclusion (Yes/No/Partially)**, summarising the core logical reason. **Avoid numbered lists**; use flowing paragraphs separated by '\\n\\n'.
        `
    },
    {
        name: "Coach (Strategic Action)",
        prompt: `
You are a results-oriented strategic coach. **Strictly adhere to British English spelling, grammar, and phrasing.** Address 'you' directly. Use paragraph breaks (two newlines: '\\n\\n') and **bold text using double asterisks** for key actions/wording. Use plain language. **Be concise.**
**Lead with your assessment of the current strategy's effectiveness, considering the context, query and any clarifications.**
*   State if current actions are **'effective'** or **'ineffective/counterproductive'**.
\n\n
*   Clearly state the **most critical strategic objective** now.
\n\n
*   Provide the **most strategically advantageous** action plan as a series of clear steps using distinct paragraphs separated by '\\n\\n'. Use **bold text (double asterisks)** for key actions or suggested phrasing. **CRITICAL: Do NOT use numbered lists (1, 2, 3) or bullet points (-). Use PARAGRAPHS ONLY, separated by '\\n\\n'.**
\n\n
*   Address the query's *underlying goal*: Explain why this action plan is **strategically superior**.
Focus ruthlessly on the best possible outcome.
        `
    },
];

// --- Helper function to format answers ---
function formatOptionalAnswers(answers) {
    if (!answers || typeof answers !== 'object' || Object.keys(answers).length === 0) {
        return "No optional clarifications provided.";
    }
    const formatted = Object.entries(answers)
        .filter(([_, value]) => typeof value === 'string' && value.trim()) // Only include non-empty answers
        .map(([key, value], index) => `Clarification ${index + 1} (for question ID ${key}): ${value.trim()}`) // Include ID for context if needed
        .join('\n');
    return formatted || "No optional clarifications provided."; // Handle case where all answers were empty strings
}


export async function POST(request) {
    let requestBody;
    try {
        requestBody = await request.json();
    } catch (e) {
        console.error("GETRESPONSES Error parsing request body:", e);
        return new Response(JSON.stringify({ error: "Invalid request format. Ensure you are sending valid JSON." }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }
    // *** Destructure context, query, AND answers ***
    const { context, query, answers } = requestBody;

    console.log("GETRESPONSES RECEIVED - Context Length:", context?.length);
    console.log("GETRESPONSES RECEIVED - Query:", query);
    console.log("GETRESPONSES RECEIVED - Answers Type:", typeof answers, "Keys:", answers ? Object.keys(answers) : 'N/A');

    // --- Input Validation ---
    if (!context || typeof context !== 'string' || context.trim().length < 10) {
        console.warn("GETRESPONSES Validation failed: Context insufficient.");
        return new Response(JSON.stringify({ error: "Context description required (min 10 chars)." }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }
    if (!query || typeof query !== 'string' || query.trim().length < 5) {
       console.warn("GETRESPONSES Validation failed: Query insufficient.");
       return new Response(JSON.stringify({ error: "Specific query/worry required (min 5 chars)." }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // --- API Key Check ---
    if (!process.env.GEMINI_API_KEY && !process.env.GOOGLE_API_KEY) {
         console.error("GETRESPONSES API Key Error: Env var missing.");
         return new Response(JSON.stringify({ error: "Server configuration error: API key missing." }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }

    // --- Model and Config ---
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" }); // Use flash model
    // Increased token limits slightly for more complex potential outputs
    const generationConfig = { temperature: 0.6, maxOutputTokens: 900 };
    const summaryGenerationConfig = { temperature: 0.6, maxOutputTokens: 450 };
    const paraphraseGenerationConfig = { temperature: 0.6, maxOutputTokens: 100 };


    // === Generate Paraphrase (Only uses context) ===
    console.log("\n--- GETRESPONSES: Generating Paraphrase ---");
    const paraphrasePrompt = `You are an expert summariser using **British English**. Read the context. Paraphrase the absolute core essence **from the user's perspective** in **one single, concise sentence** (max 30 words). Focus on the central conflict/circumstances. No analysis/opinion. Use British English. Context: """${context}""" Your one-sentence paraphrase:`;
    let paraphraseText = "[Paraphrase generation failed]";
    try {
        const paraphraseResult = await model.generateContent(paraphrasePrompt, paraphraseGenerationConfig);
        const paraphraseResponse = await paraphraseResult.response;
        const rawParaphrase = paraphraseResponse.text ? paraphraseResponse.text() : '';
        paraphraseText = cleanApiResponseText(rawParaphrase);
         if (!paraphraseText || paraphraseText.startsWith("[")) { paraphraseText = "[Paraphrase generation failed]"; console.warn("Paraphrase generation failed or empty."); }
         else if (paraphraseText.split(' ').length > 35) { console.warn("Paraphrase exceeded length constraint."); }
         console.log("GETRESPONSES Cleaned Paraphrase:", JSON.stringify(paraphraseText));
    } catch (error) { /* ... (error handling as before) ... */ paraphraseText = `[Paraphrase Error: ${error.message?.substring(0,50) || 'Unknown'}]`; console.error("Paraphrase error", error); }


    // === Generate Persona Responses (Includes answers) ===
    const formattedAnswers = formatOptionalAnswers(answers); // Format the answers once
    const personaPromises = personas.map(async ({ name, prompt }) => {
        console.log(`\n--- GETRESPONSES: Constructing ${name} Prompt ---`);
        const fullPrompt = `${prompt}\n\n---\nContext Provided:\n"""${context}"""\n\n---\nUser's Specific Query/Worry about this Context:\n"${query}"\n\n---\nOptional Clarifications Provided by User:\n"""\n${formattedAnswers}\n"""\n---\n\nYour direct, concise, analytical response (approx 100-150 words, using \\n\\n for paragraphs and **bold text**):`;
        console.log(`--- FINAL ${name} Prompt being sent (first 400 chars): --- ${fullPrompt.substring(0, 400)}...\n`);
        try {
            const result = await model.generateContent(fullPrompt, generationConfig);
            const response = await result.response;
            const rawText = response.text ? response.text() : '';
            let text = cleanApiResponseText(rawText);
            console.log(`GETRESPONSES Cleaned ${name} Response (first 100):`, JSON.stringify(text.substring(0,100))+"...");
            // Post-cleaning checks (unchanged)
            if (name.includes("Coach") && /^\s*[1-9]+\.\s+/m.test(text)) { /* ... (list cleanup) ... */ }
            if (!text || text.length < 10) { return { persona: name, response: "[Analysis Error: Empty response received]" }; }
            if (/\b(analyze|behavior|color|center|realize|optimize)\b/i.test(text)) { /* ... (US spelling warn) ... */ }
            return { persona: name, response: text };
        } catch (error) { /* ... (error handling as before) ... */
            let personaError = `[Analysis Error: ${error.message?.substring(0,50) || 'Unknown'}]`;
            if (error.message?.includes("SAFETY")) { personaError = "[Analysis Error: Content blocked by safety filter]"; }
            console.error(`Persona ${name} error`, error);
            return { persona: name, response: personaError };
        }
    });
    const responses = await Promise.all(personaPromises);
    const validResponses = responses.filter(r => r.response && !r.response.startsWith("["));

    // --- Error Message Aggregation ---
    let accumulatedErrorMessage = null;
    const errorMessagesSet = new Set(
        responses.map(r => r.response)
                 .filter(r => r && r.startsWith("["))
                 .map(e => e.replace(/^\[|\]$/g, '')) // Clean error messages
    );
    if (paraphraseText.startsWith("[")) { errorMessagesSet.add(paraphraseText.replace(/^\[|\]$/g, '')); }
    if (errorMessagesSet.size > 0) { accumulatedErrorMessage = `Analysis generated with issues: ${[...errorMessagesSet].join('; ')}`; }
    if (validResponses.length === 0) { accumulatedErrorMessage = accumulatedErrorMessage ? `Analysis failed. ${accumulatedErrorMessage}` : "Analysis failed: Could not generate insights from any perspective."; }


    // === Generate Summary (Relies on valid persona responses) ===
    let summaryText = "[Summary generation failed]";
    if (validResponses.length > 0) {
         console.log(`\n--- GETRESPONSES: Constructing Summary Prompt (${validResponses.length} valid responses) ---`);
         const summaryPrompt = `Based *only* on the analyses provided below, synthesize their critical conclusions into a unified verdict regarding the user's query about the context. Address 'you' directly. Use **plain British English**. Be direct, definitive, helpful. Use paragraph breaks (\\n\\n). **Emphasise key findings/actions using double asterisks.** Target 90-120 words. **CRITICAL:** NO persona names, NO meta-talk about summarizing, NO greetings. Start directly with the synthesized verdict. Analyses Provided for Synthesis:\n${validResponses.map(r => `### ${r.persona}\n${r.response}`).join('\n\n')}\n\n---\nYour Synthesized Verdict:`;
         console.log(`--- FINAL Summary Prompt being sent (first 500 chars): --- ${summaryPrompt.substring(0, 500)}...\n`);
         try {
            const summaryResult = await model.generateContent(summaryPrompt, summaryGenerationConfig);
            const summaryResponse = await summaryResult.response;
            const rawSummary = summaryResponse.text ? summaryResponse.text() : '';
            summaryText = cleanApiResponseText(rawSummary);
            // Validation checks (unchanged)
            const lowerCaseSummary = summaryText.toLowerCase();
            const forbiddenWords = ["therapist", "analyst", "coach", "synthesis", "template", "summarize", "summary template"];
            const forbiddenStarts = ["okay, i understand", "here's a summary", "based on the analyses", "in summary,"];
            if (!summaryText || summaryText.length < 20 || summaryText.length > 1000 || summaryText.startsWith("[") || forbiddenWords.some(word => lowerCaseSummary.includes(word)) || forbiddenStarts.some(start => lowerCaseSummary.startsWith(start))) {
                 const failureReason = summaryText && summaryText.startsWith("[") ? summaryText : "[Summary generation failed - invalid content received]";
                 summaryText = failureReason;
                 console.warn("Summary generation failed validation:", summaryText);
                 if (!accumulatedErrorMessage?.includes("Summary generation failed")) { accumulatedErrorMessage = `${accumulatedErrorMessage ? accumulatedErrorMessage + '; ' : ''}${failureReason.replace(/^\[|\]$/g, '')}`; }
            }
            if (summaryText && /\b(analyze|behavior|color|center|realize|optimize)\b/i.test(summaryText)) { /* ... (US spelling warn) ... */ }
            console.log("GETRESPONSES Cleaned Summary:", JSON.stringify(summaryText));
         } catch (error) { /* ... (error handling as before) ... */
             summaryText = `[Summary generation failed: ${error.message?.substring(0,50) || 'Unknown'}]`;
             console.error("Summary error", error);
             if (!accumulatedErrorMessage?.includes("Summary generation failed")) { accumulatedErrorMessage = `${accumulatedErrorMessage ? accumulatedErrorMessage + '; ' : ''}${summaryText.replace(/^\[|\]$/g, '')}`; }
         }
    } else if (!accumulatedErrorMessage) {
         // Only add this message if no other errors were recorded
         accumulatedErrorMessage = "Summary skipped: No valid analysis perspectives were generated.";
         summaryText = `[${accumulatedErrorMessage}]`;
    }

    // --- Final Response ---
    console.log("GETRESPONSES Returning final response to frontend:", { error: accumulatedErrorMessage, summary: summaryText.substring(0,50)+"...", paraphrase: paraphraseText.substring(0,50)+"...", responsesCount: validResponses.length });
    // Use 200 OK even if there are partial errors, let frontend display them
    return new Response(JSON.stringify({
        responses: validResponses,
        summary: summaryText,
        paraphrase: paraphraseText,
        error: accumulatedErrorMessage // Send accumulated errors/warnings
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
}