import { NextResponse } from 'next/server';
// Removed: import { HarmCategory, HarmBlockThreshold, GenerativeModel } from '@google/generative-ai';
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions'; // Added for typing
import { therapistPersona } from '@/app/prompts/therapist';
import { analystPersona } from '@/app/prompts/analyst';
import { coachPersona } from '@/app/prompts/coach';
import { validateJudgeResponse, JudgeResultValidated } from '@/lib/validateJudge';
import { retrieveSnippets, Snippet } from '@/lib/retrieveSnippets';
// Removed: import { getGemini } from '../../../lib/geminiClient';
import { getOpenRouterCompletion } from '@/lib/openRouterClient'; // Changed import
import { domainKeywords, approvedDomainSet, ApprovedDomain } from '@/lib/domainKeywords';

// --- Define Type Guard using the imported Set ---
function isApprovedDomain(domain: string): domain is ApprovedDomain {
    return approvedDomainSet.has(domain);
}

// --- Define the JudgeResult Interface (for inclusion in the prompt) ---
const judgeResultInterfaceString = `
interface JudgeResult {
  paraphrase: string; // A concise one-sentence summary from your perspective (max 25-30 words)
  personas: {
    name: "Therapist" | "Analyst" | "Coach"; // The specific persona providing the verdict
    verdict?: "Yes" | "No" | "Partially"; // Optional: The persona's judgment (Not used by Analyst)
    rationale: string; // The reasoning/analysis - MUST cite references like [1] if provided and relevant
    key_points: [string, string, string]; // Three distinct key takeaways or observations
  }[]; // Array containing results from Therapist, Analyst, and Coach IN THAT ORDER.
  summary: string; // Unified verdict starting directly with verdict sentence + core justification (neutral, authoritative) - MUST cite references like [1] if provided and relevant
}
`;

// --- Helper Function: AI Call with Retry and Validation (Refactored for OpenRouter) ---
async function callOpenRouterWithRetry(
    systemPrompt: string,
    userPrompt: string,
    numSnippets: number,
    modelName: string = "openai/gpt-4.1", // Default OpenRouter model
    temperature: number = 0.5, // Match previous config
    maxTokens?: number // *** CHANGED: Make maxTokens optional ***
): Promise<{ success: true; data: JudgeResultValidated } | { success: false; error: string; details?: any; status: number }> {
    let retryCount = 0;
    let lastError: { error: string; details?: any; status: number } | null = null;

    const messages: ChatCompletionMessageParam[] = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
    ];

    while (retryCount <= 1) { // Allow one retry (total 2 attempts)
        try {
            console.log(`Judge Route: Attempt ${retryCount + 1} - Sending prompt to OpenRouter model '${modelName}'...`);

            // Call the OpenRouter client, passing maxTokens (which might be undefined)
            const rawText = await getOpenRouterCompletion(
                messages,
                modelName,
                temperature,
                maxTokens // Pass the potentially undefined value through
            );

            if (rawText === null || rawText.trim() === "") {
                console.error(`Judge Route: Attempt ${retryCount + 1} - Empty response received from OpenRouter model.`);
                lastError = { error: "AI model returned an empty response.", status: 500 };
                retryCount++;
                continue;
            }

            console.log(`Judge Route: Attempt ${retryCount + 1} - Raw AI Response Text (start):`, rawText.substring(0, 100) + "...");

            // --- Strict JSON Parsing ---
            let parsedJson: any;
            try {
                // Attempt to parse the response string as JSON
                parsedJson = JSON.parse(rawText);
            } catch (e) {
                console.error(`Judge Route: Attempt ${retryCount + 1} - Failed to parse AI response as JSON:`, e);
                console.error(`Judge Route: Attempt ${retryCount + 1} - Failing Raw Text:`, rawText);
                // Check if it looks like truncated JSON, which might indicate max_tokens was hit
                if (rawText.includes('{') && !rawText.endsWith('}')) {
                     lastError = { error: "Invalid or truncated JSON response from model (potential max_tokens limit?).", details: rawText, status: 400 };
                } else {
                     lastError = { error: "Invalid JSON response from model.", details: rawText, status: 400 };
                }
                retryCount++;
                continue;
            }

            // --- Combined Zod and Citation Validation ---
            const validationResult = validateJudgeResponse(parsedJson, numSnippets);

            if (!validationResult.success) {
                lastError = {
                    error: validationResult.error.message,
                    details: validationResult.error.details,
                    status: 400 // Bad request due to validation failure
                };

                if (validationResult.error.type === 'citation' && retryCount === 0) {
                    console.log(`Judge Route: Retrying due to citation error.`);
                    retryCount++;
                    continue;
                } else if (validationResult.error.type === 'citation') {
                     console.error(`Judge Route: Citation error persisted after retry.`);
                } else {
                     console.warn(`Judge Route: Attempt ${retryCount + 1} - Zod validation failed.`);
                     retryCount++;
                     continue;
                }
            } else {
                // --- Success ---
                console.log(`Judge Route: Attempt ${retryCount + 1} - Successfully parsed and validated response (including citations).`);
                return { success: true, data: validationResult.data };
            }

        } catch (error: any) {
            // --- Handle API Call Errors (from getOpenRouterCompletion) ---
            console.error(`Judge Route: Attempt ${retryCount + 1} - Error during OpenRouter API call or processing:`, error);
            let errorMessage = "An unexpected error occurred during analysis.";
            let statusCode = 500;

            // Check for specific OpenRouter/OpenAI error patterns if needed
            // The getOpenRouterCompletion function already logs details
            if (error.message) {
                 if (error.message.includes("API key") || error.message.includes("Authentication") || (error.status === 401)) {
                    errorMessage = "Server configuration error: Invalid API Key for OpenRouter.";
                    statusCode = 500; // Treat as server config error
                 } else if (error.message.includes("quota") || error.message.includes("Rate limit") || (error.status === 429)) {
                    errorMessage = "API quota or rate limit exceeded. Please try again later.";
                    statusCode = 429;
                 } else if (error.status === 400) { // e.g., bad request to OpenRouter
                     errorMessage = `AI model request failed (Bad Request): ${error.message}`;
                     statusCode = 400;
                 }
                 else {
                    errorMessage = `AI processing failed: ${error.message}`;
                    statusCode = 500; // Default to server error
                 }
            }

            // Don't retry fatal errors like invalid key or quota exceeded
            if (statusCode === 500 || statusCode === 429 || statusCode === 401) {
                 return { success: false, error: errorMessage, status: statusCode, details: error.message };
            }

            // For other potentially transient errors, allow retry
            lastError = { error: errorMessage, status: statusCode, details: error.message };
            retryCount++;
        }
    } // End while loop

    // If loop finishes without success
    console.error("Judge Route: Failed after maximum retries in callOpenRouterWithRetry.");
    const finalError = lastError ?? { error: "Unknown error after retries.", status: 500 };
    return { success: false, ...finalError };
}


