import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export interface ReportDescription {
    id: string;
    description: string;
    user_name: string;
    created_at: string;
}

/**
 * Consolidate multiple report descriptions into a single intelligent summary
 * using Gemini AI
 */
export async function consolidateDescriptions(
    descriptions: ReportDescription[]
): Promise<string> {
    if (descriptions.length === 0) {
        return '';
    }

    if (descriptions.length === 1) {
        return descriptions[0].description;
    }

    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

        const prompt = `You are analyzing multiple citizen reports about the same civic issue. Your task is to create a consolidated, professional summary that captures all unique details and perspectives.

Here are ${descriptions.length} reports about the same issue:

${descriptions.map((report, index) => `
Report #${index + 1} (by ${report.user_name} on ${new Date(report.created_at).toLocaleDateString()}):
"${report.description}"
`).join('\n')}

Please create a consolidated description that:
1. Combines all unique observations and details
2. Highlights common themes and patterns
3. Captures the severity from multiple perspectives
4. Remains factual and professional
5. Is concise but comprehensive (2-4 sentences)

Do not include any preamble or meta-commentary. Just provide the consolidated description.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const consolidatedText = response.text().trim();

        return consolidatedText;
    } catch (error) {
        console.error('Gemini API error:', error);
        // Fallback: combine descriptions manually
        return descriptions
            .map((d, i) => `[Report ${i + 1} by ${d.user_name}] ${d.description}`)
            .join(' | ');
    }
}
