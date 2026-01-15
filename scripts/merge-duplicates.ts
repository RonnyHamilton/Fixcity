/**
 * Migration Script: Merge Existing Duplicate Reports
 * 
 * This script retroactively applies duplicate detection logic to existing reports.
 * It will:
 * 1. Find duplicate reports based on category, location, and description similarity
 * 2. Link duplicates to parent reports (set parent_report_id)
 * 3. Update duplicate_count on parent reports
 * 4. Escalate priority based on duplicate count
 * 5. Apply extra priority boost if technician is assigned
 * 
 * Run this script once to clean up existing data.
 */

import { createClient } from '@supabase/supabase-js';
import {
    findPotentialDuplicates,
    upgradePriority,
    type ReportForComparison,
} from '../lib/duplicate-detection';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function mergeDuplicates() {
    console.log('🔍 Starting duplicate merge process...\n');

    try {
        // Fetch all reports
        const { data: allReports, error } = await supabase
            .from('reports')
            .select('*')
            .order('created_at', { ascending: true });

        if (error) {
            throw error;
        }

        if (!allReports || allReports.length === 0) {
            console.log('ℹ️  No reports found');
            return;
        }

        console.log(`📊 Found ${allReports.length} total reports\n`);

        let mergedCount = 0;
        let priorityUpdates = 0;
        const processedReports = new Set<string>();

        // Process each report
        for (const report of allReports) {
            // Skip if already processed as a duplicate
            if (processedReports.has(report.id)) {
                continue;
            }

            // Skip if already has a parent (already marked as duplicate)
            if (report.parent_report_id) {
                processedReports.add(report.id);
                continue;
            }

            // Skip if missing required fields
            if (!report.latitude || !report.longitude || !report.category) {
                continue;
            }

            // Find potential duplicates for this report
            const otherReports = allReports.filter(
                r => r.id !== report.id &&
                    !r.parent_report_id &&
                    !processedReports.has(r.id) &&
                    r.latitude &&
                    r.longitude
            );

            const duplicates = findPotentialDuplicates(
                report as ReportForComparison,
                otherReports as ReportForComparison[]
            );

            if (duplicates.length > 0) {
                console.log(`\n🔗 Found ${duplicates.length} duplicate(s) for report ${report.id}`);
                console.log(`   Category: ${report.category}`);
                console.log(`   Location: ${report.latitude.toFixed(4)}, ${report.longitude.toFixed(4)}`);

                // Mark duplicates as children of this report
                for (const duplicate of duplicates) {
                    await supabase
                        .from('reports')
                        .update({ parent_report_id: report.id })
                        .eq('id', duplicate.id);

                    processedReports.add(duplicate.id);
                    mergedCount++;
                    console.log(`   ✓ Linked ${duplicate.id} as duplicate`);
                }

                // Calculate new priority
                const duplicateCount = duplicates.length;
                let newPriority = upgradePriority(
                    report.priority as 'low' | 'medium' | 'high' | 'urgent',
                    duplicateCount
                );

                // Extra priority boost if technician assigned
                const hasTechnician = report.assigned_technician_id != null;
                if (hasTechnician && newPriority !== 'urgent') {
                    const priorityOrder: Array<'low' | 'medium' | 'high' | 'urgent'> =
                        ['low', 'medium', 'high', 'urgent'];
                    const currentIndex = priorityOrder.indexOf(newPriority);
                    newPriority = priorityOrder[Math.min(currentIndex + 1, priorityOrder.length - 1)];
                    console.log(`   🚨 Extra boost (technician assigned): ${newPriority}`);
                }

                // Update parent report
                await supabase
                    .from('reports')
                    .update({
                        duplicate_count: duplicateCount,
                        priority: newPriority,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', report.id);

                priorityUpdates++;
                console.log(`   ✓ Updated priority: ${report.priority} → ${newPriority}`);
                console.log(`   ✓ Duplicate count: ${duplicateCount}`);
            }

            processedReports.add(report.id);
        }

        console.log('\n' + '='.repeat(60));
        console.log('✅ Migration Complete!');
        console.log('='.repeat(60));
        console.log(`📊 Reports processed: ${processedReports.size}`);
        console.log(`🔗 Duplicates merged: ${mergedCount}`);
        console.log(`⬆️  Priorities updated: ${priorityUpdates}`);
        console.log('='.repeat(60) + '\n');

    } catch (error) {
        console.error('❌ Error during migration:', error);
        process.exit(1);
    }
}

// Run the migration
mergeDuplicates()
    .then(() => {
        console.log('✨ Done!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Fatal error:', error);
        process.exit(1);
    });
