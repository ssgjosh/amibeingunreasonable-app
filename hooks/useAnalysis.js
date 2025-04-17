import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation'; // Import useRouter

/**
 * Custom hook to manage the core state and logic for the AI analysis process,
 * including saving the result and redirecting.
 *
 * @param {Object} options - Options for the hook.
 * @param {Function} options.getFollowUpAnswers - Function to retrieve the current follow-up answers object.
 * @param {Array} options.followUpQuestions - The array of generated follow-up questions.
 * @returns {Object} An object containing state values and handler functions.
 */
export const useAnalysis = ({ getFollowUpAnswers, followUpQuestions }) => {
    const router = useRouter(); // Get router instance

    // --- State ---
    const [context, setContext] = useState('');
    // Query handling
    const [selectedQueryOption, setSelectedQueryOption] = useState('');
    const [customQuery, setCustomQuery] = useState('');
    const [queryToSend, setQueryToSend] = useState('');
    // API status
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    // const [isApiComplete, setIsApiComplete] = useState(false); // No longer needed here
    const [isTakingLong, setIsTakingLong] = useState(false);
    // UI / View state
    const [view, setView] = useState('input'); // 'input', 'loading', 'followup'

    // --- Refs ---
    const longLoadTimeoutRef = useRef(null);

    // --- Handlers ---

    const handleQueryOptionChange = useCallback((event) => {
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

    const handleCustomQueryChange = useCallback((event) => {
        const value = event.target.value;
        setCustomQuery(value);
        setQueryToSend(value);
        setError(null); // Clear error on change
    }, []);

    /**
     * Gets analysis, saves it, and redirects to the results page.
     * @param {Array<{question: string, answer: string}>} [followUpResponses=[]] - Optional array of follow-up Q&A pairs.
     */
    const proceedToAnalysisAndSave = useCallback(async (followUpResponses = []) => {
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
        // setIsApiComplete(false); // No longer needed
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

        let analysisData = null;
        let apiError = null;

        try {
            // 1. Get Analysis Results
            console.log("Sending request to /api/getResponses with query:", finalQuery);
            console.log("Including follow-up responses:", followUpResponses);
            const analysisRes = await fetch('/api/getResponses', {
                 method: 'POST',
                 headers: { 'Content-Type': 'application/json' },
                 body: JSON.stringify({
                     context,
                     query: finalQuery,
                     followUpResponses
                 })
            });

            clearTimeout(longLoadTimeoutRef.current); // Clear timeout once analysis response is received
            console.log(`/api/getResponses response status: ${analysisRes.status}`);

            if (!analysisRes.ok) {
                 const errorText = await analysisRes.text();
                 console.error(`API HTTP Error (getResponses) ${analysisRes.status}:`, errorText);
                 let detail = errorText;
                 try { detail = JSON.parse(errorText).error || errorText; } catch { /* ignore */ }
                 throw new Error(`Analysis failed: ${analysisRes.status} ${analysisRes.statusText || ''}. ${String(detail).substring(0, 100)}`);
            }

            analysisData = await analysisRes.json();
            console.log("Analysis data received:", analysisData);

            if (analysisData.error) {
                throw new Error(`Analysis API returned an error: ${analysisData.error}`);
            }
            if (!Array.isArray(analysisData.responses) || !analysisData.summary) {
                 throw new Error("Incomplete analysis data received from API.");
            }

            // 2. Save Analysis Results
            console.log("Attempting to save analysis results...");
            const dataToSave = {
                context,
                query: finalQuery,
                responses: analysisData.responses,
                summary: analysisData.summary,
                paraphrase: analysisData.paraphrase || '', // Include paraphrase if available
                timestamp: new Date().toISOString(),
                // Include the original follow-up questions and the *provided* answers
                followUpResponses: (followUpQuestions || []).map((question, index) => ({
                    question,
                    answer: followUpResponses[index]?.answer || '' // Use answers passed to this function
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
            // No need to setLoading(false) or setView here, as we are navigating away

        } catch (err) {
            clearTimeout(longLoadTimeoutRef.current); // Clear timeout on error
            console.error("Error during analysis or saving:", err);
            apiError = err instanceof Error ? err.message : String(err);
            if (!apiError) apiError = "An unknown error occurred during analysis or saving.";
            setError(apiError);
            setLoading(false);
            setView('input'); // Revert to input view on error
        }
        // Removed finally block as redirect handles success state change
    }, [context, queryToSend, router, followUpQuestions, setError, setView, setLoading, setIsTakingLong]); // Added router, setError, setView, setLoading, setIsTakingLong, followUpQuestions

    /**
     * Main function to trigger analysis. Handles validation and decides whether
     * to request follow-up questions or proceed directly to analysis & save.
     *
     * @param {Function} generateFollowUpQuestions - Async function to trigger follow-up question generation.
     * @param {boolean} skipFollowUpQuestions - State indicating if follow-ups should be skipped.
     */
    const askAI = useCallback(async (generateFollowUpQuestions, skipFollowUpQuestions) => {
        console.log("askAI triggered");
        setError(null); // Clear previous errors on new attempt

        // Validation happens within proceedToAnalysisAndSave now

        if (skipFollowUpQuestions) {
            console.log("Skipping follow-up questions, proceeding directly to analysis and save.");
            // Retrieve current answers (likely empty if skipped) before proceeding
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
        // setHasAnalysed(false); // No longer needed
        // setIsApiComplete(false); // No longer needed
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
        error,
        loading,
        isTakingLong,
        view, // Still needed to control which section is visible

        // State Setters needed by child components/other hooks
        setContext,
        setError,
        setView,

        // Handlers needed by child components
        handleQueryOptionChange,
        handleCustomQueryChange,
        askAI, // The main trigger
        handleRestart,
        proceedToAnalysisAndSave // Exported for the FollowUpQuestionsSection skip button
    };
};