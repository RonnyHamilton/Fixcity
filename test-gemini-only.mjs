import dotenv from 'dotenv';
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config({ path: '.env.local' });

async function testGemini() {
    console.log('\n🧪 Testing Google Gemini API...\n');

    const apiKey = process.env.GEMINI_API_KEY;
    console.log(`API Key: ${apiKey ? apiKey.substring(0, 10) + '...' : 'NOT FOUND'}`);

    if (!apiKey) {
        console.error('❌ GEMINI_API_KEY not found in .env.local');
        return;
    }

    try {
        console.log('\n📡 Initializing Gemini...');
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        console.log('📡 Sending test message...');
        const result = await model.generateContent("Say 'Hello, I am working!' in one sentence.");

        const response = await result.response;
        const text = response.text();

        console.log('\n✅ SUCCESS! Gemini is working!\n');
        console.log(`Response: ${text}\n`);

    } catch (error) {
        console.error('\n❌ FAILED!\n');
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', JSON.stringify(error.response.data, null, 2));
        }
        console.error('\nFull error:', error);
    }
}

testGemini();
