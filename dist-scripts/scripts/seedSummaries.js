var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import dotenv from 'dotenv';
import path from 'path'; // Import path module
import { Redis } from '@upstash/redis';
import { WHITELISTED_SOURCES } from '../lib/approvedSources.js';
import { openRouter } from '../lib/openRouterClient.js'; // Assuming this is the correct client
import { Readability } from '@mozilla/readability'; // Use Readability
import { JSDOM } from 'jsdom'; // Needed for Readability
import { stripHtml } from '../lib/htmlUtils.js'; // Keep for fallback
// Load environment variables from .env.local at project root
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
// --- Configuration ---
var REDIS_URL = process.env.STORAGE_KV_REST_API_URL;
var REDIS_TOKEN = process.env.STORAGE_KV_REST_API_TOKEN;
var SUMMARIZATION_MODEL = 'mistralai/mistral-7b-instruct-v0.1'; // Or choose another suitable model
var REDIS_SUMMARY_KEY = 'source_summaries'; // Hash key for storing summaries
var FETCH_TIMEOUT_MS = 15000; // 15 seconds
var AI_TIMEOUT_MS = 20000; // 20 seconds for summarization
var USER_AGENT = 'AmIBeingUnreasonable-SummaryBot/1.0';
// --- Helper: Extract Main Text Content ---
// Uses Readability to extract main content, falls back to basic HTML stripping.
function extractMainText(html, url) {
    return __awaiter(this, void 0, void 0, function () {
        var doc, reader, article, bodyMatch, bodyHtml, text;
        return __generator(this, function (_a) {
            console.log("[SeedSummaries] Extracting text for ".concat(url, "..."));
            try {
                doc = new JSDOM(html, { url: url });
                reader = new Readability(doc.window.document);
                article = reader.parse();
                if (article && article.textContent) {
                    console.log("[SeedSummaries] Extracted text using Readability for ".concat(url, ". Length: ").concat(article.textContent.length));
                    // Basic cleaning for Readability output
                    return [2 /*return*/, article.textContent.replace(/\s\s+/g, ' ').trim()];
                }
                else {
                    // --- Fallback to basic stripHtml if Readability fails ---
                    console.warn("[SeedSummaries] Readability failed for ".concat(url, ", falling back to basic stripHtml."));
                    bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
                    bodyHtml = bodyMatch ? bodyMatch[1] : html;
                    text = stripHtml(bodyHtml);
                    // Basic cleaning for fallback
                    text = text.replace(/\s\s+/g, ' ').trim();
                    console.log("[SeedSummaries] Extracted text using basic stripHtml (fallback) for ".concat(url, ". Length: ").concat(text.length));
                    return [2 /*return*/, text];
                }
            }
            catch (error) { // Catch specific error type if known, otherwise 'any'
                console.error("[SeedSummaries] Error extracting text for ".concat(url, ":"), error.message || error);
                return [2 /*return*/, '']; // Return empty string on error
            }
            return [2 /*return*/];
        });
    });
}
// --- Helper: Summarize Text using AI ---
function summarizeText(text, url) {
    return __awaiter(this, void 0, void 0, function () {
        var MAX_INPUT_LENGTH, truncatedText, prompt, completion, summary, error_1;
        var _a, _b, _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    if (!text || text.length < 100) { // Don't summarize very short texts
                        console.log("[SeedSummaries] Text too short to summarize for ".concat(url, ". Skipping AI call."));
                        return [2 /*return*/, null]; // Indicate no summary needed/possible
                    }
                    MAX_INPUT_LENGTH = 15000;
                    truncatedText = text.length > MAX_INPUT_LENGTH ? text.substring(0, MAX_INPUT_LENGTH) + "..." : text;
                    prompt = "Summarize the key information provided in the following text in a concise paragraph (approx. 50-75 words), focusing on the main topic and advice given. Output only the summary paragraph itself, nothing else:\n\n---\n\n".concat(truncatedText);
                    console.log("[SeedSummaries] Requesting summary from ".concat(SUMMARIZATION_MODEL, " for ").concat(url, "..."));
                    _d.label = 1;
                case 1:
                    _d.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, openRouter.chat.completions.create({
                            model: SUMMARIZATION_MODEL,
                            messages: [{ role: 'user', content: prompt }],
                            max_tokens: 150, // Max length for the summary
                            temperature: 0.3, // Lower temperature for factual summary
                            // timeout: AI_TIMEOUT_MS, // If supported by the client library
                        })];
                case 2:
                    completion = _d.sent();
                    summary = (_c = (_b = (_a = completion.choices[0]) === null || _a === void 0 ? void 0 : _a.message) === null || _b === void 0 ? void 0 : _b.content) === null || _c === void 0 ? void 0 : _c.trim();
                    if (summary) {
                        console.log("[SeedSummaries] Received summary for ".concat(url, "."));
                        return [2 /*return*/, summary];
                    }
                    else {
                        console.error("[SeedSummaries] AI returned empty summary for ".concat(url, "."));
                        return [2 /*return*/, null];
                    }
                    return [3 /*break*/, 4];
                case 3:
                    error_1 = _d.sent();
                    console.error("[SeedSummaries] Error calling AI for summarization (".concat(url, "):"), error_1.message || error_1);
                    return [2 /*return*/, null]; // Indicate failure
                case 4: return [2 /*return*/];
            }
        });
    });
}
// --- Main Seeding Function ---
function seedSummaries() {
    return __awaiter(this, void 0, void 0, function () {
        var redis, successCount, fetchFailCount, extractFailCount, summaryFailCount, redisFailCount, totalSources, i, source, url, htmlContent, response, error_2, textContent, summary, error_3;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    console.log("[SeedSummaries] Starting summary seeding process...");
                    if (!REDIS_URL || !REDIS_TOKEN) {
                        console.error("[SeedSummaries] Error: Redis URL or Token environment variables are not set.");
                        process.exit(1);
                    }
                    if (!openRouter) {
                        console.error("[SeedSummaries] Error: OpenRouter client not initialized.");
                        process.exit(1);
                    }
                    try {
                        redis = new Redis({ url: REDIS_URL, token: REDIS_TOKEN });
                        console.log("[SeedSummaries] Redis client initialized.");
                    }
                    catch (error) {
                        console.error("[SeedSummaries] Failed to initialize Redis client:", error);
                        process.exit(1);
                    }
                    successCount = 0;
                    fetchFailCount = 0;
                    extractFailCount = 0;
                    summaryFailCount = 0;
                    redisFailCount = 0;
                    totalSources = WHITELISTED_SOURCES.length;
                    console.log("[SeedSummaries] Processing ".concat(totalSources, " sources..."));
                    i = 0;
                    _b.label = 1;
                case 1:
                    if (!(i < totalSources)) return [3 /*break*/, 13];
                    source = WHITELISTED_SOURCES[i];
                    url = source.url;
                    console.log("\n[SeedSummaries] (".concat(i + 1, "/").concat(totalSources, ") Processing URL: ").concat(url));
                    htmlContent = void 0;
                    _b.label = 2;
                case 2:
                    _b.trys.push([2, 5, , 6]);
                    return [4 /*yield*/, fetch(url, {
                            headers: { 'User-Agent': USER_AGENT },
                            signal: AbortSignal.timeout(FETCH_TIMEOUT_MS)
                        })];
                case 3:
                    response = _b.sent();
                    if (!response.ok) {
                        throw new Error("HTTP error! Status: ".concat(response.status, " ").concat(response.statusText));
                    }
                    return [4 /*yield*/, response.text()];
                case 4:
                    htmlContent = _b.sent();
                    console.log("[SeedSummaries] Fetched content for ".concat(url, ". Length: ").concat(htmlContent.length));
                    return [3 /*break*/, 6];
                case 5:
                    error_2 = _b.sent();
                    console.error("[SeedSummaries] Failed to fetch ".concat(url, ":"), error_2.message || error_2);
                    fetchFailCount++;
                    return [3 /*break*/, 12]; // Skip to next URL
                case 6: return [4 /*yield*/, extractMainText(htmlContent, url)];
                case 7:
                    textContent = _b.sent();
                    if (!textContent) {
                        console.warn("[SeedSummaries] Failed to extract meaningful text from ".concat(url, "."));
                        extractFailCount++;
                        return [3 /*break*/, 12]; // Skip to next URL
                    }
                    return [4 /*yield*/, summarizeText(textContent, url)];
                case 8:
                    summary = _b.sent();
                    if (!summary) {
                        console.warn("[SeedSummaries] Failed to generate summary for ".concat(url, "."));
                        summaryFailCount++;
                        // Decide if you want to store a placeholder or skip storing
                        // For now, we skip storing if summarization fails
                        return [3 /*break*/, 12]; // Skip to next URL
                    }
                    _b.label = 9;
                case 9:
                    _b.trys.push([9, 11, , 12]);
                    // HSET key field value
                    return [4 /*yield*/, redis.hset(REDIS_SUMMARY_KEY, (_a = {}, _a[url] = summary, _a))];
                case 10:
                    // HSET key field value
                    _b.sent();
                    console.log("[SeedSummaries] Successfully stored summary for ".concat(url, " in Redis hash '").concat(REDIS_SUMMARY_KEY, "'."));
                    successCount++;
                    return [3 /*break*/, 12];
                case 11:
                    error_3 = _b.sent();
                    console.error("[SeedSummaries] Failed to store summary for ".concat(url, " in Redis:"), error_3.message || error_3);
                    redisFailCount++;
                    return [3 /*break*/, 12];
                case 12:
                    i++;
                    return [3 /*break*/, 1];
                case 13:
                    console.log("\n--- Seeding Summary ---");
                    console.log("Total Sources:      ".concat(totalSources));
                    console.log("Successfully Stored: ".concat(successCount));
                    console.log("Fetch Failures:     ".concat(fetchFailCount));
                    console.log("Extraction Failures:".concat(extractFailCount));
                    console.log("Summarization Fails:".concat(summaryFailCount));
                    console.log("Redis Write Fails:  ".concat(redisFailCount));
                    console.log("----------------------");
                    return [2 /*return*/];
            }
        });
    });
}
// --- Execute Script ---
seedSummaries()
    .then(function () {
    console.log("[SeedSummaries] Script finished successfully.");
    process.exit(0);
})
    .catch(function (error) {
    console.error("[SeedSummaries] Script finished with an error:", error);
    process.exit(1);
});
