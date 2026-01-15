'use client';

import { useState, useEffect, useCallback } from 'react';
import Script from 'next/script';
import { FixCityCategory, generateDescription } from '@/lib/ai-detection';

export interface AIDetectionResult {
    category: FixCityCategory;
    confidence: number;
    description: string;
    detectedObjects: string[]; // For debugging/caption
}

// Mapping from Teachable Machine "Class X" to FixCity categories
const TM_CLASS_MAP: Record<string, FixCityCategory> = {
    "Class 1": "pothole",
    "Class 2": "street_light",
    "Class 3": "sanitation",
    "Class 4": "graffiti",
    "Class 5": "street_dogs",
    "Class 6": "e_waste"
};

export function useOfflineAIDetection() {
    const [isLoadingModel, setIsLoadingModel] = useState(true);
    const [modelLoaded, setModelLoaded] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [tmModel, setTmModel] = useState<any>(null); // Store model instance

    // Check if scripts are loaded
    const [tfLoaded, setTfLoaded] = useState(false);
    const [tmLoaded, setTmLoaded] = useState(false);

    // Initialize model when scripts are ready
    useEffect(() => {
        if (tfLoaded && tmLoaded && !tmModel) {
            loadModel();
        }
    }, [tfLoaded, tmLoaded, tmModel]);

    async function loadModel() {
        try {
            console.log('[Offline AI] Scripts loaded. Initializing Model...');

            // Access tmImage from window
            const tmImage = (window as any).tmImage;
            if (!tmImage) {
                throw new Error('Teachable Machine library not found on window');
            }

            const modelURL = '/model/model.json';
            const metadataURL = '/model/metadata.json';

            // Load the model
            const loadedModel = await tmImage.load(modelURL, metadataURL);

            console.log('[Offline AI] Model loaded successfully');
            console.log('[Offline AI] Total classes:', loadedModel.getTotalClasses());

            setTmModel(loadedModel);
            setModelLoaded(true);
            setIsLoadingModel(false);

        } catch (err) {
            console.error('[Offline AI] Failed to load model:', err);
            setError('Failed to load local AI model');
            setIsLoadingModel(false);
        }
    }

    const detectImage = useCallback(async (file: File): Promise<AIDetectionResult> => {
        if (!tmModel) {
            throw new Error('AI Model not loaded yet');
        }

        const img = document.createElement('img');
        const objectUrl = URL.createObjectURL(file);

        try {
            await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = reject;
                img.src = objectUrl;
            });

            console.log('[Offline AI] Running prediction...');
            const predictions = await tmModel.predict(img);
            console.log('[Offline AI] Predictions:', predictions);

            // predictions: [{ className, probability }, ...]
            // Sort by probability desc
            const sorted = predictions.sort((a: any, b: any) => b.probability - a.probability);
            const best = sorted[0];

            let category: FixCityCategory = 'other';
            let maxConfidence = 0;
            const debugClasses: string[] = [];

            if (best) {
                maxConfidence = best.probability;
                const rawLabel = best.className;

                const mappedCategory = TM_CLASS_MAP[rawLabel];

                if (mappedCategory) {
                    category = mappedCategory;
                } else {
                    // Check if raw label matches a category id directly
                    const validCategories: FixCityCategory[] = [
                        "pothole", "street_light", "sanitation", "graffiti", "street_dogs", "e_waste", "other"
                    ];
                    if (validCategories.includes(rawLabel as any)) {
                        category = rawLabel as FixCityCategory;
                    }
                }

                debugClasses.push(`${rawLabel} -> ${category} (${(maxConfidence * 100).toFixed(0)}%)`);
            }

            const description = generateDescription(category, `Detected ${best?.className}`);

            return {
                category,
                confidence: parseFloat(maxConfidence.toFixed(2)),
                description,
                detectedObjects: debugClasses
            };

        } finally {
            URL.revokeObjectURL(objectUrl);
        }
    }, [tmModel]);

    return {
        detectImage,
        isLoadingModel,
        error,
        modelLoaded,
        // Scripts components to be rendered by parent or here?
        // Hooks can't render. 
        // We export a component wrapper? Or just rely on head?
        // If we use 'next/script' inside a component that uses this hook, it works.
        // But this is a hook.
        // We will return the Scripts component to be rendered by the consumer page.
        AiScripts: (
            <>
                <Script
                    src="https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@latest/dist/tf.min.js"
                    onLoad={() => {
                        console.log('TFJS loaded');
                        setTfLoaded(true);
                    }}
                    strategy="afterInteractive"
                />
                <Script
                    src="https://cdn.jsdelivr.net/npm/@teachablemachine/image@latest/dist/teachablemachine-image.min.js"
                    onLoad={() => {
                        console.log('TMImage loaded');
                        setTmLoaded(true);
                    }}
                    strategy="afterInteractive"
                />
            </>
        )
    };
}
