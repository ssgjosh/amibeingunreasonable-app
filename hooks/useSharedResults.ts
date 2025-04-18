import { useState, useEffect, useCallback, RefObject } from 'react';
import type { Snippet } from '@/lib/retrieveSnippets'; // Import Snippet type

// Define a type for the data structure as saved/fetched by getResults API
// This might differ slightly from JudgeResult if saveResults modifies it
interface SavedResultData {
    context?: string;
    query?: string;
    summary?: string;
    paraphrase?: string;
    timestamp?: string;
    followUpResponses?: Array<{ question: string; answer: string }>;
    // 'responses' here holds the array equivalent to JudgeResult['personas']
    responses?: Array<{
        name: "Therapist" | "Analyst" | "Coach";
        verdict: "Yes" | "No" | "Partially";
        rationale: string;
        key_points: [string, string, string];
    }>;
    // Add the optional snippets field
    snippets?: Snippet[];
}

type PersonaName = "Therapist" | "Analyst" | "Coach";

/**
 * Custom hook to manage fetching, state, and persona selection for shared results pages.
 *
 * @param {string | undefined} id - The ID of the result to fetch from the URL params.
 * @param {React.RefObject<HTMLElement>} detailViewRef - Ref for the detailed persona view card animation.
 * @returns {Object} An object containing state values and handler functions.
 */
export const useSharedResults = (id: string | string[] | undefined, detailViewRef: RefObject<HTMLElement>) => {
    // Use the updated SavedResultData type for state
    const [resultsData, setResultsData] = useState<SavedResultData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedPersona, setSelectedPersona] = useState<PersonaName | null>(null);
    const [isSwitchingPersona, setIsSwitchingPersona] = useState(false);

    // Effect to fetch results when the ID changes
    useEffect(() => {
        const resultId = Array.isArray(id) ? id[0] : id;

        if (!resultId) {
            setError("No result ID provided in the URL.");
            setLoading(false);
            setResultsData(null);
            return;
        }

        const fetchResults = async () => {
            setLoading(true);
            setError(null);
            setResultsData(null);
            setSelectedPersona(null);
            console.log(`Fetching results for ID: ${resultId}`);

            try {
                const res = await fetch(`/api/getResults/${resultId}`);
                if (!res.ok) {
                    let detail = `Server responded with status ${res.status}`;
                    try {
                        const jsonError = await res.json();
                        detail = jsonError.error || JSON.stringify(jsonError);
                    } catch (jsonParseError) {
                        try {
                            const errorText = await res.text();
                            detail = errorText || detail;
                        } catch (textReadError) {
                            console.error("Failed to read error response body as JSON or text:", textReadError);
                        }
                    }
                    throw new Error(`Failed to fetch results (${res.status}): ${detail}`);
                }
                // Type assertion ensures the fetched data conforms to our updated interface
                const data: SavedResultData = await res.json();

                if (typeof data !== 'object' || data === null) {
                    throw new Error("Received invalid data format from API.");
                }

                console.log("Results data received:", data); // Log the received data including snippets if present
                setResultsData(data);

                // Default to "Analyst" if personas exist
                // Note: The API response structure uses 'personas', but SavedResultData uses 'responses'
                if (Array.isArray(data.responses) && data.responses.length > 0) {
                    console.log(`Setting default persona to: Analyst`);
                    setSelectedPersona("Analyst");
                } else {
                    console.log("No responses/personas found, cannot set a default persona.");
                    setSelectedPersona(null);
                }

            } catch (err) {
                console.error("Error fetching shared results:", err);
                setError(err instanceof Error ? err.message : "An unknown error occurred while fetching results.");
                setResultsData(null);
            } finally {
                setLoading(false);
                console.log("Finished fetching results.");
            }
        };

        fetchResults();
    }, [id]);

    /**
     * Handles selecting a persona in the results view, including animation logic.
     */
    const handleSelectPersona = useCallback((personaName: PersonaName) => {
        if (personaName === selectedPersona || isSwitchingPersona) return;
        console.log(`Switching persona to: ${personaName}`);
        setIsSwitchingPersona(true);
        if (detailViewRef?.current) {
            detailViewRef.current.classList.remove('animate-fadeIn');
            void detailViewRef.current.offsetWidth;
        }
        setTimeout(() => {
            setSelectedPersona(personaName);
            setTimeout(() => {
                setIsSwitchingPersona(false);
                requestAnimationFrame(() => {
                    if (detailViewRef?.current) {
                        detailViewRef.current.classList.add('animate-fadeIn');
                    }
                });
            }, 50);
        }, 150);
    }, [selectedPersona, isSwitchingPersona, detailViewRef]);

    return {
        // State
        resultsData, // This now includes the optional 'snippets' field
        loading,
        error,
        selectedPersona,
        isSwitchingPersona,

        // Handlers
        handleSelectPersona,
    };
};