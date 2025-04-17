import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * Custom hook to manage the state and logic for the interactive follow-up chat conversation.
 *
 * @param {Object} options - Configuration options for the hook.
 * @param {string} [options.context] - The original context/situation (used if originalContextId is not provided).
 * @param {string} [options.query] - The original query (used if originalContextId is not provided).
 * @param {string} [options.originalContextId] - The ID of the saved result (used for follow-ups on the results page).
 * @returns {Object} An object containing state values, ref, and handler functions.
 */
export const useFollowUpChat = (options = {}) => {
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
     * Adapts the payload based on whether context/query or originalContextId was provided.
     */
    const handleSendFollowUp = useCallback(async (e) => {
        if (e) e.preventDefault(); // Prevent default form submission if called from event
        if (!followUpQuestion.trim() || !followUpPersonaId || isFollowUpLoading) return;

        // Validate that we have enough info to make the API call
        if (!originalContextId && (!context || !query)) {
             console.error("Follow-up chat requires either originalContextId or context+query.");
             setFollowUpError("Internal configuration error: Missing context for follow-up.");
             return;
        }


        setIsFollowUpLoading(true);
        setFollowUpError(null);
        const currentQuestion = followUpQuestion; // Capture question before clearing input

        // Construct payload based on available options
        const payload = {
            question: currentQuestion,
            personaId: followUpPersonaId,
            history: followUpConversation, // Send history for context
        };
        if (originalContextId) {
            payload.originalContextId = originalContextId;
        } else {
            payload.context = context;
            payload.query = query;
        }

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
            setFollowUpError(err.message || "An unknown error occurred.");
        } finally {
            setIsFollowUpLoading(false);
        }
    }, [followUpQuestion, followUpPersonaId, isFollowUpLoading, followUpConversation, context, query, originalContextId]); // Include options in dependencies

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