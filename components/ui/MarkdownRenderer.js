import React, { Fragment } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';

// Define the expected shape of a snippet for type hinting
/**
 * @typedef {object} Snippet
 * @property {string} url
 * @property {string} text
 */

// MarkdownRenderer Component
/**
 * Renders Markdown content with theme-aware styling and citation link handling.
 * @param {object} props
 * @param {string} props.markdown - The Markdown content string.
 * @param {string} [props.className=""] - Additional CSS classes for the container.
 * @param {boolean} [props.isDark=false] - Whether the component is on a dark background.
 * @param {{ url: string; text: string }[]} [props.snippets] - Optional array of snippet objects for citation linking.
 */
const MarkdownRenderer = ({ markdown, className = "", isDark = false, snippets }) => {
    const baseProseClass = "prose prose-sm max-w-none";
    const themeProseClass = isDark ? "prose-invert" : "";

    const textStyles = isDark
        ? "prose-p:text-secondary-foreground prose-strong:text-foreground prose-a:text-primary hover:prose-a:text-primary-hover prose-blockquote:text-secondary-foreground prose-blockquote:border-border prose-code:text-accent prose-headings:text-foreground prose-ul:text-secondary-foreground prose-ol:text-secondary-foreground prose-li:text-secondary-foreground"
        : "prose-p:text-gray-700 prose-strong:text-gray-900 prose-a:text-primary hover:prose-a:text-primary-hover prose-blockquote:text-gray-600 prose-blockquote:border-gray-300 prose-code:text-accent prose-headings:text-gray-800 prose-ul:text-gray-700 prose-ol:text-gray-700 prose-li:text-gray-700";

    const safeMarkdown = typeof markdown === 'string' ? markdown : '';

    // Apply regex replacement on the markdown string
    const processedMarkdown = safeMarkdown
      .replace(/\[(\d+)]/g, (_m, n) => {
        const i = Number(n) - 1;
        const target = snippets?.[i]?.url;
        // Original code that generated HTML:
        return target
          ? `<a href="${target}" target="_blank" rel="noopener noreferrer">[${n}]</a>`
          : `[${n}]`;
      });


    return (
        <div className={`${baseProseClass} ${themeProseClass} ${textStyles} ${className}`}>
            <ReactMarkdown
                rehypePlugins={[rehypeRaw]} // Restored
            >
                {processedMarkdown}
            </ReactMarkdown>
        </div>
    );
};

export default MarkdownRenderer;