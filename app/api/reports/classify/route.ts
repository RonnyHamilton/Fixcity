import { NextRequest, NextResponse } from 'next/server';
import { HfInference } from '@huggingface/inference';

const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

// Categories for civic issues with keyword mappings
const CIVIC_CATEGORIES = [
    {
        id: 'pothole',
        keywords: ['pothole', 'hole', 'crack', 'road', 'asphalt', 'pavement', 'street', 'damaged', 'broken road'],
        description: 'Road damage detected. This appears to be a pothole or road surface issue that may pose a hazard to vehicles and pedestrians.'
    },
    {
        id: 'garbage',
        keywords: ['garbage', 'trash', 'litter', 'waste', 'rubbish', 'dump', 'debris', 'bag', 'plastic', 'bottle', 'pile'],
        description: 'Garbage or litter accumulation detected. This area requires sanitation attention and cleanup.'
    },
    {
        id: 'e-waste',
        keywords: ['electronic', 'computer', 'monitor', 'television', 'tv', 'appliance', 'keyboard', 'printer', 'device', 'screen'],
        description: 'Electronic waste detected. Proper e-waste disposal is required to prevent environmental contamination.'
    },
    {
        id: 'streetlight',
        keywords: ['lamp', 'light', 'street light', 'pole', 'lantern', 'lighting', 'bulb', 'fixture'],
        description: 'Street lighting issue detected. This may affect visibility and public safety during night hours.'
    },
    {
        id: 'graffiti',
        keywords: ['graffiti', 'vandalism', 'paint', 'spray', 'wall', 'writing', 'tag', 'mural', 'drawing', 'art'],
        description: 'Graffiti or vandalism detected. Surface cleaning or repainting may be required.'
    },
    {
        id: 'street_dogs',
        keywords: ['dog', 'dogs', 'stray', 'canine', 'animal', 'pet', 'puppy', 'pack'],
        description: 'Street dogs detected. Animal control may be needed to ensure public safety and animal welfare.'
    },
    {
        id: 'broken_sidewalk',
        keywords: ['sidewalk', 'pavement', 'walkway', 'tile', 'concrete', 'footpath', 'path'],
        description: 'Sidewalk damage detected. This may pose a tripping hazard for pedestrians.'
    },
    {
        id: 'fallen_tree',
        keywords: ['tree', 'branch', 'wood', 'log', 'fallen', 'vegetation', 'trunk'],
        description: 'Fallen tree or branches detected. This may be blocking pathways or posing a safety risk.'
    },
    {
        id: 'water_leak',
        keywords: ['water', 'pipe', 'flood', 'puddle', 'leak', 'wet', 'flowing'],
        description: 'Water leak or flooding detected. This may indicate pipe damage or drainage issues.'
    },
    {
        id: 'sewage',
        keywords: ['sewage', 'drain', 'manhole', 'sewer', 'drainage', 'gutter'],
        description: 'Drainage or sewage issue detected. This may require immediate attention to prevent health hazards.'
    },
];

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const imageFile = formData.get('image') as File;

        if (!imageFile) {
            return NextResponse.json(
                { error: 'No image provided' },
                { status: 400 }
            );
        }

        // Convert file to array buffer
        const arrayBuffer = await imageFile.arrayBuffer();
        const imageBlob = new Blob([arrayBuffer]);

        let category = 'other';
        let confidence = 0;
        let detectedCaption = '';
        let rawLabels: { label: string; score: number }[] = [];

        // Try to classify with Hugging Face using Image Captioning
        if (process.env.HUGGINGFACE_API_KEY) {
            try {
                // Use BLIP for image captioning - generates a description of what's in the image
                const captionResult = await hf.imageToText({
                    model: 'Salesforce/blip-image-captioning-large',
                    data: imageBlob,
                });

                detectedCaption = captionResult.generated_text?.toLowerCase() || '';
                console.log('🔍 Image caption:', detectedCaption);

                // Match caption keywords to categories
                const categoryScores: { [key: string]: number } = {};

                for (const cat of CIVIC_CATEGORIES) {
                    let score = 0;
                    let matchedKeywords = 0;
                    for (const keyword of cat.keywords) {
                        if (detectedCaption.includes(keyword.toLowerCase())) {
                            // Weight longer keywords more heavily (more specific)
                            score += keyword.split(' ').length;
                            matchedKeywords++;
                        }
                    }
                    // Only count category if it has at least one keyword match
                    if (score > 0) {
                        categoryScores[cat.id] = score;
                    }
                }

                // Find the category with the highest score
                const sortedCategories = Object.entries(categoryScores)
                    .sort(([, a], [, b]) => b - a);

                // STRICT CONFIDENCE THRESHOLDS
                const MIN_KEYWORD_SCORE = 2; // At least 2 keyword points (or one 2-word keyword)
                const MIN_CONFIDENCE_RATIO = 0.35; // Must be at least 35% of total matches

                if (sortedCategories.length > 0) {
                    const [bestCategoryId, score] = sortedCategories[0];
                    const totalScore = Object.values(categoryScores).reduce((a, b) => a + b, 0);
                    const calculatedConfidence = totalScore > 0 ? score / totalScore : 0;

                    // Only assign category if confidence thresholds are met
                    if (score >= MIN_KEYWORD_SCORE && calculatedConfidence >= MIN_CONFIDENCE_RATIO) {
                        category = bestCategoryId;
                        confidence = calculatedConfidence;

                        console.log(`✅ Classification: ${category} (${(confidence * 100).toFixed(1)}%)`);
                        console.log('📊 Keyword matches:', categoryScores);
                    } else {
                        // Low confidence - classify as "other"
                        category = 'other';
                        confidence = 0;
                        console.log(`⚠️ Low confidence (score: ${score}, ratio: ${(calculatedConfidence * 100).toFixed(1)}%) - classifying as "other"`);
                        console.log('📊 Detected matches:', categoryScores);
                    }

                    // Build raw labels for display
                    rawLabels = sortedCategories.map(([id, score]) => ({
                        label: id,
                        score: totalScore > 0 ? score / totalScore : 0,
                    }));
                } else {
                    // No keyword matches at all
                    console.log('⚠️ No keyword matches found - classifying as "other"');
                }

            } catch (hfError) {
                console.error('❌ Hugging Face API error:', hfError);
                category = 'other';
                confidence = 0;
            }
        }

        // Remove mock classification - if uncertain, keep as "other"
        if (category === 'other' && confidence === 0) {
            console.log('ℹ️ Unable to classify with confidence - marked as "other"');
        }

        const categoryData = CIVIC_CATEGORIES.find(c => c.id === category);
        const description = categoryData?.description || 'Issue detected but unable to automatically categorize. Please provide additional details.';

        return NextResponse.json({
            success: true,
            category,
            confidence,
            description,
            caption: detectedCaption,
            rawLabels,
        });
    } catch (error) {
        console.error('❌ Classification error:', error);
        return NextResponse.json(
            {
                error: 'Classification failed',
                category: 'other',
                description: 'Issue detected but unable to automatically categorize. Please provide additional details.',
            },
            { status: 500 }
        );
    }
}
