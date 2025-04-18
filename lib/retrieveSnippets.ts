import { Redis } from '@upstash/redis';

// Define the sources for different domains
const SOURCES: Record<string, string[]> = {
  parenting: [
    "https://www.nhs.uk/conditions/baby/support-and-services/services-and-support-for-parents/", // Placeholder - replace with actual relevant URLs if known
    "https://www.citizensadvice.org.uk/family/children-and-young-people/parental-rights-and-responsibilities/" // Placeholder
  ],
  tenancy: [
    "https://www.citizensadvice.org.uk/housing/repairs-in-rented-housing/repairs-what-are-the-landlords-responsibilities/",
    "https://england.shelter.org.uk/housing_advice/repairs/landlord_and_tenant_responsibilities_for_repairs"
  ],
  workplace: [
    "https://www.acas.org.uk/disciplinary-procedure-step-by-step",
    "https://www.acas.org.uk/grievance-procedure-step-by-step"
  ]
};

// Initialize Redis client from environment variables
// Assumes STORAGE_REDIS_URL, STORAGE_KV_REST_API_TOKEN, STORAGE_KV_REST_API_URL are set
let redis: Redis | null = null;
try {
    redis = Redis.fromEnv();
    console.log("Redis client initialized successfully for snippet retrieval.");
} catch (error) {
    console.error("Failed to initialize Redis client from environment variables:", error);
    // Depending on requirements, you might want to throw here or handle gracefully
}


/**
 * Strips HTML tags from a string.
 * @param html The HTML string.
 * @returns The string with HTML tags removed.
 */
function stripHtml(html: string): string {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, '');
}

/**
 * Extracts the content of the first <p> tag from an HTML string.
 * @param html The HTML string.
 * @returns The content of the first <p> tag, or null if not found.
 */
function extractFirstParagraph(html: string): string | null {
    if (!html) return null;
    // Changed regex: Replaced '.' with '[\s\S]' and removed 's' flag for compatibility
    const match = html.match(/<p>([\s\S]*?)<\/p>/i); // Case-insensitive, [\s\S] matches any char including newline
    return match ? match[1] : null; // Return the captured group
}

/**
 * Truncates text to a specified word count.
 * @param text The text to truncate.
 * @param maxWords The maximum number of words.
 * @returns The truncated text.
 */
function truncateWords(text: string, maxWords: number): string {
    if (!text) return '';
    const words = text.trim().split(/\s+/);
    if (words.length <= maxWords) {
        return text.trim();
    }
    return words.slice(0, maxWords).join(' ') + '...';
}


/**
 * Retrieves relevant text snippets for a given domain, using caching.
 * @param domain The domain (e.g., 'parenting', 'tenancy', 'workplace').
 * @returns A promise that resolves to an array of up to two snippets (max 80 words each).
 */
export async function retrieveSnippets(domain: string): Promise<string[]> {
    if (!redis) {
        console.error("retrieveSnippets: Redis client not available.");
        return [];
    }
    if (!domain || !SOURCES[domain]) {
        console.warn(`retrieveSnippets: Invalid or unknown domain requested: ${domain}`);
        return [];
    }

    const urls = SOURCES[domain].slice(0, 2); // Get max 2 URLs
    const snippets: string[] = [];
    const cacheTTL = 86400; // 24 hours in seconds

    for (const url of urls) {
        const cacheKey = `snippet:${domain}:${url}`;
        let snippet: string | null = null;

        try {
            // 1. Check cache
            snippet = await redis.get<string>(cacheKey);
            if (snippet) {
                console.log(`retrieveSnippets: Cache HIT for ${cacheKey}`);
                snippets.push(snippet);
                continue; // Move to next URL if cache hit
            }

            console.log(`retrieveSnippets: Cache MISS for ${cacheKey}. Fetching ${url}...`);

            // 2. Fetch external URL
            const response = await fetch(url, {
                headers: { 'User-Agent': 'AmIBeingUnreasonable-Bot/1.0' } // Be polite
            });

            if (!response.ok) {
                console.error(`retrieveSnippets: Failed to fetch ${url}. Status: ${response.status}`);
                // Optionally cache a failure marker for a short period? For now, just skip.
                continue;
            }

            const html = await response.text();

            // 3. Extract content
            const firstParagraphHtml = extractFirstParagraph(html);
            if (!firstParagraphHtml) {
                console.warn(`retrieveSnippets: Could not find <p> tag content in ${url}`);
                // Fallback: strip all tags and take first ~500 chars if no <p> found?
                // For now, skip if no <p> found as per plan refinement.
                continue;
            }

            const textContent = stripHtml(firstParagraphHtml).trim().replace(/\s+/g, ' '); // Clean whitespace
            snippet = truncateWords(textContent, 80);

            if (snippet) {
                 console.log(`retrieveSnippets: Extracted snippet from ${url}. Caching...`);
                // 4. Cache the result
                await redis.set(cacheKey, snippet, { ex: cacheTTL });
                snippets.push(snippet);
            } else {
                 console.warn(`retrieveSnippets: Extracted empty snippet from ${url} after processing.`);
            }

        } catch (error: any) {
            console.error(`retrieveSnippets: Error processing URL ${url}:`, error.message || error);
            // Don't add a snippet if an error occurred during fetch/processing
        }
    }

    console.log(`retrieveSnippets: Returning ${snippets.length} snippets for domain ${domain}.`);
    return snippets;
}