import { Redis } from '@upstash/redis';
import { NextResponse } from 'next/server';

// Initialize Upstash Redis client
const redis = new Redis({
  url: process.env.STORAGE_KV_REST_API_URL,
  token: process.env.STORAGE_KV_REST_API_TOKEN,
});

// Updated function signature to address Next.js warning
export async function GET(request, context) {
  // Destructure id from context.params inside the function
  const { id } = context.params;

  // Validate environment variables
  if (!process.env.STORAGE_KV_REST_API_URL || !process.env.STORAGE_KV_REST_API_TOKEN) {
      console.error("Upstash Redis environment variables are not configured.");
      return NextResponse.json({ error: 'Server configuration error: Storage credentials missing.' }, { status: 500 });
  }

  // Validate the extracted ID
  if (!id) {
    console.warn("Missing result ID in request context params."); // Log as warning
    return NextResponse.json({ error: 'Missing result ID in request' }, { status: 400 });
  }

  const key = `result:${id}`;
  console.log(`Attempting to retrieve hash data for key: ${key}`);

  try {
    // Retrieve the full results data hash from Upstash Redis
    const fullResultsData = await redis.hgetall(key);

    if (fullResultsData === null) {
      console.log(`No data found for key: ${key}`);
      return NextResponse.json({ error: 'Results not found or expired' }, { status: 404 });
    }

    console.log(`Successfully retrieved full data for key: ${key}`);

    // Helper function to safely get and potentially parse array data
    // Assumes Upstash driver might return stringified JSON or already parsed objects/arrays
    const getArrayData = (field) => {
        if (!field) return []; // Return empty array if field is null/undefined
        if (Array.isArray(field)) return field; // Already an array
        if (typeof field === 'string') {
            try {
                const parsed = JSON.parse(field);
                return Array.isArray(parsed) ? parsed : []; // Return parsed array or empty if not array
            } catch (e) {
                console.warn(`Field for key ${key} was a string but not valid JSON:`, field, e);
                return []; // Not valid JSON string
            }
        }
        console.warn(`Field for key ${key} is neither string nor array:`, typeof field);
        return []; // Unexpected type
    };


    // Filter and structure the data for the public share page.
    // REMOVED explicit JSON.parse, assuming hgetall returns appropriate types or strings
    // Use helper function for arrays to handle different possibilities
    const publicResultsData = {
      context: fullResultsData.context || 'No context provided.',
      query: fullResultsData.chosenQuestion || 'No question provided.', // Map chosenQuestion to query
      summary: fullResultsData.summary || null, // Use null if missing
      quickVerdict: fullResultsData.quickVerdict || null, // Use null if missing
      // Safely get array data
      answers: getArrayData(fullResultsData.answers),
      responses: getArrayData(fullResultsData.responses),
      followUpResponses: getArrayData(fullResultsData.followUpResponses),
      // Other fields
      timestamp: fullResultsData.timestamp || null,
      paraphrase: fullResultsData.paraphrase || null,
    };

    console.log(`Returning structured public data for key: ${key}`); // Removed data logging for brevity

    // Return the structured public results data object
    return NextResponse.json(publicResultsData, { status: 200 });

  } catch (error) {
    // Log the specific error during retrieval/processing
    console.error(`Error processing results hash from Upstash for key ${key}:`, error);

    if (error instanceof Error) {
        console.error(`Error type: ${error.constructor.name}, Message: ${error.message}`);
        // Return a generic error message to the client
        return NextResponse.json({ error: `Failed to retrieve results due to a server error.` }, { status: 500 });
    } else {
        console.error(`Caught non-standard error type: ${error?.constructor?.name || typeof error}`);
        return NextResponse.json({ error: 'An unexpected server error occurred while retrieving results.' }, { status: 500 });
    }
  }
}