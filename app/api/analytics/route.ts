import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * GET /api/analytics
 * Returns aggregated statistics for the FixCity platform.
 *
 * Response:
 * {
 *   total_reports: number,
 *   pending_reports: number,
 *   in_progress_reports: number,
 *   resolved_reports: number,
 *   rejected_reports: number,
 *   urgent_reports: number,
 *   resolution_rate: number,           // percentage (0-100)
 *   avg_response_time_hours: number,    // average hours to resolution
 *   reports_by_category: { category, count }[],
 *   reports_by_taluk: { taluk_id, taluk_name, count }[],
 *   reports_by_priority: { priority, count }[],
 *   daily_trend: { date, submitted, resolved }[]   // last 14 days
 * }
 */
export async function GET(_req: NextRequest) {
    try {
        // Fetch all canonical reports (exclude merged children)
        const { data: reports, error } = await supabase
            .from('reports')
            .select('id, status, priority, category, created_at, updated_at, taluk_id, ward_id')
            .is('parent_report_id', null)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('[Analytics API] Supabase error:', error);
            return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
        }

        const all = reports || [];

        // ── Status counts ────────────────────────────────────────────
        const pending   = all.filter(r => r.status === 'pending').length;
        const inProgress = all.filter(r => r.status === 'in_progress').length;
        const resolved  = all.filter(r => r.status === 'resolved' || r.status === 'closed').length;
        const rejected  = all.filter(r => r.status === 'rejected').length;
        const urgent    = all.filter(r => r.priority === 'urgent').length;
        const total     = all.length;
        const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;

        // ── Avg response time (creation → resolution) ────────────────
        const resolvedWithTime = all.filter(r =>
            (r.status === 'resolved' || r.status === 'closed') && r.updated_at
        );
        const avgResponseTimeHours = resolvedWithTime.length > 0
            ? resolvedWithTime.reduce((acc, r) => {
                return acc + (new Date(r.updated_at!).getTime() - new Date(r.created_at).getTime()) / 3600000;
            }, 0) / resolvedWithTime.length
            : 0;

        // ── Reports by category ──────────────────────────────────────
        const catMap: Record<string, number> = {};
        all.forEach(r => { catMap[r.category] = (catMap[r.category] || 0) + 1; });
        const reportsByCategory = Object.entries(catMap)
            .map(([category, count]) => ({ category, count }))
            .sort((a, b) => b.count - a.count);

        // ── Reports by priority ──────────────────────────────────────
        const priMap: Record<string, number> = {};
        all.forEach(r => { priMap[r.priority] = (priMap[r.priority] || 0) + 1; });
        const reportsByPriority = Object.entries(priMap)
            .map(([priority, count]) => ({ priority, count }))
            .sort((a, b) => b.count - a.count);

        // ── Reports by taluk ─────────────────────────────────────────
        const talukIds = [...new Set(all.map(r => r.taluk_id).filter(Boolean))];
        let reportsByTaluk: { taluk_id: string; taluk_name: string; count: number }[] = [];

        if (talukIds.length > 0) {
            const { data: taluks } = await supabase
                .from('taluks')
                .select('id, name')
                .in('id', talukIds);

            const talukNameMap: Record<string, string> = {};
            (taluks || []).forEach(t => { talukNameMap[t.id] = t.name; });

            const talukCountMap: Record<string, number> = {};
            all.forEach(r => {
                if (r.taluk_id) talukCountMap[r.taluk_id] = (talukCountMap[r.taluk_id] || 0) + 1;
            });

            reportsByTaluk = Object.entries(talukCountMap)
                .map(([taluk_id, count]) => ({
                    taluk_id,
                    taluk_name: talukNameMap[taluk_id] || 'Unknown',
                    count
                }))
                .sort((a, b) => b.count - a.count);
        }

        // ── Daily trend (last 14 days) ───────────────────────────────
        const today = new Date();
        const dailyTrend: { date: string; submitted: number; resolved: number }[] = [];
        for (let i = 13; i >= 0; i--) {
            const d = new Date();
            d.setDate(today.getDate() - i);
            dailyTrend.push({
                date: d.toISOString().slice(0, 10), // YYYY-MM-DD
                submitted: 0,
                resolved: 0
            });
        }
        all.forEach(r => {
            const ds = new Date(r.created_at).toISOString().slice(0, 10);
            const entry = dailyTrend.find(d => d.date === ds);
            if (entry) {
                entry.submitted++;
                if (r.status === 'resolved' || r.status === 'closed') entry.resolved++;
            }
        });

        return NextResponse.json({
            total_reports: total,
            pending_reports: pending,
            in_progress_reports: inProgress,
            resolved_reports: resolved,
            rejected_reports: rejected,
            urgent_reports: urgent,
            resolution_rate: resolutionRate,
            avg_response_time_hours: Math.round(avgResponseTimeHours * 10) / 10,
            reports_by_category: reportsByCategory,
            reports_by_priority: reportsByPriority,
            reports_by_taluk: reportsByTaluk,
            daily_trend: dailyTrend,
        });
    } catch (error) {
        console.error('[Analytics API] Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
