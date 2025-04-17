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
        <div className="bg-slate-800/60 backdrop-blur-lg shadow-2xl rounded-3xl overflow-hidden border border-slate-700/60">
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-900/80 via-gray-900/70 to-slate-800/80 backdrop-blur-sm pt-8 pb-10 px-10 text-center shadow-lg border-b border-slate-700/40">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-cyan-400 tracking-tight pb-2">
                    Am I Being Unreasonable?
                </h1>
                <p className="text-lg text-slate-400 mt-3 max-w-2xl mx-auto">
                    Describe your situation and let our AI panel offer perspectives.
                </p>
            </div>

            {/* Form Area */}
            <form onSubmit={handleSubmit} className="px-6 md:px-10 py-10 space-y-8">
                {/* Context Input */}
                <div className="space-y-3">
                    <label htmlFor="context" className="block text-lg font-semibold text-slate-100 mb-3">
                        <DocumentTextIcon /> Describe the Situation:
                    </label>
                    <div className="relative">
                         <textarea
                            id="context"
                            name="context"
                            rows="8"
                            className="block w-full px-4 py-3 rounded-xl bg-slate-700/50 border border-slate-600/70 text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition duration-150 ease-in-out text-base leading-relaxed shadow-inner disabled:opacity-60"
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
                    <label htmlFor="queryOption" className="block text-lg font-semibold text-slate-100 mb-3">
                       <ChatBubbleLeftEllipsisIcon /> What specific question do you want analysed?
                    </label>
                    <select
                        id="queryOption"
                        name="queryOption"
                        className="block w-full px-4 py-3 rounded-xl bg-slate-700/50 border border-slate-600/70 text-slate-200 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition duration-150 ease-in-out text-base shadow-inner disabled:opacity-60" // Added text-slate-200
                        value={selectedQueryOption}
                        onChange={handleQueryDropdownChange}
                        disabled={loading}
                        required
                    >
                        {(queryOptions || []).map(option => (
                            <option key={option.value} value={option.value} disabled={option.value === ''} className="text-black bg-white"> {/* Attempt to style options (might not work everywhere) */}
                                {option.label}
                            </option>
                        ))}
                    </select>

                    {selectedQueryOption === 'other' && (
                        <input
                            type="text"
                            id="customQuery"
                            name="customQuery"
                            className="mt-3 block w-full px-4 py-3 rounded-xl bg-slate-700/50 border border-slate-600/70 text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition duration-150 ease-in-out text-base shadow-inner disabled:opacity-60"
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
                         className="h-4 w-4 rounded border-slate-500 text-cyan-600 focus:ring-cyan-500 bg-slate-600 disabled:opacity-60"
                         checked={skipFollowUpQuestions}
                         onChange={(e) => setSkipFollowUpQuestions(e.target.checked)}
                         disabled={loading}
                     />
                     <label htmlFor="skipFollowUp" className="text-sm text-slate-400">
                         Skip optional follow-up questions (faster, potentially less nuanced analysis)
                     </label>
                 </div>

                {/* Error Display */}
                {error && (
                    <Alert type="error" title="Input Error" message={error} />
                )}

                {/* Submit Button */}
                <div className="text-center pt-4">
                    <button
                        type="submit"
                        disabled={loading}
                        className="inline-flex items-center justify-center px-10 py-4 text-lg font-semibold text-white bg-gradient-to-r from-cyan-500 to-blue-600 border border-transparent rounded-full shadow-lg hover:from-cyan-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 focus:ring-offset-slate-800 transform transition hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <>
                                <LoadingSpinner className="h-5 w-5 mr-3" />
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