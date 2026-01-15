import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

interface Report {
    id: string;
    user_id: string;
    user_name: string;
    user_phone?: string;
    category: string;
    description: string;
    image_url?: string;
    latitude: number;
    longitude: number;
    address: string;
    status: 'pending' | 'in_progress' | 'resolved' | 'rejected';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    assigned_technician_id?: string;
    assigned_officer_id?: string;
    resolution_notes?: string;
    resolution_image_url?: string;
    created_at: string;
    updated_at: string;
}

// GET - Get single report
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const { data: report, error } = await supabase
            .from('reports')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !report) {
            return NextResponse.json(
                { error: 'Report not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            report,
        });
    } catch (error) {
        console.error('Get report error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch report' },
            { status: 500 }
        );
    }
}

// PATCH - Update report
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const updates = await request.json();

        // Enforce Logic: If a technician is assigned and no status is provided, default to in_progress
        if (updates.assigned_technician_id && !updates.status) {
            updates.status = 'in_progress';
        }

        // WORKAROUND: Schema doesn't have resolution_image_url, so we append it to notes
        if (updates.resolution_image_url) {
            const imageUrl = updates.resolution_image_url;
            // Append to resolution_notes (ensure it exists)
            updates.resolution_notes = (updates.resolution_notes || '') + `\n\n[Proof Image]: ${imageUrl}`;
            // Remove from updates to avoid column not found error
            delete updates.resolution_image_url;
        }

        // Update the report in Supabase
        const { data, error } = await supabase
            .from('reports')
            .update({
                ...updates,
                updated_at: new Date().toISOString(),
            })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Supabase update error:', error);
            return NextResponse.json(
                { error: `Update failed: ${error.message}` },
                { status: 500 }
            );
        }

        if (!data) {
            return NextResponse.json(
                { error: 'Report not found (ID mismatch)' },
                { status: 404 }
            );
        }

        // Send WhatsApp status update if status changed and user_id exists
        if (updates.status && data.user_id) {
            try {
                // Fetch user mobile number from aadhar.csv
                const { promises: fs } = await import('fs');
                const path = await import('path');
                const csvPath = path.join(process.cwd(), 'aadhar.csv');
                const csvContent = await fs.readFile(csvPath, 'utf-8');
                const lines = csvContent.trim().split('\n');

                // Find mobile number for this user
                let mobile = '';
                for (let i = 1; i < lines.length; i++) {
                    const [csvAadhaar, csvMobile] = lines[i].split(',').map(s => s.trim());
                    if (csvAadhaar === data.user_id) {
                        mobile = csvMobile;
                        break;
                    }
                }

                if (mobile) {
                    const { sendWhatsAppStatusUpdate } = await import('@/lib/whatsapp');
                    const whatsappResult = await sendWhatsAppStatusUpdate(
                        `91${mobile}`,
                        data.id,
                        data.status,
                        data.category
                    );

                    if (whatsappResult.success) {
                        console.log('WhatsApp status update sent successfully');
                    } else {
                        console.warn('WhatsApp status update failed:', whatsappResult.message);
                    }
                }
            } catch (whatsappError) {
                // Don't fail the entire update if WhatsApp notification fails
                console.error('WhatsApp notification error:', whatsappError);
            }
        }

        return NextResponse.json({
            success: true,
            report: data,
            message: 'Report updated successfully',
        });
    } catch (error) {
        console.error('Update report error:', error);
        return NextResponse.json(
            { error: 'Failed to update report' },
            { status: 500 }
        );
    }
}

// DELETE - Delete report
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const { error } = await supabase
            .from('reports')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Supabase delete error:', error);
            return NextResponse.json(
                { error: 'Report not found or delete failed' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Report deleted successfully',
        });
    } catch (error) {
        console.error('Delete report error:', error);
        return NextResponse.json(
            { error: 'Failed to delete report' },
            { status: 500 }
        );
    }
}
