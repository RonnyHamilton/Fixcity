/**
 * Teachable Machine Image Classification Utility
 * 
 * Uses Google's Teachable Machine model to auto-detect issue categories
 * from uploaded images.
 * 
 * Model URL: https://teachablemachine.withgoogle.com/models/s6huJIfAP/
 */

import * as tmImage from '@teachablemachine/image';

// Model URL
const MODEL_URL = 'https://teachablemachine.withgoogle.com/models/s6huJIfAP/';

// Singleton model instance
let model: tmImage.CustomMobileNet | null = null;
let isLoading = false;

// Map Teachable Machine labels to FixCity categories
const TM_TO_FIXCITY: Record<string, string> = {
    'GARBAGE': 'sanitation',
    'POTHOLES': 'pothole',
    'water pipes': 'water_pipes',
    'street lights': 'streetlight',
    'dogs': 'street_dogs',
};

export interface ClassificationResult {
    category: string;
    confidence: number;
    rawLabel: string;
    allPredictions: Array<{ label: string; probability: number }>;
}

/**
 * Load the Teachable Machine model (lazy-loaded singleton)
 */
export async function loadModel(): Promise<tmImage.CustomMobileNet | null> {
    if (model) return model;
    if (isLoading) {
        // Wait for existing load to complete
        while (isLoading) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        return model;
    }

    isLoading = true;
    try {
        const modelURL = MODEL_URL + 'model.json';
        const metadataURL = MODEL_URL + 'metadata.json';

        model = await tmImage.load(modelURL, metadataURL);
        console.log('[TM] Model loaded successfully');
        return model;
    } catch (error) {
        console.error('[TM] Failed to load model:', error);
        return null;
    } finally {
        isLoading = false;
    }
}

/**
 * Classify an image and return the best matching FixCity category
 * 
 * @param imageElement - HTML Image element or Canvas element
 * @returns Classification result with category and confidence, or null if failed
 */
export async function classifyImage(
    imageElement: HTMLImageElement | HTMLCanvasElement
): Promise<ClassificationResult | null> {
    try {
        const loadedModel = await loadModel();
        if (!loadedModel) {
            console.log('[TM] Model not available');
            return null;
        }

        // Get predictions
        const predictions = await loadedModel.predict(imageElement);

        // Sort by probability
        const sorted = [...predictions].sort((a, b) => b.probability - a.probability);

        // Get the best prediction
        const best = sorted[0];
        if (!best) return null;

        // Map to FixCity category
        const fixCityCategory = TM_TO_FIXCITY[best.className] || 'other';

        console.log('[TM] Classification result:', {
            label: best.className,
            category: fixCityCategory,
            confidence: (best.probability * 100).toFixed(1) + '%'
        });

        return {
            category: fixCityCategory,
            confidence: best.probability,
            rawLabel: best.className,
            allPredictions: sorted.map(p => ({
                label: p.className,
                probability: p.probability
            }))
        };
    } catch (error) {
        console.error('[TM] Classification failed:', error);
        return null;
    }
}

/**
 * Classify from a base64 data URL
 * 
 * @param dataUrl - Base64 image data URL
 * @returns Classification result or null
 */
export async function classifyFromDataUrl(dataUrl: string): Promise<ClassificationResult | null> {
    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';

        img.onload = async () => {
            const result = await classifyImage(img);
            resolve(result);
        };

        img.onerror = () => {
            console.error('[TM] Failed to load image from data URL');
            resolve(null);
        };

        img.src = dataUrl;
    });
}

/**
 * Get confidence color based on threshold
 */
export function getConfidenceColor(confidence: number): 'green' | 'yellow' | 'red' {
    if (confidence >= 0.7) return 'green';
    if (confidence >= 0.4) return 'yellow';
    return 'red';
}

/**
 * Check if confidence is high enough for auto-selection
 */
export function shouldAutoSelect(confidence: number): boolean {
    return confidence >= 0.5; // 50% threshold
}
