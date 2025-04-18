import { Redis } from '@upstash/redis';
import { WHITELISTED_SOURCES } from '../lib/approvedSources';
import { stripHtml, extractFirstParagraph, truncateWords } from '../lib/htmlUtils';
import type { Snippet } from '../lib/retrieveSnippets'; // Import type

// --- Configuration ---
const cacheTTL = 60 * 60 * 24 * 30; // 30 days in seconds
const maxWordsPerSnippet = 80;
const userAgent = 'AmIBeingUnreasonable-Seeder/1.0';
const fetchTimeoutMs = 15000; // 15 seconds timeout for fetching each URL

// --- Redis Initialization (Script-specific) ---
async function initializeRedis(): Promise<Redis | null> {
    const redisUrl = process.env.STORAGE_KV_REST_API_URL;
    const redisToken = process.env.STORAGE_KV_REST_API_TOKEN;

    if (!redisUrl || !redisToken) {
        console.error("SEEDER ERROR: Missing required Redis environment variables: STORAGE_KV_REST_API_URL or STORAGE_KV_REST_API_TOKEN");
        return null;
    }

    try {
        const redis = new Redis({
            url: redisUrl,
            token: redisToken,
        });
        console.log("SEEDER: Redis client initialized successfully using STORAGE_KV variables.");
        // Optional: Test connection
        await redis.ping();
        console.log("SEEDER: Redis PING successful.");
        return redis;
    } catch (error) {
        console.error("SEEDER ERROR: Failed to initialize or connect to Redis:", error);
        return null;
    }
}

// --- Main Seeding Function ---
async function seedSnippets() {
    console.log("SEEDER: Starting snippet seeding process...");

    const redis = await initializeRedis();
    if (!redis) {
        console.error("SEEDER: Exiting due to Redis initialization failure.");
        process.exit(1); // Exit with error code
    }

    let successCount = 0;
    let errorCount = 0;
    const totalUrls = WHITELISTED_SOURCES.length;

    console.log(`SEEDER: Processing ${totalUrls} URLs from WHITELISTED_SOURCES.`);

    // Process URLs sequentially to avoid overwhelming the network or Redis
    for (let i = 0; i < totalUrls; i++) {
        const source = WHITELISTED_SOURCES[i];
        const url = source.url;
        const cacheKey = `snippet:${url}`;

        console.log(`\nSEEDER: [${i + 1}/${totalUrls}] Processing URL: ${url}`);

        try {
            // 1. Fetch external URL
            console.log(`SEEDER: Fetching ${url}...`);
            const response = await fetch(url, {
                headers: { 'User-Agent': userAgent },
                signal: AbortSignal.timeout(fetchTimeoutMs)
            });

            if (!response.ok) {
                console.error(`SEEDER ERROR: Failed to fetch ${url}. Status: ${response.status} ${response.statusText}`);
                errorCount++;
                continue; // Skip this URL
            }

            const html = await response.text();

            // 2. Extract content
            const firstParagraphHtml = extractFirstParagraph(html);
            if (!firstParagraphHtml) {
                console.warn(`SEEDER WARN: Could not find first <p> tag content in ${url}`);
                // Optionally cache an empty marker or skip? For now, skip.
                errorCount++; // Count as error if we expect content
                continue;
            }

            // 3. Process and truncate text
            const textContent = stripHtml(firstParagraphHtml);
            const snippetText = truncateWords(textContent, maxWordsPerSnippet);

            if (snippetText && snippetText !== '...') {
                const newSnippet: Snippet = { url: url, text: snippetText };
                console.log(`SEEDER: Extracted snippet. Caching with TTL ${cacheTTL}s...`);

                // 4. Cache the result
                await redis.set(cacheKey, JSON.stringify(newSnippet), { ex: cacheTTL });
                console.log(`SEEDER: Successfully cached snippet for ${url}`);
                successCount++;
            } else {
                console.warn(`SEEDER WARN: Extracted empty or minimal snippet from ${url} after processing.`);
                errorCount++; // Count as error if we expect content
            }

        } catch (error: any) {
            console.error(`SEEDER ERROR: Error processing URL ${url}:`, error.message || error);
            if (error.name === 'TimeoutError') {
                console.error(`SEEDER ERROR: Fetch timed out for ${url}`);
            }
            errorCount++;
        }
         // Optional: Add a small delay between requests if needed
         // await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log("\n----------------------------------------");
    console.log("SEEDER: Snippet seeding process finished.");
    console.log(`Total URLs Processed: ${totalUrls}`);
    console.log(`Successfully Cached:  ${successCount}`);
    console.log(`Errors/Skipped:     ${errorCount}`);
    console.log("----------------------------------------");

    // Exit successfully if there were no critical errors preventing the script from running
    process.exit(0);
}

// --- Run the Seeder ---
seedSnippets();