"use client";
import React, { useRef, useCallback, lazy, Suspense } from 'react';
import { useRouter } from 'next/navigation'; // Import useRouter

// Import Hooks
import { useAnalysis } from '../hooks/useAnalysis'; // Revert to extensionless import
import { useFollowUpQuestions } from '../hooks/useFollowUpQuestions';
// Removed useFollowUpChat and useSharing imports

// Import Shared UI Components
import Alert from '../components/ui/Alert';
import LoadingScreen from '../components/ui/LoadingScreen';
import LoadingSpinner from '../components/ui/LoadingSpinner'; // For Suspense fallback

// Lazy load section components
const InputSection = lazy(() => import('../components/home/InputSection'));
const FollowUpQuestionsSection = lazy(() => import('../components/home/FollowUpQuestionsSection'));
// Removed ResultsSection import

// --- Main Page Component ---
export default function Home() {
    const router = useRouter(); // Get router instance

    // Instantiate Hooks
    const {
        // State needed by FollowUpQuestions hook
        followUpQuestions,
        followUpAnswers,
        // Handlers needed by FollowUpQuestions hook
        handleFollowUpAnswerChange,
        generateFollowUpQuestions,
        resetFollowUpQuestionsState,
        // State needed by InputSection
        isGeneratingFollowUps, // Needed for combined loading state
        skipFollowUpQuestions,
        // State Setters needed by InputSection
        setSkipFollowUpQuestions,
    } = useFollowUpQuestions();

    // Pass router and necessary functions from follow-up hook to useAnalysis
    const {
        // State needed for InputSection & LoadingScreen
        context,
        selectedQueryOption,
        customQuery,
        queryToSend,
        error,
        loading,
        isTakingLong,
        view, // Controls which section is visible ('input', 'loading', 'followup')
        // State Setters needed by InputSection & FollowUpQuestionsSection
        setContext,
        setError,
        setView,
        // Handlers needed by InputSection & FollowUpQuestionsSection
        handleQueryOptionChange,
        handleCustomQueryChange,
        askAI,
        handleRestart: handleAnalysisRestart, // Renamed from useAnalysis hook
        proceedToAnalysisAndSave, // Renamed from useAnalysis hook
    } = useAnalysis({
        router, // Pass router for redirection
        getFollowUpAnswers: () => followUpAnswers, // Provide function to get answers
        followUpQuestions, // Pass questions for saving
    });


    // Combine restart actions
    const handleRestart = useCallback(() => {
        handleAnalysisRestart(); // Resets analysis state (context, query, error, loading, view)
        resetFollowUpQuestionsState(); // Resets follow-up state
        // No chat or sharing state to reset here anymore
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [handleAnalysisRestart, resetFollowUpQuestionsState]);

    // Prepare props for lazy-loaded components
    const inputSectionProps = {
        context, setContext,
        selectedQueryOption, handleQueryOptionChange,
        customQuery, handleCustomQueryChange,
        queryToSend,
        skipFollowUpQuestions, setSkipFollowUpQuestions,
        askAI: () => askAI( // Pass wrapped askAI with dependencies
            // Pass the actual generateFollowUpQuestions function from its hook
            generateFollowUpQuestions,
            skipFollowUpQuestions
        ),
        loading: loading || isGeneratingFollowUps, // Combined loading state
        error,
        setError,
    };

    const followUpQuestionsSectionProps = {
        followUpQuestions,
        followUpAnswers,
        handleFollowUpAnswerChange,
        // Pass the renamed proceed function which now saves and redirects
        proceedToAnalysis: proceedToAnalysisAndSave,
        isGeneratingFollowUps,
        error,
    };

    // Define query options here or move to a constants file
    const queryOptions = [
        { value: '', label: 'Select a question or type your own...' },
        { value: 'Am I being unreasonable?', label: 'Am I being unreasonable?' },
        { value: 'Am I in the wrong?', label: 'Am I in the wrong?' },
        { value: 'AITA?', label: 'AITA?' }, // Am I the Asshole?
        { value: 'Was my reaction justified?', label: 'Was my reaction justified?' },
        { value: 'What perspective am I missing?', label: 'What perspective am I missing?' },
        { value: 'other', label: 'Other (Type below)...' }
    ];
    // Pass queryOptions down to InputSection
    inputSectionProps.queryOptions = queryOptions;


    // Suspense Fallback UI
    const renderSuspenseFallback = () => (
        <div className="flex justify-center items-center min-h-[400px]">
            {/* Use primary color for spinner */}
            <LoadingSpinner className="h-10 w-10 text-primary" />
            {/* Use secondary foreground for text */}
            <p className="ml-4 text-lg text-secondary-foreground">Loading Section...</p>
        </div>
    );

    return (
        // Apply subtle gradient background instead of solid bg-background
        <main className="min-h-screen bg-gradient-to-br from-background to-secondary/10 py-12 sm:py-16 px-4 sm:px-6 lg:px-8 font-sans antialiased text-foreground">
            {/* Loading screen covers everything when loading */}
            {loading && view === 'loading' && <LoadingScreen isApiComplete={false} isTakingLong={isTakingLong} />}

            <div className="max-w-4xl mx-auto">
                {/* Render sections based on view state */}
                <Suspense fallback={renderSuspenseFallback()}>
                    {/* Show InputSection if view is 'input' */}
                    {view === 'input' && <InputSection {...inputSectionProps} />}
                    {/* Show FollowUpQuestionsSection if view is 'followup' */}
                    {view === 'followup' && <FollowUpQuestionsSection {...followUpQuestionsSectionProps} />}
                    {/* Results are no longer displayed here, user is redirected */}
                </Suspense>

                 {/* Global Error Display (only show if not loading and view is 'input' after an error) */}
                 {error && view === 'input' && !loading && (
                    <div className="mt-8 max-w-3xl mx-auto">
                        {/* Alert component updated separately */}
                        <Alert type="error" title="An Error Occurred" message={error} />
                        {/* Removed the "Start Over" button from here, restart happens via input form */}
                    </div>
                 )}
            </div>
             {/* Use secondary foreground for footer text */}
             <footer className="text-center mt-16 text-secondary-foreground text-sm px-4">
                © {new Date().getFullYear()} Am I Being Unreasonable?™ | AI Analysis Tool | For informational purposes only. Use results critically.
            </footer>
        </main>
    );
}