import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function POST(request) {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro-exp-03-25" });
        const result = await model.generateContent("Say Hello");
        const response = await result.response;
        const text = response.text();
        return Response.json({ response: text }, { status: 200 });
    } catch (error) {
        console.error("⚠️ DETAILED ERROR ON VERCEL:", error);
        return Response.json({ error: error.message }, { status: 500 });
    }
}
