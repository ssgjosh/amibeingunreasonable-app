# Phase 1: Core Logic & RAG Enhancement - Implementation Plan

This plan outlines the steps to complete the Phase 1 goals for improving AI quality, RAG effectiveness, and backend robustness, based on the initial review and user confirmation.

## Assessment Summary (as of 2025-04-19)

*   **Prompt Engineering:** Mostly done. Minor cleanup needed in persona prompts (`therapist.ts`, `analyst.ts`, `coach.ts`) to remove outdated JSON structure definitions (`verdict`, `key_points`). `/api/generateFollowUpQuestions` and `/api/askFollowUp` prompts are satisfactory.
*   **RAG Refinement:** Largely addressed by the shift to semantic relevance and pre-generated summaries. Error handling in `retrieveSnippets.ts` is adequate for its current function (retrieving summaries from Redis). Citation validation and instructions are correct.
*   **Structured Output & Validation:** Done for `/api/judge`. Partially done for `/api/generateFollowUpQuestions` (needs Zod). Not applicable for `/api/askFollowUp`.
*   **Error Handling:** Generally robust across all reviewed routes.

## Implementation Tasks

1.  **Implement Zod Validation for `/api/generateFollowUpQuestions`:**
    *   **File:** `app/api/generateFollowUpQuestions/route.js`
    *   **Action:**
        *   Import `z` from `zod`.
        *   Define a Zod schema: `const QuestionsSchema = z.array(z.string()).min(1);` (or similar, adjust min length if needed).
        *   After cleaning the AI response (`cleanedText`), attempt to parse it (`JSON.parse`).
        *   Use `QuestionsSchema.safeParse()` on the parsed data.
        *   If `safeParse` fails, log the Zod error and trigger the existing fallback logic (regex or default questions).
        *   If `safeParse` succeeds, use the validated data.

2.  **Refine Persona Prompts (Minor Cleanup):**
    *   **Files:**
        *   `app/prompts/therapist.ts`
        *   `app/prompts/analyst.ts`
        *   `app/prompts/coach.ts`
    *   **Action:** In each file, locate the `system` prompt string. Within the `CRITICAL: Output valid JSON:` section, remove the lines defining the `verdict` and `key_points` fields. Ensure the surrounding JSON structure description remains valid for the AI's guidance, even though the actual validation schema (`lib/validateJudge.ts`) doesn't use these fields.

3.  **Add Failure Caching to `retrieveSnippets.ts`:**
    *   **File:** `lib/retrieveSnippets.ts`
    *   **Action:**
        *   Define a short TTL for failure caching (e.g., `const failureCacheTTL = 60 * 5; // 5 minutes`).
        *   Define a prefix for failure keys (e.g., `const failureCachePrefix = 'snippet_fail:'`).
        *   Inside the `for (const url of relevantUrls)` loop:
            *   Before attempting `redis.hget(summaryKey, url)`, check if a failure key exists: `await redis.exists(failureCachePrefix + url)`. If it exists, log a warning and `continue` to the next URL.
            *   In the `catch (hgetError)` block for `redis.hget`, *after* logging the error, set the failure cache key: `await redis.set(failureCachePrefix + url, 'failed', { ex: failureCacheTTL });`.
        *   Consider if similar failure caching is needed for the initial `redis.get(cacheKey)` if that becomes problematic.

## Mermaid Diagram

```mermaid
graph TD
    A[Start Phase 1 Review] --> B{Review Files};
    B --> C[Judge Route & Prompts];
    B --> D[RAG Components];
    B --> E[Follow-up Routes];
    C --> F{Persona Prompts Outdated?};
    F -- Yes --> G[Plan: Refine Persona Prompts];
    F -- No --> H[Status: OK];
    D --> I{retrieveSnippets Error Handling?};
    I -- Needs Failure Cache? --> J[Plan: Add Failure Cache (Optional)];
    I -- OK --> K[Status: OK];
    D --> L{Citation Validation OK?};
    L -- Yes --> M[Status: OK];
    E --> N{generateFollowUpQuestions Zod Validation?};
    N -- No --> O[Plan: Implement Zod Validation];
    N -- Yes --> P[Status: OK];
    E --> Q{askFollowUp Structured Output?};
    Q -- No (Intentional) --> R[Status: OK];
    G --> S[Final Plan Confirmed];
    J --> S;
    K --> S;
    M --> S;
    O --> S;
    P --> S;
    R --> S;
    S --> T[Save Plan to MD];
    T --> U[Switch to Code Mode for Implementation];