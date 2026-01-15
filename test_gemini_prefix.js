const { GoogleGenerativeAI } = require("@google/generative-ai");

async function run() {
    const genAI = new GoogleGenerativeAI("AIzaSyAvmVAzEucz_bsX9ezVV2jawK5UqAxRkZc");

    // Try with 'models/' prefix
    const modelName = "models/gemini-1.5-flash";
    console.log(`Testing model: ${modelName}...`);

    try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent("Hi");
        const response = await result.response;
        console.log("Success with prefix! Response:", response.text().substring(0, 20));
    } catch (e) {
        console.log("Error with prefix:", e.message);
        console.log(JSON.stringify(e, null, 2));
    }
}

run();
