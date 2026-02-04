'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    Upload, MapPin, Loader2, Camera, X, Check,
    Trash2, Lightbulb, Car, MoreHorizontal, Dog, ArrowLeft, AlertTriangle, Sparkles, Droplet, ImagePlus
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { classifyFromDataUrl, shouldAutoSelect, getConfidenceColor, ClassificationResult } from '@/lib/teachable-machine';

// Frontend Category IDs matching Teachable Machine model
const CATEGORIES = [
    { id: 'sanitation', label: 'Sanitation', icon: Trash2 },
    { id: 'pothole', label: 'Pothole', icon: Car },
    { id: 'water_pipes', label: 'Water Pipes', icon: Droplet },
    { id: 'streetlight', label: 'Street Light', icon: Lightbulb },
    { id: 'street_dogs', label: 'Street Dogs', icon: Dog },
    { id: 'other', label: 'Other', icon: MoreHorizontal },
];

interface PublicUser {
    id: string;
    email: string;
    name: string;
}

export default function ReportIssuePage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const cameraInputRef = useRef<HTMLInputElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [currentUser, setCurrentUser] = useState<PublicUser | null>(null);

    // Camera State
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
    const [cameraError, setCameraError] = useState('');

    // Check if user is logged in (optional - report submission works for both authenticated and anonymous users)
    useEffect(() => {
        const fetchUser = async () => {
            const uid = searchParams.get('uid');

            if (uid) {
                // User came from dashboard with UID - fetch their details
                const { data: user } = await supabase
                    .from('public_users')
                    .select('id, name, email')
                    .eq('id', uid)
                    .single();

                if (user) {
                    setCurrentUser(user);
                }
            }
            // If no uid, currentUser stays null (anonymous reporting)
        };

        fetchUser();
    }, [searchParams]);

    // UI State
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [mergedInfo, setMergedInfo] = useState<any>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isSpam, setIsSpam] = useState(false); // Track if user already submitted this issue

    // AI Detection State
    const [isDetecting, setIsDetecting] = useState(false);
    const [detectionResult, setDetectionResult] = useState<ClassificationResult | null>(null);
    const [wasAutoSelected, setWasAutoSelected] = useState(false);

    // Form data
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [category, setCategory] = useState('');
    const [description, setDescription] = useState('');
    const [address, setAddress] = useState('');
    const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [detectingLocation, setDetectingLocation] = useState(false);

    // Auto-detect category when image is uploaded
    useEffect(() => {
        if (!imagePreview) {
            setDetectionResult(null);
            setWasAutoSelected(false);
            return;
        }

        const detectCategory = async () => {
            setIsDetecting(true);
            try {
                const result = await classifyFromDataUrl(imagePreview);
                setDetectionResult(result);

                // Auto-select if confidence is high enough and no category selected yet
                if (result && shouldAutoSelect(result.confidence) && !category) {
                    setCategory(result.category);
                    setWasAutoSelected(true);
                }
            } catch (err) {
                console.error('Detection failed:', err);
            } finally {
                setIsDetecting(false);
            }
        };

        detectCategory();
    }, [imagePreview]);

    // Handle file selection (used by both click and drag-drop)
    const processFile = (file: File) => {
        // Validate file type
        if (!file.type.startsWith('image/')) {
            setError('Please select an image file');
            return;
        }

        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            setError('Image size must be less than 10MB');
            return;
        }

        setImageFile(file);
        setError('');

        // Create preview
        const reader = new FileReader();
        reader.onload = (e) => {
            setImagePreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);
    };

    // Handle file input change
    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        processFile(file);
    };

    // Drag and drop handlers
    const handleDragEnter = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const file = e.dataTransfer.files?.[0];
        if (file) {
            processFile(file);
        }
    };

    // Camera functions
    const openCamera = async () => {
        setCameraError('');
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
                audio: false
            });
            setCameraStream(stream);
            setIsCameraOpen(true);

            // Wait for next frame to ensure video element is rendered
            setTimeout(() => {
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.play();
                }
            }, 100);
        } catch (err: any) {
            console.error('Camera error:', err);
            if (err.name === 'NotAllowedError') {
                setCameraError('Camera permission denied. Please allow camera access.');
            } else if (err.name === 'NotFoundError') {
                setCameraError('No camera found. Please use file upload instead.');
            } else {
                setCameraError('Unable to access camera. Using mobile device? Try the capture button.');
            }
            // Fallback to camera input for mobile devices
            if (cameraInputRef.current) {
                cameraInputRef.current.click();
            }
        }
    };

    const capturePhoto = () => {
        if (!videoRef.current || !canvasRef.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;

        // Set canvas size to match video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Draw video frame to canvas
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

            // Convert to data URL
            const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
            setImagePreview(dataUrl);

            // Create a file from the data URL for consistency
            canvas.toBlob((blob) => {
                if (blob) {
                    const file = new File([blob], `capture_${Date.now()}.jpg`, { type: 'image/jpeg' });
                    setImageFile(file);
                }
            }, 'image/jpeg', 0.9);
        }

        closeCamera();
    };

    const closeCamera = () => {
        if (cameraStream) {
            cameraStream.getTracks().forEach(track => track.stop());
            setCameraStream(null);
        }
        setIsCameraOpen(false);
        setCameraError('');
    };

    // Handle camera input (for mobile devices using capture attribute)
    const handleCameraCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        processFile(file);
    };

    // Cleanup camera on unmount
    useEffect(() => {
        return () => {
            if (cameraStream) {
                cameraStream.getTracks().forEach(track => track.stop());
            }
        };
    }, [cameraStream]);

    // Detect location
    const detectLocation = useCallback(() => {
        if (!navigator.geolocation) {
            setError('Geolocation is not supported by your browser');
            return;
        }

        setDetectingLocation(true);
        setError('');

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                setLocation({ lat: latitude, lng: longitude });

                // Reverse geocode to get address
                try {
                    const response = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
                    );
                    const data = await response.json();
                    setAddress(data.display_name || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
                } catch {
                    setAddress(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
                }

                setDetectingLocation(false);
            },
            (err) => {
                setError('Unable to detect location. Please enter manually.');
                setDetectingLocation(false);
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    }, []);

    // State for success message
    const [successMessage, setSuccessMessage] = useState('');

    // Submit report
    const handleSubmit = async () => {
        if (!category) {
            setError('Please select a category');
            return;
        }

        if (!description.trim()) {
            setError('Please provide a description');
            return;
        }

        if (!address.trim()) {
            setError('Please provide the location');
            return;
        }

        setLoading(true);
        setError('');

        try {
            let imageUrl = imagePreview;

            const response = await fetch('/api/reports', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: currentUser?.id || 'anonymous',
                    user_name: currentUser?.name || 'Anonymous',
                    user_phone: undefined, // Phone not collected anymore
                    category,
                    description,
                    image_url: imageUrl,
                    latitude: location?.lat,
                    longitude: location?.lng,
                    location: address,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || 'Failed to submit report');
                return;
            }

            // Check if this is a spam/duplicate submission by the same user
            if (data.is_spam) {
                setIsSpam(true);
                setSuccessMessage(data.message || 'You have already reported this issue recently.');
                setSuccess(true);

                // Redirect faster for spam (2 seconds)
                setTimeout(() => {
                    const uid = searchParams.get('uid');
                    window.location.href = uid ? `/public/my-reports?uid=${uid}` : '/public/my-reports';
                }, 2000);
                return;
            }

            // Capture success message from backend
            setSuccessMessage(data.message || 'Report submitted successfully.');

            // Check if report was merged (data.id is the canonical ID)
            if (data.merged) {
                setMergedInfo({
                    id: data.id,
                    reportCount: data.reportCount,
                    priority: data.priority,
                    reopened: data.reopened
                });
            }

            setSuccess(true);

            // Redirect after 3 seconds
            setTimeout(() => {
                const uid = searchParams.get('uid');
                window.location.href = uid ? `/public/dashboard?uid=${uid}` : '/public/dashboard';
            }, 3500);
        } catch {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        // Special UI for spam/duplicate submission by same user
        if (isSpam) {
            return (
                <div className="min-h-[80vh] flex items-center justify-center px-4 w-full">
                    <div className="rounded-3xl bg-white border border-orange-200 p-10 max-w-lg w-full mx-auto shadow-xl animate-in fade-in zoom-in duration-300">
                        <div className="flex flex-col items-center gap-6 text-center">
                            <div className="h-24 w-24 rounded-full bg-orange-50 flex items-center justify-center border-2 border-orange-200 animate-pulse">
                                <AlertTriangle className="w-12 h-12 text-orange-500" />
                            </div>
                            <div>
                                <h2 className="text-3xl font-black text-slate-800 mb-3">
                                    Already Reported!
                                </h2>
                                <p className="text-slate-600 text-lg leading-relaxed mb-4">
                                    {successMessage}
                                </p>
                                <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 mb-4">
                                    <p className="text-sm text-orange-700 font-medium">
                                        💡 <strong>Note:</strong> Submitting the same issue multiple times won't create duplicate reports. We've already logged your concern!
                                    </p>
                                </div>
                                <p className="text-xs text-slate-500 mt-2">
                                    Check your previous reports in <strong className="text-orange-600">My Reports</strong>
                                </p>
                            </div>
                            <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden mt-2">
                                <div className="h-full bg-orange-500 animate-[progress_2s_ease-in-out_forwards] w-full origin-left" />
                            </div>
                            <p className="text-sm text-slate-500 font-medium">Redirecting to your reports...</p>
                        </div>
                    </div>
                </div>
            );
        }

        // Normal success/merged UI
        return (
            <div className="min-h-[80vh] flex items-center justify-center px-4 w-full">
                <div className="rounded-3xl bg-white border border-green-200 p-10 max-w-lg w-full mx-auto shadow-xl animate-in fade-in zoom-in duration-300">
                    <div className="flex flex-col items-center gap-6 text-center">
                        <div className="h-24 w-24 rounded-full bg-green-50 flex items-center justify-center border border-green-200">
                            {mergedInfo ? (
                                <AlertTriangle className="w-12 h-12 text-yellow-500" />
                            ) : (
                                <Check className="w-12 h-12 text-green-500" />
                            )}
                        </div>
                        <div>
                            <h2 className="text-3xl font-black text-slate-800 mb-3">
                                {mergedInfo ? 'Issue Update Logged' : 'Submission Successful!'}
                            </h2>
                            <p className="text-slate-600 text-lg leading-relaxed">
                                {successMessage}
                            </p>
                            {mergedInfo && (
                                <>
                                    <div className="mt-4 bg-purple-50 border border-purple-100 rounded-xl p-4">
                                        <p className="text-sm text-purple-700 font-medium mb-2">
                                            📊 This issue has been reported <strong className="text-purple-600">{mergedInfo.reportCount || 'multiple'}</strong> times
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            Priority: <span className={`font-bold ${mergedInfo.priority === 'urgent' ? 'text-red-500' :
                                                mergedInfo.priority === 'high' ? 'text-orange-500' :
                                                    mergedInfo.priority === 'medium' ? 'text-yellow-600' : 'text-gray-500'
                                                }`}>{mergedInfo.priority?.toUpperCase()}</span>
                                            {mergedInfo.reopened && ' • 🔄 Reopened'}
                                        </p>
                                    </div>
                                    <p className="text-xs text-slate-400 mt-3 font-mono">
                                        Reference ID: #{mergedInfo.id?.slice(-6)}
                                    </p>
                                </>
                            )}
                        </div>
                        <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden mt-2">
                            <div className={`h-full ${mergedInfo ? 'bg-yellow-500' : 'bg-green-500'} animate-[progress_3s_ease-in-out_forwards] w-full origin-left`} />
                        </div>
                        <p className="text-sm text-slate-500 font-medium">Redirecting to dashboard...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full">
            {/* Header */}
            <div className="flex flex-col gap-4 pb-8 mb-8 border-b border-slate-100">
                <button
                    onClick={() => router.back()}
                    className="self-start flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors mb-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 hover:bg-slate-100"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                </button>
                <div className="flex flex-wrap items-center gap-4">
                    <h1 className="text-3xl md:text-4xl font-black leading-tight tracking-tight text-slate-800">
                        Report an Issue
                    </h1>
                </div>
                <p className="text-slate-500 text-lg font-medium leading-relaxed max-w-2xl">
                    Submit the details below to report a civic issue in your area.
                </p>
            </div>

            <div className="grid lg:grid-cols-12 gap-8">
                {/* Left Column - Evidence & Location */}
                <div className="lg:col-span-5 flex flex-col gap-6">
                    {/* Evidence Upload */}
                    <section className="bg-white rounded-2xl p-6 md:p-8 flex flex-col border border-slate-100 shadow-sm">

                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-4">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 border border-blue-100 text-blue-600 font-bold">1</div>
                                <h2 className="text-xl font-bold text-slate-800">Evidence</h2>
                            </div>
                        </div>

                        {imagePreview ? (
                            <div className="relative rounded-2xl overflow-hidden border border-slate-200 mb-4 shadow-sm">
                                <img src={imagePreview} alt="Preview" className="w-full h-64 object-cover" />
                                <button
                                    onClick={() => {
                                        setImageFile(null);
                                        setImagePreview(null);
                                    }}
                                    className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 hover:bg-red-500 border border-slate-200 flex items-center justify-center text-slate-500 hover:text-white transition-all"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        ) : (
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                onDragEnter={handleDragEnter}
                                onDragLeave={handleDragLeave}
                                onDragOver={handleDragOver}
                                onDrop={handleDrop}
                                className={`flex-1 min-h-[250px] flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 transition-all cursor-pointer group/upload ${isDragging
                                    ? 'border-blue-500 bg-blue-50 scale-[1.02]'
                                    : 'border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-300'
                                    }`}
                            >
                                <div className={`mb-4 flex h-16 w-16 items-center justify-center rounded-full transition-all duration-300 ${isDragging
                                    ? 'bg-blue-100 scale-110 text-blue-600'
                                    : 'bg-slate-100 group-hover/upload:bg-blue-100 group-hover/upload:scale-110 text-slate-400 group-hover/upload:text-blue-600'
                                    }`}>
                                    <Upload className="w-8 h-8" />
                                </div>
                                <p className="text-base font-bold text-center mb-1 text-slate-700 group-hover/upload:text-blue-700 transition-colors">
                                    {isDragging ? 'Drop image here' : 'Click to upload or drag and drop'}
                                </p>
                                <p className="text-xs text-slate-400 text-center font-medium">JPG, PNG, WebP up to 10MB</p>
                            </div>
                        )}

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleFileSelect}
                            className="hidden"
                        />

                        {/* Hidden camera input for mobile devices */}
                        <input
                            ref={cameraInputRef}
                            type="file"
                            accept="image/*"
                            capture="environment"
                            onChange={handleCameraCapture}
                            className="hidden"
                        />

                        {/* Hidden canvas for photo capture */}
                        <canvas ref={canvasRef} className="hidden" />

                        {/* Camera Preview */}
                        {isCameraOpen && (
                            <div className="mt-4 relative rounded-2xl overflow-hidden border-2 border-blue-500 bg-black">
                                <video
                                    ref={videoRef}
                                    autoPlay
                                    playsInline
                                    muted
                                    className="w-full h-64 object-cover"
                                />
                                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent flex items-center justify-center gap-4">
                                    <button
                                        onClick={closeCamera}
                                        className="w-12 h-12 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/30 flex items-center justify-center text-white transition-all"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                    <button
                                        onClick={capturePhoto}
                                        className="w-16 h-16 rounded-full bg-white hover:bg-blue-50 border-4 border-blue-500 flex items-center justify-center text-blue-600 transition-all shadow-lg hover:scale-105"
                                    >
                                        <Camera className="w-8 h-8" />
                                    </button>
                                    <div className="w-12 h-12" /> {/* Spacer for centering */}
                                </div>
                            </div>
                        )}

                        {/* Camera Error */}
                        {cameraError && (
                            <div className="mt-4 bg-red-50 border border-red-100 rounded-xl p-3 text-center">
                                <p className="text-red-600 text-sm font-medium">{cameraError}</p>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="mt-4 grid grid-cols-2 gap-3">
                            <button
                                onClick={openCamera}
                                disabled={isCameraOpen}
                                className="flex items-center justify-center gap-2 py-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-600/20"
                            >
                                <Camera className="w-5 h-5" />
                                Take Photo
                            </button>
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="flex items-center justify-center gap-2 py-4 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 text-slate-700 hover:text-blue-700 font-bold transition-all"
                            >
                                <ImagePlus className="w-5 h-5" />
                                From Gallery
                            </button>
                        </div>
                    </section>


                    {/* Location */}
                    <section className="bg-white rounded-2xl p-6 md:p-8 border border-slate-100 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-4">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 border border-blue-100 text-blue-600 font-bold">2</div>
                                <h2 className="text-xl font-bold text-slate-800">Location</h2>
                            </div>
                            <button
                                onClick={detectLocation}
                                disabled={detectingLocation}
                                className="text-blue-600 text-xs font-bold flex items-center gap-2 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-all disabled:opacity-50 border border-blue-100 hover:border-blue-200"
                            >
                                {detectingLocation ? (
                                    <>
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                        Locating...
                                    </>
                                ) : (
                                    <>
                                        <MapPin className="w-3 h-3" />
                                        Detect My Location
                                    </>
                                )}
                            </button>
                        </div>
                        {/* Map Placeholder */}
                        <div className="relative w-full h-48 rounded-2xl overflow-hidden bg-slate-100 mb-4 border border-slate-200 group">
                            <div
                                className="absolute inset-0 bg-cover bg-center opacity-60 group-hover:opacity-80 transition-opacity duration-700"
                                style={{ backgroundImage: `url('https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/${location?.lng || 77.209},${location?.lat || 28.614},12,0/400x200?access_token=pk.placeholder')` }}
                            />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="bg-blue-600 p-3 rounded-full shadow-lg ring-4 ring-blue-100 animate-bounce">
                                    <MapPin className="w-6 h-6 text-white" />
                                </div>
                            </div>
                            {location && (
                                <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-lg text-xs font-mono text-slate-700 border border-slate-200 shadow-sm">
                                    {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                                </div>
                            )}
                        </div>
                        <input
                            type="text"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            className="w-full h-12 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:outline-none transition-all"
                            placeholder="Enter street address or landmark"
                        />
                    </section>
                </div>

                {/* Right Column - Category & Description */}
                <div className="lg:col-span-7 flex flex-col gap-6">
                    {/* Category */}
                    <section className="bg-white rounded-2xl p-6 md:p-8 border border-slate-100 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-4">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 border border-blue-100 text-blue-600 font-bold">3</div>
                                <h2 className="text-xl font-bold text-slate-800">Category</h2>
                            </div>
                            {/* AI Detection Status */}
                            {isDetecting && (
                                <div className="flex items-center gap-2 text-purple-600 bg-purple-50 px-3 py-1.5 rounded-lg border border-purple-100 animate-pulse">
                                    <Sparkles className="w-4 h-4" />
                                    <span className="text-xs font-bold">Detecting...</span>
                                </div>
                            )}
                            {detectionResult && !isDetecting && (
                                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${getConfidenceColor(detectionResult.confidence) === 'green'
                                    ? 'text-green-600 bg-green-50 border-green-100'
                                    : getConfidenceColor(detectionResult.confidence) === 'yellow'
                                        ? 'text-yellow-600 bg-yellow-50 border-yellow-100'
                                        : 'text-red-500 bg-red-50 border-red-100'
                                    }`}>
                                    <Sparkles className="w-4 h-4" />
                                    <span className="text-xs font-bold">
                                        AI: {(detectionResult.confidence * 100).toFixed(0)}% {detectionResult.rawLabel}
                                    </span>
                                </div>
                            )}
                        </div>

                        {wasAutoSelected && detectionResult && (
                            <div className="mb-4 bg-purple-50 border border-purple-100 rounded-xl px-4 py-3 flex items-center gap-3">
                                <Sparkles className="w-5 h-5 text-purple-500" />
                                <p className="text-sm text-purple-700">
                                    <strong>Auto-detected:</strong> {CATEGORIES.find(c => c.id === category)?.label || category}
                                    <span className="text-purple-500 ml-2">({(detectionResult.confidence * 100).toFixed(0)}% confidence)</span>
                                </p>
                            </div>
                        )}

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            {CATEGORIES.map((cat) => {
                                const Icon = cat.icon;
                                const isSelected = category === cat.id;
                                const isAiSuggested = detectionResult?.category === cat.id && !isDetecting;

                                return (
                                    <button
                                        key={cat.id}
                                        onClick={() => {
                                            setCategory(cat.id);
                                            if (wasAutoSelected && cat.id !== detectionResult?.category) {
                                                setWasAutoSelected(false); // User overrode AI
                                            }
                                        }}
                                        className={`group relative flex flex-col items-center gap-4 rounded-2xl border p-6 transition-all duration-300 ${isSelected
                                            ? 'border-blue-500 bg-blue-50 shadow-lg shadow-blue-500/10'
                                            : isAiSuggested
                                                ? 'border-purple-300 bg-purple-50/50 hover:bg-purple-50'
                                                : 'border-slate-100 bg-slate-50 hover:bg-blue-50 hover:border-blue-200'
                                            }`}
                                    >
                                        {/* AI suggestion badge */}
                                        {isAiSuggested && !isSelected && (
                                            <div className="absolute -top-2 -right-2 bg-purple-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                                                <Sparkles className="w-3 h-3" />
                                                AI
                                            </div>
                                        )}
                                        <div className={`transition-all duration-300 p-3 rounded-xl ${isSelected ? 'bg-blue-100 text-blue-600' : isAiSuggested ? 'bg-purple-100 text-purple-600' : 'bg-white text-slate-400 group-hover:text-blue-600 group-hover:bg-blue-50 border border-slate-100'}`}>
                                            <Icon className="w-8 h-8" />
                                        </div>
                                        <h3 className={`text-sm font-bold transition-colors ${isSelected ? 'text-blue-700' : isAiSuggested ? 'text-purple-600' : 'text-slate-600 group-hover:text-blue-600'}`}>
                                            {cat.label}
                                        </h3>
                                    </button>
                                );
                            })}
                        </div>
                    </section>
                    {/* Description */}
                    <section className="bg-white rounded-2xl p-6 md:p-8 flex flex-col h-full border border-slate-100 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-4">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 border border-blue-100 text-blue-600 font-bold">4</div>
                                <h2 className="text-xl font-bold text-slate-800">Description</h2>
                            </div>
                        </div>

                        <div className="flex-1 flex flex-col gap-3 relative">
                            <div className="relative flex-1">
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="w-full h-full min-h-[200px] rounded-2xl border border-slate-200 bg-slate-50 p-6 text-sm resize-none leading-relaxed text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:outline-none transition-all"
                                    placeholder="Describe the issue in detail. Be specific about the problem and its location..."
                                />
                                <div className="absolute bottom-4 right-4 flex items-center gap-2 pointer-events-none">
                                    {description.length > 50 && (
                                        <span className={`text-[10px] font-bold px-2 py-1 rounded bg-slate-100 border border-slate-200 ${description.length > 900 ? 'text-red-500' : 'text-slate-400'}`}>
                                            {description.length}/1000
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="mt-8 bg-red-50 border border-red-100 rounded-2xl p-4 text-center animate-in slide-in-from-bottom-5">
                    <p className="text-red-600 font-bold flex items-center justify-center gap-2">
                        <AlertTriangle className="w-5 h-5" />
                        {error}
                    </p>
                </div>
            )}

            {/* Submit Section */}
            <div className="mt-10 pt-8 border-t border-slate-100">
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="w-full sm:w-auto px-10 h-14 rounded-xl border border-slate-200 bg-white text-slate-600 font-bold text-base hover:bg-slate-50 hover:border-slate-300 transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="w-full sm:w-auto px-14 h-14 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-base shadow-lg shadow-blue-600/20 hover:shadow-xl hover:shadow-blue-600/30 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Processing...
                            </>
                        ) : (
                            <>
                                <Check className="w-5 h-5" />
                                Submit Report
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
