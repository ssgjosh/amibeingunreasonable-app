import {
  GoogleGenerativeAI,
  GenerativeModel,
  ModelParams, // Import ModelParams for config typing
  SafetySetting,
  GenerationConfig,
  HarmCategory,
  HarmBlockThreshold
} from "@google/generative-ai";
import { Redis } from "@upstash/redis";

const PRIMARY_KEY = process.env.GEMINI_API_KEY;
const BACKUP_KEY = process.env.GEMINI_BACKUP_KEY; // may be undefined
const REDIS_CACHE_KEY = "gemini:primary:exhausted";
const CACHE_TTL_SECONDS = 900; // 15 minutes

// Initialize Redis client (only if Redis env vars are set)
let redis: Redis | null = null;
if (process.env.STORAGE_KV_REST_API_URL && process.env.STORAGE_KV_REST_API_TOKEN) {
  try {
    redis = Redis.fromEnv();
    console.log("Redis client initialized for Gemini client.");
  } catch (error) {
    console.error("Failed to initialize Redis client from env:", error);
    // Proceed without Redis caching if initialization fails
  }
} else {
  console.warn("Redis env vars not found, Gemini client will operate without caching.");
}


/**
 * Configuration interface for the Gemini model.
 * Extracted from GenerativeModel parameters for clarity.
 */
interface GeminiModelConfig {
    safetySettings?: SafetySetting[];
    generationConfig?: GenerationConfig;
    // Add other relevant ModelParams fields if needed
}

/**
 * Returns a ready-to-use GenerativeModel instance.
 * Automatically attempts the primary API key first. If a quota error (429)
 * occurs and a backup key is available, it switches to the backup key.
 * Optionally uses Redis to cache primary key exhaustion status.
 *
 * @param modelName The name of the Gemini model to use (e.g., "gemini-1.5-pro-latest"). Defaults to "gemini-1.5-flash-latest".
 * @param config Optional configuration for the model (safetySettings, generationConfig).
 * @returns A Promise resolving to a configured GenerativeModel instance.
 * @throws Error if the primary API key is missing, or if both keys fail or a non-quota error occurs.
 */
export async function getGemini(
    modelName: string = "gemini-1.5-flash-latest", // Default model
    config?: GeminiModelConfig
): Promise<GenerativeModel> {

  if (!PRIMARY_KEY) {
    throw new Error("Configuration Error: process.env.GEMINI_API_KEY is not defined.");
  }

  // Helper to instantiate a model with a specific key and config
  const tryKey = (key: string): GenerativeModel => {
    const genAI = new GoogleGenerativeAI(key);
    // Combine modelName with provided config
    const modelParams: ModelParams = {
        model: modelName,
        ...config // Spread the optional config
    };
    return genAI.getGenerativeModel(modelParams);
  };

  // 1. Check Redis cache if available
  let primaryExhausted = false;
  if (redis) {
    try {
      const cacheStatus = await redis.get(REDIS_CACHE_KEY);
      if (cacheStatus === "1") {
        primaryExhausted = true;
        console.log("‣ Gemini - Primary key flagged as exhausted via cache.");
      }
    } catch (error) {
      console.error("Redis GET error:", error);
      // Proceed as if not cached if Redis fails
    }
  }

  // 2. If primary is cached as exhausted, try backup directly (if available)
  if (primaryExhausted) {
    if (BACKUP_KEY) {
      console.log("‣ Gemini - Attempting backup key directly due to cache.");
      try {
        // No need to ping backup, just return the model instance
        return tryKey(BACKUP_KEY);
      } catch (backupErr: any) {
         console.error("‣ Gemini - Backup key failed even when primary was cached as exhausted:", backupErr);
         // Fall through to potentially re-try primary if cache was wrong/stale? Or throw?
         // For now, let's throw, assuming the backup key itself is invalid if it fails here.
         throw new Error(`Backup key failed: ${backupErr.message}`);
      }
    } else {
      // Primary exhausted and no backup - throw error immediately
      throw new Error("Primary API key exhausted (cached), and no backup key available.");
    }
  }

  // 3. Try Primary Key (if not cached as exhausted)
  try {
    const primaryModel = tryKey(PRIMARY_KEY);
    // Perform a cheap "ping" request to check quota without wasting a full call
    // Use minimal safety settings for the ping to avoid unrelated blocks
    const pingSafetySettings = [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
    ];
    await primaryModel.generateContent({
        contents: [{ role: "user", parts: [{ text: "ping" }] }],
        safetySettings: pingSafetySettings,
        generationConfig: { maxOutputTokens: 5 } // Minimal config for ping
    });
    console.log("‣ Gemini - Primary key ping successful.");
    return primaryModel; // Return the successfully pinged primary model instance
  } catch (err: any) {
    // Check if it's a quota error (429) or contains quota-related messages
    // Note: Error structure might vary. Check `err.status` or `err.message`.
    // Google API errors often include details in `err.details` or similar.
    // Let's refine the quota check based on common patterns.
    const isQuotaError = err?.status === 429 || /quota|rate limit|exhausted/i.test(err?.message);

    if (isQuotaError) {
      console.warn("‣ Gemini - Primary key quota likely exhausted:", err.message);
      // If quota error and backup key exists, try backup
      if (BACKUP_KEY) {
        console.log("‣ Gemini - Falling back to backup key.");
        // Set cache key *before* returning backup model
        if (redis) {
          try {
            await redis.set(REDIS_CACHE_KEY, "1", { ex: CACHE_TTL_SECONDS });
            console.log(`‣ Gemini - Set primary key exhaustion cache (${CACHE_TTL_SECONDS}s).`);
          } catch (redisError) {
            console.error("Redis SET error:", redisError);
            // Continue without caching if Redis fails
          }
        }
        // Return the backup model instance (no need to ping backup)
        try {
            return tryKey(BACKUP_KEY);
        } catch (backupErr: any) {
             console.error("‣ Gemini - Backup key failed after primary quota error:", backupErr);
             throw new Error(`Primary key exhausted, and backup key failed: ${backupErr.message}`);
        }
      } else {
        // Quota error but no backup key
        console.error("‣ Gemini - Primary key quota exhausted, no backup key available.");
        throw new Error(`Primary API key quota exhausted, and no backup key provided. Original error: ${err.message}`);
      }
    } else {
      // Not a quota error, re-throw the original error
      console.error("‣ Gemini - Primary key failed with non-quota error:", err);
      throw err;
    }
  }
}