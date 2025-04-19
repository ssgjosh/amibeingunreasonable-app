import { Redis } from '@upstash/redis';
import { WHITELISTED_SOURCES, WhitelistedSource } from './approvedSources'; // Import the approved sources and type, remove .js
// Removed: import { ApprovedDomain } from './domainKeywords';
// Import shared HTML processing functions
import { stripHtml, truncateWords } from './htmlUtils'; // Removed unused extractFirstParagraph, remove .js
import { openRouter } from './openRouterClient'; // Corrected import based on previous fix, remove .js

// --- Define and Export Snippet Type ---
export type Snippet = {
    url: string;
    title: string; // Added title field
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
 * Retrieves text snippets for a given list of relevant URLs, using caching.
 * Fetches content from the provided URLs.
 * @param relevantUrls An array of URLs deemed relevant by the primary semantic search.
 * @param userQuery The original user query (used for context in logging).
 * @returns A promise that resolves to an array of Snippet objects.
 */
export async function retrieveSnippets(relevantUrls: string[], userQuery: string): Promise<Snippet[]> {
    if (!redis) {
        console.error("retrieveSnippets: Redis client not available.");
        return [];
    }
    // Check the exported client instance directly
    if (!openRouter) {
        console.error("retrieveSnippets: OpenRouter client instance not available.");
        return [];
    }

    // Input validation
    if (!Array.isArray(relevantUrls) || relevantUrls.length === 0) {
        console.log("[RAG] retrieveSnippets called with no relevant URLs. Returning empty array.");
        return [];
    }

    const retrievedSnippets: Snippet[] = [];
    const cacheTTL = 60 * 60 * 24 * 30; // 30 days in seconds
    const failureCacheTTL = 60 * 5; // 5 minutes in seconds
    const failureCachePrefix = 'snippet_fail:';
    const maxWordsPerSnippet = 80; // Note: This constant seems unused currently

    console.log(`[RAG] Starting snippet retrieval for ${relevantUrls.length} relevant URLs.`);

    for (const url of relevantUrls) { // Iterate directly over the provided URLs
        const cacheKey = `snippet:${url}`;

        // Outer try-catch for processing a single URL
        try {
            // --- 1. Get Pre-defined Title ---
            const sourceInfo = WHITELISTED_SOURCES.find((source: WhitelistedSource) => source.url === url); // Add type annotation
            let pageTitle: string;
            if (sourceInfo && sourceInfo.name) {
                pageTitle = sourceInfo.name;
            } else {
                console.warn(`[RAG] URL ${url} not found in WHITELISTED_SOURCES or missing 'name'. Using URL as fallback title.`);
                pageTitle = url; // Fallback to URL if not found or name is missing
            }

            // --- 2. Check cache (using pre-defined title) ---
            const cachedData: unknown = await redis.get(cacheKey);
            let useCache = false; // Flag to determine if cache should be used

            if (cachedData !== null && cachedData !== undefined) {
                let potentialSnippet: any = null;
                if (typeof cachedData === 'string') {
                    try { potentialSnippet = JSON.parse(cachedData); } catch { /* ignore parse error */ }
                } else if (typeof cachedData === 'object') {
                    potentialSnippet = cachedData;
                }

                // Validate cache structure AND title match
                if (potentialSnippet &&
                    typeof potentialSnippet.url === 'string' &&
                    typeof potentialSnippet.title === 'string' &&
                    typeof potentialSnippet.text === 'string' &&
                    potentialSnippet.title === pageTitle) { // Check if cached title matches the correct pre-defined title
                    console.log(`[RAG] Cache HIT for ${url} with matching title.`);
                    retrievedSnippets.push(potentialSnippet as Snippet);
                    useCache = true; // Valid cache entry found
                } else if (potentialSnippet) {
                    // Log why cache is invalid (structure or title mismatch)
                    if (potentialSnippet.title !== pageTitle) {
                         console.warn(`[RAG] Cache INVALID for ${url}: Title mismatch (Expected: "${pageTitle}", Found: "${potentialSnippet.title}"). Will refetch.`);
                    } else {
                         console.warn(`[RAG] Cache INVALID for ${url}: Invalid object structure. Will refetch.`);
                    }
                } else {
                     console.log(`[RAG] Cache MISS for ${url} (Could not parse cached data).`);
                }
            } else {
                 console.log(`[RAG] Cache MISS for ${url} (No data found).`);
            }

            // If valid cache was found and used, skip to the next URL
            if (useCache) {
                continue;
            }

            // --- 3. Fetch Pre-generated Summary from Redis Hash ---
            console.log(`[RAG] Cache MISS/INVALID for ${url}. Fetching pre-generated summary from Redis hash...`);
            let snippetText: string;
            const summaryKey = 'source_summaries'; // Key for the hash storing summaries
            const failureKey = failureCachePrefix + url;

            // --- Check Failure Cache ---
            try {
                const failed = await redis.exists(failureKey);
                if (failed) {
                    console.warn(`[RAG] Skipping summary fetch for ${url} due to recent failure.`);
                    continue; // Skip to the next URL
                }
            } catch (existsError) {
                 console.error(`[RAG] Error checking failure cache key ${failureKey}:`, existsError);
                 // Continue anyway, attempt the fetch
            }

            try {
                const summary = await redis.hget<string>(summaryKey, url); // Fetch summary for the specific URL (field)
                if (summary) {
                    console.log(`[RAG] Found pre-generated summary for ${url} in hash '${summaryKey}'.`);
                    snippetText = summary;
                } else {
                    console.warn(`[RAG] Pre-generated summary not found for ${url} in hash '${summaryKey}'. Using placeholder.`);
                    snippetText = "Summary not available.";
                }
            } catch (hgetError) {
                console.error(`[RAG] Error fetching summary for ${url} from Redis hash '${summaryKey}':`, hgetError);
                snippetText = "Error retrieving summary."; // Use error placeholder
                // --- Set Failure Cache Key ---
                try {
                    await redis.set(failureKey, 'failed', { ex: failureCacheTTL });
                    console.log(`[RAG] Set failure cache key ${failureKey} for ${failureCacheTTL} seconds.`);
                } catch (failCacheError) {
                    console.error(`[RAG] Error setting failure cache key ${failureKey}:`, failCacheError);
                }
            }

            // --- 4. Create and Cache Snippet Object ---
            const newSnippet: Snippet = { url: url, title: pageTitle, text: snippetText };
            console.log(`[RAG] Caching final snippet object for ${url} (Title: ${pageTitle}).`);
            try {
                await redis.set(cacheKey, JSON.stringify(newSnippet), { ex: cacheTTL });
                retrievedSnippets.push(newSnippet);
            } catch (cacheError) {
                 console.error(`[RAG] Error caching final snippet object for ${url}:`, cacheError);
                 // Still push the snippet even if caching fails, so the user sees it
                 retrievedSnippets.push(newSnippet);
            }

        } catch (error: any) {
            // Catch errors from the outer try block (e.g., fetch failure before relevance check)
            console.error(`[RAG] Outer error processing URL ${url}:`, error.message || error);
             if (error.name === 'TimeoutError' || error.message?.includes('timed out')) { // Broader timeout check
                 console.error(`[RAG] Fetch timed out for ${url}`);
             }
             // Continue to the next source even if one fails entirely
             continue;
        }
    } // End for loop

    console.log(`[RAG] Finished snippet retrieval. URLs processed=${relevantUrls.length}, Snippets returned=${retrievedSnippets.length}`);
    return retrievedSnippets;
}