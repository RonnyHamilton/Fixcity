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
    role: string;
}

export async function POST(request: NextRequest) {
    try {
        const { badgeId, password } = await request.json();

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

        // Find super admin by badge ID
        const admin = officers.find(
            o => o.badge_id === badgeId && o.role === 'super_admin'
        );

        if (!admin) {
            return NextResponse.json(
                { error: 'Invalid Badge ID. Super Admin not found.' },
                { status: 401 }
            );
        }

        // Verify password
        if (admin.password !== password) {
            return NextResponse.json(
                { error: 'Invalid password. Please try again.' },
                { status: 401 }
            );
        }

        // Login successful
        return NextResponse.json({
            success: true,
            id: admin.id,
            name: admin.name,
            badgeId: admin.badge_id,
            email: admin.email,
            area: admin.area,
            role: 'super_admin',
        });
    } catch (error) {
        console.error('Super admin login error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
