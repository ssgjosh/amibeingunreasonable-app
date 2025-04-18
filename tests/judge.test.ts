import * as fs from 'fs';
import * as path from 'path';
import { JudgeResultValidated } from '@/lib/validateJudge'; // Import the Zod-inferred type

// --- Configuration ---
const GOLDEN_DIR = path.join(__dirname, 'golden');
// Assume the local dev server runs on port 3000. Make this configurable if needed.
const API_ENDPOINT = 'http://localhost:3000/api/judge';
const TIMEOUT_MS = 35000; // Increased timeout slightly for potential external fetches

// --- Helper Function to Read Golden File ---
// Encapsulates reading and basic parsing logic
function readGoldenFile(fileName: string): any {
    const filePath = path.join(GOLDEN_DIR, fileName);
    try {
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const data = JSON.parse(fileContent);
        // Basic validation of expected structure
        if (!data || !data.input || !data.input.context || !data.input.query) {
             throw new Error(`Invalid structure in ${fileName}. Missing 'input', 'context', or 'query'.`);
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
    }
  } catch (error) {
    console.error(`Error reading golden directory ${GOLDEN_DIR}:`, error);
    // Throw error to fail the suite if directory can't be read
    throw new Error(`Could not read golden directory: ${GOLDEN_DIR}`);
  }

  // --- Test Case Generation for Analyst Verdict (Existing Logic) ---
  // Filter out the new tenancy test file if it doesn't have the 'expected.analystVerdict' structure
  const verdictTestFiles = allGoldenFiles.filter(file => {
      try {
          const data = readGoldenFile(file);
          // Check if the specific expected structure for this test exists
          return data.expected?.analystVerdict !== undefined;
      } catch {
          return false; // Exclude files that fail parsing or lack the structure
      }
  });

  if (verdictTestFiles.length > 0) {
      test.each(verdictTestFiles)(
        'should return the expected Analyst verdict for %s',
        async (fileName) => {
          const goldenData = readGoldenFile(fileName); // Use helper

          // 2. Call the API Endpoint
          let response: Response;
          let responseBody: JudgeResultValidated; // Use the validated type

          try {
            response = await fetch(API_ENDPOINT, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(goldenData.input), // Send only input
            });

            if (!response.ok) {
               let errorDetails = `Status: ${response.status}`;
               try { const errorJson = await response.json(); errorDetails += `, Body: ${JSON.stringify(errorJson)}`; } catch { /* Ignore */ }
               throw new Error(`API request failed. ${errorDetails}`);
            }
            responseBody = await response.json();

          } catch (error: any) {
             if (error.message.includes('ECONNREFUSED')) { throw new Error(`Fetch failed: Connection refused. Is the dev server running at ${API_ENDPOINT}? Original error: ${error.message}`); }
             throw new Error(`API request failed for ${fileName}: ${error.message}`);
          }

          // 3. Assertions
          expect(response.status).toBe(200);
          expect(responseBody).toBeDefined();
          expect(Array.isArray(responseBody.personas)).toBe(true);
          expect(responseBody.personas).toHaveLength(3);
          expect(responseBody.personas[1]?.name).toBe("Analyst");

          // Specific Verdict Check
          const analystVerdict = responseBody.personas[1]?.verdict;
          expect(analystVerdict).toBe(goldenData.expected.analystVerdict);

        },
        TIMEOUT_MS // Apply timeout to each test case
      );
  } else {
      console.warn("No golden files found with 'expected.analystVerdict'. Skipping Analyst verdict tests.");
  }


  // --- New Test Case for Tenancy Repair Citation ---
  const tenancyRepairFile = 'tenancy_repair.json';
  if (allGoldenFiles.includes(tenancyRepairFile)) {
      test(`should contain a citation in the summary for ${tenancyRepairFile}`, async () => {
          const goldenData = readGoldenFile(tenancyRepairFile); // Use helper

          // 1. Call the API Endpoint
          let response: Response;
          let responseBody: JudgeResultValidated;

          try {
              response = await fetch(API_ENDPOINT, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(goldenData.input), // Send input
              });

              if (!response.ok) {
                  let errorDetails = `Status: ${response.status}`;
                  try { const errorJson = await response.json(); errorDetails += `, Body: ${JSON.stringify(errorJson)}`; } catch { /* Ignore */ }
                  throw new Error(`API request failed. ${errorDetails}`);
              }
              responseBody = await response.json();

          } catch (error: any) {
              if (error.message.includes('ECONNREFUSED')) { throw new Error(`Fetch failed: Connection refused. Is the dev server running at ${API_ENDPOINT}? Original error: ${error.message}`); }
              throw new Error(`API request failed for ${tenancyRepairFile}: ${error.message}`);
          }

          // 2. Assertions
          expect(response.status).toBe(200);
          expect(responseBody).toBeDefined();
          expect(responseBody.summary).toBeDefined();

          // Check for citation pattern [number] in the summary
          const citationRegex = /\[\d+\]/;
          expect(responseBody.summary).toMatch(citationRegex);
          console.log(`Citation check passed for ${tenancyRepairFile}. Summary: "${responseBody.summary.substring(0, 50)}..."`);


      }, TIMEOUT_MS); // Apply timeout
  } else {
       console.warn(`Golden file ${tenancyRepairFile} not found. Skipping citation test.`);
  }


  // --- Placeholder Test ---
  // Add a placeholder test if no golden files were found at all, so Jest doesn't complain
  if (allGoldenFiles.length === 0) {
    test('placeholder test because no golden files were found', () => {
      expect(true).toBe(true);
    });
  }
});