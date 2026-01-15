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

// GET - List all technicians
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const area = searchParams.get('area');
        const available = searchParams.get('available');
        const specialization = searchParams.get('specialization');

        // Read technicians data
        const dataPath = path.join(process.cwd(), 'data', 'technicians.json');
        const data = await fs.readFile(dataPath, 'utf-8');
        let technicians: Technician[] = JSON.parse(data);

        // Apply filters
        if (area) {
            technicians = technicians.filter(t => t.area === area);
        }

        if (available === 'true') {
            technicians = technicians.filter(t => t.available);
        } else if (available === 'false') {
            technicians = technicians.filter(t => !t.available);
        }

        if (specialization) {
            technicians = technicians.filter(t => t.specialization === specialization);
        }

        // Remove sensitive data
        const safeTechnicians = technicians.map(t => ({
            id: t.id,
            badge_id: t.badge_id,
            name: t.name,
            email: t.email,
            area: t.area,
            specialization: t.specialization,
            available: t.available,
        }));

        return NextResponse.json({
            success: true,
            technicians: safeTechnicians,
            total: safeTechnicians.length,
        });
    } catch (error) {
        console.error('Get technicians error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch technicians' },
            { status: 500 }
        );
    }
}
