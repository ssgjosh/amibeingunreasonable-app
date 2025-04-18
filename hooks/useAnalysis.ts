import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation'; // Import useRouter
import type { JudgeResult } from '@/lib/types'; // Import the JudgeResult type

/**
 * Custom hook to manage the core state and logic for the AI analysis process,
 * including saving the result and redirecting.
 *
 * @param {Object} options - Options for the hook.
 * @param {Function} options.getFollowUpAnswers - Function to retrieve the current follow-up answers object.
 * @param {Array} options.followUpQuestions - The array of generated follow-up questions.
 * @returns {Object} An object containing state values and handler functions.
 */
// Define options type if possible, otherwise use a generic object or any
interface UseAnalysisOptions {
    getFollowUpAnswers?: () => Record<number, string>; // Function returning answers keyed by index
    followUpQuestions?: string[]; // Array of question strings
}

export const useAnalysis = ({ getFollowUpAnswers, followUpQuestions }: UseAnalysisOptions = {}) => {
    const router = useRouter(); // Get router instance

    // --- State ---
    const [context, setContext] = useState('');
    // Query handling
    const [selectedQueryOption, setSelectedQueryOption] = useState('');
    const [customQuery, setCustomQuery] = useState('');
    const [queryToSend, setQueryToSend] = useState('');
    // API status
    const [error, setError] = useState<string | null>(null); // Explicitly type error state
    const [loading, setLoading] = useState(false);
    const [isTakingLong, setIsTakingLong] = useState(false);
    // UI / View state
    const [view, setView] = useState('input'); // 'input', 'loading', 'followup'

    // --- Refs ---
    const longLoadTimeoutRef = useRef<NodeJS.Timeout | null>(null); // Type the ref

    // --- Handlers ---

    const handleQueryOptionChange = useCallback((event: React.ChangeEvent<HTMLSelectElement>) => { // Type event
        const selectedValue = event.target.value;
        setSelectedQueryOption(selectedValue);
        if (selectedValue === 'other') {
            setCustomQuery('');
            setQueryToSend('');
        } else {
            setQueryToSend(selectedValue);
            setCustomQuery('');
        }
        setError(null); // Clear error on change
    }, []);

    const handleCustomQueryChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => { // Type event
        const value = event.target.value;
        setCustomQuery(value);
        setQueryToSend(value);
        setError(null); // Clear error on change
    }, []);

    /**
     * Gets analysis, saves it, and redirects to the results page.
     * @param {Array<{question: string, answer: string}>} [followUpResponses=[]] - Optional array of follow-up Q&A pairs.
     */
    const proceedToAnalysisAndSave = useCallback(async (followUpResponses: Array<{question: string, answer: string}> = []) => { // Type param
        console.log("proceedToAnalysisAndSave triggered");
        const finalQuery = queryToSend.trim();

        // Validation
        if (!context.trim() || context.trim().length < 10) {
            setError("Context needed (min 10 chars).");
            setLoading(false);
            setView('input');
            return; // Stop execution
        }
        if (!finalQuery || finalQuery.length < 5) {
            setError("Question needed (min 5 chars). Select an option or type your own.");
            setLoading(false);
            setView('input');
            return; // Stop execution
        }

        console.log("Resetting analysis states for API call...");
        setError(null);
        setIsTakingLong(false);
        setLoading(true);
        setView('loading');
        console.log("State set to 'loading'");

        if (longLoadTimeoutRef.current) clearTimeout(longLoadTimeoutRef.current);
        const LONG_LOAD_THRESHOLD = 22000; // Consider adjusting threshold
        longLoadTimeoutRef.current = setTimeout(() => {
            console.log("Long load threshold reached");
            setIsTakingLong(true);
        }, LONG_LOAD_THRESHOLD);

        let analysisData: JudgeResult | null = null; // Use JudgeResult type
        let apiError: string | null = null; // Explicitly type

        try {
            // 1. Get Analysis Results from the NEW endpoint
            console.log("Sending request to /api/judge with query:", finalQuery);
            console.log("Including follow-up responses (if any, though /api/judge doesn't use them currently):", followUpResponses);
            // *** CHANGE: Call /api/judge ***
            const analysisRes = await fetch('/api/judge', {
                 method: 'POST',
                 headers: { 'Content-Type': 'application/json' },
                 body: JSON.stringify({
                     context,
                     query: finalQuery,
                     // Note: /api/judge currently doesn't use followUpResponses, but sending doesn't hurt
                     // followUpResponses
                 })
            });

            if (longLoadTimeoutRef.current) clearTimeout(longLoadTimeoutRef.current); // Clear timeout once analysis response is received
            console.log(`/api/judge response status: ${analysisRes.status}`);

            // *** CHANGE: Handle error response (always JSON now) ***
            if (!analysisRes.ok) {
                 let errorJson: { error?: string; details?: any } = {};
                 try {
                     errorJson = await analysisRes.json();
                     console.error(`API Error (judge) ${analysisRes.status}:`, errorJson);
                 } catch (parseError) {
                     // If parsing the error response fails, use status text
                     console.error(`API Error (judge) ${analysisRes.status}: Failed to parse error JSON.`, await analysisRes.text().catch(() => ''));
                 }
                 // Construct a user-friendly error message
                 const message = errorJson.error || `Analysis failed: ${analysisRes.status} ${analysisRes.statusText || ''}`;
                 // Optionally include details if they exist and are simple
                 const detailsString = errorJson.details && typeof errorJson.details === 'string' ? ` (${errorJson.details.substring(0, 50)}...)` : '';
                 throw new Error(message + detailsString);
            }

            // *** CHANGE: Expect JudgeResult structure ***
            analysisData = await analysisRes.json() as JudgeResult;
            console.log("Analysis data received from /api/judge:", analysisData);

            // Basic check if needed (though backend should guarantee structure on 200 OK)
            if (!analysisData || !analysisData.personas || !analysisData.summary || !analysisData.paraphrase) {
                 throw new Error("Incomplete analysis data received from API.");
            }

            // 2. Save Analysis Results
            console.log("Attempting to save analysis results...");
            // *** CHANGE: Adapt dataToSave to use JudgeResult structure ***
            const dataToSave = {
                context,
                query: finalQuery,
                // Store the whole JudgeResult structure or extract parts as needed by saveResults
                // Assuming saveResults expects the old structure for now:
                responses: analysisData.personas, // Map personas array to old 'responses'
                summary: analysisData.summary,
                paraphrase: analysisData.paraphrase,
                // Keep the rest as before
                timestamp: new Date().toISOString(),
                followUpResponses: (followUpQuestions || []).map((question, index) => ({
                    question,
                    answer: followUpResponses[index]?.answer || ''
                }))
            };

            const saveRes = await fetch('/api/saveResults', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dataToSave)
            });

            console.log(`/api/saveResults response status: ${saveRes.status}`);

            if (!saveRes.ok) {
                let errorMsg = `Failed to save results (status ${saveRes.status})`;
                try { errorMsg = (await saveRes.json()).error || errorMsg; } catch { /* ignore */ }
                throw new Error(errorMsg);
            }

            const { id } = await saveRes.json();
            if (!id) {
                throw new Error("Save results API did not return an ID.");
            }

            console.log(`Results saved successfully with ID: ${id}. Redirecting...`);

            // 3. Redirect to Results Page
            router.push(`/results/${id}`);

        } catch (err) {
            if (longLoadTimeoutRef.current) clearTimeout(longLoadTimeoutRef.current); // Clear timeout on error
            console.error("Error during analysis or saving:", err);
            apiError = err instanceof Error ? err.message : String(err);
            if (!apiError) apiError = "An unknown error occurred during analysis or saving.";
            setError(apiError); // Set the error state for the UI
            setLoading(false);
            setView('input'); // Revert to input view on error
        }
    }, [context, queryToSend, router, followUpQuestions, setError, setView, setLoading, setIsTakingLong]); // Dependencies seem okay

    /**
     * Main function to trigger analysis. Handles validation and decides whether
     * to request follow-up questions or proceed directly to analysis & save.
     *
     * @param {Function} generateFollowUpQuestions - Async function to trigger follow-up question generation.
     * @param {boolean} skipFollowUpQuestions - State indicating if follow-ups should be skipped.
     */
    const askAI = useCallback(async (generateFollowUpQuestions: Function | undefined, skipFollowUpQuestions: boolean) => { // Type params
        console.log("askAI triggered");
        setError(null); // Clear previous errors on new attempt

        // Validation happens within proceedToAnalysisAndSave now

        if (skipFollowUpQuestions) {
            console.log("Skipping follow-up questions, proceeding directly to analysis and save.");
            const currentAnswers = typeof getFollowUpAnswers === 'function' ? getFollowUpAnswers() : {};
            const followUpResponses = (followUpQuestions || []).map((question, index) => ({
                question,
                answer: currentAnswers[index] || ''
            }));
            await proceedToAnalysisAndSave(followUpResponses);
        } else {
            console.log("Attempting to generate follow-up questions.");
            if (typeof generateFollowUpQuestions === 'function') {
                // Pass the *correct* proceed function (proceedToAnalysisAndSave)
                // Assuming generateFollowUpQuestions expects these args: context, query, setError, setView, proceedFn
                await generateFollowUpQuestions(context, queryToSend, setError, setView, proceedToAnalysisAndSave);
            } else {
                console.error("generateFollowUpQuestions function not provided to useAnalysis hook!");
                setError("Internal error: Follow-up question logic unavailable.");
            }
        }
    }, [context, queryToSend, proceedToAnalysisAndSave, setError, setView, getFollowUpAnswers, followUpQuestions]); // Added dependencies

    /**
     * Resets the state managed by this hook to initial values.
     */
    const handleRestart = useCallback(() => {
        console.log("handleRestart triggered (useAnalysis)");
        setContext('');
        setSelectedQueryOption('');
        setCustomQuery('');
        setQueryToSend('');
        setError(null);
        setView('input');
        setLoading(false);
        setIsTakingLong(false);
        if (longLoadTimeoutRef.current) clearTimeout(longLoadTimeoutRef.current);
        // Resetting other states (follow-up) should be done in the component
    }, []);


    return {
        // State needed for Input/FollowUp sections
        context,
        selectedQueryOption,
        customQuery,
        queryToSend,
        error, // Return the error state
        loading,
        isTakingLong,
        view,

        // State Setters needed by child components/other hooks
        setContext,
        setError,
        setView,

        // Handlers needed by child components
        handleQueryOptionChange,
        handleCustomQueryChange,
        askAI, // The main trigger
        handleRestart,
        proceedToAnalysisAndSave
    };
};