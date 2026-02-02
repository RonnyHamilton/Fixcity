import { NextRequest, NextResponse } from 'next/server';
import { HfInference } from '@huggingface/inference';

const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

// Category keyword mappings for FixCity
const CATEGORY_KEYWORDS = {
    pothole: ['pothole', 'hole', 'crack', 'damaged road', 'road damage', 'asphalt', 'pavement damage', 'broken road'],
    sanitation: ['garbage', 'trash', 'waste', 'dump', 'litter', 'rubbish', 'debris', 'bag', 'plastic', 'bottle', 'pile'],
    street_dogs: ['dog', 'dogs', 'stray', 'canine', 'animal', 'pet', 'puppy', 'pack'],
    e_waste: ['electronic', 'computer', 'monitor', 'television', 'tv', 'appliance', 'keyboard', 'printer', 'device', 'screen', 'e-waste'],
    streetlight: ['lamp', 'light', 'street light', 'pole', 'lantern', 'lighting', 'bulb', 'fixture', 'light pole'],
    graffiti: ['graffiti', 'vandalism', 'paint', 'spray', 'wall', 'writing', 'tag', 'mural', 'drawing', 'art'],
    broken_sidewalk: ['sidewalk', 'pavement', 'walkway', 'tile', 'concrete', 'footpath', 'path'],
    fallen_tree: ['tree', 'branch', 'wood', 'log', 'fallen', 'vegetation', 'trunk'],
    water_leak: ['water', 'pipe', 'flood', 'puddle', 'leak', 'wet', 'flowing'],
    sewage: ['sewage', 'drain', 'manhole', 'sewer', 'drainage', 'gutter'],
} as const;

// User-friendly descriptions for each category
const CATEGORY_DESCRIPTIONS = {
    pothole: 'Road damage has been detected. This appears to be a pothole or road surface issue that may pose a hazard to vehicles and pedestrians.',
    sanitation: 'Garbage or litter accumulation has been detected. This area requires sanitation attention and cleanup.',
    street_dogs: 'Stray animals have been detected in this area. Animal control may be needed to ensure public safety and animal welfare.',
    e_waste: 'Electronic waste has been detected. Proper e-waste disposal is required to prevent environmental contamination.',
    streetlight: 'A street lighting issue has been detected. This may affect visibility and public safety during night hours.',
    graffiti: 'Graffiti or vandalism has been detected. Surface cleaning or repainting may be required.',
    broken_sidewalk: 'Sidewalk damage has been detected. This may pose a tripping hazard for pedestrians.',
    fallen_tree: 'Fallen tree or branches have been detected. This may be blocking pathways or posing a safety risk.',
    water_leak: 'A water leak or flooding has been detected. This may indicate pipe damage or drainage issues.',
    sewage: 'A drainage or sewage issue has been detected. This may require immediate attention to prevent health hazards.',
    other: 'Issue detected but unable to automatically categorize. Please provide additional details.',
} as const;

