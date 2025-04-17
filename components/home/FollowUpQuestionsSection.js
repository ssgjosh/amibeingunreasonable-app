import React from 'react';
import Alert from '../ui/Alert';
import LoadingSpinner from '../ui/LoadingSpinner'; // For button loading state
import { SparklesIcon } from '../ui/Icons'; // Import icon for button

const FollowUpQuestionsSection = ({
    followUpQuestions,
    followUpAnswers,
    handleFollowUpAnswerChange,
    proceedToAnalysis, // Function to trigger the next step
    isGeneratingFollowUps, // Loading state specifically for this section/step
    error, // Potential error during generation
}) => {

    const handleSubmit = (e) => {
        e.preventDefault();
        // Pass the current answers to proceedToAnalysis
        proceedToAnalysis(followUpAnswers);
    };

    // Handler for the skip button
    const handleSkip = () => {
        // Proceed directly to analysis with empty answers
        proceedToAnalysis({});
    };

    // Show loading spinner if questions are still being generated
    if (isGeneratingFollowUps) {
        return (
            <div className="flex justify-center items-center py-20">
                <LoadingSpinner className="h-12 w-12 text-cyan-500" />
                <p className="ml-4 text-xl text-slate-400">Generating clarification questions...</p>
            </div>
        );
    }

    // Show error if generation failed
    if (error) {
         return (
            <div className="my-10 max-w-3xl mx-auto">
                <Alert type="error" title="Error Generating Questions" message={error} />
                 {/* Optionally add a retry or skip button here */}
            </div>
        );
    }

    // Ensure questions exist before rendering the form
    // If no questions were generated, the parent component (page.js) should have already called proceedToAnalysis.
    // This state might only be visible briefly or if there's an unexpected delay.
    if (!followUpQuestions || followUpQuestions.length === 0) {
        return (
             <div className="my-10 max-w-3xl mx-auto">
                <Alert type="info" title="No Clarifications Needed" message="Proceeding directly to analysis..." />
            </div>
        );
    }

    return (
        <div className="bg-slate-800/60 backdrop-blur-lg shadow-2xl rounded-3xl overflow-hidden border border-slate-700/60">
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-900/80 via-gray-900/70 to-slate-800/80 backdrop-blur-sm pt-8 pb-10 px-10 text-center shadow-lg border-b border-slate-700/40">
                <h2 className="text-3xl sm:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-cyan-400 tracking-tight pb-2">
                    Just a Few More Details... {/* Updated Title */}
                </h2>
                <p className="text-lg text-slate-400 mt-3 max-w-2xl mx-auto">
                    {/* Updated Subtitle */}
                    Answering these helps the AI understand the nuances better. Feel free to skip if they aren't relevant.
                </p>
            </div>

            {/* Form Area */}
            {/* Use div instead of form for the main container if skip button isn't type="submit" */}
            <div className="px-6 md:px-10 py-10 space-y-8">
                {followUpQuestions.map((question, index) => (
                    <div key={index} className="space-y-3">
                        <label htmlFor={`followUpAnswer-${index}`} className="block text-base font-medium text-slate-200">
                            {index + 1}. {question}
                        </label>
                        <textarea
                            id={`followUpAnswer-${index}`}
                            name={`followUpAnswer-${index}`}
                            rows="3"
                            className="block w-full px-4 py-3 rounded-xl bg-slate-700/50 border border-slate-600/70 text-slate-200 placeholder-slate-400 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition duration-150 ease-in-out text-base leading-relaxed shadow-inner"
                            placeholder="Your answer here (optional)..." // Updated placeholder
                            value={followUpAnswers[index] || ''}
                            onChange={(e) => handleFollowUpAnswerChange(index, e.target.value)}
                        />
                    </div>
                ))}

                {/* Buttons Section */}
                <div className="text-center pt-6 flex flex-col sm:flex-row justify-center items-center gap-4">
                    {/* Proceed Button (acts as submit for answers) */}
                    <button
                        onClick={handleSubmit} // Use onClick instead of form onSubmit if form tag is removed
                        type="button" // Change type if not using form onSubmit
                        className="inline-flex items-center justify-center px-8 py-3 text-base font-semibold text-white bg-gradient-to-r from-cyan-500 to-blue-600 border border-transparent rounded-full shadow-lg hover:from-cyan-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 focus:ring-offset-slate-800 transform transition hover:scale-105"
                    >
                        <SparklesIcon className="w-5 h-5 mr-2" /> {/* Added Icon */}
                        Proceed to Analysis
                    </button>
                    {/* Skip Button */}
                    <button
                        type="button"
                        onClick={handleSkip}
                        className="inline-flex items-center justify-center px-8 py-3 text-base font-medium text-slate-300 bg-slate-600/50 border border-slate-500/70 rounded-full shadow-lg hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 focus:ring-offset-slate-800 transform transition hover:scale-105"
                    >
                        Skip & Analyse Anyway
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FollowUpQuestionsSection;