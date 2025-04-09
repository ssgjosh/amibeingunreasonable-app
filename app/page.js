"use client";
import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown the Sarcasm Subroutines...", "Cross-referencing with Beano annuals...", "Asking Jeeves (Legacy Mode)...", "Determining Correct Queueing Etiquette...", "Putting the kettle on (Priority Override)...", "Calculating Passive-Aggression Vectors...", "Deploying Stiff Upper Lip Algorithm...", "Checking for Appropriate Biscuit Selection...", "Reticulating Splines... with irony...", "Analysing Underlying Banter Potential...", "Running Diagnostic on the Reasonableness Engine...", "Buffering... Please hold the line...", "Optimising for Maximum Objectivity (and tea)...", "Purging Unnecessary Pleasantries...", "Compiling Strategic Tuts...", "Ensuring Proper Use of 'Right then'...", "Interrogating pixels for hidden meanings...", "Deploying swarm of nano-analysts...", "Consulting the Oracle (she's on tea break)...", "Running situation through 10,000 simulations...", "Checking for quantum entanglement in arguments...", "Asking a panel of 1,000 stoic philosophers...", "Applying Occam's Razor... and then adding complications...", "Measuring passive-aggression with lasers...", "Fact-checking your inner monologue...", "Triangulating emotional trajectories...", "Engaging the Department of Common Sense...", "Re-routing neural pathways for objectivity...", "Filtering out hyperbole...", "Polishing the Scales of Reasonableness...", "Initiating deep-contextual dive...", "Sequencing the argument genome...", "Translating subtext into plain English...", "Defragging emotional baggage...", "Booting up the Judgementatron 5000...", "Asking 'What would a sensible person do?'...", "Cross-examining underlying motives...", "Checking tea levels for optimal analysis...", "Scanning for logical fallacies (found some!)...", "Inflating the strategic thinking cap...", "Consulting ancient reasonableness scrolls...", "Warming up the perspective engine...", "Synchronising watches for action plan...", "Ensuring impartiality protocols are active...", "Running final sanity check...", "Preparing brutally honest assessment...", "Distilling wisdom from the chaos...", "Just double-checking the kettle *is* off..." ]; const [loadingText, setLoadingText] = useState("Initiating analysis..."); useEffect(() => { setLoadingText(loadingMessages[Math.floor(Math.random() * loadingMessages.length)]); const intervalId = setInterval(() => { setLoadingText(loadingMessages[Math.floor(Math.random() * loadingMessages.length)]); }, 2000); return () => clearInterval(intervalId); // eslint-disable-next-line react-hooks/exhaustive-deps }, []); return ( <div className="fixed inset-0 bg-gradient-to-br from-slate-800 via-black to-slate-900 z-50 flex flex-col items-center justify-center p-8 text-center overflow-hidden"> <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-black to-indigo-900 animate-gradient-xy opacity-70"></div> <div className="relative z-10 flex flex-col items-center justify-center"> <svg className="animate-spin h-12 w-12 text-cyan-400 mb-8" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> <h2 className="text-3xl font-bold text-white mb-4 tracking-tight">Analysing Your Situation...</h2> <p className="text-lg text-slate-400 transition-opacity duration-500 ease-in-out w-full max-w-md">{loadingText}</p> </div> </div> ); };
const DocumentTextIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 inline-block mr-2 text-slate-500"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg>;
const ChatBubbleLeftEllipsisIcon = () => <svg xmlns="http://www.w3.org/';

// --- Components (DEFINITIONS VERIFIED AND COMPLETE - NO PLACEHOLDERS) ---

