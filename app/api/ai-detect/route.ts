import { NextRequest, NextResponse } from 'next/server';
import { FixCityCategory, generateDescription, getConfidenceThreshold } from '@/lib/ai-detection';

/**
 * AI Detection API Route
 * Uses direct fetch to Google Gemini API (bypassing SDK to resolve 404 issues)
 */

const ALLOWED_CATEGORIES: FixCityCategory[] = [
    "pothole",
    "street_light",
    "sanitation",
    "graffiti",
    "street_dogs",
    "e_waste",
    "other"
];

// Priority list - put Flash first
const MODELS_TO_TRY = [
    "gemini-1.5-flash",
    "gemini-1.5-flash-latest",
    "gemini-1.5-pro",
    "gemini-pro-vision"
];

/**
 * RAW Base64 (No prefix) - Required for Gemini inline_data
 */
async function imageToRawBase64(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    return buffer.toString('base64');
}

export async function POST(request: NextRequest) {
    try {
        console.log('[AI Detect] ═══════════════════════════════════');
        console.log('[AI Detect] Request received (Gemini Direct Fetch)');

        // Check API key
        let apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.error('[AI Detect] Missing GEMINI_API_KEY');
            return NextResponse.json(
                { error: 'AI detection is not configured (Missing Gemini Key)' },
                { status: 503 }
            );
        }
        apiKey = apiKey.trim(); // Ensure no whitespace

        // Parse form data
        const formData = await request.formData();
        const imageFile = formData.get('image') as File;

        if (!imageFile) {
            return NextResponse.json(
                { error: 'No image provided' },
                { status: 400 }
            );
        }

        console.log('[AI Detect] Image received:', imageFile.name, `(${(imageFile.size / 1024).toFixed(1)} KB)`);

        const rawBase64 = await imageToRawBase64(imageFile);

        // Construct Prompt
        const promptText = `
        Analyze this image for a civic issue reporting system.
        
        Allowed Categories:
        ${ALLOWED_CATEGORIES.map(c => `- ${c}`).join('\n')}

        Task:
        1. Identify the main subject.
        2. Select the ONE best fitting category from the list above. If unsure, use "other".
        3. Estimate confidence (0.0 to 1.0).
        4. Write a short caption (max 10 words).
        5. Write a helpful description (max 2 sentences) suitable for a formal report.

        Return strictly valid JSON:
        {
          "category": "string",
          "confidence": number,
          "caption": "string",
          "description": "string"
        }
        `;

        let resultText = "";
        let usedModel = "";
        let lastError = "";

        // Try models sequentially
        for (const modelName of MODELS_TO_TRY) {
            try {
                // Ensure model name has 'models/' prefix if needed, but the endpoint structure handles it
                // Endpoint: https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent?key={KEY}
                // If modelName is 'gemini-1.5-flash', url is .../models/gemini-1.5-flash:generateContent

                const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

                console.log(`[AI Detect] Attempting fetch: ${modelName}...`);

                const payload = {
                    contents: [
                        {
                            parts: [
                                { text: promptText },
                                {
                                    inline_data: {
                                        mime_type: imageFile.type || 'image/jpeg',
                                        data: rawBase64
                                    }
                                }
                            ]
                        }
                    ],
                    generationConfig: {
                        response_mime_type: "application/json" // Note snake_case for REST API sometimes preferred, but camelCase works often. snake_case is safer for raw JSON.
                    }
                };

                const response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payload)
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`HTTP ${response.status}: ${errorText}`);
                }

                const data = await response.json();

                // Extract text from response
                // Response structure: { candidates: [ { content: { parts: [ { text: "..." } ] } } ] }
                const candidate = data.candidates?.[0];
                const parts = candidate?.content?.parts;
                const text = parts?.[0]?.text;

                if (!text) {
                    throw new Error('No text in response candidates');
                }

                resultText = text;
                usedModel = modelName;
                console.log(`[AI Detect] Success with model: ${modelName}`);
                break;

            } catch (e: any) {
                console.warn(`[AI Detect] Model ${modelName} failed:`, e.message);
                lastError = e.message;
            }
        }

        if (!resultText) {
            throw new Error(`All Gemini models failed. Last error: ${lastError}`);
        }

        console.log('[AI Detect] Gemini Response:', resultText);

        // Parse JSON
        let parsed: any;
        try {
            parsed = JSON.parse(resultText);
        } catch (e) {
            console.error('[AI Detect] Failed to parse Gemini JSON:', e);
            // Try to cleanup markdown code blocks if present ( ```json ... ``` )
            const cleanText = resultText.replace(/```json/g, '').replace(/```/g, '').trim();
            try {
                parsed = JSON.parse(cleanText);
            } catch (e2) {
                throw new Error('Invalid JSON response from AI');
            }
        }

        // Validate and normalize
        let category: FixCityCategory = parsed.category?.toLowerCase()?.trim();
        if (!ALLOWED_CATEGORIES.includes(category)) {
            category = "other";
        }

        let confidence = typeof parsed.confidence === 'number' ? parsed.confidence : 0;
        const threshold = getConfidenceThreshold();
        if (confidence < threshold) {
            console.log(`[AI Detect] ⚠ Low confidence (${confidence}), defaulting to 'other'`);
            category = "other";
        }

        const caption = parsed.caption || "an image";
        const description = parsed.description || generateDescription(category, caption);

        const finalResult = {
            category,
            confidence,
            caption,
            description,
            debug: {
                model: usedModel,
                rawResponse: parsed
            }
        };

        console.log('[AI Detect] ✅ Final result:', category, `(${(confidence * 100).toFixed(1)}%)`);

        return NextResponse.json(finalResult);

    } catch (error: any) {
        console.error('[AI Detect] ❌ Error:', error);

        // Return explicit error message to client for debugging
        return NextResponse.json(
            {
                error: `AI detection failed: ${error.message}`,
                category: 'other',
                confidence: 0,
                caption: '',
                description: 'Issue detected but could not be categorized reliably.',
                debug: { error: error.message || String(error) }
            },
            { status: 200 } // Keep 200 to prevent frontend crash, handle error in UI logic if needed
        );
    }
}
