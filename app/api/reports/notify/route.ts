import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

/**
 * API Route: /api/reports/notify
 * 
 * Sends email notifications to authenticated public users when their reports are updated.
 * 
 * Events:
 * - 'assigned': Officer assigned a technician to the report
 * - 'resolved': Technician marked the report as resolved
 * 
 * NOTE: This uses console logging instead of actual email sending.
 * To enable real emails, install Resend: npm install resend
 * Then add RESEND_API_KEY to .env.local and uncomment the Resend code below.
 */

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { reportId, event } = body;

        if (!reportId || !event) {
            return NextResponse.json(
                { error: 'reportId and event are required' },
                { status: 400 }
            );
        }

        if (!['assigned', 'resolved'].includes(event)) {
            return NextResponse.json(
                { error: 'event must be "assigned" or "resolved"' },
                { status: 400 }
            );
        }

        const supabase = createServerSupabaseClient();

        // Fetch report details
        const { data: report, error: reportError } = await supabase
            .from('reports')
            .select('id, user_id, category, address, description, status')
            .eq('id', reportId)
            .single();

        if (reportError || !report) {
            console.error('Report not found:', reportError);
            return NextResponse.json(
                { error: 'Report not found' },
                { status: 404 }
            );
        }

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

        // Prepare email content
        const subject = event === 'assigned'
            ? 'Your FixCity Report Has Been Assigned'
            : 'Your FixCity Issue Has Been Resolved';

        const htmlContent = event === 'assigned'
            ? getAssignmentEmailHTML(report)
            : getResolutionEmailHTML(report);

        // LOG EMAIL (Replace with actual email sending)
        console.log('========== EMAIL NOTIFICATION ==========');
        console.log('To:', user.email);
        console.log('Subject:', subject);
        console.log('Report ID:', report.id);
        console.log('Event:', event);
        console.log('========================================');

        // TODO: Uncomment this block to send real emails via Resend
        /*
        const { Resend } = await import('resend');
        const resend = new Resend(process.env.RESEND_API_KEY);

        await resend.emails.send({
            from: 'FixCity <notifications@fixcity.com>',
            to: user.email,
            subject,
            html: htmlContent,
        });
        */

        return NextResponse.json({
            success: true,
            message: `Email notification logged for ${event} event`,
            email: user.email
        });

    } catch (error: any) {
        console.error('Notification error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to send notification' },
            { status: 500 }
        );
    }
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
