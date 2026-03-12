import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
    try {
        // Auth check: require admin secret
        const body = await request.json().catch(() => ({}));
        const adminSecret = process.env.ADMIN_SECRET || 'fixcity-admin-2026';
        if (body.secret !== adminSecret) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { error } = await supabase
            .from('reports')
            .delete()
            .neq('id', '0'); // Delete everything

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: 'All reports cleared' });
    } catch (error) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
