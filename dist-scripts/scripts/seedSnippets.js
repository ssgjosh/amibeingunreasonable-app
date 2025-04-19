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
import { Redis } from '@upstash/redis';
import { WHITELISTED_SOURCES } from '../lib/approvedSources.js';
import { stripHtml, extractFirstParagraph, truncateWords } from '../lib/htmlUtils.js';
// --- Configuration ---
var cacheTTL = 60 * 60 * 24 * 30; // 30 days in seconds
var maxWordsPerSnippet = 80;
var userAgent = 'AmIBeingUnreasonable-Seeder/1.0';
var fetchTimeoutMs = 15000; // 15 seconds timeout for fetching each URL
// --- Redis Initialization (Script-specific) ---
function initializeRedis() {
    return __awaiter(this, void 0, void 0, function () {
        var redisUrl, redisToken, redis, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    redisUrl = process.env.STORAGE_KV_REST_API_URL;
                    redisToken = process.env.STORAGE_KV_REST_API_TOKEN;
                    if (!redisUrl || !redisToken) {
                        console.error("SEEDER ERROR: Missing required Redis environment variables: STORAGE_KV_REST_API_URL or STORAGE_KV_REST_API_TOKEN");
                        return [2 /*return*/, null];
                    }
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    redis = new Redis({
                        url: redisUrl,
                        token: redisToken,
                    });
                    console.log("SEEDER: Redis client initialized successfully using STORAGE_KV variables.");
                    // Optional: Test connection
                    return [4 /*yield*/, redis.ping()];
                case 2:
                    // Optional: Test connection
                    _a.sent();
                    console.log("SEEDER: Redis PING successful.");
                    return [2 /*return*/, redis];
                case 3:
                    error_1 = _a.sent();
                    console.error("SEEDER ERROR: Failed to initialize or connect to Redis:", error_1);
                    return [2 /*return*/, null];
                case 4: return [2 /*return*/];
            }
        });
    });
}
// --- Main Seeding Function ---
function seedSnippets() {
    return __awaiter(this, void 0, void 0, function () {
        var redis, successCount, errorCount, totalUrls, i, source, url, cacheKey, response, html, pageTitle, titleMatch, rawTitle, firstParagraphHtml, textContent, snippetText, newSnippet, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log("SEEDER: Starting snippet seeding process...");
                    return [4 /*yield*/, initializeRedis()];
                case 1:
                    redis = _a.sent();
                    if (!redis) {
                        console.error("SEEDER: Exiting due to Redis initialization failure.");
                        process.exit(1); // Exit with error code
                    }
                    successCount = 0;
                    errorCount = 0;
                    totalUrls = WHITELISTED_SOURCES.length;
                    console.log("SEEDER: Processing ".concat(totalUrls, " URLs from WHITELISTED_SOURCES."));
                    i = 0;
                    _a.label = 2;
                case 2:
                    if (!(i < totalUrls)) return [3 /*break*/, 11];
                    source = WHITELISTED_SOURCES[i];
                    url = source.url;
                    cacheKey = "snippet:".concat(url);
                    console.log("\nSEEDER: [".concat(i + 1, "/").concat(totalUrls, "] Processing URL: ").concat(url));
                    _a.label = 3;
                case 3:
                    _a.trys.push([3, 9, , 10]);
                    // 1. Fetch external URL
                    console.log("SEEDER: Fetching ".concat(url, "..."));
                    return [4 /*yield*/, fetch(url, {
                            headers: { 'User-Agent': userAgent },
                            signal: AbortSignal.timeout(fetchTimeoutMs)
                        })];
                case 4:
                    response = _a.sent();
                    if (!response.ok) {
                        console.error("SEEDER ERROR: Failed to fetch ".concat(url, ". Status: ").concat(response.status, " ").concat(response.statusText));
                        errorCount++;
                        return [3 /*break*/, 10]; // Skip this URL
                    }
                    return [4 /*yield*/, response.text()];
                case 5:
                    html = _a.sent();
                    pageTitle = url;
                    try {
                        titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
                        if (titleMatch && titleMatch[1]) {
                            rawTitle = titleMatch[1];
                            // Simple decoding
                            rawTitle = rawTitle.replace(/&/g, '&').replace(/</g, '<').replace(/>/g, '>').replace(/"/g, '"').replace(/'/g, "'");
                            pageTitle = rawTitle.replace(/\s+/g, ' ').replace(/ [-|] GOV\.UK$/i, '').trim();
                        }
                        if (!pageTitle || pageTitle.length === 0)
                            pageTitle = url;
                    }
                    catch (titleError) {
                        console.warn("SEEDER WARN: Error extracting title for ".concat(url, ":"), titleError);
                        pageTitle = url; // Fallback to URL on error
                    }
                    firstParagraphHtml = extractFirstParagraph(html);
                    if (!firstParagraphHtml) {
                        console.warn("SEEDER WARN: Could not find first <p> tag content in ".concat(url));
                        errorCount++;
                        return [3 /*break*/, 10];
                    }
                    textContent = stripHtml(firstParagraphHtml);
                    snippetText = truncateWords(textContent, maxWordsPerSnippet);
                    if (!(snippetText && snippetText !== '...')) return [3 /*break*/, 7];
                    newSnippet = { url: url, title: pageTitle, text: snippetText };
                    console.log("SEEDER: Extracted snippet. Caching with TTL ".concat(cacheTTL, "s..."));
                    // 5. Cache the result
                    return [4 /*yield*/, redis.set(cacheKey, JSON.stringify(newSnippet), { ex: cacheTTL })];
                case 6:
                    // 5. Cache the result
                    _a.sent();
                    console.log("SEEDER: Successfully cached snippet for ".concat(url, " (Title: ").concat(pageTitle, ")"));
                    successCount++;
                    return [3 /*break*/, 8];
                case 7:
                    console.warn("SEEDER WARN: Extracted empty or minimal snippet from ".concat(url, " after processing."));
                    errorCount++;
                    _a.label = 8;
                case 8: return [3 /*break*/, 10];
                case 9:
                    error_2 = _a.sent();
                    console.error("SEEDER ERROR: Error processing URL ".concat(url, ":"), error_2.message || error_2);
                    if (error_2.name === 'TimeoutError') {
                        console.error("SEEDER ERROR: Fetch timed out for ".concat(url));
                    }
                    errorCount++;
                    return [3 /*break*/, 10];
                case 10:
                    i++;
                    return [3 /*break*/, 2];
                case 11:
                    console.log("\n----------------------------------------");
                    console.log("SEEDER: Snippet seeding process finished.");
                    console.log("Total URLs Processed: ".concat(totalUrls));
                    console.log("Successfully Cached:  ".concat(successCount));
                    console.log("Errors/Skipped:     ".concat(errorCount));
                    console.log("----------------------------------------");
                    // Exit successfully if there were no critical errors preventing the script from running
                    process.exit(0);
                    return [2 /*return*/];
            }
        });
    });
}
// --- Run the Seeder ---
seedSnippets();
