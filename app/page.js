"use client";
import { useState, useEffect, useRef, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import { cleanResponseText } from '../lib/utils'; // Import the function

// --- Components ---

const LoadingSpinner = ({ className = "h-5 w-5 text-white" }) => ( // Added default className
    <svg className={`animate-spin ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

// Alert component - Renders plain text message
const Alert = ({ type = 'error', title, message }) => {
    const colors = {
        error: 'bg-red-900/40 border-red-600/70 text-red-200',
        warning: 'bg-yellow-900/40 border-yellow-600/70 text-yellow-200',
        info: 'bg-blue-900/40 border-blue-600/70 text-blue-200', // Added info style
    };
    const displayMessage = typeof message === 'string' && message.trim() !== '' ? message : "An unspecified error occurred or no details were provided.";
    return (
        <div className={`border-l-4 p-4 rounded-lg shadow-sm ${colors[type] || colors.info}`} role="alert">
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


// *** UPDATED LoadingScreen Messages - More Personality, Wit & UK English ***
const LoadingScreen = ({ isApiComplete, isTakingLong }) => {
    // Messages while the AI panel deliberates your dilemma... with personality!
    const regularLoadingMessages = [
        "Right then, let's have a proper look at this...",
        "Firing up the Judgement Engine™...",
        "Analysing the precise levels of 'cheek' involved...", // UK English
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
        "Okay, deep breaths... analysing the core issue.", // UK English
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
        "High levels of 'Well, actually...' detected. Deep analysis required.", // UK English
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
        "Performing multi-dimensional awkwardness analysis.", // UK English
        "This scenario has more twists than a curly wurly. We need a mo'.",
        "Recalibrating our perspective engines for this unique challenge.",
        "Don't fret, we haven't forgotten you – just ensuring a top-tier judgement.",
        "Seems simple on the surface, but oh boy, the undercurrents! Analysing...", // UK English
        "Our 'Hmmmm' indicators are off the charts. Requires further thought.",
        "Activating the 'Is there a backstory we're missing?' protocol.",
        "This is taking a bit longer because, frankly, it's fascinating.",
        "Confirming resource allocation... Yep, throwing more AI brainpower at it.",
        "Nearly cracked it... just polishing the final verdict."
    ];
    const [loadingText, setLoadingText] = useState("Initiating analysis..."); // UK English
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

    return (
       <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-black to-slate-800 z-50 flex flex-col items-center justify-center p-8 text-center overflow-hidden">
           <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-black to-indigo-900 animate-gradient-xy opacity-80"></div>
           <div className="relative z-10 flex flex-col items-center justify-center w-full max-w-md">
               <svg className="animate-spin h-12 w-12 text-cyan-400 mb-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                   <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                   <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
               </svg>
               <h2 className="text-3xl font-bold text-white mb-4 tracking-tight">Analysing Your Situation...</h2>
               <div className="w-full bg-slate-700 rounded-full h-2.5 mb-6 overflow-hidden">
                   <div
                       className={`bg-gradient-to-r from-cyan-400 to-blue-500 h-2.5 rounded-full ${progress < 100 ? 'transition-all duration-200 ease-linear' : 'transition-width duration-300 ease-out'} ${isTakingLong && !isApiComplete ? 'animate-pulse-bar' : ''}`}
                       style={{ width: `${progress}%` }}
                   ></div>
               </div>
               <p className="text-lg text-slate-400 transition-opacity duration-500 ease-in-out h-12">{loadingText}</p>
           </div>
       </div>
   );
};


const IconWrapper = ({ children }) => <span className="inline-block mr-2 text-slate-400">{children}</span>;
const DocumentTextIcon = () => <IconWrapper><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg></IconWrapper>;
const ChatBubbleLeftEllipsisIcon = () => <IconWrapper><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-3.03 8.25-6.75 8.25a9.753 9.753 0 0 1-4.75-1.195A9.753 9.753 0 0 1 3 12c0-4.556 3.03-8.25 6.75-8.25a9.753 9.753 0 0 1 4.75 1.195A9.753 9.753 0 0 1 21 12Z" /></svg></IconWrapper>;
const SparklesIcon = ({className="w-5 h-5 inline-block"}) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L1.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" /></svg>;
const ArrowRightIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 ml-1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" /></svg>; // Added for CTA button
const PaperAirplaneIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" /></svg>; // Added for follow-up send
const ChatBubbleOvalLeftEllipsisIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 inline-block mr-1.5 align-text-bottom"><path strokeLinecap="round" strokeLinejoin="round" d="M18 12.75H6M21 12.75c0 5.25-4.75 9.75-10.5 9.75S0 18 0 12.75C0 7.5 4.75 3 10.5 3S21 7.5 21 12.75Z" /></svg>; // Added for follow-up button

// Animated Placeholder Component
const AnimatedPlaceholder = ({ isActive }) => {
    const [displayText, setDisplayText] = useState('');
    const [isTyping, setIsTyping] = useState(true);
    const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
    const [currentCharIndex, setCurrentCharIndex] = useState(0);
    const animationRef = useRef(null);

    // Example phrases to cycle through
    const examplePhrases = [
        "My flatmate never does the washing up...",
        "My partner spent our savings without telling me...",
        "I refused to attend my cousin's destination wedding...",
        "I told my friend her new haircut doesn't suit her...",
        "My neighbor keeps parking in my designated spot..."
    ];

    const resetAnimation = useCallback(() => {
        if (animationRef.current) {
            clearTimeout(animationRef.current);
        }
        setDisplayText('');
        setCurrentCharIndex(0);
        setIsTyping(true);
    }, []);

    // Handle typing animation
    useEffect(() => {
        if (!isActive) {
            resetAnimation();
            return;
        }

        const currentPhrase = examplePhrases[currentPhraseIndex];

        if (isTyping) {
            // Typing forward
            if (currentCharIndex < currentPhrase.length) {
                animationRef.current = setTimeout(() => {
                    setDisplayText(currentPhrase.substring(0, currentCharIndex + 1));
                    setCurrentCharIndex(prev => prev + 1);
                }, 80); // Typing speed
            } else {
                // Pause at the end of typing before starting to delete
                animationRef.current = setTimeout(() => {
                    setIsTyping(false);
                }, 2000); // Pause duration
            }
        } else {
            // Deleting
            if (currentCharIndex > 0) {
                animationRef.current = setTimeout(() => {
                    setDisplayText(currentPhrase.substring(0, currentCharIndex - 1));
                    setCurrentCharIndex(prev => prev - 1);
                }, 50); // Deleting speed (faster than typing)
            } else {
                // Move to next phrase
                const nextPhraseIndex = (currentPhraseIndex + 1) % examplePhrases.length;
                setCurrentPhraseIndex(nextPhraseIndex);
                setIsTyping(true);
            }
        }

        return () => {
            if (animationRef.current) {
                clearTimeout(animationRef.current);
            }
        };
    }, [isActive, currentCharIndex, currentPhraseIndex, isTyping, examplePhrases, resetAnimation]);

    if (!isActive) return null;

    return (
        <div className="absolute inset-0 pointer-events-none flex items-start p-4">
            <div className="text-slate-500 text-xl font-light animate-pulse-slow">
                {displayText}
                <span className="inline-block w-0.5 h-5 bg-slate-400 ml-0.5 animate-blink"></span>
            </div>
        </div>
    );
};

// --- Main Page Component ---
export default function Home() {
    // State management
    const [context, setContext] = useState('');
    const [shareableLink, setShareableLink] = useState(''); // State for the generated share link
    const [isSharing, setIsSharing] = useState(false); // State for share button loading
    const [copySuccess, setCopySuccess] = useState(''); // State for copy-to-clipboard feedback
    // *** State for query handling ***
    const [selectedQueryOption, setSelectedQueryOption] = useState(''); // Stores the value of the selected dropdown option
    const [customQuery, setCustomQuery] = useState(''); // Stores text only if "Other..." is selected
    const [queryToSend, setQueryToSend] = useState(''); // The final query string to be sent to API

    // *** State for follow-up questions ***
    const [followUpQuestions, setFollowUpQuestions] = useState([]);
    const [followUpAnswers, setFollowUpAnswers] = useState({});
    const [isGeneratingFollowUps, setIsGeneratingFollowUps] = useState(false);
    const [skipFollowUpQuestions, setSkipFollowUpQuestions] = useState(false); // New state to track if user wants to skip follow-ups

    const [responses, setResponses] = useState([]);
    const [summary, setSummary] = useState('');
    const [paraphrase, setParaphrase] = useState('');
    const [error, setError] = useState(null);
    const [view, setView] = useState('input');
    const [loading, setLoading] = useState(false);
    const [hasAnalysed, setHasAnalysed] = useState(false);
    const [selectedPersona, setSelectedPersona] = useState(null);
    const [isSwitchingPersona, setIsSwitchingPersona] = useState(false);
    const [isApiComplete, setIsApiComplete] = useState(false);
    const [isTakingLong, setIsTakingLong] = useState(false);
    const longLoadTimeoutRef = useRef(null);
    const detailViewRef = useRef(null); // Ref for detailed view card
    const resultsSectionRef = useRef(null); // Ref for scrolling to results

    // --- State for Follow-up Conversation (Added Here) ---
    const [followUpPersonaId, setFollowUpPersonaId] = useState(null); // ID of the persona locked for follow-up
    const [followUpQuestion, setFollowUpQuestion] = useState(''); // Current question input
    const [followUpConversation, setFollowUpConversation] = useState([]); // Array of { question: string, answer: string }
    const [isFollowUpLoading, setIsFollowUpLoading] = useState(false); // Loading state for follow-up API call
    const [followUpError, setFollowUpError] = useState(null); // Error state for follow-up API call
    const followUpEndRef = useRef(null); // Ref to scroll to the end of the conversation

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

// *** Function to generate follow-up questions ***
const generateFollowUpQuestions = async () => {
    console.log("generateFollowUpQuestions triggered");
    const finalQuery = queryToSend.trim();

    // Basic validation (already done in askAI, but good practice)
    if (!context.trim() || context.trim().length < 10) {
        setError("Context needed (min 10 chars).");
        return false;
    }
    if (!finalQuery || finalQuery.length < 5) {
        setError("Question needed (min 5 chars). Select an option or type your own.");
        return false;
    }

    setError(null);
    setIsGeneratingFollowUps(true);

    try {
        console.log("Sending request to generate follow-up questions");
        const res = await fetch('/api/generateFollowUpQuestions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ context, query: finalQuery })
        });

        if (!res.ok) {
            const errorText = await res.text();
            console.error(`Follow-up questions API error ${res.status}:`, errorText);
            let detail = errorText;
            try {
                const jsonError = JSON.parse(errorText);
                detail = jsonError.error || errorText;
            } catch (parseErr) { /* ignore */ }
            throw new Error(`Server error: ${res.status} ${res.statusText || ''}. ${String(detail).substring(0, 100)}`);
        }

        const data = await res.json();
        console.log("Follow-up questions received:", data);

        if (data.questions && Array.isArray(data.questions) && data.questions.length > 0) {
            setFollowUpQuestions(data.questions);
            // Initialize answers object with empty strings
            const initialAnswers = {};
            data.questions.forEach((q, index) => {
                initialAnswers[index] = '';
            });
            setFollowUpAnswers(initialAnswers);

            // Since askAI now checks skipFollowUpQuestions *before* calling this,
            // if we get here, we always intend to show the follow-up view.
            setView('followup');
            return true; // Indicate success in generating questions

        } else {
            // No questions generated by the API. Instead of erroring, proceed directly to analysis.
            console.log("No follow-up questions generated by API, proceeding directly to analysis.");
            // We need to trigger the analysis from here since askAI expects this function
            // to either set the view or trigger the next step.
            await proceedToAnalysis({}); // Pass empty answers
            return false; // Indicate that follow-up questions were *not* successfully generated/shown, but analysis was triggered. askAI should stop.
        }
    } catch (err) {
        console.error("Error generating follow-up questions:", err);
        setError(`Failed to generate follow-up questions: ${err.message || 'Unknown error'}`);
        return false;
    } finally {
        setIsGeneratingFollowUps(false);
    }
};

// *** Handle follow-up answer changes ***
const handleFollowUpAnswerChange = (index, value) => {
    setFollowUpAnswers(prev => ({
        ...prev,
        [index]: value
    }));
};

// *** New function to proceed directly to analysis ***
const proceedToAnalysis = async (answers = followUpAnswers) => {
    console.log("proceedToAnalysis triggered");
    const finalQuery = queryToSend.trim();

    console.log("Resetting states...");
    setError(null); setResponses([]); setSummary(''); setParaphrase(''); setSelectedPersona(null);
    setIsApiComplete(false); setIsTakingLong(false); setLoading(true); setView('loading');
    console.log("State set to 'loading'");

    if (longLoadTimeoutRef.current) clearTimeout(longLoadTimeoutRef.current);
    const LONG_LOAD_THRESHOLD = 22000;
    longLoadTimeoutRef.current = setTimeout(() => { console.log("Long load threshold reached"); setIsTakingLong(true); }, LONG_LOAD_THRESHOLD);

    // Prepare follow-up responses to send to API
    // Use the potentially empty followUpQuestions state
    const followUpResponses = followUpQuestions.map((question, index) => ({
        question,
        answer: answers[index] || ''
    }));

    let apiError = null; let apiData = null;
    try {
        console.log("Sending request to API with query:", finalQuery);
        console.log("Including follow-up responses:", followUpResponses);
        const res = await fetch('/api/getResponses', {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({
                 context,
                 query: finalQuery,
                 followUpResponses // Send even if empty
             })
        });

        // Rest of the API call handling...
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
        setTimeout(() => {
            console.log("Setting loading=false, view='results'");
            setLoading(false);
            setView('results');
            setHasAnalysed(true);
            // Scroll to results after setting view
            requestAnimationFrame(() => {
                resultsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            });
        }, 400);
    }

    return true; // Indicate analysis was attempted
};

// *** Main function to trigger analysis (handles follow-up check) ***
const askAI = async () => {
    console.log("askAI triggered");
    const finalQuery = queryToSend.trim();

    // Validation
    if (!context.trim() || context.trim().length < 10) {
        setError("Please provide more detail about the situation (min 10 characters).");
        return;
    }
    if (!finalQuery || finalQuery.length < 5) {
        setError("Please select a question or type your specific query (min 5 characters).");
        return;
    }

    setError(null); // Clear previous errors

    // Check if user wants to skip follow-up questions
    if (skipFollowUpQuestions) {
        console.log("Skipping follow-up questions, proceeding directly to analysis.");
        await proceedToAnalysis({}); // Proceed with empty answers
    } else {
        console.log("Attempting to generate follow-up questions.");
        // Attempt to generate follow-up questions.
        // generateFollowUpQuestions will either set view='followup' or call proceedToAnalysis itself.
        await generateFollowUpQuestions();
    }
};

// *** Handle Restart ***
const handleRestart = () => {
    console.log("handleRestart triggered");
    setContext('');
    setSelectedQueryOption('');
    setCustomQuery('');
    setQueryToSend('');
    setResponses([]);
    setSummary('');
    setParaphrase('');
    setError(null);
    setView('input');
    setLoading(false);
    setHasAnalysed(false);
    setSelectedPersona(null);
    setShareableLink('');
    setIsSharing(false);
    setCopySuccess('');
    setIsApiComplete(false);
    setIsTakingLong(false);
    if (longLoadTimeoutRef.current) clearTimeout(longLoadTimeoutRef.current);
    // Reset follow-up states
    setFollowUpQuestions([]);
    setFollowUpAnswers({});
    setIsGeneratingFollowUps(false);
    setSkipFollowUpQuestions(false);
    // Reset follow-up conversation states
    setFollowUpPersonaId(null);
    setFollowUpQuestion('');
    setFollowUpConversation([]);
    setIsFollowUpLoading(false);
    setFollowUpError(null);
};

// *** Handle Persona Selection in Results View ***
const handleSelectPersona = (persona) => {
    if (persona === selectedPersona || isSwitchingPersona) return;
    setIsSwitchingPersona(true);
    if (detailViewRef.current) {
        detailViewRef.current.classList.remove('animate-fadeIn');
        void detailViewRef.current.offsetWidth; // Trigger reflow
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
        }, 50); // Short delay for state update
    }, 150); // Delay for fade out animation
};

// --- Follow-up Conversation Handlers (Added Here) ---

// Scroll to bottom of follow-up conversation when it updates
useEffect(() => {
    followUpEndRef.current?.scrollIntoView({ behavior: "smooth" });
}, [followUpConversation]);

// Function to initiate follow-up
const handleStartFollowUp = (personaId) => {
    setFollowUpPersonaId(personaId);
    setFollowUpConversation([]); // Reset conversation history
    setFollowUpError(null); // Clear previous errors
    setFollowUpQuestion(''); // Clear any lingering input
};

// Function to send follow-up question
const handleSendFollowUp = async (e) => {
    e.preventDefault(); // Prevent default form submission
    if (!followUpQuestion.trim() || !followUpPersonaId || isFollowUpLoading) return;

    setIsFollowUpLoading(true);
    setFollowUpError(null);
    const currentQuestion = followUpQuestion; // Capture question before clearing input

    try {
        const res = await fetch('/api/askFollowUp', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                question: currentQuestion,
                personaId: followUpPersonaId,
                // Send current context and query directly instead of ID
                context: context,
                query: queryToSend,
                history: followUpConversation // Send history for context
            }),
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
};


// --- Share Functionality ---
const handleShare = async () => {
    if (!responses.length && !summary) {
        setError("Nothing to share yet. Please analyse a situation first.");
        return;
    }
    setIsSharing(true);
    setCopySuccess('');
    setError(null); // Clear previous errors

    try {
        // Prepare data for saving (include follow-up Q&A if available)
        const resultsData = {
            context,
            query: queryToSend, // Use the final query sent
            responses,
            summary,
            paraphrase,
            timestamp: new Date().toISOString(),
            // Include the original follow-up questions and the answers provided
            followUpResponses: followUpQuestions.map((question, index) => ({
                question,
                answer: followUpAnswers[index] || '' // Use stored answers
            }))
        };

        console.log("Sending data to saveResults API:", resultsData);

        const res = await fetch('/api/saveResults', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(resultsData)
        });

        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.error || `Failed to save results (status ${res.status})`);
        }

        const { id } = await res.json();
        const link = `${window.location.origin}/results/${id}`;
        setShareableLink(link);
        console.log("Share link generated:", link);

        // Attempt to copy to clipboard
        try {
            await navigator.clipboard.writeText(link);
            setCopySuccess('Link copied to clipboard!');
        } catch (copyError) {
            console.warn("Failed to copy link automatically:", copyError);
            setCopySuccess('Link generated! (Copy manually)'); // Indicate success but copy failure
        }

    } catch (err) {
        console.error("Error sharing results:", err);
        setError(`Failed to create shareable link: ${err.message}`);
        setShareableLink(''); // Clear link on error
    } finally {
        setIsSharing(false);
    }
};

// --- Helper to find selected response object ---
const selectedResponse = responses.find(r => r?.persona === selectedPersona);

// --- Helper to clean summary text (copied from results page) ---
// NOTE: This is different from cleanResponseText used for persona responses
const cleanSummaryText = (text) => {
    if (!text || typeof text !== 'string') return '';
    const keysToRemove = ["VERDICT:"];
    const lines = text.split('\n');
    const cleanedLines = lines.map(line => {
        const trimmedLine = line.trim();
        for (const key of keysToRemove) {
            if (trimmedLine.toUpperCase().startsWith(key.toUpperCase())) {
                const keyLength = key.length;
                return trimmedLine.substring(keyLength).trimStart();
            }
        }
        return line;
    });
    return cleanedLines.filter(line => line.trim().length > 0).join('\n').trim();
};

// --- Helper to extract verdict parts (copied from results page) ---
const extractVerdictParts = (cleanedSummary) => {
    if (!cleanedSummary || typeof cleanedSummary !== 'string') return null;
    const firstParagraphBreakIndex = cleanedSummary.indexOf('\n\n');
    let headline = '';
    let after = '';
    if (firstParagraphBreakIndex !== -1) {
        headline = cleanedSummary.substring(0, firstParagraphBreakIndex).trim();
        after = cleanedSummary.substring(firstParagraphBreakIndex).trim();
    } else {
        headline = cleanedSummary.trim();
        after = '';
    }
    if (headline) { return { headline, after }; }
    return null;
};

const finalCleanedSummary = cleanSummaryText(summary);
const verdictParts = extractVerdictParts(finalCleanedSummary);


// --- Render Logic ---
return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black text-slate-200 font-sans antialiased relative overflow-x-hidden">
        {/* Loading Overlay */}
        {view === 'loading' && <LoadingScreen isApiComplete={isApiComplete} isTakingLong={isTakingLong} />}

        {/* Main Content Area */}
        <main className={`container mx-auto px-4 py-12 sm:py-16 transition-opacity duration-500 ease-in-out ${view === 'loading' ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>

            {/* --- INPUT VIEW --- */}
            {view === 'input' && (
                <div className="max-w-3xl mx-auto bg-slate-800/60 backdrop-blur-lg shadow-2xl rounded-3xl p-8 sm:p-12 border border-slate-700/60">
                    <h1 className="text-4xl sm:text-5xl font-bold text-center mb-3 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-cyan-400 tracking-tight">Am I Being Unreasonable?</h1>
                    <p className="text-center text-slate-400 mb-10 text-lg">Get instant, multi-perspective AI analysis on your situation.</p>

                    <form onSubmit={(e) => { e.preventDefault(); askAI(); }} className="space-y-8">
                        {/* Context Input */}
                        <div className="relative">
                            <label htmlFor="context" className="block text-lg font-semibold text-slate-100 mb-2">1. Describe the situation:</label>
                            <p className="text-sm text-slate-400 mb-3">Be specific! Include relevant details, what happened, and who was involved. (Min 10 chars)</p>
                            <div className="relative">
                                <textarea
                                    id="context"
                                    value={context}
                                    onChange={(e) => setContext(e.target.value)}
                                    placeholder="" // Placeholder handled by AnimatedPlaceholder
                                    rows="8"
                                    className="block w-full bg-slate-700/50 border border-slate-600/70 rounded-xl shadow-inner p-4 text-lg text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition duration-150 ease-in-out resize-none relative z-10" // Ensure textarea is above placeholder
                                    required
                                    minLength="10"
                                />
                                <AnimatedPlaceholder isActive={!context} />
                            </div>
                        </div>

                        {/* Query Selection/Input */}
                        <div>
                            <label htmlFor="query-select" className="block text-lg font-semibold text-slate-100 mb-2">2. What's your specific question or worry?</label>
                            <p className="text-sm text-slate-400 mb-3">Select a common question or type your own. (Min 5 chars)</p>
                            <select
                                id="query-select"
                                value={selectedQueryOption}
                                onChange={handleQueryOptionChange}
                                className="block w-full bg-slate-700/50 border border-slate-600/70 rounded-xl shadow-inner p-4 text-lg text-slate-100 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition duration-150 ease-in-out mb-3 appearance-none pr-8 bg-no-repeat bg-right-3"
                                style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2394a3b8' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 1rem center', backgroundSize: '1.5em 1.5em' }}
                            >
                                {queryOptions.map(option => (
                                    <option key={option.value} value={option.value} className="bg-slate-800 text-slate-100">
                                        {option.label}
                                    </option>
                                ))}
                            </select>

                            {selectedQueryOption === 'other' && (
                                <input
                                    type="text"
                                    value={customQuery}
                                    onChange={handleCustomQueryChange}
                                    placeholder="Type your specific question here..."
                                    className="block w-full bg-slate-700/50 border border-slate-600/70 rounded-xl shadow-inner p-4 text-lg text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition duration-150 ease-in-out"
                                    required
                                    minLength="5"
                                />
                            )}
                        </div>

                        {/* Submit Button */}
                        <div className="text-center pt-4">
                            <button
                                type="submit"
                                disabled={loading || isGeneratingFollowUps || !context.trim() || context.trim().length < 10 || !queryToSend.trim() || queryToSend.trim().length < 5}
                                className="inline-flex items-center justify-center px-10 py-4 text-xl font-bold text-white bg-gradient-to-r from-cyan-500 to-blue-600 border border-transparent rounded-full shadow-lg hover:from-cyan-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 focus:ring-offset-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transform transition hover:scale-105"
                            >
                                {loading || isGeneratingFollowUps ? <LoadingSpinner className="h-6 w-6 mr-3" /> : <SparklesIcon className="w-6 h-6 mr-2" />}
                                Analyse My Situation
                            </button>
                        </div>

                        {/* Error Display */}
                        {error && !loading && (
                            <div className="mt-6">
                                <Alert type="error" title="Input Error" message={error} />
                            </div>
                        )}
                    </form>
                </div>
            )}

            {/* --- FOLLOW-UP QUESTIONS VIEW --- */}
            {view === 'followup' && (
                 <div className="max-w-3xl mx-auto bg-slate-800/60 backdrop-blur-lg shadow-2xl rounded-3xl p-8 sm:p-12 border border-slate-700/60">
                    <h2 className="text-3xl font-bold text-center mb-4 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-cyan-400 tracking-tight">Just a Few More Details...</h2>
                    <p className="text-center text-slate-400 mb-8 text-lg">Answering these helps the AI understand the nuances better. Feel free to skip if they aren't relevant.</p>

                    <div className="space-y-6">
                        {followUpQuestions.map((question, index) => (
                            <div key={index}>
                                <label htmlFor={`followup-${index}`} className="block text-md font-medium text-slate-200 mb-2">{index + 1}. {question}</label>
                                <textarea
                                    id={`followup-${index}`}
                                    value={followUpAnswers[index] || ''}
                                    onChange={(e) => handleFollowUpAnswerChange(index, e.target.value)}
                                    rows="3"
                                    placeholder="Your answer here (optional)..."
                                    className="block w-full bg-slate-700/50 border border-slate-600/70 rounded-xl shadow-inner p-3 text-base text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition duration-150 ease-in-out resize-none"
                                />
                            </div>
                        ))}
                    </div>

                    <div className="flex flex-col sm:flex-row justify-center gap-4 mt-10">
                         <button
                            onClick={() => proceedToAnalysis(followUpAnswers)} // Pass current answers
                            disabled={loading}
                            className="inline-flex items-center justify-center px-8 py-3 text-lg font-semibold text-white bg-gradient-to-r from-cyan-500 to-blue-600 border border-transparent rounded-full shadow-lg hover:from-cyan-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 focus:ring-offset-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transform transition hover:scale-105"
                        >
                            {loading ? <LoadingSpinner className="h-5 w-5 mr-2" /> : <SparklesIcon className="w-5 h-5 mr-2" />}
                            Proceed to Analysis
                        </button>
                         <button
                            onClick={() => proceedToAnalysis({})} // Pass empty object to indicate skip
                            disabled={loading}
                            className="px-8 py-3 text-lg font-semibold text-slate-300 bg-slate-700/60 border border-slate-600 rounded-full shadow-sm hover:bg-slate-600/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 focus:ring-offset-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transform transition hover:scale-105"
                        >
                            Skip & Analyse Anyway
                        </button>
                    </div>
                     {error && !loading && (
                        <div className="mt-6">
                            <Alert type="error" title="Error" message={error} />
                        </div>
                    )}
                </div>
            )}


            {/* --- RESULTS VIEW --- */}
            {view === 'results' && hasAnalysed && (
                <div ref={resultsSectionRef} className="max-w-5xl mx-auto bg-slate-800/60 backdrop-blur-lg shadow-2xl rounded-3xl overflow-hidden border border-slate-700/60 animate-fadeInUp">
                    {/* Header Section */}
                    <div className="bg-gradient-to-r from-slate-900/80 via-gray-900/70 to-slate-800/80 backdrop-blur-sm pt-6 sm:pt-8 pb-8 sm:pb-10 px-10 sm:px-12 text-center shadow-lg border-b border-slate-700/40">
                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-cyan-400 tracking-tight pb-2">Analysis Results</h1>
                        <p className="text-sm text-slate-400 mt-2 max-w-2xl mx-auto">Here's what our AI panel thinks about your situation.</p>
                    </div>

                    {/* Main Results Content */}
                    <div className="bg-transparent px-6 md:px-10 py-10">
                        {/* Error Display within Results */}
                        {error && (
                            <div className="mb-8 max-w-3xl mx-auto">
                                <Alert type="warning" title="Analysis Issue" message={error} />
                            </div>
                        )}

                        <div className='space-y-10 md:space-y-12'>
                            {/* Original Context & Query Display */}
                            <div className="max-w-3xl mx-auto">
                                <h3 className="text-lg font-semibold text-slate-100 mb-3 flex items-center"><DocumentTextIcon />The Situation You Described</h3>
                                <div className="p-4 text-sm border border-slate-600/50 rounded-xl bg-slate-700/30 text-slate-300 whitespace-pre-wrap">
                                    {context || "No context provided."}
                                </div>
                                <h3 className="text-lg font-semibold text-slate-100 mt-8 mb-4 flex items-center"><ChatBubbleLeftEllipsisIcon />Your Specific Question</h3>
                                <div className="p-5 text-base border border-cyan-600/50 rounded-xl bg-cyan-900/20 text-cyan-100 font-medium shadow-inner">
                                    {queryToSend || "No specific question was analysed."}
                                </div>
                                {/* Display Follow-up Q&A if they were answered */}
                                {followUpQuestions.length > 0 && Object.values(followUpAnswers).some(ans => ans && ans.trim() !== '') && (
                                    <div className="mt-6">
                                        <h4 className="text-base font-semibold text-slate-200 mb-3">Your Follow-up Answers:</h4>
                                        <div className="space-y-3 text-sm">
                                            {followUpQuestions.map((q, index) => (
                                                followUpAnswers[index] && followUpAnswers[index].trim() !== '' && (
                                                    <div key={index} className="p-3 border border-slate-600/40 rounded-lg bg-slate-700/20">
                                                        <p className="font-medium text-slate-300 mb-1">Q: {q}</p>
                                                        <p className="text-slate-400 whitespace-pre-wrap">A: {followUpAnswers[index]}</p>
                                                    </div>
                                                )
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Verdict Section */}
                            {finalCleanedSummary && !finalCleanedSummary.startsWith("[") && (
                                <div className="border-t border-slate-700/40 pt-10 md:pt-12">
                                    <h2 className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-cyan-400 mb-6 text-center tracking-tight">The Quick Verdict</h2>
                                    <div className="bg-white text-slate-900 rounded-xl p-6 shadow-lg max-w-3xl mx-auto border border-slate-300">
                                        {verdictParts ? (
                                            <div>
                                                <div className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold p-3 rounded-lg mb-4 shadow-md">
                                                    <MarkdownRenderer content={verdictParts.headline} className="prose-sm prose-strong:text-white prose-p:text-white" isDark={true} />
                                                </div>
                                                {verdictParts.after && (
                                                     <MarkdownRenderer content={verdictParts.after} className="prose-sm" isDark={false} />
                                                )}
                                            </div>
                                        ) : (
                                            <MarkdownRenderer content={finalCleanedSummary} className="prose-sm" isDark={false} />
                                        )}
                                    </div>
                                </div>
                            )}
                            {summary && summary.startsWith("[") && !error && ( <div className="max-w-3xl mx-auto"> <Alert type="warning" title="Verdict Issue" message="Could not generate the final verdict summary." /> </div> )}


                            {/* Detailed Perspectives Section */}
                            {Array.isArray(responses) && responses.some(r => r?.response && !r.response.startsWith("[")) && (
                                <div className="border-t border-slate-700/40 pt-10 md:pt-12">
                                    <h2 className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-cyan-400 mb-8 text-center tracking-tight">Detailed Analysis Perspectives</h2>
                                    {/* Persona Selection Buttons */}
                                    <div className="flex justify-center flex-wrap gap-3 sm:gap-4 mb-10 border-b border-slate-700/40 pb-6">
                                         {responses.map((r) => ( r?.response && !r.response.startsWith("[") && <button key={r.persona} onClick={() => handleSelectPersona(r.persona)} className={`px-5 py-2 text-sm font-medium rounded-full transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-slate-800 whitespace-nowrap transform hover:scale-103 active:scale-100 ${ selectedPersona === r.persona ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg ring-2 ring-offset-1 ring-cyan-400 scale-105' : 'text-slate-200 bg-slate-700/40 hover:bg-slate-600/60 border border-slate-600/60' }`} > {r.persona.split('(')[0].trim()} </button> ))}
                                     </div>
                                    {/* Detailed View & Follow-up Area */}
                                    <div ref={detailViewRef} className={`transition-opacity duration-300 ease-in-out ${isSwitchingPersona ? 'opacity-30' : 'opacity-100'}`} >
                                        {selectedResponse && !selectedResponse.response.startsWith("[") && (
                                            <div key={selectedPersona} className="bg-white text-slate-900 rounded-2xl p-6 md:p-8 shadow-xl border border-slate-300 max-w-3xl mx-auto animate-fadeIn mb-10">
                                                <h3 className="text-xl font-semibold text-slate-800 mb-5">
                                                    {selectedResponse.persona}
                                                </h3>
                                                <div className="text-[15px] leading-relaxed space-y-4">
                                                    {/* Use cleanResponseText here */}
                                                    <MarkdownRenderer content={cleanResponseText(selectedResponse.response)} isDark={false} />
                                                </div>

                                                {/* --- Follow-up Section (Integrated Here) --- */}
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
                                         {!selectedResponse && Array.isArray(responses) && responses.some(r => r?.response && !r.response.startsWith("[")) && ( <div className="text-center text-slate-500 italic mt-4">Select a perspective above to view details.</div> )}
                                     </div>
                                </div>
                            )}
                            {/* Fallback message if no valid responses */}
                            {(!Array.isArray(responses) || !responses.some(r => r?.response && !r.response.startsWith("["))) && !error && ( <div className="text-center text-slate-400 py-10"> No analysis could be generated for this input. </div> )}


                            {/* Share and Restart Buttons */}
                            <div className="text-center border-t border-slate-700/40 pt-10 md:pt-12 space-y-6">
                                {/* Share Section */}
                                <div>
                                    <h3 className="text-xl font-semibold text-slate-100 mb-4">Share these results?</h3>
                                    <button
                                        onClick={handleShare}
                                        disabled={isSharing}
                                        className="inline-flex items-center justify-center px-6 py-3 text-base font-medium text-white bg-gradient-to-r from-purple-500 to-indigo-600 border border-transparent rounded-full shadow-lg hover:from-purple-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-slate-800 disabled:opacity-60 disabled:cursor-not-allowed transform transition hover:scale-105"
                                    >
                                        {isSharing ? <LoadingSpinner className="h-5 w-5 mr-2" /> : <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2"><path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z" /></svg>}
                                        {isSharing ? 'Generating Link...' : 'Create Shareable Link'}
                                    </button>
                                    {shareableLink && (
                                        <div className="mt-4 max-w-xl mx-auto">
                                            <input
                                                type="text"
                                                readOnly
                                                value={shareableLink}
                                                className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500"
                                                onClick={(e) => e.target.select()}
                                            />
                                            {copySuccess && <p className="text-sm text-green-400 mt-2">{copySuccess}</p>}
                                        </div>
                                    )}
                                </div>

                                {/* Restart Button */}
                                <div>
                                    <button
                                        onClick={handleRestart}
                                        className="px-8 py-3 text-lg font-semibold text-slate-300 bg-slate-700/60 border border-slate-600 rounded-full shadow-sm hover:bg-slate-600/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 focus:ring-offset-slate-800 transform transition hover:scale-105"
                                    >
                                        Analyse Another Situation
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </main>

        {/* Footer */}
        <footer className={`text-center mt-16 pb-8 text-slate-500 text-sm px-4 transition-opacity duration-500 ease-in-out ${view === 'loading' ? 'opacity-0' : 'opacity-100'}`}>
            © {new Date().getFullYear()} Am I Being Unreasonable?™ | AI Analysis Tool | For informational purposes only. Use results critically.
        </footer>

        {/* Global Styles/Animations */}
        <style jsx global>{`
            @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
            .animate-fadeInUp { animation: fadeInUp 0.6s ease-out forwards; }
            @keyframes gradient-background { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
            .animate-gradient-bg { background-size: 200% 200%; animation: gradient-background 25s ease infinite; }
            @keyframes gradient-xy { 0%, 100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
            .animate-gradient-xy { background-size: 200% 200%; animation: gradient-xy 15s ease infinite; }
            @keyframes pulse-bar { 0%, 100% { opacity: 1; } 50% { opacity: 0.7; } }
            .animate-pulse-bar { animation: pulse-bar 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
            @keyframes blink { 50% { opacity: 0; } }
            .animate-blink { animation: blink 1s step-end infinite; }
            .animate-pulse-slow { animation: pulse 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
        `}</style>
    </div>
);
}