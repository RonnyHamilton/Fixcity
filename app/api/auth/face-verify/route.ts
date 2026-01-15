import { NextRequest, NextResponse } from 'next/server';

const PYTHON_API_URL = process.env.FACE_API_URL || 'http://localhost:8000';

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
                return NextResponse.json(
                    { error: `Face verification service error: ${response.status}` },
                    { status: 500 }
                );
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
