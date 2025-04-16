// Helper Function to Clean Response Text
export const cleanResponseText = (text) => {
    if (!text || typeof text !== 'string') return '';

    // Keywords/phrases to remove from the beginning of lines (case-insensitive)
    const keysToRemove = [
        "CORE_DYNAMIC:",
        "CONCLUSION:",
        "FINAL_CONCLUSION:",
        "STRATEGY_EFFECTIVENESS:",
        "VERDICT:"
        // Add any other specific prefixes you want removed here
    ];

    const lines = text.split('\n');
    const cleanedLines = lines.map(line => {
        const trimmedLine = line.trim();
        for (const key of keysToRemove) {
            // Check if the trimmed line starts with the key (case-insensitive)
            if (trimmedLine.toUpperCase().startsWith(key.toUpperCase())) {
                // Find the actual length of the matched key in the original case (or use key.length)
                const keyLength = key.length;
                // Remove the key and any leading whitespace after it
                return trimmedLine.substring(keyLength).trimStart();
            }
        }
        // If no key matches, return the original line (it might still be trimmed later if empty)
        return line;
    });

    // Filter out any lines that became empty after cleaning and join back, then trim final result
    return cleanedLines.filter(line => line.trim().length > 0).join('\n').trim();
};

// Add other utility functions here if needed