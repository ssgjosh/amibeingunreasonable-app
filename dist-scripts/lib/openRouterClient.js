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
import path from 'path';
import OpenAI from 'openai';
// Load environment variables from .env.local at project root FIRST
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
var OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
var OPENROUTER_API_BASE = "https://openrouter.ai/api/v1";
// Recommended headers for OpenRouter
var OPENROUTER_REFERRER = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"; // Use an env var or fallback
var OPENROUTER_APP_TITLE = process.env.NEXT_PUBLIC_APP_TITLE || "AmIBeingUnreasonable"; // Use an env var or fallback
if (!OPENROUTER_API_KEY) {
    // Log the error in production environments, throw in development?
    // For now, always throw to make misconfiguration obvious.
    console.error("Configuration Error: process.env.OPENROUTER_API_KEY is not defined.");
    throw new Error("Configuration Error: process.env.OPENROUTER_API_KEY is not defined.");
}
// Instantiate and export the OpenAI client configured for OpenRouter
export var openRouter = new OpenAI({
    apiKey: OPENROUTER_API_KEY,
    baseURL: OPENROUTER_API_BASE,
    defaultHeaders: {
        "HTTP-Referer": OPENROUTER_REFERRER,
        "X-Title": OPENROUTER_APP_TITLE,
    },
    // dangerouslyAllowBrowser: true, // Only if using in client-side components, generally avoid
});
/**
 * Generates a chat completion using the OpenRouter API.
 *
 * @param messages An array of message objects (e.g., [{ role: 'user', content: 'Hello!' }]).
 * @param model The model to use (defaults to 'openai/gpt-4.1').
 * @param temperature Optional temperature setting (defaults to 0.7).
 * @param maxTokens Optional max tokens setting.
 * @returns A Promise resolving to the content of the assistant's response, or null if no content.
 * @throws Error if the API call fails or the API key is missing.
 */
export function getOpenRouterCompletion(messages_1) {
    return __awaiter(this, arguments, void 0, function (messages, model, // Default model specified by user
    temperature, maxTokens) {
        var completionParams, completion, responseContent, error_1;
        var _a, _b;
        if (model === void 0) { model = "openai/gpt-4.1"; }
        if (temperature === void 0) { temperature = 0.7; }
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    // Check key again just before use, although the initial check should prevent this.
                    if (!OPENROUTER_API_KEY) {
                        console.error("Runtime Configuration Error: OPENROUTER_API_KEY became undefined.");
                        throw new Error("Runtime Configuration Error: OPENROUTER_API_KEY is missing.");
                    }
                    console.log("\u2023 OpenRouter - Requesting completion from model: ".concat(model));
                    _c.label = 1;
                case 1:
                    _c.trys.push([1, 3, , 4]);
                    completionParams = {
                        model: model,
                        messages: messages,
                        temperature: temperature,
                        // stream: false, // Default is false
                    };
                    if (maxTokens !== undefined) {
                        completionParams.max_tokens = maxTokens;
                    }
                    return [4 /*yield*/, openRouter.chat.completions.create(completionParams)];
                case 2:
                    completion = _c.sent();
                    // Basic logging of usage (consider more detailed logging if needed)
                    if (completion.usage) {
                        console.log("\u2023 OpenRouter - Usage: Prompt tokens: ".concat(completion.usage.prompt_tokens, ", Completion tokens: ").concat(completion.usage.completion_tokens, ", Total tokens: ").concat(completion.usage.total_tokens));
                    }
                    responseContent = (_b = (_a = completion.choices[0]) === null || _a === void 0 ? void 0 : _a.message) === null || _b === void 0 ? void 0 : _b.content;
                    if (responseContent === null || responseContent === undefined) {
                        console.warn("‣ OpenRouter - Received null or undefined content in response.");
                        // Decide whether to return null or throw an error based on how consuming code should react
                        return [2 /*return*/, null];
                    }
                    if (responseContent.trim() === "") {
                        console.warn("‣ OpenRouter - Received empty string content in response.");
                        // Often better to return null for empty strings too, unless an empty string is valid
                        return [2 /*return*/, null];
                    }
                    console.log("‣ OpenRouter - Completion received successfully.");
                    return [2 /*return*/, responseContent];
                case 3:
                    error_1 = _c.sent();
                    console.error("‣ OpenRouter - API call failed:", error_1);
                    // Consider more specific error handling based on error type/status code
                    // e.g., check for error.status === 401 for auth errors, 429 for rate limits
                    if (error_1 instanceof OpenAI.APIError) {
                        console.error("\u2023 OpenRouter - API Error Details: Status ".concat(error_1.status, ", Type: ").concat(error_1.type, ", Code: ").concat(error_1.code));
                        // Potentially re-throw a more specific error or handle based on status
                        throw new Error("OpenRouter API Error (Status ".concat(error_1.status, "): ").concat(error_1.message));
                    }
                    else {
                        // Non-API error (e.g., network issue)
                        throw new Error("OpenRouter request failed: ".concat(error_1.message));
                    }
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    });
}
