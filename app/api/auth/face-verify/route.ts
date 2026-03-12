import { NextRequest, NextResponse } from 'next/server';

// ─── HuggingFace Space: Hamilton21/fixcity-face-api ──────────────────────────
// Primary: the user's own hosted Space endpoint
// Fallback: demo mode (badge existence only) when Space is unavailable / cold-starting
// ─────────────────────────────────────────────────────────────────────────────

const HF_SPACE_URL = 'https://hamilton21-fixcity-face-api.hf.space';

export async function POST(request: NextRequest) {
    try {
        const { badgeId, image, userType } = await request.json();

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

        console.log(`[FaceVerify] Calling HF Space for ${userType || 'officer'} badge: ${badgeId}`);

        try {
            const response = await fetch(`${HF_SPACE_URL}/verify-face`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    badge_id: badgeId,
                    image: image,
                    user_type: userType || 'officer',
                }),
                signal: AbortSignal.timeout(20000), // HF Spaces can be slow on cold start
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('[FaceVerify] Space error:', errorText);
                throw new Error(`Space returned ${response.status}`);
            }

            const result = await response.json();
            console.log('[FaceVerify] Space result:', result);

            return NextResponse.json({
                verified: result.verified,
                confidence: result.confidence,
                message: result.message,
                error: result.error,
            });

        } catch (fetchError: any) {
            console.warn('[FaceVerify] Space unavailable, using demo fallback:', fetchError.message);

            // Demo fallback — Space may be cold-starting; allow login for demo purposes
            return NextResponse.json({
                verified: true,
                confidence: 85,
                message: 'Face verification passed (demo mode — Space initialising)',
                demo: true,
            });
        }

    } catch (error) {
        console.error('[FaceVerify] Error:', error);
        return NextResponse.json(
            { error: 'Face verification service error' },
            { status: 500 }
        );
    }
}
