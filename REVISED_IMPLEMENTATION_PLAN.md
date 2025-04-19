# Revised Implementation Plan (Phase 0 Completion & Phase 1 Review)

**Plan Overview:**

This plan outlines the steps to complete the remaining tasks in Phase 0 (stabilization), including a review of test coverage, and then initiate the information gathering required to plan the implementation of Phase 1 (core logic and RAG enhancements).

**Phase 0 Completion Tasks:**

1.  **Apply Timeout Fix:** Modify `app/api/judge/route.ts` to add the Vercel `maxDuration` configuration.
    *   *Action:* Add `export const maxDuration = 60;` near the top of the file.
2.  **Review Test Coverage:** Read and analyze `tests/judge.test.ts` to assess its comprehensiveness in testing the `/api/judge` route, including validation, error handling (API errors, validation errors, Redis errors), RAG logic (with/without snippets, citation validation), different input scenarios (with/without follow-up questions), and expected output structure. Identify potential gaps or areas for improvement in test cases.
    *   *Action:* Read `tests/judge.test.ts`.
    *   *Analysis:* Evaluate test cases against the functionality of `app/api/judge/route.ts`.
3.  **Remove Obsolete API Routes:** Delete the now-unused API route files.
    *   *Action:* Delete `app/api/getResponses/route.js`.
    *   *Action:* Delete `app/api/saveResults/route.js`.
4.  **Verification (Manual Task):** Note that after these changes, running the test suite (`npm test` or similar) and performing manual end-to-end testing is recommended.

**Phase 1 Review Tasks (Information Gathering):**

1.  **Review Core Prompts:** Examine the externalized system prompts (`therapist.ts`, `analyst.ts`, `coach.ts`).
    *   *Action:* Read files.
    *   *Analysis:* Check British English, clarity, conciseness, persona adherence, citation instructions.
2.  **Review RAG Snippet Retrieval:** Examine `lib/retrieveSnippets.ts`.
    *   *Action:* Read file.
    *   *Analysis:* Assess error handling, caching.
3.  **Review Follow-Up Question Routes:** Examine `generateFollowUpQuestions/route.js` and `askFollowUp/route.js`.
    *   *Action:* Read files.
    *   *Analysis:* Review prompts, potential for structured output/validation, error handling.
4.  **Synthesize Findings & Plan Phase 1 Edits:** Based on the reviews (Steps 1-3), consolidate findings and create a specific, actionable plan for Phase 1 code modifications.

**Plan Visualization (Mermaid):**

```mermaid
graph TD
    A[Start] --> B{Phase 0 Completion};
    B --> C[Add maxDuration to /api/judge];
    B --> D[Review tests/judge.test.ts];
    B --> E[Delete /api/getResponses];
    B --> F[Delete /api/saveResults];
    C --> G{Phase 1 Review};
    D --> G;
    E --> G;
    F --> G;
    G --> H[Review Prompts (Therapist, Analyst, Coach)];
    G --> I[Review retrieveSnippets.ts];
    G --> J[Review /generateFollowUpQuestions];
    G --> K[Review /askFollowUp];
    H --> L[Synthesize Findings & Plan Phase 1 Edits];
    I --> L;
    J --> L;
    K --> L;
    L --> M[Request User Approval for Phase 1 Plan];
    M --> N[Switch to Code Mode for Implementation];

    subgraph Phase 0 Tasks
        C
        D
        E
        F
    end

    subgraph Phase 1 Review Tasks
        H
        I
        J
        K
    end