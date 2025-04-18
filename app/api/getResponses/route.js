// FILE: src/app/api/getResponses/route.js
// Removed: import { GoogleGenerativeAI } from '@google/generative-ai';
import { getOpenRouterCompletion } from '@/lib/openRouterClient'; // Changed import
import { Redis } from '@upstash/redis'; // Import Redis
import { nanoid } from 'nanoid'; // Import nanoid

// Removed: const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY);

// Initialize Upstash Redis client
const redis = new Redis({
  url: process.env.STORAGE_KV_REST_API_URL,
  token: process.env.STORAGE_KV_REST_API_TOKEN,
});


// --- ROBUST Helper function to clean API response text ---
// (Keep existing cleanApiResponseText function - unchanged)
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

// --- PERSONA PROMPTS (v5.7 - Less formulaic, avoid repetition) ---
// (Keep existing personas array - unchanged)
const personas = [
    {
        name: "Therapist (Interaction Dynamics)",
        prompt: `
You are an objective psychotherapist analysing interaction dynamics. **Strictly adhere to British English spelling, grammar, and phrasing.** Address 'you' directly. Use paragraph breaks (two newlines) for readability. Use **bold text using double asterisks** for emphasis on key insights where appropriate, but do not rely on it for structure. Be **concise and avoid repetitive phrasing.**

Based *exclusively* on the provided context and considering the user's query, analyse the interaction by exploring:
*   The **core psychological dynamic** and the **primary psychological conflict** evident in the situation. Validate any objective concerns the user raises where appropriate.
*   The likely **emotional drivers and underlying assumptions** influencing the behaviour of **both** parties involved.
*   The key points of **communication breakdown** or any emerging **negative feedback loops**.
*   Any **apparent biases** reflected in the user's description of the events.
Integrate these points into a cohesive analysis using flowing paragraphs.
        `
    },
    {
        name: "Analyst (Logical Assessment)",
        prompt: `
You are a ruthless logical analyst. **Strictly adhere to British English spelling, grammar, and phrasing.** Address 'you' directly. Use paragraph breaks (two newlines). Use **bold text using double asterisks** for emphasis on key terms/conclusions where appropriate, but do not rely on it for structure. **Be extremely concise and definitive.** NO hedging. **Avoid repetitive phrasing.**

Based *exclusively* on the provided context and considering the user's query:
*   **Immediately state your definitive conclusion** (Yes/No/Partially) regarding the user's query.
*   Logically justify your conclusion by dissecting the situation:
    *   Identify key **unsupported assumptions** made by the user.
    *   Pinpoint the **primary trigger** for the user's reaction or concern.
    *   Assess the **proportionality** of the user's reaction to the trigger.
    *   Evaluate the likely **effectiveness** of the user's described actions or stance.
*   Concisely reiterate your conclusion, linking it directly to the **core logical flaw or justification**.
Use flowing paragraphs separated by two newlines. **Avoid numbered lists.**
        `
    },
    {
        name: "Coach (Strategic Action)",
        prompt: `
You are a results-oriented strategic coach. **Strictly adhere to British English spelling, grammar, and phrasing.** Address 'you' directly. Use paragraph breaks (two newlines). Use **bold text using double asterisks** for emphasis on key actions/wording where appropriate, but do not rely on it for structure. Use plain language. **Be concise and avoid repetitive phrasing.**

Based *exclusively* on the provided context and considering the user's query:
*   Begin by assessing the **effectiveness and potential consequences** of the user's described reaction. Use varied phrasing for this assessment (e.g., "This approach risks...", "While understandable, this might lead to...", "This was a constructive way to handle...").
*   Identify the **most critical strategic objective** for the user moving forward in this situation.
*   Outline a **clear, actionable, and strategically advantageous plan** to achieve that objective. Present this as practical steps or suggested communication, using paragraphs separated by two newlines. **Do NOT use numbered or bulleted lists.**
*   Briefly explain the **strategic rationale** behind your recommended plan, highlighting why it's likely to lead to a better outcome compared to other approaches (including the user's original one, if applicable).
Focus ruthlessly on the best possible outcome and practical steps.
        `
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
    const { context, query, followUpResponses } = requestBody;

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

    // --- API Key Check (Updated) ---
    if (!process.env.OPENROUTER_API_KEY) { // Changed check
        console.error("ROUTE API Key Error: OPENROUTER_API_KEY env var missing.");
        return Response.json({ error: "Server configuration error: API key missing." }, { status: 500 });
    }
    // --- Redis Config Check ---
    if (!process.env.STORAGE_KV_REST_API_URL || !process.env.STORAGE_KV_REST_API_TOKEN) {
        console.error("ROUTE Redis Config Error: Env var missing.");
        return Response.json({ error: "Server configuration error: Storage credentials missing." }, { status: 500 });
    }

    // Removed: const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-thinking-exp-01-21" });

    // Define model parameters (used in getOpenRouterCompletion calls)
    const modelName = "openai/o4-mini-high"; // Target model
    const defaultTemperature = 0.6;
    // REMOVED: const paraphraseMaxTokens = 80;
    // REMOVED: const personaMaxTokens = 800;
    // REMOVED: const summaryMaxTokens = 400;


    // --- Generate Paraphrase ---
    console.log("\n--- ROUTE: Constructing Paraphrase Prompt ---");
    console.log("Context available for paraphrase prompt?", !!context);

    const paraphraseSystemPrompt = `You are an expert summariser using **British English**. Read the context. Paraphrase the absolute core essence **from the user's perspective** in **one single, concise sentence** (max 25-30 words). Focus on the central conflict/circumstances. No analysis/opinion. Use British English. Output ONLY the single sentence.`;
    const paraphraseUserPrompt = `Context: """${context}"""\n\nYour one-sentence paraphrase:`;
    const paraphraseMessages = [
        { role: 'system', content: paraphraseSystemPrompt },
        { role: 'user', content: paraphraseUserPrompt }
    ];

    console.log("--- FINAL Paraphrase Prompt being sent (System + User): ---");
    console.log("System:", paraphraseSystemPrompt.substring(0, 100) + "...");
    console.log("User:", paraphraseUserPrompt.substring(0, 100) + "...\n");

    let paraphraseText = "[Paraphrase generation failed]"; // Default error state
    try {
        const rawParaphrase = await getOpenRouterCompletion(
            paraphraseMessages,
            modelName,
            defaultTemperature,
            undefined // Pass undefined for maxTokens
        );
        console.log("ROUTE Raw Paraphrase:", JSON.stringify(rawParaphrase));

        // *** CHANGED: Handle empty response without throwing immediately ***
        if (rawParaphrase === null || rawParaphrase.trim() === "") {
            console.warn("ROUTE: AI model returned an empty response for paraphrase.");
            paraphraseText = "[Paraphrase Error: Empty response received]";
        } else {
            paraphraseText = cleanApiResponseText(rawParaphrase);
            if (!paraphraseText || paraphraseText.startsWith("[")) { // Check if cleaning resulted in error state
                paraphraseText = "[Paraphrase generation failed]";
                console.warn("Paraphrase generation returned error state or empty after cleaning.");
            } else if (paraphraseText.split(' ').length > 35) {
                console.warn("Generated paraphrase exceeded length constraint after cleaning.");
                // Optionally truncate or handle differently
            }
        }
        console.log("ROUTE Cleaned Paraphrase:", JSON.stringify(paraphraseText));
    } catch (error) {
        console.error("ROUTE Error generating paraphrase:", error);
        // Assign error text based on API error type
        if (error.message && (error.message.includes("API key") || error.status === 401)) { paraphraseText = "[Paraphrase Error: Invalid API Key]"; }
        else if (error.message && (error.message.includes("quota") || error.status === 429)) { paraphraseText = "[Paraphrase Error: API Quota Exceeded]"; }
        else { paraphraseText = `[Paraphrase Error: ${error.message || 'Unknown network/API issue'}]`; }
    }

    // --- Generate Persona Responses ---
    const personaPromises = personas.map(async ({ name, prompt: personaSystemPrompt }) => {
        console.log(`\n--- ROUTE: Constructing ${name} Prompt ---`);
        console.log(`Context available for ${name} prompt?`, !!context);
        console.log(`Query available for ${name} prompt?`, !!query);

        // Prepare follow-up responses section if available
        let followUpSection = '';
        if (followUpResponses && Array.isArray(followUpResponses) && followUpResponses.length > 0) {
            const validFollowUps = followUpResponses.filter(item =>
                item && typeof item.question === 'string' && typeof item.answer === 'string' &&
                item.question.trim() && item.answer.trim()
            );
            if (validFollowUps.length > 0) {
                followUpSection = `\n\nAdditional Context from Follow-up Questions:\n${validFollowUps.map(item => `Q: ${item.question}\nA: ${item.answer}`).join('\n\n')}`;
            }
        }

        const personaUserPrompt = `
---
Context Provided:
"""${context}"""

User's Specific Query/Worry about this Context:
"${query}"${followUpSection}

Your direct, concise, analytical response (approx 100-150 words, using two newlines for paragraph breaks and **bold text** for emphasis):
        `;

        const personaMessages = [
            { role: 'system', content: personaSystemPrompt },
            { role: 'user', content: personaUserPrompt }
        ];

        console.log(`--- FINAL ${name} Prompt being sent (System + User): ---`);
        console.log("System:", personaSystemPrompt.substring(0, 100) + "...");
        console.log("User:", personaUserPrompt.substring(0, 100) + "...\n");

        let personaResponseText = `[Analysis Error: Generation failed for ${name}]`; // Default error state
        try {
            const rawText = await getOpenRouterCompletion(
                personaMessages,
                modelName,
                defaultTemperature,
                undefined // Pass undefined for maxTokens
            );
            console.log(`ROUTE Raw ${name} Response:`, JSON.stringify(rawText?.substring(0,100))+"...");

            // *** CHANGED: Handle empty response without throwing immediately ***
            if (rawText === null || rawText.trim() === "") {
                console.warn(`ROUTE: AI model returned an empty response for ${name}.`);
                personaResponseText = `[Analysis Error: Empty response received for ${name}]`;
            } else {
                let text = cleanApiResponseText(rawText); // Apply robust cleaning
                console.log(`ROUTE Cleaned ${name} Response:`, JSON.stringify(text.substring(0,100))+"...");

                // Post-cleaning check for Coach list format (keep this logic)
                if (name.includes("Coach") && /^\s*[1-9]+\.\s+/m.test(text)) {
                    console.warn(`Coach response contained numbered list despite prompt - attempting cleanup on: ${text.substring(0,50)}...`);
                    text = text.replace(/^\s*[1-9]+\.\s+/gm, '** ')
                               .replace(/\n\n\*\*/g, '\n\n** ')
                               .replace(/(\S+)\n(?!\n|\*\*)/g, '$1 ');
                    text = cleanApiResponseText(text); // Clean again
                    console.warn(`Coach response after cleanup attempt: ${text.substring(0,50)}...`)
                }

                if (!text || text.length < 10) { // Check if cleaning resulted in empty/short text
                    console.error(`ROUTE Empty or invalid response from persona ${name} after cleaning for query: ${query}`);
                    personaResponseText = `[Analysis Error: Empty response received for ${name}]`;
                } else {
                    // UK English check (keep this logic)
                    if (/\b(analyse|behaviour|colour|centre|realise|optimise)\b/i.test(text)) {
                        console.warn(`ROUTE Potential US spelling detected in ${name} response.`);
                    }
                    personaResponseText = text; // Assign successful response
                }
            }
        } catch (error) {
            console.error(`ROUTE Error generating response for persona ${name}:`, error);
             // Assign error text based on API error type
             if (error.message && (error.message.includes("API key") || error.status === 401)) { personaResponseText = "[Analysis Error: Invalid API Key]"; }
             else if (error.message && (error.message.includes("quota") || error.status === 429)) { personaResponseText = "[Analysis Error: API Quota Exceeded]"; }
             // else if (error.message && error.message.includes("SAFETY")) { personaResponseText = "[Analysis Error: Content blocked by safety filter]"; }
             else { personaResponseText = `[Analysis Error: ${error.message || 'Unknown error'}]`; }
        }
        // Always return an object, even if response is an error string
        return { persona: name, response: personaResponseText };
    });

    const responses = await Promise.all(personaPromises);
    // Filter for valid responses *after* all promises resolve
    const validResponses = responses.filter(r => r.response && !r.response.startsWith("["));

    // --- Error Message Aggregation (logic remains the same) ---
    let errorMessage = null;
    const errorMessages = [...new Set(responses
        .map(r => r.response)
        .filter(r => r && r.startsWith("[")) // Collect all error strings
        .map(e => e.replace(/^\[|\]$/g, ''))
    )];
    if (paraphraseText.startsWith("[")) { // Check paraphrase error state
        const paraphraseErrorMsg = paraphraseText.replace(/^\[|\]$/g, '');
        if (!errorMessages.some(msg => msg.includes('Paraphrase Error'))) {
            errorMessages.push(paraphraseErrorMsg);
        }
    }
    // Check if *any* valid responses were generated
    if (validResponses.length === 0) {
        errorMessage = errorMessages.length > 0
            ? `Analysis failed. Issues: ${errorMessages.join('; ')}`
            : "Analysis failed: Could not generate insights from any perspective.";
        console.error("ROUTE: No valid persona responses generated. Returning 500.");
        const resultId = nanoid(10);
        // Return 500 only if *nothing* worked
        return Response.json({
            resultId: resultId, error: errorMessage, responses: [], summary: '', paraphrase: paraphraseText
        }, { status: 500 });
    } else if (errorMessages.length > 0) {
        // If some responses worked but others failed, report as partial success
        errorMessage = `Analysis may be incomplete. Issues: ${errorMessages.join('; ')}`;
    }


    // --- Generate Summary ---
    let summaryText = "[Summary generation failed]"; // Default error state
    if (validResponses.length > 0) { // Only generate summary if we have something to summarize
        console.log(`\n--- ROUTE: Constructing Summary Prompt ---`);
        console.log(`Found ${validResponses.length} valid responses for summary.`);

        // Prepare follow-up responses section if available (same as above)
        let followUpSection = '';
        if (followUpResponses && Array.isArray(followUpResponses) && followUpResponses.length > 0) {
            const validFollowUps = followUpResponses.filter(item =>
                item && typeof item.question === 'string' && typeof item.answer === 'string' &&
                item.question.trim() && item.answer.trim()
            );
            if (validFollowUps.length > 0) {
                followUpSection = `\n\nAdditional Context from Follow-up Questions:\n${validFollowUps.map(item => `Q: ${item.question}\nA: ${item.answer}`).join('\n\n')}`;
            }
        }

         const summarySystemPrompt = `
Based *only* on the analyses provided below, synthesize their critical conclusions into a unified verdict regarding the user's query about the context. Address 'you' directly. Use **plain British English**. Be direct, definitive, helpful. Use paragraph breaks (two newlines). **Emphasise key findings/actions using double asterisks** where appropriate for clarity, but do not rely on it for structure. Target 90-120 words.

**CRITICAL:** Provide a direct, concise verdict **specifically answering the user's original query**: "${query}" **as the very first sentence**. State your position clearly with minimal hedging.

**CRITICAL:** NO persona names, NO meta-talk about summarizing, NO references to "the analyses" or "based on the analyses", NO greetings. Start directly with the verdict statement, then provide the rest of the direct feedback as if speaking directly to the user.
         `;
         const summaryUserPrompt = `
Analyses Provided for Synthesis:
${validResponses.map(r => `### ${r.persona}\n${r.response}`).join('\n\n')}${followUpSection}

---
Your Synthesized Verdict (starting directly with the verdict sentence):
         `;
         const summaryMessages = [
             { role: 'system', content: summarySystemPrompt },
             { role: 'user', content: summaryUserPrompt }
         ];

       console.log(`--- FINAL Summary Prompt being sent (System + User): ---`);
       console.log("System:", summarySystemPrompt.substring(0, 100) + "...");
       console.log("User:", summaryUserPrompt.substring(0, 100) + "...\n");

        try {
            const rawSummary = await getOpenRouterCompletion(
                summaryMessages,
                modelName,
                defaultTemperature,
                undefined // Pass undefined for maxTokens
            );
            console.log("ROUTE Raw Summary:", JSON.stringify(rawSummary));

            // *** CHANGED: Handle empty response without throwing immediately ***
            if (rawSummary === null || rawSummary.trim() === "") {
                 console.warn("ROUTE: AI model returned an empty response for summary.");
                 summaryText = "[Summary Error: Empty response received]";
            } else {
                summaryText = cleanApiResponseText(rawSummary); // Apply robust cleaning
                console.log("ROUTE Cleaned Summary:", JSON.stringify(summaryText));

                // Summary validation checks (keep existing logic)
                const lowerCaseSummary = summaryText.toLowerCase();
                const forbiddenWords = ["therapist", "analyst", "coach", "synthesis", "template", "summarize", "summary template"];
                const forbiddenStarts = ["okay, i understand", "here's a summary", "based on the analyses", "in summary,"];
                if ( !summaryText || summaryText.length < 10 || summaryText.length > 1000 || summaryText.startsWith("[") || // Check if cleaning resulted in error state
                     (forbiddenWords.some(word => lowerCaseSummary.includes(word)) ||
                      forbiddenStarts.some(start => lowerCaseSummary.startsWith(start))) ) {
                     console.warn("ROUTE Generated summary seems invalid (failed checks or too short/long) after cleaning:", summaryText);
                     const failureReason = summaryText && summaryText.startsWith("[") ? summaryText : "[Summary generation failed - invalid content received]";
                     summaryText = failureReason; // Assign error state
                }
                // UK English check (keep this logic)
                if (summaryText && !summaryText.startsWith("[") && /\b(analyse|behaviour|colour|centre|realise|optimise)\b/i.test(summaryText)) {
                    console.warn(`ROUTE Potential US spelling detected in Summary response.`);
                }
            }

        } catch (error) {
            console.error("ROUTE Error generating summary:", error);
            // Assign error text based on API error type
            if (error.message && (error.message.includes("API key") || error.status === 401)) { summaryText = "[Summary Error: Invalid API Key]"; }
            else if (error.message && (error.message.includes("quota") || error.status === 429)) { summaryText = "[Summary Error: API Quota Exceeded]"; }
            // else if (error.message && error.message.includes("SAFETY")) { summaryText = "[Summary Error: Content blocked by safety filter]"; }
            else { summaryText = `[Summary generation failed: ${error.message || 'Unknown error'}]`; }
        }
        // Add summary error to overall message if needed
        if (summaryText.startsWith("[")) {
             const summaryErrorMsg = summaryText.replace(/^\[|\]$/g, '');
             if (!errorMessage) errorMessage = summaryErrorMsg;
             else if (!errorMessage.includes(summaryErrorMsg)) errorMessage += `; ${summaryErrorMsg}`;
        }

    } else {
        // Keep existing logic for skipping summary
        console.warn("ROUTE Skipping summary generation as there were no valid persona responses (already handled).");
        summaryText = "[Summary generation skipped - no valid analysis provided]";
        const skipMsg = "Summary generation skipped";
        if (!errorMessage) errorMessage = skipMsg;
        else if (!errorMessage.includes(skipMsg)) errorMessage += "; " + skipMsg;
    }

    // Add paraphrase error if not already included (keep existing logic)
    if (paraphraseText.startsWith("[") && (!errorMessage || !errorMessage.includes("Paraphrase Error"))) {
        const paraphraseErrorMsg = paraphraseText.replace(/^\[|\]$/g, '');
        if (!errorMessage) errorMessage = paraphraseErrorMsg;
        else if (!errorMessage.includes(paraphraseErrorMsg)) errorMessage += "; " + paraphraseErrorMsg;
    }

    // --- Save Results to Redis (logic remains the same) ---
    const resultId = nanoid(10);
    const key = `result:${resultId}`;
    console.log(`ROUTE Generated result ID: ${resultId}`);
    const generatedSnippets = []; // Placeholder
    const dataToSave = {
      context: context,
      query: query,
      summary: summaryText, // Save summary (even if it's an error string)
      paraphrase: paraphraseText, // Save paraphrase (even if it's an error string)
      // Save only responses that didn't fail, but include error strings in the overall errorMessage
      responses: JSON.stringify(validResponses),
      snippets: JSON.stringify(generatedSnippets),
      timestamp: new Date().toISOString(),
      followUpResponses: JSON.stringify(followUpResponses || [])
    };
    try {
        await redis.hset(key, dataToSave);
        console.log(`ROUTE Successfully saved results to Redis key: ${key}`);
    } catch (redisError) {
        console.error(`ROUTE Failed to save results to Redis key ${key}:`, redisError);
        const redisErrorMsg = `Failed to save results: ${redisError.message || 'Unknown Redis error'}`;
        if (!errorMessage) errorMessage = redisErrorMsg;
        else errorMessage += `; ${redisErrorMsg}`;
        // Return 500 if saving fails
        return Response.json({
            resultId: resultId, error: errorMessage,
        }, { status: 500 });
    }

    // --- Return Response with ID (logic remains the same) ---
    // Return 200 OK, include aggregated error message if any part failed
    console.log("ROUTE Returning final response with resultId to frontend:", { resultId: resultId, error: errorMessage, summary: summaryText.substring(0,50)+"...", paraphrase: paraphraseText.substring(0,50)+"...", responsesCount: validResponses.length });
    return Response.json({
        resultId: resultId,
        error: errorMessage, // Include aggregated errors
        followUpIncluded: !!(followUpResponses && Array.isArray(followUpResponses) && followUpResponses.length > 0)
    });
}