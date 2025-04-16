"use client";
import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation'; // Import useRouter
import ReactMarkdown from 'react-markdown';
import Link from 'next/link'; // Import Link for CTA

// --- Copied Components (Ideally refactor these into shared files) ---

const LoadingSpinner = ({ className = "h-5 w-5" }) => (
    <svg className={`animate-spin text-white ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

const Alert = ({ type = 'error', title, message }) => {
    const colors = {
        error: 'bg-red-900/40 border-red-600/70 text-red-200',
        warning: 'bg-yellow-900/40 border-yellow-600/70 text-yellow-200',
        info: 'bg-blue-900/40 border-blue-600/70 text-blue-200',
    };
    const displayMessage = typeof message === 'string' && message.trim() !== '' ? message : "An unspecified error occurred or no details were provided.";
    return (
        <div className={`border-l-4 p-4 rounded-lg shadow-sm ${colors[type] || colors.info}`} role="alert">
            {title && <p className="font-bold mb-1">{title}</p>}
            <p>{displayMessage}</p>
        </div>
    );
};

const MarkdownRenderer = ({ content, className = "", isDark = false }) => {
    const baseProseClass = "prose prose-sm max-w-none";
    const themeProseClass = isDark ? "prose-invert" : "";
    const textStyles = isDark
        ? "prose-p:text-slate-200 prose-strong:text-white prose-a:text-cyan-400 hover:prose-a:text-cyan-300 prose-blockquote:text-slate-300 prose-blockquote:border-slate-600 prose-code:text-pink-300 prose-headings:text-slate-100 prose-ul:text-slate-200 prose-ol:text-slate-200 prose-li:text-slate-200"
        : "prose-p:text-slate-700 prose-strong:text-slate-900 prose-a:text-cyan-700 hover:prose-a:text-cyan-600 prose-blockquote:text-slate-600 prose-blockquote:border-slate-400 prose-code:text-pink-700 prose-headings:text-slate-800 prose-ul:text-slate-700 prose-ol:text-slate-700 prose-li:text-slate-700";

    // Ensure content is a string before rendering
    const safeContent = typeof content === 'string' ? content : '';

    return (
        <div className={`${baseProseClass} ${themeProseClass} ${textStyles} ${className}`}>
            <ReactMarkdown
                components={{
                    p: ({ node, ...props }) => <p className="mb-3 last:mb-0" {...props} />,
                    strong: ({ node, ...props }) => <strong className="font-semibold" {...props} />,
                    ul: ({ node, ...props }) => <ul className="list-disc list-inside mb-3 pl-1" {...props} />,
                    ol: ({ node, ...props }) => <ol className="list-decimal list-inside mb-3 pl-1" {...props} />,
                    li: ({ node, ...props }) => <li className="mb-1" {...props} />,
                    a: ({ node, ...props }) => <a className="font-medium underline" {...props} />,
                    blockquote: ({ node, ...props }) => <blockquote className="italic border-l-4 pl-4 my-4" {...props} />,
                    code: ({ node, ...props }) => <code className={`px-1 py-0.5 rounded text-sm ${isDark ? 'bg-black/20' : 'bg-slate-200'}`} {...props} />,
                }}
            >
                {safeContent}
            </ReactMarkdown>
        </div>
    );
};


const IconWrapper = ({ children }) => <span className="inline-block mr-2 text-slate-400 align-middle">{children}</span>;
const DocumentTextIcon = () => <IconWrapper><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg></IconWrapper>;
const ChatBubbleLeftEllipsisIcon = () => <IconWrapper><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-3.03 8.25-6.75 8.25a9.753 9.753 0 0 1-4.75-1.195A9.753 9.753 0 0 1 3 12c0-4.556 3.03-8.25 6.75-8.25a9.753 9.753 0 0 1 4.75 1.195A9.753 9.753 0 0 1 21 12Z" /></svg></IconWrapper>;
const SparklesIcon = ({className="w-5 h-5 inline-block align-middle"}) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L1.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" /></svg>;
const ArrowRightIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 ml-1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" /></svg>;
const PaperAirplaneIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" /></svg>;
const ChatBubbleOvalLeftEllipsisIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 inline-block mr-1.5 align-text-bottom"><path strokeLinecap="round" strokeLinejoin="round" d="M18 12.75H6M21 12.75c0 5.25-4.75 9.75-10.5 9.75S0 18 0 12.75C0 7.5 4.75 3 10.5 3S21 7.5 21 12.75Z" /></svg>;


// --- Helper Function to Clean Response Text ---
// Removes specific key prefixes (case-insensitive) from the start of lines.
const cleanResponseText = (text) => {
    if (!text || typeof text !== 'string') return '';

    const keysToRemove = [
        "CORE_DYNAMIC:",
        "CONCLUSION:",
        "FINAL_CONCLUSION:",
        "STRATEGY_EFFECTIVENESS:",
        "VERDICT:" // Also include VERDICT here for consistency, though extractVerdictParts handles it separately too
    ];

    const lines = text.split('\n');
    const cleanedLines = lines.map(line => {
        const trimmedLine = line.trim();
        for (const key of keysToRemove) {
            // Case-insensitive check if the trimmed line starts with the key
            if (trimmedLine.toUpperCase().startsWith(key.toUpperCase())) {
                // Find the length of the actual key match (could differ in case)
                const keyLength = key.length;
                // Remove the key and any immediate whitespace after it
                return trimmedLine.substring(keyLength).trimStart();
            }
        }
        // If no key matched, return the original line (it might be empty or just whitespace)
        return line;
    });

    // Join back, filter out potentially empty lines resulting from key removal, and trim the final result
    return cleanedLines.filter(line => line.trim().length > 0).join('\n').trim();
};


// --- Shared Result Page Component ---

export default function SharedResultPage() {
    const params = useParams();
    const router = useRouter(); // Get router instance
    const id = params.id;
    const [resultsData, setResultsData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedPersona, setSelectedPersona] = useState(null);
    const [isSwitchingPersona, setIsSwitchingPersona] = useState(false);
    const detailViewRef = useRef(null);

    // --- State for Follow-up Conversation ---
    const [followUpPersonaId, setFollowUpPersonaId] = useState(null); // ID of the persona locked for follow-up
    const [followUpQuestion, setFollowUpQuestion] = useState(''); // Current question input
    const [followUpConversation, setFollowUpConversation] = useState([]); // Array of { question: string, answer: string }
    const [isFollowUpLoading, setIsFollowUpLoading] = useState(false); // Loading state for follow-up API call
    const [followUpError, setFollowUpError] = useState(null); // Error state for follow-up API call
    const followUpEndRef = useRef(null); // Ref to scroll to the end of the conversation

    useEffect(() => {
        if (!id) {
            setError("No result ID provided in the URL.");
            setLoading(false);
            return;
        }

        const fetchResults = async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await fetch(`/api/getResults/${id}`);
                if (!res.ok) {
                    let detail = `Server responded with status ${res.status}`; // Default detail
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

                // Basic check if data is an object before proceeding
                if (typeof data !== 'object' || data === null) {
                    throw new Error("Received invalid data format from API.");
                }

                setResultsData(data);

                // Set default persona (ensure data.responses exists and is an array)
                if (Array.isArray(data.responses) && data.responses.length > 0) {
                    const analystResponse = data.responses.find(r => r?.persona?.includes("Analyst") && r.response && !r.response.startsWith("["));
                    const firstValidResponse = data.responses.find(r => r?.response && !r.response.startsWith("["));
                    const defaultPersona = analystResponse ? analystResponse.persona : (firstValidResponse ? firstValidResponse.persona : null);
                    setSelectedPersona(defaultPersona);
                } else {
                    setSelectedPersona(null); // No valid responses
                }

            } catch (err) {
                console.error("Error fetching shared results:", err);
                setError(err.message || "An unknown error occurred while fetching results.");
                setResultsData(null);
            } finally {
                setLoading(false);
            }
        };

        fetchResults();
    }, [id]);

    // Scroll to bottom of follow-up conversation when it updates
    useEffect(() => {
        followUpEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [followUpConversation]);

    const handleSelectPersona = (persona) => {
        if (persona === selectedPersona || isSwitchingPersona) return;
        setIsSwitchingPersona(true);
        if (detailViewRef.current) {
            detailViewRef.current.classList.remove('animate-fadeIn');
            void detailViewRef.current.offsetWidth;
        }
        setTimeout(() => {
            setSelectedPersona(persona);
            setTimeout(() => {
                setIsSwitchingPersona(false);
                requestAnimationFrame(() => {
                    if (detailViewRef.current) {
                        detailViewRef.current.classList.add('animate-fadeIn');
                    }
                });
            }, 50);
        }, 150);
    };

    // --- Function to initiate follow-up ---
    const handleStartFollowUp = (personaId) => {
        setFollowUpPersonaId(personaId);
        setFollowUpConversation([]); // Reset conversation history
        setFollowUpError(null); // Clear previous errors
        setFollowUpQuestion(''); // Clear any lingering input
    };

    // --- Function to send follow-up question ---
    const handleSendFollowUp = async (e) => {
        e.preventDefault(); // Prevent default form submission
        if (!followUpQuestion.trim() || !followUpPersonaId || isFollowUpLoading) return;

        setIsFollowUpLoading(true);
        setFollowUpError(null);
        const currentQuestion = followUpQuestion; // Capture question before clearing input

        try {
            const res = await fetch('/api/askFollowUp', { // NEW API Endpoint
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    question: currentQuestion,
                    personaId: followUpPersonaId,
                    originalContextId: id,
                    // Optionally send previous conversation history if needed by the API
                    // history: followUpConversation
                }),
            });

            if (!res.ok) {
                let errorDetail = `API responded with status ${res.status}`;
                try {
                    const errorJson = await res.json();
                    errorDetail = errorJson.error || JSON.stringify(errorJson);
                } catch {
                    // Ignore if response is not JSON
                }
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
            // Optionally keep the question in the input field on error:
            // setFollowUpQuestion(currentQuestion);
        } finally {
            setIsFollowUpLoading(false);
        }
    };


    // Ensure resultsData and resultsData.responses exist before finding
    const selectedResponse = (resultsData && Array.isArray(resultsData.responses))
        ? resultsData.responses.find(r => r?.persona === selectedPersona)
        : null;

    // --- Render Logic ---
    // Function to extract the verdict headline and the rest of the summary based on "VERDICT:" label
    // Note: This function now assumes the input `summary` has already been cleaned by `cleanResponseText`
    const extractVerdictParts = (cleanedSummary) => {
        if (!cleanedSummary || typeof cleanedSummary !== 'string') return null;

        // Since cleanResponseText might remove the VERDICT: prefix, we can't rely on it here.
        // Instead, we assume the first paragraph of the cleaned summary is the headline.
        const firstParagraphBreakIndex = cleanedSummary.indexOf('\n\n');

        let headline = '';
        let after = '';

        if (firstParagraphBreakIndex !== -1) {
            headline = cleanedSummary.substring(0, firstParagraphBreakIndex).trim();
            after = cleanedSummary.substring(firstParagraphBreakIndex).trim();
        } else {
            headline = cleanedSummary.trim(); // Entire cleaned summary is the headline
            after = '';
        }

        // Return parts if headline is not empty
        if (headline) {
            return {
                headline: headline,
                after: after
            };
        }

        return null; // Return null if cleanedSummary was empty or only whitespace
    };

    // MODIFIED: Clean the summary text *before* processing it further
    const cleanedSummary = resultsData?.summary ? cleanResponseText(resultsData.summary) : null;
    const verdictParts = cleanedSummary ? extractVerdictParts(cleanedSummary) : null;


    return (
        <main className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black py-12 sm:py-16 px-4 sm:px-6 lg:px-8 font-sans antialiased text-slate-300 animate-gradient-bg">
            <div className="max-w-5xl mx-auto bg-slate-800/60 backdrop-blur-lg shadow-2xl rounded-3xl overflow-hidden border border-slate-700/60">
                <div className="bg-gradient-to-r from-slate-900/80 via-gray-900/70 to-slate-800/80 backdrop-blur-sm pt-6 sm:pt-8 pb-8 sm:pb-10 px-10 sm:px-12 text-center shadow-lg border-b border-slate-700/40">
                   {/* --- UPDATED TITLE --- */}
                   <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-cyan-400 tracking-tight pb-2">AI Reasonableness Analysis</h1>
                   {/* --- ADDED EXPLAINER --- */}
                   <p className="text-sm text-slate-400 mt-2 max-w-2xl mx-auto">
                       Someone used the "Am I Being Unreasonable?" AI tool to analyse a situation. Here are the results:
                   </p>
                   {resultsData?.timestamp && (
                       <p className="text-xs text-slate-500 mt-3">Analysis generated on: {new Date(resultsData.timestamp).toLocaleString()}</p>
                   )}
                </div>

                <div className="bg-transparent px-6 md:px-10 py-10">
                    {loading && (
                        <div className="flex justify-center items-center py-20">
                            <LoadingSpinner className="h-12 w-12" />
                            <p className="ml-4 text-xl text-slate-400">Loading analysis results...</p>
                        </div>
                    )}

                    {error && (
                        <div className="my-10 max-w-3xl mx-auto">
                            <Alert type="error" title="Error Loading Results" message={error} />
                        </div>
                    )}

                    {!loading && !error && !resultsData && (
                         <div className="my-10 max-w-3xl mx-auto">
                            <Alert type="warning" title="Not Found" message="The requested results could not be found. The link may be invalid or the results may have expired." />
                        </div>
                    )}

                    {resultsData && !loading && !error && (
                        <div className='space-y-10 md:space-y-12'>
                            {/* Original Context & Query */}
                            <div className="max-w-3xl mx-auto">
                                {/* --- UPDATED HEADING --- */}
                                <h3 className="text-lg font-semibold text-slate-100 mb-3 flex items-center"><DocumentTextIcon />The Situation Described</h3>
                                <div className="p-4 text-sm border border-slate-600/50 rounded-xl bg-slate-700/30 text-slate-300 whitespace-pre-wrap">
                                    {resultsData.context || "No context provided."}
                                </div>
                                {/* --- UPDATED HEADING & STYLING --- */}
                                <h3 className="text-lg font-semibold text-slate-100 mt-8 mb-4 flex items-center"><ChatBubbleLeftEllipsisIcon />The Specific Question Analysed</h3>
                                <div className="p-5 text-base border border-cyan-600/50 rounded-xl bg-cyan-900/20 text-cyan-100 font-medium shadow-inner">
                                    {/* This now uses resultsData.query which the API provides */}
                                    {resultsData.query || "No specific question was recorded for this analysis."}
                                </div>
                                {/* Optional: Display Follow-up Q&A if present and valid */}
                                {Array.isArray(resultsData.followUpResponses) && resultsData.followUpResponses.length > 0 && resultsData.followUpResponses.some(f => f?.answer) && (
                                    <div className="mt-6">
                                        <h4 className="text-base font-semibold text-slate-200 mb-3">Follow-up Answers:</h4>
                                        <div className="space-y-3 text-sm">
                                            {resultsData.followUpResponses.filter(f => f?.answer).map((f, index) => (
                                                <div key={index} className="p-3 border border-slate-600/40 rounded-lg bg-slate-700/20">
                                                    <p className="font-medium text-slate-300 mb-1">Q: {f.question}</p>
                                                    <p className="text-slate-400 whitespace-pre-wrap">A: {f.answer}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* --- REMOVED Paraphrase Section --- */}

                            {/* Verdict Section */}
                            {/* MODIFIED: Check cleanedSummary instead of resultsData.summary */}
                            {cleanedSummary && !cleanedSummary.startsWith("[") && (
                                <div className="border-t border-slate-700/40 pt-10 md:pt-12">
                                    <h2 className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-cyan-400 mb-6 text-center tracking-tight">The Quick Verdict</h2>
                                    <div className="bg-white text-slate-900 rounded-xl p-6 shadow-lg max-w-3xl mx-auto border border-slate-300">
                                        {/* MODIFIED: Use verdictParts derived from cleanedSummary */}
                                        {verdictParts ? (
                                            <div>
                                                {/* Display extracted headline */}
                                                <div className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold p-3 rounded-lg mb-4 shadow-md">
                                                    <MarkdownRenderer content={verdictParts.headline} className="prose-sm prose-strong:text-white prose-p:text-white" isDark={true} />
                                                </div>
                                                {/* Render text after headline if any */}
                                                {verdictParts.after && (
                                                     <MarkdownRenderer content={verdictParts.after} className="prose-sm" isDark={false} />
                                                )}
                                            </div>
                                        ) : (
                                            // Fallback: Render the whole cleaned summary if parts couldn't be extracted (e.g., empty after cleaning)
                                            <MarkdownRenderer content={cleanedSummary} className="prose-sm" isDark={false} />
                                        )}
                                    </div>
                                </div>
                            )}
                            {/* MODIFIED: Check original summary for error indicator, but show generic message */}
                            {resultsData?.summary && resultsData.summary.startsWith("[") && ( <div className="max-w-3xl mx-auto"> <Alert type="warning" title="Verdict Issue" message="Could not generate the final verdict summary." /> </div> )}

                            {/* Detailed Perspectives Section */}
                            {Array.isArray(resultsData.responses) && resultsData.responses.some(r => r?.response && !r.response.startsWith("[")) && (
                                <div className="border-t border-slate-700/40 pt-10 md:pt-12">
                                    <h2 className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-cyan-400 mb-8 text-center tracking-tight">Detailed Analysis Perspectives</h2>
                                    {/* Persona Selection Buttons */}
                                    <div className="flex justify-center flex-wrap gap-3 sm:gap-4 mb-10 border-b border-slate-700/40 pb-6">
                                         {resultsData.responses.map((r) => ( r?.response && !r.response.startsWith("[") && <button key={r.persona} onClick={() => handleSelectPersona(r.persona)} className={`px-5 py-2 text-sm font-medium rounded-full transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-slate-800 whitespace-nowrap transform hover:scale-103 active:scale-100 ${ selectedPersona === r.persona ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg ring-2 ring-offset-1 ring-cyan-400 scale-105' : 'text-slate-200 bg-slate-700/40 hover:bg-slate-600/60 border border-slate-600/60' }`} > {r.persona.split('(')[0].trim()} </button> ))}
                                     </div>
                                    {/* Detailed View & Follow-up Area */}
                                    <div ref={detailViewRef} className={`transition-opacity duration-300 ease-in-out ${isSwitchingPersona ? 'opacity-30' : 'opacity-100'}`} >
                                        {selectedResponse && !selectedResponse.response.startsWith("[") && (
                                            <div key={selectedPersona} className="bg-white text-slate-900 rounded-2xl p-6 md:p-8 shadow-xl border border-slate-300 max-w-3xl mx-auto animate-fadeIn mb-10">
                                                <h3 className="text-xl font-semibold text-slate-800 mb-5">
                                                    {selectedResponse.persona}
                                                </h3>
                                                <div className="text-[15px] leading-relaxed space-y-4">
                                                    {/* Uses the updated cleanResponseText function */}
                                                    <MarkdownRenderer content={cleanResponseText(selectedResponse.response)} isDark={false} />
                                                </div>

                                                {/* --- Follow-up Section --- */}
                                                <div className="mt-8 pt-6 border-t border-slate-200">
                                                    {/* Show "Start Follow-up" button ONLY if no follow-up is active */}
                                                    {followUpPersonaId === null && (
                                                        <button
                                                            onClick={() => handleStartFollowUp(selectedResponse.persona)}
                                                            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-cyan-600 to-blue-700 border border-transparent rounded-md shadow-sm hover:from-cyan-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 focus:ring-offset-white"
                                                        >
                                                            <ChatBubbleOvalLeftEllipsisIcon /> Ask follow-up with {selectedResponse.persona.split('(')[0].trim()}
                                                        </button>
                                                    )}

                                                    {/* Show Follow-up UI ONLY if this persona is selected for follow-up */}
                                                    {followUpPersonaId === selectedResponse.persona && (
                                                        <div className="space-y-6">
                                                            <h4 className="text-lg font-semibold text-slate-700">Continue conversation with {followUpPersonaId.split('(')[0].trim()}:</h4>

                                                            {/* Conversation History */}
                                                            <div className="space-y-4 max-h-96 overflow-y-auto pr-2 bg-slate-50 p-4 rounded-lg border border-slate-200">
                                                                {followUpConversation.map((item, index) => (
                                                                    <div key={index} className="text-sm">
                                                                        <p className="font-semibold text-slate-600 mb-1">You:</p>
                                                                        <p className="mb-3 text-slate-800 whitespace-pre-wrap">{item.question}</p>
                                                                        <p className="font-semibold text-cyan-700 mb-1">{followUpPersonaId.split('(')[0].trim()}:</p>
                                                                        <div className="text-slate-800">
                                                                            <MarkdownRenderer content={item.answer} isDark={false} className="prose-sm" />
                                                                        </div>
                                                                        {index < followUpConversation.length - 1 && <hr className="my-4 border-slate-200" />}
                                                                    </div>
                                                                ))}
                                                                {/* Display loading indicator during API call */}
                                                                {isFollowUpLoading && (
                                                                    <div className="flex items-center justify-center p-3 text-slate-500">
                                                                        <LoadingSpinner className="h-4 w-4 mr-2 text-cyan-600" />
                                                                        <span>Getting response...</span>
                                                                    </div>
                                                                )}
                                                                {/* Display error message if API call failed */}
                                                                {followUpError && (
                                                                    <div className="mt-3">
                                                                        <Alert type="error" title="Follow-up Error" message={followUpError} />
                                                                    </div>
                                                                )}
                                                                {/* Invisible element to scroll to */}
                                                                <div ref={followUpEndRef} />
                                                            </div>

                                                            {/* Follow-up Input Form */}
                                                            <form onSubmit={handleSendFollowUp} className="flex items-start space-x-3">
                                                                <textarea
                                                                    value={followUpQuestion}
                                                                    onChange={(e) => setFollowUpQuestion(e.target.value)}
                                                                    placeholder={`Ask ${followUpPersonaId.split('(')[0].trim()} another question...`}
                                                                    rows="3"
                                                                    className="flex-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm p-2 resize-none disabled:opacity-50 disabled:bg-slate-100"
                                                                    disabled={isFollowUpLoading}
                                                                    required
                                                                />
                                                                <button
                                                                    type="submit"
                                                                    className="inline-flex items-center justify-center px-4 py-2 h-[calc(3*1.5rem+1rem)] border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                                                    disabled={isFollowUpLoading || !followUpQuestion.trim()}
                                                                >
                                                                    {isFollowUpLoading ? <LoadingSpinner className="h-5 w-5" /> : <PaperAirplaneIcon />}
                                                                    <span className="sr-only">Send</span>
                                                                </button>
                                                            </form>
                                                        </div>
                                                    )}
                                                </div>
                                                {/* --- End Follow-up Section --- */}

                                            </div>
                                        )}
                                         {!selectedResponse && Array.isArray(resultsData.responses) && resultsData.responses.some(r => r?.response && !r.response.startsWith("[")) && ( <div className="text-center text-slate-500 italic mt-4">Select a perspective above to view details.</div> )}
                                     </div>
                                </div>
                            )}
                            {/* Fallback message */}
                            {/* MODIFIED: Check cleanedSummary existence */}
                            {!cleanedSummary && (!Array.isArray(resultsData.responses) || !resultsData.responses.some(r => r?.response && !r.response.startsWith("["))) && ( <div className="text-center text-slate-400 py-10"> No analysis could be generated for this input. </div> )}

                            {/* --- ADDED CALL TO ACTION --- */}
                            <div className="text-center border-t border-slate-700/40 pt-10 md:pt-12">
                                <h3 className="text-xl font-semibold text-slate-100 mb-4">Want to analyse your own situation?</h3>
                                <Link href="/" legacyBehavior>
                                    <a className="inline-flex items-center justify-center px-8 py-3 text-base font-medium text-white bg-gradient-to-r from-cyan-500 to-blue-600 border border-transparent rounded-full shadow-lg hover:from-cyan-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 focus:ring-offset-slate-800 transform transition hover:scale-105">
                                        Try the AI Analyser Now
                                        <ArrowRightIcon />
                                    </a>
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            </div>
             <footer className="text-center mt-16 text-slate-500 text-sm px-4"> © {new Date().getFullYear()} Am I Being Unreasonable?™ | AI Analysis Tool | For informational purposes only. Use results critically. </footer>
             <style jsx global>{` @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } } .animate-fadeIn { animation: fadeIn 0.4s ease-out forwards; } @keyframes gradient-background { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } } .animate-gradient-bg { background-size: 200% 200%; animation: gradient-background 25s ease infinite; } `}</style>
        </main>
    );
}