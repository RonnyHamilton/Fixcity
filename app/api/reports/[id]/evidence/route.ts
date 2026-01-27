import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET - Fetch all evidence for a specific report
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const { data: evidence, error } = await supabase
            .from('report_evidence')
            .select('*')
            .eq('canonical_report_id', id)
            .order('created_at', { ascending: true });

        if (error) {
            console.error('[Evidence API] Supabase error:', error);
            return NextResponse.json(
                { error: 'Failed to fetch evidence' },
                { status: 500 }
            );
        }

        return NextResponse.json({ evidence: evidence || [] });
    } catch (error) {
        console.error('[Evidence API] Error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
