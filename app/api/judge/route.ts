import { NextResponse } from 'next/server';
import { HarmCategory, HarmBlockThreshold, GenerativeModel } from '@google/generative-ai'; // Removed GoogleGenerativeAI
// import type { JudgeResult } from '@/lib/types'; // Removed: Rely on Zod schema/inferred type
import { therapistPersona } from '@/app/prompts/therapist';
import { analystPersona } from '@/app/prompts/analyst';
import { coachPersona } from '@/app/prompts/coach';
import { JudgeSchema, JudgeResultValidated } from '@/lib/validateJudge'; // Added: Import Zod schema and inferred type
import { retrieveSnippets } from '@/lib/retrieveSnippets'; // Added: Import snippet retriever
import { getGemini } from '../../../lib/geminiClient'; // Corrected: Import path fixed

// --- Define the JudgeResult Interface (for inclusion in the prompt) ---
// This remains useful for constructing the prompt to guide the AI
const judgeResultInterfaceString = `
interface JudgeResult {
  paraphrase: string; // A concise one-sentence summary from your perspective (max 25-30 words)
  personas: {
    name: "Therapist" | "Analyst" | "Coach"; // The specific persona providing the verdict
    verdict: "Yes" | "No" | "Partially"; // The persona's judgment on your query
    rationale: string; // The reasoning behind the verdict (target <= 120 words) - MUST cite references like [1] if provided
    key_points: [string, string, string]; // Three distinct key takeaways or observations
  }[]; // Array containing results from Therapist, Analyst, and Coach IN THAT ORDER.
  summary: string; // A unified verdict and actionable advice, starting directly with the verdict sentence (target <= 120 words) - MUST cite references like [1] if provided
}
`;

