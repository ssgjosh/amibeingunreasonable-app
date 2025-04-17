import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * Custom hook to manage the state and logic for the interactive follow-up chat conversation.
 *
 * @param {Object} options - Configuration options for the hook.
 * @param {string} [options.context] - The original context/situation. **Required for follow-up.**
 * @param {string} [options.query] - The original query. **Required for follow-up.**
 * @param {string} [options.originalContextId] - The ID of the saved result (used for context, but not sent directly).
 * @returns {Object} An object containing state values, ref, and handler functions.
 */
export const useFollowUpChat = (options = {}) => {
    // Destructure context and query directly. originalContextId might still be useful
    // for identifying the session but isn't sent to the askFollowUp API anymore.
    const { context, query, originalContextId } = options;

    // State for Follow-up Conversation
    const [followUpPersonaId, setFollowUpPersonaId] = useState(null); // ID of the persona locked for follow-up
    const [followUpQuestion, setFollowUpQuestion] = useState(''); // Current question input
    const [followUpConversation, setFollowUpConversation] = useState([]); // Array of { question: string, answer: string }
    const [isFollowUpLoading, setIsFollowUpLoading] = useState(false); // Loading state for follow-up API call
    const [followUpError, setFollowUpError] = useState(null); // Error state for follow-up API call

    // Ref to scroll to the end of the conversation
    const followUpEndRef = useRef(null);

    // Scroll to bottom effect
    useEffect(() => {
        followUpEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [followUpConversation]);

    /**
     * Initiates the follow-up chat with a specific persona.
     */
    const handleStartFollowUp = useCallback((personaId) => {
        setFollowUpPersonaId(personaId);
        setFollowUpConversation([]); // Reset conversation history
        setFollowUpError(null); // Clear previous errors
        setFollowUpQuestion(''); // Clear any lingering input
    }, []);

    /**
     * Sends the current follow-up question to the API.
     * Requires context and query to be provided in the hook options.
     */
    const handleSendFollowUp = useCallback(async (e) => {
        if (e) e.preventDefault(); // Prevent default form submission if called from event
        if (!followUpQuestion.trim() || !followUpPersonaId || isFollowUpLoading) return;

        // Validate that we have the required context and query from options
        if (!context || !query) {
             console.error("Follow-up chat requires context and query to be provided in hook options.");
             setFollowUpError("Internal configuration error: Missing context/query for follow-up.");
             return;
        }


        setIsFollowUpLoading(true);
        setFollowUpError(null);
        const currentQuestion = followUpQuestion; // Capture question before clearing input

        // Construct payload - Always send context and query
        const payload = {
            question: currentQuestion,
            personaId: followUpPersonaId,
            history: followUpConversation, // Send history for context
            context: context, // Send the actual context text
            query: query,     // Send the actual query text
        };
        // We no longer send originalContextId to this specific API endpoint

        try {
            const res = await fetch('/api/askFollowUp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                let errorDetail = `API responded with status ${res.status}`;
                try {
                    const errorJson = await res.json();
                    // Use the specific error message from the API if available
                    errorDetail = errorJson.error || JSON.stringify(errorJson);
                } catch { /* Ignore if response is not JSON */ }
                throw new Error(errorDetail);
            }

            const data = await res.json();

            if (!data.answer) {
                throw new Error("API response did not contain an answer.");
            }

            // Add Q&A pair to conversation history
            setFollowUpConversation(prev => [...prev, { question: currentQuestion, answer: data.answer }]);
            setFollowUpQuestion(''); // Clear input field

        } catch (err) {
            console.error("Error sending follow-up question:", err);
            // Display the specific error message from the API or a generic one
            setFollowUpError(err.message || "An unknown error occurred while getting the follow-up answer.");
        } finally {
            setIsFollowUpLoading(false);
        }
    // Ensure context and query are included in dependencies
    }, [followUpQuestion, followUpPersonaId, isFollowUpLoading, followUpConversation, context, query]);

    /**
     * Resets the state managed by this hook.
     */
    const resetFollowUpChatState = useCallback(() => {
        setFollowUpPersonaId(null);
        setFollowUpQuestion('');
        setFollowUpConversation([]);
        setIsFollowUpLoading(false);
        setFollowUpError(null);
    }, []);

    return {
        // State
        followUpPersonaId,
        followUpQuestion,
        followUpConversation,
        isFollowUpLoading,
        followUpError,

        // State Setters
        setFollowUpQuestion, // Allow direct input control

        // Refs
        followUpEndRef,

        // Handlers
        handleStartFollowUp,
        handleSendFollowUp,
        resetFollowUpChatState,
    };
};