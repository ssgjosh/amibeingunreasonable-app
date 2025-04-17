"use client";
import { useRef, useState, useCallback } from 'react'; // Added useState, useCallback
import { useParams } from 'next/navigation';
import Link from 'next/link';

// Import Shared Hooks
import { useSharedResults } from '../../../hooks/useSharedResults'; // Adjust path
import { useFollowUpChat } from '../../../hooks/useFollowUpChat'; // Adjust path

// Import Shared UI Components
import LoadingSpinner from '../../../components/ui/LoadingSpinner'; // Adjust path
import Alert from '../../../components/ui/Alert'; // Adjust path
import MarkdownRenderer from '../../../components/ui/MarkdownRenderer'; // Adjust path
import {
    DocumentTextIcon,
    ChatBubbleLeftEllipsisIcon,
    ArrowRightIcon, // Keep for CTA button
    ChatBubbleOvalLeftEllipsisIcon,
    PaperAirplaneIcon,
    ArrowPathIcon, // Import for Restart button
    ShareIcon // Assuming a share icon exists
} from '../../../components/ui/Icons'; // Adjust path

// Import Shared Utilities
import { cleanResponseText, extractVerdictParts } from '../../../lib/analysisUtils'; // Adjust path

// Placeholder icons if not available in Icons.js
const PlaceholderRestartIcon = () => <span>🔄</span>;
const PlaceholderShareIcon = () => <span>🔗</span>; // Placeholder for Share


