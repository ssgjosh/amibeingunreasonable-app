import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// --- PERSONA PROMPTS (v5.1 - Therapist focus corrected, Analyst No A/B, Coach No Numbers) ---
const personas = [
    {
        name: "Therapist (Interaction Dynamics)",
        prompt: `
You are an objective psychotherapist analysing interaction dynamics described in the context. Use **British English**. Address 'you' directly. Use paragraph breaks (\n\n), **bold text**, and lists for clarity if helpful. Be **concise**.
**Lead with your assessment of the core psychological dynamic at play in the situation.**
Based *exclusively* on the provided context and considering the user's query:
1.  Identify the **primary psychological conflict** evident in the *interaction described* (e.g., boundary violation, power struggle, mismatched expectations, communication styles). **Validate objective concerns** mentioned in the context first (e.g., "The health concern you described is objectively valid...").
\n\n
2.  Briefly analyse the likely **emotional drivers and assumptions** for **both** parties *as demonstrated by their actions/statements in the context*.
\n\n
3.  Identify the main **communication breakdown** and **negative feedback loop** shown in the context. How do the actions of each party likely reinforce the dynamic?
\n\n
4.  Briefly reflect on any **apparent biases** evident in *your description* of the events (e.g., favouring one side, overlooking contributing factors you mentioned). Understanding these helps see the full picture of the interaction.
        `
    },
    {
        name: "Analyst (Logical Assessment)",
        prompt: `
You are a ruthless logical analyst. Use **British English**. Address 'you' directly. Use paragraph breaks (\n\n), **bold text**. **Be extremely concise.** NO hedging.
**Immediately state your definitive conclusion (Yes/No/Partially) to the user's query ("Am I wrong?" or similar).**
1. Justify briefly: Note any **unsupported assumptions** in the context description ('Proof Absent' / 'Logically Supported').
\n\n
2. State the **most logically probable primary trigger** for the conflict/reaction by *briefly describing the key event* from the context (e.g., "The initial critique", "The missed message", "The boundary violation").
\n\n
3. Is the other party's described reaction **logically proportionate** to that trigger based *only* on the text? Yes/No.
\n\n
4. Is *your* described reaction a **logically effective strategy** or a **fallacy**?
\n\n
5. Reiterate your **Conclusion (Yes/No/Partially)** with the core logical reason derived *only* from the text.
        `
    },
    {
        name: "Coach (Strategic Action)",
        prompt: `
You are a results-oriented strategic coach. Use **British English**. Address 'you' directly. Use paragraph breaks (\n\n) and **bold text** for key actions/wording. Use plain language. **Be concise.**
**Lead with your assessment of the current strategy's effectiveness.**
1. Are current actions (yours and others described) **'Effective'** or **'Ineffective/Counterproductive'**?
\n\n
2. State the **most critical strategic objective** now.
\n\n
3. Provide the **most strategically advantageous** action plan as a series of clear steps. Use paragraph breaks between steps and **bold text for key actions or suggested wording**, but **do not use explicit numbers (1, 2, 3)**.
\n\n
4. Address the query's *underlying goal*: Explain why the action plan is **strategically superior** to focusing only on blame or 'rightness' for achieving your likely objective.
Focus ruthlessly on the best possible outcome.
        `
    },
];

