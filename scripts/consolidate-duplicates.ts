import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import {
    findPotentialDuplicates,
    priorityFromCount,
    normalizeCategory,
    normalizeDescription,
    DUPLICATE_THRESHOLDS
} from '../lib/duplicate-detection';

// Load environment variables
config({ path: '.env.local' });

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

interface Report {
    id: string;
    user_id: string;
    user_name: string;
    category: string;
    description: string;
    latitude: number;
    longitude: number;
    priority: string;
    status: string;
    parent_report_id: string | null;
    report_count: number;
    created_at: string;
    image_url?: string;
}

async function consolidateDuplicates(dryRun: boolean = true) {
    console.log('='.repeat(80));
    console.log('DUPLICATE REPORT CONSOLIDATION SCRIPT');
    console.log('='.repeat(80));
    console.log(`Mode: ${dryRun ? 'DRY RUN (no changes will be made)' : 'LIVE (database will be updated)'}`);
    console.log('');

    try {
        // Step 1: Fetch all canonical reports (parent_report_id is null)
        console.log('[STEP 1] Fetching all canonical reports...');
        const { data: allReports, error: fetchError } = await supabase
            .from('reports')
            .select('*')
            .is('parent_report_id', null)
            .order('created_at', { ascending: true });

        if (fetchError) {
            console.error('Error fetching reports:', fetchError);
            return;
        }

        console.log(`Found ${allReports?.length || 0} canonical reports`);
        console.log('');

        if (!allReports || allReports.length === 0) {
            console.log('No reports to process. Exiting.');
            return;
        }

        // Step 2: Group reports by category for efficient processing
        console.log('[STEP 2] Grouping reports by category...');
        const SANITATION_BUCKET = ['sanitation', 'waste', 'garbage', 'trash', 'litter'];

        const categorizedReports: { [key: string]: Report[] } = {};
        allReports.forEach(report => {
            const normalized = normalizeCategory(report.category);
            const isSanitation = SANITATION_BUCKET.some(k => normalized.includes(k));
            const key = isSanitation ? 'SANITATION_GROUP' : normalized;

            if (!categorizedReports[key]) {
                categorizedReports[key] = [];
            }
            categorizedReports[key].push(report as Report);
        });

        console.log(`Grouped into ${Object.keys(categorizedReports).length} categories`);
        Object.entries(categorizedReports).forEach(([category, reports]) => {
            console.log(`  - ${category}: ${reports.length} reports`);
        });
        console.log('');

        // Step 3: Process each category and find duplicates
        console.log('[STEP 3] Finding and merging duplicates...');
        let totalMerged = 0;
        let totalEvidence = 0;
        const mergeActions: Array<{
            parentId: string;
            duplicateId: string;
            newCount: number;
            newPriority: string;
        }> = [];

        for (const [category, reports] of Object.entries(categorizedReports)) {
            if (reports.length < 2) continue; // Skip if only one report

            console.log(`\nProcessing category: ${category} (${reports.length} reports)`);

            // Sort by creation date (oldest first)
            reports.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

            const processed = new Set<string>();

            for (let i = 0; i < reports.length; i++) {
                if (processed.has(reports[i].id)) continue;

                const currentReport = reports[i];
                const candidates = reports.slice(i + 1).filter(r => !processed.has(r.id));

                if (candidates.length === 0) continue;

                // Normalize current report for comparison
                const normalizedReport = {
                    ...currentReport,
                    category: normalizeCategory(currentReport.category),
                    description: normalizeDescription(currentReport.description),
                    priority: currentReport.priority as 'low' | 'medium' | 'high' | 'urgent'
                };

                // Find duplicates
                const duplicates = findPotentialDuplicates(
                    normalizedReport,
                    candidates.map(c => ({
                        ...c,
                        category: normalizeCategory(c.category),
                        description: normalizeDescription(c.description),
                        priority: c.priority as 'low' | 'medium' | 'high' | 'urgent'
                    })),
                    false // Disable debug logging for cleaner output
                );

                if (duplicates.length > 0) {
                    console.log(`  Found ${duplicates.length} duplicate(s) for report ${currentReport.id.slice(-6)}`);

                    duplicates.forEach(dup => {
                        const duplicate = candidates.find(c => c.id === dup.id);
                        if (!duplicate) return;

                        processed.add(duplicate.id);
                        totalMerged++;

                        const newCount = (currentReport.report_count || 1) + 1;
                        const newPriority = priorityFromCount(newCount);

                        console.log(`    - Merging ${duplicate.id.slice(-6)} into ${currentReport.id.slice(-6)}`);
                        console.log(`      New count: ${newCount}, Priority: ${newPriority}`);

                        mergeActions.push({
                            parentId: currentReport.id,
                            duplicateId: duplicate.id,
                            newCount,
                            newPriority
                        });

                        // Update the current report's count for future iterations
                        currentReport.report_count = newCount;
                        currentReport.priority = newPriority;
                    });
                }

                processed.add(currentReport.id);
            }
        }

        console.log('');
        console.log('='.repeat(80));
        console.log('SUMMARY');
        console.log('='.repeat(80));
        console.log(`Total duplicates found: ${totalMerged}`);
        console.log(`Total merge actions: ${mergeActions.length}`);
        console.log('');

        if (mergeActions.length === 0) {
            console.log('No duplicates found. Database is clean!');
            return;
        }

        // Step 4: Execute merges (if not dry run)
        if (!dryRun) {
            console.log('[STEP 4] Executing database updates...');

            for (const action of mergeActions) {
                try {
                    // 1. Insert evidence for the duplicate report
                    const { data: duplicateReport } = await supabase
                        .from('reports')
                        .select('*')
                        .eq('id', action.duplicateId)
                        .single();

                    if (duplicateReport) {
                        const { error: evidenceError } = await supabase
                            .from('report_evidence')
                            .insert([{
                                canonical_report_id: action.parentId,
                                submitted_by_user_id: duplicateReport.user_id,
                                image_url: duplicateReport.image_url,
                                description: duplicateReport.description,
                                created_at: duplicateReport.created_at
                            }]);

                        if (evidenceError) {
                            console.error(`  Error inserting evidence for ${action.duplicateId}:`, evidenceError);
                        } else {
                            totalEvidence++;
                        }
                    }

                    // 2. Update parent report
                    const { error: updateError } = await supabase
                        .from('reports')
                        .update({
                            report_count: action.newCount,
                            priority: action.newPriority,
                            updated_at: new Date().toISOString()
                        })
                        .eq('id', action.parentId);

                    if (updateError) {
                        console.error(`  Error updating parent ${action.parentId}:`, updateError);
                    }

                    // 3. Delete duplicate report
                    const { error: deleteError } = await supabase
                        .from('reports')
                        .delete()
                        .eq('id', action.duplicateId);

                    if (deleteError) {
                        console.error(`  Error deleting duplicate ${action.duplicateId}:`, deleteError);
                    }

                    console.log(`  ✓ Merged ${action.duplicateId.slice(-6)} into ${action.parentId.slice(-6)}`);

                } catch (error) {
                    console.error(`  Error processing merge action:`, error);
                }
            }

            console.log('');
            console.log('='.repeat(80));
            console.log('MIGRATION COMPLETE');
            console.log('='.repeat(80));
            console.log(`Reports merged: ${totalMerged}`);
            console.log(`Evidence records created: ${totalEvidence}`);
            console.log('');
        } else {
            console.log('[DRY RUN] No changes made to database.');
            console.log('Run with dryRun=false to execute actual merges.');
            console.log('');
            console.log('Merge actions that would be executed:');
            mergeActions.forEach((action, index) => {
                console.log(`  ${index + 1}. ${action.duplicateId.slice(-6)} → ${action.parentId.slice(-6)} (count: ${action.newCount}, priority: ${action.newPriority})`);
            });
        }

    } catch (error) {
        console.error('Fatal error during migration:', error);
    }
}

// Run the script
const isDryRun = process.argv.includes('--dry-run') || !process.argv.includes('--execute');
consolidateDuplicates(isDryRun).then(() => {
    console.log('Script finished.');
    process.exit(0);
}).catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
});