// --- Helper Function: AI Call with Retry and Validation ---
// (This function remains largely the same, but now receives the model from getGemini)
async function callGenerativeAIWithRetry(
    model: GenerativeModel,
    prompt: string,
    numSnippets: number // Added: Number of snippets provided for citation validation
): Promise<{ success: true; data: JudgeResultValidated } | { success: false; error: string; details?: any; status: number }> { // Updated return type
    let retryCount = 0;
    let lastError: { error: string; details?: any; status: number } | null = null;

    while (retryCount <= 1) { // Allow one retry (total 2 attempts)
        try {
            console.log(`Judge Route: Attempt ${retryCount + 1} - Sending prompt to AI model...`);
            const result = await model.generateContent(prompt);
            const response = await result.response;

            if (!response || !response.text) {
                console.error(`Judge Route: Attempt ${retryCount + 1} - Empty response received from AI model.`);
                lastError = { error: "AI model returned an empty response.", status: 500 };
                retryCount++;
                continue; // Retry if possible
            }

            const rawText = response.text();
            console.log(`Judge Route: Attempt ${retryCount + 1} - Raw AI Response Text (start):`, rawText.substring(0, 100) + "...");

            // --- Strict JSON Parsing ---
            let parsedJson: any; // Parse into 'any' first before Zod validation
            try {
                parsedJson = JSON.parse(rawText);
            } catch (e) {
                console.error(`Judge Route: Attempt ${retryCount + 1} - Failed to parse AI response as JSON:`, e);
                console.error(`Judge Route: Attempt ${retryCount + 1} - Failing Raw Text:`, rawText);
                lastError = { error: "Invalid JSON response from model.", details: rawText, status: 400 };
                retryCount++;
                continue; // Retry if possible
            }

            // --- Zod Validation ---
            const validationResult = JudgeSchema.safeParse(parsedJson);

            if (!validationResult.success) {
                console.warn(`Judge Route: Attempt ${retryCount + 1} - Zod validation failed.`);
                // Log detailed Zod errors
                console.error("Zod Errors:", JSON.stringify(validationResult.error.flatten(), null, 2));
                lastError = {
                    error: "AI response failed validation.",
                    // Provide structured error details for better debugging
                    details: {
                        message: "The structure or content of the AI's JSON response did not match the expected format.",
                        zodErrors: validationResult.error.flatten() // Include flattened errors
                    },
                    status: 400
                };
                retryCount++;
                continue; // Retry if possible
            }

            // --- Citation Validation (Added) ---
            const validatedData = validationResult.data;
            if (numSnippets > 0) { // Only validate citations if snippets were provided
                const textToCheck = `${validatedData.summary} ${validatedData.personas.map(p => p.rationale).join(' ')}`;
                // Find all occurrences of [number]
                const citationsUsed = textToCheck.match(/\[(\d+)\]/g)?.map(match => parseInt(match.slice(1, -1))) ?? [];
                // Check if any citation number is out of the valid range (1 to numSnippets)
                const invalidCitations = citationsUsed.filter(num => num <= 0 || num > numSnippets);

                if (invalidCitations.length > 0) {
                    console.warn(`Judge Route: Attempt ${retryCount + 1} - Invalid citation found. Used: ${citationsUsed.join(', ')}, Max valid: ${numSnippets}, Invalid: ${invalidCitations.join(', ')}`);
                    lastError = {
                        error: "AI response cited invalid reference number.",
                        details: `Cited [${invalidCitations.join(', ')}] but only ${numSnippets} references were provided.`,
                        status: 400
                    };
                    // Allow ONE retry specifically for citation errors
                    if (retryCount === 0) {
                         console.log(`Judge Route: Retrying due to citation error.`);
                         retryCount++;
                         continue; // Retry immediately
                    } else {
                         // Failed citation check even after retry
                         console.error(`Judge Route: Citation error persisted after retry.`);
                         // Make sure lastError is not null before returning
                         return { success: false, ...(lastError ?? { error: "Citation error after retry", status: 400 }) };
                    }
                }
                 console.log(`Judge Route: Attempt ${retryCount + 1} - Citation validation passed (Used: ${citationsUsed.join(', ') || 'None'}, Provided: ${numSnippets}).`);
            } else {
                 console.log(`Judge Route: Attempt ${retryCount + 1} - Skipping citation validation as no snippets were provided.`);
            }


            // --- Success (including citation validation) ---
            console.log(`Judge Route: Attempt ${retryCount + 1} - Successfully parsed, validated JSON, and checked citations.`);
            return { success: true, data: validatedData }; // Return validatedData

        } catch (error: any) {
            console.error(`Judge Route: Attempt ${retryCount + 1} - Error during AI generation or processing:`, error);
            let errorMessage = "An unexpected error occurred during analysis.";
            let statusCode = 500;
            const blockReason = error?.response?.promptFeedback?.blockReason;

            // Check for specific error types (like safety blocks, API key issues, quota)
            if (blockReason) {
                errorMessage = `Content blocked by safety filters: ${blockReason}`;
                statusCode = 400; // Treat safety blocks as client-side issues (bad prompt) or AI limitations
            } else if (error.message) {
                 if (error.message.includes("API key not valid")) {
                    errorMessage = "Server configuration error: Invalid API Key.";
                    statusCode = 500;
                } else if (error.message.includes("quota") || error.status === 429) { // Check status code too
                    errorMessage = "API quota exceeded. Please try again later.";
                    statusCode = 429;
                } else {
                    // Keep generic message for other potential errors during generation
                    errorMessage = `AI generation failed: ${error.message}`;
                    statusCode = 500;
                }
            }

            // If a critical API error occurs (like invalid key or quota), don't retry within this loop.
            // The getGemini helper handles quota retries with the backup key.
            // If getGemini throws (e.g., both keys fail), it will be caught by the outer try/catch in POST.
            if (statusCode === 500 || statusCode === 429) {
                 return { success: false, error: errorMessage, status: statusCode };
            }

            // For other errors (like safety blocks or validation errors that slipped through), allow retry
            lastError = { error: errorMessage, status: statusCode };
            retryCount++;
        }
    }

    // If loop finishes without success, return the last recorded error
    console.error("Judge Route: Failed after maximum retries in callGenerativeAIWithRetry.");
    // Ensure lastError is not null before spreading
    const finalError = lastError ?? { error: "Unknown error after retries.", status: 500 };
    return { success: false, ...finalError };
}


