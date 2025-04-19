import { z } from "zod";

// Define the schema for a single persona's result
const PersonaSchema = z.object({
  name: z.enum(["Therapist", "Analyst", "Coach"]),
  // verdict removed from schema
  rationale: z.string()
    .min(1, "Rationale cannot be empty.")
    .max(120 * 8, "Rationale exceeds maximum length (approx. 120 words)."), // Approx 120 words
  // key_points removed from schema
});

// Define the main schema for the entire JudgeResult object
export const JudgeSchema = z.object({
  paraphrase: z.string()
    .min(1, "Paraphrase cannot be empty.")
    .max(30 * 8, "Paraphrase exceeds maximum length (approx. 30 words)."), // Approx 30 words
  summary: z.string()
    .min(1, "Summary cannot be empty.")
    .max(120 * 8, "Summary exceeds maximum length (approx. 120 words)."), // Approx 120 words
  personas: z.array(PersonaSchema)
    .length(3, "Must contain results for exactly three personas (Therapist, Analyst, Coach).")
    .refine(
      (personas) => {
        const names = personas.map(p => p.name);
        return names[0] === "Therapist" && names[1] === "Analyst" && names[2] === "Coach";
      },
      { message: "Personas must be in the order: Therapist, Analyst, Coach." }
    )
});

// Export the inferred TypeScript type
export type JudgeResultValidated = z.infer<typeof JudgeSchema>;

// --- Custom Validation Function ---

type ValidationSuccess = { success: true; data: JudgeResultValidated };
type ValidationFailure = { success: false; error: { type: 'zod' | 'citation'; message: string; details?: any } };
type ValidationResult = ValidationSuccess | ValidationFailure;

/**
 * Validates the raw AI response against the Zod schema and performs citation checks.
 * @param data The raw data (expected to be parsed JSON) from the AI.
 * @param numSnippets The number of snippets provided to the AI (0 if none).
 * @returns A ValidationResult object indicating success or failure.
 */
export function validateJudgeResponse(data: unknown, numSnippets: number): ValidationResult {
    // 1. Zod Schema Validation
    const zodResult = JudgeSchema.safeParse(data);

    if (!zodResult.success) {
        console.warn("validateJudgeResponse: Zod validation failed.");
        console.error("Zod Errors:", JSON.stringify(zodResult.error.flatten(), null, 2));
        return {
            success: false,
            error: {
                type: 'zod',
                message: "AI response failed schema validation.",
                details: {
                    message: "The structure or content of the AI's JSON response did not match the expected format.",
                    zodErrors: zodResult.error.flatten()
                }
            }
        };
    }

    const validatedData = zodResult.data;

    // 2. Citation Validation (only if snippets were provided)
    if (numSnippets > 0) {
        const textToCheck = `${validatedData.summary} ${validatedData.personas.map(p => p.rationale).join(' ')}`;
        // Regex to find numbers in square brackets: \[(\d+)\]
        const citationsUsed = textToCheck.match(/\[(\d+)\]/g)
                                      ?.map(match => parseInt(match.slice(1, -1))) // Extract number inside brackets
                                      ?? []; // Default to empty array if no matches

        const invalidCitations = citationsUsed.filter(num => num <= 0 || num > numSnippets);

        if (invalidCitations.length > 0) {
            const errorDetail = `Cited [${invalidCitations.join(', ')}] but only ${numSnippets} references were provided.`;
            console.warn(`validateJudgeResponse: Invalid citation found. Used: ${citationsUsed.join(', ')}, Max valid: ${numSnippets}, Invalid: ${invalidCitations.join(', ')}`);
            return {
                success: false,
                error: {
                    type: 'citation',
                    message: "AI response cited invalid reference number.",
                    details: errorDetail
                }
            };
        }
         console.log(`validateJudgeResponse: Citation validation passed (Used: ${citationsUsed.join(', ') || 'None'}, Provided: ${numSnippets}).`);
    } else {
         console.log(`validateJudgeResponse: Skipping citation validation as no snippets were provided.`);
    }

    // If both Zod and citation checks pass
    return { success: true, data: validatedData };
}