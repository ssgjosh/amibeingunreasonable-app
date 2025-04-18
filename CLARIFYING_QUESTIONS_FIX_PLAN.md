# Plan to Fix Clarifying Questions Usage and Display

This plan addresses two issues related to the initial clarifying questions asked before the main AI analysis:
1.  Ensuring the answers provided by the user are correctly used by the backend when generating the analysis.
2.  Ensuring the clarifying questions and answers are displayed correctly as part of the "Original Context" on the results page, distinct from the interactive persona chat history.

## Goal 1: Ensure Clarifying Q&A is Used in Backend Analysis

*   **Problem:** The frontend component `components/home/FollowUpQuestionsSection.js` collects answers into an object (`{ 0: "ans0", 1: "ans1" }`) but passes this object to the `useAnalysis` hook. The hook expects an array (`[{question: "q0", answer: "ans0"}, ...]`) and passes the received object format to the `/api/getResponses` backend. The backend likely fails to process this incorrect format, preventing the answers from influencing the analysis.
*   **Solution:** Modify `components/home/FollowUpQuestionsSection.js`.
    *   **Inside `handleSubmit` function:** Before calling `proceedToAnalysis`, transform the `followUpAnswers` object into an array of `{question: string, answer: string}` objects. Use the `followUpQuestions` prop to get the corresponding question text for each answer. Filter out entries where the answer is empty or the question is missing.
        ```javascript
        // Example transformation logic:
        const formattedAnswers = Object.entries(followUpAnswers)
          .map(([index, answer]) => {
            const questionIndex = parseInt(index, 10);
            if (!isNaN(questionIndex) && followUpQuestions[questionIndex] && answer && answer.trim()) {
              return { question: followUpQuestions[questionIndex], answer: answer.trim() };
            }
            return null;
          })
          .filter(item => item !== null);

        proceedToAnalysis(formattedAnswers); // Call with the formatted array
        ```
    *   **Inside `handleSkip` function:** Change the call from `proceedToAnalysis({})` to `proceedToAnalysis([])` to pass an empty array when skipping.

## Goal 2: Display Clarifying Q&A Under "Original Context" and Keep Persona Chat Separate

*   **Problem:** The results page (`app/results/[id]/page.js`) fetches the saved clarifying Q&A (`resultsData.followUpResponses`) but doesn't display it. It incorrectly passes the interactive persona chat history (`followUpHistory` state) to the `ReferenceDrawer` component using the `followUpResponses` prop name. This results in the persona chat appearing under the "Follow-up Q&A History" label, while the actual clarifying Q&A is hidden.
*   **Solution:**
    1.  **Modify `app/results/[id]/page.js`:**
        *   Pass the fetched initial clarifying Q&A (`resultsData.followUpResponses`) to the `ReferenceDrawer` component using a new, distinct prop name, for example, `initialClarifications`.
        *   Continue passing the local interactive chat history state (`followUpHistory`) using the existing `followUpResponses` prop name (or rename both the state and prop for better clarity, e.g., `interactiveChatHistory`).
        ```javascript
        // Example modification within the return statement:
        <ReferenceDrawer
          context={resultsData.context}
          snippets={resultsData.snippets || []}
          initialClarifications={resultsData.followUpResponses || []} // Pass initial clarifying Q&A
          followUpResponses={followUpHistory} // Pass interactive chat history (potentially rename state/prop)
        />
        ```
    2.  **Modify `components/results/ReferenceDrawer.js`:**
        *   **Accept the new prop:** Add `initialClarifications` (or the chosen name) to the component's props destructuring.
        *   **Display initial Q&A:** Modify the JSX for the "Original Context" accordion section. After displaying the main `context` prop, add logic to iterate through the `initialClarifications` array and render each question and its corresponding answer within this same section.
        *   **Display interactive chat:** The "Follow-up Q&A History" accordion section will now correctly display only the interactive persona chat history, as it continues to receive that specific data via the `followUpResponses` (or renamed) prop.

## Implementation Order

1.  Implement Goal 1 (Fix data format in `FollowUpQuestionsSection.js`).
2.  Implement Goal 2 (Fix display logic in `app/results/[id]/page.js` and `ReferenceDrawer.js`).