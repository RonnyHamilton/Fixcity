import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

/**
 * AI Model Test Script
 * Tests multiple free AI APIs to find which ones work
 */

const testMessage = "Say 'Hello, I am working!' in one sentence.";

// Color codes for terminal
const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    reset: '\x1b[0m'
};

const results = [];

/**
 * Test Google Gemini API
 */
async function testGemini() {
    console.log(`\n${colors.blue}Testing Google Gemini API...${colors.reset}`);
    try {
        const { GoogleGenerativeAI } = await import("@google/generative-ai");
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            throw new Error("GEMINI_API_KEY not found in .env.local");
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        const result = await model.generateContent(testMessage);
        const response = await result.response;
        const text = response.text();

        console.log(`${colors.green}✓ Gemini WORKS!${colors.reset}`);
        console.log(`Response: ${text.substring(0, 100)}...`);
        results.push({ model: "Google Gemini Pro", status: "WORKING", response: text });
        return true;
    } catch (error) {
        console.log(`${colors.red}✗ Gemini FAILED: ${error.message}${colors.reset}`);
        results.push({ model: "Google Gemini Pro", status: "FAILED", error: error.message });
        return false;
    }
}

/**
 * Test Hugging Face Models
 */
async function testHuggingFace(modelId) {
    console.log(`\n${colors.blue}Testing Hugging Face: ${modelId}...${colors.reset}`);
    try {
        const apiKey = process.env.HUGGINGFACE_API_KEY;

        if (!apiKey) {
            throw new Error("HUGGINGFACE_API_KEY not found in .env.local");
        }

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000);

        const response = await fetch(
            `https://api-inference.huggingface.co/models/${modelId}`,
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    inputs: testMessage,
                    parameters: {
                        max_length: 100,
                        temperature: 0.7,
                    },
                }),
                signal: controller.signal
            }
        );

        clearTimeout(timeout);

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText.substring(0, 100)}`);
        }

        const result = await response.json();
        let text = "";

        if (Array.isArray(result) && result.length > 0) {
            text = result[0].generated_text || result[0].summary_text || JSON.stringify(result[0]);
        } else if (result.generated_text) {
            text = result.generated_text;
        } else {
            text = JSON.stringify(result).substring(0, 100);
        }

        console.log(`${colors.green}✓ ${modelId} WORKS!${colors.reset}`);
        console.log(`Response: ${text.substring(0, 100)}...`);
        results.push({ model: modelId, status: "WORKING", response: text });
        return true;
    } catch (error) {
        console.log(`${colors.red}✗ ${modelId} FAILED: ${error.message}${colors.reset}`);
        results.push({ model: modelId, status: "FAILED", error: error.message });
        return false;
    }
}

/**
 * Run all tests
 */
async function runTests() {
    console.log(`${colors.yellow}
╔═══════════════════════════════════════════╗
║   AI MODEL DIAGNOSTIC TEST SUITE          ║
╚═══════════════════════════════════════════╝
${colors.reset}`);

    console.log(`\nAPI Keys loaded:`);
    console.log(`  GEMINI_API_KEY: ${process.env.GEMINI_API_KEY ? '✓ Found' : '✗ Missing'}`);
    console.log(`  HUGGINGFACE_API_KEY: ${process.env.HUGGINGFACE_API_KEY ? '✓ Found' : '✗ Missing'}\n`);

    // Test Google Gemini
    await testGemini();

    // Test Hugging Face Models
    const hfModels = [
        "google/flan-t5-base",
        "google/flan-t5-large",
        "microsoft/DialoGPT-medium",
        "HuggingFaceH4/zephyr-7b-beta",
        "facebook/blenderbot-400M-distill",
        "EleutherAI/gpt-neo-125M",
        "gpt2"
    ];

    for (const model of hfModels) {
        await testHuggingFace(model);
        // Wait 2 seconds between requests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // Print summary
    console.log(`\n${colors.yellow}
╔═══════════════════════════════════════════╗
║              TEST SUMMARY                 ║
╚═══════════════════════════════════════════╝
${colors.reset}`);

    const working = results.filter(r => r.status === "WORKING");
    const failed = results.filter(r => r.status === "FAILED");

    console.log(`\n${colors.green}✓ WORKING MODELS (${working.length}):${colors.reset}`);
    working.forEach(r => {
        console.log(`  - ${r.model}`);
        console.log(`    Response: ${r.response.substring(0, 80)}...`);
    });

    console.log(`\n${colors.red}✗ FAILED MODELS (${failed.length}):${colors.reset}`);
    failed.forEach(r => {
        console.log(`  - ${r.model}`);
        console.log(`    Error: ${r.error.substring(0, 80)}...`);
    });

    // Recommendations
    console.log(`\n${colors.blue}RECOMMENDATIONS:${colors.reset}`);
    if (working.length > 0) {
        console.log(`${colors.green}✓ Use these models in your chatbot (in order):${colors.reset}`);
        working.forEach((r, i) => {
            console.log(`  ${i + 1}. ${r.model}`);
        });
    } else {
        console.log(`${colors.red}⚠ No AI models are working! Check your API keys.${colors.reset}`);
        console.log(`  - Verify GEMINI_API_KEY in .env.local`);
        console.log(`  - Verify HUGGINGFACE_API_KEY in .env.local`);
    }

    console.log(`\n${colors.yellow}Test completed!${colors.reset}\n`);
}

// Run the tests
runTests().catch(console.error);
