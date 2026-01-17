'use client';

import { useEffect, useRef, useState } from 'react';

interface HeroVideoProps {
    srcWebm?: string;
    srcMp4: string;
    poster?: string;
    className?: string;
    variant?: 'framed' | 'background';
}

export default function HeroVideo({
    srcWebm,
    srcMp4,
    poster,
    className = '',
    variant = 'framed',
}: HeroVideoProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const playVideo = async () => {
            try {
                await video.play();
            } catch (error) {
                console.log('Video autoplay prevented');
            }
        };

        playVideo();

        const handleLoadedData = () => {
            setIsLoaded(true);
        };

        video.addEventListener('loadeddata', handleLoadedData);
        return () => {
            video.removeEventListener('loadeddata', handleLoadedData);
        };
    }, []);

    if (variant === 'background') {
        return (
            <div className={`absolute inset-0 w-full h-full overflow-hidden ${className}`}>
                <video
                    ref={videoRef}
                    autoPlay
                    muted
                    loop
                    playsInline
                    poster={poster}
                    className="w-full h-full object-cover"
                    style={{
                        transform: 'translateZ(0)',
                        backfaceVisibility: 'hidden',
                        willChange: 'transform',
                    }}
                >
                    {srcWebm && <source src={srcWebm} type="video/webm" />}
                    <source src={srcMp4} type="video/mp4" />
                </video>
            </div>
        );
    }

    return (
        <div className={`relative w-full ${className}`}>
            {/* Premium glass frame with glow */}
            <div className="relative rounded-3xl overflow-hidden shadow-2xl">
                {/* Glow effect */}
                <div className="absolute -inset-1 bg-gradient-to-r from-primary via-blue-500 to-emerald-500 rounded-3xl blur-xl opacity-30 group-hover:opacity-40 transition-opacity"></div>

                {/* Glass border */}
                <div className="relative rounded-3xl overflow-hidden border-2 border-white/10 backdrop-blur-sm bg-black/20">
                    <video
                        ref={videoRef}
                        autoPlay
                        muted
                        loop
                        playsInline
                        poster={poster}
                        className={`w-full h-full object-cover transition-opacity duration-700 ${isLoaded ? 'opacity-100' : 'opacity-0'
                            }`}
                        style={{
                            transform: 'translateZ(0)',
                            backfaceVisibility: 'hidden',
                            perspective: 1000,
                            willChange: 'transform',
                            imageRendering: 'crisp-edges',
                        }}
                    >
                        {srcWebm && <source src={srcWebm} type="video/webm" />}
                        <source src={srcMp4} type="video/mp4" />
                        Your browser does not support the video tag.
                    </video>
                </div>
            </div>
        </div>
    );
}
