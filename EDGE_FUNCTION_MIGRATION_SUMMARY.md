# Edge Function Migration Summary

## Problem Statement

The current API endpoint at `/app/api/getResponses/route.js` is experiencing timeout issues on Vercel's Hobby plan:

- It runs as a Node.js serverless function with a 30-second timeout limit
- It makes multiple sequential API calls to OpenRouter without streaming
- It processes complex logic for multiple personas and stores results in Redis
- Users are experiencing 504 Gateway Timeout errors

## Solution Overview

Convert the API endpoint to an Edge Function that streams the OpenRouter response:

- Edge Functions can stream for up to 300 seconds on any plan (including Hobby)
- Streaming sends the first byte in under 1 second, preventing timeouts
- The initial implementation will focus on basic streaming functionality
- Future enhancements will reintegrate the multi-persona logic and Redis storage

## Implementation Documents

We've created several documents to guide the implementation:

1. [Edge Function Implementation Plan](./EDGE_FUNCTION_IMPLEMENTATION_PLAN.md) - Detailed steps for implementing the basic streaming functionality
2. [Edge Function Architecture](./EDGE_FUNCTION_ARCHITECTURE.md) - Visual diagrams comparing the current and new architectures
3. [Edge Function Future Enhancements](./EDGE_FUNCTION_FUTURE_ENHANCEMENTS.md) - Plans for reintegrating multi-persona logic and Redis storage

## Implementation Steps

### Phase 1: Basic Streaming Implementation

1. Install required dependencies:
   ```bash
   npm i openai ai @vercel/ai
   ```

2. Create a new TypeScript file at `/app/api/getResponses/route.ts` with the Edge Function implementation:
   ```typescript
   import { OpenAIStream, StreamingTextResponse } from "ai";
   import OpenAI from "openai";

   export const runtime = "edge";          // run as Edge Function

   export async function POST(req: Request) {
     const { messages } = await req.json();

     const openai = new OpenAI({
       baseURL: "https://openrouter.ai/api/v1",
       apiKey: process.env.OPENROUTER_API_KEY,
     });

     const response = await openai.chat.completions.create({
       model: "openai/gpt-4o",
       messages,
       stream: true,
     });

     const stream = OpenAIStream(response);
     return new StreamingTextResponse(stream);   // flushes first token < 1 s
   }
   ```

3. Ensure the environment variable `OPENROUTER_API_KEY` is set in Vercel → Project → Settings → Environment Variables (Production)

4. Deploy and verify in Vercel → Deployments → Functions that:
   - The route is listed as "edge"
   - The function completes without a 504 timeout
   - The client receives streamed tokens

### Phase 2: Future Enhancements

Once the basic streaming implementation is confirmed working, we can proceed with:

1. Reintegrating the multi-persona logic (see [Future Enhancements](./EDGE_FUNCTION_FUTURE_ENHANCEMENTS.md) for options)
2. Adapting the Redis storage to work with Edge Functions
3. Adding error handling and monitoring

## Benefits of This Approach

1. **Immediate Resolution of Timeout Issues**: The streaming implementation will prevent 504 errors
2. **Improved User Experience**: Users will see responses start to appear immediately
3. **Cost Efficiency**: Works on the Hobby plan without requiring an upgrade
4. **Future Flexibility**: The architecture can be enhanced incrementally

## Next Steps

1. **Switch to Code Mode**: To implement the TypeScript changes
2. **Test Locally**: Verify the streaming functionality works as expected
3. **Deploy to Vercel**: Confirm the function runs as an Edge Function without timeouts
4. **Plan Phase 2**: Once basic streaming is confirmed, plan the reintegration of advanced features

## Conclusion

This migration to an Edge Function with streaming will resolve the timeout issues while providing a foundation for future enhancements. The phased approach allows for immediate resolution of the critical issue while providing a path to restore full functionality.