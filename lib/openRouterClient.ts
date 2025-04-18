import OpenAI from 'openai';
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_API_BASE = "https://openrouter.ai/api/v1";
// Recommended headers for OpenRouter
const OPENROUTER_REFERRER = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"; // Use an env var or fallback
const OPENROUTER_APP_TITLE = process.env.NEXT_PUBLIC_APP_TITLE || "AmIBeingUnreasonable"; // Use an env var or fallback

if (!OPENROUTER_API_KEY) {
  // Log the error in production environments, throw in development?
  // For now, always throw to make misconfiguration obvious.
  console.error("Configuration Error: process.env.OPENROUTER_API_KEY is not defined.");
  throw new Error("Configuration Error: process.env.OPENROUTER_API_KEY is not defined.");
}

// Instantiate the OpenAI client configured for OpenRouter
const openRouter = new OpenAI({
  apiKey: OPENROUTER_API_KEY,
  baseURL: OPENROUTER_API_BASE,
  defaultHeaders: {
    "HTTP-Referer": OPENROUTER_REFERRER,
    "X-Title": OPENROUTER_APP_TITLE,
  },
  // dangerouslyAllowBrowser: true, // Only if using in client-side components, generally avoid
});

/**
 * Generates a chat completion using the OpenRouter API.
 *
 * @param messages An array of message objects (e.g., [{ role: 'user', content: 'Hello!' }]).
 * @param model The model to use (defaults to 'openai/gpt-4.1').
 * @param temperature Optional temperature setting (defaults to 0.7).
 * @param maxTokens Optional max tokens setting.
 * @returns A Promise resolving to the content of the assistant's response, or null if no content.
 * @throws Error if the API call fails or the API key is missing.
 */
export async function getOpenRouterCompletion(
  messages: ChatCompletionMessageParam[],
  model: string = "openai/gpt-4.1", // Default model specified by user
  temperature: number = 0.7,
  maxTokens?: number
): Promise<string | null> {
  // Check key again just before use, although the initial check should prevent this.
  if (!OPENROUTER_API_KEY) {
      console.error("Runtime Configuration Error: OPENROUTER_API_KEY became undefined.");
      throw new Error("Runtime Configuration Error: OPENROUTER_API_KEY is missing.");
  }

  console.log(`‣ OpenRouter - Requesting completion from model: ${model}`);
  try {
    const completionParams: OpenAI.Chat.ChatCompletionCreateParams = {
      model: model,
      messages: messages,
      temperature: temperature,
      // stream: false, // Default is false
    };

    if (maxTokens !== undefined) {
        completionParams.max_tokens = maxTokens;
    }

    const completion = await openRouter.chat.completions.create(completionParams);

    // Basic logging of usage (consider more detailed logging if needed)
    if (completion.usage) {
        console.log(`‣ OpenRouter - Usage: Prompt tokens: ${completion.usage.prompt_tokens}, Completion tokens: ${completion.usage.completion_tokens}, Total tokens: ${completion.usage.total_tokens}`);
    }

    const responseContent = completion.choices[0]?.message?.content;

    if (responseContent === null || responseContent === undefined) {
        console.warn("‣ OpenRouter - Received null or undefined content in response.");
        // Decide whether to return null or throw an error based on how consuming code should react
        return null;
    }
     if (responseContent.trim() === "") {
        console.warn("‣ OpenRouter - Received empty string content in response.");
        // Often better to return null for empty strings too, unless an empty string is valid
        return null;
    }


    console.log("‣ OpenRouter - Completion received successfully.");
    return responseContent;

  } catch (error: any) {
    console.error("‣ OpenRouter - API call failed:", error);
    // Consider more specific error handling based on error type/status code
    // e.g., check for error.status === 401 for auth errors, 429 for rate limits
    if (error instanceof OpenAI.APIError) {
        console.error(`‣ OpenRouter - API Error Details: Status ${error.status}, Type: ${error.type}, Code: ${error.code}`);
        // Potentially re-throw a more specific error or handle based on status
        throw new Error(`OpenRouter API Error (Status ${error.status}): ${error.message}`);
    } else {
        // Non-API error (e.g., network issue)
        throw new Error(`OpenRouter request failed: ${error.message}`);
    }
  }
}