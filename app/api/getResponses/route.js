// FILE: src/app/api/getResponses/route.js
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY);

// --- ROBUST Helper function to clean API response text ---
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

// --- PERSONA PROMPTS (v5.4 - Re-emphasize formatting slightly) ---
const personas = [
    {
        name: "Therapist (Interaction Dynamics)",
        prompt: `
You are an objective psychotherapist analysing interaction dynamics described in the context. **Strictly adhere to British English spelling, grammar, and phrasing.** Address 'you' directly. Use paragraph breaks (two newlines: '\\n\\n') for readability, **bold text using double asterisks** for key insights, and lists *only if absolutely essential* for clarity. Be **concise**.
**Lead with your assessment of the core psychological dynamic at play in the situation.**
Based *exclusively* on the provided context and considering the user's query:
*   Identify the **primary psychological conflict** evident. **Validate objective concerns** first if applicable.
\n\n
*   Briefly analyse the likely **emotional drivers and assumptions** for **both** parties shown.
\n\n
*   Identify the main **communication breakdown** and **negative feedback loop**.
\n\n
*   Briefly reflect on any **apparent biases** evident in *your description*.
        ` // Note: Explicitly mentioned '\n\n' and double asterisks
    },
    {
        name: "Analyst (Logical Assessment)",
        prompt: `
You are a ruthless logical analyst. **Strictly adhere to British English spelling, grammar, and phrasing.** Address 'you' directly. Use paragraph breaks (two newlines: '\\n\\n') and **bold text using double asterisks** for key terms/conclusions. **Be extremely concise and definitive.** NO hedging.

**Immediately state your definitive conclusion (Yes/No/Partially) to the user's query.**

Then, justify this by assessing the logic: Identify any **Unsupported assumptions**. State the **Primary trigger**. Assess the **Proportionality** of the reaction. Evaluate the **Effectiveness** of your described reaction.

Finally, reiterate your **Conclusion (Yes/No/Partially)**, summarising the core logical reason. **Avoid numbered lists**; use flowing paragraphs separated by '\\n\\n'.
        ` // Note: Explicitly mentioned '\n\n' and double asterisks
    },
    {
        name: "Coach (Strategic Action)",
        prompt: `
You are a results-oriented strategic coach. **Strictly adhere to British English spelling, grammar, and phrasing.** Address 'you' directly. Use paragraph breaks (two newlines: '\\n\\n') and **bold text using double asterisks** for key actions/wording. Use plain language. **Be concise.**
**Lead with your assessment of the current strategy's effectiveness.**
*   State if current actions are **'effective'** or **'ineffective/counterproductive'**.
\n\n
*   Clearly state the **most critical strategic objective** now.
\n\n
*   Provide the **most strategically advantageous** action plan as a series of clear steps using distinct paragraphs separated by '\\n\\n'. Use **bold text (double asterisks)** for key actions or suggested phrasing. **CRITICAL: Do NOT use numbered lists (1, 2, 3) or bullet points (-). Use PARAGRAPHS ONLY, separated by '\\n\\n'.**
\n\n
*   Address the query's *underlying goal*: Explain why this action plan is **strategically superior**.
Focus ruthlessly on the best possible outcome.
        ` // Note: Explicitly mentioned '\n\n' and double asterisks, reinforced NO LISTS
    },
];


