import { NextRequest, NextResponse } from 'next/server';
import { compareFaces } from '@/lib/huggingface';

// Sanitize URL to remove trailing slash
const PYTHON_API_URL = (process.env.FACE_API_URL || 'http://localhost:8000').replace(/\/$/, '');
const USE_HUGGINGFACE_FALLBACK = true; // Enable fallback to Hugging Face

export async function POST(request: NextRequest) {
    try {
        const { badgeId, image, userType } = await request.json();

        // Validate inputs
        if (!badgeId) {
            return NextResponse.json(
                { error: 'Badge ID is required for face verification' },
                { status: 400 }
            );
        }

        if (!image) {
            return NextResponse.json(
                { error: 'Face image data is missing' },
                { status: 400 }
            );
        }

        // Call Python face verification API
        console.log(`Calling Python face verification API for ${userType || 'officer'} badge: ${badgeId}`);

        try {
            const response = await fetch(`${PYTHON_API_URL}/verify-face`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    badge_id: badgeId,
                    image: image,
                    user_type: userType || 'officer',
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Python API error:', errorText);
                throw new Error(`Python API returned ${response.status}`);
            }

            const result = await response.json();
            console.log('Python API result:', result);

            return NextResponse.json({
                verified: result.verified,
                confidence: result.confidence,
                message: result.message,
                error: result.error,
            });

        } catch (fetchError: any) {
            console.error('Failed to connect to Python API:', fetchError);

            // Fallback to Hugging Face if Python server is unavailable
            if (USE_HUGGINGFACE_FALLBACK) {
                console.log('Falling back to Hugging Face face verification...');

                try {
                    // Convert base64 to Blob for Hugging Face
                    const base64Data = image.includes(',') ? image.split(',')[1] : image;
                    const binaryData = Buffer.from(base64Data, 'base64');
                    const uploadedImageBlob = new Blob([binaryData], { type: 'image/jpeg' });

                    // Load reference image
                    const facesDir = userType === 'technician' ? 'technician-faces' : 'officer-faces';
                    const referencePath = `/data/${facesDir}/${badgeId}.jpg`;

                    // Fetch reference image
                    const refResponse = await fetch(referencePath);
                    if (!refResponse.ok) {
                        return NextResponse.json(
                            { error: `Reference image not found for badge ${badgeId}`, verified: false, confidence: 0 },
                            { status: 404 }
                        );
                    }

                    const refBlob = await refResponse.blob();

                    // Compare faces using Hugging Face
                    const { match, score, error: hfError } = await compareFaces(uploadedImageBlob, refBlob);

                    if (hfError) {
                        throw new Error(hfError);
                    }

                    return NextResponse.json({
                        verified: match,
                        confidence: score,
                        message: match ? `Face verified successfully (HF). Score: ${score.toFixed(3)}` : `Face verification failed (HF). Score: ${score.toFixed(3)}`,
                        error: match ? null : `Match score (${score.toFixed(2)}) below threshold (0.85)`,
                    });

                } catch (hfError: any) {
                    console.error('Hugging Face fallback error:', hfError);
                    return NextResponse.json(
                        {
                            error: 'Face verification service unavailable. Both Python server and Hugging Face failed.',
                            details: hfError.message
                        },
                        { status: 503 }
                    );
                }
            }

            return NextResponse.json(
                {
                    error: 'Face verification service unavailable. Please ensure the Python server is running.',
                    details: fetchError.message
                },
                { status: 503 }
            );
        }

    } catch (error) {
        console.error('Face verification error:', error);
        return NextResponse.json(
            { error: 'Face verification service error' },
            { status: 500 }
        );
    }
}
