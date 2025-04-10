"use client";
import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';

// --- Components ---

const LoadingSpinner = () => (
    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

// Alert component - Modified to render plain text error message
const Alert = ({ type = 'error', title, message }) => {
    const colors = {
        error: 'bg-red-900/40 border-red-600/70 text-red-200',
        warning: 'bg-yellow-900/40 border-yellow-600/70 text-yellow-200',
    };
    const displayMessage = typeof message === 'string' && message.trim() !== '' ? message : "An unspecified error occurred or no details were provided.";
    return (
        <div className={`border-l-4 p-4 rounded-lg shadow-sm ${colors[type]}`} role="alert">
            {title && <p className="font-bold mb-1">{title}</p>}
            <p>{displayMessage}</p> {/* Render message directly */}
        </div>
    );
};

// --- MarkdownRenderer (Handles light/dark text based on isDark prop) ---
const MarkdownRenderer = ({ content, className = "", isDark = false }) => {
    const baseProseClass = "prose prose-sm max-w-none";
    // Theme selection based on isDark prop
    const themeProseClass = isDark ? "prose-invert" : ""; // prose-invert for dark bg, default for light bg
    // Specific text styling adjustments based on theme
    const textStyles = isDark
        ? "prose-p:text-slate-200 prose-strong:text-white prose-a:text-cyan-400 hover:prose-a:text-cyan-300 prose-blockquote:text-slate-300 prose-blockquote:border-slate-600 prose-code:text-pink-300 prose-headings:text-slate-100 prose-ul:text-slate-200 prose-ol:text-slate-200 prose-li:text-slate-200" // Styles for DARK background
        : "prose-p:text-slate-700 prose-strong:text-slate-900 prose-a:text-cyan-600 hover:prose-a:text-cyan-500 prose-blockquote:text-slate-600 prose-blockquote:border-slate-400 prose-code:text-pink-700 prose-headings:text-slate-800 prose-ul:text-slate-700 prose-ol:text-slate-700 prose-li:text-slate-700"; // Styles for LIGHT background

    return (
        // Apply base, theme, specific text styles, and any additional className
        <div className={`${baseProseClass} ${themeProseClass} ${textStyles} ${className}`}>
            <ReactMarkdown
                components={{ // Standard HTML tag overrides for styling
                    p: ({ node, ...props }) => <p className="mb-3 last:mb-0" {...props} />,
                    strong: ({ node, ...props }) => <strong className="font-semibold" {...props} />,
                    ul: ({ node, ...props }) => <ul className="list-disc list-inside mb-3 pl-1" {...props} />,
                    ol: ({ node, ...props }) => <ol className="list-decimal list-inside mb-3 pl-1" {...props} />,
                    li: ({ node, ...props }) => <li className="mb-1" {...props} />,
                    a: ({ node, ...props }) => <a className="font-medium underline" {...props} />,
                    blockquote: ({ node, ...props }) => <blockquote className="italic border-l-4 pl-4 my-4" {...props} />, // Border color handled by prose-blockquote:border-* in textStyles
                    code: ({ node, ...props }) => <code className={`px-1 py-0.5 rounded text-sm ${isDark ? 'bg-black/20' : 'bg-slate-200'}`} {...props} />, // Code bg depends on theme
                }}
            >
                {content || ""}
            </ReactMarkdown>
        </div>
    );
};

// --- LoadingScreen (Unchanged from v5.4) ---
const LoadingScreen = ({ isApiComplete, isTakingLong }) => {
    const regularLoadingMessages = [ "Recalibrating the Pompomposity Filter...", "Engaging the Sarcasm Subroutines...", "Cross-referencing with Beano annuals...", "Asking Jeeves (Legacy Mode)...", "Determining Correct Queueing Etiquette...", "Putting the kettle on (Priority Override)...", "Calculating Passive-Aggression Vectors...", "Deploying Stiff Upper Lip Algorithm...", "Checking for Appropriate Biscuit Selection...", "Reticulating Splines... with irony...", "Analysing Underlying Banter Potential...", "Running Diagnostic on the Reasonableness Engine...", "Buffering... Please hold the line...", "Optimising for Maximum Objectivity (and tea)...", "Purging Unnecessary Pleasantries...", "Compiling Strategic Tuts...", "Ensuring Proper Use of 'Right then'...", "Interrogating pixels for hidden meanings...", "Deploying swarm of nano-analysts...", "Consulting the Oracle (she's on tea break)...", "Running situation through 10,000 simulations...", "Checking for quantum entanglement in arguments...", "Asking a panel of 1,000 stoic philosophers...", "Applying Occam's Razor... and then adding complications...", "Measuring passive-aggression with lasers...", "Fact-checking your inner monologue...", "Triangulating emotional trajectories...", "Engaging the Department of Common Sense...", "Re-routing neural pathways for objectivity...", "Filtering out hyperbole...", "Polishing the Scales of Reasonableness...", "Initiating deep-contextual dive...", "Sequencing the argument genome...", "Translating subtext into plain English...", "Defragging emotional baggage...", "Booting up the Judgementatron 5000...", "Asking 'What would a sensible person do?'...", "Cross-examining underlying motives...", "Checking tea levels for optimal analysis...", "Scanning for logical fallacies (found some!)...", "Inflating the strategic thinking cap...", "Consulting ancient reasonableness scrolls...", "Warming up the perspective engine...", "Synchronising watches for action plan...", "Ensuring impartiality protocols are active...", "Running final sanity check...", "Preparing brutally honest assessment...", "Distilling wisdom from the chaos...", "Just double-checking the kettle *is* off..." ];
    const longLoadingMessages = [ "Blimey, this is a tricky one! Rerouting through extra processors...", "Your situation's complexity requires advanced tea-leaf consultation...", "Deep thought required... Did you mention existential dread?", "Engaging the 'Are You *Sure*?' sub-system...", "Wow, deploying the heavy-duty analysis engine for this!", "Compiling extra sarcasm... I mean, *strategy*...", "This is taking longer than explaining offside. Bear with.", "Please wait, converting emotional nuance into binary...", "Hold on, asking the AI if *it* needs a therapist after this...", "Calculating reasonableness... results may vary based on biscuit availability.", ];
    const [loadingText, setLoadingText] = useState("Initiating analysis...");
    const [progress, setProgress] = useState(0);
    const progressIntervalRef = useRef(null);
    const textIntervalRef = useRef(null);

    useEffect(() => {
        setProgress(0);
        const startProgressSimulation = () => {
            if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
            progressIntervalRef.current = setInterval(() => {
                setProgress(prev => {
                    if (prev >= 95) { clearInterval(progressIntervalRef.current); return 95; }
                    return Math.min(prev + 1, 95);
                });
            }, 200);
        };
        if (isApiComplete) {
            if (progressIntervalRef.current) clearInterval(progressIntervalRef.current); setProgress(100);
        } else if (isTakingLong) {
             if (progressIntervalRef.current) clearInterval(progressIntervalRef.current); setProgress(prev => Math.max(prev, 90));
        } else { startProgressSimulation(); }
        return () => { if (progressIntervalRef.current) clearInterval(progressIntervalRef.current); };
    }, [isApiComplete, isTakingLong]);

    useEffect(() => {
        if (textIntervalRef.current) clearInterval(textIntervalRef.current);
        if (isTakingLong) {
            let longMsgIndex = 0; setLoadingText(longLoadingMessages[longMsgIndex]);
            textIntervalRef.current = setInterval(() => { longMsgIndex = (longMsgIndex + 1) % longLoadingMessages.length; setLoadingText(longLoadingMessages[longMsgIndex]); }, 4000);
        } else {
             let regularMsgIndex = Math.floor(Math.random() * regularLoadingMessages.length); setLoadingText(regularLoadingMessages[regularMsgIndex]);
             textIntervalRef.current = setInterval(() => { regularMsgIndex = Math.floor(Math.random() * regularLoadingMessages.length); setLoadingText(regularLoadingMessages[regularMsgIndex]); }, 3500);
        }
        return () => { if (textIntervalRef.current) clearInterval(textIntervalRef.current); };
    }, [isTakingLong]);

    return ( <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-black to-slate-800 z-50 flex flex-col items-center justify-center p-8 text-center overflow-hidden"> <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-black to-indigo-900 animate-gradient-xy opacity-80"></div> <div className="relative z-10 flex flex-col items-center justify-center w-full max-w-md"> <svg className="animate-spin h-12 w-12 text-cyan-400 mb-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> <h2 className="text-3xl font-bold text-white mb-4 tracking-tight">Analysing Your Situation...</h2> <div className="w-full bg-slate-700 rounded-full h-2.5 mb-6 overflow-hidden"> <div className={`bg-gradient-to-r from-cyan-400 to-blue-500 h-2.5 rounded-full ${progress < 100 ? 'transition-all duration-200 ease-linear' : 'transition-width duration-300 ease-out'} ${isTakingLong && !isApiComplete ? 'animate-pulse-bar' : ''}`} style={{ width: `${progress}%` }} ></div> </div> <p className="text-lg text-slate-400 transition-opacity duration-500 ease-in-out h-12">{loadingText}</p> </div> </div> );
};


const IconWrapper = ({ children }) => <span className="inline-block mr-2 text-slate-400">{children}</span>;
const DocumentTextIcon = () => <IconWrapper><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg></IconWrapper>;
const ChatBubbleLeftEllipsisIcon = () => <IconWrapper><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-3.03 8.25-6.75 8.25a9.753 9.753 0 0 1-4.75-1.195A9.753 9.753 0 0 1 3 12c0-4.556 3.03-8.25 6.75-8.25a9.753 9.753 0 0 1 4.75 1.195A9.753 9.753 0 0 1 21 12Z" /></svg></IconWrapper>;
const SparklesIcon = ({className="w-5 h-5 inline-block"}) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L1.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" /></svg>;


// --- Main Page Component ---
export default function Home() {
    // State management
    const [context, setContext] = useState('');
    const [query, setQuery] = useState('');
    const [responses, setResponses] = useState([]);
    const [summary, setSummary] = useState('');
    const [paraphrase, setParaphrase] = useState('');
    const [error, setError] = useState(null); // Use null for no error
    const [view, setView] = useState('input');
    const [loading, setLoading] = useState(false);
    const [hasAnalyzed, setHasAnalyzed] = useState(false);
    const [selectedPersona, setSelectedPersona] = useState(null);
    const [isSwitchingPersona, setIsSwitchingPersona] = useState(false);
    const [isApiComplete, setIsApiComplete] = useState(false);
    const [isTakingLong, setIsTakingLong] = useState(false);
    const longLoadTimeoutRef = useRef(null);
    const detailViewRef = useRef(null);

    console.log(`Current view state: ${view}`);

    // --- askAI function (v5.4 logic with frontend trim safety) ---
    const askAI = async () => {
        console.log("askAI triggered");
        if (!context.trim() || context.trim().length < 10) { setError("Context needed (min 10 chars)."); return; }
        if (!query.trim() || query.trim().length < 5) { setError("Question needed (min 5 chars)."); return; }

        console.log("Resetting states...");
        setError(null); setResponses([]); setSummary(''); setParaphrase(''); setSelectedPersona(null);
        setIsApiComplete(false); setIsTakingLong(false); setLoading(true); setView('loading');
        console.log("State set to 'loading'");

        if (longLoadTimeoutRef.current) clearTimeout(longLoadTimeoutRef.current);
        const LONG_LOAD_THRESHOLD = 22000;
        longLoadTimeoutRef.current = setTimeout(() => { console.log("Long load threshold reached"); setIsTakingLong(true); }, LONG_LOAD_THRESHOLD);

        let apiError = null; let apiData = null;
        try {
            console.log("Sending request to API...");
            const res = await fetch('/api/getResponses', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ context, query }) });
            clearTimeout(longLoadTimeoutRef.current); console.log(`API response status: ${res.status}`);
            if (!res.ok) {
                 const errorText = await res.text(); console.error(`API HTTP Error ${res.status}:`, errorText);
                 let detail = errorText; try { const jsonError = JSON.parse(errorText); detail = jsonError.error || errorText; } catch (parseErr) { /* ignore */ }
                 throw new Error(`Server error: ${res.status} ${res.statusText || ''}. ${String(detail).substring(0, 100)}`);
            }
            apiData = await res.json(); console.log("API response data received:", apiData);
            const receivedResponses = Array.isArray(apiData.responses) ? apiData.responses : [];
            const receivedSummary = typeof apiData.summary === 'string' ? apiData.summary : '';
            const receivedParaphrase = typeof apiData.paraphrase === 'string' ? apiData.paraphrase : '';
            console.log("Setting response states...");
            setResponses(receivedResponses); setSummary(receivedSummary.trim()); setParaphrase(receivedParaphrase.trim());
            if (apiData.error) { apiError = apiData.error; console.warn("API returned application error in JSON:", apiData.error); }
            if (receivedResponses.length > 0 && !apiError) {
                const analystResponse = receivedResponses.find(r => r.persona?.includes("Analyst") && r.response && !r.response.startsWith("["));
                const firstValidResponse = receivedResponses.find(r => r.response && !r.response.startsWith("["));
                const defaultPersona = analystResponse ? analystResponse.persona : (firstValidResponse ? firstValidResponse.persona : null);
                if (defaultPersona) { setSelectedPersona(defaultPersona); console.log(`Setting default persona to: ${defaultPersona}`); }
                else { console.log("No valid responses found to set a default persona."); if (!apiError) { apiError = "Analysis completed, but no valid perspectives could be generated."; console.warn(apiError); } }
            } else if (!apiError && res.ok && receivedResponses.length === 0) { apiError = "Analysis completed, but no perspectives could be generated."; console.warn(apiError); }
        } catch (err) {
            clearTimeout(longLoadTimeoutRef.current); console.error("API Fetch/Processing error in try/catch:", err);
            apiError = err instanceof Error ? err.message : String(err); if (!apiError) apiError = "An unknown fetch error occurred.";
            setResponses([]); setSummary(''); setParaphrase(''); setSelectedPersona(null); console.log("States reset due to catch block error.");
        } finally {
            console.log("Entering finally block..."); setIsApiComplete(true); setError(typeof apiError === 'string' ? apiError : null);
            console.log(`Final error state set to: ${typeof apiError === 'string' ? apiError : null}`);
            setTimeout(() => { console.log("Setting loading=false, view='results'"); setLoading(false); setView('results'); setHasAnalyzed(true); }, 400);
        }
    };

    // --- handleRestart and handleSelectPersona (v5.4 logic) ---
    const handleRestart = () => { console.log("Restarting..."); setContext(''); setQuery(''); setResponses([]); setSummary(''); setParaphrase(''); setError(null); setSelectedPersona(null); setHasAnalyzed(false); setView('input'); setLoading(false); setIsApiComplete(false); setIsTakingLong(false); if (longLoadTimeoutRef.current) clearTimeout(longLoadTimeoutRef.current); window.scrollTo(0, 0); };
    const handleSelectPersona = (persona) => { console.log(`Selecting persona: ${persona}`); if (persona === selectedPersona || isSwitchingPersona) return; setIsSwitchingPersona(true); if (detailViewRef.current) { detailViewRef.current.classList.remove('animate-fadeIn'); void detailViewRef.current.offsetWidth; } setTimeout(() => { setSelectedPersona(persona); setTimeout(() => { setIsSwitchingPersona(false); requestAnimationFrame(() => { if (detailViewRef.current) { detailViewRef.current.classList.add('animate-fadeIn'); } }); }, 50); }, 150); };
    const selectedResponse = responses.find(r => r.persona === selectedPersona);

    // --- Render Logic ---
    return (
        // Main container: Dark gradient background
        <div className={`min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black py-12 sm:py-16 px-4 sm:px-6 lg:px-8 font-sans antialiased text-slate-300 animate-gradient-bg`}>
             {/* Loading overlay */}
             {view === 'loading' && <LoadingScreen isApiComplete={isApiComplete} isTakingLong={isTakingLong} />}

             {/* Main Content Box: Semi-transparent dark background */}
             <div className={`max-w-5xl mx-auto bg-slate-800/60 backdrop-blur-lg shadow-2xl rounded-3xl overflow-hidden border border-slate-700/60 transition-opacity duration-300 ease-in-out ${view === 'loading' ? 'opacity-0 invisible' : 'opacity-100 visible'}`}>
                {/* Header: Dark gradient, gradient text */}
                <div className="bg-gradient-to-r from-slate-900/80 via-gray-900/70 to-slate-800/80 backdrop-blur-sm p-10 sm:p-12 text-center shadow-lg border-b border-slate-700/40">
                   <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-cyan-400 tracking-tight pb-2">Am I Being Unreasonable?</h1>
                   <p className="mt-3 text-base sm:text-lg text-slate-400 max-w-2xl mx-auto">Confused by a situation? Get clarity and an objective perspective.</p>
                </div>

                {/* Input View */}
                {view === 'input' && (
                    <div className="p-8 sm:p-10 lg:p-12 space-y-8 animate-fadeIn">
                         <div>
                             {/* Input Label: Larger, brighter text */}
                             <label htmlFor="context-input" className="flex items-center text-lg font-semibold text-slate-100 mb-3"> {/* Increased size */}
                                <DocumentTextIcon />1. Describe the Situation (Context)
                             </label>
                             {/* Input Textarea: Light background, dark text */}
                             <textarea
                                id="context-input"
                                className="w-full p-4 text-base border border-slate-300 rounded-xl shadow-sm resize-vertical min-h-[200px] outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition duration-150 ease-in-out bg-slate-100 text-slate-900 placeholder-slate-500" // Light bg, dark text, adjusted placeholder
                                placeholder="Paste relevant chat logs or describe the events in detail..."
                                value={context}
                                onChange={(e) => setContext(e.target.value)}
                                rows={10}
                              />
                             <p className="text-xs text-slate-400 mt-2 pl-1">More detail provides more accurate analysis.</p>
                         </div>
                         <div>
                             {/* Input Label: Larger, brighter text */}
                              <label htmlFor="query-input" className="flex items-center text-lg font-semibold text-slate-100 mb-3"> {/* Increased size */}
                                 <ChatBubbleLeftEllipsisIcon/>2. What is Your Specific Question?
                              </label>
                              {/* Input Field: Light background, dark text */}
                             <input
                                 id="query-input"
                                 type="text"
                                 className="w-full p-4 text-base border border-slate-300 rounded-xl shadow-sm outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition duration-150 ease-in-out bg-slate-100 text-slate-900 placeholder-slate-500" // Light bg, dark text, adjusted placeholder
                                 placeholder="e.g., Am I wrong here?, Was my reaction unreasonable?"
                                 value={query}
                                 onChange={(e) => setQuery(e.target.value)}
                              />
                         </div>
                         {/* Error Display (Input view) */}
                         {error && view === 'input' && <div className="pt-2"><Alert type="error" title="Input Error" message={error} /></div>}
                          {/* Submit Button: Unchanged */}
                         <div className="text-center pt-6">
                             <button onClick={askAI} disabled={loading} className={`inline-flex items-center justify-center px-12 py-3.5 border border-transparent text-base font-semibold rounded-full shadow-lg text-white transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 focus:ring-offset-slate-800 transform hover:scale-105 active:scale-100 ${ loading ? 'bg-gray-500 cursor-not-allowed opacity-70' : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700'}`}>
                                {loading ? ( <> <LoadingSpinner /> <span className="ml-3">Analysing...</span> </> ) : ( <> <SparklesIcon className="w-5 h-5 mr-2"/> Get Objective Analysis</> )}
                             </button>
                         </div>
                    </div>
                )}

                 {/* Results View */}
                {view === 'results' && (
                    <div className="bg-transparent px-6 md:px-10 py-10 border-t border-slate-700/40">
                        {/* Error Display (Results view) */}
                        {error && ( <div className="mb-10 max-w-3xl mx-auto"> <Alert type={error.toLowerCase().includes("incomplete") || error.toLowerCase().includes("partially") || error.toLowerCase().includes("failed") || error.toLowerCase().includes("issue") || error.toLowerCase().includes("skipped") || error.toLowerCase().includes("generate") ? "warning" : "error"} title={error.toLowerCase().includes("incomplete") || error.toLowerCase().includes("partially") ? "Analysis Incomplete" : (error.toLowerCase().includes("failed") || error.toLowerCase().includes("issue") || error.toLowerCase().includes("generate") || error.toLowerCase().includes("skipped") ? "Analysis Issue" : "Error")} message={error} /> </div> )}

                        {/* Results Sections Container */}
                        {!error || (error && !error.toLowerCase().includes('service connection') && !error.toLowerCase().includes('invalid request') && !error.toLowerCase().includes('server configuration')) ? (
                             <div className='space-y-10 md:space-y-12'> {/* Add spacing between result sections */}
                                {/* Paraphrase Section: Light background, dark text */}
                                {paraphrase && !paraphrase.startsWith("[") && (
                                    <div className="max-w-3xl mx-auto text-center">
                                        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">Your Situation Summary</h3>
                                        {/* Light background, dark text */}
                                        <blockquote className="text-base italic text-slate-800 bg-slate-100 p-4 rounded-lg border border-slate-300 shadow">
                                             "{paraphrase}"
                                        </blockquote>
                                    </div>
                                )}
                                {/* Paraphrase Error Alert */}
                                {paraphrase && paraphrase.startsWith("[") && (!error || !error.toLowerCase().includes('paraphrase')) && ( <div className="max-w-3xl mx-auto"> <Alert type="warning" title="Context Summary Issue" message="Could not generate situation summary." /> </div> )}

                                {/* Verdict Section: Light background, dark text */}
                                {summary && !summary.startsWith("[") && (
                                    <div className="border-t border-slate-700/40 pt-10 md:pt-12">
                                        {/* Heading: Keep gradient style */}
                                        <h2 className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-cyan-400 mb-6 text-center tracking-tight">The Quick Verdict</h2>
                                        {/* Container: Light background */}
                                        <div className="bg-white text-slate-800 rounded-xl p-6 shadow-lg max-w-3xl mx-auto border border-slate-300">
                                            {/* Markdown: Pass isDark=false */}
                                            <MarkdownRenderer content={summary} className="prose-sm" isDark={false} />
                                        </div>
                                    </div>
                                 )}
                                 {/* Summary Error Alert */}
                                 {summary && summary.startsWith("[") && (!error || !error.toLowerCase().includes('summary')) && ( <div className="max-w-3xl mx-auto"> <Alert type="warning" title="Verdict Issue" message="Could not generate the final verdict summary." /> </div> )}

                                {/* Detailed Perspectives Section */}
                                {responses.some(r => r.response && !r.response.startsWith("[")) && (
                                    <div className="border-t border-slate-700/40 pt-10 md:pt-12">
                                         {/* Heading: Keep gradient style */}
                                        <h2 className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-cyan-400 mb-8 text-center tracking-tight">Detailed Analysis Perspectives</h2>
                                         {/* Persona Buttons: Unchanged styling */}
                                        <div className="flex justify-center flex-wrap gap-3 sm:gap-4 mb-10 border-b border-slate-700/40 pb-6">
                                             {responses.map((r) => ( r.response && !r.response.startsWith("[") && <button key={r.persona} onClick={() => handleSelectPersona(r.persona)} className={`px-5 py-2 text-sm font-medium rounded-full transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-slate-800 whitespace-nowrap transform hover:scale-103 active:scale-100 ${ selectedPersona === r.persona ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg ring-2 ring-offset-1 ring-cyan-400 scale-105' : 'text-slate-200 bg-slate-700/40 hover:bg-slate-600/60 border border-slate-600/60' }`} > {r.persona.split('(')[0].trim()} </button> ))}
                                         </div>
                                         {/* Selected Persona Detail View */}
                                        <div ref={detailViewRef} className={`transition-opacity duration-300 ease-in-out ${isSwitchingPersona ? 'opacity-30' : 'opacity-100'}`} >
                                            {selectedResponse && !selectedResponse.response.startsWith("[") && (
                                                // Container: Light background
                                                <div key={selectedPersona} className="bg-white rounded-2xl p-6 md:p-8 shadow-xl border border-slate-300 max-w-3xl mx-auto animate-fadeIn mb-10">
                                                    {/* Persona Title: Dark text */}
                                                    <h3 className="text-xl font-semibold text-slate-800 mb-5">
                                                        {selectedResponse.persona}
                                                    </h3>
                                                    {/* Markdown Content: Pass isDark=false */}
                                                    <div className="text-[15px] leading-relaxed space-y-4">
                                                        <MarkdownRenderer content={selectedResponse.response} isDark={false} />
                                                    </div>
                                                </div>
                                            )}
                                             {/* Prompt to select persona */}
                                             {!selectedResponse && responses.some(r => r.response && !r.response.startsWith("[")) && ( <div className="text-center text-slate-500 italic mt-4">Select a perspective above to view details.</div> )}
                                         </div>
                                    </div>
                                )}
                                {/* Fallback message */}
                                {!summary && !responses.some(r => r.response && !r.response.startsWith("[")) && !error && ( <div className="text-center text-slate-400 py-10"> No analysis could be generated for this input. Please try rephrasing your situation or question. </div> )}
                            </div> // End results sections container
                        ) : null /* Don't render results if critical error */}
                        {/* Restart Button: Unchanged */}
                        <div className="mt-12 text-center border-t border-slate-700/40 pt-10 md:pt-12">
                              <button onClick={handleRestart} className="inline-flex items-center justify-center px-10 py-3 border border-slate-600/60 text-base font-medium rounded-xl shadow-sm text-slate-200 bg-slate-700/40 hover:bg-slate-600/60 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 focus:ring-offset-slate-800 transition duration-150 ease-in-out transform hover:scale-103 active:scale-100" > Analyse Another Situation </button>
                        </div>
                    </div>
                )}
                 {/* Fallback for invalid view state */}
                 {view !== 'input' && view !== 'results' && view !== 'loading' && ( <div className="p-12 text-center text-red-400">Internal application error: Invalid view state.</div> )}
            </div>
             {/* Footer: Unchanged */}
             <footer className="text-center mt-16 text-slate-500 text-sm px-4"> © {new Date().getFullYear()} Am I Being Unreasonable?™ | AI Analysis Tool | For informational purposes only. Use results critically. </footer>
             {/* Global Styles: Unchanged */}
             <style jsx global>{` @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } } .animate-fadeIn { animation: fadeIn 0.4s ease-out forwards; } @keyframes gradient-xy { 0%, 100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } } .animate-gradient-xy { background-size: 300% 300%; animation: gradient-xy 18s ease infinite; } @keyframes gradient-background { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } } .animate-gradient-bg { background-size: 200% 200%; animation: gradient-background 25s ease infinite; } @keyframes pulse-bar { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } } .animate-pulse-bar { animation: pulse-bar 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite; } `}</style>
        </div>
    );
}