const LoadingSpinner = () => ( <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> );
const Alert = ({ type = 'error', title, message }) => { const colors = { error: 'bg-red-100 border-red-500 text-red-800 dark:bg-red-900/20 dark:border-red-700 dark:text-red-200', warning: 'bg-yellow-100 border-yellow-500 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-700 dark:text-yellow-200', }; return ( <div className={`border-l-4 p-4 rounded-lg shadow-sm ${colors[type]}`} role="alert"> {title && <p className="font-bold mb-1">{title}</p>} <ReactMarkdown components={{ p: ({ node, ...props }) => <span {...props} /> }}>{message || "An unspecified error occurred."}</ReactMarkdown> </div> ); };
const MarkdownRenderer = ({ content, className = "", isDark = false }) => { const baseProseClass = "prose prose-sm max-w-none"; const textStyles = isDark ? "prose-p:text-slate-200 prose-strong:text-white prose-ul:text-slate-200 prose-ol:text-slate-200 prose-li:text-slate-200" : "prose-p:text-slate-700 prose-strong:text-slate-900 prose-ul:text-slate-700 prose-ol:text-slate-700 prose-li:text-slate-700"; return ( <div className={`${baseProseClass} ${isDark ? 'prose-invert' : ''} ${textStyles} ${className}`}> <ReactMarkdown components={{ p: ({ node, ...props }) => <p className="mb-3 last:mb-0" {...props} />, strong: ({ node, ...props }) => <strong className="font-semibold" {...props} />, ul: ({ node, ...props }) => <ul className="list-disc list-inside mb-3 pl-1" {...props} />, ol: ({ node, ...props }) => <ol className="list-decimal list-inside mb-3 pl-1" {...props} />, li: ({ node, ...props }) => <li className="mb-1" {...props} />, }}>{content || ""}</ReactMarkdown> </div> ); };
const LoadingScreen = () => { const loadingMessages = [ "Recalibrating the Pompomposity Filter...", "Engaging the Sarcasm Subroutines...", "Cross-referencing with Beano annuals...", "Asking Jeeves (Legacy Mode)...", "Determining Correct Queueing Etiquette...", "Putting the kettle on (Priority Override)...", "Calculating Passive-Aggression Vectors...", "Deploying Stiff Upper Lip Algorithm...", "Checking for Appropriate Biscuit Selection...", "Reticulating Splines... with irony...", "Analysing Underlying Banter Potential...", "Running Diagnostic on the Reasonableness Engine...", "Buffering... Please hold the line...", "Optimising for Maximum Objectivity (and tea)...", "Purging Unnecessary Pleasantries...", "Compiling Strategic Tuts...", "Ensuring Proper Use of 'Right then'...", "Interrogating pixels for hidden meanings...", "Deploying swarm of nano-analysts...", "Consulting the Oracle (she's on tea break)...", "Running situation through 10,000 simulations...", "Checking for quantum entanglement in arguments...", "Asking a panel of 1,000 stoic philosophers...", "Applying Occam's Razor... and then adding complications...", "Measuring passive-aggression with lasers...", "Fact-checking your inner monologue...", "Triangulating emotional trajectories...", "Engaging the Department of Common Sense...", "Re-routing neural pathways for objectivity...", "Filtering out hyperbole...", "Polishing the Scales of Reasonableness...", "Initiating deep-contextual dive...", "Sequencing the argument genome...", "Translating subtext into plain English...", "Defragging emotional baggage...", "Booting up the Judgementatron 5000...", "Asking 'What would a sensible person do?'...", "Cross-examining underlying motives...", "Checking tea levels for optimal analysis...", "Scanning for logical fallacies (found some!)...", "Inflating the strategic thinking cap...", "Consulting ancient reasonableness scrolls...", "Warming up the perspective engine...", "Synchronising watches for action plan...", "Ensuring impartiality protocols are active...", "Running final sanity check...", "Preparing brutally honest assessment...", "Distilling wisdom from the chaos...", "Just double-checking the kettle *is* off..." ]; const [loadingText, setLoadingText] = useState("Initiating analysis..."); useEffect(() => { setLoadingText(loadingMessages[Math.floor(Math.random() * loadingMessages.length)]); const intervalId = setInterval(() => { setLoadingText(loadingMessages[Math.floor(Math.random() * loadingMessages.length)]); }, 2000); return () => clearInterval(intervalId); // eslint-disable-next-line react-hooks/exhaustive-deps }, []); return ( <div className="fixed inset-0 bg-gradient-to-br from-slate-800 via-black to-slate-900 z-50 flex flex-col items-center justify-center p-8 text-center overflow-hidden"> <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-black to-indigo-900 animate-gradient-xy opacity-70"></div> <div className="relative z-10 flex flex-col items-center justify-center"> <svg className="animate-spin h-12 w-12 text-cyan-400 mb-8" xmlns="http://www.w3.org/2000/svg" fill="2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 inline-block mr-2 text-slate-500"><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-3.03 8.25-6.75 8.25a9.753 9.753 0 0 1-4.75-1.195A9.753 9.753 0 0 1 3 12c0-4.556 3.03-8.25 6.75-8.25a9.753 9.753 0 0 1 4.75 1.195A9.753 9.753 0 0 1 21 12Z" /></svg>;
const SparklesIcon = ({className="w-5 h-5 inline-block"}) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L1.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.81none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> <h2 className="text-3xl font-bold text-white mb-4 tracking-tight">Analysing Your Situation...</h2> <p className="text-lg text-slate-400 transition-opacity duration-500 ease-in-out w-full max-w-md">{loadingText}</p> </div> </div> ); };
const DocumentTextIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 inline-block mr-2 text-slate-500"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg>;
const ChatBubbleLeftEllipsisIcon = () => <svg xmlns="http://www.w3a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 inline-block mr-2 text-slate-500"><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-3.03 8.25-6.75 8.25a9.753 9.753 0 0 1-4.75-1.193-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" /></svg>;

// --- Main Page Component ---
export default function Home() {
    // State management
    5A9.753 9.753 0 0 1 3 12c0-4.556 3.03-8.25 6.75-8.25a9.753 9.753 0 0 1 4.75 1.195A9.753 9.753 0 0 1 21 12Z" /></svg>;
const SparklesIcon = ({className="w-5 h-5 inline-block"}) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={classNameconst [context, setContext] = useState('');
    const [query, setQuery] = useState('');
    const [responses, setResponses] = useState([]);
    const [summary, setSummary] = useState('');
    const [paraphrase, setParaphrase] = useState('');
    const [error, setError] = useState('');
    const [view, setView] = useState('input'); // Default view state IS 'input'
    const [loading, setLoading] = useState(false);
    const [hasAnalyzed, setHasAnalyzed] = useState(false);
    }><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L1.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15const [selectedPersona, setSelectedPersona] = useState(null);
    const [isSwitchingPersona, setIsSwitchingPersona] = useState(false);
    const detailViewRef = useRef(null);

    // askAI function (Verified Complete)
    const askAI = async () => {
.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.        if (!context.trim() || context.trim().length < 10) { setError("Context needed (min 10 chars)."); return; }
        if (!query.trim() || query.trim().length < 5) { setError("Question needed (min 5 chars).");259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375  return; }
        setError(''); setLoading(true); setResponses([]); setSummary(''); setParaphrase(''); setSelectedPersona(null);
        setView('loading');
        try {
            const res = await fetch('/api/getResponses', {3.375 0 0 0 2.455-2.456L18 2.25l method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ context, query }) });
            .259 1.035a3.375const data = await res.json();
            const receivedResponses = Array. 3.375 0 0 0 2.4isArray(data.responses) ? data.responses : [];
            setResponses56 2.456L21.75 6(receivedResponses);
            setSummary(data.summary || '');
            setParaphrl-1.035.259a3.37ase(data.paraphrase || '');
            const analystResponse = received5 3.375 0 0 0-2.Responses.find(r => r.persona?.includes("Analyst"));
456 2.456ZM16.894 20.567 16.5 21.75            if (analystResponse && !analystResponse.response?.startsWith("["l-.394-1.183a2.25)) { setSelectedPersona(analystResponse.persona); }
            else if 2.25 0 0 0-1.42 (receivedResponses.length > 0 && !receivedResponses[0].response3-1.423L13.5 18.?.startsWith("[")) { setSelectedPersona(receivedResponses[0].persona); }75l1.183-.394a2.2
            if (data.error) { setError(data.error); }5 2.25 0 0 0 1.423-1.423l.394-1.
            else if (!res.ok) { setError("An unexpected server error183.394 1.183a2. occurred."); }
        } catch (err) { console.error("API25 2.25 0 0 0 1. Fetch error:", err); setError("Service connection failed. Please check your network and423 1.423l1.183.394-1.183.394a2.25  try again."); setResponses([]); setSummary(''); setParaphrase(''); }
        2.25 0 0 0-1.423finally { setLoading(false); setView('results'); setHasAnalyzed(true); }
    };

    // handleRestart function (Verified Complete)
    const 1.423Z" /></svg>;

