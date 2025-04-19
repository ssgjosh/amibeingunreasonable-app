# Plan to Improve Source Summary Generation

**Problem:** The current summaries generated for source links (e.g., StepChange, NHS) are often generic and don't accurately reflect the specific content of the pages. This is because the script (`scripts/seedSummaries.ts`) uses a basic HTML stripping method that includes irrelevant boilerplate text (navbars, footers) when extracting content for summarization.

**Goal:** Improve the quality and relevance of source summaries by extracting only the main article content before sending it to the AI for summarization.

**Proposed Solution:**

1.  **Implement Robust Text Extraction:**
    *   **Tool:** Use the `@mozilla/readability` library.
    *   **Action:** Modify `scripts/seedSummaries.ts`:
        *   Uncomment the imports for `Readability` and `JSDOM`.
        *   Uncomment and adapt the code block within `extractMainText` that uses `Readability` to parse the HTML and extract the main content.
        *   Ensure the basic `stripHtml` method acts as a fallback if Readability fails.
    *   **Dependencies:** Add `@mozilla/readability`, `jsdom`, `@types/mozilla-readability`, and `@types/jsdom` to `devDependencies` in `package.json`.

2.  **Re-evaluate Summarization (Optional but Recommended):**
    *   **Action:** Once cleaner text is being extracted:
        *   Review the summarization prompt in `scripts/seedSummaries.ts` (currently line 74) to ensure it's still appropriate.
        *   Check if the `MAX_INPUT_LENGTH` (currently line 71) needs adjustment based on the typical length of Readability output.
        *   Keep the current summarization model (`mistralai/mistral-7b-instruct-v0.1`) initially, but consider testing others if results aren't satisfactory.

3.  **Re-run Seeding Script:**
    *   **Action:** After modifying the script and installing dependencies, run `npm run build:scripts` (or equivalent build command) and then execute the seeding script (e.g., `node dist-scripts/seedSummaries.js`) to update the summaries stored in the Redis `source_summaries` hash.

4.  **Test:**
    *   **Action:** Test the application with queries similar to the original example to verify that the summaries for sources like StepChange, NHS, etc., are now more specific and accurately reflect the core content of those pages.

**Visual Plan (Mermaid):**

```mermaid
graph TD
    subgraph Current Process
        A[Fetch HTML] --> B[Extract Text (Basic stripHtml)] --> C[Noisy Text] --> D[Summarize (AI)] --> E[Generic Summary] --> F[Store in Redis]
    end

    subgraph Proposed Process
        G[Fetch HTML] --> H(Implement Readability) --> I[Extract Text (Readability)] --> J[Clean Article Text] --> K[Summarize (AI)] --> L[Accurate Summary] --> M[Store in Redis]
    end

    style H fill:#ccffcc,stroke:#333,stroke-width:2px
    style J fill:#ccffcc,stroke:#333,stroke-width:1px
    style L fill:#ccffcc,stroke:#333,stroke-width:1px

    B -- Replaced by --> I