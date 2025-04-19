# API Endpoint Unification Plan

**Goal:** Unify API endpoints, making `/api/judge/route.ts` the sole endpoint for analysis generation. It will incorporate RAG, validation, handle `followUpResponses`, save results to Redis in the format expected by `/api/getResults`, and return only the `resultId` on success.

**Rationale:** Consolidating into `/api/judge` creates a single, well-defined entry point for analysis, making the backend cleaner, easier to test, maintain, and enhance. It eliminates code duplication and potential inconsistencies between `/api/getResponses` and `/api/judge`.

**Plan Diagram:**

```mermaid
graph TD
    A[Frontend Request (context, query, followUpResponses)] --> B{/api/judge/route.ts};
    B --> C{Input Validation (context, query, followUpResponses?)};
    C -- Valid --> D{Domain Detection};
    C -- Invalid --> Z[Return 400 Error];
    D --> E{Retrieve Snippets (RAG)};
    E --> F{Construct Prompts (System + User + Snippets + FollowUps)};
    F --> G[Call AI (callOpenRouterWithRetry)];
    G -- Success --> H{Validate Response (Zod + Citations)};
    G -- Failure --> Y[Return Error (4xx/5xx)];
    H -- Valid --> I{Save to Redis (result:{id})};
    H -- Invalid --> Y;
    I -- Success --> J[Return { resultId }];
    I -- Failure --> X[Return 500 Error (Redis Save Failed)];

    subgraph Redis Data Structure (Expected by /api/getResults)
        direction LR
        R1[context: string]
        R2[query: string]
        R3[summary: string]
        R4[paraphrase: string]
        R5[responses: stringified JudgeResultValidated['personas']]
        R6[snippets: stringified Snippet[]]
        R7[timestamp: string]
        R8[followUpResponses: stringified any[]]
    end
```

**Detailed Steps:**

1.  **Modify `/api/judge/route.ts`:**
    *   **Handle `followUpResponses`:**
        *   Add `followUpResponses` to the `requestBody` destructuring (around line 169).
        *   Modify `userPromptContent` (around line 281) to conditionally include an "Additional Context from Follow-up Questions" section if `followUpResponses` data is present and valid, similar to `/api/getResponses`.
    *   **Implement Redis Saving:**
        *   Add imports for `Redis` from `@upstash/redis` and `nanoid`.
        *   Instantiate the Redis client using environment variables.
        *   Inside the `if (result.success)` block (around line 310), *before* returning the `NextResponse`:
            *   Generate `resultId = nanoid(10)`.
            *   Define `key = \`result:\${resultId}\``.
            *   Construct the `dataToSave` object matching the Redis Data Structure diagram above, using data from `requestBody` (`context`, `query`, `followUpResponses`), `result.data` (`summary`, `paraphrase`, `personas`), and the retrieved `snippets`. Ensure `personas`, `snippets`, and `followUpResponses` are stringified.
            *   Wrap the `await redis.hset(key, dataToSave)` call in a `try...catch` block.
            *   On Redis save failure, log the error and return `NextResponse.json({ error: "Failed to save results..." }, { status: 500 })`.
    *   **Modify Return Value:**
        *   On successful Redis save, change the return statement to `return NextResponse.json({ resultId: resultId }, { status: 200 })`.
        *   Ensure all other error paths correctly return `NextResponse.json({ error: ..., details: ... }, { status: ... })` without a `resultId`.
    *   **(Optional but Recommended) Prompt Review:** Assess if the single, large system prompt in `/api/judge` adequately captures the nuances and constraints (e.g., British English, tone, specific instructions for each persona) previously handled by the separate prompts in `/api/getResponses`. Refine the system prompt in `/api/judge` if needed for quality parity.

2.  **Verify `/api/getResults` Compatibility:**
    *   Generate a result using the modified `/api/judge`.
    *   Make a GET request to `/api/getResults/[generated-id]`.
    *   Confirm the response status is 200 and the data structure matches frontend expectations, especially ensuring `responses` and `snippets` are correctly parsed from the stringified JSON in Redis. Adjust `/api/getResults` if needed.

3.  **Switch Frontend (`hooks/useAnalysis.ts`):**
    *   Change the API endpoint URL from `/api/getResponses` to `/api/judge`.
    *   Ensure the request body includes `context`, `query`, and `followUpResponses`.
    *   Update the response handling logic to expect `{ resultId: "..." }` on success.
    *   Perform thorough end-to-end UI testing (with/without follow-ups, with/without RAG triggers).

4.  **Cleanup:**
    *   Delete the file `app/api/getResponses/route.js`.
    *   Search the project for any remaining references to `/api/getResponses` and remove them.
    *   Run tests (`npm run test`) and build (`npm run build`).