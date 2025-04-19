/**
 * Utility functions for processing HTML content, shared between snippet retrieval and seeding.
 */
/**
 * Strips HTML tags from a string.
 * Replaces multiple whitespace characters with a single space.
 * @param html The HTML string.
 * @returns The string with HTML tags removed and whitespace normalized.
 */
export function stripHtml(html) {
    if (!html)
        return '';
    // Remove tags and replace multiple whitespace chars with a single space
    return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}
/**
 * Extracts the content of the first <p> tag from an HTML string.
 * Uses a case-insensitive regex.
 * @param html The HTML string.
 * @returns The content of the first <p> tag, or null if not found.
 */
export function extractFirstParagraph(html) {
    if (!html)
        return null;
    // Case-insensitive match for the first <p> tag, capturing content within
    var match = html.match(/<p.*?>([\s\S]*?)<\/p>/i);
    return match ? match[1] : null; // Return content inside the first <p>...</p>
}
/**
 * Truncates text to a specified word count, adding ellipsis if truncated.
 * @param text The text to truncate.
 * @param maxWords The maximum number of words allowed.
 * @returns The truncated text, or the original text if within the limit.
 */
export function truncateWords(text, maxWords) {
    if (!text)
        return '';
    var words = text.trim().split(/\s+/); // Split by whitespace
    if (words.length <= maxWords) {
        return text.trim(); // Return original trimmed text if within limit
    }
    // Join the first maxWords words and add ellipsis
    return words.slice(0, maxWords).join(' ') + '...';
}
