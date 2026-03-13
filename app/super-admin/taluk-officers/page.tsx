'use client';

import { useEffect, useState } from 'react';
import {
    Shield, Search, Plus, Pencil, Trash2, X, MapPin,
    Loader2, Users, Mail, AlertTriangle
} from 'lucide-react';

interface OfficerEntry {
    id: string;
    badge_id: string;
    name: string;
    email: string;
    area: string;
    role: string;
    ward_count: number;
    assignments: { ward_name: string; department_name: string | null }[];
}

interface Ward {
    id: string;
    name: string;
}

export default function TalukOfficersPage() {
    const [officers, setOfficers] = useState<OfficerEntry[]>([]);
    const [wards, setWards] = useState<Ward[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editOfficer, setEditOfficer] = useState<OfficerEntry | null>(null);
    const [saving, setSaving] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

    // Form state
    const [formName, setFormName] = useState('');
    const [formEmail, setFormEmail] = useState('');
    const [formBadgeId, setFormBadgeId] = useState('');
    const [formPassword, setFormPassword] = useState('');
    const [formArea, setFormArea] = useState('');
    const [formWardIds, setFormWardIds] = useState<string[]>([]);
    const [formError, setFormError] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [officersRes, wardsData] = await Promise.all([
                fetch('/api/admin/officers').then(r => r.json()),
                import('@/lib/supabase').then(m => m.supabase.from('wards').select('id, name')),
            ]);

            // Taluk officers: those with >1 ward assignment
            const talukOfficers = (officersRes.officers || []).filter(
                (o: OfficerEntry) => o.role === 'taluk_officer' || o.ward_count > 1
            );
            setOfficers(talukOfficers);
            setWards(wardsData.data || []);
        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setLoading(false);
        }
    };

    const openAddModal = () => {
        setEditOfficer(null);
        setFormName('');
        setFormEmail('');
        setFormBadgeId('');
        setFormPassword('');
        setFormArea('');
        setFormWardIds([]);
        setFormError('');
        setShowModal(true);
    };

    const openEditModal = (officer: OfficerEntry) => {
        setEditOfficer(officer);
        setFormName(officer.name);
        setFormEmail(officer.email);
        setFormBadgeId(officer.badge_id);
        setFormPassword('');
        setFormArea(officer.area);
        setFormWardIds(officer.assignments.map(a => {
            const w = wards.find(w => w.name === a.ward_name);
            return w?.id || '';
        }).filter(Boolean));
        setFormError('');
        setShowModal(true);
    };

    const handleSave = async () => {
        if (!formName.trim()) { setFormError('Name is required'); return; }
        if (!editOfficer && !formBadgeId.trim()) { setFormError('Badge ID is required'); return; }
        if (!editOfficer && !formPassword.trim()) { setFormError('Password is required'); return; }
        if (formWardIds.length < 2) { setFormError('Taluk officers must be assigned to at least 2 wards'); return; }

        setSaving(true);
        setFormError('');

        try {
            if (editOfficer) {
                // Update
                await fetch('/api/admin/officers', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        id: editOfficer.id,
                        name: formName,
                        email: formEmail,
                        area: formArea,
                        role: 'taluk_officer',
                        ward_ids: formWardIds,
                    }),
                });
            } else {
                // Create
                const res = await fetch('/api/admin/officers', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: formName,
                        email: formEmail,
                        badge_id: formBadgeId,
                        password: formPassword,
                        area: formArea,
                        role: 'taluk_officer',
                        ward_ids: formWardIds,
                    }),
                });
                const data = await res.json();
                if (!res.ok) { setFormError(data.error || 'Failed to add officer'); setSaving(false); return; }
            }

            setShowModal(false);
            fetchData();
        } catch {
            setFormError('Network error. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await fetch(`/api/admin/officers?id=${id}`, { method: 'DELETE' });
            setDeleteConfirm(null);
            fetchData();
        } catch (error) {
            console.error('Delete failed:', error);
        }
    };

    const toggleWard = (wardId: string) => {
        setFormWardIds(prev =>
            prev.includes(wardId)
                ? prev.filter(id => id !== wardId)
                : [...prev, wardId]
        );
    };

    // Filter
    const filtered = officers.filter(o => {
        const q = searchQuery.toLowerCase();
        return o.name.toLowerCase().includes(q) || o.email.toLowerCase().includes(q) || o.area.toLowerCase().includes(q);
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-12">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                        <Shield className="w-7 h-7 text-blue-500" />
                        Taluk Officers
                    </h1>
                    <p className="text-slate-500 mt-1">{officers.length} taluk officers in the system</p>
                </div>
                <button
                    onClick={openAddModal}
                    className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-xl font-semibold text-sm hover:from-amber-500 hover:to-orange-500 transition-all shadow-lg shadow-amber-600/20"
                >
                    <Plus className="w-4 h-4" />
                    Add Taluk Officer
                </button>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-12 pl-12 pr-4 rounded-xl bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all shadow-sm"
                    placeholder="Search by name, email, or area..."
                />
            </div>

            {/* Officer Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filtered.map((officer) => (
                    <div
                        key={officer.id}
                        className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md hover:border-blue-500/30 transition-all group relative overflow-hidden"
                    >
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-cyan-500"></div>

                        {/* Avatar + Info */}
                        <div className="flex items-center gap-4 mb-5">
                            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center text-xl font-bold text-white shadow-lg shadow-blue-500/20">
                                {officer.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-lg font-bold text-slate-900 truncate">{officer.name}</h3>
                                <p className="text-xs font-bold text-blue-600 uppercase tracking-wider">Taluk Officer</p>
                            </div>
                        </div>

                        {/* Details */}
                        <div className="space-y-3 mb-5">
                            <div className="flex items-center gap-3 text-sm">
                                <Shield className="w-4 h-4 text-slate-400 shrink-0" />
                                <span className="text-slate-500">Badge:</span>
                                <span className="text-slate-700 font-medium">{officer.badge_id}</span>
                            </div>
                            {officer.email && (
                                <div className="flex items-center gap-3 text-sm">
                                    <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                                    <span className="text-slate-700 truncate">{officer.email}</span>
                                </div>
                            )}
                            <div className="flex items-center gap-3 text-sm">
                                <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                                <span className="text-slate-700">{officer.area || 'No area'}</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                                <Users className="w-4 h-4 text-slate-400 shrink-0" />
                                <span className="text-slate-700">{officer.ward_count} wards assigned</span>
                            </div>
                        </div>

                        {/* Ward Tags */}
                        <div className="flex flex-wrap gap-2 mb-5">
                            {officer.assignments.map((a, i) => (
                                <span key={i} className="px-3 py-1 text-xs font-semibold bg-blue-50 text-blue-600 rounded-lg border border-blue-100">
                                    {a.ward_name}
                                </span>
                            ))}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                            <button
                                onClick={() => openEditModal(officer)}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 hover:text-amber-600 hover:bg-amber-50 hover:border-amber-200 transition-all text-sm font-medium"
                            >
                                <Pencil className="w-4 h-4" />
                                Edit
                            </button>
                            {deleteConfirm === officer.id ? (
                                <div className="flex-1 flex gap-1">
                                    <button
                                        onClick={() => handleDelete(officer.id)}
                                        className="flex-1 flex items-center justify-center px-3 py-2.5 rounded-xl bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 transition-all text-sm font-medium"
                                    >
                                        Confirm
                                    </button>
                                    <button
                                        onClick={() => setDeleteConfirm(null)}
                                        className="px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 transition-all text-sm"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setDeleteConfirm(officer.id)}
                                    className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 hover:text-red-600 hover:bg-red-50 hover:border-red-200 transition-all text-sm font-medium"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {filtered.length === 0 && (
                <div className="bg-white rounded-2xl p-16 text-center border border-dashed border-slate-300 shadow-sm">
                    <Shield className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-slate-900 mb-2">No Taluk Officers Found</h3>
                    <p className="text-slate-500">{searchQuery ? 'No officers match your search' : 'Add your first taluk officer to get started'}</p>
                </div>
            )}

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
                        <div className="flex items-center justify-between p-6 border-b border-slate-100">
                            <h2 className="text-lg font-bold text-slate-900">
                                {editOfficer ? 'Edit Taluk Officer' : 'Add Taluk Officer'}
                            </h2>
                            <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Name *</label>
                                <input
                                    value={formName}
                                    onChange={(e) => setFormName(e.target.value)}
                                    className="w-full h-11 rounded-xl bg-white border border-slate-300 px-4 text-sm text-slate-900 placeholder-slate-400 focus:border-amber-500 outline-none transition-all focus:ring-2 focus:ring-amber-500/20"
                                    placeholder="Full name"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email</label>
                                <input
                                    value={formEmail}
                                    onChange={(e) => setFormEmail(e.target.value)}
                                    className="w-full h-11 rounded-xl bg-white border border-slate-300 px-4 text-sm text-slate-900 placeholder-slate-400 focus:border-amber-500 outline-none transition-all focus:ring-2 focus:ring-amber-500/20"
                                    placeholder="email@fixcity.gov.in"
                                />
                            </div>
                            {!editOfficer && (
                                <>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Badge ID *</label>
                                        <input
                                            value={formBadgeId}
                                            onChange={(e) => setFormBadgeId(e.target.value)}
                                            className="w-full h-11 rounded-xl bg-white border border-slate-300 px-4 text-sm text-slate-900 placeholder-slate-400 focus:border-amber-500 outline-none transition-all focus:ring-2 focus:ring-amber-500/20"
                                            placeholder="IPS2024XXX"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Password *</label>
                                        <input
                                            type="password"
                                            value={formPassword}
                                            onChange={(e) => setFormPassword(e.target.value)}
                                            className="w-full h-11 rounded-xl bg-white border border-slate-300 px-4 text-sm text-slate-900 placeholder-slate-400 focus:border-amber-500 outline-none transition-all focus:ring-2 focus:ring-amber-500/20"
                                            placeholder="Set login password"
                                        />
                                    </div>
                                </>
                            )}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Area</label>
                                <input
                                    value={formArea}
                                    onChange={(e) => setFormArea(e.target.value)}
                                    className="w-full h-11 rounded-xl bg-white border border-slate-300 px-4 text-sm text-slate-900 placeholder-slate-400 focus:border-amber-500 outline-none transition-all focus:ring-2 focus:ring-amber-500/20"
                                    placeholder="District / Area"
                                />
                            </div>

                            {/* Ward Selection */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                                    Assign Wards * <span className="text-slate-500 font-normal">(min 2 for taluk officer)</span>
                                </label>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {wards.map((ward) => (
                                        <button
                                            key={ward.id}
                                            type="button"
                                            onClick={() => toggleWard(ward.id)}
                                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${formWardIds.includes(ward.id)
                                                    ? 'bg-amber-100 text-amber-700 border border-amber-300'
                                                    : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                                                }`}
                                        >
                                            {ward.name}
                                        </button>
                                    ))}
                                </div>
                                {formWardIds.length > 0 && (
                                    <p className="text-xs text-amber-600 mt-2">{formWardIds.length} ward(s) selected</p>
                                )}
                            </div>

                            {formError && (
                                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl">
                                    <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                                    <p className="text-sm text-red-600">{formError}</p>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-3 p-6 border-t border-slate-100">
                            <button
                                onClick={() => setShowModal(false)}
                                className="flex-1 h-11 rounded-xl bg-white border border-slate-300 text-slate-700 font-medium text-sm hover:bg-slate-50 hover:text-slate-900 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="flex-1 h-11 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 text-white font-semibold text-sm hover:from-amber-500 hover:to-orange-500 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : (editOfficer ? 'Save Changes' : 'Add Officer')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
