import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { ReportSchema } from '@/lib/schemas';

// GET - List all reports with optional filters
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const category = searchParams.get('category');
        const userId = searchParams.get('userId');

        // Start building query
        let query = supabase
            .from('reports')
            .select('*')
            .order('created_at', { ascending: false });

        // Apply filters
        if (status) {
            query = query.eq('status', status);
        }

        if (category) {
            query = query.eq('category', category);
        }

        if (userId) {
            query = query.eq('user_id', userId);
        }

        const { data: reports, error } = await query;

        if (error) {
            console.error('[Reports API] Supabase error:', error);
            return NextResponse.json(
                { error: 'Failed to fetch reports' },
                { status: 500 }
            );
        }

        console.log(`[Reports API] Fetched ${reports?.length || 0} reports`);

        return NextResponse.json({ reports: reports || [] });
    } catch (error) {
        console.error('[Reports API] Error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// POST - Create a new report
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Strict Input Validation via Zod
        const result = ReportSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json(
                { error: 'Validation failed', details: result.error.flatten().fieldErrors },
                { status: 400 }
            );
        }

        const data = result.data; // Type-safe data

        // Create report with generated ID
        const reportId = `RPT_${Date.now()}_${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

        const newReport = {
            id: reportId,
            user_id: data.user_id,
            user_name: data.user_name,
            category: data.category,
            description: data.description,
            address: data.location, // Schema guarantees location maps to address
            latitude: data.latitude,
            longitude: data.longitude,
            image_url: data.image_url || null,
            status: 'pending',
            priority: 'medium', // Default to medium, can be updated by officer later
            assigned_technician_id: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        const { data: dbData, error } = await supabase
            .from('reports')
            .insert([newReport])
            .select()
            .single();

        if (error) {
            console.error('[Reports API] Create error:', error);
            // Return actual error for debugging
            return NextResponse.json(
                { error: `Failed to create report: ${error.message}` },
                { status: 500 }
            );
        }

        console.log(`[Reports API] Created report ID: ${dbData.id}`);

        return NextResponse.json(dbData, { status: 201 });
    } catch (error: any) {
        console.error('[Reports API] Error:', error);
        return NextResponse.json(
            { error: `Internal server error: ${error.message || String(error)}` },
            { status: 500 }
        );
    }
}

// DELETE - Delete a report
export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Report ID is required' }, { status: 400 });
        }

        const { error } = await supabase
            .from('reports')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('[Reports API] Delete error:', error);
            return NextResponse.json({ error: 'Failed to delete report' }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[Reports API] Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// PATCH - Update a report (status, assignment, etc.)
export async function PATCH(request: NextRequest) {
    try {
        const body = await request.json();
        const { id, ...updates } = body;

        if (!id) {
            return NextResponse.json({ error: 'Report ID is required' }, { status: 400 });
        }

        // Add updated_at
        updates.updated_at = new Date().toISOString();

        const { data, error } = await supabase
            .from('reports')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('[Reports API] Update error:', error);
            return NextResponse.json({ error: 'Failed to update report' }, { status: 500 });
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('[Reports API] Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
