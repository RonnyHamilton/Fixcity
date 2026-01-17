'use client';

import { useEffect, useRef, useState } from 'react';

interface HeroVideoBackgroundProps {
    srcWebm?: string;
    srcMp4: string;
    poster?: string;
    className?: string;
}

export default function HeroVideoBackground({
    srcWebm,
    srcMp4,
    poster,
    className = '',
}: HeroVideoBackgroundProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [hasError, setHasError] = useState(false);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        // Attempt to play video (some browsers require user interaction)
        const playVideo = async () => {
            try {
                await video.play();
            } catch (error) {
                console.log('Video autoplay prevented, will play on user interaction');
            }
        };

        playVideo();

        // Handle video load
        const handleLoadedData = () => {
            setIsLoaded(true);
        };

        const handleError = () => {
            setHasError(true);
        };

        video.addEventListener('loadeddata', handleLoadedData);
        video.addEventListener('error', handleError);

        return () => {
            video.removeEventListener('loadeddata', handleLoadedData);
            video.removeEventListener('error', handleError);
        };
    }, []);

    return (
        <div className={`absolute inset-0 overflow-hidden ${className}`}>
            {/* Fallback gradient background if video fails */}
            {hasError && !isLoaded && (
                <div className="absolute inset-0 bg-gradient-to-br from-[#0a0f16] via-[#0f1419] to-[#0a0f16]" />
            )}

            {/* Video Background */}
            <video
                ref={videoRef}
                autoPlay
                muted
                loop
                playsInline
                poster={poster}
                className={`absolute top-0 left-0 w-full h-full object-cover transition-opacity duration-700 ${isLoaded ? 'opacity-100' : 'opacity-0'
                    }`}
                style={{
                    // High-quality rendering optimizations
                    transform: 'translateZ(0)', // Force GPU acceleration
                    backfaceVisibility: 'hidden',
                    perspective: 1000,
                    willChange: 'transform',
                    imageRendering: 'crisp-edges',
                    WebkitBackfaceVisibility: 'hidden',
                    WebkitPerspective: 1000,
                }}
            >
                {/* WebM for better quality (Chrome, Firefox, Edge) */}
                {srcWebm && <source src={srcWebm} type="video/webm" />}

                {/* MP4 fallback (Safari, older browsers) */}
                <source src={srcMp4} type="video/mp4" />

                {/* Fallback message */}
                Your browser does not support the video tag.
            </video>

            {/* Dark overlay gradient for text readability */}
            <div
                className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/60"
                style={{
                    // Ensure overlay doesn't interfere with rendering
                    pointerEvents: 'none',
                }}
            />
        </div>
    );
}
