import { Redis } from '@upstash/redis';
import { WHITELISTED_SOURCES } from '../lib/approvedSources.js';
import { stripHtml, extractFirstParagraph, truncateWords } from '../lib/htmlUtils.js';
import type { Snippet } from '../lib/retrieveSnippets.js'; // Import type

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

            // 2. Extract Title
            let pageTitle: string = url; // Default to URL
            try {
                const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
                if (titleMatch && titleMatch[1]) {
                    let rawTitle = titleMatch[1];
                    // Simple decoding
                    rawTitle = rawTitle.replace(/&/g, '&').replace(/</g, '<').replace(/>/g, '>').replace(/"/g, '"').replace(/'/g, "'");
                    pageTitle = rawTitle.replace(/\s+/g, ' ').replace(/ [-|] GOV\.UK$/i, '').trim();
                }
                if (!pageTitle || pageTitle.length === 0) pageTitle = url;
            } catch (titleError) {
                console.warn(`SEEDER WARN: Error extracting title for ${url}:`, titleError);
                pageTitle = url; // Fallback to URL on error
            }

            // 3. Extract content (first paragraph)
            const firstParagraphHtml = extractFirstParagraph(html);
            if (!firstParagraphHtml) {
                console.warn(`SEEDER WARN: Could not find first <p> tag content in ${url}`);
                errorCount++;
                continue;
            }

            // 4. Process and truncate text
            const textContent = stripHtml(firstParagraphHtml);
            const snippetText = truncateWords(textContent, maxWordsPerSnippet);

            if (snippetText && snippetText !== '...') {
                // Include the extracted title
                const newSnippet: Snippet = { url: url, title: pageTitle, text: snippetText };
                console.log(`SEEDER: Extracted snippet. Caching with TTL ${cacheTTL}s...`);

                // 5. Cache the result
                await redis.set(cacheKey, JSON.stringify(newSnippet), { ex: cacheTTL });
                console.log(`SEEDER: Successfully cached snippet for ${url} (Title: ${pageTitle})`);
                successCount++;
            } else {
                console.warn(`SEEDER WARN: Extracted empty or minimal snippet from ${url} after processing.`);
                errorCount++;
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