import React from 'react';
import Alert from '../ui/Alert';
import AnimatedPlaceholder from '../ui/AnimatedPlaceholder'; // Import the placeholder
import LoadingSpinner from '../ui/LoadingSpinner'; // For button loading state

// Import specific icons needed for this section
import { DocumentTextIcon, ChatBubbleLeftEllipsisIcon, SparklesIcon } from '../ui/Icons';

const InputSection = ({
    context, setContext,
    selectedQueryOption, handleQueryOptionChange,
    customQuery, handleCustomQueryChange,
    queryOptions, // Receive query options as prop
    skipFollowUpQuestions, setSkipFollowUpQuestions,
    askAI,
    loading, // Combined loading state (analysis or follow-up generation)
    error,
    setError, // Allow clearing error on input change
}) => {

    const handleContextChange = (e) => {
        setContext(e.target.value);
        if (error) setError(null); // Clear error when user starts typing
    };

    const handleQueryDropdownChange = (e) => {
        handleQueryOptionChange(e);
         if (error) setError(null); // Clear error on change
    };

     const handleCustomQueryInputChange = (e) => {
        handleCustomQueryChange(e);
         if (error) setError(null); // Clear error on change
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        askAI(); // Call the askAI function passed from the hook via page.js
    };

    return (
        // Removed animated-border-gradient, restored static border border-white/10
        <div className="bg-secondary/40 backdrop-blur-lg shadow-xl rounded-3xl overflow-hidden border border-white/10">
            {/* Header - Use background and border colors */}
            <div className="bg-gradient-to-r from-background/80 via-gray-900/70 to-background/80 backdrop-blur-sm pt-8 pb-10 px-10 text-center shadow-lg border-b border-border/40">
                {/* Use primary color in gradient */}
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary via-teal-300 to-primary tracking-tight pb-2">
                    Am I Being Unreasonable?
                </h1>
                {/* Use secondary foreground color */}
                <p className="text-lg text-secondary-foreground mt-3 max-w-2xl mx-auto">
                    Describe your situation and let our AI panel offer perspectives.
                </p>
            </div>

            {/* Form Area */}
            <form onSubmit={handleSubmit} className="px-6 md:px-10 py-10 space-y-8">
                {/* Context Input */}
                <div className="space-y-3">
                    {/* Use foreground color for label */}
                    <label htmlFor="context" className="block text-lg font-semibold text-foreground mb-3">
                        <DocumentTextIcon /> Describe the Situation:
                    </label>
                    <div className="relative">
                         <textarea
                            id="context"
                            name="context"
                            rows="8"
                            // Added hover:border-border
                            className="block w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border/70 text-foreground placeholder-secondary-foreground focus:ring-2 focus:ring-primary focus:border-primary hover:border-border transition duration-150 ease-in-out text-base leading-relaxed shadow-inner disabled:opacity-60"
                            placeholder="" // Placeholder text is handled by AnimatedPlaceholder
                            value={context}
                            onChange={handleContextChange}
                            disabled={loading}
                            required
                            minLength="10"
                        />
                        {/* Animated Placeholder shown only when context is empty and not loading */}
                        <AnimatedPlaceholder isActive={!context && !loading} />
                    </div>
                </div>

                {/* Query Selection/Input */}
                <div className="space-y-3">
                     {/* Use foreground color for label */}
                    <label htmlFor="queryOption" className="block text-lg font-semibold text-foreground mb-3">
                       <ChatBubbleLeftEllipsisIcon /> What specific question do you want analysed?
                    </label>
                    <select
                        id="queryOption"
                        name="queryOption"
                        // Added hover:border-border
                        className="block w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border/70 text-foreground focus:ring-2 focus:ring-primary focus:border-primary hover:border-border transition duration-150 ease-in-out text-base shadow-inner disabled:opacity-60"
                        value={selectedQueryOption}
                        onChange={handleQueryDropdownChange}
                        disabled={loading}
                        required
                    >
                        {(queryOptions || []).map(option => (
                            // Use background/foreground for options (browser support varies)
                            <option key={option.value} value={option.value} disabled={option.value === ''} className="text-background bg-foreground">
                                {option.label}
                            </option>
                        ))}
                    </select>

                    {selectedQueryOption === 'other' && (
                        <input
                            type="text"
                            id="customQuery"
                            name="customQuery"
                            // Added hover:border-border
                            className="mt-3 block w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border/70 text-foreground placeholder-secondary-foreground focus:ring-2 focus:ring-primary focus:border-primary hover:border-border transition duration-150 ease-in-out text-base shadow-inner disabled:opacity-60"
                            placeholder="Enter your specific question..."
                            value={customQuery}
                            onChange={handleCustomQueryInputChange}
                            disabled={loading}
                            required
                            minLength="5"
                        />
                    )}
                </div>

                 {/* Skip Follow-up Option */}
                 <div className="flex items-center space-x-3">
                     <input
                         id="skipFollowUp"
                         name="skipFollowUp"
                         type="checkbox"
                         // Use border, primary, secondary colors.
                         className="h-4 w-4 rounded border-border text-primary focus:ring-primary bg-secondary disabled:opacity-60"
                         checked={skipFollowUpQuestions}
                         onChange={(e) => setSkipFollowUpQuestions(e.target.checked)}
                         disabled={loading}
                     />
                      {/* Use secondary foreground color */}
                     <label htmlFor="skipFollowUp" className="text-sm text-secondary-foreground">
                         Skip optional follow-up questions (faster, potentially less nuanced analysis)
                     </label>
                 </div>

                {/* Error Display */}
                {error && (
                    // Alert component updated separately
                    <Alert type="error" title="Input Error" message={error} />
                )}

                {/* Submit Button */}
                <div className="text-center pt-4">
                    <button
                        type="submit"
                        disabled={loading}
                        // Added hover:shadow-[0_0_20px_theme(colors.primary.DEFAULT)] for glow effect
                        className="inline-flex items-center justify-center px-10 py-4 text-lg font-semibold text-white bg-gradient-to-r from-primary to-accent border border-transparent rounded-full shadow-lg hover:from-primary-hover hover:to-primary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary focus:ring-offset-background transform transition hover:scale-105 hover:shadow-[0_0_20px_theme(colors.primary.DEFAULT)] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <>
                                {/* Ensure spinner contrasts with button */}
                                <LoadingSpinner className="h-5 w-5 mr-3 text-white" />
                                Analysing...
                            </>
                        ) : (
                            <>
                                <SparklesIcon className="w-5 h-5 mr-2" />
                                Analyse My Situation
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default InputSection;