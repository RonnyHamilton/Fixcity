'use client';

import { useState } from 'react';
import { Loader2, Sparkles, RefreshCw } from 'lucide-react';
import { getConfidenceColor, type FixCityCategory } from '@/lib/ai-detection';

interface AIDetectionResult {
    category: FixCityCategory;
    confidence: number;
    caption: string;
    description: string;
}

interface AIAutoDetectProps {
    imageFile: File | null;
    onDetectionComplete: (result: AIDetectionResult) => void;
    onError?: (error: string) => void;
}

export default function AIAutoDetect({ imageFile, onDetectionComplete, onError }: AIAutoDetectProps) {
    const [analyzing, setAnalyzing] = useState(false);
    const [lastResult, setLastResult] = useState<AIDetectionResult | null>(null);
    const [error, setError] = useState<string>('');

    const detectImage = async () => {
        if (!imageFile) {
            setError('No image selected');
            onError?.('No image selected');
            return;
        }

        setAnalyzing(true);
        setError('');

        try {
            const formData = new FormData();
            formData.append('image', imageFile);

            console.log('[AIAutoDetect] Calling AI detection API...');

            const response = await fetch('/api/ai-detect', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error('AI detection failed');
            }

            const result: AIDetectionResult = await response.json();

            console.log('[AIAutoDetect] Detection result:', result);

            setLastResult(result);
            onDetectionComplete(result);

        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'AI detection failed';
            console.error('[AIAutoDetect] Error:', errorMsg);
            setError(errorMsg);
            onError?.(errorMsg);
        } finally {
            setAnalyzing(false);
        }
    };

    // Auto-detect when image changes
    useState(() => {
        if (imageFile) {
            detectImage();
        }
    });

    const confidenceColor = lastResult ? getConfidenceColor(lastResult.confidence) : 'yellow';
    const confidenceColorClass = {
        green: 'text-emerald-500 bg-emerald-500/10',
        yellow: 'text-yellow-500 bg-yellow-500/10',
        red: 'text-red-500 bg-red-500/10'
    }[confidenceColor];

    return (
        <div className="space-y-3">
            {/* Analyzing Loader */}
            {analyzing && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/10 border border-primary/20">
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                    <div>
                        <p className="text-sm font-medium text-white">Analyzing image...</p>
                        <p className="text-xs text-gray-400">Using AI to detect issue category</p>
                    </div>
                </div>
            )}

            {/* Detection Result */}
            {lastResult && !analyzing && (
                <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                    <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-primary" />
                            <span className="text-sm font-semibold text-white">AI Detected</span>
                        </div>
                        <button
                            onClick={detectImage}
                            disabled={analyzing}
                            className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                        >
                            <RefreshCw className="w-3 h-3" />
                            Re-detect
                        </button>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400">Category:</span>
                            <span className="text-sm font-medium text-white capitalize">
                                {lastResult.category.replace('_', ' ')}
                            </span>
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400">Confidence:</span>
                            <span className={`text-sm font-bold px-2 py-0.5 rounded ${confidenceColorClass}`}>
                                {Math.round(lastResult.confidence * 100)}%
                            </span>
                        </div>

                        {lastResult.caption && (
                            <div className="pt-2 border-t border-white/5">
                                <p className="text-xs text-gray-500 italic">
                                    "{lastResult.caption}"
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Error State */}
            {error && !analyzing && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                    <p className="text-sm text-red-400">
                        ⚠️ {error}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                        Please select category manually
                    </p>
                </div>
            )}
        </div>
    );
}
