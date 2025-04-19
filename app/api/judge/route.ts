import { NextResponse } from 'next/server';
export const maxDuration = 60; // Set Vercel timeout to 60 seconds
// Removed: import { HarmCategory, HarmBlockThreshold, GenerativeModel } from '@google/generative-ai';
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions'; // Added for typing
import { therapistPersona } from '@/app/prompts/therapist';
import { analystPersona } from '@/app/prompts/analyst';
import { coachPersona } from '@/app/prompts/coach';
import { validateJudgeResponse, JudgeResultValidated } from '@/lib/validateJudge';
import { retrieveSnippets, Snippet } from '@/lib/retrieveSnippets';
// Removed: import { getGemini } from '../../../lib/geminiClient';
import { getOpenRouterCompletion, openRouter } from '@/lib/openRouterClient'; // Changed import + added openRouter
// Removed: import { domainKeywords, approvedDomainSet, ApprovedDomain } from '@/lib/domainKeywords';
import { Redis } from '@upstash/redis'; // Import Redis
import { nanoid } from 'nanoid'; // Import nanoid

// Initialize Upstash Redis client
const redis = new Redis({
  url: process.env.STORAGE_KV_REST_API_URL!, // Use non-null assertion or handle potential undefined
  token: process.env.STORAGE_KV_REST_API_TOKEN!, // Use non-null assertion or handle potential undefined
});

// Removed Type Guard for ApprovedDomain

// --- Define Constants ---
const REDIS_SUMMARY_KEY = 'source_summaries';
const RELEVANCE_MODEL = 'openai/gpt-4.1-mini'; // Changed model as requested
const TOP_N_SOURCES = 3; // Number of relevant sources to retrieve

// --- Define the JudgeResult Interface (for inclusion in the prompt) ---
const judgeResultInterfaceString = `
interface JudgeResult {
  paraphrase: string; // A concise one-sentence summary from your perspective (max 25-30 words)
  personas: {
    name: "Therapist" | "Analyst" | "Coach"; // The specific persona
    // verdict removed
    rationale: string; // The detailed reasoning/analysis in paragraph form (NO bullet points or lists), following the specific persona's system prompt below - MUST cite references like [1] if provided and relevant
    // key_points removed
  }[]; // Array containing results from Therapist, Analyst, and Coach IN THAT ORDER.
  summary: string; // Detailed unified verdict (approx 90-120 words) starting directly with verdict sentence + core justification (neutral, authoritative) - MUST cite references like [1] if provided and relevant
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

  const { context, query, followUpResponses } = requestBody; // Added followUpResponses

  // --- Input Validation ---
  if (!context || typeof context !== 'string' || context.trim().length < 10) {
    console.warn("Judge Route: Validation failed: Context insufficient.");
    return NextResponse.json({ error: "Context description required (min 10 chars)." }, { status: 400 });
  }
  if (!query || typeof query !== 'string' || query.trim().length < 5) {
    console.warn("Judge Route: Validation failed: Query insufficient.");
    return NextResponse.json({ error: "Specific query/worry required (min 5 chars)." }, { status: 400 });
  }

  // --- Semantic Relevance Matching ---
  let relevantSourceUrls: string[] = [];
  let snippets: Snippet[] = [];
  const userQueryCombined = `${context}\n\nQuery: ${query}`; // Combine context and query for relevance check

  try {
      console.log(`[Judge Route] Fetching summaries from Redis hash: ${REDIS_SUMMARY_KEY}`);
      const summariesMap = await redis.hgetall(REDIS_SUMMARY_KEY);

      if (!summariesMap || Object.keys(summariesMap).length === 0) {
          console.warn(`[Judge Route] No summaries found in Redis hash '${REDIS_SUMMARY_KEY}'. Skipping RAG.`);
      } else {
          console.log(`[Judge Route] Found ${Object.keys(summariesMap).length} summaries in Redis.`);
          const availableResources = Object.entries(summariesMap)
              .map(([url, summary]) => ({ url, summary: summary as string })) // Type assertion
              .filter(item => item.summary && item.summary.length > 10); // Basic validation

          if (availableResources.length > 0) {
              const relevancePrompt = `
