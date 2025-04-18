# Refactoring Plan: Introduce /api/judge Endpoint

This plan outlines the steps to refactor the AI response handling by introducing a new `/api/judge` endpoint that uses TypeScript, separates prompts, enforces a strict JSON output, and eliminates regex cleaning.

## Phase 1: Setup & Definitions

1.  **TypeScript Configuration:**
    *   Install necessary TypeScript dependencies: `npm install --save-dev typescript @types/react @types/node`.
    *   Create `tsconfig.json` in the project root with the following configuration:
        ```json
        {
          "compilerOptions": {
            "target": "es5",
            "lib": ["dom", "dom.iterable", "esnext"],
            "allowJs": true,
            "skipLibCheck": true,
            "strict": true,
            "forceConsistentCasingInFileNames": true,
            "noEmit": true,
            "esModuleInterop": true,
            "module": "esnext",
            "moduleResolution": "node",
            "resolveJsonModule": true,
            "isolatedModules": true,
            "jsx": "preserve",
            "incremental": true,
            "plugins": [
              {
                "name": "next"
              }
            ],
            "baseUrl": ".",
            "paths": {
              "@/*": ["./*"]
            }
          },
          "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
          "exclude": ["node_modules"]
        }
        ```
2.  **Define `JudgeResult` Interface:**
    *   Ensure the `lib` directory exists.
    *   Create `lib/types.ts`.
    *   Define and export the `JudgeResult` interface within this file as specified in the original task.
3.  **Create Prompt Directory:**
    *   Create the directory `app/prompts`.

## Phase 2: Persona Prompt Files

4.  **Create Persona Files (`.ts`):**
    *   Inside `app/prompts`, create:
        *   `therapist.ts`
        *   `analyst.ts`
        *   `coach.ts`
    *   In each file:
        *   Import types if necessary (e.g., `JudgeResult['personas'][0]`).
        *   Export an object with `system` (string: persona instructions adapted from `getResponses/route.js`, focusing on their role in the JSON output) and `example` (minimal placeholder object matching the `JudgeResult['personas']` entry structure).
        *   *Example Placeholder (Therapist):*
            ```typescript
            {
              name: "Therapist",
              verdict: "Partially",
              rationale: "Placeholder rationale focusing on interaction dynamics.",
              key_points: ["Placeholder point 1", "Placeholder point 2", "Placeholder point 3"]
            }
            ```
        *   Create similar placeholders for Analyst and Coach.

## Phase 3: New API Endpoint (`/api/judge`)

5.  **Create API Route File:**
    *   Create the directory `app/api/judge`.
    *   Create the file `app/api/judge/route.ts`.
6.  **Implement `route.ts` Logic:**
    *   Import necessary modules (`NextResponse`, `@google/generative-ai`, `JudgeResult`, persona objects).
    *   Initialize the Generative AI client.
    *   Define the `POST` handler (`export async function POST(request: Request)`).
    *   Handle input (parse JSON body for `context`, `query`, validate).
    *   Assemble the main prompt:
        *   Define the task (generate JSON matching `JudgeResult`).
        *   Include the `JudgeResult` interface definition.
        *   Include `system` and `example` from each persona file.
        *   Pass user `context` and `query`.
        *   Instruct on `paraphrase` and `summary` generation.
        *   Emphasize raw JSON output only.
        *   Specify stop sequence: `<END_JSON>`.
    *   Call `model.generateContent()` with the prompt, config (consider `responseMimeType: 'application/json'`), and `stopSequences: ['<END_JSON>']`.
    *   Handle response:
        *   Get raw text.
        *   `try...catch` `JSON.parse()`. Return 400 on parse failure.
        *   (Recommended) Validate parsed object structure against `JudgeResult`. Return 400 on validation failure.
        *   Return 200 with the parsed `JudgeResult` on success.
    *   Ensure *no* regex/string cleaning is used before parsing.

## Phase 4: Testing & Refinement

7.  **Testing:** Use `curl` or similar tools to test `/api/judge` with various inputs, checking for correct 200/400 responses and valid `JudgeResult` JSON.
8.  **Prompt Refinement:** Iterate on the prompt assembly (Step 6) if the model struggles with consistent, valid JSON output.

## Phase 5: Frontend Migration & Cleanup (Future)

9.  **Frontend Update:** Modify frontend code to call `/api/judge` and handle the `JudgeResult` structure.
10. **Remove Old Endpoint:** Delete `app/api/getResponses` after successful migration.

## Mermaid Diagram

```mermaid
graph TD
    subgraph Frontend
        direction LR
        UI[User Interface] -- context, query --> FE_Hook{useAnalysis Hook (Updated)}
        FE_Hook -- POST /api/judge --> B(api/judge/route.ts)
        B -- JudgeResult JSON / Error --> FE_Hook
        FE_Hook -- Formatted Data --> UI
    end

    subgraph Backend API (/api/judge)
        direction LR
        B[route.ts POST Handler] -- Receives context, query --> V{Input Validation}
        V -- Valid --> P{Prompt Assembly}
        V -- Invalid --> E400_Input[Return 400 Bad Request]

        P -- Imports --> T(prompts/therapist.ts)
        P -- Imports --> A(prompts/analyst.ts)
        P -- Imports --> C(prompts/coach.ts)
        P -- Imports --> I(lib/types.ts - JudgeResult)

        P -- Assembled Prompt --> AI_Call{Call Generative AI}
        AI_Call -- Includes --> T
        AI_Call -- Includes --> A
        AI_Call -- Includes --> C
        AI_Call -- Includes --> I
        AI_Call -- Stop Sequence: <END_JSON> --> AI_Model[AI Model]

        AI_Model -- Raw Text Response --> Parse{JSON.parse()}
        Parse -- Success --> Validate{Validate Structure}
        Parse -- Failure --> E400_Parse[Return 400 Bad Request - Parse Error]

        Validate -- Valid --> OK200[Return 200 OK (JudgeResult JSON)]
        Validate -- Invalid --> E400_Validate[Return 400 Bad Request - Validation Error]
    end

    subgraph Data Definitions
        T -- system, example --> P
        A -- system, example --> P
        C -- system, example --> P
        I -- JudgeResult Interface --> P & Validate
    end

    style E400_Input fill:#f9f,stroke:#333,stroke-width:2px
    style E400_Parse fill:#f9f,stroke:#333,stroke-width:2px
    style E400_Validate fill:#f9f,stroke:#333,stroke-width:2px
    style OK200 fill:#ccf,stroke:#333,stroke-width:2px