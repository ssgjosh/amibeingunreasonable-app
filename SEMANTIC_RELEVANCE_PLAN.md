# Plan: Implement Semantic Relevance Matching using AI Summaries

**Date:** 2025-04-19

**Author:** Roo (AI Architect)

**Status:** Proposed

## 1. Goal

To significantly improve the relevance and accuracy of linking user queries to approved external resources (`WHITELISTED_SOURCES`). This involves replacing the current brittle keyword-based domain detection mechanism with a more robust semantic matching approach using AI-generated summaries of the source content.

## 2. Background & Problem

The current system, located primarily in `app/api/judge/route.ts` (lines 189-214), attempts to detect the relevant domain (e.g., 'consumer', 'health') by counting keyword occurrences from predefined lists (`lib/domainKeywords.ts`) within the user's input (`context` + `query`). It requires a threshold of 2 keyword hits to assign a domain.

**Limitations:**

*   **Brittle:** Fails if the user doesn't use the exact keywords (e.g., "debt" query only hit 1 keyword, failing the threshold).
*   **Misses Context/Synonyms:** Doesn't understand semantic meaning. "Financial struggles" wouldn't match "debt".
*   **Maintenance Overhead:** Requires manually curating and updating keyword lists.

This leads to relevant approved sources not being presented to the user, diminishing the feature's value.

## 3. Proposed Solution: Semantic Matching via Summaries

We will implement a two-stage process:

1.  **Offline Pre-processing:** Generate concise AI summaries for each URL in `WHITELISTED_SOURCES` and store them persistently.
2.  **Runtime Relevance Matching:** When a user query is received, use an AI model to compare the query against the pre-computed summaries and identify the most semantically relevant sources.

**High-Level Flow:**

```mermaid
graph TD
    subgraph Pre-processing (Offline/Build)
        A[Approved URLs] --> B{Fetch Content};
        B --> C{Extract Text};
        C --> D{AI Summarization};
        D --> E[Store Summaries (e.g., Redis)];
    end

    subgraph Runtime (API Request)
        F[User Query] --> G{Fetch Stored Summaries};
        G --> H{AI Relevance Comparison (Query vs Summaries)};
        H --> I{Identify Top N Relevant URLs};
        I --> J[Retrieve Snippets for Relevant URLs];
        J --> K[Return Results to User];
    end
```

## 4. Implementation Steps

### Step 1: Pre-processing Script (`scripts/seedSummaries.ts`)

*   **Objective:** Create summaries for all approved URLs and store them.
*   **Actions:**
    *   Create a new script `scripts/seedSummaries.ts`, potentially adapting logic from `scripts/seedSnippets.ts`.
    *   Iterate through `WHITELISTED_SOURCES` from `lib/approvedSources.ts`.
    *   For each `source`:
        *   Fetch HTML content using `fetch` (with appropriate User-Agent and timeout).
        *   Extract meaningful text content from HTML. Consider using a library like `node-readability` or improving existing `stripHtml` logic combined with heuristics to find the main content area.
        *   Call an AI model via OpenRouter (choose a cost-effective model suitable for summarization, e.g., `mistralai/mistral-7b-instruct-v0.1`, `google/gemini-flash-1.5`) with a prompt like: `"Summarize the key information provided in the following text in a concise paragraph (approx. 50-75 words), focusing on the main topic and advice given:\n\n[Extracted Text]"`.
        *   Define Redis storage: Recommend using a Hash for efficiency. Key: `source_summaries`, Field: `url`, Value: `generated_summary`.
        *   Store the generated summary in the Redis hash. Handle potential overwrites gracefully.
        *   Implement robust error handling (fetch errors, text extraction failures, AI errors, Redis errors) and logging for each URL.
    *   Add necessary dependencies (`@mozilla/readability` if used).
    *   Configure script execution (e.g., via `package.json`).

### Step 2: Modify API Route (`app/api/judge/route.ts`)