// --- Main Page handleRestart = () => { setContext(''); setQuery(''); setResponses([]); set Component ---
export default function Home() {
    // State management
    Summary(''); setParaphrase(''); setError(''); setSelectedPersona(null); setHasAnalyzedconst [context, setContext] = useState('');
    const [query,(false); setView('input'); setLoading(false); };

     // setQuery] = useState('');
    const [responses, setResponses] = Handle Persona Selection (Verified Complete)
     const handleSelectPersona = (persona) => {
        if (persona === selectedPersona || isSwitchingPersona) return; useState([]);
    const [summary, setSummary] = useState('');
    
        setIsSwitchingPersona(true);
        if (detailViewRef.currentconst [paraphrase, setParaphrase] = useState('');
    ) { detailViewRef.current.classList.remove('animate-fadeIn');const [error, setError] = useState('');
    const [view, set void detailViewRef.current.offsetWidth; }
        setTimeout(() => {View] = useState('input'); // Default view state IS 'input'
    const [loading, setLoading] = useState(false);
    const [hasAnalyzed, setHasAnalyzed] = useState(false);
    
            setSelectedPersona(persona);
            setTimeout(() => {
                setIsconst [selectedPersona, setSelectedPersona] = useState(null);
    constSwitchingPersona(false);
                 requestAnimationFrame(() => { if (detail [isSwitchingPersona, setIsSwitchingPersona] = useState(false);ViewRef.current) { detailViewRef.current.classList.add('
    const detailViewRef = useRef(null);

    // askAI function (Verified Complete)
    const askAI = async () => {
        if (!context.trim() || context.trim().length < 1animate-fadeIn'); } });
            }, 50);
        }, 150);
    };

    // Find the response object for the selected persona0) { setError("Context needed (min 10 chars)."); return
    const selectedResponse = responses.find(r => r.persona ===; }
        if (!query.trim() || query.trim().length selectedPersona);

    // --- Render Logic ---
    return (
         < 5) { setError("Question needed (min 5 chars)."); return; }
        setError(''); setLoading(true); setResponses([]); setSummary<div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-slate-50 py-12 sm:py-16 px-4 sm:px(''); setParaphrase(''); setSelectedPersona(null);
        setView('loading');
        try {
            const res = await fetch('/api/getResponses', {-6 lg:px-8 font-sans antialiased">
             {/* Loading Screen outside main card flow */}
            {view === 'loading method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ context, query }) });
            ' && <LoadingScreen />}

            {/* Main Content Card - Controls visibility based on loading state */}
            <div className={`max-w-5xl mx-const data = await res.json();
            const receivedResponses = Array.isArray(data.responses) ? data.responses : [];
            setResponsesauto bg-white shadow-2xl rounded-3xl overflow-hidden border(receivedResponses);
            setSummary(data.summary || '');
            setParaphrase(data.paraphrase || '');
            const analystResponse = receivedResponses.find(r => r.persona?.includes("Analyst"));
            if (analystResponse && !analystResponse.response?.startsWith("[" border-gray-200/50 transition-opacity duration-300 ease-in-out ${view === 'loading' ? 'opacity-0 invisible' : 'opacity-100 visible'}`}>
                {/* Header */}
                <div className="bg-gradient-to-r from-slate-900 via-black to-slate-8)) { setSelectedPersona(analystResponse.persona); }
            else if (receivedResponses.length > 0 && !receivedResponses[0].response00 p-10 sm:p-12 text-center shadow-lg">?.startsWith("[")) { setSelectedPersona(receivedResponses[0].persona); }
                   <h1 className="text-4xl sm:text-5
            if (data.error) { setError(data.error); }
            else if (!res.ok) { setError("An unexpected server errorxl lg:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 occurred."); }
        } catch (err) { console.error("API via-teal-300 to-cyan-400 tracking-tight pb-2">Am I Being Unreasonable?</h1>
                   <p className="mt-3 text-base sm:text-lg text-slate-400 max-w-2xl mx-auto">Cutting through the noise. Get objective Fetch error:", err); setError("Service connection failed. Please check your network and try again."); setResponses([]); setSummary(''); setParaphrase(''); }
        finally { setLoading(false); setView('results'); setHasAnalyzed(true); }
    };

    // handleRestart function (Verified Complete)
    const analysis.</p>
                </div>

                {/* Conditional Rendering: Input Form */}
                {view === 'input' && (
                    <div className handleRestart = () => { setContext(''); setQuery(''); setResponses([]); set="p-8 sm:p-10 lg:p-12 space-y-8 animate-fadeIn">
                         <div>
                             <label htmlFor="contextSummary(''); setParaphrase(''); setError(''); setSelectedPersona(null); setHasAnalyzed(false); setView('input'); setLoading(false); };

     //-input" className="flex items-center text-base font-semibold text Handle Persona Selection (Verified Complete)
     const handleSelectPersona = (persona) => {
        if (persona === selectedPersona || isSwitchingPersona) return;-gray-900 mb-3"><DocumentTextIcon />1.
        setIsSwitchingPersona(true);
        if (detailViewRef.current Describe the Situation (Context)</label>
                             <textarea id="context-) { detailViewRef.current.classList.remove('animate-fadeIn');input" className="w-full p-4 text-sm border border- void detailViewRef.current.offsetWidth; }
        setTimeout(() => {
            setSelectedPersona(persona);
            setTimeout(() => {
                setIsgray-300 rounded-xl shadow-sm resize-vertical min-SwitchingPersona(false);
                 requestAnimationFrame(() => { if (detailViewRef.current) { detailViewRef.current.classList.add('h-[200px] outline-none focus:ring-2 focusanimate-fadeIn'); } });
            }, 50);
        }, 150);
    };

    // Find the response object for the selected persona:ring-cyan-500 focus:border-cyan-50
    const selectedResponse = responses.find(r => r.persona ===0 transition duration-150 ease-in-out text-gray-800 placeholder-gray-500 bg-white/80 selectedPersona);

    // --- Render Logic ---
    return (
        <div className="min-h-screen bg-gradient-to-br backdrop-blur-sm" placeholder="Paste relevant chat logs or describe the events in detail..." value={context} onChange={(e) => setContext(e from-slate-100 via-white to-slate-50 py-12 sm:py-16 px-4 sm:px.target.value)} rows={10} />
                             <p className="text-xs text-gray-600 mt-2 pl--6 lg:px-8 font-sans antialiased">
             {/* Loading Screen outside main card flow */}
            {view === 'loading1">More detail provides more accurate analysis.</p>
                         </div>
                         <div>
                             <label htmlFor="query-input" className="flex items-' && <LoadingScreen />}

            {/* Main Content Card */}
            <div className={`max-w-5xl mx-auto bg-white shadow-center text-base font-semibold text-gray-900 mb-2xl rounded-3xl overflow-hidden border border-gray-200/50 transition-opacity duration-300 ease-in-out ${view3"><ChatBubbleLeftEllipsisIcon/>2. What is Your Specific Question?</label>
                             <input id="query-input" type="text" className="w-full p-4 text-sm border border-gray === 'loading' ? 'opacity-0 invisible' : 'opacity-1-300 rounded-xl shadow-sm outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan00 visible'}`}>
                {/* Header */}
                <div className="bg-gradient-to-r from-slate-900 via-500 transition duration-150 ease-in-out text-black to-slate-800 p-10 sm:p-gray-800 placeholder-gray-500 bg-white-12 text-center shadow-lg">
                   <h1 className="text-/80 backdrop-blur-sm"
                                // ** FIX 1: Placeholder4xl sm:text-5xl lg:text-6xl font- quotes escaped **
                                placeholder="e.g., Am I wrong here?, &aposbold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-;Was my reaction unreasonable?'"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)} />cyan-400 tracking-tight pb-2">Am I Being Unreasonable?
                         </div>
                         {error && <div className="pt-2"><Alert type="error" message={error} /></div>}
                         <div</h1>
                   <p className="mt-3 text-base sm:text-lg text-slate-400 max-w-2xl mx className="text-center pt-6">
                             <button onClick={askAI} disabled={loading} className={`inline-flex items-center justify-center px--auto">Cutting through the noise. Get objective analysis.</p>
                12 py-3.5 border border-transparent text-base font-semibold rounded-full shadow-lg text-white transition-all duration-200 ease</div>

                {/* Conditional Rendering: Input Form */}
                {view ===-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 focus: 'input' && (
                    <div className="p-8 sm:p-10 lg:p-12 space-y-8 animatering-offset-white transform hover:scale-105 active:scale-100 ${ loading ? 'bg-gray-400 cursor-not-fadeIn">
                         <div>
                             <label htmlFor="context-input" className="flex items-center text-base font-semibold text-gray--allowed' : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-900 mb-3"><DocumentTextIcon />1. Describe the Situation (Context)</label>
                             <textarea id="context-input" className600 hover:to-blue-700'}`}>
                                {loading ? ( <> <LoadingSpinner /> <span className="ml-3">Analysing...</span> </> ) : ( <> <SparklesIcon className="="w-full p-4 text-sm border border-gray-3w-5 h-5 mr-2"/> Get Objective Analysis</> )}
                             </00 rounded-xl shadow-sm resize-vertical min-h-[200px] outline-none focus:ring-2 focus:ring-cyanbutton>
                         </div>
                    </div>
                )}

                 {/* Conditional Rendering: Results View */}
                {view === 'results' && (
-500 focus:border-cyan-500 transition duration-                    <div className="bg-slate-50 px-6 md:150 ease-in-out text-gray-800 placeholder-gray-500 bg-white/80 backdrop-blur-sm" placeholderpx-10 py-10 border-t border-gray-2="Paste relevant chat logs or describe the events in detail..." value={context} onChange={(e) => setContext(e.target.value)} rows={00/80">
                        {/* Error Display */}
                        {10} />
                             <p className="text-xs text-grayerror && <div className="mb-10 max-w-3xl-600 mt-2 pl-1">More detail provides more accurate mx-auto"><Alert type={error.includes("partially completed") || analysis.</p>
                         </div>
                         <div>
                             <label htmlFor=" error.includes("failed") ? "warning" : "error"} message={error} /></div>}

                        {/* Paraphrase Section */}
                         query-input" className="flex items-center text-base font-semibold text-gray-900 mb-3"><ChatBubbleLeftEllipsis{/* ** FIX 2: Blockquote quotes escaped ** */}
                        {paraphrase && !paraphrase.startsWith("[") && (
                            <div className="mb-10 max-w-3xl mx-auto text-Icon/>2. What is Your Specific Question?</label>
                             <input id="query-input" type="text" className="w-full pcenter">
                                <h3 className="text-xs font-semibold text-4 text-sm border border-gray-300 rounded-xl-gray-500 uppercase tracking-widest mb-2">Your shadow-sm outline-none focus:ring-2 focus:ring-cyan-50 Situation Summary</h3>
                                <blockquote className="text-base italic text-gray0 focus:border-cyan-500 transition duration-150 ease-in-out text-gray-800 placeholder-gray--700 bg-slate-100 p-4 rounded-500 bg-white/80 backdrop-blur-sm"
                                // **FIX 1:** Escaped single quotes
                                placeholder="elg border border-slate-200 shadow-inner">
                                    .g., Am I wrong here?, 'Was my reaction unreasonable?'"
                                value={query}
                                onChange={(e) =>"{paraphrase}" {/* <-- FIX APPLIED HERE */}
                                </blockquote>
                            </div>
                         )}
                        {paraphrase setQuery(e.target.value)} />
                         </div>
                         {error && <div className="pt-2"><Alert type="error" message && paraphrase.startsWith("[") && !error.includes("Paraphrase generation failed") && ( <div className="mb-10 max-w-={error} /></div>}
                         <div className="text-center pt3xl mx-auto"><Alert type="warning" title="Context Summary Issue" message="Could not generate situation summary." /></div> )}

                        {/*-6">
                             <button onClick={askAI} disabled={loading} className={`inline-flex items-center justify-center px-12 py The Quick Verdict (Summary) Section */}
                        {summary && !summary.-3.5 border border-transparent text-base font-semibold rounded-full shadow-startsWith("[") && ( <div className="mb-12 border-t border-gray-200 pt-10"> <h2 classNamelg text-white transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset="text-2xl md:text-3xl font-bold text--2 focus:ring-cyan-500 focus:ring-offsetslate-800 mb-6 text-center tracking-tight">The Quick Verdict</h2> <div className="bg-slate-800 text--white transform hover:scale-105 active:scale-100 ${ loading ? 'bg-gray-400 cursor-not-allowed' :white rounded-xl p-6 shadow-xl max-w-3xl 'bg-gradient-to-r from-cyan-500 to-blue- mx-auto border border-slate-700"> <MarkdownRenderer content={summary} className="prose-invert prose-sm" isDark={600 hover:from-cyan-600 hover:to-true} /> </div> </div> )}
                        {summary && summary.startsWith("[") && !error.includes("Summary generation failed") && ( <div className="mb-12 max-w-3xl mx-auto"><blue-700'}`}>
                                {loading ? ( <> <LoadingAlert type="warning" title="Verdict Issue" message={summary} /></div>Spinner /> <span className="ml-3">Analysing...</span> </> ) )}

                        {/* Detailed Analysis Section */}
                        {responses.length > : ( <> <SparklesIcon className="w-5 h-5 mr 0 && (
                            <div className="border-t border-gray-2"/> Get Objective Analysis</> )}
                             </button>
                         -200 pt-10">
                                <h2 className="</div>
                    </div>
                )}

                 {/* Conditional Rendering: Results Viewtext-2xl md:text-3xl font-bold text-slate-800 mb-8 text-center tracking-tight">Detailed Analysis */}
                {view === 'results' && (
                    <div className="bg-slate-50 px-6 md:px-10 Perspectives</h2>
                                {/* Tab Buttons */}
                                <div className="flex justify-center flex-wrap gap-3 sm:gap-4 mb-10 border-b border-gray-300 pb-4">
 py-10 border-t border-gray-200/80">
                        {/* Error Display */}
                        {error && <div                                     {responses.map((r) => ( r.response && !r.response.startsWith("[Error") && <button key={r.persona} onClick={() className="mb-10 max-w-3xl mx-auto"><Alert type={error.includes("partially completed") || error.includes(" => handleSelectPersona(r.persona)} className={`px-5 py-failed") ? "warning" : "error"} message={error} /></div>2 text-sm font-medium rounded-full transition-all duration-200 ease-in-out focus:outline-none focus:ring-}

                        {/* Paraphrase Section */}
                        {paraphrase && !paraphrase.startsWith("[") && (
                            <div className2 focus:ring-cyan-500 focus:ring-offset-="mb-10 max-w-3xl mx-auto text-center">
                                <h3 className="text-xs font-semibold text2 whitespace-nowrap transform hover:scale-103 active:scale-1-gray-500 uppercase tracking-widest mb-2">Your Situation Summary</h3>
                                {/* **FIX 2:** Escaped double quotes */}
                               00 ${ selectedPersona === r.persona ? 'bg-gradient-to-r from-cyan-500 to-blue-600 <blockquote className="text-base italic text-gray-700 bg text-white shadow-lg ring-2 ring-offset-1 ring-cyan-slate-100 p-4 rounded-lg border border-slate-2-300 scale-105' : 'text-slate-700 shadow-inner">
                                    "{paraphrase00 bg-white hover:bg-slate-200 border border}"
                                </blockquote>
                            </div>
                         )}
                        {paraphrase && paraphrase.startsWith("[") && !error.includes("Par-slate-300' }`}> {r.persona.split('(')[0].trim()} </button> ))}
                                 </div>
                                {/* Selected Detail Card Container */}
                                <div ref={detailViewRef} className={`transition-opacityaphrase generation failed") && ( <div className="mb-10 max duration-300 ease-in-out ${isSwitchingPersona ?-w-3xl mx-auto"><Alert type="warning" title="Context Summary Issue" message="Could not generate situation summary." /></div> )}

 'opacity-30' : 'opacity-100'}`} >                        {/* The Quick Verdict (Summary) Section */}
                        {summary &&
                                    {selectedResponse && !selectedResponse.response.startsWith("[Error") && ( !summary.startsWith("[") && ( <div className="mb-12 border-t border-gray-200 pt-10"> < <div key={selectedPersona} className="bg-white rounded-2xl p-6 md:p-8 shadow-xl border border-gray-h2 className="text-2xl md:text-3xl font-200/80 max-w-3xl mx-auto animate-fadeIn mb-10"> <h3 className="text-xl fontbold text-slate-800 mb-6 text-center tracking-tight">The Quick Verdict</h2> <div className="bg-slate-800 text--semibold text-transparent bg-clip-text bg-gradient-to-white rounded-xl p-6 shadow-xl max-w-3xlr from-cyan-600 to-blue-700 mb mx-auto border border-slate-700"> <MarkdownRenderer content-5">{selectedResponse.persona}</h3> <div className="text-[1={summary} className="prose-invert prose-sm" isDark={true} /> </div> </div> )}
                        {summary && summary.startsWith5px] leading-relaxed text-slate-800 space-y-4"> <MarkdownRenderer content={selectedResponse.response} isDark={("[") && !error.includes("Summary generation failed") && ( <divfalse} /> </div> </div> )}
                                 </div>
                            </div>
                        )}

                        {/* Restart Button */}
                        <div className="mt className="mb-12 max-w-3xl mx-auto"><Alert type="warning" title="Verdict Issue" message={summary} /></div>-12 text-center border-t border-gray-200 )}

                        {/* Detailed Analysis Section */}
                        {responses.length > 0 && (
                            <div className="border-t border-gray pt-10">
                              <button onClick={handleRestart} className="-200 pt-10">
                                <h2 className="text-2xl md:text-3xl font-bold text-slateinline-flex items-center justify-center px-10 py-3 border border-gray-400 text-base font-medium rounded--800 mb-8 text-center tracking-tight">Detailed Analysis Perspectives</h2>
                                {/* Tab Buttons */}
                                <div className="flex justifyxl shadow-sm text-slate-800 bg-white hover:-center flex-wrap gap-3 sm:gap-4 mb-10 border-b border-gray-300 pb-4">
                                     {responses.map((r) => ( r.response && !bg-slate-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-50r.response.startsWith("[Error") && <button key={r.persona} onClick={()0 transition duration-150 ease-in-out transform hover:scale-1 => handleSelectPersona(r.persona)} className={`px-5 py-03 active:scale-100">
                                Analyse Another Situation
                            </button>
                        </div>
                    </div>
                )}

                 {2 text-sm font-medium rounded-full transition-all duration-2/* Fallback if view state is somehow invalid */}
                 {view !== '00 ease-in-out focus:outline-none focus:ring-input' && view !== 'results' && view !== 'loading' && (2 focus:ring-cyan-500 focus:ring-offset-2 whitespace-nowrap transform hover:scale-103 active:scale-10
                    <div className="p-12 text-center text-red-600 ${ selectedPersona === r.persona ? 'bg-gradient-to-0">Internal application error: Invalid view state. Please refresh.</div>
                 r from-cyan-500 to-blue-600 text)}

            </div> {/* End Main Content Card */}

             <footer className="-white shadow-lg ring-2 ring-offset-1 ring-cyantext-center mt-16 text-gray-600 text-sm px-4"> © {new Date().getFullYear()} Am I Being Unreasonable?-300 scale-105' : 'text-slate-7™ | AI Analysis Tool | For informational purposes only. Use results critically. 00 bg-white hover:bg-slate-200 border border</footer>
             {/* Global Styles */}
             <style jsx global>{`-slate-300' }`}> {r.persona.split('(')[0].trim()} </button> ))}
                                 </div>
                                {/* Selected @keyframes fadeIn { from { opacity: 0; transform: translateY(1 Detail Card Container */}
                                <div ref={detailViewRef} className={`transition-opacity duration-300 ease-in-out ${isSwitch0px); } to { opacity: 1; transform: translateY(0); } } .animate-fadeIn { animation: fadeIn 0.4singPersona ? 'opacity-30' : 'opacity-100 ease-out forwards; } @keyframes gradient-xy { 0%, 100% { background-position: 0% 50%;'}`} >
                                    {selectedResponse && !selectedResponse.response. } 50% { background-position: 100% startsWith("[Error") && ( <div key={selectedPersona} className="bg50%; } } .animate-gradient-xy { background-size:-white rounded-2xl p-6 md:p-8 shadow- 300% 300%; animation: gradient-xy xl border border-gray-200/80 max-w-18s ease infinite; } `}</style>
        </div>
    );
}