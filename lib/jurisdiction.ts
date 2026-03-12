import { SupabaseClient } from '@supabase/supabase-js';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface JurisdictionResult {
    ward_id: string;
    ward_name: string;
    taluk_id: string;
    taluk_name: string;
}

// ─── GPS → Ward / Taluk ───────────────────────────────────────────────────────

/**
 * Given a GPS coordinate, returns the matching ward and taluk.
 * Uses point-in-bounding-box lookup (sufficient for demo; upgrade to
 * PostGIS ST_Contains for production polygon precision).
 *
 * Returns null if no ward covers the given location.
 */
export async function getJurisdiction(
    lat: number,
    lng: number,
    supabase: SupabaseClient
): Promise<JurisdictionResult | null> {
    const { data, error } = await supabase
        .from('wards')
        .select('id, name, taluk_id, taluks(name)')
        .lte('min_lat', lat)
        .gte('max_lat', lat)
        .lte('min_lng', lng)
        .gte('max_lng', lng)
        .limit(1)
        .single();

    if (error || !data) return null;

    const taluk = Array.isArray(data.taluks) ? data.taluks[0] : data.taluks;

    return {
        ward_id:    data.id,
        ward_name:  data.name,
        taluk_id:   data.taluk_id,
        taluk_name: taluk?.name ?? 'Unknown Taluk',
    };
}

// ─── Category → Department ────────────────────────────────────────────────────

/**
 * Maps an issue category slug to a department name string.
 * The department name is then used to look up the department_id via DB.
 */
const CATEGORY_DEPARTMENT_MAP: Record<string, string> = {
    pothole:      'Roads',
    road:         'Roads',
    road_damage:  'Roads',
    garbage:      'Sanitation',
    waste:        'Sanitation',
    sanitation:   'Sanitation',
    streetlight:  'Electrical',
    electrical:   'Electrical',
    light:        'Electrical',
    water:        'Water Supply',
    water_pipes:  'Water Supply',
    water_leak:   'Water Supply',
    drainage:     'Drainage',
    drain:        'Drainage',
    flood:        'Drainage',
};

export function getDepartmentName(category: string): string {
    if (!category) return 'General';
    const key = category.toLowerCase().replace(/[\s-]+/g, '_');
    return CATEGORY_DEPARTMENT_MAP[key] ?? 'General';
}

/**
 * Resolves the department_id UUID from the departments table for a given category.
 * Returns null if no matching department found.
 */
export async function getDepartmentId(
    category: string,
    supabase: SupabaseClient
): Promise<string | null> {
    const deptName = getDepartmentName(category);

    const { data, error } = await supabase
        .from('departments')
        .select('id')
        .eq('name', deptName)
        .single();

    if (error || !data) return null;
    return data.id;
}