export async function POST(request) {
    const { context, query } = await request.json();

    if (!context || typeof context !== 'string' || context.trim().length < 10) { return Response.json({ error: "Context description required (min 10 chars)." }, { status: 400 }); }
    if (!query || typeof query !== 'string' || query.trim().length < 5) { return Response.json({ error: "Specific query/worry required (min 5 chars)." }, { status: 400 }); }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro-preview-03-25" });
    const generationConfig = { temperature: 0.6 };

    // --- Generate Paraphrase ---
    const paraphrasePrompt = `
    You are an expert summariser using British English.
    Read the following user-provided context describing a situation.
    Paraphrase the absolute core essence of the situation **from the user's perspective ('You feel...', 'Your situation involves...')** in **one single, concise sentence** (maximum 25-30 words). Focus on the central conflict or circumstances described. Do not add analysis or opinion.

    Context Provided:
    --- START CONTEXT ---
    ${context}
    --- END CONTEXT ---

    Your one-sentence paraphrase starting with "You..." or describing "Your situation...":
    `;
    let paraphraseText = "[Paraphrase generation failed]";
    try {
        const paraphraseResult = await model.generateContent(paraphrasePrompt, { maxOutputTokens: 60 });
        const paraphraseResponse = await paraphraseResult.response;
        paraphraseText = paraphraseResponse.text ? paraphraseResponse.text().trim() : paraphraseText;
         if (paraphraseText.startsWith("[")) { console.warn("Paraphrase generation returned default error state."); }
         else if (paraphraseText.split(' ').length > 35) { console.warn("Generated paraphrase exceeded length constraint."); }
    } catch (error) {
        console.error("Error generating paraphrase:", error);
    }

    // --- Generate Persona Responses ---
    const personaPromises = personas.map(async ({ name, prompt }) => {
        const fullPrompt = `
${prompt}

---
IMPORTANT: Ensure all output uses British English spelling and phrasing. Do **NOT** use numbered lists for the Coach action plan, use paragraph breaks and bolding instead. Use Markdown lists only if essential for clarity elsewhere.
Analyze the following context and the user's query about it using the persona described above. Ensure your response uses paragraph breaks (\n\n) for readability and **bold text** for emphasis on key points as instructed. Be concise and lead with your most critical finding.

Context Provided:
--- START CONTEXT ---
${context}
--- END CONTEXT ---

User's Specific Query/Worry about this Context:
"${query}"

Your direct, concise, analytical response (approx 100-150 words):
    `;
        try {
            const result = await model.generateContent(fullPrompt, generationConfig);
            const response = await result.response;
            const text = response.text ? response.text().trim() : '';
             if (!text || text.length < 10) {
                console.error(`Empty or invalid response from persona ${name} for query: ${query}`);
                return { persona: name, response: "[Error generating analytical response]" };
            }
            return { persona: name, response: text };
        } catch (error) {
            console.error(`Error generating response for persona ${name}:`, error);
            return { persona: name, response: `[Error generating response: ${error.message || 'Unknown error'}]` };
        }
    });
    const responses = await Promise.all(personaPromises);
    const validResponses = responses.filter(r => !r.response.startsWith("[Error"));

    let errorMessage = null;
    const errorMessages = responses.map(r => r.response).filter(r => r.startsWith("[Error"));
    if (validResponses.length === 0) {
        errorMessage = errorMessages.length > 0 ? errorMessages.join('; ') : "Failed to generate analysis from any persona.";
        return Response.json({ error: errorMessage, responses: [], summary: '', paraphrase: paraphraseText }, { status: 500 });
    } else if (errorMessages.length > 0) {
        errorMessage = `Analysis may be incomplete. ${errorMessages.join('; ')}`;
    }


    // --- Generate Summary ---
    const summaryPrompt = `
    Based *only* on the Therapist, Analyst, and Coach analyses provided below, synthesize their *single most critical conclusion* regarding the user's query about the context. Address the user directly as 'you'. Use **plain British English**. Be brutally direct and definitive. Use paragraph breaks (\n\n) and **bold text**. Aim for roughly **3 distinct points** covering dynamics, justification, and action (target 90-120 words total).

    Analyses:
    ${validResponses.map(r => `### ${r.persona}\n${r.response}`).join('\n\n')}

    ---
    Synthesis Requirements: Extract ONLY the most critical judgment/advice point from each analysis, expressed in plain language:
    1.  **Therapist's Core Insight:** (Briefly explain the key psychological dynamic or bias identified *in the situation*).
    2.  **Analyst's Definitive Answer:** (State **Yes/No/Partially** regarding the query's conclusion, and the core logical justification).
    3.  **Coach's Essential Action:** (State the crucial next step and its primary benefit).
    Combine these into a cohesive summary. No hedging. Start directly with the synthesis.
    Summary:
      `;
    let summaryText = "[Summary generation failed]";
    try {
        const summaryResult = await model.generateContent(summaryPrompt, { maxOutputTokens: 180 });
        const summaryResponse = await summaryResult.response;
        summaryText = summaryResponse.text ? summaryResponse.text().trim() : '';
        if (summaryText.toLowerCase().includes("synthesis requirements") || summaryText.length < 30) {
             console.warn("Generated summary seems invalid or too short:", summaryText);
             summaryText = summaryText.startsWith("[") ? summaryText : "[Summary generation failed - invalid content]";
             if (!errorMessage) errorMessage = "Summary generation failed.";
        }
    } catch (error) {
        console.error("Error generating summary:", error);
        summaryText = `[Summary generation failed: ${error.message || 'Unknown error'}]`;
        if (!errorMessage) errorMessage = "Summary generation failed.";
    }

     if (paraphraseText.startsWith("[") && !errorMessage) {
         errorMessage = "Context paraphrase failed.";
     }

    // Return all parts
    return Response.json({ responses: validResponses, summary: summaryText, paraphrase: paraphraseText, error: errorMessage });
}