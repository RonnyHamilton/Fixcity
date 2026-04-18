import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

// ─── HuggingFace Space: Hamilton21/fixcity-face-api ──────────────────────────
const HF_SPACE_URL = 'https://hamilton21-fixcity-face-api.hf.space';

interface Officer {
    id: string;
    badge_id: string;
    name: string;
    face_data: string;
    [key: string]: unknown;
}

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

        // ── Look up the officer's stored face data ────────────────────────────
        const dataPath = path.join(process.cwd(), 'data', 'officers.json');
        const raw = await fs.readFile(dataPath, 'utf-8');
        const officers: Officer[] = JSON.parse(raw);
        const officer = officers.find(o => o.badge_id === badgeId);

        if (!officer) {
            return NextResponse.json(
                { error: 'Invalid Badge ID. Officer not found.' },
                { status: 401 }
            );
        }

        if (!officer.face_data) {
            return NextResponse.json(
                { error: 'No registered face found for this Badge ID. Contact your administrator.' },
                { status: 403 }
            );
        }

        console.log(`[FaceVerify] Calling HF Space for ${userType || 'officer'} badge: ${badgeId}`);

        try {
            const response = await fetch(`${HF_SPACE_URL}/verify-face`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    badge_id: badgeId,
                    image: image,           // live capture from camera
                    stored_face: officer.face_data, // registered face for comparison
                    user_type: userType || 'officer',
                }),
                signal: AbortSignal.timeout(20000),
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
            console.error('[FaceVerify] Space unavailable:', fetchError.message);
            return NextResponse.json(
                { error: 'Face verification service is unavailable. Please try again shortly.' },
                { status: 503 }
            );
        }

    } catch (error) {
        console.error('[FaceVerify] Error:', error);
        return NextResponse.json(
            { error: 'Face verification service error' },
            { status: 500 }
        );
    }
}
