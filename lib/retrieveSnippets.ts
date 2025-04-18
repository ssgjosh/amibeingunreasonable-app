import { Redis } from '@upstash/redis';
import { WHITELISTED_SOURCES } from './approvedSources';
import { ApprovedDomain } from './domainKeywords';
// Import shared HTML processing functions
import { stripHtml, extractFirstParagraph, truncateWords } from './htmlUtils';

// --- Define and Export Snippet Type ---
export type Snippet = {
    url: string;
    text: string;
};

// Initialize Redis client from environment variables
let redis: Redis | null = null;
const redisUrl = process.env.STORAGE_KV_REST_API_URL;
const redisToken = process.env.STORAGE_KV_REST_API_TOKEN;

if (redisUrl && redisToken) {
    try {
        redis = new Redis({
            url: redisUrl,
            token: redisToken,
        });
        console.log("Redis client initialized successfully for snippet retrieval using STORAGE_KV variables.");
    } catch (error) {
        console.error("Failed to initialize Redis client with provided STORAGE_KV variables:", error);
    }
} else {
    console.error("Missing required Redis environment variables: STORAGE_KV_REST_API_URL or STORAGE_KV_REST_API_TOKEN");
}

/**
 * Retrieves relevant text snippets for a given domain, using caching.
 * Fetches content from approved URLs associated with the domain.
 * @param domain The detected domain (must be an ApprovedDomain).
 * @returns A promise that resolves to an array of Snippet objects.
 */
export async function retrieveSnippets(domain: ApprovedDomain): Promise<Snippet[]> {
    if (!redis) {
        console.error("retrieveSnippets: Redis client not available.");
        return [];
    }

    // Filter the sources for the given domain
    const relevantSources = WHITELISTED_SOURCES.filter(source => source.domain === domain);
    const retrievedSnippets: Snippet[] = [];
    const cacheTTL = 60 * 60 * 24 * 30; // 30 days in seconds
    const maxWordsPerSnippet = 80;

    console.log(`[RAG] Starting snippet retrieval for domain: ${domain}. Found ${relevantSources.length} potential URLs.`);

    for (const source of relevantSources) {
        const url = source.url;
        const cacheKey = `snippet:${url}`;
        let snippetFromCache: Snippet | null = null; // Renamed variable for clarity

        try {
            // 1. Check cache - Use generic 'unknown' type first
            const cachedData: unknown = await redis.get(cacheKey);

            if (cachedData !== null && cachedData !== undefined) {
                let potentialSnippet: any = null;

                // Check if it's a string that needs parsing, or potentially already an object
                if (typeof cachedData === 'string') {
                    try {
                        potentialSnippet = JSON.parse(cachedData);
                    } catch (parseError) {
                        console.warn(`[RAG] Failed to parse cached string data for ${url}. Will refetch. Error:`, parseError);
                        // Keep potentialSnippet as null
                    }
                } else if (typeof cachedData === 'object') {
                    // It might already be an object (though get<string> was used before, let's be safe)
                    potentialSnippet = cachedData;
                } else {
                     console.warn(`[RAG] Unexpected data type found in cache for ${url}: ${typeof cachedData}. Will refetch.`);
                }

                // Validate the structure of the potential snippet (whether parsed or direct object)
                if (potentialSnippet && typeof potentialSnippet.url === 'string' && typeof potentialSnippet.text === 'string') {
                    console.log(`[RAG] Cache HIT for ${url}`);
                    snippetFromCache = potentialSnippet as Snippet; // Type assertion after validation
                    retrievedSnippets.push(snippetFromCache);
                    continue; // Move to the next source URL
                } else if (potentialSnippet) {
                    // Parsed/Object existed but didn't have the right structure
                    console.warn(`[RAG] Invalid object structure found in cache for ${url}. Will refetch.`);
                }
                // If parsing failed or structure was invalid, snippetFromCache remains null, and we proceed to fetch
            }

            // If cache miss or invalid cache data, proceed to fetch
            // (snippetFromCache will be null here)
            console.log(`[RAG] Cache MISS for ${url}. Fetching...`);

            // 2. Fetch external URL
            const response = await fetch(url, {
                headers: { 'User-Agent': 'AmIBeingUnreasonable-Bot/1.0' },
                signal: AbortSignal.timeout(10000) // 10-second timeout
            });

            if (!response.ok) {
                console.error(`[RAG] Failed to fetch ${url}. Status: ${response.status} ${response.statusText}`);
                continue;
            }

            const html = await response.text();

            // 3. Extract content using imported functions
            const firstParagraphHtml = extractFirstParagraph(html);
            if (!firstParagraphHtml) {
                console.warn(`[RAG] Could not find first <p> tag content in ${url}`);
                continue;
            }

            const textContent = stripHtml(firstParagraphHtml);
            const snippetText = truncateWords(textContent, maxWordsPerSnippet);

            if (snippetText && snippetText !== '...') {
                const newSnippet: Snippet = { url: url, text: snippetText };
                console.log(`[RAG] Extracted snippet from ${url}. Caching...`);

                // 4. Cache the result (as a JSON string)
                await redis.set(cacheKey, JSON.stringify(newSnippet), { ex: cacheTTL });
                retrievedSnippets.push(newSnippet);
            } else {
                console.warn(`[RAG] Extracted empty or minimal snippet from ${url} after processing.`);
            }

        } catch (error: any) {
            console.error(`[RAG] Error processing URL ${url}:`, error.message || error);
             if (error.name === 'TimeoutError') {
                 console.error(`[RAG] Fetch timed out for ${url}`);
             }
        }
    }

    console.log(`[RAG] Finished snippet retrieval for domain=${domain}. URLs checked=${relevantSources.length}, Snippets returned=${retrievedSnippets.length}`);
    return retrievedSnippets;
}