# Edge Function Architecture

## Current Architecture (Node.js Serverless Function)

```mermaid
sequenceDiagram
    Client->>+Next.js API: POST /api/getResponses
    Note over Next.js API: Node.js Runtime
    Next.js API->>+OpenRouter: Request Paraphrase
    OpenRouter-->>-Next.js API: Response
    Next.js API->>+OpenRouter: Request Persona 1
    OpenRouter-->>-Next.js API: Response
    Next.js API->>+OpenRouter: Request Persona 2
    OpenRouter-->>-Next.js API: Response
    Next.js API->>+OpenRouter: Request Persona 3
    OpenRouter-->>-Next.js API: Response
    Next.js API->>+OpenRouter: Request Summary
    OpenRouter-->>-Next.js API: Response
    Next.js API->>+Redis: Store Results
    Redis-->>-Next.js API: Confirmation
    Next.js API-->>-Client: JSON Response with resultId
    Note over Next.js API: ❌ May timeout after 30s
```

## New Architecture (Edge Function with Streaming)

```mermaid
sequenceDiagram
    Client->>+Next.js API: POST /api/getResponses
    Note over Next.js API: Edge Runtime
    Next.js API->>+OpenRouter: Stream Request
    OpenRouter-->>Next.js API: First Token (<1s)
    Next.js API-->>Client: Begin Streaming Response
    Note over Client: ✅ First byte received < 25s
    loop Streaming
        OpenRouter-->>Next.js API: Token
        Next.js API-->>Client: Token
    end
    OpenRouter-->>-Next.js API: End of Stream
    Next.js API-->>-Client: End of Stream
    Note over Next.js API: ✅ Can stream for up to 300s
```

## Benefits of Edge Functions

1. **Faster Initial Response**: Edge Functions deliver the first byte in under 1 second
2. **Extended Runtime**: Can stream for up to 300 seconds on any plan (including Hobby)
3. **Global Distribution**: Run closer to users at the edge of the network
4. **No Timeouts**: Bypass the Node.js 30/60 second limits on the Hobby plan

## Implementation Differences

| Feature | Node.js Serverless | Edge Function |
|---------|-------------------|---------------|
| Runtime | Node.js | Edge |
| Response Type | JSON | Streaming |
| Max Duration | 30s (Hobby) / 60s (Pro) | 300s (All plans) |
| First Byte | After completion | <1s |
| API Calls | Multiple sequential | Single streaming |
| Redis Storage | Yes | Not in initial implementation |
| Complex Logic | Multiple personas | Simplified for streaming |