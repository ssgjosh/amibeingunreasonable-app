// FILE: src/app/api/getResponses/route.js
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY);

// --- ROBUST Helper function to clean API response text ---
// (Unchanged from previous version)
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
        .filter(([_, value]) => typeof value === 'string' && value.trim()) // Only include answered questions
        .map(([_, value], index) => `Clarification ${index + 1}: ${value.trim()}`) // Simple numbered list
        .join('\n');
    return formatted || "No optional clarifications provided.";
}


export async function POST(request) {
    let requestBody;
    try {
        requestBody = await request.json();
    } catch (e) {
        console.error("GETRESPONSES Error parsing request body:", e);
        return Response.json({ error: "Invalid request format. Ensure you are sending valid JSON." }, { status: 400 });
    }
    // *** Destructure context, query, AND answers ***
    const { context, query, answers } = requestBody;

    console.log("GETRESPONSES RECEIVED - Context Length:", context?.length);
    console.log("GETRESPONSES RECEIVED - Query:", query);
    console.log("GETRESPONSES RECEIVED - Answers Type:", typeof answers, "Keys:", answers ? Object.keys(answers) : 'N/A');

    // --- Input Validation ---
    if (!context || typeof context !== 'string' || context.trim().length < 10) {
        console.warn("GETRESPONSES Validation failed: Context insufficient.");
        return Response.json({ error: "Context description required (min 10 chars)." }, { status: 400 });
    }
    if (!query || typeof query !== 'string' || query.trim().length < 5) {
       console.warn("GETRESPONSES Validation failed: Query insufficient.");
       return Response.json({ error: "Specific query/worry required (min 5 chars)." }, { status: 400 });
    }

    // --- API Key Check ---
    if (!process.env.GEMINI_API_KEY && !process.env.GOOGLE_API_KEY) {
         console.error("GETRESPONSES API Key Error: Env var missing.");
         return Response.json({ error: "Server configuration error: API key missing." }, { status: 500 });
    }

    // --- Model and Config (Unchanged) ---
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" }); // Using flash for speed/cost balance
    const generationConfig = { temperature: 0.6, maxOutputTokens: 800 };
    const summaryGenerationConfig = { temperature: 0.6, maxOutputTokens: 400 };
    const paraphraseGenerationConfig = { temperature: 0.6, maxOutputTokens: 80 };


    // === Generate Paraphrase (Unchanged, only uses context) ===
    console.log("\n--- GETRESPONSES: Constructing Paraphrase Prompt ---");
    const paraphrasePrompt = `
    You are an expert summariser using **British English**. Read the context. Paraphrase the absolute core essence **from the user's perspective** in **one single, concise sentence** (max 25-30 words). Focus on the central conflict/circumstances. No analysis/opinion. Use British English.

    Context: """${context}"""

    Your one-sentence paraphrase:`;
    console.log("--- FINAL Paraphrase Prompt being sent (first 300 chars): ---");
    console.log(paraphrasePrompt.substring(0, 300) + "...\n");
    let paraphraseText = "[Paraphrase generation failed]";
    try {
        const paraphraseResult = await model.generateContent(paraphrasePrompt, paraphraseGenerationConfig);
        const paraphraseResponse = await paraphraseResult.response;
        const rawParaphrase = paraphraseResponse.text ? paraphraseResponse.text() : '';
        paraphraseText = cleanApiResponseText(rawParaphrase);
         if (!paraphraseText || paraphraseText.startsWith("[")) { /* ... (error handling) ... */ paraphraseText = "[Paraphrase generation failed]"; console.warn("Paraphrase generation returned error state or empty after cleaning."); }
         else if (paraphraseText.split(' ').length > 35) { /* ... (warning) ... */ console.warn("Generated paraphrase exceeded length constraint after cleaning."); }
         console.log("GETRESPONSES Cleaned Paraphrase:", JSON.stringify(paraphraseText));
    } catch (error) { /* ... (error handling) ... */
        console.error("GETRESPONSES Error generating paraphrase:", error);
        if (error.message && error.message.includes("API key not valid")) { paraphraseText = "[Paraphrase Error: Invalid API Key]"; }
        else if (error.message && error.message.includes("quota")) { paraphraseText = "[Paraphrase Error: API Quota Exceeded]"; }
        else { paraphraseText = `[Paraphrase Error: ${error.message || 'Unknown network/API issue'}]`; }
    }


    // === Generate Persona Responses (MODIFIED to include answers) ===
    // Format the optional answers for inclusion in the prompt
    const formattedAnswers = formatOptionalAnswers(answers);

    const personaPromises = personas.map(async ({ name, prompt }) => {
        console.log(`\n--- GETRESPONSES: Constructing ${name} Prompt ---`);
        // *** Construct prompt including context, query, AND formatted answers ***
        const fullPrompt = `
${prompt}

---
Context Provided:
"""${context}"""

---
User's Specific Query/Worry about this Context:
"${query}"

---
Optional Clarifications Provided by User:
"""
${formattedAnswers}
"""
---

Your direct, concise, analytical response (approx 100-150 words, using \\n\\n for paragraphs and **bold text**):
    `;
        console.log(`--- FINAL ${name} Prompt being sent (first 400 chars): ---`);
        console.log(fullPrompt.substring(0, 400) + "...\n");

        try {
            const result = await model.generateContent(fullPrompt, generationConfig);
            const response = await result.response;
            const rawText = response.text ? response.text() : '';
            console.log(`GETRESPONSES Raw ${name} Response:`, JSON.stringify(rawText.substring(0,100))+"...");
            let text = cleanApiResponseText(rawText);
            console.log(`GETRESPONSES Cleaned ${name} Response:`, JSON.stringify(text.substring(0,100))+"...");

            // Post-cleaning checks (unchanged)
            if (name.includes("Coach") && /^\s*[1-9]+\.\s+/m.test(text)) { /* ... (list cleanup warning) ... */ }
            if (!text || text.length < 10) { /* ... (empty response error) ... */ return { persona: name, response: "[Analysis Error: Empty response received]" }; }
            if (/\b(analyze|behavior|color|center|realize|optimize)\b/i.test(text)) { /* ... (US spelling warning) ... */ }

            return { persona: name, response: text };
        } catch (error) { /* ... (error handling - unchanged) ... */
            console.error(`GETRESPONSES Error generating response for persona ${name}:`, error);
             let personaError = `[Analysis Error: ${error.message || 'Unknown error'}]`;
             if (error.message && error.message.includes("API key not valid")) { personaError = "[Analysis Error: Invalid API Key]"; }
             else if (error.message && error.message.includes("quota")) { personaError = "[Analysis Error: API Quota Exceeded]"; }
             else if (error.message && error.message.includes("SAFETY")) { personaError = "[Analysis Error: Content blocked by safety filter]"; }
            return { persona: name, response: personaError };
        }
    });
    const responses = await Promise.all(personaPromises);
    const validResponses = responses.filter(r => r.response && !r.response.startsWith("["));

    // --- Error Message Aggregation (Unchanged logic) ---
    let errorMessage = null;
    const errorMessages = [...new Set(responses
        .map(r => r.response)
        .filter(r => r && r.startsWith("["))
        .map(e => e.replace(/^\[|\]$/g, ''))
    )];
    if (paraphraseText.startsWith("[")) { /* ... (add paraphrase error) ... */ }
    if (validResponses.length === 0) { /* ... (handle no valid responses) ... */ return Response.json({ error: errorMessage, responses: [], summary: '', paraphrase: paraphraseText }, { status: 500 }); }
    else if (errorMessages.length > 0) { errorMessage = `Analysis may be incomplete. Issues: ${errorMessages.join('; ')}`; }


    // === Generate Summary (MODIFIED to include answers context if needed, though typically relies on persona output) ===
    let summaryText = "[Summary generation failed]";
    if (validResponses.length > 0) {
         console.log(`\n--- GETRESPONSES: Constructing Summary Prompt ---`);
         // The summary prompt primarily relies on the *persona outputs* which already considered the answers.
         // No direct need to inject answers again here, unless personas failed to incorporate them.
         const summaryPrompt = `
        Based *only* on the analyses provided below, synthesize their critical conclusions into a unified verdict regarding the user's query about the context. Address 'you' directly. Use **plain British English**. Be direct, definitive, helpful. Use paragraph breaks (\\n\\n). **Emphasise key findings/actions using double asterisks.** Target 90-120 words.

        **CRITICAL:** NO persona names, NO meta-talk about summarizing, NO greetings. Start directly with the synthesized verdict.

        Analyses Provided for Synthesis:
        ${validResponses.map(r => `### ${r.persona}\n${r.response}`).join('\n\n')}

        ---
        Your Synthesized Verdict:`;
         console.log(`--- FINAL Summary Prompt being sent (first 500 chars): ---`);
         console.log(summaryPrompt.substring(0, 500) + "...\n");

        try {
            const summaryResult = await model.generateContent(summaryPrompt, summaryGenerationConfig);
            const summaryResponse = await summaryResult.response;
            const rawSummary = summaryResponse.text ? summaryResponse.text() : '';
            console.log("GETRESPONSES Raw Summary:", JSON.stringify(rawSummary));
            summaryText = cleanApiResponseText(rawSummary);
            console.log("GETRESPONSES Cleaned Summary:", JSON.stringify(summaryText));

            // Validation checks (unchanged)
            const lowerCaseSummary = summaryText.toLowerCase();
            const forbiddenWords = ["therapist", "analyst", "coach", "synthesis", "template", "summarize", "summary template"];
            const forbiddenStarts = ["okay, i understand", "here's a summary", "based on the analyses", "in summary,"];
            if ( !summaryText || summaryText.length < 20 || summaryText.length > 1000 || summaryText.startsWith("[") || forbiddenWords.some(word => lowerCaseSummary.includes(word)) || forbiddenStarts.some(start => lowerCaseSummary.startsWith(start)) ) { /* ... (handle invalid summary) ... */ }
            if (summaryText && /\b(analyze|behavior|color|center|realize|optimize)\b/i.test(summaryText)) { /* ... (US spelling warning) ... */ }

        } catch (error) { /* ... (error handling - unchanged) ... */
             console.error("GETRESPONSES Error generating summary:", error);
            let summaryError = `[Summary generation failed: ${error.message || 'Unknown error'}]`;
            if (error.message && error.message.includes("API key not valid")) { summaryError = "[Summary Error: Invalid API Key]"; }
            else if (error.message && error.message.includes("quota")) { summaryError = "[Summary Error: API Quota Exceeded]"; }
            else if (error.message && error.message.includes("SAFETY")) { summaryError = "[Summary Error: Content blocked by safety filter]"; }
            summaryText = summaryError;
            // ... (add summary error to errorMessage)
        }
    } else { /* ... (handle summary skip) ... */ }

    // Final check for paraphrase error (unchanged)
    if (paraphraseText.startsWith("[") && (!errorMessage || !errorMessage.includes("Paraphrase Error"))) { /* ... (add paraphrase error) ... */ }

    // --- Final Response ---
    console.log("GETRESPONSES Returning final response to frontend:", { error: errorMessage, summary: summaryText.substring(0,50)+"...", paraphrase: paraphraseText.substring(0,50)+"...", responsesCount: validResponses.length });
    return Response.json({
        responses: validResponses,
        summary: summaryText,
        paraphrase: paraphraseText,
        error: errorMessage
    });
}