const { GoogleGenerativeAI } = require("@google/generative-ai");

const MODELS = [
    "gemini-1.5-flash",
    "gemini-1.5-flash-latest",
    "gemini-1.5-pro",
    "gemini-1.5-pro-latest",
    "gemini-pro",
    "gemini-pro-vision",
    "gemini-1.0-pro",
    "gemini-1.5-flash-001",
    "gemini-1.5-flash-002"
];

async function run() {
    const genAI = new GoogleGenerativeAI("AIzaSyAvmVAzEucz_bsX9ezVV2jawK5UqAxRkZc");

    console.log("Testing models...");

    for (const modelName of MODELS) {
        process.stdout.write(`Trying ${modelName.padEnd(25)} ... `);
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            // Simple text prompt
            const result = await model.generateContent("Hi");
            const response = await result.response;
            console.log(`✅ SUCCESS`);
        } catch (error) {
            if (error.message.includes("404")) {
                console.log(`❌ 404 Not Found`);
            } else {
                console.log(`❌ Error: ${error.message.substring(0, 50)}`);
            }
        }
    }
}

run();