User Query: "${userQueryCombined}"

Available Resources:
${JSON.stringify(availableResources, null, 2)}
Task: Based *only* on the User Query and the summaries provided in Available Resources, identify **up to ${TOP_N_SOURCES} resources** whose primary subject matter directly addresses the main topic of the User Query. **Strictly prioritize direct relevance.** Do **NOT** include resources that are only tangentially related or focus on secondary aspects like emotional impact. Return *only* a valid JSON array containing the URLs of these directly relevant resources, ordered from most to least relevant. If fewer than ${TOP_N_SOURCES} resources are directly relevant, return only those that are. If **no resources** are directly relevant to the main topic (e.g., the query is about gardening and the resources are about tenancy disputes), you MUST return an empty array []. Example format: ["url_most_relevant", "url_second_most"]

`;

              console.log(`[Judge Route] Sending relevance check prompt to ${RELEVANCE_MODEL}...`);
              // Use getOpenRouterCompletion directly for this specific, simpler call
              const relevanceResponse = await getOpenRouterCompletion(
                  [{ role: 'user', content: relevancePrompt }],
                  RELEVANCE_MODEL,
                  0.2, // Low temperature for deterministic ranking
                  200 // Max tokens for the URL list
              );

              if (relevanceResponse) {
                  try {
                      // Attempt to parse the response as a JSON array of strings
                      const parsedUrls = JSON.parse(relevanceResponse);
                      if (Array.isArray(parsedUrls) && parsedUrls.every(item => typeof item === 'string')) {
                          relevantSourceUrls = parsedUrls.slice(0, TOP_N_SOURCES); // Ensure max TOP_N
                          console.log(`[Judge Route] AI identified ${relevantSourceUrls.length} relevant URLs:`, relevantSourceUrls);
                      } else {
                          console.error("[Judge Route] Relevance AI response was not a valid JSON array of strings:", relevanceResponse);
                      }
                  } catch (parseError) {
                      console.error("[Judge Route] Failed to parse relevance AI response JSON:", parseError);
                      console.error("[Judge Route] Failing Raw Text:", relevanceResponse);
                  }
              } else {
                  console.error("[Judge Route] Empty response received from relevance AI.");
              }
          } else {
               console.log("[Judge Route] No valid summaries available after filtering.");
          }
      }
  } catch (error: any) {
      console.error("[Judge Route] Error during semantic relevance matching:", error.message || error);
      // Continue without snippets if relevance matching fails
      relevantSourceUrls = [];
  }

  // --- Snippet Retrieval (using relevantSourceUrls) ---
  if (relevantSourceUrls.length > 0) {
    try {
      // Pass the identified relevant URLs and the original context/query
      // Assuming retrieveSnippets is updated to accept string[] instead of ApprovedDomain
      snippets = await retrieveSnippets(relevantSourceUrls, userQueryCombined);
      console.log(`[Judge Route] Retrieved ${snippets.length} snippets based on semantic relevance.`);
    } catch (error: any) {
      console.error(`[Judge Route] Error retrieving snippets for relevant URLs:`, error.message || error);
      snippets = []; // Ensure snippets is empty on error
    }
  } else {
      console.log("[Judge Route] No relevant source URLs identified. Skipping snippet retrieval.");
  }

  // --- Define Model Config (Now passed to helper) ---
  const modelName = "openai/gpt-4.1"; // Target model
  const temperature = 0.5;
  // const maxOutputTokens = 2048; // REMOVED hardcoded limit

  // --- Get Gemini Model (REMOVED) ---
  // The OpenRouter client is instantiated in its own module and called by the helper.
  // Error handling for client setup is within openRouterClient.ts

  // --- Construct the Prompt Components ---
  // Embed the actual system prompts for each persona
  const embeddedPersonaPrompts = `
--- Therapist Persona System Prompt ---
${therapistPersona.system}

