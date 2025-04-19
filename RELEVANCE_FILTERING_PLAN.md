# Plan: Implement LLM-Based Relevance Filtering for Snippet Retrieval

**Goal:** Prevent the retrieval and display of snippets from sources that are not contextually relevant to the user's specific query, even if they match broad keywords.

**Problem:** The current system retrieves snippets based on pre-approved URLs associated with general domains (e.g., GOV.UK, NHS) triggered by keywords in the query. This leads to irrelevant snippets being extracted and displayed when the query is specific and nuanced (e.g., co-parenting with addiction vs. general parental responsibility).

**Proposed Solution:** Introduce a relevance filtering step using LLM judgment *before* performing detailed snippet extraction, incorporating safeguards for performance and reliability.

**Implementation Steps:**

1.  **Modify `retrieveSnippets` Function Signature:**
    *   The function in `lib/retrieveSnippets.ts` needs access to the original user query.
    *   Update the signature:
        ```typescript
        // Before
        // export async function retrieveSnippets(domain: ApprovedDomain): Promise<Snippet[]>

        // After
        export async function retrieveSnippets(domain: ApprovedDomain, userQuery: string): Promise<Snippet[]>
        ```

2.  **Update Calling Code:**
    *   Locate where `retrieveSnippets` is called (likely within an API route like `app/api/judge/route.ts` or `app/api/getResults/route.ts`).
    *   Ensure the original user query (`context` or `query` field from the request body) is available in that scope.
    *   Pass the `userQuery` when calling `retrieveSnippets`.
        ```typescript
        // Example update in the API route
        // const snippets = await retrieveSnippets(detectedDomain); // Before
        const userQuery = requestBody.context || requestBody.query; // Get query from request
        const snippets = await retrieveSnippets(detectedDomain, userQuery); // After
        ```

3.  **Implement Relevance Check Logic in `retrieveSnippets`:**
    *   Inside the `for (const source of relevantSources)` loop, after fetching `html` and extracting `pageTitle`:
        *   **Extract Summary:** Add logic to extract a brief summary (e.g., meta description or first ~100 words after basic HTML stripping).
            ```typescript
            let pageSummary = '';
            try {
                // ... (summary extraction logic as before) ...
            } catch (summaryError) {
                console.warn(`[RAG] Error extracting summary for ${url}:`, summaryError);
            }
            ```
        *   **Construct LLM Prompt:** Create the prompt string.
            ```typescript
            const relevancePrompt = `User Query: "${userQuery}"\nPage Title: "${pageTitle}"\nPage Summary: "${pageSummary}"\n\nIs the content described by the Page Title and Summary likely to be relevant to the User Query? Answer only "Relevant" or "Irrelevant".`;
            ```
        *   **Call LLM for Judgment (with Safeguards):**
            *   **Model Selection:** Prioritize a **fast, cost-effective LLM** suitable for classification (e.g., smaller Mistral, Groq Llama3-8b, check OpenRouter options).
            *   **Timeout:** Implement a **short, aggressive timeout** (e.g., 2-3 seconds) for this specific call.
            *   **Error Handling:** Wrap the call in a robust `try...catch` block. Default to `isRelevant = false` if the call fails or times out.
            ```typescript
            let isRelevant = false; // Default to irrelevant for safety
            const llmTimeoutMs = 3000; // Example: 3-second timeout

            try {
                // Assuming openRouterClient is available and configured
                // Need to check if the client/fetch supports AbortSignal or similar for timeout
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), llmTimeoutMs);

                const relevanceResponse = await openRouterClient.chat.completions.create({
                    model: 'mistralai/mistral-7b-instruct-v0.1', // ** Placeholder - Select fastest suitable model **
                    messages: [{ role: 'user', content: relevancePrompt }],
                    max_tokens: 10,
                    temperature: 0.1,
                    // Pass signal if supported by the client library
                    // signal: controller.signal, // Example - check actual implementation
                });
                clearTimeout(timeoutId); // Clear timeout if request succeeded

                const judgment = relevanceResponse.choices[0]?.message?.content?.trim().toLowerCase();
                if (judgment === 'relevant') {
                    isRelevant = true;
                    console.log(`[RAG] LLM judged ${url} as RELEVANT.`);
                } else {
                    console.log(`[RAG] LLM judged ${url} as IRRELEVANT (Judgment: ${judgment}).`);
                }
            } catch (llmError: any) {
                // Log detailed error, including timeout indication if possible
                if (llmError.name === 'AbortError') {
                     console.error(`[RAG] LLM relevance judgment for ${url} timed out after ${llmTimeoutMs}ms. Treating as irrelevant.`);
                } else {
                    console.error(`[RAG] Error getting LLM relevance judgment for ${url}. Treating as irrelevant. Error:`, llmError);
                }
                // isRelevant remains false (the default)
            }
            ```
        *   **Conditional Extraction:** Wrap the existing snippet extraction logic in an `if (isRelevant)` block.
            ```typescript
            if (isRelevant) {
                // --- Start of existing extraction logic ---
                // ... (steps 4, 5, 6: clean HTML, extract paragraphs, cache) ...
                // --- End of existing extraction logic ---
            } else {
                // Skip this source (already logged as irrelevant or error)
                continue;
            }
            ```

4.  **Careful Implementation, Testing and Refinement:**
    *   Implement the changes precisely as planned.
    *   Test thoroughly with various queries, focusing on the problematic case.
    *   **Specifically test the timeout and error handling** by simulating LLM failures or delays if possible.
    *   Monitor LLM costs and latency closely during testing.
    *   Refine the prompt if the LLM struggles with accuracy.
    *   Optimize model choice based on performance and cost data.

**Workflow Diagram (Mermaid):**

```mermaid
graph TD
    A[Start retrieveSnippets(domain, userQuery)] --> B{Loop through relevantSources};
    B --> C[Fetch HTML for source.url];
    C --> D{Fetch OK?};
    D -- No --> B;
    D -- Yes --> E[Extract pageTitle];
    E --> F[Extract pageSummary (meta/first words)];
    F --> G[Construct Relevance Prompt];
    G --> H[Call LLM (with Timeout)];
    H -- Error / Timeout --> J[Log Irrelevant/Error];
    H -- Success --> I{LLM Judgment == 'Relevant'?};
    I -- No --> J;
    J --> B;
    I -- Yes --> K[Log Relevant];
    K --> L[Pre-emptively Clean HTML];
    L --> M[Extract & Filter Paragraphs];
    M --> N{Meaningful Content Found?};
    N -- No --> O[Cache Failure Message];
    O --> B;
    N -- Yes --> P[Clean & Truncate Text];
    P --> Q[Cache Snippet];
    Q --> R[Add Snippet to Results];
    R --> B;
    B -- End Loop --> S[Return retrievedSnippets];
```

**Potential Challenges (Addressed):**

*   **Latency:** Mitigated by choosing a fast model and implementing a strict timeout. Some impact is still expected.
*   **Cost:** Mitigated by choosing a cost-effective model. Monitoring is key.
*   **Accuracy:** Prompt engineering might still be needed. The LLM is not infallible.
*   **Error Handling:** Addressed with robust `try...catch` and a safe default (treating as irrelevant), explicitly handling timeouts.

This updated plan incorporates the necessary safeguards to proceed more cautiously with the LLM relevance check.