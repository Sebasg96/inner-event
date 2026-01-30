const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI("bad-key");
console.log("Triggering error...");
throw new Error("Simulated crash");
