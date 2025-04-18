import OpenAI from "openai";

export const runtime = "edge";  // run as Edge Function

export async function POST(req: Request) {
  const requestBody = await req.json();
  let messages;

  // Check if the request body contains context and query fields (original format)
  if (requestBody.context && requestBody.query) {
    const { context, query, followUpResponses } = requestBody;
    
    console.log("ROUTE RECEIVED - Context Type:", typeof context, "Length:", context?.length);
    console.log("ROUTE RECEIVED - Query Type:", typeof query, "Length:", query?.length);
    console.log("ROUTE RECEIVED - Query Value:", query);
    
    // Input Validation (similar to original implementation)
    if (!context || typeof context !== 'string' || context.trim().length < 10) {
      console.warn("ROUTE Validation failed: Context insufficient.");
      return Response.json({ error: "Context description required (min 10 chars)." }, { status: 400 });
    }
    if (!query || typeof query !== 'string' || query.trim().length < 5) {
      console.warn("ROUTE Validation failed: Query insufficient.");
      return Response.json({ error: "Specific query/worry required (min 5 chars)." }, { status: 400 });
    }
    
    // Convert context and query to messages format
    messages = [
      { role: 'system', content: 'You are a helpful assistant analyzing the following situation.' },
      { role: 'user', content: `Context: ${context}\n\nQuery: ${query}` }
    ];
    
    // Add follow-up responses if available
    if (followUpResponses && Array.isArray(followUpResponses) && followUpResponses.length > 0) {
      const validFollowUps = followUpResponses.filter(item =>
        item && typeof item.question === 'string' && typeof item.answer === 'string' &&
        item.question.trim() && item.answer.trim()
      );
      
      if (validFollowUps.length > 0) {
        const followUpContent = validFollowUps.map(item => 
          `Q: ${item.question}\nA: ${item.answer}`
        ).join('\n\n');
        
        messages.push({ 
          role: 'user', 
          content: `Additional Context from Follow-up Questions:\n${followUpContent}` 
        });
      }
    }
  } else if (requestBody.messages) {
    // If the request body already contains messages, use them directly
    messages = requestBody.messages;
  } else {
    // If neither format is provided, return an error
    console.warn("ROUTE Validation failed: Invalid request format.");
    return Response.json({ 
      error: "Invalid request format. Provide either 'context' and 'query' or 'messages'." 
    }, { status: 400 });
  }

  // Check for API key
  if (!process.env.OPENROUTER_API_KEY) {
    console.error("ROUTE API Key Error: OPENROUTER_API_KEY env var missing.");
    return Response.json({ 
      error: "Server configuration error: API key missing." 
    }, { status: 500 });
  }

  const openai = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY,
  });

  try {
    // Create a streaming response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        // Create a callback to handle each chunk of the OpenAI stream
        const onChunk = (chunk: any) => {
          // Check if the chunk has content
          if (chunk.choices && chunk.choices[0]?.delta?.content) {
            const text = chunk.choices[0].delta.content;
            controller.enqueue(encoder.encode(text));
          }
        };

        try {
          // Create a streaming completion
          const completion = await openai.chat.completions.create({
            model: "openai/gpt-4o",
            messages,
            stream: true,
            temperature: 0.7,
          });

          // Process each chunk of the stream
          for await (const chunk of completion) {
            onChunk(chunk);
          }

          // Signal the end of the stream
          controller.close();
        } catch (error) {
          // Handle errors during streaming
          console.error("Streaming error:", error);
          controller.error(error);
        }
      }
    });

    // Return a streaming response
    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error: any) {
    console.error("ROUTE Error generating response:", error);
    const errorMessage = error && typeof error === 'object' && 'message' in error 
      ? String(error.message) 
      : 'Unknown error';
    
    return Response.json({ 
      error: `Error generating response: ${errorMessage}` 
    }, { status: 500 });
  }
}