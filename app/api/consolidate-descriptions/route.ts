import { NextRequest, NextResponse } from 'next/server';
import { consolidateDescriptions, type ReportDescription } from '@/lib/gemini-consolidate';

export async function POST(request: NextRequest) {
    try {
        const { descriptions } = await request.json();

        if (!descriptions || !Array.isArray(descriptions)) {
            return NextResponse.json(
                { error: 'Invalid request: descriptions array required' },
                { status: 400 }
            );
        }

        const consolidatedText = await consolidateDescriptions(descriptions);

        return NextResponse.json({
            success: true,
            consolidated: consolidatedText,
        });
    } catch (error) {
        console.error('Consolidation error:', error);
        return NextResponse.json(
            { error: 'Failed to consolidate descriptions' },
            { status: 500 }
        );
    }
}