--- Analyst Persona System Prompt ---
${analystPersona.system}

--- Coach Persona System Prompt ---
${coachPersona.system}
`;

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

**Persona System Prompts (Follow these for each persona's 'rationale'):**
${embeddedPersonaPrompts}

**Output Requirements:**
1.  Generate the 'paraphrase' field: A single, concise sentence (max 25-30 words) summarizing the core conflict/situation from your perspective, using British English.
2.  Generate the 'personas' array: Include entries for "Therapist", "Analyst", and "Coach" IN THAT ORDER. Each entry must follow the structure defined in the interface (NOTE: no 'verdict' field for personas). **CRITICAL: The 'rationale' for each persona MUST follow the specific instructions in the corresponding embedded system prompt above AND be detailed paragraphs. The rationale MUST NOT EXCEED approximately 120 words. Be concise. Do NOT use bullet points or numbered lists within the rationale.** Use British English. Address 'you' directly in the rationale.
3.  Generate the 'summary' field: Synthesize the key findings into a detailed unified verdict (approx 90-120 words). Start *directly* with the verdict sentence answering your query (e.g., 'Yes, you are not being unreasonable primarily because...'). Provide the core justification derived from the synthesized analysis. The tone must be neutral, authoritative, and conclusive. Use British English. Address 'you' directly.
4.  Ensure the entire output is *only* the valid JSON object.
${citationInstruction} {/* Inserted Citation Rules */}
`;
// --- User Prompt for OpenRouter ---
// Prepare follow-up responses section if available
let followUpSection = '';
if (followUpResponses && Array.isArray(followUpResponses) && followUpResponses.length > 0) {
    const validFollowUps = followUpResponses.filter(item =>
        item && typeof item.question === 'string' && typeof item.answer === 'string' &&
        item.question.trim() && item.answer.trim()
    );
    if (validFollowUps.length > 0) {
        followUpSection = `\n\n**Additional Context from Follow-up Questions:**\n${validFollowUps.map(item => `Q: ${item.question}\nA: ${item.answer}`).join('\n\n')}`;
    }
}

const userPromptContent = `
${referencesBlock} {/* Inserted References Block */}


**Task:**
Based *exclusively* on the context and query provided by 'you' below, generate the JSON object according to the interface and instructions in the system prompt.

**Your Context:**
"""
${context}
"""

**Your Specific Query/Worry:**
"${query}"${followUpSection} {/* Added Follow-up Section */}

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
    // --- Save Results to Redis ---
    const resultId = nanoid(10);
    const key = `result:${resultId}`;
    console.log(`Judge Route: Generated result ID: ${resultId}`);

    const dataToSave = {
      context: context,
      query: query,
      summary: result.data.summary, // from validated AI response
      paraphrase: result.data.paraphrase, // from validated AI response
      // IMPORTANT: Stringify arrays/objects for Redis hash
      responses: JSON.stringify(result.data.personas), // Save validated personas
      snippets: JSON.stringify(snippets || []), // Save snippets if RAG was used
      timestamp: new Date().toISOString(),
      // Save initial clarifying questions if they were passed in
      followUpResponses: JSON.stringify(followUpResponses || [])
    };

    try {
        await redis.hset(key, dataToSave);
        console.log(`Judge Route: Successfully saved results to Redis key: ${key}`);
        // SET EXPIRATION IF NEEDED: await redis.expire(key, EXPIRATION_SECONDS);

        // On success, return ONLY the resultId
        return NextResponse.json({ resultId: resultId }, { status: 200 });

    } catch (redisError: any) {
        console.error(`Judge Route: Failed to save results to Redis key ${key}:`, redisError);
        // Return 500 if saving fails, critical step
        return NextResponse.json({ error: `Failed to save results: ${redisError.message || 'Unknown Redis error'}` }, { status: 500 });
    }

  } else {
    // Ensure error responses do not include resultId
    return NextResponse.json({ error: result.error, details: result.details }, { status: result.status });
  }
}