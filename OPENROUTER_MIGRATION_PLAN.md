# Plan: Migrate from Gemini to OpenRouter

This document outlines the steps to switch the application's Large Language Model (LLM) provider from Google Gemini to OpenRouter.

**Objective:**

Replace the current Gemini integration with OpenRouter, using the `openai/gpt-4.1` model and a user-provided API key.

**Key Files:**

*   `lib/geminiClient.ts`: Current Gemini client (to be replaced).
*   `app/api/judge/route.ts`: Main consumer of the LLM client.
*   `lib/openRouterClient.ts`: New client to be created.

**Steps:**

1.  **Create `lib/openRouterClient.ts`:**
    *   Install the `openai` Node.js library (`npm install openai`).
    *   Implement a new client using the `openai` library.
    *   Configure it for OpenRouter's base URL: `https://openrouter.ai/api/v1`.
    *   Read the API key from the `OPENROUTER_API_KEY` environment variable.
    *   Create a function (e.g., `getOpenRouterCompletion`) to handle API calls, specifying the `openai/gpt-4.1` model.

2.  **Refactor `app/api/judge/route.ts`:**
    *   Import the new `getOpenRouterCompletion` function.
    *   Replace the call to `getGemini` with a call to the new function.
    *   Adapt the request structure (likely using OpenAI's `messages` format) and response handling.

3.  **Update Environment Variables:**
    *   Ensure the `OPENROUTER_API_KEY=<your_key>` variable is set in the appropriate environment configuration (e.g., `.env.local`). Remember to replace `<your_key>` with the actual key you provided.

4.  **Cleanup:**
    *   Once the migration is verified, remove the `lib/geminiClient.ts` file.
    *   Uninstall the `@google/generative-ai` dependency (`npm uninstall @google/generative-ai`).
    *   Remove any Gemini-specific Redis caching logic if no longer needed.

**Diagram:**

```mermaid
graph TD
    subgraph Proposed Setup
        G[Env Var: OPENROUTER_API_KEY] --> H(lib/openRouterClient.ts);
        H -- Configures OpenAI SDK --> I{getOpenRouterCompletion};
        I -- Returns OpenAI-compatible Completion --> J[app/api/judge/route.ts (Refactored)];
        J -- Calls createChatCompletion --> K(OpenRouter API);
        K -- Uses openai/gpt-4.1 --> L[Underlying LLM];
    end
```

**Next Steps:**

*   Implement the plan, likely starting by creating `lib/openRouterClient.ts`.