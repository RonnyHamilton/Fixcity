import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { promises as fs } from 'fs';
import path from 'path';

/**
 * API Route: /api/reports/notify
 * 
 * Sends email notifications based on report lifecycle events.
 * 
 * Events:
 * - 'assigned': Officer assigned a technician → Notify PUBLIC USER
 * - 'resolved': Technician resolved the report → Notify PUBLIC USER
 * - 'rejected': Officer rejected the report → Notify PUBLIC USER
 * - 'new_report': New report submitted → Notify ALL OFFICERS
 * - 'tech_assigned': Report assigned to technician → Notify TECHNICIAN
 * 
 * NOTE: This uses console logging instead of actual email sending.
 * To enable real emails, install Resend and uncomment the Resend code.
 */

interface Officer {
    id: string;
    name: string;
    email: string;
}

interface Technician {
    id: string;
    name: string;
    email: string;
    phone?: string;
}

// Load officers from JSON file
async function loadOfficers(): Promise<Officer[]> {
    try {
        const filePath = path.join(process.cwd(), 'data', 'officers.json');
        const content = await fs.readFile(filePath, 'utf-8');
        return JSON.parse(content);
    } catch (error) {
        console.error('Failed to load officers:', error);
        return [];
    }
}

// Load technicians from JSON file
async function loadTechnicians(): Promise<Technician[]> {
    try {
        const filePath = path.join(process.cwd(), 'data', 'technicians.json');
        const content = await fs.readFile(filePath, 'utf-8');
        return JSON.parse(content);
    } catch (error) {
        console.error('Failed to load technicians:', error);
        return [];
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { reportId, event, technicianId } = body;

        if (!reportId || !event) {
            return NextResponse.json(
                { error: 'reportId and event are required' },
                { status: 400 }
            );
        }

        const validEvents = ['assigned', 'resolved', 'rejected', 'new_report', 'tech_assigned'];
        if (!validEvents.includes(event)) {
            return NextResponse.json(
                { error: `event must be one of: ${validEvents.join(', ')}` },
                { status: 400 }
            );
        }

        const supabase = createServerSupabaseClient();

        // Fetch report details
        const { data: report, error: reportError } = await supabase
            .from('reports')
            .select('id, user_id, user_name, category, address, description, status, rejection_reason')
            .eq('id', reportId)
            .single();

        if (reportError || !report) {
            console.error('Report not found:', reportError);
            return NextResponse.json(
                { error: 'Report not found' },
                { status: 404 }
            );
        }

        // Handle different notification types
        switch (event) {
            case 'new_report':
                return await notifyOfficers(report);

            case 'tech_assigned':
                if (!technicianId) {
                    return NextResponse.json(
                        { error: 'technicianId is required for tech_assigned event' },
                        { status: 400 }
                    );
                }
                return await notifyTechnician(report, technicianId);

            case 'assigned':
            case 'resolved':
            case 'rejected':
                return await notifyPublicUser(report, event, supabase);

            default:
                return NextResponse.json({ error: 'Unknown event type' }, { status: 400 });
        }

    } catch (error: any) {
        console.error('Notification error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to send notification' },
            { status: 500 }
        );
    }
}

// Notify all officers about a new report
async function notifyOfficers(report: any) {
    const officers = await loadOfficers();

    if (officers.length === 0) {
        return NextResponse.json({
            success: true,
            message: 'No officers to notify'
        });
    }

    const subject = '🆕 New Report Submitted - FixCity';

    for (const officer of officers) {
        console.log('========== EMAIL NOTIFICATION ==========');
        console.log('To:', officer.email);
        console.log('Subject:', subject);
        console.log('Event: new_report');
        console.log('Report ID:', report.id);
        console.log('Category:', report.category);
        console.log('Location:', report.address);
        console.log('========================================');
    }

    return NextResponse.json({
        success: true,
        message: `New report notification sent to ${officers.length} officer(s)`,
        officers: officers.map(o => o.email)
    });
}

// Notify technician when assigned to a report
async function notifyTechnician(report: any, technicianId: string) {
    const technicians = await loadTechnicians();
    const technician = technicians.find(t => t.id === technicianId);

    if (!technician) {
        console.log('Technician not found:', technicianId);
        return NextResponse.json({
            success: true,
            message: 'Technician not found, skipping notification'
        });
    }

    const subject = '📋 New Task Assigned - FixCity';

    console.log('========== EMAIL NOTIFICATION ==========');
    console.log('To:', technician.email);
    console.log('Subject:', subject);
    console.log('Event: tech_assigned');
    console.log('Report ID:', report.id);
    console.log('Category:', report.category);
    console.log('Location:', report.address);
    console.log('Description:', report.description?.substring(0, 100));
    console.log('========================================');

    return NextResponse.json({
        success: true,
        message: `Task assignment notification sent to technician`,
        technician: technician.email
    });
}

