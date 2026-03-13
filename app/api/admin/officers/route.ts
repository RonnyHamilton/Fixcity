import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { createServerSupabaseClient } from '@/lib/supabase';

interface OfficerData {
    id: string;
    badge_id: string;
    name: string;
    email: string;
    password: string;
    area: string;
    role: string;
    face_data: string;
}

const DATA_PATH = path.join(process.cwd(), 'data', 'officers.json');

async function readOfficers(): Promise<OfficerData[]> {
    const data = await fs.readFile(DATA_PATH, 'utf-8');
    return JSON.parse(data);
}

async function writeOfficers(officers: OfficerData[]): Promise<void> {
    await fs.writeFile(DATA_PATH, JSON.stringify(officers, null, 2), 'utf-8');
}

// GET — List all officers with their ward_officers assignments
export async function GET() {
    try {
        const officers = await readOfficers();
        const supabase = createServerSupabaseClient();

        // Get all ward_officer assignments
        const { data: woRows } = await supabase
            .from('ward_officers')
            .select('officer_id, ward_id, department_id, wards(name), departments(name)');

        // Build assignment map
        const assignmentMap: Record<string, any[]> = {};
        (woRows || []).forEach((r: any) => {
            if (!assignmentMap[r.officer_id]) assignmentMap[r.officer_id] = [];
            assignmentMap[r.officer_id].push({
                ward_id: r.ward_id,
                ward_name: Array.isArray(r.wards) ? r.wards[0]?.name : r.wards?.name || r.ward_id,
                department_id: r.department_id,
                department_name: Array.isArray(r.departments) ? r.departments[0]?.name : r.departments?.name || null,
            });
        });

        // Merge officer data with assignments
        const enrichedOfficers = officers
            .filter(o => o.role !== 'super_admin')
            .map(o => ({
                id: o.id,
                badge_id: o.badge_id,
                name: o.name,
                email: o.email,
                area: o.area,
                role: o.role,
                assignments: assignmentMap[o.id] || [],
                ward_count: (assignmentMap[o.id] || []).length,
            }));

        return NextResponse.json({ officers: enrichedOfficers });
    } catch (error) {
        console.error('Error fetching officers:', error);
        return NextResponse.json({ error: 'Failed to fetch officers' }, { status: 500 });
    }
}

// POST — Add a new officer
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { name, email, badge_id, password, area, role, ward_ids, department_id } = body;

        if (!name || !badge_id || !password || !role) {
            return NextResponse.json({ error: 'Name, badge ID, password, and role are required' }, { status: 400 });
        }

        const officers = await readOfficers();

        // Check for duplicate badge_id
        if (officers.some(o => o.badge_id === badge_id)) {
            return NextResponse.json({ error: 'Badge ID already exists' }, { status: 409 });
        }

        const newId = `OFF_${Date.now().toString(36).toUpperCase()}`;
        const newOfficer: OfficerData = {
            id: newId,
            badge_id,
            name,
            email: email || '',
            password,
            area: area || '',
            role,
            face_data: '',
        };

        officers.push(newOfficer);
        await writeOfficers(officers);

        // Create ward_officers assignments in Supabase
        const supabase = createServerSupabaseClient();
        if (ward_ids && ward_ids.length > 0) {
            const assignments = ward_ids.map((wid: string) => ({
                officer_id: newId,
                ward_id: wid,
                department_id: department_id || null,
            }));
            await supabase.from('ward_officers').insert(assignments);
        }

        return NextResponse.json({ success: true, officer: { ...newOfficer, id: newId } });
    } catch (error) {
        console.error('Error adding officer:', error);
        return NextResponse.json({ error: 'Failed to add officer' }, { status: 500 });
    }
}

// PUT — Update officer details
export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { id, name, email, area, role, ward_ids, department_id } = body;

        if (!id) {
            return NextResponse.json({ error: 'Officer ID is required' }, { status: 400 });
        }

        const officers = await readOfficers();
        const idx = officers.findIndex(o => o.id === id);
        if (idx === -1) {
            return NextResponse.json({ error: 'Officer not found' }, { status: 404 });
        }

        // Update fields
        if (name) officers[idx].name = name;
        if (email !== undefined) officers[idx].email = email;
        if (area !== undefined) officers[idx].area = area;
        if (role) officers[idx].role = role;

        await writeOfficers(officers);

        // Update ward assignments if provided
        if (ward_ids) {
            const supabase = createServerSupabaseClient();

            // Remove old assignments
            await supabase.from('ward_officers').delete().eq('officer_id', id);

            // Insert new assignments
            if (ward_ids.length > 0) {
                const assignments = ward_ids.map((wid: string) => ({
                    officer_id: id,
                    ward_id: wid,
                    department_id: department_id || null,
                }));
                await supabase.from('ward_officers').insert(assignments);
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error updating officer:', error);
        return NextResponse.json({ error: 'Failed to update officer' }, { status: 500 });
    }
}

// DELETE — Remove an officer
export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Officer ID is required' }, { status: 400 });
        }

        const officers = await readOfficers();
        const filtered = officers.filter(o => o.id !== id);
        if (filtered.length === officers.length) {
            return NextResponse.json({ error: 'Officer not found' }, { status: 404 });
        }

        await writeOfficers(filtered);

        // Remove ward_officer assignments
        const supabase = createServerSupabaseClient();
        await supabase.from('ward_officers').delete().eq('officer_id', id);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting officer:', error);
        return NextResponse.json({ error: 'Failed to delete officer' }, { status: 500 });
    }
}
