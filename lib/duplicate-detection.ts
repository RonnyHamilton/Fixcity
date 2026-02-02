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
    address?: string;
}

/**
 * Category synonym mappings for handling legacy data and common variations
 * Maps alternative category names to canonical forms
 */
const CATEGORY_MAPPINGS: Record<string, string> = {
    'pothole': 'road damage',
    'pot hole': 'road damage',
    'pot-hole': 'road damage',
    'road issue': 'road damage',
    'road defect': 'road damage',
    'pavement': 'road damage',
    'garbage': 'sanitation',
    'trash': 'sanitation',
    'waste': 'sanitation',
    'litter': 'sanitation',
    'rubbish': 'sanitation',
    'street light': 'streetlight',
    'street-light': 'streetlight',
    'lamp': 'streetlight',
};

/**
 * Category-specific distance thresholds (in meters)
 * Different issue types have different spatial characteristics
 */
const CATEGORY_DISTANCE_THRESHOLDS: Record<string, number> = {
    'road damage': 200,      // Potholes/road issues: campus-scale (200m)
    'pothole': 200,          // Legacy support
    'sanitation': 300,       // Garbage: street-level with GPS drift
    'streetlight': 150,      // Infrastructure: moderate range
    'default': 100,          // Conservative default
};

/**
 * Categories where distance-only matching is sufficient (no text similarity required)
 * These are location-based issues where the exact description doesn't matter
 */
const DISTANCE_ONLY_CATEGORIES = [
    'road damage',
    'pothole',
    'sanitation',
    'waste',
    'garbage',
    'trash',
    'litter',
];

/**
 * Normalize category for consistent matching
 * Applies synonym mappings, then converts to lowercase and trims
 */
export function normalizeCategory(category: string): string {
    const trimmed = category.trim().toLowerCase();
    // Apply category mappings if exists
    return CATEGORY_MAPPINGS[trimmed] || trimmed;
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
 * Check if coordinates are valid (not NULL, 0, or out of range)
 */
export function hasValidCoordinates(lat: number, lon: number): boolean {
    if (lat === 0 && lon === 0) return false; // GPS failure default
    if (isNaN(lat) || isNaN(lon)) return false;
    if (lat < -90 || lat > 90) return false;
    if (lon < -180 || lon > 180) return false;
    return true;
}

/**
 * Calculate distance between two geographic points using Haversine formula
 * @returns Distance in meters, or Infinity if coordinates are invalid
 */
export function calculateGeoDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
): number {
    // Return Infinity for invalid coordinates (prevents false matches)
    if (!hasValidCoordinates(lat1, lon1) || !hasValidCoordinates(lat2, lon2)) {
        return Infinity;
    }

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

    // Check if this category allows distance-only matching (no text similarity required)
    const isDistanceOnlyCategory = DISTANCE_ONLY_CATEGORIES.some(cat =>
        normalizedNewCategory.includes(cat)
    );

    // Get category-specific distance threshold, or use default
    const MAX_DISTANCE = CATEGORY_DISTANCE_THRESHOLDS[normalizedNewCategory]
        || CATEGORY_DISTANCE_THRESHOLDS['default'];

    // Check if coordinates are valid for this report
    const hasValidCoords = hasValidCoordinates(newReport.latitude, newReport.longitude);

    if (debug) {
        console.log('\n========== DUPLICATE DETECTION START ==========');
        console.log(`[NEW REPORT] Category: "${normalizedNewCategory}" | Distance-only mode: ${isDistanceOnlyCategory}`);
        console.log(`[NEW REPORT] Distance threshold: ${MAX_DISTANCE}m`);
        console.log(`[NEW REPORT] Valid coordinates: ${hasValidCoords}`);
        console.log(`[NEW REPORT] Coordinates: (${newReport.latitude}, ${newReport.longitude})`);
        if (newReport.address) console.log(`[NEW REPORT] Address: "${newReport.address}"`);
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

            // Check geo-distance (or address fallback if coordinates invalid)
            const distance = calculateGeoDistance(
                newReport.latitude,
                newReport.longitude,
                existing.latitude,
                existing.longitude
            );

            // If distance is Infinity (invalid coordinates), try address-based matching
            const addressMatch = !hasValidCoords && newReport.address && existing.address
                ? newReport.address.trim().toLowerCase() === existing.address.trim().toLowerCase()
                : false;

            if (debug) {
                console.log(`[CANDIDATE ${existing.id}] user_id=${(existing as any).user_id || 'unknown'} | distance=${distance === Infinity ? 'N/A (invalid coords)' : distance.toFixed(2) + 'm'} (threshold: ${MAX_DISTANCE}m)`);
                if (addressMatch) console.log(`  📍 Address match: "${newReport.address}"`);
            }

            // Distance check (or address match as fallback)
            if (distance > MAX_DISTANCE && !addressMatch) {
                if (debug) {
                    const reason = distance === Infinity
                        ? 'Invalid coordinates and no address match'
                        : `Distance too far (${distance.toFixed(2)}m > ${MAX_DISTANCE}m)`;
                    console.log(`  ❌ ${reason}`);
                }
                return false;
            }

            // For distance-only categories: Distance (or address) alone is enough!
            if (isDistanceOnlyCategory) {
                if (debug) {
                    const matchReason = addressMatch
                        ? 'address match'
                        : `distance ${distance.toFixed(2)}m <= ${MAX_DISTANCE}m`;
                    console.log(`  ✅ MATCH - Distance-only category, ${matchReason}`);
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
