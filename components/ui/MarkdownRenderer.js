import React from 'react';
import ReactMarkdown from 'react-markdown';

// MarkdownRenderer (Handles light/dark based on container)
const MarkdownRenderer = ({ content, className = "", isDark = false }) => {
    const baseProseClass = "prose prose-sm max-w-none";
    // prose-invert is handled by Tailwind based on dark mode, but we override specifics below
    const themeProseClass = isDark ? "prose-invert" : "";

    // Define text styles based on theme colors and isDark prop
    const textStyles = isDark
        ? "prose-p:text-secondary-foreground prose-strong:text-foreground prose-a:text-primary hover:prose-a:text-primary-hover prose-blockquote:text-secondary-foreground prose-blockquote:border-border prose-code:text-accent prose-headings:text-foreground prose-ul:text-secondary-foreground prose-ol:text-secondary-foreground prose-li:text-secondary-foreground" // Dark background styles using theme colors
        : "prose-p:text-gray-700 prose-strong:text-gray-900 prose-a:text-primary hover:prose-a:text-primary-hover prose-blockquote:text-gray-600 prose-blockquote:border-gray-300 prose-code:text-accent prose-headings:text-gray-800 prose-ul:text-gray-700 prose-ol:text-gray-700 prose-li:text-gray-700"; // Light background styles using grays and theme primary/accent

    // Ensure content is a string before rendering
    const safeContent = typeof content === 'string' ? content : '';

    return (
        // Apply base, theme (invert), specific text styles, and any additional className
        <div className={`${baseProseClass} ${themeProseClass} ${textStyles} ${className}`}>
            <ReactMarkdown
                components={{
                    // Apply base styles, specific overrides will come from textStyles string above
                    p: ({ node, ...props }) => <p className="mb-3 last:mb-0" {...props} />,
                    strong: ({ node, ...props }) => <strong className="font-semibold" {...props} />,
                    ul: ({ node, ...props }) => <ul className="list-disc list-inside mb-3 pl-1" {...props} />,
                    ol: ({ node, ...props }) => <ol className="list-decimal list-inside mb-3 pl-1" {...props} />,
                    li: ({ node, ...props }) => <li className="mb-1" {...props} />,
                    a: ({ node, ...props }) => <a className="font-medium underline" {...props} />,
                    blockquote: ({ node, ...props }) => <blockquote className="italic border-l-4 pl-4 my-4" {...props} />,
                    // Use theme colors for code background
                    code: ({ node, ...props }) => <code className={`px-1 py-0.5 rounded text-sm ${isDark ? 'bg-secondary/50' : 'bg-gray-200'}`} {...props} />,
                }}
            >
                {safeContent}
            </ReactMarkdown>
        </div>
    );
};

export default MarkdownRenderer;