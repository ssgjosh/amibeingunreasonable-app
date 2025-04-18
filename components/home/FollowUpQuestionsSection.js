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
        // Format the answers object into an array of {question, answer}
        const formattedAnswers = Object.entries(followUpAnswers)
          .map(([index, answer]) => {
            const questionIndex = parseInt(index, 10);
            // Include only if answer is provided and question exists
            if (!isNaN(questionIndex) && followUpQuestions[questionIndex] && answer && answer.trim()) {
              return { question: followUpQuestions[questionIndex], answer: answer.trim() };
            }
            return null;
          })
          .filter(item => item !== null); // Remove null entries (e.g., unanswered questions)

        // Pass the formatted array to proceedToAnalysis
        proceedToAnalysis(formattedAnswers);
    };

    // Handler for the skip button
    const handleSkip = () => {
        // Proceed directly to analysis with an empty array
        proceedToAnalysis([]);
    };

    // Show loading spinner if questions are still being generated
    if (isGeneratingFollowUps) {
        return (
            <div className="flex justify-center items-center py-20">
                {/* Use primary color for spinner */}
                <LoadingSpinner className="h-12 w-12 text-primary" />
                {/* Use secondary foreground for text */}
                <p className="ml-4 text-xl text-secondary-foreground">Generating clarification questions...</p>
            </div>
        );
    }

    // Show error if generation failed
    if (error) {
         return (
            <div className="my-10 max-w-3xl mx-auto">
                {/* Alert component updated separately */}
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
                {/* Alert component updated separately */}
                <Alert type="info" title="No Clarifications Needed" message="Proceeding directly to analysis..." />
            </div>
        );
    }

    return (
        // Removed animated-border-gradient, restored static border border-white/10
        <div className="bg-secondary/40 backdrop-blur-lg shadow-xl rounded-3xl overflow-hidden border border-white/10">
            {/* Header - Use background and border colors */}
            <div className="bg-gradient-to-r from-background/80 via-gray-900/70 to-background/80 backdrop-blur-sm pt-8 pb-10 px-10 text-center shadow-lg border-b border-border/40">
                 {/* Use primary color in gradient */}
                <h2 className="text-3xl sm:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary via-teal-300 to-primary tracking-tight pb-2">
                    Just a Few More Details... {/* Updated Title */}
                </h2>
                 {/* Use secondary foreground color */}
                <p className="text-lg text-secondary-foreground mt-3 max-w-2xl mx-auto">
                    {/* Updated Subtitle */}
                    Answering these helps the AI understand the nuances better. Feel free to skip if they aren't relevant.
                </p>
            </div>

            {/* Form Area */}
            {/* Use div instead of form for the main container if skip button isn't type="submit" */}
            <div className="px-6 md:px-10 py-10 space-y-8">
                {followUpQuestions.map((question, index) => (
                    <div key={index} className="space-y-3">
                        {/* Use foreground color for label */}
                        <label htmlFor={`followUpAnswer-${index}`} className="block text-base font-medium text-foreground">
                            {index + 1}. {question}
                        </label>
                        <textarea
                            id={`followUpAnswer-${index}`}
                            name={`followUpAnswer-${index}`}
                            rows="3"
                            // Added hover:border-border
                            className="block w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border/70 text-foreground placeholder-secondary-foreground focus:ring-2 focus:ring-primary focus:border-primary hover:border-border transition duration-150 ease-in-out text-base leading-relaxed shadow-inner"
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
                        // Added hover:shadow-[0_0_20px_theme(colors.primary.DEFAULT)] for glow effect
                        className="inline-flex items-center justify-center px-8 py-3 text-base font-semibold text-white bg-gradient-to-r from-primary to-accent border border-transparent rounded-full shadow-lg hover:from-primary-hover hover:to-primary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary focus:ring-offset-background transform transition hover:scale-105 hover:shadow-[0_0_20px_theme(colors.primary.DEFAULT)]"
                    >
                        <SparklesIcon className="w-5 h-5 mr-2" /> {/* Added Icon */}
                        Proceed to Analysis
                    </button>
                    {/* Skip Button */}
                    <button
                        type="button"
                        onClick={handleSkip}
                        // Use foreground text, secondary background, border color, secondary focus ring, background offset.
                        className="inline-flex items-center justify-center px-8 py-3 text-base font-medium text-foreground bg-secondary/50 border border-border/70 rounded-full shadow-lg hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary focus:ring-offset-background transform transition hover:scale-105"
                    >
                        Skip & Analyse Anyway
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FollowUpQuestionsSection;