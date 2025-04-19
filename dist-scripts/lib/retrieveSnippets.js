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
import { WHITELISTED_SOURCES } from './approvedSources.js'; // Import the approved sources and type, add .js
import { openRouter } from './openRouterClient.js'; // Corrected import based on previous fix, add .js
// Initialize Redis client from environment variables
var redis = null;
var redisUrl = process.env.STORAGE_KV_REST_API_URL;
var redisToken = process.env.STORAGE_KV_REST_API_TOKEN;
if (redisUrl && redisToken) {
    try {
        redis = new Redis({
            url: redisUrl,
            token: redisToken,
        });
        console.log("Redis client initialized successfully for snippet retrieval using STORAGE_KV variables.");
    }
    catch (error) {
        console.error("Failed to initialize Redis client with provided STORAGE_KV variables:", error);
    }
}
else {
    console.error("Missing required Redis environment variables: STORAGE_KV_REST_API_URL or STORAGE_KV_REST_API_TOKEN");
}
/**
 * Retrieves text snippets for a given list of relevant URLs, using caching.
 * Fetches content from the provided URLs.
 * @param relevantUrls An array of URLs deemed relevant by the primary semantic search.
 * @param userQuery The original user query (used for context in logging).
 * @returns A promise that resolves to an array of Snippet objects.
 */
