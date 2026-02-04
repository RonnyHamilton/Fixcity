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

        // For userId filter: Get BOTH user's own reports AND reports they contributed to via evidence
        if (userId) {
            // 1. Get user's own reports
            const { data: ownReports, error: ownError } = await query.eq('user_id', userId);

            if (ownError) {
                console.error('[Reports API] Supabase error (own reports):', ownError);
                return NextResponse.json(
                    { error: 'Failed to fetch reports' },
                    { status: 500 }
                );
            }

            // 2. Get parent reports where user submitted evidence (merged contributions)
            const { data: evidenceContributions } = await supabase
                .from('report_evidence')
                .select('canonical_report_id')
                .eq('submitted_by_user_id', userId);

            let contributedReports: any[] = [];
            if (evidenceContributions && evidenceContributions.length > 0) {
                const parentIds = [...new Set(evidenceContributions.map(e => e.canonical_report_id))];
                const { data: parents } = await supabase
                    .from('reports')
                    .select('*')
                    .in('id', parentIds);
                contributedReports = parents || [];
            }

            // 3. Merge and deduplicate (user might have both own report AND evidence on same parent)
            const ownIds = new Set((ownReports || []).map(r => r.id));
            const mergedReports = [
                ...(ownReports || []),
                ...contributedReports.filter(r => !ownIds.has(r.id)).map(r => ({
                    ...r,
                    _isContribution: true // Mark as contribution for UI display
                }))
            ];

            // Sort by created_at descending
            mergedReports.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

            console.log(`[Reports API] Fetched ${ownReports?.length || 0} own reports + ${contributedReports.length} contributions for user ${userId}`);

            return NextResponse.json({ reports: mergedReports });
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
        // VALIDATE AND NORMALIZE COORDINATES
        // ---------------------------------------------------------
        // Ensure latitude and longitude are valid numbers
        const latitude = Number(data.latitude);
        const longitude = Number(data.longitude);

        if (isNaN(latitude) || isNaN(longitude)) {
            return NextResponse.json(
                { error: 'Invalid coordinates. Latitude and longitude must be valid numbers.' },
                { status: 400 }
            );
        }

        if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
            return NextResponse.json(
                { error: 'Coordinates out of range. Latitude must be [-90, 90], Longitude must be [-180, 180].' },
                { status: 400 }
            );
        }

        // Import utilities early
        const {
            findPotentialDuplicates,
            priorityFromCount,
            calculateGeoDistance,
            shouldReopenResolved,
            normalizeCategory,
            normalizeDescription,
            DUPLICATE_THRESHOLDS
        } = await import('@/lib/duplicate-detection');

        // Normalize inputs for consistent comparison
        const normalizedCategory = normalizeCategory(data.category);
        const normalizedDescription = normalizeDescription(data.description);

        console.log('[NEW REPORT SUBMISSION]');
        console.log('  Report ID:', `temp_${Date.now()}`);
        console.log('  User ID:', data.user_id);
        console.log('  Category (original):', data.category);
        console.log('  Category (normalized):', normalizedCategory);
        console.log('  Description (original):', data.description.substring(0, 50) + '...');
        console.log('  Description (normalized):', normalizedDescription.substring(0, 50) + '...');
        console.log('  Coordinates:', `(${latitude}, ${longitude})`);

        // ---------------------------------------------------------
        // 1. SAME USER CHECK (Spam Prevention) - ACTIVE REPORTS ONLY
        // ---------------------------------------------------------
        console.log('[SPAM CHECK] Checking if same user has ACTIVE report at this location...');
        const { data: userActiveReports } = await supabase
            .from('reports')
            .select('id, parent_report_id, created_at, latitude, longitude, category, status')
            .eq('user_id', data.user_id)
            .in('status', ['pending', 'in_progress'])  // ✅ ONLY ACTIVE REPORTS
            .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

        // Check for spam using normalized category + location (ACTIVE ONLY)
        const isSpam = userActiveReports?.some(existing => {
            const existingNormalizedCategory = normalizeCategory(existing.category);
            if (existingNormalizedCategory !== normalizedCategory) return false;

            const dist = calculateGeoDistance(latitude, longitude, Number(existing.latitude), Number(existing.longitude));
            return dist < DUPLICATE_THRESHOLDS.MAX_DISTANCE_METERS;
        });

        if (isSpam) {
            console.log('[SPAM CHECK] ❌ Same user already has ACTIVE report at this location');
            return NextResponse.json({
                message: "You've already reported this issue. It's currently being processed.",
                is_spam: true,
                created: false
            }, { status: 200 });
        }
        console.log('[SPAM CHECK] ✅ No active report from this user at this location');


        // ---------------------------------------------------------
        // 2. FETCH CANDIDATES (Global Cross-User Duplicate Check) - ACTIVE ONLY
        // ---------------------------------------------------------
        console.log('[CROSS-USER DUPLICATE CHECK] Fetching ACTIVE canonical reports...');

        // ✅ SANITATION BUCKET: Query all sanitation-related categories at once
        const SANITATION_BUCKET = ['sanitation', 'waste', 'garbage', 'trash', 'litter'];
        const isSanitationFamily = SANITATION_BUCKET.some(k => normalizedCategory.includes(k));

        console.log('  Category (normalized):', normalizedCategory);
        console.log('  Is sanitation family?', isSanitationFamily);
        console.log('  🔑 STATUS FILTER: Only pending/in_progress (ACTIVE)');

        let candidates;
        let candidateError;

        if (isSanitationFamily) {
            // For sanitation: fetch ALL sanitation-related ACTIVE canonical reports
            console.log('  Query type: SANITATION BUCKET (fetching all sanitation categories)');
            const result = await supabase
                .from('reports')
                .select('*')
                .in('status', ['pending', 'in_progress'])  // ✅ ACTIVE ONLY
                .is('parent_report_id', null);
            // Filter client-side for sanitation bucket (case-insensitive)
            candidates = (result.data || []).filter(r =>
                SANITATION_BUCKET.some(k => r.category.toLowerCase().includes(k))
            );
            candidateError = result.error;
        } else {
            // For other categories: case-insensitive category match, ACTIVE ONLY
            console.log('  Query type: CASE-INSENSITIVE MATCH (ACTIVE ONLY)');
            const result = await supabase
                .from('reports')
                .select('*')
                .in('status', ['pending', 'in_progress'])  // ✅ ACTIVE ONLY
                .ilike('category', normalizedCategory)
                .is('parent_report_id', null);
            candidates = result.data;
            candidateError = result.error;
        }


        if (candidateError) {
            console.error('[CROSS-USER DUPLICATE CHECK] ❌ Query error:', candidateError);
        }

        console.log(`[CROSS-USER DUPLICATE CHECK] ✅ Query complete:`);
        console.log('  category="' + normalizedCategory + '"');
        console.log('  candidates found=' + (candidates?.length || 0));
        if (candidates && candidates.length > 0) {
            console.log('  candidate IDs:', candidates.map(c => c.id).join(', '));
        }

        const duplicateReport = {
            id: 'temp_check',
            category: normalizedCategory, // Use normalized for comparison
            description: normalizedDescription, // Use normalized for comparison
            latitude,
            longitude,
            address: data.location, // Include address for fallback matching
            priority: 'low' as const,
        };

        console.log('[CROSS-USER DUPLICATE CHECK] Running similarity checks...');
        const duplicates = findPotentialDuplicates(
            duplicateReport,
            candidates || [],
            true // Enable debug logging
        );

        console.log(`[CROSS-USER DUPLICATE CHECK] ${duplicates.length > 0 ? `✅ MATCH FOUND - ${duplicates.length} duplicate(s)` : '❌ No matches found'}`);

        // ---------------------------------------------------------
        // 2b. CANONICAL FALLBACK (Locality-Aware)
        // ---------------------------------------------------------
        // If no canonical reports found, check if ALL reports might be children
        // Fall back to oldest active report that matches by location
        if (duplicates.length === 0 && (!candidates || candidates.length === 0)) {
            console.log('[CANONICAL FALLBACK] No canonical reports found, checking for locality-aware fallback...');

            const { data: fallbackCandidates } = await supabase
                .from('reports')
                .select('*')
                .in('status', ['pending', 'in_progress'])  // ACTIVE ONLY
                .ilike('category', normalizedCategory)
                .order('created_at', { ascending: true });

            if (fallbackCandidates && fallbackCandidates.length > 0) {
                console.log(`  Found ${fallbackCandidates.length} potential fallback candidates`);

                // Filter by locality: must match by distance OR exact address
                const localMatch = fallbackCandidates.find(r => {
                    const distance = calculateGeoDistance(latitude, longitude, Number(r.latitude), Number(r.longitude));
                    const addressMatch = data.location && r.location
                        ? data.location.trim().toLowerCase() === r.location.trim().toLowerCase()
                        : false;

                    // Use category-specific threshold
                    const threshold = 200; // Use generous threshold for fallback
                    const matches = distance < threshold || addressMatch;

                    if (matches) {
                        console.log(`  ✅ Locality match found: distance=${distance.toFixed(2)}m, addressMatch=${addressMatch}`);
                    }
                    return matches;
                });

                if (localMatch) {
                    console.log(`  Using fallback canonical: ${localMatch.id} (created ${localMatch.created_at})`);
                    // Treat this as a duplicate match
                    duplicates.push(localMatch);
                } else {
                    console.log('  ❌ No locality match in fallback candidates');
                }
            }
        }

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
        const newPriority = priorityFromCount(newReportCount);

        console.log('[ACTION DECISION]', action.toUpperCase());
        if (parentReport) {
            console.log('  Parent Report ID:', parentReport.id);
            console.log('  Current Count:', parentReport.report_count || 1);
            console.log('  New Count:', newReportCount);
            console.log('  Current Priority:', parentReport.priority);
            console.log('  New Priority:', newPriority);
        }

        // HANDLE CREATION (Case 1 & 7)
        if (action === 'create') {
            console.log('[CREATE NEW REPORT] No duplicates found - creating new canonical report');
            const finalReport = {
                id: reportId,
                user_id: data.user_id,
                user_name: data.user_name,
                user_phone: data.user_phone || null,
                category: normalizedCategory, // ✅ CRITICAL: Store normalized category
                description: normalizedDescription, // ✅ CRITICAL: Store normalized description
                address: data.location,
                latitude,
                longitude,
                image_url: data.image_url || null,
                status: 'pending',
                priority: 'low',
                report_count: 1,
                parent_report_id: null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                latest_reported_at: new Date().toISOString(), // ✅ FIXED: Use latest_reported_at (not last_reported_at)
            };

            const { data: created, error } = await supabase.from('reports').insert([finalReport]).select().single();
            if (error) throw error;

            // Notify officers about new report (fire and forget)
            try {
                fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/reports/notify`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        reportId: created.id,
                        event: 'new_report'
                    })
                }).catch(err => console.error('Officer notification error:', err));
            } catch (notifyError) {
                console.error('Failed to trigger officer notification:', notifyError);
            }

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

            // Race condition guard: Retry with exponential backoff
            let updated = null;
            let lastError = null;
            const MAX_RETRIES = 3;

            for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
                if (attempt > 0) {
                    const backoffMs = 100 * Math.pow(2, attempt - 1); // 100ms, 200ms, 400ms
                    console.log(`[MERGE ACTIVE RETRY] Attempt ${attempt + 1}/${MAX_RETRIES} after ${backoffMs}ms backoff...`);
                    await new Promise(resolve => setTimeout(resolve, backoffMs));

                    // Re-fetch parent to get latest state
                    const { data: refetchedParent } = await supabase
                        .from('reports')
                        .select('*')
                        .eq('id', parentReport.id)
                        .single();

                    if (refetchedParent) {
                        parentReport = refetchedParent;
                        // Recalculate with fresh data
                        const freshCount = (parentReport.report_count || 1) + 1;
                        const freshPriority = priorityFromCount(freshCount);
                        console.log(`  Re-fetched parent: count=${freshCount}, priority=${freshPriority}`);
                    }
                }

                const { data: updateResult, error: updateError } = await supabase.from('reports').update({
                    report_count: (parentReport.report_count || 1) + 1,
                    priority: priorityFromCount((parentReport.report_count || 1) + 1),
                    latest_reported_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }).eq('id', parentReport.id).select().single();

                if (!updateError) {
                    updated = updateResult;
                    console.log('[MERGE ACTIVE SUCCESS] Updated report on attempt', attempt + 1);
                    break;
                }

                lastError = updateError;
                console.warn(`[MERGE ACTIVE] Attempt ${attempt + 1} failed:`, updateError.message);

                // If last attempt, throw error
                if (attempt === MAX_RETRIES - 1) {
                    console.error('[MERGE ACTIVE ERROR] All retries exhausted:', lastError);
                    return NextResponse.json(
                        { error: 'Failed to merge duplicate report', details: lastError.message },
                        { status: 500 }
                    );
                }
            }

            return NextResponse.json({
                id: parentReport.id,
                created: false,
                merged: true,
                reopened: false,
                priority: updated?.priority || newPriority,
                reportCount: updated?.report_count || newReportCount,
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
