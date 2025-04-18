export interface JudgeResult {
  paraphrase: string; // A concise one-sentence summary from the user's perspective
  personas: {
    name: "Therapist" | "Analyst" | "Coach"; // The specific persona providing the verdict
    verdict: "Yes" | "No" | "Partially"; // The persona's judgment on the user's query
    rationale: string; // The reasoning behind the verdict (target <= 120 words)
    key_points: [string, string, string]; // Three distinct key takeaways or observations
  }[]; // Array containing results from each persona
  summary: string; // A unified verdict and actionable advice (target <= 120 words)
}