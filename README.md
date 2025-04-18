This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Key Features

*   **Multi-Persona Analysis:** Analyzes user input from Therapist, Analyst, and Coach perspectives using Google Gemini.
*   **RAG Integration (Experimental):** For certain topics (parenting, tenancy, workplace), the AI attempts to retrieve relevant snippets from external sources (NHS, Citizens Advice, ACAS, Shelter) and cite them in its response using bracketed numbers like [1]. This uses Upstash Redis for caching. Requires `STORAGE_REDIS_URL`, `STORAGE_KV_REST_API_TOKEN`, `STORAGE_KV_REST_API_URL` environment variables (expected to be injected via Vercel).
*   **Zod Validation:** Ensures the AI output conforms to the expected JSON structure.
*   **Golden File Testing:** Uses Jest to run tests against predefined scenarios in the `tests/golden` directory.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
