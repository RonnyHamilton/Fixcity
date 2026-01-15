import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { supabase } from '@/lib/supabase';

export async function GET() {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // 1. Fixed Today: Status resolved, updated_at >= today
        const { count: fixedTodayCount, error: fixedError } = await supabase
            .from('reports')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'resolved')
            .gte('updated_at', today.toISOString());

        if (fixedError) throw fixedError;

        // 2. Active Repairs: Status in_progress
        const { count: activeRepairsCount, error: activeError } = await supabase
            .from('reports')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'in_progress');

        if (activeError) throw activeError;

        // 3. Volunteers: Count distinct user_ids (approximate)
        // Note: Supabase doesn't support distinct count directly on a column easily via JS client for large datasets without RPC,
        // but for now we can fetch unique user_ids or just count total reports as a proxy if needed.
        // Better approach: Count total rows in 'technicians' table + 'officers' + distinct public users if we had a users table.
        // For now, let's use a simple query on the reports table to get unique submitters, or just a static base + daily growth.
        // Let's try to get unique user_ids from reports (might be slow if many reports, but fine for now).

        // Alternative: Just count total technicians for "Volunteers" context if that fits better, 
        // OR count total unique users who have submitted a report.

        // Let's just count total reports as a proxy for "Community Impact" -> "Issues Reported" is already 50k+ in the design.
        // The design says "Volunteers". Let's assume this means public users.
        // We can't easily get unique count without RPC.
        // Let's use a different metric that is easy: Total Technicians + Officers? 
        // Or just the count of all reports as "Contributions".

        // Let's stick to the plan: "Count of unique user_ids".
        // API-efficient way:
        const { data: users, error: volunteersError } = await supabase
            .from('reports')
            .select('user_id');

        if (volunteersError) throw volunteersError;

        const uniqueVolunteers = new Set(users?.map(r => r.user_id)).size;

        // --- Community Impact Stats ---

        // 4. Total Issues Reported
        const { count: totalReports, error: reportsError } = await supabase
            .from('reports')
            .select('*', { count: 'exact', head: true });

        if (reportsError) throw reportsError;

        // 5. Total Issues Resolved
        const { count: totalResolved, error: resolvedError } = await supabase
            .from('reports')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'resolved');

        if (resolvedError) throw resolvedError;

        // 6. Technicians - Always count from JSON file
        const totalTechnicians = await getTechnicianFallback();

        // 7. Cities/Areas Covered (Count distinct areas from technicians JSON)
        const techData = await getTechnicianData();
        const uniqueAreas = new Set(techData?.map((t: any) => t.area)).size;


        return NextResponse.json({
            fixedToday: fixedTodayCount || 0,
            activeRepairs: activeRepairsCount || 0,
            volunteers: uniqueVolunteers || 0,

            // Impact Stats
            totalReports: totalReports || 0,
            totalResolved: totalResolved || 0,
            totalTechnicians: totalTechnicians || 0,
            citiesCovered: uniqueAreas || 1, // Default to 1 (FixCity) if 0

            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Stats fetch error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch stats' },
            { status: 500 }
        );
    }
}

async function getTechnicianData() {
    try {
        const filePath = path.join(process.cwd(), 'data/technicians.json');
        console.log('Reading technicians from:', filePath);
        const fileContent = await fs.readFile(filePath, 'utf-8');
        const technicians = JSON.parse(fileContent);
        console.log('Technicians loaded:', technicians.length, 'found');
        return Array.isArray(technicians) ? technicians : [];
    } catch (error) {
        console.error('Failed to read technicians.json:', error);
        return [];
    }
}

async function getTechnicianFallback() {
    const data = await getTechnicianData();
    return data.length;
}
