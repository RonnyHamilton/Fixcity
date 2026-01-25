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

// POST - Create a new report with duplicate detection
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

        // ---------------------------------------------------------
        // 1. SAME USER CHECK (Spam Prevention)
        // ---------------------------------------------------------
        // Check if THIS user recently reported a similar issue (active or resolved)
        // We check reports created by this user in the last 24 hours that match category & location
        const { data: userRecentReports } = await supabase
            .from('reports')
            .select('id, parent_report_id, created_at, latitude, longitude')
            .eq('user_id', data.user_id)
            .eq('category', data.category)
            .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()); // Last 24h

        // Import utilities
        const {
            findPotentialDuplicates,
            priorityFromCount,
            calculateGeoDistance,
            shouldReopenResolved,
            DUPLICATE_THRESHOLDS
        } = await import('@/lib/duplicate-detection');

        // Check if any recent user report is a duplicate of this new one
        const isSpam = userRecentReports?.some(existing => {
            const dist = calculateGeoDistance(data.latitude, data.longitude, existing.latitude, existing.longitude);
            return dist < DUPLICATE_THRESHOLDS.MAX_DISTANCE_METERS;
        });

        if (isSpam) {
            return NextResponse.json({
                message: "You have already reported this issue recently.",
                is_spam: true,
                created: false
            }, { status: 200 });
        }


        // ---------------------------------------------------------
        // 2. FETCH CANDIDATES (Global Duplicate Check)
        // ---------------------------------------------------------
        // Fetch ALL potential candidates (Active AND Resolved) in the same category
        // We filter for distance in memory for precision, but could use PostGIS if available.
        // For now, we fetch all in category (assuming mostly manageable volume per category, or add bounding box later)
        const { data: candidates } = await supabase
            .from('reports')
            .select('*')
            .eq('category', data.category)
            .is('parent_report_id', null); // Only check against Canonical reports

        const duplicateReport = {
            id: 'temp_check',
            category: data.category,
            description: data.description,
            latitude: data.latitude,
            longitude: data.longitude,
            priority: 'low' as const,
        };

        const duplicates = findPotentialDuplicates(
            duplicateReport,
            candidates || []
        );

        // ---------------------------------------------------------
        // 3. DETERMINE ACTION (The 7 Cases)
        // ---------------------------------------------------------

        let action: 'create' | 'merge_active' | 'merge_resolved_reopen' | 'merge_resolved_historical' = 'create';
        let parentReport: any = null;
        let finalStatus = 'pending';
        let finalPriority = 'low';
        let message = 'Report submitted successfully.';

        // If matches found
        if (duplicates.length > 0) {
            parentReport = duplicates[0]; // Best match

            if (parentReport.status === 'resolved') {
                // Check Reopen Logic (Case 5 vs Case 6)
                const shouldReopen = shouldReopenResolved(parentReport.updated_at || parentReport.resolved_at || parentReport.created_at);

                if (shouldReopen) {
                    action = 'merge_resolved_reopen'; // Case 5
                } else {
                    action = 'merge_resolved_historical'; // Case 6
                }
            } else {
                action = 'merge_active'; // Case 2, 3, 4
            }
        }

        // CASE 7: No matches found -> Action remains 'create'

        // ---------------------------------------------------------
        // 4. EXECUTE ACTION
        // ---------------------------------------------------------

        const reportId = `RPT_${Date.now()}_${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
        const newReportCount = parentReport ? (parentReport.report_count || 1) + 1 : 1;
        // Calculate priority based on NEW count
        const newPriority = priorityFromCount(newReportCount);

        console.log('[DUPLICATE DETECTION] Action:', action, '| Parent ID:', parentReport?.id, '| New Count:', newReportCount, '| New Priority:', newPriority);

        // HANDLE CREATION (Case 1 & 7)
        if (action === 'create') {
            const finalReport = {
                id: reportId,
                user_id: data.user_id,
                user_name: data.user_name,
                user_phone: data.user_phone || null,
                category: data.category,
                description: data.description,
                address: data.location,
                latitude: data.latitude,
                longitude: data.longitude,
                image_url: data.image_url || null,
                status: 'pending',
                priority: 'low',
                report_count: 1,
                parent_report_id: null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                last_reported_at: new Date().toISOString(),
            };

            const { data: created, error } = await supabase.from('reports').insert([finalReport]).select().single();
            if (error) throw error;

            return NextResponse.json({
                ...created,
                created: true,
                merged: false,
                message: "Report submitted successfully."
            }, { status: 201 });
        }

        // HANDLE MERGING (Cases 2-6)
        // Universal step: Insert Evidence
        console.log('[EVIDENCE INSERT] Parent ID:', parentReport.id, '| User:', data.user_id);
        const { error: evidenceError } = await supabase.from('report_evidence').insert([{
            canonical_report_id: parentReport.id,
            submitted_by_user_id: data.user_id,
            image_url: data.image_url,
            description: data.description,
            created_at: new Date().toISOString()
        }]);

        if (evidenceError) {
            console.error('[EVIDENCE INSERT ERROR]', evidenceError);
            // Continue execution even if evidence insert fails
        }

        // CASE 2-4: Active Merge
        if (action === 'merge_active') {
            console.log('[MERGE ACTIVE] Updating parent:', parentReport.id, '| Old Count:', parentReport.report_count, '| New Count:', newReportCount, '| Old Priority:', parentReport.priority, '| New Priority:', newPriority);

            const { data: updated, error: updateError } = await supabase.from('reports').update({
                report_count: newReportCount,
                priority: newPriority, // Escalate priority
                latest_reported_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }).eq('id', parentReport.id).select().single();

            if (updateError) {
                console.error('[MERGE ACTIVE ERROR] Failed to update parent report:', updateError);
                return NextResponse.json(
                    { error: 'Failed to merge duplicate report', details: updateError.message },
                    { status: 500 }
                );
            }

            console.log('[MERGE ACTIVE SUCCESS] Updated report:', updated);

            return NextResponse.json({
                id: parentReport.id,
                created: false,
                merged: true,
                reopened: false,
                priority: newPriority,
                reportCount: newReportCount,
                message: "This issue is already reported. Your report has been added to increase priority."
            }, { status: 201 });
        }

        // CASE 5: Reopen
        if (action === 'merge_resolved_reopen') {
            console.log('[REOPEN] Reopening report:', parentReport.id, '| New Count:', newReportCount, '| New Priority:', newPriority);

            const { data: updated, error: updateError } = await supabase.from('reports').update({
                status: 'pending', // Reopen!
                report_count: newReportCount,
                priority: newPriority,
                reopened_at: new Date().toISOString(),
                latest_reported_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }).eq('id', parentReport.id).select().single();

            if (updateError) {
                console.error('[REOPEN ERROR] Failed to reopen report:', updateError);
                return NextResponse.json(
                    { error: 'Failed to reopen report', details: updateError.message },
                    { status: 500 }
                );
            }

            console.log('[REOPEN SUCCESS] Reopened report:', updated);

            return NextResponse.json({
                id: parentReport.id,
                created: false,
                merged: true,
                reopened: true,
                priority: newPriority,
                reportCount: newReportCount,
                message: "This issue has reappeared. The case has been reopened."
            }, { status: 201 });
        }

        // CASE 6: Historical Merge (No Reopen)
        if (action === 'merge_resolved_historical') {
            console.log('[HISTORICAL MERGE] Logging to resolved report:', parentReport.id, '| New Count:', newReportCount);

            const { data: updated, error: updateError } = await supabase.from('reports').update({
                report_count: newReportCount,
                // DO NOT change priority or status
                latest_reported_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }).eq('id', parentReport.id).select().single();

            if (updateError) {
                console.error('[HISTORICAL MERGE ERROR] Failed to update report:', updateError);
                return NextResponse.json(
                    { error: 'Failed to log duplicate', details: updateError.message },
                    { status: 500 }
                );
            }

            console.log('[HISTORICAL MERGE SUCCESS] Updated report:', updated);

            return NextResponse.json({
                id: parentReport.id,
                created: false,
                merged: true,
                reopened: false,
                message: "This issue is already reported. Your report has been logged."
            }, { status: 201 });
        }

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
