# Plan: Add Automatic Checks for AI Output

**Goal:** Implement automated checks for the AI's JSON output in the `/api/judge` endpoint using Zod for validation and Jest for testing, integrated into a CI pipeline via GitHub Actions.

**Plan Steps:**

1.  **Install Dependencies:**
    *   Install `zod` as a production dependency (`npm i zod --save`).
    *   Install `jest` and `@types/jest` as development dependencies (`npm i jest @types/jest --save-dev`).
2.  **Implement Zod Validation:**
    *   Create the file `lib/validateJudge.ts`.
    *   Define the `JudgeSchema` within `lib/validateJudge.ts` using the Zod definition provided in the initial request.
    *   Modify `app/api/judge/route.ts`:
        *   Import `JudgeSchema`.
        *   Replace the existing manual validation logic (lines 71-109) with `JudgeSchema.safeParse()`.
        *   Adjust error handling based on the `safeParse` result.
3.  **Implement Jest Testing:**
    *   Create the directory structure `tests/golden/`.
    *   Add example `.json` files (like `flatmate_dishes.json`) to `tests/golden/` with `context`, `query`, and `expected.analystVerdict`.
    *   Create a Jest configuration file (e.g., `jest.config.js`) suitable for a Next.js project.
    *   Create the test file `tests/judge.test.ts`.
    *   Implement the test logic in `tests/judge.test.ts` to:
        *   Read files from `tests/golden/`.
        *   Call the `/api/judge` endpoint for each file.
        *   Assert the `analystVerdict` matches the expected value.
    *   Add the script `"test": "jest"` to the `scripts` section in `package.json`.
4.  **Implement CI Workflow:**
    *   Create the directory structure `.github/workflows/`.
    *   Create the file `.github/workflows/ci.yml` with the YAML content provided in the initial request.

**Mermaid Diagram:**

```mermaid
graph TD
    A[Start: Add Checks] --> B[Install Zod];
    B --> C[Install Jest & @types/jest];
    C --> D[Create lib/validateJudge.ts & Define Schema];
    D --> E[Modify app/api/judge/route.ts to use Zod];
    E --> F[Create tests/golden/ dir & Add Golden Files];
    F --> G[Create jest.config.js];
    G --> H[Create tests/judge.test.ts & Write Test Logic];
    H --> I[Add 'test' script to package.json];
    I --> J[Create .github/workflows/ci.yml & Define Workflow];
    J --> K[End: Checks Implemented];