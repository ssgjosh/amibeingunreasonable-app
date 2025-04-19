import dotenv from 'dotenv';
import path from 'path'; // Import path module
import { Redis } from '@upstash/redis';
import { WHITELISTED_SOURCES } from '../lib/approvedSources'; // Remove .js
import { openRouter } from '../lib/openRouterClient'; // Assuming this is the correct client, remove .js
import { Readability } from '@mozilla/readability'; // Use Readability
import { JSDOM } from 'jsdom'; // Needed for Readability
import { stripHtml } from '../lib/htmlUtils'; // Keep for fallback, remove .js

// Load environment variables from .env.local at project root
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// --- Configuration ---
const REDIS_URL = process.env.STORAGE_KV_REST_API_URL;
const REDIS_TOKEN = process.env.STORAGE_KV_REST_API_TOKEN;
const SUMMARIZATION_MODEL = 'mistralai/mistral-7b-instruct-v0.1'; // Or choose another suitable model
const REDIS_SUMMARY_KEY = 'source_summaries'; // Hash key for storing summaries
const FETCH_TIMEOUT_MS = 15000; // 15 seconds
const AI_TIMEOUT_MS = 20000; // 20 seconds for summarization
const USER_AGENT = 'AmIBeingUnreasonable-SummaryBot/1.0';

// --- Helper: Extract Main Text Content ---
// Uses Readability to extract main content, falls back to basic HTML stripping.
async function extractMainText(html: string, url: string): Promise<string> {
    console.log(`[SeedSummaries] Extracting text for ${url}...`);
    try {
        // --- Use Readability ---
        const doc = new JSDOM(html, { url });
        const reader = new Readability(doc.window.document);
        const article = reader.parse();

        if (article && article.textContent) {
            console.log(`[SeedSummaries] Extracted text using Readability for ${url}. Length: ${article.textContent.length}`);
            // Basic cleaning for Readability output
            return article.textContent.replace(/\s\s+/g, ' ').trim();
        } else {
            // --- Fallback to basic stripHtml if Readability fails ---
            console.warn(`[SeedSummaries] Readability failed for ${url}, falling back to basic stripHtml.`);
            const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
            const bodyHtml = bodyMatch ? bodyMatch[1] : html; // Use full HTML if body tag not found
            let text = stripHtml(bodyHtml);
            // Basic cleaning for fallback
            text = text.replace(/\s\s+/g, ' ').trim();
            console.log(`[SeedSummaries] Extracted text using basic stripHtml (fallback) for ${url}. Length: ${text.length}`);
            return text;
        }
    } catch (error: any) { // Catch specific error type if known, otherwise 'any'
        console.error(`[SeedSummaries] Error extracting text for ${url}:`, error.message || error);
        return ''; // Return empty string on error
    }
}

// --- Helper: Summarize Text using AI ---
async function summarizeText(text: string, url: string): Promise<string | null> {
    if (!text || text.length < 100) { // Don't summarize very short texts
        console.log(`[SeedSummaries] Text too short to summarize for ${url}. Skipping AI call.`);
        return null; // Indicate no summary needed/possible
    }

    // Truncate text if too long to avoid excessive AI costs/limits
    const MAX_INPUT_LENGTH = 15000; // Adjust based on model context window and cost considerations
    const truncatedText = text.length > MAX_INPUT_LENGTH ? text.substring(0, MAX_INPUT_LENGTH) + "..." : text;

    const prompt = `Summarize the key information provided in the following text in a concise paragraph (approx. 50-75 words), focusing on the main topic and advice given. Output only the summary paragraph itself, nothing else:\n\n---\n\n${truncatedText}`;

    console.log(`[SeedSummaries] Requesting summary from ${SUMMARIZATION_MODEL} for ${url}...`);

    try {
        // TODO: Implement timeout for the AI call if openRouter client doesn't support it directly
        const completion = await openRouter.chat.completions.create({
            model: SUMMARIZATION_MODEL,
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 150, // Max length for the summary
            temperature: 0.3, // Lower temperature for factual summary
            // timeout: AI_TIMEOUT_MS, // If supported by the client library
        });

        const summary = completion.choices[0]?.message?.content?.trim();

        if (summary) {
            console.log(`[SeedSummaries] Received summary for ${url}.`);
            return summary;
        } else {
            console.error(`[SeedSummaries] AI returned empty summary for ${url}.`);
            return null;
        }
    } catch (error: any) {
        console.error(`[SeedSummaries] Error calling AI for summarization (${url}):`, error.message || error);
        return null; // Indicate failure
    }
}

