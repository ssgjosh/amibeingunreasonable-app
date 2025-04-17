# Refactoring Plan: Explode Large Files & Introduce Dynamic Imports

This plan outlines the steps to refactor the React application (`amibeingunreasonable-app`) to break down large files, introduce code splitting using dynamic imports (`React.lazy`/`Suspense`), and organize the codebase into components, hooks, and utilities.

## 1. Identified Large Files (>300 Lines)

*   `app/page.js` (1160 lines)
*   `app/analysis/[id]/page.js` (380 lines)
*   `app/results/[id]/page.js` (531 lines)

## 2. Proposed Directory Structure

```
.
├── app/
│   ├── page.js                 # Refactored main page
│   ├── analysis/[id]/page.js   # Refactored analysis page
│   └── results/[id]/page.js    # Refactored results page
├── components/
│   ├── ui/                     # General reusable UI components
│   │   ├── LoadingSpinner.js
│   │   ├── Alert.js
│   │   ├── MarkdownRenderer.js
│   │   ├── Icons.js
│   │   ├── LoadingScreen.js
│   │   └── AnimatedPlaceholder.js
│   └── home/                   # Components specific to the home page (lazy-loaded)
│       ├── InputSection.js
│       ├── ResultsSection.js
│       └── FollowUpQuestionsSection.js
├── hooks/
│   ├── useAnalysis.js
│   ├── useFollowUpQuestions.js
│   ├── useFollowUpChat.js
│   ├── useSharing.js
│   └── useSharedResults.js
└── lib/
    ├── utils.js                # Existing utils
    └── analysisUtils.js        # New file for analysis-specific helpers
```

## 3. Extract Shared UI Components (`components/ui/`)

Move the following components from the large page files into dedicated files within `components/ui/`:

*   `LoadingSpinner.js`
*   `Alert.js`
*   `MarkdownRenderer.js`
*   `Icons.js` (Consolidate `IconWrapper`, `DocumentTextIcon`, `ChatBubbleLeftEllipsisIcon`, `SparklesIcon`, `ArrowRightIcon`, `PaperAirplaneIcon`, `ChatBubbleOvalLeftEllipsisIcon`)
*   `LoadingScreen.js` (From `app/page.js`)
*   `AnimatedPlaceholder.js` (From `app/page.js`)

## 4. Extract Shared Utilities (`lib/`)

Move or create the following utility functions in `lib/utils.js` or a new `lib/analysisUtils.js`:

*   `cleanResponseText`
*   `extractVerdictParts`

## 5. Create Custom Hooks (`hooks/`)

Create the following custom hooks to encapsulate state and logic:

*   `useAnalysis.js`: Manages core state & API logic for `app/page.js`.
*   `useFollowUpQuestions.js`: Manages follow-up question generation state & API logic for `app/page.js`.
*   `useFollowUpChat.js`: Manages follow-up conversation state & API logic. Reusable by `app/page.js` and `app/results/[id]/page.js`. Accepts `resultId` and `personaId`.
*   `useSharing.js`: Manages sharing state & API logic for `app/page.js`.
*   `useSharedResults.js`: Manages data fetching, loading/error states, and persona selection for `app/analysis/[id]/page.js` and `app/results/[id]/page.js`. Accepts the `id` parameter.

## 6. Refactor `app/page.js`

*   Import and use `useAnalysis`, `useFollowUpQuestions`, `useFollowUpChat`, `useSharing`.
*   Create lazy-loaded components in `components/home/`:
    *   `InputSection.js`
    *   `ResultsSection.js`
    *   `FollowUpQuestionsSection.js`
*   Use `React.lazy` and `<Suspense>` for these components.
*   Import shared UI components directly as needed.
*   Update all import paths.

## 7. Refactor `app/analysis/[id]/page.js`

*   Import and use `useSharedResults`.
*   Replace duplicated components/utils with imports from `components/ui/` and `lib/`.
*   Remove redundant state and logic now handled by the hook.
*   Move inline `<style jsx global>` to `app/globals.css`.
*   Update all import paths.

## 8. Refactor `app/results/[id]/page.js`

*   Import and use `useSharedResults` and `useFollowUpChat`.
*   Replace duplicated components/utils with imports from `components/ui/` and `lib/`.
*   Remove redundant state and logic now handled by the hooks.
*   Move inline `<style jsx global>` to `app/globals.css`.
*   Update all import paths.

## 9. Code Splitting (Next.js)

Rely on Next.js's built-in code splitting via `React.lazy` and dynamic `import()` for the lazy-loaded components created in `components/home/`. This will create separate chunks automatically.

## 10. Testing

After refactoring each major file and its associated hooks/components, run `npm run type-check` to catch type errors.

## Visualization (High-Level)

```mermaid
graph TD
    subgraph app
        page_js[page.js]
        analysis_page[analysis/[id]/page.js]
        results_page[results/[id]/page.js]
    end

    subgraph components/ui
        direction LR
        shared_ui[Shared UI Components]
    end

    subgraph components/home
        direction LR
        lazy_comps[Lazy-Loaded Sections]
    end

    subgraph hooks
        direction LR
        useAnalysis[useAnalysis]
        useFollowUpQ[useFollowUpQuestions]
        useFollowUpChat[useFollowUpChat]
        useSharing[useSharing]
        useSharedResults[useSharedResults]
    end

    subgraph lib
        direction LR
        shared_utils[Shared Utilities]
    end

    page_js -- uses --> useAnalysis
    page_js -- uses --> useFollowUpQ
    page_js -- uses --> useFollowUpChat
    page_js -- uses --> useSharing
    page_js -- lazy imports --> lazy_comps
    page_js -- imports --> shared_ui
    page_js -- imports --> shared_utils

    analysis_page -- uses --> useSharedResults
    analysis_page -- imports --> shared_ui
    analysis_page -- imports --> shared_utils

    results_page -- uses --> useSharedResults
    results_page -- uses --> useFollowUpChat
    results_page -- imports --> shared_ui
    results_page -- imports --> shared_utils

    lazy_comps -- imports --> shared_ui
    lazy_comps -- imports --> shared_utils