*   **Objective:** Replace keyword logic with AI-driven summary comparison.
*   **Actions:**
    *   Remove the keyword detection loop (lines ~189-218).
    *   At the start of the request handler (after input validation):
        *   Fetch all summaries from the Redis hash `source_summaries`. Handle potential Redis errors. Cache this locally if feasible for the duration of the request or slightly longer if appropriate.
    *   Prepare data for AI comparison: Create a list/map of `{ url: string, summary: string }`.
    *   Construct a prompt for an AI model capable of comparison/ranking (e.g., `openai/gpt-4o-mini`, `anthropic/claude-3-haiku-20240307`).
        *   **Prompt Example:**
            ```
            User Query: "[User Context + User Query]"

            Available Resources:
            [
              { "url": "url1", "summary": "summary1..." },
              { "url": "url2", "summary": "summary2..." },
              ...
            ]

            Task: Based *only* on the User Query and the summaries provided in Available Resources, identify the top 3 most relevant resources for answering the User Query. Return *only* a valid JSON array containing the URLs of these top 3 resources, ordered from most to least relevant. Example format: ["url_most_relevant", "url_second_most", "url_third_most"]
            ```
    *   Call the AI model using `getOpenRouterCompletion` or `callOpenRouterWithRetry` (if retry logic is desired here).
    *   Parse the AI response (expecting a JSON array of URLs). Implement strict parsing and error handling.
    *   Store the resulting list of relevant URLs (e.g., `relevantSourceUrls`).
    *   Modify the call to `retrieveSnippets` (around line 225) to pass `relevantSourceUrls` instead of `detectedDomain`.
    *   Update logging to reflect the new process.

### Step 3: Adapt Snippet Retrieval (`lib/retrieveSnippets.ts`)

*   **Objective:** Modify the function to work with a list of URLs instead of a domain, and potentially remove the secondary relevance check.
*   **Actions:**
    *   Change the function signature to: `export async function retrieveSnippets(relevantUrls: string[], userQuery: string): Promise<Snippet[]>`
    *   Remove the domain-based filtering (line 53: `WHITELISTED_SOURCES.filter(...)`).
    *   Modify the main loop (around line 60) to iterate directly over the passed `relevantUrls` array. Inside the loop, retrieve the `url` from the array element.
    *   **Decision:** Remove the secondary LLM relevance check (lines ~117-163).
        *   **Recommendation:** Remove it initially. The primary summary-based matching should be sufficient and removing this reduces complexity, latency, and cost. Monitor results and re-introduce if necessary.
        *   If removed, ensure the code flows directly from fetching/title extraction (line ~115) to snippet extraction (line ~166), assuming relevance.
    *   Update all logging messages within the function to remove references to `domain` and reflect processing based on the input URL list.
    *   Adjust the final log message (line ~267) accordingly.

### Step 4: Testing

*   **Unit/Integration Tests:**
    *   Test the pre-processing script's ability to fetch, summarize, and store correctly. Mock external dependencies (fetch, AI, Redis).
    *   Test the modified API route's ability to fetch summaries, call the comparison AI, parse the response, and call `retrieveSnippets` with the correct URLs. Mock dependencies.
    *   Test the modified `retrieveSnippets` function with a list of URLs.
*   **End-to-End Tests:**
    *   Run the pre-processing script against a subset of real URLs (or staging environment).
    *   Send various test queries (including the original "debt" query, queries matching multiple domains, queries matching none) through the API endpoint.
    *   Verify that the correct sources are identified and snippets are returned.
    *   Check logs for errors and expected flow.

## 5. Potential Challenges & Considerations

*   **AI Model Selection:** Balancing cost, latency, and quality for both summarization (pre-processing) and relevance comparison (runtime). Requires experimentation.
*   **Prompt Engineering:** Crafting effective prompts for both summarization and relevance ranking is crucial. May need iteration.
*   **Pre-processing Errors:** Handling failures during fetching (timeouts, blocks), text extraction (complex layouts), summarization (AI errors, rate limits), and storage. The script needs to be resilient.
*   **Runtime Latency:** The AI call for relevance comparison adds latency to the API request. Monitor performance and choose models/prompts accordingly. Caching summaries effectively is important.
*   **Summary Quality:** The effectiveness hinges on the quality of the generated summaries. Poor summaries lead to poor matching.
*   **Relevance Ranking Accuracy:** The comparison AI might not always rank perfectly. The choice of N (top URLs) needs consideration (start with 3-5).
*   **Scalability:** Consider Redis performance if the number of sources grows significantly. Hash storage is generally efficient.
*   **Cost:** Factor in the cost of AI calls for pre-processing (once per source, potentially updated periodically) and runtime comparison (once per user query).

## 6. Rollout (Optional)

*   Consider deploying the changes behind a feature flag initially to allow for controlled testing and rollback if needed.

## 7. Future Enhancements

*   **Vector Embeddings:** For potentially superior semantic search, replace summaries with vector embeddings and use cosine similarity search. Requires a vector database or Redis vector search capabilities.
*   **Hybrid Approach:** Combine semantic search with keyword boosting for specific high-priority terms.
*   **Periodic Summary Refresh:** Re-run the pre-processing script periodically to update summaries for sources whose content may change.