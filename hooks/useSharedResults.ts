import { useState, useEffect, useCallback, RefObject } from 'react';
import type { JudgeResult } from '@/lib/types'; // Assuming JudgeResult is the core structure

// Define a type for the data structure as saved/fetched by getResults API
// This might differ slightly from JudgeResult if saveResults modifies it
// For now, assume it includes the core fields we need.
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
    const [resultsData, setResultsData] = useState<SavedResultData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    // *** CHANGE: Initialize selectedPersona state directly to "Analyst" ***
    // We will still set it to null initially and update after fetch to ensure data is ready.
    const [selectedPersona, setSelectedPersona] = useState<PersonaName | null>(null); // Use PersonaName type
    const [isSwitchingPersona, setIsSwitchingPersona] = useState(false);

    // Effect to fetch results when the ID changes
    useEffect(() => {
        // Ensure id is a single string if it's an array (can happen with catch-all routes)
        const resultId = Array.isArray(id) ? id[0] : id;

        if (!resultId) {
            setError("No result ID provided in the URL.");
            setLoading(false);
            setResultsData(null); // Ensure data is cleared if ID is missing
            return;
        }

        const fetchResults = async () => {
            setLoading(true);
            setError(null);
            setResultsData(null); // Clear previous results before fetching new ones
            setSelectedPersona(null); // Reset selected persona
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
                const data: SavedResultData = await res.json();

                if (typeof data !== 'object' || data === null) {
                    throw new Error("Received invalid data format from API.");
                }

                console.log("Results data received:", data);
                setResultsData(data);

                // *** CHANGE: Always default to "Analyst" if responses exist ***
                if (Array.isArray(data.responses) && data.responses.length > 0) {
                    console.log(`Setting default persona to: Analyst`);
                    setSelectedPersona("Analyst");
                } else {
                    console.log("No responses found, cannot set a default persona.");
                    setSelectedPersona(null); // No responses to select from
                }

            } catch (err) {
                console.error("Error fetching shared results:", err);
                setError(err instanceof Error ? err.message : "An unknown error occurred while fetching results.");
                setResultsData(null); // Clear data on error
            } finally {
                setLoading(false);
                console.log("Finished fetching results.");
            }
        };

        fetchResults();
    }, [id]); // Re-run effect if the ID changes

    /**
     * Handles selecting a persona in the results view, including animation logic.
     */
    const handleSelectPersona = useCallback((personaName: PersonaName) => { // Use PersonaName type
        if (personaName === selectedPersona || isSwitchingPersona) return;
        console.log(`Switching persona to: ${personaName}`);
        setIsSwitchingPersona(true);
        if (detailViewRef?.current) { // Check if ref exists
            detailViewRef.current.classList.remove('animate-fadeIn');
            void detailViewRef.current.offsetWidth; // Trigger reflow
        }
        setTimeout(() => {
            setSelectedPersona(personaName);
            setTimeout(() => {
                setIsSwitchingPersona(false);
                requestAnimationFrame(() => {
                    if (detailViewRef?.current) { // Check if ref exists
                        detailViewRef.current.classList.add('animate-fadeIn');
                    }
                });
            }, 50); // Short delay for state update
        }, 150); // Delay for fade out animation
    }, [selectedPersona, isSwitchingPersona, detailViewRef]); // Added dependencies

    return {
        // State
        resultsData,
        loading,
        error,
        selectedPersona,
        isSwitchingPersona,

        // Handlers
        handleSelectPersona,
        // No reset function needed here as state resets naturally when ID changes
    };
};