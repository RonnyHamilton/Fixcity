import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

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

        // Validate required fields
        const requiredFields = ['user_id', 'category', 'description', 'location', 'latitude', 'longitude'];
        const missingFields = requiredFields.filter(field => !body[field]);

        if (missingFields.length > 0) {
            return NextResponse.json(
                { error: `Missing required fields: ${missingFields.join(', ')}` },
                { status: 400 }
            );
        }

        // Create report with generated ID
        const reportId = `RPT_${Date.now()}_${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

        const newReport = {
            id: reportId,
            user_id: body.user_id,
            user_name: body.user_name || 'Anonymous', // Add required user_name
            category: body.category,
            description: body.description,
            address: body.location || body.address,
            latitude: body.latitude,
            longitude: body.longitude,
            image_url: body.image_url || null,
            status: 'pending',
            priority: body.priority || 'medium',
            assigned_technician_id: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        const { data, error } = await supabase
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

        console.log(`[Reports API] Created report ID: ${data.id}`);

        return NextResponse.json(data, { status: 201 });
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
