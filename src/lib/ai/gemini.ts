import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
    console.warn("WARN: GEMINI_API_KEY is not set in environment variables.");
}

const genAI = new GoogleGenerativeAI(apiKey || "");

// Wrapper to export 'model' and 'jsonModel' compatible with our app's usage

export const model = {
    generateContent: async (prompt: string) => {
        try {
            // Use standard stable model
            const m = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
            const result = await m.generateContent(prompt);
            const response = await result.response;

            return {
                response: {
                    text: () => response.text()
                }
            };
        } catch (error) {
            console.error("Gemini API Error (Standard):", error);
            throw error;
        }
    }
};

export const jsonModel = {
    generateContent: async (prompt: string) => {
        try {
            // Use JSON mode
            const m = genAI.getGenerativeModel({
                model: "gemini-2.5-flash",
                generationConfig: {
                    responseMimeType: "application/json"
                }
            });
            const result = await m.generateContent(prompt);
            const response = await result.response;

            return {
                response: {
                    text: () => response.text()
                }
            };
        } catch (error) {
            console.error("Gemini API Error (JSON):", error);
            throw error;
        }
    }
};

// Export raw client if needed (kept for compatibility)
export const ai = genAI;
