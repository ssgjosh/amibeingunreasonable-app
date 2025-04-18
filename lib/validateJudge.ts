import { z } from "zod";

// Define the schema for a single persona's result
const PersonaSchema = z.object({
  name: z.enum(["Therapist", "Analyst", "Coach"]), // Must be one of these exact strings
  verdict: z.enum(["Yes", "No", "Partially"]), // Must be one of these exact strings
  rationale: z.string()
    .min(1, "Rationale cannot be empty.") // Ensure rationale is not empty
    .max(120 * 8, "Rationale exceeds maximum length (approx. 120 words)."), // Approx 120 words, assuming avg 8 chars/word
  key_points: z.tuple(
    [
      z.string().min(1, "Key point 1 cannot be empty."), // Ensure key points are not empty
      z.string().min(1, "Key point 2 cannot be empty."),
      z.string().min(1, "Key point 3 cannot be empty.")
    ],
    { invalid_type_error: "Key points must be an array of exactly three strings." } // Custom error for wrong type/length
  )
});

// Define the main schema for the entire JudgeResult object
export const JudgeSchema = z.object({
  paraphrase: z.string()
    .min(1, "Paraphrase cannot be empty.") // Ensure paraphrase is not empty
    .max(30 * 8, "Paraphrase exceeds maximum length (approx. 30 words)."), // Approx 30 words
  summary: z.string()
    .min(1, "Summary cannot be empty.") // Ensure summary is not empty
    .max(120 * 8, "Summary exceeds maximum length (approx. 120 words)."), // Approx 120 words
  personas: z.array(PersonaSchema)
    .length(3, "Must contain results for exactly three personas (Therapist, Analyst, Coach).") // Ensure exactly 3 personas
    .refine(
      (personas) => {
        // Custom refinement to check the order and names
        const names = personas.map(p => p.name);
        return names[0] === "Therapist" && names[1] === "Analyst" && names[2] === "Coach";
      },
      { message: "Personas must be in the order: Therapist, Analyst, Coach." }
    )
});

// Optional: Export the inferred TypeScript type if needed elsewhere
export type JudgeResultValidated = z.infer<typeof JudgeSchema>;