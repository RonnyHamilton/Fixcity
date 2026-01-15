import { HfInference } from '@huggingface/inference';

const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

// Categories for civic issues
const CIVIC_CATEGORIES = [
    'pothole',
    'garbage',
    'e-waste',
    'streetlight',
    'graffiti',
    'broken_sidewalk',
    'fallen_tree',
    'water_leak',
    'sewage',
    'other'
] as const;

export type CivicCategory = typeof CIVIC_CATEGORIES[number];

// Category mappings from image classification labels
const CATEGORY_MAPPINGS: Record<string, CivicCategory> = {
    // Pothole related
    'pothole': 'pothole',
    'hole': 'pothole',
    'road damage': 'pothole',
    'asphalt': 'pothole',
    'crack': 'pothole',

    // Garbage related
    'garbage': 'garbage',
    'trash': 'garbage',
    'litter': 'garbage',
    'waste': 'garbage',
    'rubbish': 'garbage',
    'dump': 'garbage',
    'debris': 'garbage',

    // E-waste related
    'electronic': 'e-waste',
    'computer': 'e-waste',
    'monitor': 'e-waste',
    'television': 'e-waste',
    'appliance': 'e-waste',

    // Streetlight related
    'lamp': 'streetlight',
    'light': 'streetlight',
    'street light': 'streetlight',
    'pole': 'streetlight',

    // Graffiti related
    'graffiti': 'graffiti',
    'vandalism': 'graffiti',
    'paint': 'graffiti',
    'spray': 'graffiti',

    // Sidewalk related
    'sidewalk': 'broken_sidewalk',
    'pavement': 'broken_sidewalk',
    'walkway': 'broken_sidewalk',

    // Tree related
    'tree': 'fallen_tree',
    'branch': 'fallen_tree',
    'wood': 'fallen_tree',

    // Water related
    'water': 'water_leak',
    'pipe': 'water_leak',
    'flood': 'water_leak',
    'puddle': 'water_leak',

    // Sewage related
    'sewage': 'sewage',
    'drain': 'sewage',
    'manhole': 'sewage',
};

interface ClassificationResult {
    category: CivicCategory;
    confidence: number;
    rawLabels: Array<{ label: string; score: number }>;
    description: string;
}

/**
 * Classify an image using Hugging Face's image classification model
 */
export async function classifyImage(imageData: Blob | ArrayBuffer): Promise<ClassificationResult> {
    try {
        // Use a general image classification model
        const result = await hf.imageClassification({
            model: 'google/vit-base-patch16-224',
            data: imageData,
        });

        // Find the best matching civic category
        let bestCategory: CivicCategory = 'other';
        let bestScore = 0;

        for (const prediction of result) {
            const labelLower = prediction.label.toLowerCase();

            for (const [keyword, category] of Object.entries(CATEGORY_MAPPINGS)) {
                if (labelLower.includes(keyword) && prediction.score > bestScore) {
                    bestCategory = category;
                    bestScore = prediction.score;
                }
            }
        }

        // Generate a description based on the category
        const description = generateDescription(bestCategory, result);

        return {
            category: bestCategory,
            confidence: bestScore || 0.5,
            rawLabels: result.slice(0, 5).map(r => ({ label: r.label, score: r.score })),
            description,
        };
    } catch (error) {
        console.error('Image classification error:', error);

        // Return a default result if classification fails
        return {
            category: 'other',
            confidence: 0,
            rawLabels: [],
            description: 'Unable to automatically classify the image. Please select a category manually.',
        };
    }
}

/**
 * Generate a description based on the detected category
 */
function generateDescription(category: CivicCategory, labels: Array<{ label: string; score: number }>): string {
    const descriptions: Record<CivicCategory, string> = {
        pothole: 'Road damage detected. This appears to be a pothole or road surface issue that may pose a hazard to vehicles and pedestrians.',
        garbage: 'Garbage or litter accumulation detected. This area requires sanitation attention and cleanup.',
        'e-waste': 'Electronic waste detected. Proper e-waste disposal is required to prevent environmental contamination.',
        streetlight: 'Street lighting issue detected. This may affect visibility and public safety during night hours.',
        graffiti: 'Graffiti or vandalism detected. Surface cleaning or repainting may be required.',
        broken_sidewalk: 'Sidewalk damage detected. This may pose a tripping hazard for pedestrians.',
        fallen_tree: 'Fallen tree or branches detected. This may be blocking pathways or posing a safety risk.',
        water_leak: 'Water leak or flooding detected. This may indicate pipe damage or drainage issues.',
        sewage: 'Drainage or sewage issue detected. This may require immediate attention to prevent health hazards.',
        other: 'Issue detected but unable to automatically categorize. Please provide additional details.',
    };

    return descriptions[category];
}

/**
 * Validate if the image is suitable for classification
 */
export function validateImageForClassification(file: File): { valid: boolean; error?: string } {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!allowedTypes.includes(file.type)) {
        return { valid: false, error: 'Please upload a JPEG, PNG, WebP, or GIF image.' };
    }

    if (file.size > maxSize) {
        return { valid: false, error: 'Image size must be less than 10MB.' };
    }

    return { valid: true };
}

export { CIVIC_CATEGORIES };

/**
 * Compare two faces using image feature extraction and cosine similarity
 */
export async function compareFaces(image1: Blob | ArrayBuffer, image2: Blob | ArrayBuffer): Promise<{ match: boolean; score: number; error?: string }> {
    try {
        // ... (existing code)
        // Use OpenAI CLIP model which has wider inference API support
        const model = 'openai/clip-vit-base-patch32';

        // Cast to any to bypass strict type check for now (library supports Blob/Buffer at runtime)
        const [emb1, emb2] = await Promise.all([
            hf.featureExtraction({
                model: model,
                inputs: image1 as any,
            }),
            hf.featureExtraction({
                model: model,
                inputs: image2 as any,
            })
        ]);

        // Cast to number arrays (handle nested arrays if returned)
        // Feature extraction might return [num] or [[num]] depending on the model/batch size
        const vec1 = Array.isArray(emb1) && Array.isArray(emb1[0]) ? (emb1[0] as number[]) : (emb1 as unknown as number[]);
        const vec2 = Array.isArray(emb2) && Array.isArray(emb2[0]) ? (emb2[0] as number[]) : (emb2 as unknown as number[]);

        // Calculate Cosine Similarity
        const similarity = cosineSimilarity(vec1, vec2);

        // Define threshold (adjustable based on testing)
        // ViT features aren't optimized for face ID, so precision might vary.
        // A high threshold is safer.
        const threshold = 0.85;

        return {
            match: similarity >= threshold,
            score: similarity
        };

    } catch (error: any) {
        console.error('Face comparison error:', error);
        return {
            match: false,
            score: 0,
            error: error.message || 'Unknown error during face comparison'
        };
    }
}

function cosineSimilarity(vec1: number[], vec2: number[]): number {
    const dotProduct = vec1.reduce((sum, val, i) => sum + val * vec2[i], 0);
    const mag1 = Math.sqrt(vec1.reduce((sum, val) => sum + val * val, 0));
    const mag2 = Math.sqrt(vec2.reduce((sum, val) => sum + val * val, 0));

    if (mag1 === 0 || mag2 === 0) return 0;

    return dotProduct / (mag1 * mag2);
}
