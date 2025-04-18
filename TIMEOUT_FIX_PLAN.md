# Plan to Fix 504 Timeout on /api/getResponses

## Problem

The application is experiencing 504 Gateway Timeout errors on the `/api/getResponses` route when deployed on Vercel. Logs indicate the function execution hits the default 30-second maximum duration limit, likely due to the time taken for external API calls (e.g., to OpenRouter).

## Solution

Increase the maximum execution duration allowed for the specific API route function using the `maxDuration` export available in Next.js (version 13.5+).

## Plan

1.  **Identify the target file:** The API route `/api/getResponses` corresponds to the file `app/api/getResponses/route.js`.
2.  **Define the change:** Add the following line at the top of the `app/api/getResponses/route.js` file to increase the maximum execution duration to 300 seconds (5 minutes):
    ```javascript
    export const maxDuration = 300; // 5 minutes
    ```
3.  **Implementation:** Switch to Code mode and use the `apply_diff` tool to add this line to the specified file.
4.  **Verification:** After the change is applied and the application is redeployed to Vercel, monitor the logs to confirm that the 504 timeout issue for this route is resolved.

## Plan Diagram

```mermaid
graph TD
    A[Start: 504 Timeout on /api/getResponses] --> B{Identify File};
    B --> C[File: app/api/getResponses/route.js];
    C --> D{Define Change};
    D --> E[Add 'export const maxDuration = 300;'];
    E --> F{Confirm Plan with User};
    F -- Yes --> G{Switch to Code Mode};
    G --> H[Apply Change using apply_diff];
    H --> I[User Redeploys & Verifies];
    F -- No --> J[Revise Plan];