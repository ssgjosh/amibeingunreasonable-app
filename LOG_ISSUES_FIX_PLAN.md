# Plan to Address Log Issues (2025-04-19)

This plan outlines the steps to fix issues identified in the `npm run dev` log output.

## Identified Issues:

1.  **`[MODULE_TYPELESS_PACKAGE_JSON]` Warning:** `package.json` lacks `"type": "module"`, causing performance overhead during ES module parsing.
2.  **RAG 404 Errors:** Two URLs in `lib/approvedSources.ts` are broken (404 Not Found), preventing the RAG system from fetching content.
    *   `https://www.nhs.uk/conditions/pregnancy-and-baby/behaviour-safety/`
    *   `https://www.nspcc.org.uk/keeping-children-safe/support-for-parents/positive-parenting/`
3.  **`params` Error:** A runtime error occurs in `app/api/getResults/[id]/route.js` related to accessing `params.id`, potentially due to a misleading error message, a Next.js bug/quirk, or a build/cache issue.

## Proposed Fixes:

1.  **Fix Module Warning:**
    *   **File:** `package.json`
    *   **Change:** Add the `"type": "module"` property to the main JSON object.

2.  **Fix RAG 404 Errors:**
    *   **File:** `lib/approvedSources.ts`
    *   **Change:** Remove the lines corresponding to the two broken URLs (lines 4 and 5 in the original file).

3.  **Address `params` Error (Investigation):**
    *   **File:** `app/api/getResults/[id]/route.js`
    *   **Action:** No direct code changes planned initially. After applying fixes #1 and #2:
        *   Stop the development server.
        *   Recommend clearing the Next.js cache (e.g., delete `.next` folder or run `npm run build`).
        *   Restart the development server (`npm run dev`).
        *   Retest the `/api/getResults/[id]` endpoint. If the error persists, further investigation is required.

## Mermaid Diagram:

```mermaid
graph TD
    A[Start] --> B{Identify Issues};
    B --> C[Module Warning];
    B --> D[RAG 404s];
    B --> E[Params Error];

    C --> F[Plan: Add type: module to package.json];
    D --> G[Plan: Remove broken URLs from lib/approvedSources.ts];
    E --> H[Plan: Observe after other fixes, suggest cache clear/rebuild];

    F --> I{Implement Fixes};
    G --> I;
    H --> J[Test & Verify];
    I --> J;