// Notify public user about report status changes
async function notifyPublicUser(report: any, event: string, supabase: any) {
    // Check if user_id is authenticated (not 'anonymous')
    if (report.user_id === 'anonymous' || !report.user_id) {
        console.log('Skipping email: Anonymous user');
        return NextResponse.json({
            success: true,
            message: 'No email sent (anonymous user)'
        });
    }

    // Validate that user_id looks like a UUID (Supabase user ID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(report.user_id)) {
        console.log('Skipping email: Invalid user ID format');
        return NextResponse.json({
            success: true,
            message: 'No email sent (invalid user ID)'
        });
    }

    // Get user email from Supabase Auth
    const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(
        report.user_id
    );

    if (userError || !user || !user.email) {
        console.error('User not found or no email:', userError);
        return NextResponse.json({
            success: true,
            message: 'No email sent (user not found or no email)'
        });
    }

    // Prepare email content based on event
    let subject: string;
    let htmlContent: string;

    switch (event) {
        case 'assigned':
            subject = '🚀 Your FixCity Report Has Been Assigned';
            htmlContent = getAssignmentEmailHTML(report);
            break;
        case 'resolved':
            subject = '✅ Your FixCity Issue Has Been Resolved';
            htmlContent = getResolutionEmailHTML(report);
            break;
        case 'rejected':
            subject = '❌ Your FixCity Report Has Been Rejected';
            htmlContent = getRejectionEmailHTML(report);
            break;
        default:
            return NextResponse.json({ error: 'Unknown event type' }, { status: 400 });
    }

    // LOG EMAIL (Replace with actual email sending)
    console.log('========== EMAIL NOTIFICATION ==========');
    console.log('To:', user.email);
    console.log('Subject:', subject);
    console.log('Report ID:', report.id);
    console.log('Event:', event);
    console.log('========================================');

    return NextResponse.json({
        success: true,
        message: `Email notification logged for ${event} event`,
        email: user.email
    });
}

function getAssignmentEmailHTML(report: any): string {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
                .detail { background: white; padding: 15px; margin: 10px 0; border-left: 4px solid #3b82f6; border-radius: 4px; }
                .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🚀 Your Report Has Been Assigned!</h1>
                </div>
                <div class="content">
                    <p>Good news! A technician has been assigned to work on your reported issue.</p>
                    
                    <div class="detail">
                        <strong>Report ID:</strong> ${report.id.slice(-8)}
                    </div>
                    <div class="detail">
                        <strong>Category:</strong> ${report.category.replace('_', ' ').toUpperCase()}
                    </div>
                    <div class="detail">
                        <strong>Location:</strong> ${report.address}
                    </div>
                    <div class="detail">
                        <strong>Status:</strong> In Progress
                    </div>
                    
                    <p style="margin-top: 20px;">Our team is now working on resolving this issue. We'll keep you updated on the progress.</p>
                </div>
                <div class="footer">
                    <p>© 2026 FixCity • Making cities better, together</p>
                </div>
            </div>
        </body>
        </html>
    `;
}

function getResolutionEmailHTML(report: any): string {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f0fdf4; padding: 30px; border-radius: 0 0 10px 10px; }
                .detail { background: white; padding: 15px; margin: 10px 0; border-left: 4px solid #10b981; border-radius: 4px; }
                .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>✅ Your Issue Has Been Resolved!</h1>
                </div>
                <div class="content">
                    <p>Great news! The issue you reported has been successfully resolved by our team.</p>
                    
                    <div class="detail">
                        <strong>Report ID:</strong> ${report.id.slice(-8)}
                    </div>
                    <div class="detail">
                        <strong>Category:</strong> ${report.category.replace('_', ' ').toUpperCase()}
                    </div>
                    <div class="detail">
                        <strong>Location:</strong> ${report.address}
                    </div>
                    <div class="detail">
                        <strong>Description:</strong> ${report.description}
                    </div>
                    
                    <p style="margin-top: 20px;">Thank you for helping make our city better! View full details on your dashboard.</p>
                </div>
                <div class="footer">
                    <p>© 2026 FixCity • Making cities better, together</p>
                </div>
            </div>
        </body>
        </html>
    `;
}

function getRejectionEmailHTML(report: any): string {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #fef2f2; padding: 30px; border-radius: 0 0 10px 10px; }
                .detail { background: white; padding: 15px; margin: 10px 0; border-left: 4px solid #ef4444; border-radius: 4px; }
                .reason { background: #fee2e2; padding: 15px; margin: 10px 0; border-radius: 8px; border: 1px solid #fecaca; }
                .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>❌ Report Rejected</h1>
                </div>
                <div class="content">
                    <p>We regret to inform you that your report has been reviewed and was not accepted for processing.</p>
                    
                    <div class="detail">
                        <strong>Report ID:</strong> ${report.id.slice(-8)}
                    </div>
                    <div class="detail">
                        <strong>Category:</strong> ${report.category.replace('_', ' ').toUpperCase()}
                    </div>
                    <div class="detail">
                        <strong>Location:</strong> ${report.address}
                    </div>
                    
                    <div class="reason">
                        <strong>Reason for Rejection:</strong><br/>
                        ${report.rejection_reason || 'No reason provided'}
                    </div>
                    
                    <p style="margin-top: 20px;">If you believe this was an error, please submit a new report with additional details or contact support.</p>
                </div>
                <div class="footer">
                    <p>© 2026 FixCity • Making cities better, together</p>
                </div>
            </div>
        </body>
        </html>
    `;
}
