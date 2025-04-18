import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation'; // Import useRouter
// Removed JudgeResult import as we rely on the API structure now

/**
 * Custom hook to manage the core state and logic for the AI analysis process,
 * including triggering the analysis, saving the result via the API, and redirecting.
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
     * Calls the backend API to generate analysis, save it, and redirects to the results page.
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

        let apiError: string | null = null; // Explicitly type

        try {
            // 1. Call the updated /api/getResponses endpoint
            console.log("Sending request to /api/getResponses with query:", finalQuery);
            console.log("Including follow-up responses:", followUpResponses);

            const analysisRes = await fetch('/api/getResponses', { // *** CHANGED Endpoint ***
                 method: 'POST',
                 headers: { 'Content-Type': 'application/json' },
                 body: JSON.stringify({
                     context,
                     query: finalQuery,
                     followUpResponses // Pass the collected follow-up responses
                 })
            });

            if (longLoadTimeoutRef.current) clearTimeout(longLoadTimeoutRef.current); // Clear timeout once response is received
            console.log(`/api/getResponses response status: ${analysisRes.status}`);

            // Handle error response (expecting JSON with 'error' field)
            if (!analysisRes.ok) {
                 let errorJson: { error?: string; details?: any } = {};
                 try {
                     errorJson = await analysisRes.json();
                     console.error(`API Error (getResponses) ${analysisRes.status}:`, errorJson);
                 } catch (parseError) {
                     // If parsing the error response fails, use status text
                     console.error(`API Error (getResponses) ${analysisRes.status}: Failed to parse error JSON.`, await analysisRes.text().catch(() => ''));
                 }
                 // Construct a user-friendly error message
                 const message = errorJson.error || `Analysis failed: ${analysisRes.status} ${analysisRes.statusText || ''}`;
                 // Optionally include details if they exist and are simple
                 const detailsString = errorJson.details && typeof errorJson.details === 'string' ? ` (${errorJson.details.substring(0, 50)}...)` : '';
                 throw new Error(message + detailsString);
            }

            // 2. Extract resultId from the successful response
            const responseData = await analysisRes.json();
            const resultId = responseData.resultId; // *** CHANGED: Expect resultId ***
            console.log("Analysis data received from /api/getResponses:", responseData);

            if (!resultId) {
                 throw new Error("API did not return a result ID.");
            }

            // 3. Redirect to Results Page
            console.log(`Analysis successful. Result ID: ${resultId}. Redirecting...`);
            router.push(`/results/${resultId}`); // *** CHANGED: Use resultId for redirect ***

            // *** REMOVED: Old /api/saveResults call ***

        } catch (err) {
            if (longLoadTimeoutRef.current) clearTimeout(longLoadTimeoutRef.current); // Clear timeout on error
            console.error("Error during analysis request:", err); // Updated error context
            apiError = err instanceof Error ? err.message : String(err);
            if (!apiError) apiError = "An unknown error occurred during analysis."; // Updated error context
            setError(apiError); // Set the error state for the UI
            setLoading(false);
            setView('input'); // Revert to input view on error
        }
    }, [context, queryToSend, router, setError, setView, setLoading, setIsTakingLong]); // Removed followUpQuestions dependency as it's passed directly

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
            // No need to construct followUpResponses here, proceedToAnalysisAndSave will handle it if needed later
            await proceedToAnalysisAndSave([]); // Pass empty array if skipping
        } else {
            console.log("Attempting to generate follow-up questions.");
            if (typeof generateFollowUpQuestions === 'function') {
                // Pass the *correct* proceed function (proceedToAnalysisAndSave)
                // Assuming generateFollowUpQuestions expects these args: context, query, setError, setView, proceedFn
                // We need to construct the followUpResponses array inside generateFollowUpQuestions or pass it back
                // For now, assume generateFollowUpQuestions calls proceedToAnalysisAndSave internally after getting answers
                await generateFollowUpQuestions(context, queryToSend, setError, setView, proceedToAnalysisAndSave);
            } else {
                console.error("generateFollowUpQuestions function not provided to useAnalysis hook!");
                setError("Internal error: Follow-up question logic unavailable.");
            }
        }
    }, [context, queryToSend, proceedToAnalysisAndSave, setError, setView]); // Removed getFollowUpAnswers, followUpQuestions

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
        proceedToAnalysisAndSave // Expose this if needed directly (e.g., by FollowUpQuestionsSection)
    };
};