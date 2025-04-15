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
                {content || ""}
            </ReactMarkdown>
        </div>
    );
};

const IconWrapper = ({ children }) => <span className="inline-block mr-2 text-slate-400 align-middle">{children}</span>;
const DocumentTextIcon = () => <IconWrapper><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg></IconWrapper>;
const ChatBubbleLeftEllipsisIcon = () => <IconWrapper><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-3.03 8.25-6.75 8.25a9.753 9.753 0 0 1-4.75-1.195A9.753 9.753 0 0 1 3 12c0-4.556 3.03-8.25 6.75-8.25a9.753 9.753 0 0 1 4.75 1.195A9.753 9.753 0 0 1 21 12Z" /></svg></IconWrapper>;
const SparklesIcon = ({className="w-5 h-5 inline-block align-middle"}) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L1.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" /></svg>;
const ArrowRightIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 ml-1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" /></svg>;


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

    // Ensure resultsData and resultsData.responses exist before finding
    const selectedResponse = (resultsData && Array.isArray(resultsData.responses))
        ? resultsData.responses.find(r => r?.persona === selectedPersona)
        : null;

    // --- Render Logic ---
    return (
        <main className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black py-12 sm:py-16 px-4 sm:px-6 lg:px-8 font-sans antialiased text-slate-300 animate-gradient-bg">
            <div className="max-w-5xl mx-auto bg-slate-800/60 backdrop-blur-lg shadow-2xl rounded-3xl overflow-hidden border border-slate-700/60">
                <div className="bg-gradient-to-r from-slate-900/80 via-gray-900/70 to-slate-800/80 backdrop-blur-sm pt-6 sm:pt-8 pb-8 sm:pb-10 px-10 sm:px-12 text-center shadow-lg border-b border-slate-700/40">
                   {/* --- UPDATED TITLE --- */}
                   <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-cyan-400 tracking-tight pb-2">AI Reasonableness Analysis</h1>
                   {/* --- ADDED EXPLAINER --- */}
                   <p className="text-sm text-slate-400 mt-2 max-w-2xl mx-auto">
                       Someone used the "Am I Being Unreasonable?" AI tool to analyze a situation. Here are the results:
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
                                <h3 className="text-lg font-semibold text-slate-100 mt-8 mb-4 flex items-center"><ChatBubbleLeftEllipsisIcon />The Specific Question Analyzed</h3>
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
                            {/* {resultsData.paraphrase && !resultsData.paraphrase.startsWith("[") && ( <div className="max-w-3xl mx-auto text-center"> <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">Situation Summary</h3> <blockquote className="text-base italic text-slate-800 bg-slate-100 p-4 rounded-lg border border-slate-300 shadow"> "{resultsData.paraphrase}" </blockquote> </div> )} */}
                            {/* {resultsData.paraphrase && resultsData.paraphrase.startsWith("[") && ( <div className="max-w-3xl mx-auto"> <Alert type="warning" title="Context Summary Issue" message="Could not generate situation summary." /> </div> )} */}

                            {/* Verdict Section */}
                            {resultsData.summary && !resultsData.summary.startsWith("[") && (
                                <div className="border-t border-slate-700/40 pt-10 md:pt-12">
                                    <h2 className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-cyan-400 mb-6 text-center tracking-tight">The Quick Verdict</h2>
                                    <div className="bg-white text-slate-900 rounded-xl p-6 shadow-lg max-w-3xl mx-auto border border-slate-300">
                                        {resultsData.summary.match(/^\s*\*\*\s*verdict\s*:/i) || resultsData.summary.match(/^\s*verdict\s*:/i) || resultsData.summary.match(/^\s*\*\*\s*(you('re| are) (not )?being unreasonable|aita|aibu|wibta)/i) || resultsData.summary.match(/^\s*(you('re| are) (not )?being unreasonable)/i) ? (
                                            <div>
                                                <div className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold p-3 rounded-lg mb-4 shadow-md">
                                                    {resultsData.summary.split(/\n\n/)[0].replace(/\*\*/g, '')}
                                                </div>
                                                <MarkdownRenderer
                                                    content={resultsData.summary.split(/\n\n/).slice(1).join('\n\n')}
                                                    className="prose-sm"
                                                    isDark={false}
                                                />
                                            </div>
                                        ) : (
                                            <MarkdownRenderer content={resultsData.summary} className="prose-sm" isDark={false} />
                                        )}
                                    </div>
                                </div>
                            )}
                            {resultsData.summary && resultsData.summary.startsWith("[") && ( <div className="max-w-3xl mx-auto"> <Alert type="warning" title="Verdict Issue" message="Could not generate the final verdict summary." /> </div> )}

                            {/* Detailed Perspectives Section */}
                            {Array.isArray(resultsData.responses) && resultsData.responses.some(r => r?.response && !r.response.startsWith("[")) && (
                                <div className="border-t border-slate-700/40 pt-10 md:pt-12">
                                    <h2 className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-cyan-400 mb-8 text-center tracking-tight">Detailed Analysis Perspectives</h2>
                                    <div className="flex justify-center flex-wrap gap-3 sm:gap-4 mb-10 border-b border-slate-700/40 pb-6">
                                         {resultsData.responses.map((r) => ( r?.response && !r.response.startsWith("[") && <button key={r.persona} onClick={() => handleSelectPersona(r.persona)} className={`px-5 py-2 text-sm font-medium rounded-full transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-slate-800 whitespace-nowrap transform hover:scale-103 active:scale-100 ${ selectedPersona === r.persona ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg ring-2 ring-offset-1 ring-cyan-400 scale-105' : 'text-slate-200 bg-slate-700/40 hover:bg-slate-600/60 border border-slate-600/60' }`} > {r.persona.split('(')[0].trim()} </button> ))}
                                     </div>
                                    <div ref={detailViewRef} className={`transition-opacity duration-300 ease-in-out ${isSwitchingPersona ? 'opacity-30' : 'opacity-100'}`} >
                                        {selectedResponse && !selectedResponse.response.startsWith("[") && (
                                            <div key={selectedPersona} className="bg-white text-slate-900 rounded-2xl p-6 md:p-8 shadow-xl border border-slate-300 max-w-3xl mx-auto animate-fadeIn mb-10">
                                                <h3 className="text-xl font-semibold text-slate-800 mb-5">
                                                    {selectedResponse.persona}
                                                </h3>
                                                <div className="text-[15px] leading-relaxed space-y-4">
                                                    <MarkdownRenderer content={selectedResponse.response} isDark={false} />
                                                </div>
                                            </div>
                                        )}
                                         {!selectedResponse && Array.isArray(resultsData.responses) && resultsData.responses.some(r => r?.response && !r.response.startsWith("[")) && ( <div className="text-center text-slate-500 italic mt-4">Select a perspective above to view details.</div> )}
                                     </div>
                                </div>
                            )}
                            {/* Fallback message */}
                            {!resultsData.summary && (!Array.isArray(resultsData.responses) || !resultsData.responses.some(r => r?.response && !r.response.startsWith("["))) && ( <div className="text-center text-slate-400 py-10"> No analysis could be generated for this input. </div> )}

                            {/* --- ADDED CALL TO ACTION --- */}
                            <div className="text-center border-t border-slate-700/40 pt-10 md:pt-12">
                                <h3 className="text-xl font-semibold text-slate-100 mb-4">Want to analyze your own situation?</h3>
                                <Link href="/" legacyBehavior>
                                    <a className="inline-flex items-center justify-center px-8 py-3 text-base font-medium text-white bg-gradient-to-r from-cyan-500 to-blue-600 border border-transparent rounded-full shadow-lg hover:from-cyan-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 focus:ring-offset-slate-800 transform transition hover:scale-105">
                                        Try the AI Analyzer Now
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