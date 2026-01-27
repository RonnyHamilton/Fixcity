/**
 * Duplicate Detection Utilities for FixCity
 * Used to identify similar reports and manage priority escalation
 */

export interface GeoLocation {
    latitude: number;
    longitude: number;
}

export interface ReportForComparison {
    id: string;
    category: string;
    description: string;
    latitude: number;
    longitude: number;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    parent_report_id?: string | null;
    report_count?: number; // Changed from duplicate_count to match schema
    assigned_technician_id?: string | null;
    status?: string;
    updated_at?: string;
    created_at?: string;
}

/**
 * Normalize category for consistent matching
 * Converts to lowercase and trims whitespace
 */
export function normalizeCategory(category: string): string {
    return category.trim().toLowerCase();
}

/**
 * Normalize description for consistent matching
 * Converts to lowercase, trims, and collapses multiple spaces
 */
export function normalizeDescription(description: string): string {
    return description
        .trim()
        .toLowerCase()
        .replace(/\s+/g, ' '); // Collapse multiple spaces to single space
}

/**
 * Calculate distance between two geographic points using Haversine formula
 * @returns Distance in meters
 */
export function calculateGeoDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
): number {
    const R = 6371000; // Earth's radius in meters
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRadians(lat1)) *
        Math.cos(toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
}

/**
 * Calculate text similarity using Jaccard index (word overlap)
 * @returns Similarity score between 0 and 1
 */
export function calculateTextSimilarity(text1: string, text2: string): number {
    if (!text1 || !text2) return 0;

    // Normalize and tokenize
    const normalize = (text: string) =>
        text
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, '')
            .split(/\s+/)
            .filter((word) => word.length > 2); // Ignore very short words

    const words1 = new Set(normalize(text1));
    const words2 = new Set(normalize(text2));

    if (words1.size === 0 || words2.size === 0) return 0;

    // Calculate intersection
    const intersection = new Set([...words1].filter((word) => words2.has(word)));

    // Jaccard similarity: intersection / union
    const union = new Set([...words1, ...words2]);
    return intersection.size / union.size;
}

/**
 * Detection thresholds
 */
export const DUPLICATE_THRESHOLDS = {
    MAX_DISTANCE_METERS: 100, // Reports within 100m are considered same location
    MIN_TEXT_SIMILARITY: 0.4, // 40% word overlap required
};

/**
 * Find potential duplicate reports for a new report
 * @returns List of matching existing reports, sorted by relevance
 */
export function findPotentialDuplicates(
    newReport: ReportForComparison,
    existingReports: ReportForComparison[],
    debug = false
): ReportForComparison[] {
    const normalizedNewCategory = normalizeCategory(newReport.category);
    const normalizedNewDesc = normalizeDescription(newReport.description);

    // Categories where location alone is enough (using substring matching for flexibility)
    // This handles variations like "Sanitation Issue", "Waste Management", "garbage-report", etc.
    const isSanitationCategory = (category: string) => {
        const lower = category.toLowerCase();
        return (
            lower.includes('sanitation') ||
            lower.includes('waste') ||
            lower.includes('garbage') ||
            lower.includes('trash') ||
            lower.includes('litter')
        );
    };

    const isLocationOnlyCategory = isSanitationCategory(normalizedNewCategory);

    // Increased distance for sanitation to account for GPS drift
    // Garbage on a street might be "same issue" even if 200m apart due to phone GPS variance
    // Real-world testing shows 300m is optimal for street-level sanitation issues
    const MAX_DISTANCE = isLocationOnlyCategory
        ? 300 // Sanitation: very lenient (GPS drift + street-wide issues + phone variance)
        : DUPLICATE_THRESHOLDS.MAX_DISTANCE_METERS; // Other: strict 100m

    if (debug) {
        console.log('\n========== DUPLICATE DETECTION START ==========');
        console.log(`[NEW REPORT] Category: "${normalizedNewCategory}" | Location-only mode: ${isLocationOnlyCategory}`);
        console.log(`[NEW REPORT] Distance threshold: ${MAX_DISTANCE}m`);
        console.log(`[NEW REPORT] Coordinates: (${newReport.latitude}, ${newReport.longitude})`);
        console.log(`[NEW REPORT] Description: "${normalizedNewDesc.substring(0, 60)}..."`);
        console.log(`[CANDIDATES] Checking ${existingReports.length} potential duplicates\n`);
    }

    return existingReports
        .filter((existing) => {
            // Must be a canonical report (not a child)
            if (existing.parent_report_id) {
                if (debug) {
                    console.log(`[CANDIDATE ${existing.id}] ❌ SKIP - Not canonical (has parent_report_id)`);
                }
                return false;
            }

            // Must have same category (normalized comparison)
            const normalizedExistingCategory = normalizeCategory(existing.category);
            if (normalizedExistingCategory !== normalizedNewCategory) {
                if (debug) {
                    console.log(`[CANDIDATE ${existing.id}] ❌ SKIP - Category mismatch ("${normalizedExistingCategory}" !== "${normalizedNewCategory}")`);
                }
                return false;
            }

            // Check geo-distance
            const distance = calculateGeoDistance(
                newReport.latitude,
                newReport.longitude,
                existing.latitude,
                existing.longitude
            );

            if (debug) {
                console.log(`[CANDIDATE ${existing.id}] user_id=${(existing as any).user_id || 'unknown'} | distance=${distance.toFixed(2)}m (threshold: ${MAX_DISTANCE}m)`);
            }

            // Distance check - ALWAYS required
            if (distance > MAX_DISTANCE) {
                if (debug) {
                    console.log(`  ❌ Distance too far (${distance.toFixed(2)}m > ${MAX_DISTANCE}m)`);
                }
                return false;
            }

            // For sanitation/waste/garbage: Distance alone is enough!
            if (isLocationOnlyCategory) {
                if (debug) {
                    console.log(`  ✅ MATCH - Sanitation category, distance within threshold (${distance.toFixed(2)}m <= ${MAX_DISTANCE}m)`);
                    console.log(`  📊 Decision: MERGE (location-based match for ${normalizedNewCategory})`);
                }
                return true;
            }

            // For other categories: Check text similarity
            const normalizedExistingDesc = normalizeDescription(existing.description);
            const similarity = calculateTextSimilarity(
                normalizedNewDesc,
                normalizedExistingDesc
            );

            if (debug) {
                console.log(`  📝 Text similarity: ${(similarity * 100).toFixed(1)}% (threshold: ${(DUPLICATE_THRESHOLDS.MIN_TEXT_SIMILARITY * 100).toFixed(1)}%)`);
            }

            if (similarity < DUPLICATE_THRESHOLDS.MIN_TEXT_SIMILARITY) {
                if (debug) {
                    console.log(`  ❌ Similarity too low (${(similarity * 100).toFixed(1)}% < ${(DUPLICATE_THRESHOLDS.MIN_TEXT_SIMILARITY * 100).toFixed(1)}%)`);
                }
                return false;
            }

            if (debug) {
                console.log(`  ✅ MATCH - Distance=${distance.toFixed(2)}m, Similarity=${(similarity * 100).toFixed(1)}%`);
                console.log(`  📊 Decision: MERGE (distance + text similarity match)`);
            }
            return true;
        })
        .sort((a, b) => {
            // Sort by report count (prefer merging into reports with more reports)
            return (b.report_count || 1) - (a.report_count || 1);
        });
}

