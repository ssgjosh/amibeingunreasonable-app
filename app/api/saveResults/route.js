import { Redis } from '@upstash/redis';
import { nanoid } from 'nanoid';
import { NextResponse } from 'next/server';

// Optional: Set an expiration time for stored results in seconds (e.g., 30 days)
const RESULT_EXPIRATION_SECONDS = 60 * 60 * 24 * 30;

// Initialize Upstash Redis client using the correct Vercel env variable names
const redis = new Redis({
  url: process.env.STORAGE_KV_REST_API_URL, // Corrected env var name
  token: process.env.STORAGE_KV_REST_API_TOKEN, // Corrected env var name
});

export async function POST(request) {
  console.log("POST /api/saveResults received request.");
  // Validate environment variables
  if (!process.env.STORAGE_KV_REST_API_URL || !process.env.STORAGE_KV_REST_API_TOKEN) {
      console.error("Upstash Redis environment variables (STORAGE_KV_REST_API_URL, STORAGE_KV_REST_API_TOKEN) are not configured.");
      return NextResponse.json({ error: 'Server configuration error: Storage credentials missing.' }, { status: 500 });
  }

  try {
    const resultsData = await request.json();
    console.log("Successfully parsed request body JSON.");

    // Basic validation: Check if resultsData is an object and not empty
    if (typeof resultsData !== 'object' || resultsData === null || Object.keys(resultsData).length === 0) {
      console.error("Invalid or empty results data received:", resultsData);
      return NextResponse.json({ error: 'Missing or invalid results data' }, { status: 400 });
    }

    // **TODO (Frontend):** Ensure resultsData contains fields like:
    // query: string
    // chosenQuestion: string
    // followUpQuestions: string[] or object[]
    // summary: string
    // quickVerdict: string
    // answers: string[] or object[]
    // (Add any other fields you need for QA)

    const id = nanoid(10); // Generate a 10-character unique ID
    const key = `result:${id}`;

    console.log(`Saving data to Redis hash with key ${key}.`);

    // Store the results data as a Hash in Upstash Redis
    // The `hset` command takes an object and stores its key-value pairs.
    // Note: Redis hashes store values as strings. Complex objects/arrays within resultsData
    // will be automatically stringified by the driver, but retrieving them might require JSON.parse().
    await redis.hset(key, resultsData);

    // Set an expiration time for the entire hash
    await redis.expire(key, RESULT_EXPIRATION_SECONDS);

    console.log(`Successfully saved data to Redis hash ${key}.`);

    // Return the generated ID
    return NextResponse.json({ id: id }, { status: 200 });

  } catch (error) {
    console.error('Error saving results to Upstash:', error);
    if (error instanceof Error) {
        return NextResponse.json({ error: `Failed to save results: ${error.message}` }, { status: 500 });
    }
    return NextResponse.json({ error: 'Failed to save results due to an unknown error' }, { status: 500 });
  }
}