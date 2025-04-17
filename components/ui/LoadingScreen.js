import React, { useState, useEffect, useRef } from 'react';

// Define static messages outside the component
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


// *** UPDATED LoadingScreen Messages - More Personality, Wit & UK English ***
const LoadingScreen = ({ isApiComplete, isTakingLong }) => {
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
        // Corrected: Removed message arrays from dependency array
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

export default LoadingScreen;