type CategoryId = keyof typeof CATEGORY_KEYWORDS | 'other';

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const imageFile = formData.get('image') as File;
        const userDescription = formData.get('user_description') as string | null;

        if (!imageFile) {
            return NextResponse.json(
                { error: 'No image provided' },
                { status: 400 }
            );
        }

        // Convert file to blob
        const arrayBuffer = await imageFile.arrayBuffer();
        const imageBlob = new Blob([arrayBuffer]);

        let category: CategoryId = 'other';
        let confidence = 0;
        let detectedCaption = '';
        let rawLabels: string[] = [];
        let generatedDescription = '';

        // Check if Hugging Face API key is available
        if (!process.env.HUGGINGFACE_API_KEY) {
            console.warn('⚠️ HUGGINGFACE_API_KEY not configured - AI detection disabled');
            return NextResponse.json({
                success: true,
                category: 'other',
                confidence: 0,
                caption: '',
                description: 'AI suggestions unavailable — please continue manually',
                rawLabels: [],
            });
        }

        try {
            // STEP 1: Image Captioning (Primary Signal) using BLIP
            console.log('🔍 Step 1: Generating image caption with BLIP...');
            const captionResult = await hf.imageToText({
                model: 'Salesforce/blip-image-captioning-large',
                data: imageBlob,
            });
            detectedCaption = captionResult.generated_text?.toLowerCase() || '';
            console.log('📝 Caption:', detectedCaption);

            // STEP 2: Image Classification (Secondary Signal) using ResNet-50
            console.log('🏷️ Step 2: Extracting labels with ResNet-50...');
            try {
                const classificationResult = await hf.imageClassification({
                    model: 'microsoft/resnet-50',
                    data: imageBlob,
                });

                // Extract top labels (confidence > 0.1)
                rawLabels = classificationResult
                    .filter(r => r.score > 0.1)
                    .slice(0, 5)
                    .map(r => r.label.toLowerCase());
                console.log('🏷️ Labels:', rawLabels);
            } catch (classifyError) {
                console.warn('⚠️ ResNet classification failed, continuing with caption only:', classifyError);
                // Continue with caption-based detection only
            }

            // STEP 3: Category Detection (Caption + Labels)
            console.log('🎯 Step 3: Mapping to FixCity categories...');
            const categoryScores: Record<string, number> = {};

            // Score based on caption keywords
            for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
                let score = 0;
                for (const keyword of keywords) {
                    if (detectedCaption.includes(keyword.toLowerCase())) {
                        // Weight longer keywords more (more specific)
                        score += keyword.split(' ').length * 2;
                    }
                }
                if (score > 0) {
                    categoryScores[cat] = score;
                }
            }

            // Boost score if labels also match
            for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
                for (const label of rawLabels) {
                    for (const keyword of keywords) {
                        if (label.includes(keyword.toLowerCase()) || keyword.toLowerCase().includes(label)) {
                            categoryScores[cat] = (categoryScores[cat] || 0) + 1;
                        }
                    }
                }
            }

            // Find best category
            const sortedCategories = Object.entries(categoryScores)
                .sort(([, a], [, b]) => b - a);

            // Confidence thresholds
            const MIN_KEYWORD_SCORE = 2;
            const MIN_CONFIDENCE_RATIO = 0.35;

            if (sortedCategories.length > 0) {
                const [bestCategoryId, score] = sortedCategories[0];
                const totalScore = Object.values(categoryScores).reduce((a, b) => a + b, 0);
                const calculatedConfidence = totalScore > 0 ? score / totalScore : 0;

                if (score >= MIN_KEYWORD_SCORE && calculatedConfidence >= MIN_CONFIDENCE_RATIO) {
                    category = bestCategoryId as CategoryId;
                    confidence = Math.min(calculatedConfidence, 0.95); // Cap at 95%
                    console.log(`✅ Detected: ${category} (${(confidence * 100).toFixed(1)}%)`);
                } else {
                    category = 'other';
                    confidence = 0;
                    console.log(`⚠️ Low confidence - classified as "other"`);
                }
            } else {
                console.log('⚠️ No keyword matches - classified as "other"');
            }

            // STEP 4: Generate Description using BART (optional)
            console.log('📄 Step 4: Generating description...');
            try {
                // Create input for summarization
                const summaryInput = [
                    `Image shows: ${detectedCaption}`,
                    userDescription ? `User notes: ${userDescription}` : '',
                    category !== 'other' ? `Detected issue type: ${category.replace(/_/g, ' ')}` : '',
                ].filter(Boolean).join('. ');

                if (summaryInput.length > 20) {
                    const summaryResult = await hf.summarization({
                        model: 'facebook/bart-large-cnn',
                        inputs: summaryInput,
                        parameters: {
                            max_length: 100,
                            min_length: 30,
                        }
                    });

                    generatedDescription = summaryResult.summary_text || '';
                    console.log('📋 Generated description:', generatedDescription);
                }
            } catch (summaryError) {
                console.warn('⚠️ BART summarization failed, using fallback:', summaryError);
                // Fallback: use category description + caption
            }

            // Use generated description or fallback to category description
            const finalDescription = generatedDescription ||
                (category !== 'other'
                    ? `${CATEGORY_DESCRIPTIONS[category]} The image shows: ${detectedCaption}.`
                    : CATEGORY_DESCRIPTIONS.other);

            return NextResponse.json({
                success: true,
                category,
                confidence: Math.round(confidence * 100) / 100, // Round to 2 decimals
                caption: detectedCaption,
                description: finalDescription,
                rawLabels,
            });

        } catch (aiError: any) {
            console.error('❌ AI pipeline error:', aiError);

            // Graceful fallback - never block submission
            return NextResponse.json({
                success: true,
                category: 'other',
                confidence: 0,
                caption: '',
                description: 'AI suggestions unavailable — please continue manually',
                rawLabels: [],
                error: 'AI processing failed',
            });
        }

    } catch (error) {
        console.error('❌ Classification endpoint error:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Classification failed',
                category: 'other',
                confidence: 0,
                description: 'AI suggestions unavailable — please continue manually',
            },
            { status: 500 }
        );
    }
}
