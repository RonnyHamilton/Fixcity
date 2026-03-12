'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// ── Fix Leaflet default icon broken by webpack ────────────────────────────────
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// ── Priority → color mapping ──────────────────────────────────────────────────
const PRIORITY_COLORS: Record<string, string> = {
    urgent: '#ef4444',  // red
    high:   '#f97316',  // orange
    medium: '#eab308',  // yellow
    low:    '#22c55e',  // green
};

const STATUS_COLORS: Record<string, string> = {
    resolved:    '#22c55e',
    in_progress: '#3b82f6',
    pending:     '#f97316',
    rejected:    '#94a3b8',
};

function makeIcon(color: string) {
    return L.divIcon({
        className: '',
        html: `<div style="
            width: 28px; height: 28px;
            background: ${color};
            border: 3px solid white;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            box-shadow: 0 2px 8px rgba(0,0,0,0.25);
        "></div>`,
        iconSize:   [28, 28],
        iconAnchor: [14, 28],
        popupAnchor:[0, -30],
    });
}

// ── Auto-fit bounds to all markers ───────────────────────────────────────────
function FitBounds({ positions }: { positions: [number, number][] }) {
    const map = useMap();
    useEffect(() => {
        if (positions.length > 0) {
            const bounds = L.latLngBounds(positions);
            map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
        }
    }, [positions, map]);
    return null;
}

const CATEGORY_EMOJI: Record<string, string> = {
    pothole:     '🕳️',
    garbage:     '🗑️',
    streetlight: '💡',
    waterlog:    '💧',
    graffiti:    '🖌️',
    default:     '📍',
};

export interface MapReport {
    id: string;
    category: string;
    description?: string;
    address?: string;
    latitude?: number | null;
    longitude?: number | null;
    status: string;
    priority: string;
    ward_name?: string;
    department_name?: string;
}

interface ReportsMapProps {
    reports: MapReport[];
    center?: [number, number];
    zoom?: number;
}

export default function ReportsMap({ reports, center = [11.27, 77.60], zoom = 12 }: ReportsMapProps) {
    const geoReports = reports.filter(
        (r) => r.latitude != null && r.longitude != null
    );

    const positions: [number, number][] = geoReports.map(
        (r) => [r.latitude!, r.longitude!]
    );

    return (
        <MapContainer
            center={center}
            zoom={zoom}
            style={{ height: '100%', width: '100%', borderRadius: '16px' }}
            scrollWheelZoom
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {positions.length > 0 && <FitBounds positions={positions} />}

            {geoReports.map((report) => {
                const color = report.status === 'resolved'
                    ? STATUS_COLORS.resolved
                    : PRIORITY_COLORS[report.priority] || PRIORITY_COLORS.medium;
                const emoji = CATEGORY_EMOJI[report.category] || CATEGORY_EMOJI.default;
                const icon  = makeIcon(color);

                return (
                    <Marker
                        key={report.id}
                        position={[report.latitude!, report.longitude!]}
                        icon={icon}
                    >
                        <Popup maxWidth={220}>
                            <div style={{ fontFamily: 'sans-serif', fontSize: '13px', lineHeight: '1.5' }}>
                                <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: 4 }}>
                                    {emoji} {report.category.charAt(0).toUpperCase() + report.category.slice(1)}
                                </div>
                                {report.address && (
                                    <div style={{ color: '#64748b', marginBottom: 4 }}>
                                        📍 {report.address}
                                    </div>
                                )}
                                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                    <span style={{
                                        background: color + '22',
                                        color,
                                        padding: '1px 8px',
                                        borderRadius: 20,
                                        fontWeight: 600,
                                        fontSize: '11px',
                                    }}>
                                        {report.priority.toUpperCase()}
                                    </span>
                                    <span style={{
                                        background: '#f1f5f9',
                                        color: '#475569',
                                        padding: '1px 8px',
                                        borderRadius: 20,
                                        fontSize: '11px',
                                    }}>
                                        {report.status.replace('_', ' ')}
                                    </span>
                                </div>
                                {report.ward_name && (
                                    <div style={{ marginTop: 4, fontSize: '11px', color: '#6366f1' }}>
                                        🏘 {report.ward_name}
                                        {report.department_name && ` · ${report.department_name}`}
                                    </div>
                                )}
                            </div>
                        </Popup>
                    </Marker>
                );
            })}
        </MapContainer>
    );
}
