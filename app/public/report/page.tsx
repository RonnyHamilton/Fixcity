'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    Upload, MapPin, Loader2, Camera, X, Check,
    Trash2, Lightbulb, Car, Paintbrush, Bus, MoreHorizontal, Dog, ArrowLeft, AlertTriangle
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

// Frontend Category IDs matching icons
const CATEGORIES = [
    { id: 'pothole', label: 'Pothole', icon: Car },
    { id: 'streetlight', label: 'Street Light', icon: Lightbulb },
    { id: 'sanitation', label: 'Sanitation', icon: Trash2 },
    { id: 'graffiti', label: 'Graffiti', icon: Paintbrush },
    { id: 'street_dogs', label: 'Street Dogs', icon: Dog },
    { id: 'e_waste', label: 'E-Waste', icon: Bus },
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
    const [currentUser, setCurrentUser] = useState<PublicUser | null>(null);

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

    // Form data
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [category, setCategory] = useState('');
    const [description, setDescription] = useState('');
    const [address, setAddress] = useState('');
    const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [detectingLocation, setDetectingLocation] = useState(false);

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
                    <div className="rounded-3xl glass-panel p-10 max-w-lg w-full mx-auto shadow-[0_0_50px_-10px_rgba(251,146,60,0.3)] animate-in fade-in zoom-in duration-300 border-2 border-orange-500/30">
                        <div className="flex flex-col items-center gap-6 text-center">
                            <div className="h-24 w-24 rounded-full bg-orange-500/20 flex items-center justify-center border-2 border-orange-500/50 animate-pulse">
                                <AlertTriangle className="w-12 h-12 text-orange-400" />
                            </div>
                            <div>
                                <h2 className="text-3xl font-black text-white mb-3">
                                    Already Reported!
                                </h2>
                                <p className="text-slate-300 text-lg leading-relaxed mb-4">
                                    {successMessage}
                                </p>
                                <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4 mb-4">
                                    <p className="text-sm text-orange-300 font-medium">
                                        💡 <strong>Note:</strong> Submitting the same issue multiple times won't create duplicate reports. We've already logged your concern!
                                    </p>
                                </div>
                                <p className="text-xs text-slate-500 mt-2">
                                    Check your previous reports in <strong className="text-orange-400">My Reports</strong>
                                </p>
                            </div>
                            <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden mt-2">
                                <div className="h-full bg-orange-400 animate-[progress_2s_ease-in-out_forwards] w-full origin-left" />
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
                <div className="rounded-3xl glass-panel p-10 max-w-lg w-full mx-auto shadow-[0_0_50px_-10px_rgba(34,197,94,0.3)] animate-in fade-in zoom-in duration-300">
                    <div className="flex flex-col items-center gap-6 text-center">
                        <div className="h-24 w-24 rounded-full bg-green-500/20 flex items-center justify-center border border-green-500/30">
                            {mergedInfo ? (
                                <AlertTriangle className="w-12 h-12 text-yellow-400" />
                            ) : (
                                <Check className="w-12 h-12 text-green-500" />
                            )}
                        </div>
                        <div>
                            <h2 className="text-3xl font-black text-white mb-3">
                                {mergedInfo ? 'Issue Update Logged' : 'Submission Successful!'}
                            </h2>
                            <p className="text-slate-400 text-lg leading-relaxed">
                                {successMessage}
                            </p>
                            {mergedInfo && (
                                <>
                                    <div className="mt-4 bg-purple-500/10 border border-purple-500/30 rounded-xl p-4">
                                        <p className="text-sm text-purple-300 font-medium mb-2">
                                            📊 This issue has been reported <strong className="text-purple-400">{mergedInfo.reportCount || 'multiple'}</strong> times
                                        </p>
                                        <p className="text-xs text-slate-400">
                                            Priority: <span className={`font-bold ${mergedInfo.priority === 'urgent' ? 'text-red-400' :
                                                mergedInfo.priority === 'high' ? 'text-orange-400' :
                                                    mergedInfo.priority === 'medium' ? 'text-yellow-400' : 'text-gray-400'
                                                }`}>{mergedInfo.priority?.toUpperCase()}</span>
                                            {mergedInfo.reopened && ' • 🔄 Reopened'}
                                        </p>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-3 font-mono">
                                        Reference ID: #{mergedInfo.id?.slice(-6)}
                                    </p>
                                </>
                            )}
                        </div>
                        <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden mt-2">
                            <div className={`h-full ${mergedInfo ? 'bg-yellow-400' : 'bg-green-500'} animate-[progress_3s_ease-in-out_forwards] w-full origin-left`} />
                        </div>
                        <p className="text-sm text-slate-500 font-medium">Redirecting to dashboard...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="py-8 px-4 md:px-8 max-w-[1280px] mx-auto w-full relative">

            {/* Header */}
            <div className="flex flex-col gap-4 pb-8 mb-8 border-b border-white/5">
                <button
                    onClick={() => router.back()}
                    className="self-start flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-white transition-colors mb-2 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5 hover:bg-white/10"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                </button>
                <div className="flex flex-wrap items-center gap-4">
                    <h1 className="text-3xl md:text-5xl font-black leading-tight tracking-tighter text-white drop-shadow-lg">
                        Report an Issue
                    </h1>
                </div>
                <p className="text-slate-400 text-lg font-medium leading-relaxed max-w-2xl">
                    Submit the details below to report a civic issue in your area.
                </p>
            </div>

            <div className="grid lg:grid-cols-12 gap-8">
                {/* Left Column - Evidence & Location */}
                <div className="lg:col-span-5 flex flex-col gap-6">
                    {/* Evidence Upload */}
                    <section className="glass-card rounded-3xl p-6 md:p-8 flex flex-col relative overflow-hidden group">

                        <div className="flex items-center justify-between mb-6 relative z-10">
                            <div className="flex items-center gap-4">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20 border border-primary/20 text-primary font-bold shadow-lg shadow-primary/10">1</div>
                                <h2 className="text-xl font-bold text-white">Evidence</h2>
                            </div>
                        </div>

                        {imagePreview ? (
                            <div className="relative rounded-2xl overflow-hidden border border-white/10 mb-4 shadow-2xl">
                                <img src={imagePreview} alt="Preview" className="w-full h-64 object-cover" />
                                <button
                                    onClick={() => {
                                        setImageFile(null);
                                        setImagePreview(null);
                                    }}
                                    className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 hover:bg-red-500 border border-white/10 flex items-center justify-center text-white transition-all backdrop-blur-md"
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
                                className={`flex-1 min-h-[250px] flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 transition-all cursor-pointer group/upload relative overflow-hidden ${isDragging
                                    ? 'border-primary bg-primary/10 scale-[1.02]'
                                    : 'border-white/10 bg-black/20 hover:bg-white/5 hover:border-primary/50'
                                    }`}
                            >
                                <div className={`absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent transition-opacity ${isDragging ? 'opacity-100' : 'opacity-0 group-hover/upload:opacity-100'
                                    }`} />
                                <div className={`mb-4 flex h-16 w-16 items-center justify-center rounded-full transition-all duration-300 ${isDragging
                                    ? 'bg-primary/30 scale-110 text-primary border border-primary/50'
                                    : 'bg-white/5 group-hover/upload:bg-primary/20 group-hover/upload:scale-110 text-slate-400 group-hover/upload:text-primary border border-white/5 group-hover/upload:border-primary/30'
                                    }`}>
                                    <Upload className="w-8 h-8" />
                                </div>
                                <p className="text-base font-bold text-center mb-1 text-white group-hover/upload:text-white transition-colors relative z-10">
                                    {isDragging ? 'Drop image here' : 'Click to upload or drag and drop'}
                                </p>
                                <p className="text-xs text-slate-500 text-center relative z-10 font-medium">JPG, PNG, WebP up to 10MB</p>
                            </div>
                        )}

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleFileSelect}
                            className="hidden"
                        />

                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="mt-4 flex items-center justify-center gap-2 w-full py-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold transition-all hover:scale-[1.02] active:scale-[0.98]"
                        >
                            <Camera className="w-5 h-5" />
                            {imagePreview ? 'Change Photo' : 'Take Photo'}
                        </button>
                    </section>

                    {/* Location */}
                    <section className="glass-card rounded-3xl p-6 md:p-8 relative overflow-hidden">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-4">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20 border border-primary/20 text-primary font-bold shadow-lg shadow-primary/10">2</div>
                                <h2 className="text-xl font-bold text-white">Location</h2>
                            </div>
                            <button
                                onClick={detectLocation}
                                disabled={detectingLocation}
                                className="text-primary text-xs font-bold flex items-center gap-2 hover:bg-primary/10 px-3 py-1.5 rounded-lg transition-all disabled:opacity-50 border border-primary/20 hover:border-primary/50"
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
                        <div className="relative w-full h-48 rounded-2xl overflow-hidden bg-slate-900 mb-4 border border-white/10 group">
                            <div
                                className="absolute inset-0 bg-cover bg-center opacity-60 group-hover:opacity-80 transition-opacity duration-700"
                                style={{ backgroundImage: `url('https://api.mapbox.com/styles/v1/mapbox/dark-v10/static/${location?.lng || 77.209},${location?.lat || 28.614},12,0/400x200?access_token=pk.placeholder')` }}
                            />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="bg-primary p-3 rounded-full shadow-[0_0_30px_rgba(59,130,246,0.5)] ring-4 ring-primary/30 animate-bounce">
                                    <MapPin className="w-6 h-6 text-white" />
                                </div>
                            </div>
                            {location && (
                                <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg text-xs font-mono text-white border border-white/10 shadow-lg">
                                    {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                                </div>
                            )}
                        </div>
                        <input
                            type="text"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            className="w-full h-12 rounded-xl glass-input px-4 text-sm font-medium"
                            placeholder="Enter street address or landmark"
                        />
                    </section>
                </div>

                {/* Right Column - Category & Description */}
                <div className="lg:col-span-7 flex flex-col gap-6">
                    {/* Category */}
                    <section className="glass-card rounded-3xl p-6 md:p-8">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-4">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20 border border-primary/20 text-primary font-bold shadow-lg shadow-primary/10">3</div>
                                <h2 className="text-xl font-bold text-white">Category</h2>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            {CATEGORIES.map((cat) => {
                                const Icon = cat.icon;
                                const isSelected = category === cat.id;

                                return (
                                    <button
                                        key={cat.id}
                                        onClick={() => setCategory(cat.id)}
                                        className={`group flex flex-col items-center gap-4 rounded-2xl border p-6 transition-all duration-300 relative overflow-hidden ${isSelected
                                            ? 'border-primary bg-primary/20 shadow-[0_0_30px_rgba(59,130,246,0.2)]'
                                            : 'border-white/5 bg-white/5 hover:bg-white/10 hover:border-white/20'
                                            }`}
                                    >
                                        <div className={`transition-all duration-300 p-3 rounded-xl ${isSelected ? 'bg-primary/20 text-primary' : 'bg-white/5 text-slate-400 group-hover:text-white group-hover:bg-white/10'}`}>
                                            <Icon className="w-8 h-8" />
                                        </div>
                                        <h3 className={`text-sm font-bold transition-colors ${isSelected ? 'text-white' : 'text-slate-400 group-hover:text-white'}`}>
                                            {cat.label}
                                        </h3>
                                    </button>
                                );
                            })}
                        </div>
                    </section>
                    {/* Description */}
                    <section className="glass-card rounded-3xl p-6 md:p-8 flex flex-col h-full bg-gradient-to-br from-[#1e293b]/50 to-[#0f172a]/80">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-4">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20 border border-primary/20 text-primary font-bold shadow-lg shadow-primary/10">4</div>
                                <h2 className="text-xl font-bold text-white">Description</h2>
                            </div>
                        </div>

                        <div className="flex-1 flex flex-col gap-3 relative">
                            <div className="relative flex-1">
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className={`w-full h-full min-h-[200px] rounded-2xl glass-input p-6 text-sm resize-none leading-relaxed text-slate-200 placeholder:text-slate-600 focus:ring-0`}
                                    placeholder="Describe the issue in detail. Be specific about the problem and its location..."
                                />
                                <div className="absolute bottom-4 right-4 flex items-center gap-2 pointer-events-none">
                                    {description.length > 50 && (
                                        <span className={`text-[10px] font-bold px-2 py-1 rounded bg-black/40 backdrop-blur-md border border-white/5 ${description.length > 900 ? 'text-red-400' : 'text-slate-500'}`}>
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
                <div className="mt-8 bg-red-500/10 border border-red-500/30 rounded-2xl p-4 text-center animate-in slide-in-from-bottom-5">
                    <p className="text-red-400 font-bold flex items-center justify-center gap-2">
                        <AlertTriangle className="w-5 h-5" />
                        {error}
                    </p>
                </div>
            )}

            {/* Submit Bar */}
            <div className="sticky bottom-0 z-40 mt-8 -mx-4 md:-mx-8 px-4 md:px-8 py-6 bg-gradient-to-t from-[#020617] via-[#020617]/95 to-transparent backdrop-blur-sm">
                <div className="max-w-[1280px] mx-auto rounded-2xl border border-white/10 bg-[#1e293b]/80 backdrop-blur-xl p-4 shadow-2xl flex flex-col-reverse md:flex-row items-center justify-between gap-4">
                    {/* Empty Left Side */}
                    <div className="flex items-center gap-3">
                    </div>

                    <div className="flex w-full md:w-auto gap-4">
                        <button
                            onClick={() => router.back()}
                            className="w-full md:w-auto px-8 h-12 rounded-xl border border-white/10 bg-white/5 text-slate-300 font-bold text-sm hover:bg-white/10 hover:text-white transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={loading}
                            className="w-full md:w-auto px-12 h-12 rounded-xl bg-gradient-to-r from-primary to-blue-600 text-white font-bold text-sm hover:shadow-[0_0_30px_rgba(59,130,246,0.4)] hover:scale-[1.02] transition-all active:scale-[0.98] border border-white/10 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
        </div>
    );
}
