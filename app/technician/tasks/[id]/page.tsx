'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import {
    MapPin, Clock, User, Camera, Upload, Check, X, CheckCircle,
    Navigation, Phone, ArrowLeft, Loader2, Image as ImageIcon
} from 'lucide-react';
import Link from 'next/link';
import { translations } from '@/lib/translations';

interface Task {
    id: string;
    user_name: string;
    user_phone?: string;
    category: string;
    description: string;
    image_url: string;
    address: string;
    latitude: number;
    longitude: number;
    status: 'pending' | 'in_progress' | 'resolved' | 'rejected';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    assigned_technician_id: string;
    assigned_officer_id: string;
    resolution_notes?: string;
    updated_at: string;
    created_at: string;
}

import { parseResolutionNotes } from '@/lib/resolution-utils';

export default function TaskResolvePage() {
    const router = useRouter();
    const params = useParams();
    const { user, language } = useAuthStore();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const t = translations[language];

    const [task, setTask] = useState<Task | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    // Resolution form
    const [resolutionNotes, setResolutionNotes] = useState('');
    const [proofImage, setProofImage] = useState<File | null>(null);
    const [proofPreview, setProofPreview] = useState<string | null>(null);

    useEffect(() => {
        fetchTask();
    }, [params.id]);

    const fetchTask = async () => {
        try {
            const response = await fetch(`/api/reports/${params.id}`);
            if (response.ok) {
                const data = await response.json();
                setTask(data.report);
            } else {
                setError('Task not found');
            }
        } catch (err) {
            setError('Failed to fetch task');
        } finally {
            setLoading(false);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            setError('Please select an image file');
            return;
        }

        setProofImage(file);
        setError('');

        const reader = new FileReader();
        reader.onload = (e) => {
            setProofPreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleSubmit = async () => {
        if (!resolutionNotes.trim()) {
            setError('Please add resolution notes');
            return;
        }

        if (!proofImage) {
            setError('Please upload proof of completion');
            return;
        }

        setSubmitting(true);
        setError('');

        try {
            // In production, upload image to Supabase Storage first
            const response = await fetch(`/api/reports/${params.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status: 'resolved',
                    assigned_technician_id: user?.id, // Ensure technician 'owns' the resolved task
                    resolved_at: new Date().toISOString(),
                    resolved_by_name: user?.name,
                    resolution_notes: resolutionNotes,
                    resolution_image_url: proofPreview, // Use preview for demo
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                setError(data.error || 'Failed to submit resolution');
                return;
            }

            setSuccess(true);

            setTimeout(() => {
                router.push('/technician/dashboard');
            }, 2000);
        } catch {
            setError('Network error. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
            </div>
        );
    }

    if (success) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="glass-panel rounded-2xl p-12 text-center max-w-md">
                    <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                        <Check className="w-10 h-10 text-emerald-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">{t.taskCompleted}</h2>
                    <p className="text-gray-400 mb-6">
                        {t.greatWork}
                    </p>
                    <p className="text-sm text-gray-500">{t.redirecting}</p>
                </div>
            </div>
        );
    }

    if (!task) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="text-center">
                    <p className="text-gray-400 mb-4">{t.taskNotFound}</p>
                    <Link href="/technician/dashboard" className="text-emerald-400 hover:underline">
                        {t.backToDashboard}
                    </Link>
                </div>
            </div>
        );
    }

    const { text: resolutionText, imageUrl: resolutionImage } = parseResolutionNotes(task.resolution_notes || '');

    const getPriorityConfig = (priority: string) => {
        const configs: Record<string, { color: string; bg: string }> = {
            urgent: { color: 'text-red-400', bg: 'bg-red-500/20' },
            high: { color: 'text-orange-400', bg: 'bg-orange-500/20' },
            medium: { color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
            low: { color: 'text-gray-400', bg: 'bg-gray-500/20' },
        };
        return configs[priority] || configs.low;
    };

    const priority = getPriorityConfig(task.priority);

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Back Button */}
            <Link
                href="/technician/dashboard"
                className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors"
            >
                <ArrowLeft className="w-4 h-4" />
                {t.backToDashboard}
            </Link>

            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${priority.color} ${priority.bg}`}>
                            {task.priority.toUpperCase()}
                        </span>
                        <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                            {task.category.replace('_', ' ')}
                        </span>
                        <span className="text-xs text-slate-400">#{task.id.slice(-6)}</span>
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900">
                        {task.status === 'resolved' ? t.completed : t.resolveTask}
                    </h1>
                </div>
                <div className="flex gap-2">
                    <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${task.latitude},${task.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-50 text-emerald-600 font-medium hover:bg-emerald-100 transition-all border border-emerald-100"
                    >
                        <Navigation className="w-4 h-4" />
                        {t.getDirections}
                    </a>
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                {/* Task Details */}
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden h-fit shadow-sm">
                    {/* Image */}
                    <div className="relative h-48 bg-slate-100">
                        {task.image_url ? (
                            <img src={task.image_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center">
                                <ImageIcon className="w-12 h-12 text-slate-300" />
                            </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 to-transparent" />
                    </div>

                    <div className="p-6 space-y-6">
                        <div>
                            <p className="text-xs text-slate-500 uppercase tracking-wider mb-2 font-bold">{t.description}</p>
                            <p className="text-slate-700 text-sm leading-relaxed">{task.description}</p>
                        </div>

                        <div>
                            <p className="text-xs text-slate-500 uppercase tracking-wider mb-2 font-bold">{t.location}</p>
                            <p className="text-slate-700 text-sm flex items-start gap-2">
                                <MapPin className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                                {task.address}
                            </p>
                        </div>

                        <div>
                            <p className="text-xs text-slate-500 uppercase tracking-wider mb-2 font-bold">{t.reportedBy}</p>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 border border-slate-200">
                                    <User className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-slate-900 text-sm font-bold">{task.user_name}</p>
                                    {task.user_phone && (
                                        <a href={`tel:${task.user_phone}`} className="text-emerald-600 text-xs hover:underline block mb-0.5 font-medium">
                                            {task.user_phone}
                                        </a>
                                    )}
                                    <p className="text-slate-400 text-xs">
                                        {new Date(task.created_at).toLocaleDateString('en-IN', {
                                            month: 'short',
                                            day: 'numeric',
                                            year: 'numeric',
                                        })}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Status / Resolution Panel */}
                {task.status === 'resolved' ? (
                    <div className="bg-white rounded-xl border border-emerald-100 p-6 shadow-sm">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center border border-emerald-100">
                                <Check className="w-5 h-5 text-emerald-600" />
                            </div>
                            <h2 className="text-lg font-bold text-slate-800">{t.resolutionDetails}</h2>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <p className="text-xs text-slate-500 uppercase tracking-wider mb-2 font-bold">{t.resolutionNotes}</p>
                                <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
                                    <p className="text-slate-600 text-sm whitespace-pre-wrap">{resolutionText}</p>
                                </div>
                            </div>

                            {resolutionImage && (
                                <div>
                                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-2 font-bold">{t.proofOfCompletion}</p>
                                    <div className="relative rounded-xl overflow-hidden border border-slate-200 group shadow-sm">
                                        <img src={resolutionImage} alt="Resolution Proof" className="w-full h-48 object-cover" />
                                        <div className="absolute inset-x-0 bottom-0 p-3 bg-white/90 backdrop-blur-sm border-t border-slate-100">
                                            <p className="text-xs text-emerald-600 font-bold text-center flex items-center justify-center gap-1">
                                                <CheckCircle className="w-3 h-3" />
                                                Verified Proof
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="pt-4 border-t border-slate-100">
                                <p className="text-xs text-slate-400 text-center">
                                    Resolved on {new Date(task.updated_at).toLocaleDateString('en-IN', {
                                        weekday: 'long',
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                        <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                            <Check className="w-5 h-5 text-emerald-500" />
                            {t.submitResolution}
                        </h2>

                        <div className="space-y-6">
                            {/* Proof Upload */}
                            <div>
                                <label className="text-sm font-bold text-slate-700 mb-2 block">
                                    {t.proofOfCompletion} *
                                </label>
                                {proofPreview ? (
                                    <div className="relative rounded-xl overflow-hidden border border-slate-200 shadow-sm">
                                        <img src={proofPreview} alt="Proof" className="w-full h-48 object-cover" />
                                        <button
                                            onClick={() => {
                                                setProofImage(null);
                                                setProofPreview(null);
                                            }}
                                            className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white text-red-500 shadow-md hover:bg-red-50 flex items-center justify-center transition-all"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 p-8 transition-all hover:bg-slate-100 hover:border-emerald-400 cursor-pointer group"
                                    >
                                        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white text-emerald-500 shadow-sm group-hover:scale-110 transition-transform">
                                            <Camera className="w-6 h-6" />
                                        </div>
                                        <p className="text-sm font-bold text-center text-slate-700">{t.uploadCompletionPhoto}</p>
                                        <p className="text-xs text-slate-400 text-center mt-1">{t.takePhotoDesc}</p>
                                    </div>
                                )}
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    capture="environment"
                                    onChange={handleFileSelect}
                                    className="hidden"
                                />
                            </div>

                            {/* Resolution Notes */}
                            <div>
                                <label className="text-sm font-bold text-slate-700 mb-2 block">
                                    {t.resolutionNotes} *
                                </label>
                                <textarea
                                    value={resolutionNotes}
                                    onChange={(e) => setResolutionNotes(e.target.value)}
                                    className="w-full h-32 rounded-xl bg-white border border-slate-200 p-4 text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none resize-none transition-all"
                                    placeholder={t.describeWork}
                                />
                            </div>

                            {/* Error */}
                            {error && (
                                <div className="bg-red-50 border border-red-100 rounded-lg p-3 text-center">
                                    <p className="text-red-600 text-sm font-medium">{error}</p>
                                </div>
                            )}

                            {/* Submit Button */}
                            <button
                                onClick={handleSubmit}
                                disabled={submitting}
                                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                            >
                                {submitting ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <>
                                        <Check className="w-5 h-5" />
                                        {t.markResolved}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
