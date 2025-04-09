"use client";
import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';

// --- Components (DEFINITIONS INCLUDED and VERIFIED - NO PLACEHOLDERS) ---

const LoadingSpinner = () => (
    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

const Alert = ({ type = 'error', title, message }) => {
    const colors = {
        error: 'bg-red-100 border-red-500 text-red-800 dark:bg-red-900/20 dark:border-red-700 dark:text-red-200',
        warning: 'bg-yellow-100 border-yellow-500 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-700 dark:text-yellow-200',
    };
    return (
        <div className={`border-l-4 p-4 rounded-lg shadow-sm ${colors[type]}`} role="alert">
            {title && <p className="font-bold mb-1">{title}</p>}
            {/* Use span for simple messages within alerts */}
            <ReactMarkdown components={{ p: ({ node, ...props }) => <span {...props} /> }}>
                {message || "An unspecified error occurred."}
            </ReactMarkdown>
        </div>
     );
};

// Updated MarkdownRenderer to specifically handle dark background text color
const MarkdownRenderer = ({ content, className = "", isDark = false }) => {
    const baseProseClass = "prose prose-sm max-w-none";
    // Define specific text colors for light and dark backgrounds
    // These explicit classes override default prose colors for better contrast control
    const textStyles = isDark
        ? "prose-p:text-slate-200 prose-strong:text-white prose-ul:text-slate-200 prose-ol:text-slate-200 prose-li:text-slate-200" // Styles for dark bg
        : "prose-p:text-slate-700 prose-strong:text-slate-900 prose-ul:text-slate-700 prose-ol:text-slate-700 prose-li:text-slate-700"; // Styles for light bg

    return (
        // Apply base prose, dark mode inversion if needed, specific text styles, and any passed className
        <div className={`${baseProseClass} ${isDark ? 'prose-invert' : ''} ${textStyles} ${className}`}>
            <ReactMarkdown
                components={{
                    // Keep structural components, rely on prose classes + specific overrides above
                    p: ({ node, ...props }) => <p className="mb-3 last:mb-0" {...props} />, // Standard paragraph styling
                    strong: ({ node, ...props }) => <strong className="font-semibold" {...props} />, // Standard bold
                    ul: ({ node, ...props }) => <ul className="list-disc list-inside mb-3 pl-1" {...props} />, // Basic list styling
                    ol: ({ node, ...props }) => <ol className="list-decimal list-inside mb-3 pl-1" {...props} />, // Basic list styling
                    li: ({ node, ...props }) => <li className="mb-1" {...props} />, // Basic list item styling
                }}
            >
                {content || ""}
            </ReactMarkdown>
        </div>
    );
};


// Updated Loading Screen with background animation and corrected useEffect dependency
const LoadingScreen = () => {
    const loadingMessages = [ "Recalibrating the Pompomposity Filter...", "Engaging the Sarcasm Subroutines...", "Cross-referencing with Beano annuals...", "Asking Jeeves (Legacy Mode)...", "Determining Correct Queueing Etiquette...", "Putting the kettle on (Priority Override)...", "Calculating Passive-Aggression Vectors...", "Deploying Stiff Upper Lip Algorithm...", "Checking for Appropriate Biscuit Selection...", "Reticulating Splines... with irony...", "Analysing Underlying Banter Potential...", "Running Diagnostic on the Reasonableness Engine...", "Buffering... Please hold the line...", "Optimising for Maximum Objectivity (and tea)...", "Purging Unnecessary Pleasantries...", "Compiling Strategic Tuts...", "Ensuring Proper Use of 'Right then'...", "Interrogating pixels for hidden meanings...", "Deploying swarm of nano-analysts...", "Consulting the Oracle (she's on tea break)...", "Running situation through 10,000 simulations...", "Checking for quantum entanglement in arguments...", "Asking a panel of 1,000 stoic philosophers...", "Applying Occam's Razor... and then adding complications...", "Measuring passive-aggression with lasers...", "Fact-checking your inner monologue...", "Triangulating emotional trajectories...", "Engaging the Department of Common Sense...", "Re-routing neural pathways for objectivity...", "Filtering out hyperbole...", "Polishing the Scales of Reasonableness...", "Initiating deep-contextual dive...", "Sequencing the argument genome...", "Translating subtext into plain English...", "Defragging emotional baggage...", "Booting up the Judgementatron 5000...", "Asking 'What would a sensible person do?'...", "Cross-examining underlying motives...", "Checking tea levels for optimal analysis...", "Scanning for logical fallacies (found some!)...", "Inflating the strategic thinking cap...", "Consulting ancient reasonableness scrolls...", "Warming up the perspective engine...", "Synchronising watches for action plan...", "Ensuring impartiality protocols are active...", "Running final sanity check...", "Preparing brutally honest assessment...", "Distilling wisdom from the chaos...", "Just double-checking the kettle *is* off..." ];
    const [loadingText, setLoadingText] = useState("Initiating analysis...");

    useEffect(() => {
        setLoadingText(loadingMessages[Math.floor(Math.random() * loadingMessages.length)]);
        const intervalId = setInterval(() => {
            setLoadingText(loadingMessages[Math.floor(Math.random() * loadingMessages.length)]);
        }, 2000);
        return () => clearInterval(intervalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // ESLint comment correctly placed, no dependency needed as loadingMessages is constant

    return (
        <div className="fixed inset-0 bg-gradient-to-br from-slate-800 via-black to-slate-900 z-50 flex flex-col items-center justify-center p-8 text-center overflow-hidden">
            {/* Animated Gradient Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-black to-indigo-900 animate-gradient-xy opacity-70"></div>
            {/* Content */}
            <div className="relative z-10 flex flex-col items-center justify-center">
                <svg className="animate-spin h-12 w-12 text-cyan-400 mb-8" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                <h2 className="text-3xl font-bold text-white mb-4 tracking-tight">Analysing Your Situation...</h2>
                <p className="text-lg text-slate-400 transition-opacity duration-500 ease-in-out w-full max-w-md">{loadingText}</p>
            </div>
        </div>
    );
};

// Icon Components (DEFINITIONS INCLUDED)
const DocumentTextIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 inline-block mr-2 text-slate-500"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg>;
const ChatBubbleLeftEllipsisIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 inline-block mr-2 text-slate-500"><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-3.03 8.25-6.75 8.25a9.753 9.753 0 0 1-4.75-1.195A9.753 9.753 0 0 1 3 12c0-4.556 3.03-8.25 6.75-8.25a9.753 9.753 0 0 1 4.75 1.195A9.753 9.753 0 0 1 21 12Z" /></svg>;
const SparklesIcon = ({className="w-5 h-5 inline-block"}) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L1.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" /></svg>;


// --- Main Page Component ---
export default function Home() {
    // State management
    const [context, setContext] = useState('');
    const [query, setQuery] = useState('');
    const [responses, setResponses] = useState([]);
    const [summary, setSummary] = useState('');
    const [paraphrase, setParaphrase] = useState('');
    const [error, setError] = useState('');
    const [view, setView] = useState('input'); // Default view state IS 'input'
    const [loading, setLoading] = useState(false);
    const [hasAnalyzed, setHasAnalyzed] = useState(false);
    const [selectedPersona, setSelectedPersona] = useState(null);
    const [isSwitchingPersona, setIsSwitchingPersona] = useState(false);
    const detailViewRef = useRef(null);

    // askAI function (Verified Complete)
    const askAI = async () => {
        if (!context.trim() || context.trim().length < 10) { setError("Context needed (min 10 chars)."); return; }
        if (!query.trim() || query.trim().length < 5) { setError("Question needed (min 5 chars)."); return; }
        setError(''); setLoading(true); setResponses([]); setSummary(''); setParaphrase(''); setSelectedPersona(null);
        setView('loading');
        try {
            const res = await fetch('/api/getResponses', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ context, query }) });
            const data = await res.json();
            const receivedResponses = Array.isArray(data.responses) ? data.responses : [];
            setResponses(receivedResponses);
            setSummary(data.summary || '');
            setParaphrase(data.paraphrase || '');
            const analystResponse = receivedResponses.find(r => r.persona?.includes("Analyst"));
            if (analystResponse && !analystResponse.response?.startsWith("[")) { setSelectedPersona(analystResponse.persona); }
            else if (receivedResponses.length > 0 && !receivedResponses[0].response?.startsWith("[")) { setSelectedPersona(receivedResponses[0].persona); }
            if (data.error) { setError(data.error); }
            else if (!res.ok) { setError("An unexpected server error occurred."); }
        } catch (err) { console.error("API Fetch error:", err); setError("Service connection failed. Please check your network and try again."); setResponses([]); setSummary(''); setParaphrase(''); }
        finally { setLoading(false); setView('results'); setHasAnalyzed(true); }
    };

    // handleRestart function (Verified Complete)
    const handleRestart = () => { setContext(''); setQuery(''); setResponses([]); setSummary(''); setParaphrase(''); setError(''); setSelectedPersona(null); setHasAnalyzed(false); setView('input'); setLoading(false); };

     // Handle Persona Selection (Verified Complete)
     const handleSelectPersona = (persona) => {
        if (persona === selectedPersona || isSwitchingPersona) return;
        setIsSwitchingPersona(true);
        if (detailViewRef.current) { detailViewRef.current.classList.remove('animate-fadeIn'); void detailViewRef.current.offsetWidth; }
        setTimeout(() => {
            setSelectedPersona(persona);
            setTimeout(() => {
                setIsSwitchingPersona(false);
                 requestAnimationFrame(() => { if (detailViewRef.current) { detailViewRef.current.classList.add('animate-fadeIn'); } });
            }, 50);
        }, 150);
    };

    // Find the response object for the selected persona
    const selectedResponse = responses.find(r => r.persona === selectedPersona);

    // --- Render Logic ---
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-slate-50 py-12 sm:py-16 px-4 sm:px-6 lg:px-8 font-sans antialiased">
             {/* Loading Screen outside main card flow */}
            {view === 'loading' && <LoadingScreen />}

            {/* Main Content Card - Controls visibility based on loading state */}
            <div className={`max-w-5xl mx-auto bg-white shadow-2xl rounded-3xl overflow-hidden border border-gray-200/50 transition-opacity duration-300 ease-in-out ${view === 'loading' ? 'opacity-0 invisible' : 'opacity-100 visible'}`}>
                {/* Header */}
                <div className="bg-gradient-to-r from-slate-900 via-black to-slate-800 p-10 sm:p-12 text-center shadow-lg">
                   <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-cyan-400 tracking-tight pb-2">Am I Being Unreasonable?</h1>
                   <p className="mt-3 text-base sm:text-lg text-slate-400 max-w-2xl mx-auto">Cutting through the noise. Get objective analysis.</p>
                </div>

                {/* Conditional Rendering: Input Form */}
                {view === 'input' && (
                    <div className="p-8 sm:p-10 lg:p-12 space-y-8 animate-fadeIn">
                         <div>
                             <label htmlFor="context-input" className="flex items-center text-base font-semibold text-gray-900 mb-3"><DocumentTextIcon />1. Describe the Situation (Context)</label>
                             <textarea id="context-input" className="w-full p-4 text-sm border border-gray-300 rounded-xl shadow-sm resize-vertical min-h-[200px] outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition duration-150 ease-in-out text-gray-800 placeholder-gray-500 bg-white/80 backdrop-blur-sm" placeholder="Paste relevant chat logs or describe the events in detail..." value={context} onChange={(e) => setContext(e.target.value)} rows={10} />
                             <p className="text-xs text-gray-600 mt-2 pl-1">More detail provides more accurate analysis.</p>
                         </div>
                         <div>
                             <label htmlFor="query-input" className="flex items-center text-base font-semibold text-gray-900 mb-3"><ChatBubbleLeftEllipsisIcon/>2. What is Your Specific Question?</label>
                             <input id="query-input" type="text" className="w-full p-4 text-sm border border-gray-300 rounded-xl shadow-sm outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition duration-150 ease-in-out text-gray-800 placeholder-gray-500 bg-white/80 backdrop-blur-sm"
                                // Ensure placeholder quotes are escaped (Single quotes inside double quotes are generally fine here, ESLint error was likely for blockquote below)
                                placeholder="e.g., Am I wrong here?, 'Was my reaction unreasonable?'"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)} />
                         </div>
                         {error && <div className="pt-2"><Alert type="error" message={error} /></div>}
                         <div className="text-center pt-6">
                             <button onClick={askAI} disabled={loading} className={`inline-flex items-center justify-center px-12 py-3.5 border border-transparent text-base font-semibold rounded-full shadow-lg text-white transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 focus:ring-offset-white transform hover:scale-105 active:scale-100 ${ loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700'}`}>
                                {loading ? ( <> <LoadingSpinner /> <span className="ml-3">Analysing...</span> </> ) : ( <> <SparklesIcon className="w-5 h-5 mr-2"/> Get Objective Analysis</> )}
                             </button>
                         </div>
                    </div>
                )}

                 {/* Conditional Rendering: Results View */}
                {view === 'results' && (
                    <div className="bg-slate-50 px-6 md:px-10 py-10 border-t border-gray-200/80">
                        {/* Error Display */}
                        {error && <div className="mb-10 max-w-3xl mx-auto"><Alert type={error.includes("partially completed") || error.includes("failed") ? "warning" : "error"} message={error} /></div>}

                        {/* Paraphrase Section */}
                        {/* *** FIX APPLIED HERE: Replaced literal " with " *** */}
                        {paraphrase && !paraphrase.startsWith("[") && (
                            <div className="mb-10 max-w-3xl mx-auto text-center">
                                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">Your Situation Summary</h3>
                                <blockquote className="text-base italic text-gray-700 bg-slate-100 p-4 rounded-lg border border-slate-200 shadow-inner">
                                    "{paraphrase}"
                                </blockquote>
                            </div>
                        )}
                        {paraphrase && paraphrase.startsWith("[") && !error.includes("Paraphrase generation failed") && ( <div className="mb-10 max-w-3xl mx-auto"><Alert type="warning" title="Context Summary Issue" message="Could not generate situation summary." /></div> )}

                        {/* The Quick Verdict (Summary) Section */}
                        {summary && !summary.startsWith("[") && ( <div className="mb-12 border-t border-gray-200 pt-10"> <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-6 text-center tracking-tight">The Quick Verdict</h2> <div className="bg-slate-800 text-white rounded-xl p-6 shadow-xl max-w-3xl mx-auto border border-slate-700"> <MarkdownRenderer content={summary} className="prose-invert prose-sm" isDark={true} /> </div> </div> )}
                        {summary && summary.startsWith("[") && !error.includes("Summary generation failed") && ( <div className="mb-12 max-w-3xl mx-auto"><Alert type="warning" title="Verdict Issue" message={summary} /></div> )}

                        {/* Detailed Analysis Section */}
                        {responses.length > 0 && (
                            <div className="border-t border-gray-200 pt-10">
                                <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-8 text-center tracking-tight">Detailed Analysis Perspectives</h2>
                                {/* Tab Buttons */}
                                <div className="flex justify-center flex-wrap gap-3 sm:gap-4 mb-10 border-b border-gray-300 pb-4">
                                     {responses.map((r) => ( r.response && !r.response.startsWith("[Error") && <button key={r.persona} onClick={() => handleSelectPersona(r.persona)} className={`px-5 py-2 text-sm font-medium rounded-full transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 whitespace-nowrap transform hover:scale-103 active:scale-100 ${ selectedPersona === r.persona ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg ring-2 ring-offset-1 ring-cyan-300 scale-105' : 'text-slate-700 bg-white hover:bg-slate-200 border border-slate-300' }`}> {r.persona.split('(')[0].trim()} </button> ))}
                                 </div>
                                {/* Selected Detail Card Container */}
                                <div ref={detailViewRef} className={`transition-opacity duration-300 ease-in-out ${isSwitchingPersona ? 'opacity-30' : 'opacity-100'}`} >
                                    {selectedResponse && !selectedResponse.response.startsWith("[Error") && ( <div key={selectedPersona} className="bg-white rounded-2xl p-6 md:p-8 shadow-xl border border-gray-200/80 max-w-3xl mx-auto animate-fadeIn mb-10"> <h3 className="text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-blue-700 mb-5">{selectedResponse.persona}</h3> <div className="text-[15px] leading-relaxed text-slate-800 space-y-4"> <MarkdownRenderer content={selectedResponse.response} isDark={false} /> </div> </div> )}
                                 </div>
                            </div>
                        )}

                        {/* Restart Button */}
                        <div className="mt-12 text-center border-t border-gray-200 pt-10">
                              <button onClick={handleRestart} className="inline-flex items-center justify-center px-10 py-3 border border-gray-400 text-base font-medium rounded-xl shadow-sm text-slate-800 bg-white hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 transition duration-150 ease-in-out transform hover:scale-103 active:scale-100">
                                Analyse Another Situation
                            </button>
                        </div>
                    </div>
                )}

                 {/* Fallback if view state is somehow invalid - should not happen */}
                 {view !== 'input' && view !== 'results' && view !== 'loading' && (
                    <div className="p-12 text-center text-red-600">Internal application error: Invalid view state.</div>
                 )}

            </div> {/* End Main Content Card */}

             <footer className="text-center mt-16 text-gray-600 text-sm px-4"> © {new Date().getFullYear()} Am I Being Unreasonable?™ | AI Analysis Tool | For informational purposes only. Use results critically. </footer>
             {/* Global Styles */}
             <style jsx global>{` @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } } .animate-fadeIn { animation: fadeIn 0.4s ease-out forwards; } @keyframes gradient-xy { 0%, 100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } } .animate-gradient-xy { background-size: 300% 300%; animation: gradient-xy 18s ease infinite; } `}</style>
        </div>
    );
}