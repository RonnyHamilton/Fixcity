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
    duplicate_count?: number;
    assigned_technician_id?: string | null;
    status?: string;
    updated_at?: string;
    created_at?: string;
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
    existingReports: ReportForComparison[]
): ReportForComparison[] {
    return existingReports
        .filter((existing) => {
            // Must be a canonical report (not a child)
            if (existing.parent_report_id) return false;

            // Must have same category
            if (existing.category !== newReport.category) return false;

            // Check geo-distance
            const distance = calculateGeoDistance(
                newReport.latitude,
                newReport.longitude,
                existing.latitude,
                existing.longitude
            );
            if (distance > DUPLICATE_THRESHOLDS.MAX_DISTANCE_METERS) return false;

            // Check text similarity
            const similarity = calculateTextSimilarity(
                newReport.description,
                existing.description
            );
            if (similarity < DUPLICATE_THRESHOLDS.MIN_TEXT_SIMILARITY) return false;

            return true;
        })
        .sort((a, b) => {
            // Sort by duplicate count (prefer merging into reports with more duplicates)
            return (b.duplicate_count || 0) - (a.duplicate_count || 0);
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
 * Calculate total report count (parent + duplicates)
 */
export function calculateReportCount(duplicateCount: number): number {
    return duplicateCount + 1; // +1 for the parent report itself
}

/**
 * Upgrade priority based on TOTAL report count (not duplicate count)
 * New Thresholds:
 * - 1 report → Low
 * - 2-3 reports → Medium
 * - 4-6 reports → High
 * - 7+ reports → Urgent/Critical
 */
export function upgradePriority(
    currentPriority: 'low' | 'medium' | 'high' | 'urgent',
    duplicateCount: number
): 'low' | 'medium' | 'high' | 'urgent' {
    const reportCount = calculateReportCount(duplicateCount);

    // Direct priority assignment based on report count
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
