import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook to manage fetching, state, and persona selection for shared results pages.
 *
 * @param {string | undefined} id - The ID of the result to fetch from the URL params.
 * @param {React.RefObject<HTMLElement>} detailViewRef - Ref for the detailed persona view card animation.
 * @returns {Object} An object containing state values and handler functions.
 */
export const useSharedResults = (id, detailViewRef) => {
    const [resultsData, setResultsData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedPersona, setSelectedPersona] = useState(null);
    const [isSwitchingPersona, setIsSwitchingPersona] = useState(false);

    // Effect to fetch results when the ID changes
    useEffect(() => {
        if (!id) {
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
            console.log(`Fetching results for ID: ${id}`);

            try {
                const res = await fetch(`/api/getResults/${id}`);
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
                const data = await res.json();

                if (typeof data !== 'object' || data === null) {
                    throw new Error("Received invalid data format from API.");
                }

                console.log("Results data received:", data);
                setResultsData(data);

                // Set default persona
                if (Array.isArray(data.responses) && data.responses.length > 0) {
                    const analystResponse = data.responses.find(r => r?.persona?.includes("Analyst") && r.response && !r.response.startsWith("["));
                    const firstValidResponse = data.responses.find(r => r?.response && !r.response.startsWith("["));
                    const defaultPersona = analystResponse ? analystResponse.persona : (firstValidResponse ? firstValidResponse.persona : null);
                    console.log(`Default persona determined: ${defaultPersona}`);
                    setSelectedPersona(defaultPersona);
                } else {
                    console.log("No valid responses found to set a default persona.");
                    setSelectedPersona(null); // No valid responses
                }

            } catch (err) {
                console.error("Error fetching shared results:", err);
                setError(err.message || "An unknown error occurred while fetching results.");
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
    const handleSelectPersona = useCallback((persona) => {
        if (persona === selectedPersona || isSwitchingPersona) return;
        console.log(`Switching persona to: ${persona}`);
        setIsSwitchingPersona(true);
        if (detailViewRef?.current) { // Check if ref exists
            detailViewRef.current.classList.remove('animate-fadeIn');
            void detailViewRef.current.offsetWidth; // Trigger reflow
        }
        setTimeout(() => {
            setSelectedPersona(persona);
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