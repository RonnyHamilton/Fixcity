import { NextRequest, NextResponse } from 'next/server';

// Sanitize URL to remove trailing slash
const PYTHON_API_URL = (process.env.FACE_API_URL || 'http://localhost:8000').replace(/\/$/, '');
// **DISABLED FALLBACK**: HuggingFace fallback is unreliable for production (see AUDIT_REPORT.md)
const USE_HUGGINGFACE_FALLBACK = false;

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

            // Fallback is disabled for production stability
            return NextResponse.json(
                {
                    error: 'Face verification service unavailable. Please ensure the Python face server is running at port 8000.',
                    details: fetchError.message,
                    verified: false,
                    confidence: 0
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
