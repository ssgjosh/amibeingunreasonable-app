// FILE: app/api/generate-questions/route.js
// --- TEMPORARY DEBUGGING HANDLER ---

// Use NextRequest if you need to read headers, etc., otherwise keep it simple.
// import { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export async function POST(request) {
    console.log("--- DEBUG: /api/generate-questions POST handler reached ---");
    try {
        // Optionally parse body if needed for debug, but avoid complex logic
        // const body = await request.json();
        // console.log("DEBUG: Request body:", body);

        // Return a successful response with a dummy question structure
        return NextResponse.json({
            questions: [
                { id: 1, text: "This is a debug question 1?" },
                { id: 2, text: "This is a debug question 2?" }
            ]
        });

    } catch (error) {
        console.error("--- DEBUG: Error inside simplified generate-questions POST handler:", error);
        return NextResponse.json({ error: "Error in simplified handler", details: error.message }, { status: 500 });
    }
}

// Optional: Add OPTIONS handler just in case
export async function OPTIONS(request) {
  console.log("--- DEBUG: /api/generate-questions OPTIONS handler reached ---");
  return new Response(null, { status: 204, headers: { 'Allow': 'POST, OPTIONS' } });
}