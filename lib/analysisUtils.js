/**
 * Removes specific key prefixes (case-insensitive) from the start of lines in a given text.
 * Also filters out empty lines resulting from key removal and trims the final result.
 *
 * @param {string | null | undefined} text The input text.
 * @returns {string} The cleaned text.
 */
export const cleanResponseText = (text) => {
    if (!text || typeof text !== 'string') return '';

    const keysToRemove = [
        "CORE_DYNAMIC:",
        "CONCLUSION:",
        "FINAL_CONCLUSION:",
        "STRATEGY_EFFECTIVENESS:",
        "VERDICT:" // Also include VERDICT here for consistency
    ];

    const lines = text.split('\n');
    const cleanedLines = lines.map(line => {
        const trimmedLine = line.trim();
        for (const key of keysToRemove) {
            // Case-insensitive check if the trimmed line starts with the key
            if (trimmedLine.toUpperCase().startsWith(key.toUpperCase())) {
                // Find the length of the actual key match (could differ in case)
                const keyLength = key.length;
                // Remove the key and any immediate whitespace after it
                return trimmedLine.substring(keyLength).trimStart();
            }
        }
        // If no key matched, return the original line (it might be empty or just whitespace)
        return line;
    });

    // Join back, filter out potentially empty lines resulting from key removal, and trim the final result
    return cleanedLines.filter(line => line.trim().length > 0).join('\n').trim();
};

/**
 * Extracts the first sentence of the verdict headline, the rest of the headline,
 * and the remaining text from a cleaned summary.
 * Assumes the input `cleanedSummary` has potentially had prefixes like "VERDICT:" removed.
 *
 * @param {string | null | undefined} cleanedSummary The summary text, ideally pre-processed by cleanResponseText.
 * @returns {{firstSentence: string, restOfHeadline: string, after: string} | null} An object with parts, or null if input is invalid/empty.
 */
export const extractVerdictParts = (cleanedSummary) => {
    if (!cleanedSummary || typeof cleanedSummary !== 'string') return null;

    // 1. Split into headline (first paragraph) and the rest
    const firstParagraphBreakIndex = cleanedSummary.indexOf('\n\n');
    let headline = '';
    let after = '';

    if (firstParagraphBreakIndex !== -1) {
        headline = cleanedSummary.substring(0, firstParagraphBreakIndex).trim();
        after = cleanedSummary.substring(firstParagraphBreakIndex).trim();
    } else {
        headline = cleanedSummary.trim(); // Entire cleaned summary is the headline
        after = '';
    }

    if (!headline) {
        return null; // Return null if headline is empty
    }

    // 2. Split the headline into first sentence and the rest
    let firstSentence = '';
    let restOfHeadline = '';

    // Find the index of the first sentence-ending punctuation followed by a space or end of string
    const sentenceEndMatch = headline.match(/([.?!])(\s+|$)/);
    let sentenceEndIndex = -1;

    if (sentenceEndMatch) {
        // Include the punctuation in the first sentence
        sentenceEndIndex = sentenceEndMatch.index + sentenceEndMatch[1].length;
    }

    if (sentenceEndIndex !== -1 && sentenceEndIndex < headline.length) {
        firstSentence = headline.substring(0, sentenceEndIndex).trim();
        restOfHeadline = headline.substring(sentenceEndIndex).trim();
    } else {
        // If no sentence end found, or it's at the very end, the whole headline is the first sentence
        firstSentence = headline;
        restOfHeadline = '';
    }

    // Return all parts
    return {
        firstSentence: firstSentence,
        restOfHeadline: restOfHeadline,
        after: after
    };
};