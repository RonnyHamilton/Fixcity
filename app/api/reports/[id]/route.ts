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

        console.log('[PATCH /api/reports/[id]] Request received');
        console.log('[PATCH] Report ID:', id);
        console.log('[PATCH] Updates:', JSON.stringify(updates, null, 2));

        // **STATUS TRANSITION VALIDATION**
        const ALLOWED_TRANSITIONS: Record<string, string[]> = {
            pending: ['in_progress', 'rejected'],
            in_progress: ['resolved', 'rejected'],
            resolved: [], // Cannot transition from resolved (unless reopened by duplicate logic)
            rejected: [], // Cannot transition from rejected
        };

        // Fetch current report state
        const { data: currentReport, error: fetchError } = await supabase
            .from('reports')
            .select('status, assigned_technician_id, resolution_notes')
            .eq('id', id)
            .single();

        if (fetchError || !currentReport) {
            return NextResponse.json(
                { error: 'Report not found' },
                { status: 404 }
            );
        }

        // Validate status transition if status is being changed
        if (updates.status && currentReport.status !== updates.status) {
            const allowedNextStates = ALLOWED_TRANSITIONS[currentReport.status] || [];

            if (!allowedNextStates.includes(updates.status)) {
                return NextResponse.json(
                    {
                        error: `Invalid status transition: Cannot change from ${currentReport.status} to ${updates.status}`,
                        allowed_transitions: allowedNextStates
                    },
                    { status: 400 }
                );
            }

            // **Enforce business rules based on target status**

            // Rule 1: in_progress requires technician assignment
            if (updates.status === 'in_progress') {
                const technicianId = updates.assigned_technician_id || currentReport.assigned_technician_id;
                if (!technicianId) {
                    return NextResponse.json(
                        { error: 'Cannot set status to in_progress without assigning a technician' },
                        { status: 400 }
                    );
                }
            }

            // Rule 2: resolved requires resolution notes (enforced by technician UI, but double-check)
            if (updates.status === 'resolved') {
                const resolutionNotes = updates.resolution_notes || currentReport.resolution_notes;
                if (!resolutionNotes) {
                    return NextResponse.json(
                        { error: 'Cannot mark as resolved without resolution notes' },
                        { status: 400 }
                    );
                }
            }

            // Rule 3: rejected requires rejection reason
            if (updates.status === 'rejected') {
                if (!updates.rejection_reason) {
                    return NextResponse.json(
                        { error: 'Cannot reject report without providing a rejection reason' },
                        { status: 400 }
                    );
                }
                // ✅ Mark as closed so it's excluded from duplicate detection
                updates.resolved_at = new Date().toISOString();
            }
        }


        // Auto-set status to in_progress if technician is assigned (backwards compatibility)
        if (updates.assigned_technician_id && !updates.status) {
            updates.status = 'in_progress';
        }

        // WORKAROUND: Schema doesn't have resolution_image_url, so we append it to notes
        if (updates.resolution_image_url) {
            const imageUrl = updates.resolution_image_url;
            updates.resolution_notes = (updates.resolution_notes || '') + `\n\n[Proof Image]: ${imageUrl}`;
            delete updates.resolution_image_url;
        }

        // Update the report in Supabase
        console.log('[PATCH] Updating report in Supabase...');
        const { data, error } = await supabase
            .from('reports')
            .update({
                ...updates,
                updated_at: new Date().toISOString(),
            })
            .eq('id', id)
            .select()
            .single();

        console.log('[PATCH] Supabase update completed');
        console.log('[PATCH] Error:', error);
        console.log('[PATCH] Updated data:', data);

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

        // **EMAIL NOTIFICATIONS FOR AUTHENTICATED USERS**
        try {
            // Trigger email when technician is assigned (notify public user)
            if (updates.assigned_technician_id && updates.status === 'in_progress') {
                // Notify public user that their report is being worked on
                fetch(`${request.nextUrl.origin}/api/reports/notify`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        reportId: id,
                        event: 'assigned'
                    })
                }).catch(err => console.error('Email notification error (assigned):', err));

                // Notify technician that they have a new task
                fetch(`${request.nextUrl.origin}/api/reports/notify`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        reportId: id,
                        event: 'tech_assigned',
                        technicianId: updates.assigned_technician_id
                    })
                }).catch(err => console.error('Email notification error (tech_assigned):', err));
            }

            // Trigger email when report is resolved
            if (updates.status === 'resolved' && currentReport.status !== 'resolved') {
                fetch(`${request.nextUrl.origin}/api/reports/notify`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        reportId: id,
                        event: 'resolved'
                    })
                }).catch(err => console.error('Email notification error (resolved):', err));
            }

            // Trigger email when report is rejected
            if (updates.status === 'rejected' && currentReport.status !== 'rejected') {
                fetch(`${request.nextUrl.origin}/api/reports/notify`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        reportId: id,
                        event: 'rejected'
                    })
                }).catch(err => console.error('Email notification error (rejected):', err));
            }
        } catch (emailError) {
            // Don't fail the update if email notifications fail
            console.error('Email notification error:', emailError);
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

        console.log('[PATCH] Returning success response');
        return NextResponse.json({
            success: true,
            report: data,
            message: 'Report updated successfully',
        });
    } catch (error) {
        console.error('[PATCH] Caught exception:', error);
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
