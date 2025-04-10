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

// Alert component - Renders plain text message
const Alert = ({ type = 'error', title, message }) => {
    const colors = {
        error: 'bg-red-900/40 border-red-600/70 text-red-200',
        warning: 'bg-yellow-900/40 border-yellow-600/70 text-yellow-200',
    };
    const displayMessage = typeof message === 'string' && message.trim() !== '' ? message : "An unspecified error occurred or no details were provided.";
    return (
        <div className={`border-l-4 p-4 rounded-lg shadow-sm ${colors[type]}`} role="alert">
            {title && <p className="font-bold mb-1">{title}</p>}
            <p>{displayMessage}</p>
        </div>
    );
};

// MarkdownRenderer (Handles light/dark based on container)
const MarkdownRenderer = ({ content, className = "", isDark = false }) => {
    const baseProseClass = "prose prose-sm max-w-none";
    const themeProseClass = isDark ? "prose-invert" : "";
    const textStyles = isDark
        ? "prose-p:text-slate-200 prose-strong:text-white prose-a:text-cyan-400 hover:prose-a:text-cyan-300 prose-blockquote:text-slate-300 prose-blockquote:border-slate-600 prose-code:text-pink-300 prose-headings:text-slate-100 prose-ul:text-slate-200 prose-ol:text-slate-200 prose-li:text-slate-200" // Dark background styles
        : "prose-p:text-slate-700 prose-strong:text-slate-900 prose-a:text-cyan-700 hover:prose-a:text-cyan-600 prose-blockquote:text-slate-600 prose-blockquote:border-slate-400 prose-code:text-pink-700 prose-headings:text-slate-800 prose-ul:text-slate-700 prose-ol:text-slate-700 prose-li:text-slate-700"; // Light background styles (increased contrast)

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

// *** UPDATED LoadingScreen Messages - More Personality, Wit & UK English ***
const LoadingScreen = ({ isApiComplete, isTakingLong }) => {
    // Messages while the AI panel deliberates your dilemma... with personality!
    const regularLoadingMessages = [
        "Right then, let's have a proper look at this...",
        "Firing up the Judgement Engine™...",
        "Analysing the precise levels of 'cheek' involved...",
        "Brewing a strong digital cuppa for concentration...",
        "Consulting the archives of awkward situations...",
        "Untangling the 'he said, she said'... it's knotty.",
        "Running the 'Is it *really* about the bins?' diagnostic...",
        "Trying very hard to remain impartial... honestly.",
        "Checking if anyone needs to 'get in the sea'...",
        "Applying the patented Reasonableness Filter™...",
        "Just cross-referencing with the Big Book of British Pet Peeves...",
        "Hold on, fetching our monocle for a closer look...",
        "Decoding the subtext... there's always subtext, isn't there?",
        "Our circuits are humming with mild consternation...",
        "Are you *sure* you've given us the full picture? 😉",
        "Hmm, this requires careful consideration (and maybe biscuits).",
        "Calibrating our 'Oh, for goodness sake' metres...",
        "Weighing the evidence... like digital detectives.",
        "Considering all angles, even the slightly obtuse ones.",
        "Running simulations of passive-aggressive responses...",
        "Polling the AI hive mind for consensus...",
        "Determining the official 'Hill To Die On' score...",
        "Making sure our programming hasn't developed a bias...",
        "Just accessing the 'Common Sense' module (hope it's charged)...",
        "Comparing notes on similar family dramas...",
        "Filtering out the dramatic sighs and eye-rolls (yours or theirs!)...",
        "This is trickier than assembling flat-pack furniture...",
        "Could a simple apology have fixed this? Asking for a friend.",
        "Evaluating the 'Is life too short for this?' factor...",
        "Engaging the Empathy Subroutines (they're a bit rusty)...",
        "Feeling a strong sense of déjà vu here...",
        "Calculating the potential for escalation...",
        "Prioritising the key points of contention...",
        "Let's be honest, someone's probably being a bit silly...",
        "Trying to see it from *everyone's* slightly skewed perspective...",
        "Gathering digital 'receipts'...",
        "Just double-checking the definition of 'reasonable'...",
        "Warming up the 'Gentle Reality Check' function...",
        "This requires the kind of focus usually reserved for Wordle...",
        "Okay, deep breaths... analysing the core issue.",
        "Sorting the genuine grievance from the minor niggle...",
        "Finalising our preliminary thoughts...",
        "Nearly there... formulating the official-ish verdict.",
        "Running one last check for unintended irony...",
        "Putting the kettle on digitally, one moment...",
        "Assessing the 'taking the mickey' quotient...",
        "Are we judging you, or the situation? Both, probably.",
        "Pondering the philosophical implications of shared bins...",
        "Just confirming: nobody actually threw potatoes, right?",
        "Synthesising a suitably diplomatic response...",
        "Sharpening our analytical pencils...",
        "Ensuring our judgement isn't clouded by yesterday's tricky dilemma...",
        "Considering if 'because I said so' is a valid reason...",
        "Running it past the 'Would this annoy *us*?' test...",
        "Almost ready to deliver the (hopefully) wise words..."
    ];

   const longLoadingMessages = [
        "Blimey, this one's a proper thinker! Engaging the extra brain cells...",
        "Right, the complexity dial just went up to eleven. Stand by...",
        "Ooh, this is intricate! Fetching the specialist AI philosophers...",
        "Hold tight, we're navigating multiple layers of 'Are you serious?!'.",
        "This situation requires the digital equivalent of a long, thoughtful pause.",
        "Wow, you didn't make this easy, did you? Deploying advanced nuance detectors...",
        "High levels of 'Well, actually...' detected. Deep analysis required.",
        "We've had to send out for more digital tea and biscuits for this one.",
        "Don't worry, we're still on it – just consulting the 'Advanced Interpersonal Dramas' archive.",
        "Okay, this requires unpacking properly. Please bear with us.",
        "The AI panel is currently having a very intense (but polite) debate.",
        "Running extra simulations to cover all the potential 'what ifs'.",
        "This is proving trickier than deciding who gets the last roast potato. Patience!",
        "Elevated Faff Factor™ detected. Rerouting to senior AI analysts.",
        "You've presented us with a classic! Requires careful, unhurried judgement.",
        "Hang on, just cross-referencing this against every known social faux pas.",
        "Deep dive initiated. We're going spelunking into the context cavern.",
        "This requires more processing power than initially anticipated. Must be juicy!",
        "Our circuits are whirring with the sheer complexity. Nearly there!",
        "Just running the 'Could *we* be BU?' check again on this tricky one.",
        "Performing multi-dimensional awkwardness analysis.",
        "This scenario has more twists than a curly wurly. We need a mo'.",
        "Recalibrating our perspective engines for this unique challenge.",
        "Don't fret, we haven't forgotten you – just ensuring a top-tier judgement.",
        "Seems simple on the surface, but oh boy, the undercurrents! Analysing...",
        "Our 'Hmmmm' indicators are off the charts. Requires further thought.",
        "Activating the 'Is there a backstory we're missing?' protocol.",
        "This is taking a bit longer because, frankly, it's fascinating.",
        "Confirming resource allocation... Yep, throwing more AI brainpower at it.",
        "Nearly cracked it... just polishing the final verdict."
    ];
    const [loadingText, setLoadingText] = useState("Initiating analysis...");
    const [progress, setProgress] = useState(0);
    const progressIntervalRef = useRef(null);
    const textIntervalRef = useRef(null);

    useEffect(() => {
        setProgress(0);
        const startProgressSimulation = () => {
            if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
            progressIntervalRef.current = setInterval(() => {
                setProgress(prev => { if (prev >= 95) { clearInterval(progressIntervalRef.current); return 95; } return Math.min(prev + 1, 95); });
            }, 200);
        };
        if (isApiComplete) { if (progressIntervalRef.current) clearInterval(progressIntervalRef.current); setProgress(100); }
        else if (isTakingLong) { if (progressIntervalRef.current) clearInterval(progressIntervalRef.current); setProgress(prev => Math.max(prev, 90)); }
        else { startProgressSimulation(); }
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
    // *** NEW State for query handling ***
    const [selectedQueryOption, setSelectedQueryOption] = useState(''); // Stores the value of the selected dropdown option
    const [customQuery, setCustomQuery] = useState(''); // Stores text only if "Other..." is selected
    const [queryToSend, setQueryToSend] = useState(''); // The final query string to be sent to API

    const [responses, setResponses] = useState([]);
    const [summary, setSummary] = useState('');
    const [paraphrase, setParaphrase] = useState('');
    const [error, setError] = useState(null);
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

    // *** Predefined Query Options ***
    const queryOptions = [
        { value: '', label: 'Select a question or type your own...' },
        { value: 'Am I being unreasonable?', label: 'Am I being unreasonable?' },
        { value: 'Am I in the wrong?', label: 'Am I in the wrong?' },
        { value: 'AITA?', label: 'AITA?' }, // Am I the Asshole?
        { value: 'Was my reaction justified?', label: 'Was my reaction justified?' },
        { value: 'What perspective am I missing?', label: 'What perspective am I missing?' },
        { value: 'other', label: 'Other (Type below)...' }
    ];

    // *** Handle Dropdown Change ***
    const handleQueryOptionChange = (event) => {
        const selectedValue = event.target.value;
        setSelectedQueryOption(selectedValue);
        if (selectedValue === 'other') {
            setCustomQuery(''); // Clear custom query when "Other" is selected
            setQueryToSend(''); // Clear final query until user types
        } else {
            setQueryToSend(selectedValue); // Set final query directly from dropdown
            setCustomQuery(''); // Clear custom query field
        }
    };

    // *** Handle Custom Query Input Change ***
    const handleCustomQueryChange = (event) => {
        const value = event.target.value;
        setCustomQuery(value);
        setQueryToSend(value); // Update final query as user types
    };


    // *** askAI function - Modified to use queryToSend ***
    const askAI = async () => {
        console.log("askAI triggered");
        const finalQuery = queryToSend.trim(); // Use the state derived from dropdown/input

        if (!context.trim() || context.trim().length < 10) { setError("Context needed (min 10 chars)."); return; }
        // *** Validate the final query string ***
        if (!finalQuery || finalQuery.length < 5) {
             setError("Question needed (min 5 chars). Select an option or type your own.");
             return;
        }

        console.log("Resetting states...");
        setError(null); setResponses([]); setSummary(''); setParaphrase(''); setSelectedPersona(null);
        setIsApiComplete(false); setIsTakingLong(false); setLoading(true); setView('loading');
        console.log("State set to 'loading'");

        if (longLoadTimeoutRef.current) clearTimeout(longLoadTimeoutRef.current);
        const LONG_LOAD_THRESHOLD = 22000;
        longLoadTimeoutRef.current = setTimeout(() => { console.log("Long load threshold reached"); setIsTakingLong(true); }, LONG_LOAD_THRESHOLD);

        let apiError = null; let apiData = null;
        try {
            console.log("Sending request to API with query:", finalQuery); // Log the actual query being sent
            const res = await fetch('/api/getResponses', {
                 method: 'POST',
                 headers: { 'Content-Type': 'application/json' },
                 // *** Send the finalQuery ***
                 body: JSON.stringify({ context, query: finalQuery })
            });
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

    // --- handleRestart - Reset query states too ---
    const handleRestart = () => {
         console.log("Restarting...");
         setContext('');
         setSelectedQueryOption(''); // Reset dropdown
         setCustomQuery(''); // Reset custom field
         setQueryToSend(''); // Reset final query
         setResponses([]); setSummary(''); setParaphrase(''); setError(null); setSelectedPersona(null); setHasAnalyzed(false); setView('input'); setLoading(false); setIsApiComplete(false); setIsTakingLong(false);
         if (longLoadTimeoutRef.current) clearTimeout(longLoadTimeoutRef.current);
         window.scrollTo(0, 0);
    };

    // --- handleSelectPersona (Unchanged) ---
    const handleSelectPersona = (persona) => { console.log(`Selecting persona: ${persona}`); if (persona === selectedPersona || isSwitchingPersona) return; setIsSwitchingPersona(true); if (detailViewRef.current) { detailViewRef.current.classList.remove('animate-fadeIn'); void detailViewRef.current.offsetWidth; } setTimeout(() => { setSelectedPersona(persona); setTimeout(() => { setIsSwitchingPersona(false); requestAnimationFrame(() => { if (detailViewRef.current) { detailViewRef.current.classList.add('animate-fadeIn'); } }); }, 50); }, 150); };
    const selectedResponse = responses.find(r => r.persona === selectedPersona);

    // --- Render Logic ---
    return (
        <div className={`min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black py-12 sm:py-16 px-4 sm:px-6 lg:px-8 font-sans antialiased text-slate-300 animate-gradient-bg`}>
             {view === 'loading' && <LoadingScreen isApiComplete={isApiComplete} isTakingLong={isTakingLong} />}
             <div className={`max-w-5xl mx-auto bg-slate-800/60 backdrop-blur-lg shadow-2xl rounded-3xl overflow-hidden border border-slate-700/60 transition-opacity duration-300 ease-in-out ${view === 'loading' ? 'opacity-0 invisible' : 'opacity-100 visible'}`}>
                <div className="bg-gradient-to-r from-slate-900/80 via-gray-900/70 to-slate-800/80 backdrop-blur-sm p-10 sm:p-12 text-center shadow-lg border-b border-slate-700/40">
                   <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-cyan-400 tracking-tight pb-2">Am I Being Unreasonable?</h1>
                   <p className="mt-3 text-base sm:text-lg text-slate-400 max-w-2xl mx-auto">Confused by a situation? Get clarity and an objective perspective.</p>
                </div>

                {/* Input View */}
                {view === 'input' && (
                    <div className="p-8 sm:p-10 lg:p-12 space-y-8 animate-fadeIn">
                         {/* Context Input */}
                         <div>
                             <label htmlFor="context-input" className="flex items-center text-lg font-semibold text-slate-100 mb-3"> <DocumentTextIcon />1. Describe the Situation (Context) </label>
                             <textarea id="context-input" className="w-full p-4 text-base border border-slate-300 rounded-xl shadow-sm resize-vertical min-h-[200px] outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition duration-150 ease-in-out bg-slate-100 text-slate-900 placeholder-slate-500" placeholder="Paste relevant chat logs or describe the events in detail..." value={context} onChange={(e) => setContext(e.target.value)} rows={10} />
                             <p className="text-xs text-slate-400 mt-2 pl-1">More detail provides more accurate analysis.</p>
                         </div>

                         {/* --- UPDATED Query Section (Dropdown + Optional Input) --- */}
                         <div>
                             <label htmlFor="query-select" className="flex items-center text-lg font-semibold text-slate-100 mb-3"> <ChatBubbleLeftEllipsisIcon/>2. What is Your Specific Question? </label>
                             {/* Dropdown Select */}
                             <select
                                 id="query-select"
                                 value={selectedQueryOption}
                                 onChange={handleQueryOptionChange}
                                 className="w-full p-4 text-base border border-slate-300 rounded-xl shadow-sm outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition duration-150 ease-in-out bg-slate-100 text-slate-900 placeholder-slate-500 appearance-none cursor-pointer" // Added appearance-none, cursor-pointer
                             >
                                 {queryOptions.map(option => (
                                     <option key={option.value} value={option.value} disabled={option.value === ''}>
                                         {option.label}
                                     </option>
                                 ))}
                             </select>

                             {/* Conditional Text Input for "Other..." */}
                             {selectedQueryOption === 'other' && (
                                 <div className="mt-4"> {/* Add some space */}
                                     <input
                                         id="custom-query-input"
                                         type="text"
                                         className="w-full p-4 text-base border border-slate-300 rounded-xl shadow-sm outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition duration-150 ease-in-out bg-slate-100 text-slate-900 placeholder-slate-500"
                                         placeholder="Enter your specific question here..."
                                         value={customQuery}
                                         onChange={handleCustomQueryChange}
                                     />
                                 </div>
                             )}
                         </div>

                         {/* Error Display (Input view) */}
                         {error && view === 'input' && <div className="pt-2"><Alert type="error" title="Input Error" message={error} /></div>}
                          {/* Submit Button */}
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
                             <div className='space-y-10 md:space-y-12'>
                                {/* Paraphrase Section */}
                                {paraphrase && !paraphrase.startsWith("[") && ( <div className="max-w-3xl mx-auto text-center"> <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">Your Situation Summary</h3> <blockquote className="text-base italic text-slate-800 bg-slate-100 p-4 rounded-lg border border-slate-300 shadow"> "{paraphrase}" </blockquote> </div> )}
                                {paraphrase && paraphrase.startsWith("[") && (!error || !error.toLowerCase().includes('paraphrase')) && ( <div className="max-w-3xl mx-auto"> <Alert type="warning" title="Context Summary Issue" message="Could not generate situation summary." /> </div> )}
                                {/* Verdict Section */}
                                {summary && !summary.startsWith("[") && ( <div className="border-t border-slate-700/40 pt-10 md:pt-12"> <h2 className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-cyan-400 mb-6 text-center tracking-tight">The Quick Verdict</h2> <div className="bg-white text-slate-900 rounded-xl p-6 shadow-lg max-w-3xl mx-auto border border-slate-300"> {/* Explicit dark text */} <MarkdownRenderer content={summary} className="prose-sm" isDark={false} /> </div> </div> )}
                                {summary && summary.startsWith("[") && (!error || !error.toLowerCase().includes('summary')) && ( <div className="max-w-3xl mx-auto"> <Alert type="warning" title="Verdict Issue" message="Could not generate the final verdict summary." /> </div> )}
                                {/* Detailed Perspectives Section */}
                                {responses.some(r => r.response && !r.response.startsWith("[")) && (
                                    <div className="border-t border-slate-700/40 pt-10 md:pt-12">
                                        <h2 className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-cyan-400 mb-8 text-center tracking-tight">Detailed Analysis Perspectives</h2>
                                        <div className="flex justify-center flex-wrap gap-3 sm:gap-4 mb-10 border-b border-slate-700/40 pb-6">
                                             {responses.map((r) => ( r.response && !r.response.startsWith("[") && <button key={r.persona} onClick={() => handleSelectPersona(r.persona)} className={`px-5 py-2 text-sm font-medium rounded-full transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-slate-800 whitespace-nowrap transform hover:scale-103 active:scale-100 ${ selectedPersona === r.persona ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg ring-2 ring-offset-1 ring-cyan-400 scale-105' : 'text-slate-200 bg-slate-700/40 hover:bg-slate-600/60 border border-slate-600/60' }`} > {r.persona.split('(')[0].trim()} </button> ))}
                                         </div>
                                        <div ref={detailViewRef} className={`transition-opacity duration-300 ease-in-out ${isSwitchingPersona ? 'opacity-30' : 'opacity-100'}`} >
                                            {selectedResponse && !selectedResponse.response.startsWith("[") && (
                                                // *** Explicit dark text for container ***
                                                <div key={selectedPersona} className="bg-white text-slate-900 rounded-2xl p-6 md:p-8 shadow-xl border border-slate-300 max-w-3xl mx-auto animate-fadeIn mb-10">
                                                    <h3 className="text-xl font-semibold text-slate-800 mb-5"> {/* Dark text for persona title */}
                                                        {selectedResponse.persona}
                                                    </h3>
                                                    <div className="text-[15px] leading-relaxed space-y-4">
                                                        {/* Pass isDark=false to use light mode prose styles */}
                                                        <MarkdownRenderer content={selectedResponse.response} isDark={false} />
                                                    </div>
                                                </div>
                                            )}
                                             {!selectedResponse && responses.some(r => r.response && !r.response.startsWith("[")) && ( <div className="text-center text-slate-500 italic mt-4">Select a perspective above to view details.</div> )}
                                         </div>
                                    </div>
                                )}
                                {/* Fallback message */}
                                {!summary && !responses.some(r => r.response && !r.response.startsWith("[")) && !error && ( <div className="text-center text-slate-400 py-10"> No analysis could be generated for this input. Please try rephrasing your situation or question. </div> )}
                            </div>
                        ) : null /* Don't render results if critical error */}
                        {/* Restart Button */}
                        <div className="mt-12 text-center border-t border-slate-700/40 pt-10 md:pt-12">
                              <button onClick={handleRestart} className="inline-flex items-center justify-center px-10 py-3 border border-slate-600/60 text-base font-medium rounded-xl shadow-sm text-slate-200 bg-slate-700/40 hover:bg-slate-600/60 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 focus:ring-offset-slate-800 transition duration-150 ease-in-out transform hover:scale-103 active:scale-100" > Analyse Another Situation </button>
                        </div>
                    </div>
                )}
                 {view !== 'input' && view !== 'results' && view !== 'loading' && ( <div className="p-12 text-center text-red-400">Internal application error: Invalid view state.</div> )}
            </div>
             <footer className="text-center mt-16 text-slate-500 text-sm px-4"> © {new Date().getFullYear()} Am I Being Unreasonable?™ | AI Analysis Tool | For informational purposes only. Use results critically. </footer>
             <style jsx global>{` @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } } .animate-fadeIn { animation: fadeIn 0.4s ease-out forwards; } @keyframes gradient-xy { 0%, 100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } } .animate-gradient-xy { background-size: 300% 300%; animation: gradient-xy 18s ease infinite; } @keyframes gradient-background { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } } .animate-gradient-bg { background-size: 200% 200%; animation: gradient-background 25s ease infinite; } @keyframes pulse-bar { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } } .animate-pulse-bar { animation: pulse-bar 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite; } `}</style>
        </div>
    );
}