// --- Main Seeding Function ---
async function seedSummaries() {
    console.log("[SeedSummaries] Starting summary seeding process...");

    if (!REDIS_URL || !REDIS_TOKEN) {
        console.error("[SeedSummaries] Error: Redis URL or Token environment variables are not set.");
        process.exit(1);
    }
    if (!openRouter) {
        console.error("[SeedSummaries] Error: OpenRouter client not initialized.");
        process.exit(1);
    }

    let redis: Redis;
    try {
        redis = new Redis({ url: REDIS_URL, token: REDIS_TOKEN });
        console.log("[SeedSummaries] Redis client initialized.");
    } catch (error) {
        console.error("[SeedSummaries] Failed to initialize Redis client:", error);
        process.exit(1);
    }

    let successCount = 0;
    let fetchFailCount = 0;
    let extractFailCount = 0;
    let summaryFailCount = 0;
    let redisFailCount = 0;
    const totalSources = WHITELISTED_SOURCES.length;

    console.log(`[SeedSummaries] Processing ${totalSources} sources...`);

    for (let i = 0; i < totalSources; i++) {
        const source = WHITELISTED_SOURCES[i];
        const url = source.url;
        console.log(`\n[SeedSummaries] (${i + 1}/${totalSources}) Processing URL: ${url}`);

        // 1. Fetch Content
        let htmlContent: string;
        try {
            const response = await fetch(url, {
                headers: { 'User-Agent': USER_AGENT },
                signal: AbortSignal.timeout(FETCH_TIMEOUT_MS)
            });
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status} ${response.statusText}`);
            }
            htmlContent = await response.text();
            console.log(`[SeedSummaries] Fetched content for ${url}. Length: ${htmlContent.length}`);
        } catch (error: any) {
            console.error(`[SeedSummaries] Failed to fetch ${url}:`, error.message || error);
            fetchFailCount++;
            continue; // Skip to next URL
        }

        // 2. Extract Text
        const textContent = await extractMainText(htmlContent, url);
        if (!textContent) {
            console.warn(`[SeedSummaries] Failed to extract meaningful text from ${url}.`);
            extractFailCount++;
            continue; // Skip to next URL
        }

        // 3. Summarize Text
        const summary = await summarizeText(textContent, url);
        if (!summary) {
            console.warn(`[SeedSummaries] Failed to generate summary for ${url}.`);
            summaryFailCount++;
            // Decide if you want to store a placeholder or skip storing
            // For now, we skip storing if summarization fails
            continue; // Skip to next URL
        }

        // 4. Store Summary in Redis Hash
        try {
            // HSET key field value
            await redis.hset(REDIS_SUMMARY_KEY, { [url]: summary });
            console.log(`[SeedSummaries] Successfully stored summary for ${url} in Redis hash '${REDIS_SUMMARY_KEY}'.`);
            successCount++;
        } catch (error: any) {
            console.error(`[SeedSummaries] Failed to store summary for ${url} in Redis:`, error.message || error);
            redisFailCount++;
        }
    } // End for loop

    console.log("\n--- Seeding Summary ---");
    console.log(`Total Sources:      ${totalSources}`);
    console.log(`Successfully Stored: ${successCount}`);
    console.log(`Fetch Failures:     ${fetchFailCount}`);
    console.log(`Extraction Failures:${extractFailCount}`);
    console.log(`Summarization Fails:${summaryFailCount}`);
    console.log(`Redis Write Fails:  ${redisFailCount}`);
    console.log("----------------------");

    // Optional: Disconnect Redis client if needed, depends on application lifecycle
    // await redis.quit();
}

// --- Execute Script ---
seedSummaries()
    .then(() => {
        console.log("[SeedSummaries] Script finished successfully.");
        process.exit(0);
    })
    .catch((error) => {
        console.error("[SeedSummaries] Script finished with an error:", error);
        process.exit(1);
    });