// --- API Route Handler ---
export async function POST(request: Request) {
  // Removed the initial genAI check

  let requestBody;
  try {
    requestBody = await request.json();
  } catch (e) {
    console.error("Judge Route: Error parsing request body:", e);
    return NextResponse.json({ error: "Invalid request format. Ensure you are sending valid JSON." }, { status: 400 });
  }

  const { context, query } = requestBody;

  // --- Input Validation (Request Body) ---
  if (!context || typeof context !== 'string' || context.trim().length < 10) {
    console.warn("Judge Route: Validation failed: Context insufficient.");
    return NextResponse.json({ error: "Context description required (min 10 chars)." }, { status: 400 });
  }
  if (!query || typeof query !== 'string' || query.trim().length < 5) {
    console.warn("Judge Route: Validation failed: Query insufficient.");
    return NextResponse.json({ error: "Specific query/worry required (min 5 chars)." }, { status: 400 });
  }

  // --- Domain Detection & Snippet Retrieval (Added) ---
  const domainKeywords: Record<string, string[]> = {
    parenting: ['parent', 'child', 'baby', 'toddler', 'teenager', 'family', 'discipline', 'kid', 'son', 'daughter'],
    tenancy: ['landlord', 'tenant', 'rent', 'lease', 'repair', 'deposit', 'eviction', 'property', 'flatmate', 'dishes', 'housemate', 'lodger', 'housing'],
    workplace: ['boss', 'colleague', 'job', 'manager', 'hr', 'grievance', 'work', 'employment', 'contract', 'employer', 'employee', 'office'],
  };
  let detectedDomain: string = 'default';
  const lowerContext = context.toLowerCase();
  const lowerQuery = query.toLowerCase(); // Check query too
  const combinedText = `${lowerContext} ${lowerQuery}`;

  for (const [domain, keywords] of Object.entries(domainKeywords)) {
    if (keywords.some(keyword => combinedText.includes(keyword))) {
      detectedDomain = domain;
      break;
    }
  }
  console.log(`Judge Route: Detected domain: ${detectedDomain}`);

  let snippets: string[] = [];
  if (detectedDomain !== 'default') {
    try {
      snippets = await retrieveSnippets(detectedDomain);
       console.log(`Judge Route: Retrieved ${snippets.length} snippets for domain ${detectedDomain}.`);
    } catch (error) {
       console.error(`Judge Route: Error retrieving snippets for domain ${detectedDomain}:`, error);
       // Proceed without snippets on error
    }
  }

  // --- Define Model Config (Moved earlier) ---
  const safetySettings = [
    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  ];
  const generationConfig = {
    temperature: 0.5,
    maxOutputTokens: 2048, // Keep sufficient tokens for detailed JSON
    responseMimeType: "application/json", // Crucial for Gemini to output JSON
    stopSequences: ["<END_JSON>"] // Optional stop sequence
  };
  const modelName = "gemini-1.5-flash-latest"; // Or your preferred model

  // --- Get Gemini Model using the Helper ---
  let model: GenerativeModel;
  try {
      console.log(`Judge Route: Attempting to get Gemini model ('${modelName}')...`);
      model = await getGemini(modelName, { safetySettings, generationConfig });
      console.log(`Judge Route: Successfully obtained Gemini model instance.`);
  } catch (error: any) {
      console.error("Judge Route: Failed to get Gemini model via getGemini helper:", error);
      // Return a server error response if model initialization fails
      return NextResponse.json({
          error: `Failed to initialize AI model: ${error.message}`,
          details: error.cause // Include cause if available
      }, { status: 500 });
  }

  // --- Construct the Prompt ---
  // Combine persona details for the prompt
  const personaInstructions = [therapistPersona, analystPersona, coachPersona]
    .map(p => `--- ${p.example.name} Persona --- \nSystem Prompt:\n${p.system}\nExample Output Structure:\n${JSON.stringify(p.example, null, 2)}`)
    .join('\n\n');

  // Create the <REFERENCES> block conditionally (Added)
  let referencesBlock = '';
  if (snippets.length > 0) {
    referencesBlock = '<REFERENCES>\n';
    snippets.forEach((snippet, index) => {
      referencesBlock += `[${index + 1}] ${snippet}\n`;
    });
    referencesBlock += '</REFERENCES>\n\n';
  }

  // Construct the full prompt with clear instructions for JSON output
  const fullPrompt = `
You are an AI assistant tasked with analyzing the situation and query provided by the person asking ('you') from multiple perspectives and returning a structured JSON response. Address 'you' directly in your analysis where appropriate.

**CRITICAL INSTRUCTION:** Your *entire* response MUST be a single, valid JSON object conforming *exactly* to the TypeScript interface provided below. Do NOT include any text, markdown formatting (like \`\`\`json), or explanations before or after the JSON object. Ensure you return all three personas (Therapist, Analyst, Coach) every time, in that specific order. Adhere strictly to the field names, types, and constraints (like string lengths) defined in the schema.

**TypeScript Interface Definition (for AI guidance):**
\`\`\`typescript
${judgeResultInterfaceString}
\`\`\`

**Persona Roles & Examples:**
${personaInstructions}

${referencesBlock} {/* Inserted References Block */}

**Task:**
Based *exclusively* on the context and query provided by 'you' below, generate the JSON object according to the interface and persona instructions.

**Your Context:**
"""
${context}
"""

**Your Specific Query/Worry:**
"${query}"

**Output Requirements:**
1.  Generate the 'paraphrase' field: A single, concise sentence (max 25-30 words) summarizing the core conflict/situation from your perspective, using British English.
2.  Generate the 'personas' array: Include entries for "Therapist", "Analyst", and "Coach" IN THAT ORDER. Each entry must follow the structure defined in the interface and adhere to the specific system prompts and word counts provided for that persona. Use British English. Address 'you' directly in the rationale. Ensure 'key_points' is always an array of exactly three non-empty strings.
3.  Generate the 'summary' field: Synthesize the key findings into a unified verdict and actionable advice. Start *directly* with the verdict sentence answering your query. Use British English. Your summary must be 120 words max. Address 'you' directly.
4.  Ensure the entire output is *only* the valid JSON object. Use the stop sequence "<END_JSON>" if necessary, but ideally, the JSON object should be the complete response.
5.  **Citation Rules (Added):**
    *   If a <REFERENCES> block is provided above, you MUST cite the sources in your 'rationale' and 'summary' fields using square brackets (e.g., "as stated in the guidance [1]").
    *   Cite *only* the numbers provided in the <REFERENCES> block (e.g., if only [1] and [2] are provided, do not cite [3]).
    *   Aim to incorporate at least one relevant citation if references are provided.
6.  If no <REFERENCES> block is provided, do NOT invent any citations or use bracketed numbers like [1].

**Your JSON Response:**
`; // The AI should start its JSON output immediately after this line

  // --- Call AI Model using the Retry Wrapper ---
  // Pass snippets.length for citation validation (Added)
  // The 'model' variable is now obtained from getGemini
  const result = await callGenerativeAIWithRetry(model, fullPrompt, snippets.length);

  // --- Handle Result from Wrapper ---
  if (result.success) {
    // Return the validated data
    return NextResponse.json(result.data, { status: 200 });
  } else {
    // Return the specific error and status code determined by the wrapper
    // Include details if available (like Zod errors or citation details)
    return NextResponse.json({ error: result.error, details: result.details }, { status: result.status });
  }
}