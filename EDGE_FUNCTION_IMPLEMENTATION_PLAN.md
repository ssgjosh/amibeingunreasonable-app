# Edge Function Implementation Plan

## Overview

This document outlines the plan for converting the existing API endpoint at `/app/api/getResponses/route.js` into an Edge Function that streams the OpenRouter response. This change will prevent the function from hitting the 30-second timeout limit on Vercel's Hobby plan.

## Current Issues

- The existing API endpoint runs as a Node.js serverless function and times out after 30 seconds (504 error)
- It makes multiple sequential API calls to OpenRouter without streaming
- It waits for all responses to complete before returning

## Implementation Steps

### 1. Add Required Dependencies

```bash
npm i openai ai @vercel/ai
```

Note: The `openai` package is already installed, but we'll include it in the command for completeness.

### 2. Replace the Existing Route with an Edge Function

Create a new TypeScript file at `/app/api/getResponses/route.ts` with the following content:

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

### 3. Environment Variables

Ensure the environment variable `OPENROUTER_API_KEY` is set in Vercel:
- Go to Vercel → Project → Settings → Environment Variables (Production)
- Add or verify the `OPENROUTER_API_KEY` variable

### 4. Verification

After deployment, verify in Vercel → Deployments → Functions that:
- The route is listed as "edge"
- The function completes without a 504 timeout
- The client receives streamed tokens

## Technical Details

### Edge Functions vs. Serverless Functions

- **Edge Functions** run closer to users at the edge of the network
- They must send the first byte < 25 seconds, then can stream for up to 300 seconds on any plan
- This bypasses the Node.js 30/60 second limits on the Hobby plan

### Streaming Implementation

- The `OpenAIStream` from `@vercel/ai` handles the streaming of tokens from OpenRouter
- `StreamingTextResponse` is a helper that sets the appropriate headers for streaming
- The first token is flushed in less than 1 second, preventing timeouts

## Future Considerations

Once the basic streaming implementation is confirmed working, we can consider:

1. Reintegrating the multi-persona logic
2. Adapting the Redis storage to work with Edge Functions
3. Enhancing the streaming implementation with additional features

## Next Steps

1. Switch to Code mode to implement these changes
2. Test the implementation locally
3. Deploy to Vercel and verify the function is running as expected