export function retrieveSnippets(relevantUrls, userQuery) {
    return __awaiter(this, void 0, void 0, function () {
        var retrievedSnippets, cacheTTL, failureCacheTTL, failureCachePrefix, maxWordsPerSnippet, _loop_1, _i, relevantUrls_1, url;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (!redis) {
                        console.error("retrieveSnippets: Redis client not available.");
                        return [2 /*return*/, []];
                    }
                    // Check the exported client instance directly
                    if (!openRouter) {
                        console.error("retrieveSnippets: OpenRouter client instance not available.");
                        return [2 /*return*/, []];
                    }
                    // Input validation
                    if (!Array.isArray(relevantUrls) || relevantUrls.length === 0) {
                        console.log("[RAG] retrieveSnippets called with no relevant URLs. Returning empty array.");
                        return [2 /*return*/, []];
                    }
                    retrievedSnippets = [];
                    cacheTTL = 60 * 60 * 24 * 30;
                    failureCacheTTL = 60 * 5;
                    failureCachePrefix = 'snippet_fail:';
                    maxWordsPerSnippet = 80;
                    console.log("[RAG] Starting snippet retrieval for ".concat(relevantUrls.length, " relevant URLs."));
                    _loop_1 = function (url) {
                        var cacheKey, sourceInfo, pageTitle, cachedData, useCache, potentialSnippet, snippetText, summaryKey, failureKey, failed, existsError_1, summary, hgetError_1, failCacheError_1, newSnippet, cacheError_1, error_1;
                        return __generator(this, function (_c) {
                            switch (_c.label) {
                                case 0:
                                    cacheKey = "snippet:".concat(url);
                                    _c.label = 1;
                                case 1:
                                    _c.trys.push([1, 18, , 19]);
                                    sourceInfo = WHITELISTED_SOURCES.find(function (source) { return source.url === url; });
                                    pageTitle = void 0;
                                    if (sourceInfo && sourceInfo.name) {
                                        pageTitle = sourceInfo.name;
                                    }
                                    else {
                                        console.warn("[RAG] URL ".concat(url, " not found in WHITELISTED_SOURCES or missing 'name'. Using URL as fallback title."));
                                        pageTitle = url; // Fallback to URL if not found or name is missing
                                    }
                                    return [4 /*yield*/, redis.get(cacheKey)];
                                case 2:
                                    cachedData = _c.sent();
                                    useCache = false;
                                    if (cachedData !== null && cachedData !== undefined) {
                                        potentialSnippet = null;
                                        if (typeof cachedData === 'string') {
                                            try {
                                                potentialSnippet = JSON.parse(cachedData);
                                            }
                                            catch ( /* ignore parse error */_d) { /* ignore parse error */ }
                                        }
                                        else if (typeof cachedData === 'object') {
                                            potentialSnippet = cachedData;
                                        }
                                        // Validate cache structure AND title match
                                        if (potentialSnippet &&
                                            typeof potentialSnippet.url === 'string' &&
                                            typeof potentialSnippet.title === 'string' &&
                                            typeof potentialSnippet.text === 'string' &&
                                            potentialSnippet.title === pageTitle) { // Check if cached title matches the correct pre-defined title
                                            console.log("[RAG] Cache HIT for ".concat(url, " with matching title."));
                                            retrievedSnippets.push(potentialSnippet);
                                            useCache = true; // Valid cache entry found
                                        }
                                        else if (potentialSnippet) {
                                            // Log why cache is invalid (structure or title mismatch)
                                            if (potentialSnippet.title !== pageTitle) {
                                                console.warn("[RAG] Cache INVALID for ".concat(url, ": Title mismatch (Expected: \"").concat(pageTitle, "\", Found: \"").concat(potentialSnippet.title, "\"). Will refetch."));
                                            }
                                            else {
                                                console.warn("[RAG] Cache INVALID for ".concat(url, ": Invalid object structure. Will refetch."));
                                            }
                                        }
                                        else {
                                            console.log("[RAG] Cache MISS for ".concat(url, " (Could not parse cached data)."));
                                        }
                                    }
                                    else {
                                        console.log("[RAG] Cache MISS for ".concat(url, " (No data found)."));
                                    }
                                    // If valid cache was found and used, skip to the next URL
                                    if (useCache) {
                                        return [2 /*return*/, "continue"];
                                    }
                                    // --- 3. Fetch Pre-generated Summary from Redis Hash ---
                                    console.log("[RAG] Cache MISS/INVALID for ".concat(url, ". Fetching pre-generated summary from Redis hash..."));
                                    snippetText = void 0;
                                    summaryKey = 'source_summaries';
                                    failureKey = failureCachePrefix + url;
                                    _c.label = 3;
                                case 3:
                                    _c.trys.push([3, 5, , 6]);
                                    return [4 /*yield*/, redis.exists(failureKey)];
                                case 4:
                                    failed = _c.sent();
                                    if (failed) {
                                        console.warn("[RAG] Skipping summary fetch for ".concat(url, " due to recent failure."));
                                        return [2 /*return*/, "continue"];
                                    }
                                    return [3 /*break*/, 6];
                                case 5:
                                    existsError_1 = _c.sent();
                                    console.error("[RAG] Error checking failure cache key ".concat(failureKey, ":"), existsError_1);
                                    return [3 /*break*/, 6];
                                case 6:
                                    _c.trys.push([6, 8, , 13]);
                                    return [4 /*yield*/, redis.hget(summaryKey, url)];
                                case 7:
                                    summary = _c.sent();
                                    if (summary) {
                                        console.log("[RAG] Found pre-generated summary for ".concat(url, " in hash '").concat(summaryKey, "'."));
                                        snippetText = summary;
                                    }
                                    else {
                                        console.warn("[RAG] Pre-generated summary not found for ".concat(url, " in hash '").concat(summaryKey, "'. Using placeholder."));
                                        snippetText = "Summary not available.";
                                    }
                                    return [3 /*break*/, 13];
                                case 8:
                                    hgetError_1 = _c.sent();
                                    console.error("[RAG] Error fetching summary for ".concat(url, " from Redis hash '").concat(summaryKey, "':"), hgetError_1);
                                    snippetText = "Error retrieving summary."; // Use error placeholder
                                    _c.label = 9;
                                case 9:
                                    _c.trys.push([9, 11, , 12]);
                                    return [4 /*yield*/, redis.set(failureKey, 'failed', { ex: failureCacheTTL })];
                                case 10:
                                    _c.sent();
                                    console.log("[RAG] Set failure cache key ".concat(failureKey, " for ").concat(failureCacheTTL, " seconds."));
                                    return [3 /*break*/, 12];
                                case 11:
                                    failCacheError_1 = _c.sent();
                                    console.error("[RAG] Error setting failure cache key ".concat(failureKey, ":"), failCacheError_1);
                                    return [3 /*break*/, 12];
                                case 12: return [3 /*break*/, 13];
                                case 13:
                                    newSnippet = { url: url, title: pageTitle, text: snippetText };
                                    console.log("[RAG] Caching final snippet object for ".concat(url, " (Title: ").concat(pageTitle, ")."));
                                    _c.label = 14;
                                case 14:
                                    _c.trys.push([14, 16, , 17]);
                                    return [4 /*yield*/, redis.set(cacheKey, JSON.stringify(newSnippet), { ex: cacheTTL })];
                                case 15:
                                    _c.sent();
                                    retrievedSnippets.push(newSnippet);
                                    return [3 /*break*/, 17];
                                case 16:
                                    cacheError_1 = _c.sent();
                                    console.error("[RAG] Error caching final snippet object for ".concat(url, ":"), cacheError_1);
                                    // Still push the snippet even if caching fails, so the user sees it
                                    retrievedSnippets.push(newSnippet);
                                    return [3 /*break*/, 17];
                                case 17: return [3 /*break*/, 19];
                                case 18:
                                    error_1 = _c.sent();
                                    // Catch errors from the outer try block (e.g., fetch failure before relevance check)
                                    console.error("[RAG] Outer error processing URL ".concat(url, ":"), error_1.message || error_1);
                                    if (error_1.name === 'TimeoutError' || ((_a = error_1.message) === null || _a === void 0 ? void 0 : _a.includes('timed out'))) { // Broader timeout check
                                        console.error("[RAG] Fetch timed out for ".concat(url));
                                    }
                                    return [2 /*return*/, "continue"];
                                case 19: return [2 /*return*/];
                            }
                        });
                    };
                    _i = 0, relevantUrls_1 = relevantUrls;
                    _b.label = 1;
                case 1:
                    if (!(_i < relevantUrls_1.length)) return [3 /*break*/, 4];
                    url = relevantUrls_1[_i];
                    return [5 /*yield**/, _loop_1(url)];
                case 2:
                    _b.sent();
                    _b.label = 3;
                case 3:
                    _i++;
                    return [3 /*break*/, 1];
                case 4:
                    console.log("[RAG] Finished snippet retrieval. URLs processed=".concat(relevantUrls.length, ", Snippets returned=").concat(retrievedSnippets.length));
                    return [2 /*return*/, retrievedSnippets];
            }
        });
    });
}
