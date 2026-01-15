import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

interface Technician {
    id: string;
    badge_id: string;
    name: string;
    email: string;
    password: string;
    area: string;
    specialization: string;
    face_data: string;
    available: boolean;
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

        // Read technicians data
        const dataPath = path.join(process.cwd(), 'data', 'technicians.json');
        const data = await fs.readFile(dataPath, 'utf-8');
        const technicians: Technician[] = JSON.parse(data);

        // Find technician by badge ID
        const technician = technicians.find(t => t.badge_id === badgeId);

        if (!technician) {
            return NextResponse.json(
                { error: 'Invalid Badge ID. Technician not found.' },
                { status: 401 }
            );
        }

        // Verify password
        if (technician.password !== password) {
            return NextResponse.json(
                { error: 'Invalid password. Please try again.' },
                { status: 401 }
            );
        }

        // Check face verification (optional for manual override)
        if (!faceVerified) {
            console.warn(`Technician ${badgeId} logged in without face verification (manual override)`);
        }

        // Login successful
        return NextResponse.json({
            success: true,
            id: technician.id,
            name: technician.name,
            badgeId: technician.badge_id,
            email: technician.email,
            area: technician.area,
            specialization: technician.specialization,
            available: technician.available,
            role: 'technician',
        });
    } catch (error) {
        console.error('Technician login error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
