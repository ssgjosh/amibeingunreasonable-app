# RAG Layer Implementation Plan

**Goal:** Enhance AI responses by fetching, caching, and injecting relevant text snippets from external sources, requiring the AI to cite them, and validating these citations.

**Plan:**

1.  **Dependency Check & Installation (if needed):**
    *   Verify if `@upstash/redis` is listed in `package.json`.
    *   If not, add it (`npm install @upstash/redis`). (Note: User confirmed `Redis.fromEnv()` works, implying the package is likely present, but verification is good practice.)

2.  **Create Snippet Retrieval Logic (`lib/retrieveSnippets.ts`):**
    *   Create a new file: `lib/retrieveSnippets.ts`.
    *   Import `Redis` from `@upstash/redis`.
    *   Define the `SOURCES` constant map with domains (`parenting`, `tenancy`, `workplace`) and their corresponding URLs.
    *   Implement an asynchronous function `retrieveSnippets(domain: string): Promise<string[]>`:
        *   Initialize Redis client: `const redis = Redis.fromEnv();`
        *   Get URLs for the given `domain` from `SOURCES`. If the domain is invalid or has no URLs, return an empty array.
        *   Initialize an empty array `snippets`.
        *   Loop through the URLs (max 2 per domain):
            *   Construct the cache key: `const cacheKey = \`snippet:${domain}:${url}\`;`
            *   Attempt to fetch from cache: `let snippet = await redis.get<string>(cacheKey);`
            *   **If `snippet` is null (cache miss):**
                *   Fetch the `url` using `fetch`. Use a `try...catch` block for network errors.
                *   If fetch is successful:
                    *   Get the HTML content as text: `const html = await response.text();`
                    *   Strip HTML tags: Use a simple regex like `html.replace(/<[^>]*>/g, '')`.
                    *   Extract the first paragraph: Use a regex like `/<p>(.*?)<\/p>/is` to find the first match. Get the captured group. Handle cases where no `<p>` tag is found.
                    *   Clean up whitespace: Trim and replace multiple spaces/newlines.
                    *   Truncate to ~80 words: `snippet = text.split(/\s+/).slice(0, 80).join(' ') + (text.split(/\s+/).length > 80 ? '...' : '');`
                    *   Cache the result: `await redis.set(cacheKey, snippet, { ex: 86400 });` (24-hour TTL)
                *   If fetch fails or processing errors occur, log the error and set `snippet` to an empty string.
            *   If `snippet` is not empty, add it to the `snippets` array.
        *   Return the `snippets` array.

3.  **Integrate into API Route (`app/api/judge/route.ts`):**
    *   **Import:** Add `import { retrieveSnippets } from '@/lib/retrieveSnippets';`.
    *   **Domain Detection:**
        *   Inside the `POST` handler, before prompt construction.
        *   Define keyword mappings for `parenting`, `tenancy`, `workplace`.
        *   Determine `detectedDomain` based on keywords in `context`. Default to `'default'`.
    *   **Snippet Retrieval:**
        *   After domain detection, call `retrieveSnippets(detectedDomain)` if domain is not `'default'`. Handle errors gracefully.
    *   **Prompt Injection:**
        *   Modify `fullPrompt` construction.
        *   Create a `<REFERENCES>` block conditionally if `snippets` array is not empty.
        *   Insert the `referencesBlock` into the `fullPrompt`.
        *   Add citation rules (points 5 & 6) to the `**Output Requirements:**` section.
    *   **Post-Response Validation (Citation Check):**
        *   Modify `callGenerativeAIWithRetry` function signature to accept `numSnippets`.
        *   After successful Zod validation, extract citations `[n]` from `summary` and `rationale` fields.
        *   Check if any citation number `n` is invalid ( `n <= 0 || n > numSnippets`).
        *   If invalid citations found:
            *   Log a warning.
            *   Set `lastError`.
            *   If it's the first attempt (`retryCount === 0`), increment `retryCount` and `continue` to retry.
            *   Otherwise (failed after retry), return the error.
        *   Update the call in the `POST` handler: `await callGenerativeAIWithRetry(model, fullPrompt, snippets.length);`

4.  **Update Tests (`tests/judge.test.ts`):**
    *   Create a new golden file: `tests/golden/tenancy_repair.json` with relevant `context` and `query`.
    *   Add a new test case for tenancy repair.
    *   Load input from `tenancy_repair.json`.
    *   Call the API endpoint.
    *   Assert status 200.
    *   Assert that the `summary` field matches the regex `.*\[\d+\].*`.

5.  **Documentation:**
    *   Briefly mention the new RAG feature in `README.md`.
    *   Confirm necessary environment variables (`STORAGE_REDIS_URL`, etc.) are documented/handled.

**Diagram:**

```mermaid
graph TD
    A[Start: User Request /api/judge] --> B{Detect Domain};
    B -- Parenting/Tenancy/Workplace --> C[Retrieve Snippets];
    B -- Default --> G[Construct Prompt w/o References];
    C --> D{Cache Check (Upstash)};
    D -- Cache Hit --> F[Use Cached Snippets];
    D -- Cache Miss --> E[Fetch External Source -> Extract -> Cache];
    E --> F;
    F --> G[Construct Prompt w/ References];
    G --> H[Call Gemini AI];
    H --> I[Receive Response];
    I --> J{Validate Response (Zod + Citations)};
    J -- Validation OK --> K[Return Success (200)];
    J -- Citation Error (1st time) --> H;
    J -- Other Error / Citation Error (2nd time) --> L[Return Error (400/500)];

    subgraph Snippet Retrieval
        direction LR
        C --> D;
        D --> E;
        D --> F;
        E --> F;
    end

    subgraph Validation
        direction LR
        I --> J;
        J -- OK --> K;
        J -- Bad --> L;
        J -- Retry --> H;
    end