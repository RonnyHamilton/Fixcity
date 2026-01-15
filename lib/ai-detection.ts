export type FixCityCategory =
    | "pothole"
    | "street_light"
    | "sanitation"
    | "graffiti"
    | "street_dogs"
    | "e_waste"
    | "other";

const CATEGORY_LABELS: Record<Exclude<FixCityCategory, "other">, string[]> = {
    street_dogs: [
        "stray dogs on the street",
        "street dogs",
        "group of dogs on road",
        "dogs roaming in public place",
        "many dogs in street",
        "stray animals on road",
    ],
    sanitation: [
        "garbage on street",
        "trash pile on road",
        "waste dump",
        "garbage bags on street",
        "litter on road",
    ],
    pothole: ["pothole on road", "damaged road pothole", "road crack pothole"],
    street_light: [
        "broken street light",
        "street light not working",
        "damaged lamp post",
    ],
    graffiti: ["graffiti on wall", "spray paint graffiti", "vandalism on wall"],
    e_waste: [
        "electronic waste dump",
        "discarded electronics",
        "old computer parts trash",
    ],
};

// Helper for normalization
const normalize = (s: string) => s.toLowerCase().trim().replace(/\s+/g, " ");

// Create fast lookup map: normalizedLabel -> category
const LABEL_TO_CATEGORY = new Map<string, FixCityCategory>();
for (const [category, catLabels] of Object.entries(CATEGORY_LABELS)) {
    for (const l of catLabels) {
        LABEL_TO_CATEGORY.set(normalize(l), category as FixCityCategory);
    }
}

export function getAllCLIPLabels() {
    return Object.values(CATEGORY_LABELS).flat();
}

/**
 * Get category for a single label using robust normalized matching
 */
export function getLabelCategory(label: string): FixCityCategory | null {
    return LABEL_TO_CATEGORY.get(normalize(label)) || null;
}

/**
 * Calculate voting scores (sums)
 */
export function calculateCategoryScores(labels: string[], scores: number[]) {
    const categoryScores: Record<FixCityCategory, number> = {
        pothole: 0,
        street_light: 0,
        sanitation: 0,
        graffiti: 0,
        street_dogs: 0,
        e_waste: 0,
        other: 0,
    };

    for (let i = 0; i < labels.length; i++) {
        const label = labels[i];
        const score = scores[i] ?? 0;

        const normalizedLabel = normalize(label);
        const matchedCategory = LABEL_TO_CATEGORY.get(normalizedLabel);

        if (matchedCategory) {
            categoryScores[matchedCategory] += score;
        }
    }

    return categoryScores;
}

/**
 * Get the voting winner
 */
export function getBestCategory(categoryScores: Record<FixCityCategory, number>) {
    // ✅ ignore "other" in voting
    const entries = Object.entries(categoryScores).filter(
        ([cat]) => cat !== "other"
    ) as Array<[FixCityCategory, number]>;

    entries.sort((a, b) => b[1] - a[1]);

    const best = entries[0];
    // Score here is the SUM, which might be > 1.0
    return { category: best?.[0] || "other", score: best?.[1] || 0 };
}

/**
 * NEW: Calculate true confidence (max single label score for the category)
 */
export function getCategoryConfidence(category: FixCityCategory, labels: string[], scores: number[]): number {
    if (category === 'other') return 0;

    let maxScore = 0;

    for (let i = 0; i < labels.length; i++) {
        const label = labels[i];
        const score = scores[i] ?? 0;

        const matchedCategory = getLabelCategory(label);
        if (matchedCategory === category) {
            if (score > maxScore) {
                maxScore = score;
            }
        }
    }

    return maxScore;
}

export function generateDescription(category: FixCityCategory, caption?: string): string {
    const templates: Record<FixCityCategory, string> = {
        sanitation: "Garbage/waste is visible at this location. Cleaning is required to maintain hygiene.",
        pothole: "A pothole/road damage is visible and may cause inconvenience or accidents.",
        street_light: "The street light appears damaged or not functioning and needs repair.",
        graffiti: "Graffiti/vandalism is visible on public property and needs cleaning or repainting.",
        street_dogs: "Street dogs are present in the area and may cause disturbance or safety concerns.",
        e_waste: "Electronic waste appears to be dumped in the open and needs proper disposal.",
        other: "Issue detected but could not be categorized reliably. Please describe the issue."
    };

    let description = templates[category];

    // Optionally append caption context
    if (caption && category !== 'other') {
        description += `\n\nDetected from image: ${caption}`;
    }

    return description;
}

export function getConfidenceThreshold() {
    return 0.25;
}

export function getConfidenceColor(confidence: number): 'green' | 'yellow' | 'red' {
    if (confidence >= 0.50) return 'green';
    if (confidence >= 0.25) return 'yellow';
    return 'red';
}
