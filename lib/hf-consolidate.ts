import { HfInference } from '@huggingface/inference';

const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

export interface ReportDescription {
    id: string;
    description: string;
    user_name: string;
    created_at: string;
}

/**
 * Consolidate multiple report descriptions into a single intelligent summary
 * using HuggingFace text generation
 */
export async function consolidateDescriptions(
    descriptions: ReportDescription[]
): Promise<string> {
    if (descriptions.length === 0) {
        return 'No descriptions to consolidate.';
    }

    if (descriptions.length === 1) {
        return descriptions[0].description;
    }

    // Build a simple prompt for summarization
    const combined = descriptions
        .map((d, i) => `Report ${i + 1} (by ${d.user_name}): ${d.description}`)
        .join('\n');

    const prompt = `Summarize the following civic issue reports into a single concise description that captures all key details:\n\n${combined}\n\nConsolidated summary:`;

    try {
        const result = await hf.textGeneration({
            model: 'mistralai/Mistral-7B-Instruct-v0.2',
            inputs: prompt,
            parameters: {
                max_new_tokens: 200,
                temperature: 0.3,
                return_full_text: false,
            },
        });

        const generated = result.generated_text?.trim();
        if (generated && generated.length > 10) {
            return generated;
        }

        // Fallback: simple concatenation
        return descriptions.map(d => d.description).join(' | ');
    } catch (error) {
        console.error('HuggingFace consolidation error:', error);
        // Graceful fallback: join descriptions
        return descriptions.map(d => d.description).join(' | ');
    }
}