export async function POST(request) {
    let requestBody;
    try {
        requestBody = await request.json();
    } catch (e) {
        console.error("ROUTE Error parsing request body:", e);
        return Response.json({ error: "Invalid request format. Ensure you are sending valid JSON." }, { status: 400 });
    }
    const { context, query } = requestBody;

    console.log("ROUTE RECEIVED - Context Type:", typeof context, "Length:", context?.length);
    console.log("ROUTE RECEIVED - Query Type:", typeof query, "Length:", query?.length);
    console.log("ROUTE RECEIVED - Query Value:", query);

    // --- Input Validation ---
    if (!context || typeof context !== 'string' || context.trim().length < 10) {
        console.warn("ROUTE Validation failed: Context insufficient.");
        return Response.json({ error: "Context description required (min 10 chars)." }, { status: 400 });
    }
    if (!query || typeof query !== 'string' || query.trim().length < 5) {
       console.warn("ROUTE Validation failed: Query insufficient.");
       return Response.json({ error: "Specific query/worry required (min 5 chars)." }, { status: 400 });
    }

    // --- API Key Check ---
    if (!process.env.GEMINI_API_KEY && !process.env.GOOGLE_API_KEY) {
         console.error("ROUTE API Key Error: Env var missing.");
         return Response.json({ error: "Server configuration error: API key missing." }, { status: 500 });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-thinking-exp-01-21" });
    // *** FIX: Increased default generation config tokens (adjust if needed) ***
    const generationConfig = {
        temperature: 0.6,
        maxOutputTokens: 800 // Increased default limit significantly
    };
    const summaryGenerationConfig = {
        temperature: 0.6,
        maxOutputTokens: 400 // Increased limit for summary too
    };
    const paraphraseGenerationConfig = {
        temperature: 0.6,
        maxOutputTokens: 80 // Slightly increased paraphrase limit just in case
    };


    // --- Generate Paraphrase ---
    console.log("\n--- ROUTE: Constructing Paraphrase Prompt ---");
    console.log("Context available for paraphrase prompt?", !!context);
    const paraphrasePrompt = `
    You are an expert summariser using **British English**. Read the context. Paraphrase the absolute core essence **from the user's perspective** in **one single, concise sentence** (max 25-30 words). Focus on the central conflict/circumstances. No analysis/opinion. Use British English.

    Context: """${context}"""

    Your one-sentence paraphrase:`; // Simplified prompt structure slightly
    console.log("--- FINAL Paraphrase Prompt being sent (first 300 chars): ---");
    console.log(paraphrasePrompt.substring(0, 300) + "...\n");

    let paraphraseText = "[Paraphrase generation failed]";
    try {
        // *** Apply specific config ***
        const paraphraseResult = await model.generateContent(paraphrasePrompt, paraphraseGenerationConfig);
        const paraphraseResponse = await paraphraseResult.response;
        const rawParaphrase = paraphraseResponse.text ? paraphraseResponse.text() : '';
        console.log("ROUTE Raw Paraphrase:", JSON.stringify(rawParaphrase));
        paraphraseText = cleanApiResponseText(rawParaphrase);
         if (!paraphraseText || paraphraseText.startsWith("[")) {
             paraphraseText = "[Paraphrase generation failed]";
             console.warn("Paraphrase generation returned error state or empty after cleaning.");
         } else if (paraphraseText.split(' ').length > 35) {
             console.warn("Generated paraphrase exceeded length constraint after cleaning.");
         }
         console.log("ROUTE Cleaned Paraphrase:", JSON.stringify(paraphraseText));
    } catch (error) {
        console.error("ROUTE Error generating paraphrase:", error);
        if (error.message && error.message.includes("API key not valid")) { paraphraseText = "[Paraphrase Error: Invalid API Key]"; }
        else if (error.message && error.message.includes("quota")) { paraphraseText = "[Paraphrase Error: API Quota Exceeded]"; }
        else { paraphraseText = `[Paraphrase Error: ${error.message || 'Unknown network/API issue'}]`; }
    }

    // --- Generate Persona Responses ---
    const personaPromises = personas.map(async ({ name, prompt }) => {
        console.log(`\n--- ROUTE: Constructing ${name} Prompt ---`);
        console.log(`Context available for ${name} prompt?`, !!context);
        console.log(`Query available for ${name} prompt?`, !!query);
        const fullPrompt = `
${prompt}

---
Context Provided:
"""${context}"""

User's Specific Query/Worry about this Context:
"${query}"

Your direct, concise, analytical response (approx 100-150 words, using \\n\\n for paragraphs and **bold text**):
    `; // Simplified prompt structure slightly
        console.log(`--- FINAL ${name} Prompt being sent (first 400 chars): ---`);
        console.log(fullPrompt.substring(0, 400) + "...\n");

        try {
            // *** Apply default (increased) config ***
            const result = await model.generateContent(fullPrompt, generationConfig);
            const response = await result.response;
            const rawText = response.text ? response.text() : '';
            console.log(`ROUTE Raw ${name} Response:`, JSON.stringify(rawText.substring(0,100))+"...");
            let text = cleanApiResponseText(rawText); // Apply robust cleaning
            console.log(`ROUTE Cleaned ${name} Response:`, JSON.stringify(text.substring(0,100))+"...");

            // Post-cleaning check for Coach list format
            if (name.includes("Coach") && /^\s*[1-9]+\.\s+/m.test(text)) {
                console.warn(`Coach response contained numbered list despite prompt - attempting cleanup on: ${text.substring(0,50)}...`);
                text = text.replace(/^\s*[1-9]+\.\s+/gm, '** ')
                           .replace(/\n\n\*\*/g, '\n\n** ')
                           .replace(/(\S+)\n(?!\n|\*\*)/g, '$1 ');
                text = cleanApiResponseText(text); // Clean again
                console.warn(`Coach response after cleanup attempt: ${text.substring(0,50)}...`)
            }

            if (!text || text.length < 10) {
                 console.error(`ROUTE Empty or invalid response from persona ${name} after cleaning for query: ${query}`);
                 return { persona: name, response: "[Analysis Error: Empty response received]" };
            }
            if (/\b(analyze|behavior|color|center|realize|optimize)\b/i.test(text)) {
                console.warn(`ROUTE Potential US spelling detected in ${name} response.`);
            }
            return { persona: name, response: text };
        } catch (error) {
            console.error(`ROUTE Error generating response for persona ${name}:`, error);
             let personaError = `[Analysis Error: ${error.message || 'Unknown error'}]`;
             if (error.message && error.message.includes("API key not valid")) { personaError = "[Analysis Error: Invalid API Key]"; }
             else if (error.message && error.message.includes("quota")) { personaError = "[Analysis Error: API Quota Exceeded]"; }
             else if (error.message && error.message.includes("SAFETY")) { personaError = "[Analysis Error: Content blocked by safety filter]"; }
            return { persona: name, response: personaError };
        }
    });
    const responses = await Promise.all(personaPromises);
    const validResponses = responses.filter(r => r.response && !r.response.startsWith("["));

    let errorMessage = null;
    const errorMessages = [...new Set(responses
        .map(r => r.response)
        .filter(r => r && r.startsWith("["))
        .map(e => e.replace(/^\[|\]$/g, ''))
    )];

    if (paraphraseText.startsWith("[")) {
        const paraphraseErrorMsg = paraphraseText.replace(/^\[|\]$/g, '');
        if (!errorMessages.some(msg => msg.includes('Paraphrase Error'))) {
            errorMessages.push(paraphraseErrorMsg);
        }
    }

    if (validResponses.length === 0) {
        errorMessage = errorMessages.length > 0
            ? `Analysis failed. Issues: ${errorMessages.join('; ')}`
            : "Analysis failed: Could not generate insights from any perspective.";
        console.error("ROUTE: No valid persona responses generated. Returning 500.");
         return Response.json({ error: errorMessage, responses: [], summary: '', paraphrase: paraphraseText }, { status: 500 });

    } else if (errorMessages.length > 0) {
        errorMessage = `Analysis may be incomplete. Issues: ${errorMessages.join('; ')}`;
    }


    // --- Generate Summary ---
    let summaryText = "[Summary generation failed]";
    if (validResponses.length > 0) {
         console.log(`\n--- ROUTE: Constructing Summary Prompt ---`);
         console.log(`Found ${validResponses.length} valid responses for summary.`);
         const summaryPrompt = `
        Based *only* on the analyses provided below, synthesize their critical conclusions into a unified verdict regarding the user's query about the context. Address 'you' directly. Use **plain British English**. Be direct, definitive, helpful. Use paragraph breaks (\\n\\n). **Emphasise key findings/actions using double asterisks.** Target 90-120 words.

        **CRITICAL:** NO persona names, NO meta-talk about summarizing, NO greetings. Start directly with the synthesized verdict.

        Analyses Provided for Synthesis:
        ${validResponses.map(r => `### ${r.persona}\n${r.response}`).join('\n\n')}

        ---
        Your Synthesized Verdict:`; // Simplified prompt structure
         console.log(`--- FINAL Summary Prompt being sent (first 500 chars): ---`);
         console.log(summaryPrompt.substring(0, 500) + "...\n");

        try {
            // *** Apply specific config ***
            const summaryResult = await model.generateContent(summaryPrompt, summaryGenerationConfig);
            const summaryResponse = await summaryResult.response;
            const rawSummary = summaryResponse.text ? summaryResponse.text() : '';
            console.log("ROUTE Raw Summary:", JSON.stringify(rawSummary));
            summaryText = cleanApiResponseText(rawSummary); // Apply robust cleaning
            console.log("ROUTE Cleaned Summary:", JSON.stringify(summaryText));

            const lowerCaseSummary = summaryText.toLowerCase();
            const forbiddenWords = ["therapist", "analyst", "coach", "synthesis", "template", "summarize", "summary template"];
            const forbiddenStarts = ["okay, i understand", "here's a summary", "based on the analyses", "in summary,"];

            if ( !summaryText || summaryText.length < 20 || summaryText.length > 1000 || summaryText.startsWith("[") || forbiddenWords.some(word => lowerCaseSummary.includes(word)) || forbiddenStarts.some(start => lowerCaseSummary.startsWith(start)) ) {
                 console.warn("ROUTE Generated summary seems invalid (failed checks or too short/long) after cleaning:", summaryText);
                 const failureReason = summaryText && summaryText.startsWith("[") ? summaryText : "[Summary generation failed - invalid content received]";
                 summaryText = failureReason;
                 const summaryErrorMsg = failureReason.replace(/^\[|\]$/g, '');
                 if (!errorMessage) errorMessage = summaryErrorMsg;
                 else if (!errorMessage.includes(summaryErrorMsg)) errorMessage += `; ${summaryErrorMsg}`;
            }
            if (summaryText && /\b(analyze|behavior|color|center|realize|optimize)\b/i.test(summaryText)) {
                console.warn(`ROUTE Potential US spelling detected in Summary response.`);
            }

        } catch (error) {
            console.error("ROUTE Error generating summary:", error);
            let summaryError = `[Summary generation failed: ${error.message || 'Unknown error'}]`;
            if (error.message && error.message.includes("API key not valid")) { summaryError = "[Summary Error: Invalid API Key]"; }
            else if (error.message && error.message.includes("quota")) { summaryError = "[Summary Error: API Quota Exceeded]"; }
            else if (error.message && error.message.includes("SAFETY")) { summaryError = "[Summary Error: Content blocked by safety filter]"; }
            summaryText = summaryError;
            const summaryErrorMsg = summaryError.replace(/^\[|\]$/g, '');
            if (!errorMessage) errorMessage = summaryErrorMsg;
            else if (!errorMessage.includes(summaryErrorMsg)) errorMessage += `; ${summaryErrorMsg}`;
        }
    } else {
        console.warn("ROUTE Skipping summary generation as there were no valid persona responses (already handled).");
        summaryText = "[Summary generation skipped - no valid analysis provided]";
        const skipMsg = "Summary generation skipped";
         if (!errorMessage) errorMessage = skipMsg;
         else if (!errorMessage.includes(skipMsg)) errorMessage += "; " + skipMsg;
    }

    if (paraphraseText.startsWith("[") && (!errorMessage || !errorMessage.includes("Paraphrase Error"))) {
         const paraphraseErrorMsg = paraphraseText.replace(/^\[|\]$/g, '');
          if (!errorMessage) errorMessage = paraphraseErrorMsg;
          else if (!errorMessage.includes(paraphraseErrorMsg)) errorMessage += "; " + paraphraseErrorMsg;
     }

    console.log("ROUTE Returning final response to frontend:", { error: errorMessage, summary: summaryText.substring(0,50)+"...", paraphrase: paraphraseText.substring(0,50)+"...", responsesCount: validResponses.length });
    return Response.json({
        responses: validResponses,
        summary: summaryText,
        paraphrase: paraphraseText,
        error: errorMessage
    });
}