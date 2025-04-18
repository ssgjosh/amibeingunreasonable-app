import { useState, useCallback } from 'react';

/**
 * Custom hook to manage the state and logic for generating and handling
 * the initial set of follow-up questions before the main analysis.
 *
 * @returns {Object} An object containing state values and handler functions.
 */
export const useFollowUpQuestions = () => {
    // State for follow-up questions
    const [followUpQuestions, setFollowUpQuestions] = useState([]);
    const [followUpAnswers, setFollowUpAnswers] = useState({});
    const [isGeneratingFollowUps, setIsGeneratingFollowUps] = useState(false);
    const [skipFollowUpQuestions, setSkipFollowUpQuestions] = useState(false);
    // Optional: State to indicate if default questions are being used
    const [usingDefaultFollowUps, setUsingDefaultFollowUps] = useState(false);

    /**
     * Handles changes to the answer input for a specific follow-up question.
     */
    const handleFollowUpAnswerChange = useCallback((index, value) => {
        setFollowUpAnswers(prev => ({
            ...prev,
            [index]: value
        }));
    }, []);

    /**
     * Attempts to generate follow-up questions based on the context and query.
     * If successful and questions are generated, it sets the view to 'followup'.
     * If no questions are generated or an error occurs, it proceeds directly to analysis.
     *
     * @param {string} context - The user-provided context/situation.
     * @param {string} queryToSend - The specific question being asked.
     * @param {Function} setError - Function to set the main error state (from useAnalysis).
     * @param {Function} setView - Function to set the main view state (from useAnalysis).
     * @param {Function} proceedToAnalysis - Function to trigger the main analysis API call (from useAnalysis).
     * @returns {Promise<boolean>} True if follow-up questions were generated and view set, false otherwise.
     */
    const generateFollowUpQuestions = useCallback(async (
        context,
        queryToSend,
        setError,
        setView,
        proceedToAnalysis
    ) => {
        console.log("generateFollowUpQuestions triggered (hook)");
        const finalQuery = queryToSend.trim();
        setUsingDefaultFollowUps(false); // Reset default flag

        // Basic validation
        if (!context || context.length < 10) {
            setError("Context needed (min 10 chars).");
            return false;
        }
        if (!finalQuery || finalQuery.length < 5) {
            setError("Question needed (min 5 chars). Select an option or type your own.");
            return false;
        }

        setError(null);
        setIsGeneratingFollowUps(true);

        try {
            console.log("Sending request to generate follow-up questions");
            const res = await fetch('/api/generateFollowUpQuestions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ context, query: finalQuery })
            });

            // Still check for actual network/server errors first (e.g., 4xx, 5xx)
            if (!res.ok) {
                const errorText = await res.text();
                console.error(`Follow-up questions API error ${res.status}:`, errorText);
                let detail = errorText;
                try {
                    const jsonError = JSON.parse(errorText);
                    detail = jsonError.error || errorText;
                } catch (parseErr) { /* ignore */ }
                // Throw actual server errors
                throw new Error(`Server error: ${res.status} ${res.statusText || ''}. ${String(detail).substring(0, 100)}`);
            }

            const data = await res.json();
            console.log("Follow-up questions received:", data);

            // Check if the backend returned an error message (indicating fallback)
            if (data.error) {
                console.warn("Follow-up questions API returned an error message (using defaults):", data.error);
                // We still have questions (the defaults), so proceed to show them
                if (data.questions && Array.isArray(data.questions) && data.questions.length > 0) {
                    setFollowUpQuestions(data.questions);
                    const initialAnswers = {};
                    data.questions.forEach((q, index) => {
                        initialAnswers[index] = '';
                    });
                    setFollowUpAnswers(initialAnswers);
                    setUsingDefaultFollowUps(true); // Set flag indicating defaults are used
                    setView('followup');
                    return true; // Indicate success in *providing* questions (even if defaults)
                } else {
                    // Should not happen if backend logic is correct, but handle defensively
                    console.error("Follow-up API returned error but no fallback questions. Proceeding without follow-ups.");
                    setError("Could not retrieve follow-up questions. Proceeding with initial analysis."); // Inform user
                    await proceedToAnalysis({});
                    return false;
                }
            }
            // Check if questions were successfully generated (no error field)
            else if (data.questions && Array.isArray(data.questions) && data.questions.length > 0) {
                 // Original success path: Questions generated successfully
                setFollowUpQuestions(data.questions);
                const initialAnswers = {};
                data.questions.forEach((q, index) => {
                    initialAnswers[index] = '';
                });
                setFollowUpAnswers(initialAnswers);
                // setUsingDefaultFollowUps(false); // Already reset at start
                setView('followup');
                return true; // Indicate success in generating questions
            } else {
                // No questions generated by the API, and no error reported. Proceed directly.
                console.log("No follow-up questions generated by API, proceeding directly to analysis.");
                await proceedToAnalysis({}); // Pass empty answers
                return false; // Indicate analysis was triggered instead of showing follow-ups.
            }
        } catch (err) {
            // This catch block now primarily handles network errors or the !res.ok case
            console.error("Error during follow-up questions fetch/processing:", err);
            setError(`Failed to get follow-up questions: ${err.message || 'Unknown error'}`);
            // Don't proceed automatically on fetch errors. User needs to retry/restart.
            return false;
        } finally {
            setIsGeneratingFollowUps(false);
        }
    }, [setFollowUpQuestions, setFollowUpAnswers, setIsGeneratingFollowUps, setUsingDefaultFollowUps]); // Added setUsingDefaultFollowUps dependency

    /**
     * Resets the state managed by this hook.
     */
    const resetFollowUpQuestionsState = useCallback(() => {
        setFollowUpQuestions([]);
        setFollowUpAnswers({});
        setIsGeneratingFollowUps(false);
        setSkipFollowUpQuestions(false);
        setUsingDefaultFollowUps(false); // Reset default flag
    }, []);


    return {
        // State
        followUpQuestions,
        followUpAnswers,
        isGeneratingFollowUps,
        skipFollowUpQuestions,
        usingDefaultFollowUps, // Expose flag

        // State Setters
        setSkipFollowUpQuestions, // Allow component to toggle skipping

        // Handlers
        handleFollowUpAnswerChange,
        generateFollowUpQuestions, // Needs dependencies passed when called
        resetFollowUpQuestionsState,
    };
};