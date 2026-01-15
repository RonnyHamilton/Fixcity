import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

interface Officer {
    id: string;
    badge_id: string;
    name: string;
    email: string;
    password: string;
    area: string;
    face_data: string;
}

export async function POST(request: NextRequest) {
    try {
        const { badgeId, password, faceVerified } = await request.json();

        // Validate inputs
        if (!badgeId || !password) {
            return NextResponse.json(
                { error: 'Badge ID and password are required' },
                { status: 400 }
            );
        }

        // Read officers data
        const dataPath = path.join(process.cwd(), 'data', 'officers.json');
        const data = await fs.readFile(dataPath, 'utf-8');
        const officers: Officer[] = JSON.parse(data);

        // Find officer by badge ID
        const officer = officers.find(o => o.badge_id === badgeId);

        if (!officer) {
            return NextResponse.json(
                { error: 'Invalid Badge ID. Officer not found.' },
                { status: 401 }
            );
        }

        // Verify password
        if (officer.password !== password) {
            return NextResponse.json(
                { error: 'Invalid password. Please try again.' },
                { status: 401 }
            );
        }

        // Check face verification (optional for manual override)
        if (!faceVerified) {
            // Log warning but allow login for manual override
            console.warn(`Officer ${badgeId} logged in without face verification (manual override)`);
        }

        // Login successful
        return NextResponse.json({
            success: true,
            id: officer.id,
            name: officer.name,
            badgeId: officer.badge_id,
            email: officer.email,
            area: officer.area,
            role: 'officer',
        });
    } catch (error) {
        console.error('Officer login error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
