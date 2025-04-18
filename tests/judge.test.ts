import * as fs from 'fs';
import * as path from 'path';
import { JudgeResultValidated } from '@/lib/validateJudge'; // Import the Zod-inferred type
import { Snippet } from '@/lib/retrieveSnippets'; // Import Snippet type

// --- Configuration ---
const GOLDEN_DIR = path.join(__dirname, 'golden');
// Use environment variable for port or default to 3002 based on previous logs
const API_PORT = process.env.PORT || 3002;
const API_ENDPOINT = `http://localhost:${API_PORT}/api/judge`;
const TIMEOUT_MS = 45000; // Increased timeout further for potential RAG fetches + AI call

// --- Define the expected API response structure including optional snippets ---
type JudgeApiResponse = JudgeResultValidated & {
    snippets?: Snippet[];
};

// --- Helper Function to Read Golden File ---
function readGoldenFile(fileName: string): any {
    const filePath = path.join(GOLDEN_DIR, fileName);
    try {
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const data = JSON.parse(fileContent);
        if (!data || !data.input || !data.input.context || !data.input.query) {
             throw new Error(`Invalid structure in ${fileName}. Missing 'input', 'context', or 'query'.`);
        }
        if (!data.expected) {
            data.expected = {}; // Ensure expected object exists
        }
        return data;
    } catch (error: any) {
        throw new Error(`Failed to read or parse golden file ${fileName}: ${error.message}`);
    }
}

// --- Test Suite ---
describe('Golden File Tests for /api/judge', () => {
  let allGoldenFiles: string[] = [];

  // Read golden files before running tests
  try {
    allGoldenFiles = fs.readdirSync(GOLDEN_DIR)
      .filter(file => file.endsWith('.json'));
    if (allGoldenFiles.length === 0) {
      console.warn(`No golden files (.json) found in ${GOLDEN_DIR}. Skipping tests.`);
    } else {
        console.log(`Found golden files: ${allGoldenFiles.join(', ')}`);
    }
  } catch (error) {
    console.error(`Error reading golden directory ${GOLDEN_DIR}:`, error);
    throw new Error(`Could not read golden directory: ${GOLDEN_DIR}`);
  }

  // --- Unified Test Case Generation for all Golden Files ---
  if (allGoldenFiles.length > 0) {
      test.each(allGoldenFiles)(
        'should process golden file %s correctly',
        async (fileName) => {
          const goldenData = readGoldenFile(fileName);

          // 1. Call the API Endpoint
          let response: Response;
          let responseBody: JudgeApiResponse; // Use updated type

          try {
            console.log(`Testing ${fileName} against ${API_ENDPOINT}...`);
            response = await fetch(API_ENDPOINT, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(goldenData.input),
            });

            if (!response.ok) {
               let errorDetails = `Status: ${response.status}`;
               try { const errorJson = await response.json(); errorDetails += `, Body: ${JSON.stringify(errorJson)}`; } catch { /* Ignore */ }
               throw new Error(`API request failed. ${errorDetails}`);
            }
            responseBody = await response.json();

          } catch (error: any) {
             if (error.message.includes('ECONNREFUSED')) { throw new Error(`Fetch failed: Connection refused. Is the dev server running at ${API_ENDPOINT}? Original error: ${error.message}`); }
             // Add check for timeout
             if (error.name === 'TimeoutError' || error.message.includes('timed out')) { throw new Error(`Fetch failed: Request timed out after ${TIMEOUT_MS}ms. API might be slow or unresponsive. Original error: ${error.message}`); }
             throw new Error(`API request failed for ${fileName}: ${error.message}`);
          }

          // 2. Basic Assertions
          expect(response.status).toBe(200);
          expect(responseBody).toBeDefined();
          expect(Array.isArray(responseBody.personas)).toBe(true);
          expect(responseBody.personas).toHaveLength(3);

          // 3. Conditional Assertions based on golden file content

          // Check for expected Analyst verdict
          if (goldenData.expected?.analystVerdict !== undefined) {
            expect(responseBody.personas[1]?.name).toBe("Analyst");
            const analystVerdict = responseBody.personas[1]?.verdict;
            expect(analystVerdict).toBe(goldenData.expected.analystVerdict);
            console.log(`Analyst verdict check passed for ${fileName}. Expected: ${goldenData.expected.analystVerdict}, Got: ${analystVerdict}`);
          }

          // Check for expected citation presence/absence and snippets array
          const citationRegex = /\[\d+\]/; // Matches [1], [2], etc.
          // Combine summary and all rationales for citation check
          const textToCheckForCitations = `${responseBody.summary} ${responseBody.personas.map(p => p.rationale).join(' ')}`;

          if (goldenData.expected?.expectCitation === true) {
            expect(responseBody.summary).toBeDefined(); // Summary should exist
            expect(responseBody.personas.every(p => p.rationale)).toBe(true); // Rationales should exist

            // Check for citation pattern in combined text
            const hasCitation = citationRegex.test(textToCheckForCitations);
            expect(hasCitation).toBe(true); // Expect citation pattern [n]

            // Check for snippets array - Add explicit check before accessing properties
            expect(responseBody.snippets).toBeDefined();
            expect(Array.isArray(responseBody.snippets)).toBe(true);

            // Add type guard/check before accessing length/elements
            if (responseBody.snippets && responseBody.snippets.length > 0) {
                expect(responseBody.snippets.length).toBeGreaterThan(0); // Expect at least one snippet
                // Check structure of the first snippet
                expect(responseBody.snippets[0]).toHaveProperty('url');
                expect(responseBody.snippets[0]).toHaveProperty('text');
                expect(typeof responseBody.snippets[0].url).toBe('string');
                expect(typeof responseBody.snippets[0].text).toBe('string');
            } else {
                // Fail the test if snippets are expected but not found or empty
                throw new Error(`Expected snippets array to be defined and non-empty when expectCitation is true for ${fileName}, but got: ${JSON.stringify(responseBody.snippets)}`);
            }

            console.log(`Citation presence and snippets array check passed for ${fileName}.`);

          } else if (goldenData.expected?.expectCitation === false) {
            expect(responseBody.summary).toBeDefined(); // Summary should still exist
            expect(responseBody.personas.every(p => p.rationale)).toBe(true); // Rationales should still exist

             // Check that citation pattern is NOT present in combined text
            expect(citationRegex.test(textToCheckForCitations)).toBe(false);

            // Check that snippets array is either undefined or empty
            expect(responseBody.snippets === undefined || responseBody.snippets.length === 0).toBe(true);

            console.log(`Absence of citation and snippets check passed for ${fileName}.`);
          }

          // Add more conditional checks here if needed

        },
        TIMEOUT_MS // Apply timeout to each test case
      );
  }

  // --- Placeholder Test ---
  if (allGoldenFiles.length === 0) {
    test('placeholder test because no golden files were found', () => {
      expect(true).toBe(true);
    });
  }
});