// --- Shared Result Page Component ---
export default function SharedResultPage() {
    const params = useParams();
    const id = params.id; // Get ID for fetching and follow-up context
    const detailViewRef = useRef(null); // Ref for persona animation
    const [shareStatus, setShareStatus] = useState(''); // State for share/copy feedback

    // Hook for fetching results and handling persona selection
    const {
        resultsData,
        loading,
        error: resultsError, // Rename to avoid conflict with chat error
        selectedPersona,
        isSwitchingPersona,
        handleSelectPersona
    } = useSharedResults(id, detailViewRef);

    // Hook for handling the follow-up chat functionality
    const {
        followUpPersonaId,
        followUpQuestion,
        followUpConversation,
        isFollowUpLoading,
        followUpError,
        setFollowUpQuestion,
        followUpEndRef, // Ref for scrolling chat
        handleStartFollowUp,
        handleSendFollowUp,
    } = useFollowUpChat({ originalContextId: id }); // Pass ID for context

    // Process data for rendering
    const cleanedSummary = resultsData?.summary ? cleanResponseText(resultsData.summary) : null;
    const verdictParts = cleanedSummary ? extractVerdictParts(cleanedSummary) : null;
    const selectedResponse = resultsData?.responses?.find(r => r?.persona === selectedPersona);
    const validResponses = resultsData?.responses?.filter(r => r?.response && !r.response.startsWith("[")) || [];

    // Web Share API / Clipboard Fallback Logic
    const handleShareClick = useCallback(async () => {
        const shareData = {
            title: 'AI Reasonableness Analysis Result',
            text: `Check out the AI analysis for this situation:`,
            url: window.location.href, // Current page URL
        };
        setShareStatus(''); // Clear previous status

        try {
            if (navigator.share) {
                await navigator.share(shareData);
                console.log('Successfully shared using Web Share API');
                setShareStatus('Shared!'); // Optional feedback
            } else if (navigator.clipboard) {
                await navigator.clipboard.writeText(shareData.url);
                console.log('Link copied to clipboard');
                setShareStatus('Link Copied!');
            } else {
                console.log('Web Share and Clipboard API not supported');
                setShareStatus('Copy link manually.'); // Fallback message
            }
        } catch (err) {
            console.error('Error sharing:', err);
            // Don't show error to user unless it's specific (e.g., share cancelled)
            if (err.name !== 'AbortError') {
                setShareStatus('Could not share.');
            }
        } finally {
            // Optionally clear status after a delay
            setTimeout(() => setShareStatus(''), 3000);
        }
    }, []); // No dependencies needed as it uses window.location

    return (
        <main className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black py-12 sm:py-16 px-4 sm:px-6 lg:px-8 font-sans antialiased text-slate-300 animate-gradient-bg">
            <div className="max-w-5xl mx-auto bg-slate-800/60 backdrop-blur-lg shadow-2xl rounded-3xl overflow-hidden border border-slate-700/60">
                {/* Header */}
                <div className="bg-gradient-to-r from-slate-900/80 via-gray-900/70 to-slate-800/80 backdrop-blur-sm pt-6 sm:pt-8 pb-8 sm:pb-10 px-10 sm:px-12 text-center shadow-lg border-b border-slate-700/40">
                   <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-cyan-400 tracking-tight pb-2">AI Reasonableness Analysis</h1>
                   <p className="text-sm text-slate-400 mt-2 max-w-2xl mx-auto">
                       Someone used the "Am I Being Unreasonable?" AI tool to analyse a situation. Here are the results:
                   </p>
                   {resultsData?.timestamp && (
                       <p className="text-xs text-slate-500 mt-3">Analysis generated on: {new Date(resultsData.timestamp).toLocaleString()}</p>
                   )}
                </div>

                {/* Content Area */}
                <div className="bg-transparent px-6 md:px-10 py-10">
                    {loading && (
                        <div className="flex justify-center items-center py-20">
                            <LoadingSpinner className="h-12 w-12 text-cyan-500" />
                            <p className="ml-4 text-xl text-slate-400">Loading analysis results...</p>
                        </div>
                    )}

                    {resultsError && (
                        <div className="my-10 max-w-3xl mx-auto">
                            <Alert type="error" title="Error Loading Results" message={resultsError} />
                        </div>
                    )}

                    {!loading && !resultsError && !resultsData && (
                         <div className="my-10 max-w-3xl mx-auto">
                            <Alert type="warning" title="Not Found" message="The requested results could not be found. The link may be invalid or the results may have expired." />
                        </div>
                    )}

                    {resultsData && !loading && !resultsError && (
                        <div className='space-y-10 md:space-y-12'>
                            {/* Original Context & Query */}
                            <div className="max-w-3xl mx-auto">
                                <h3 className="text-lg font-semibold text-slate-100 mb-3 flex items-center"><DocumentTextIcon />The Situation Described</h3>
                                <div className="p-4 text-sm border border-slate-600/50 rounded-xl bg-slate-700/30 text-slate-300 whitespace-pre-wrap">
                                    {resultsData.context || "No context provided."}
                                </div>
                                <h3 className="text-lg font-semibold text-slate-100 mt-8 mb-4 flex items-center"><ChatBubbleLeftEllipsisIcon />The Specific Question Analysed</h3>
                                <div className="p-5 text-base border border-cyan-600/50 rounded-xl bg-cyan-900/20 text-cyan-100 font-medium shadow-inner">
                                    {resultsData.query || "No specific question was recorded for this analysis."}
                                </div>
                                {/* Optional: Display Follow-up Q&A */}
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

                            {/* Verdict Section */}
                            {cleanedSummary && !cleanedSummary.startsWith("[") && (
                                <div className="border-t border-slate-700/40 pt-10 md:pt-12">
                                    <h2 className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-cyan-400 mb-6 text-center tracking-tight">The Quick Verdict</h2>
                                    <div className="bg-white text-slate-900 rounded-xl p-6 shadow-lg max-w-3xl mx-auto border border-slate-300">
                                        {verdictParts ? (
                                            <> {/* Use Fragment */}
                                                <div className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold p-3 rounded-lg mb-4 shadow-md">
                                                    <MarkdownRenderer content={verdictParts.firstSentence} className="prose-sm prose-strong:text-white prose-p:text-white" isDark={true} />
                                                </div>
                                                {(verdictParts.restOfHeadline || verdictParts.after) && (
                                                    <div className="mt-4">
                                                        {verdictParts.restOfHeadline && (
                                                            <MarkdownRenderer content={verdictParts.restOfHeadline} className="prose-sm" isDark={false} />
                                                        )}
                                                        {verdictParts.restOfHeadline && verdictParts.after && <div className="h-3"></div>}
                                                        {verdictParts.after && (
                                                             <MarkdownRenderer content={verdictParts.after} className="prose-sm" isDark={false} />
                                                        )}
                                                    </div>
                                                )}
                                            </>
                                        ) : (
                                            <MarkdownRenderer content={cleanedSummary} className="prose-sm" isDark={false} />
                                        )}
                                    </div>
                                </div>
                            )}
                            {resultsData.summary && resultsData.summary.startsWith("[") && (
                                 <div className="max-w-3xl mx-auto pt-10 md:pt-12">
                                    <Alert type="warning" title="Verdict Issue" message="Could not generate the final verdict summary." />
                                 </div>
                            )}

                            {/* Detailed Perspectives Section */}
                            {validResponses.length > 0 && (
                                <div className="border-t border-slate-700/40 pt-10 md:pt-12">
                                    <h2 className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-cyan-400 mb-8 text-center tracking-tight">Detailed Analysis Perspectives</h2>
                                    {/* Persona Selection Buttons */}
                                    <div className="flex justify-center flex-wrap gap-3 sm:gap-4 mb-10 border-b border-slate-700/40 pb-6">
                                         {validResponses.map((r) => (
                                            <button
                                                key={r.persona}
                                                onClick={() => handleSelectPersona(r.persona)}
                                                className={`px-5 py-2 text-sm font-medium rounded-full transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-slate-800 whitespace-nowrap transform hover:scale-103 active:scale-100 ${ selectedPersona === r.persona ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg ring-2 ring-offset-1 ring-cyan-400 scale-105' : 'text-slate-200 bg-slate-700/40 hover:bg-slate-600/60 border border-slate-600/60' }`}
                                            >
                                                {r.persona.split('(')[0].trim()}
                                            </button>
                                         ))}
                                     </div>
                                    {/* Detailed View & Follow-up Area */}
                                    <div ref={detailViewRef} className={`transition-opacity duration-300 ease-in-out ${isSwitchingPersona ? 'opacity-30' : 'opacity-100'}`} >
                                        {selectedResponse && !selectedResponse.response.startsWith("[") ? (
                                            <div key={selectedPersona} className="bg-white text-slate-900 rounded-2xl p-6 md:p-8 shadow-xl border border-slate-300 max-w-3xl mx-auto animate-fadeIn mb-10">
                                                <h3 className="text-xl font-semibold text-slate-800 mb-5">
                                                    {selectedResponse.persona}
                                                </h3>
                                                <div className="text-[15px] leading-relaxed space-y-4">
                                                    <MarkdownRenderer content={cleanResponseText(selectedResponse.response)} isDark={false} />
                                                </div>

                                                {/* --- Follow-up Section --- */}
                                                <div className="mt-8 pt-6 border-t border-slate-200">
                                                    {followUpPersonaId === null && (
                                                        <button
                                                            onClick={() => handleStartFollowUp(selectedResponse.persona)}
                                                            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-cyan-600 to-blue-700 border border-transparent rounded-md shadow-sm hover:from-cyan-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 focus:ring-offset-white"
                                                        >
                                                            <ChatBubbleOvalLeftEllipsisIcon /> Ask follow-up with {selectedResponse.persona.split('(')[0].trim()}
                                                        </button>
                                                    )}
                                                    {followUpPersonaId === selectedResponse.persona && (
                                                        <div className="space-y-6">
                                                            <h4 className="text-lg font-semibold text-slate-700">Continue conversation with {followUpPersonaId.split('(')[0].trim()}:</h4>
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
                                                                {isFollowUpLoading && (
                                                                    <div className="flex items-center justify-center p-3 text-slate-500">
                                                                        <LoadingSpinner className="h-4 w-4 mr-2 text-cyan-600" />
                                                                        <span>Getting response...</span>
                                                                    </div>
                                                                )}
                                                                {followUpError && (
                                                                    <div className="mt-3">
                                                                        <Alert type="error" title="Follow-up Error" message={followUpError} />
                                                                    </div>
                                                                )}
                                                                <div ref={followUpEndRef} />
                                                            </div>
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
                                            </div>
                                        ) : (
                                             <div className="text-center text-slate-500 italic mt-4">
                                                {selectedPersona ? "Loading perspective..." : "Select a perspective above to view details."}
                                             </div>
                                        )}
                                     </div>
                                </div>
                            )}

                            {/* Fallback message */}
                            {!resultsData.summary && validResponses.length === 0 && (
                                 <div className="text-center text-slate-400 py-10 border-t border-slate-700/40 mt-10">
                                    No analysis could be generated for this input.
                                 </div>
                            )}

                            {/* Share and Restart Section */}
                            <div className="border-t border-slate-700/40 pt-10 md:pt-12 flex flex-col sm:flex-row justify-center items-center gap-6">
                                {/* Share Button */}
                                <button
                                    onClick={handleShareClick}
                                    disabled={!resultsData} // Disable if no results data
                                    className="inline-flex items-center justify-center px-6 py-3 text-base font-medium text-white bg-gradient-to-r from-purple-500 to-indigo-600 border border-transparent rounded-full shadow-lg hover:from-purple-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-slate-800 transform transition hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {ShareIcon ? <ShareIcon className="w-5 h-5 mr-2" /> : <PlaceholderShareIcon />}
                                    {shareStatus || 'Share Results'} {/* Show status or default text */}
                                </button>

                                {/* Restart Button */}
                                <Link href="/" legacyBehavior>
                                    <a className="inline-flex items-center justify-center px-8 py-3 text-base font-medium text-slate-300 bg-slate-600/50 border border-slate-500/70 rounded-full shadow-lg hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 focus:ring-offset-slate-800 transform transition hover:scale-105">
                                        {ArrowPathIcon ? <ArrowPathIcon className="w-5 h-5 mr-2" /> : <PlaceholderRestartIcon />} Analyse Another Situation
                                    </a>
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            </div>
             <footer className="text-center mt-16 text-slate-500 text-sm px-4"> © {new Date().getFullYear()} Am I Being Unreasonable?™ | AI Analysis Tool | For informational purposes only. Use results critically. </footer>
             {/* Styles removed, should be in globals.css */}
        </main>
    );
}