/**
 * Priority levels in order
 */
const PRIORITY_ORDER: Array<'low' | 'medium' | 'high' | 'urgent'> = [
    'low',
    'medium',
    'high',
    'urgent',
];

/**
 * Upgrade priority based on TOTAL report count
 * Thresholds:
 * - 1 report → Low
 * - 2-3 reports → Medium
 * - 4-6 reports → High
 * - 7+ reports → Urgent/Critical
 * 
 * @param reportCount - The TOTAL number of reports (including parent)
 */
export function priorityFromCount(
    reportCount: number
): 'low' | 'medium' | 'high' | 'urgent' {
    if (reportCount >= 7) {
        return 'urgent';
    } else if (reportCount >= 4) {
        return 'high';
    } else if (reportCount >= 2) {
        return 'medium';
    } else {
        return 'low';
    }
}

/**
 * @deprecated Use priorityFromCount instead - this wrapper maintained for compatibility
 */
export function upgradePriority(
    currentPriority: 'low' | 'medium' | 'high' | 'urgent',
    reportCount: number
): 'low' | 'medium' | 'high' | 'urgent' {
    return priorityFromCount(reportCount);
}

/**
 * Determine if a resolved issue should be reopened or treated as new
 * @param resolvedAt - ISO timestamp when issue was resolved
 * @param currentTime - Current time for comparison (defaults to now)
 * @returns true if should reopen, false if should create new issue
 */
export function shouldReopenResolved(
    resolvedAt: string,
    currentTime: Date = new Date()
): boolean {
    const REOPEN_WINDOW_DAYS = 7;
    const resolvedDate = new Date(resolvedAt);
    const daysSinceResolved = (currentTime.getTime() - resolvedDate.getTime()) / (1000 * 60 * 60 * 24);

    return daysSinceResolved <= REOPEN_WINDOW_DAYS;
}

/**
 * Determine how to handle a duplicate of a resolved report
 * @returns 'reopen' | 'merge' | 'new'
 */
export function handleResolvedDuplicate(
    resolvedReport: ReportForComparison,
    newReport: ReportForComparison
): 'reopen' | 'merge' | 'new' {
    if (!resolvedReport.updated_at) return 'new';

    const withinReopenWindow = shouldReopenResolved(resolvedReport.updated_at);

    // Check if it's very similar (same exact issue)
    const distance = calculateGeoDistance(
        newReport.latitude,
        newReport.longitude,
        resolvedReport.latitude,
        resolvedReport.longitude
    );
    const textSimilarity = calculateTextSimilarity(
        newReport.description,
        resolvedReport.description
    );

    const isVerySimilar =
        distance < DUPLICATE_THRESHOLDS.MAX_DISTANCE_METERS &&
        textSimilarity > DUPLICATE_THRESHOLDS.MIN_TEXT_SIMILARITY;

    if (withinReopenWindow && isVerySimilar) {
        return 'reopen'; // Same issue recurring quickly
    } else if (isVerySimilar) {
        return 'merge'; // Same issue but as duplicate, not reopen
    } else {
        return 'new'; // Different enough to be a new issue
    }
}