// --- API Route Handler ---
export async function POST(request: Request) {

  let requestBody;
  try {
    requestBody = await request.json();
  } catch (e) {
    console.error("Judge Route: Error parsing request body:", e);
    return NextResponse.json({ error: "Invalid request format. Ensure you are sending valid JSON." }, { status: 400 });
  }

  const { context, query } = requestBody;

  // --- Input Validation ---
  if (!context || typeof context !== 'string' || context.trim().length < 10) {
    console.warn("Judge Route: Validation failed: Context insufficient.");
    return NextResponse.json({ error: "Context description required (min 10 chars)." }, { status: 400 });
  }
  if (!query || typeof query !== 'string' || query.trim().length < 5) {
    console.warn("Judge Route: Validation failed: Query insufficient.");
    return NextResponse.json({ error: "Specific query/worry required (min 5 chars)." }, { status: 400 });
  }

  // --- Domain Detection ---
  let detectedDomain: ApprovedDomain | null = null;
  const lowerContext = context.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const combinedText = `${lowerContext} ${lowerQuery}`;
  const keywordHitThreshold = 2;

  for (const [domain, keywords] of Object.entries(domainKeywords)) {
      let hitCount = 0;
      for (const keyword of keywords) {
          const regex = new RegExp(`\\b${keyword.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'gi');
          if (combinedText.match(regex)) {
              hitCount++;
          }
      }

      if (hitCount >= keywordHitThreshold) {
          if (isApprovedDomain(domain)) {
              detectedDomain = domain;
              console.log(`Judge Route: Domain detected: ${detectedDomain} (Hits: ${hitCount})`);
              break;
          } else {
              console.warn(`Judge Route: Keyword match for domain '${domain}' but it's not in approvedDomainSet.`);
          }
      }
  }

  if (!detectedDomain) {
      console.log(`Judge Route: No domain detected meeting threshold (${keywordHitThreshold} hits). Skipping RAG.`);
  }

  // --- Snippet Retrieval ---
  let snippets: Snippet[] = [];
  if (detectedDomain) {
    try {
      snippets = await retrieveSnippets(detectedDomain);
       console.log(`Judge Route: Retrieved ${snippets.length} snippets for domain ${detectedDomain}.`);
    } catch (error) {
       console.error(`Judge Route: Error retrieving snippets for domain ${detectedDomain}:`, error);
       snippets = [];
    }
  }

  // --- Define Model Config (Now passed to helper) ---
  const modelName = "openai/gpt-4.1"; // Target model
  const temperature = 0.5;
  // const maxOutputTokens = 2048; // REMOVED hardcoded limit

  // --- Get Gemini Model (REMOVED) ---
  // The OpenRouter client is instantiated in its own module and called by the helper.
  // Error handling for client setup is within openRouterClient.ts

  // --- Construct the Prompt Components ---
  const personaInstructions = [therapistPersona, analystPersona, coachPersona]
    .map(p => `--- ${p.example.name} Persona --- \nSystem Prompt:\n${p.system}\nExample Output Structure:\n${JSON.stringify(p.example, null, 2)}`)
    .join('\n\n');

  // --- Build References Block and Citation Instruction ---
  let referencesBlock = '';
  let citationInstruction = '';
  if (snippets.length > 0) {
    referencesBlock = '<REFERENCES>\n';
    snippets.forEach((snippet, index) => {
      referencesBlock += `[${index + 1}] (${snippet.url}) ${snippet.text}\n`;
    });
    referencesBlock += '</REFERENCES>\n\n';
    citationInstruction = `
5.  **Citation Rules:**
    *   The <REFERENCES> block below provides relevant snippets. Cite these in your 'rationale' and 'summary' fields using square brackets (e.g., "as stated in the guidance [1]") ***only if*** the snippet directly supports the specific point you are making.
    *   Do NOT add citations just to meet a quota; cite only when genuinely relevant.
    *   Cite *only* the numbers provided (from 1 to ${snippets.length}). Do NOT cite numbers outside this range.
    *   Do NOT reveal the full URL in your prose, only the bracketed number.`;
  } else {
      citationInstruction = `
5.  **Citation Rules:** No references provided. Do NOT invent any citations or use bracketed numbers like [1].`;
  }

  // --- System Prompt for OpenRouter ---
  const systemPromptContent = `
You are an AI assistant tasked with analyzing the situation and query provided by the person asking ('you') from multiple perspectives and returning a structured JSON response. Address 'you' directly in your analysis where appropriate.

**CRITICAL INSTRUCTION:** Your *entire* response MUST be a single, valid JSON object conforming *exactly* to the TypeScript interface provided below. Do NOT include any text, markdown formatting (like \`\`\`json), or explanations before or after the JSON object. Ensure you return all three personas (Therapist, Analyst, Coach) every time, in that specific order. Adhere strictly to the field names, types, and constraints (like string lengths) defined in the schema. Use British English spelling and phrasing.

**TypeScript Interface Definition (for AI guidance):**
\`\`\`typescript
${judgeResultInterfaceString}
\`\`\`

**Persona Roles & Examples:**
${personaInstructions}

**Output Requirements:**
1.  Generate the 'paraphrase' field: A single, concise sentence (max 25-30 words) summarizing the core conflict/situation from your perspective, using British English.
2.  Generate the 'personas' array: Include entries for "Therapist", "Analyst", and "Coach" IN THAT ORDER. Each entry must follow the structure defined in the interface and adhere to the specific system prompts and word counts provided for that persona. Use British English. Address 'you' directly in the rationale. Ensure 'key_points' is always an array of exactly three non-empty strings.
3.  Generate the 'summary' field: Synthesize the key findings into a unified verdict. Start *directly* with the verdict sentence answering your query (e.g., 'Yes, you are not being unreasonable primarily because...'). State the single most crucial justification derived from the synthesized analysis. The tone must be neutral, authoritative, and conclusive. Use British English. Address 'you' directly.
4.  Ensure the entire output is *only* the valid JSON object.
${citationInstruction} {/* Inserted Citation Rules */}
`;

  // --- User Prompt for OpenRouter ---
  const userPromptContent = `
${referencesBlock} {/* Inserted References Block */}

**Task:**
Based *exclusively* on the context and query provided by 'you' below, generate the JSON object according to the interface and instructions in the system prompt.

**Your Context:**
"""
${context}
"""

**Your Specific Query/Worry:**
"${query}"

**Your JSON Response:**
`;

  // --- Call AI Model (Using Refactored Helper) ---
  console.log(`Judge Route: Calling OpenRouter helper with model '${modelName}'...`);
  const result = await callOpenRouterWithRetry(
      systemPromptContent,
      userPromptContent,
      snippets.length,
      modelName,
      temperature,
      undefined // *** CHANGED: Pass undefined for maxTokens ***
  );

  // --- Handle Result ---
  if (result.success) {
    const responseData = { ...result.data, snippets: snippets.length > 0 ? snippets : undefined };
    return NextResponse.json(responseData, { status: 200 });
  } else {
    return NextResponse.json({ error: result.error, details: result.details }, { status: result.status });
  }
}