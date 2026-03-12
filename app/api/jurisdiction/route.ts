import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * GET /api/jurisdiction
 * Returns all wards, taluks, and departments.
 * Used by the officer dashboard and future admin panel.
 */
export async function GET(_req: NextRequest) {
    try {
        const [wardsRes, taluксRes, deptsRes] = await Promise.all([
            supabase.from('wards').select('id, name, taluk_id, min_lat, max_lat, min_lng, max_lng').order('name'),
            supabase.from('taluks').select('id, name').order('name'),
            supabase.from('departments').select('id, name').order('name'),
        ]);

        return NextResponse.json({
            wards:       wardsRes.data  ?? [],
            taluks:      taluксRes.data ?? [],
            departments: deptsRes.data  ?? [],
        });
    } catch (error) {
        console.error('[Jurisdiction API] Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
