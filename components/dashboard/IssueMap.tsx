'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default icon broken by webpack
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const PRIORITY_COLORS: Record<string, string> = {
    urgent: '#ef4444',
    high:   '#f97316',
    medium: '#eab308',
    low:    '#22c55e',
};

function makeIcon(color: string) {
    return L.divIcon({
        className: '',
        html: `<div style="
            width: 24px; height: 24px;
            background: ${color};
            border: 3px solid white;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        "></div>`,
        iconSize:   [24, 24],
        iconAnchor: [12, 24],
        popupAnchor:[0, -28],
    });
}

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

export interface DashboardMapReport {
    id: string;
    category: string;
    address?: string;
    latitude?: number | null;
    longitude?: number | null;
    status: string;
    priority: string;
}

interface IssueMapProps {
    reports: DashboardMapReport[];
}

export default function IssueMap({ reports }: IssueMapProps) {
    const geoReports = reports.filter(r => r.latitude != null && r.longitude != null);
    const positions: [number, number][] = geoReports.map(r => [r.latitude!, r.longitude!]);

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col h-full">
            <div className="mb-4 flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-bold text-slate-800">Issue Map</h3>
                    <p className="text-sm text-slate-500 mt-1">Geographical distribution of active issues</p>
                </div>
            </div>
            {/* The relative z-0 is crucial to keep leaflet stack order contained and not overlap topbar/modals */}
            <div className="flex-1 w-full min-h-[350px] sm:min-h-[450px] rounded-[16px] overflow-hidden border border-slate-100 relative z-0">
                <MapContainer
                    center={[11.27, 77.60]}
                    zoom={12}
                    style={{ height: '100%', width: '100%' }}
                    scrollWheelZoom={false}
                >
                    <TileLayer
                        attribution='&copy; OpenStreetMap'
                        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                    />

                    {positions.length > 0 && <FitBounds positions={positions} />}

                    {geoReports.map((report) => {
                        const color = PRIORITY_COLORS[report.priority] || PRIORITY_COLORS.medium;
                        return (
                            <Marker
                                key={report.id}
                                position={[report.latitude!, report.longitude!]}
                                icon={makeIcon(color)}
                            >
                                <Popup className="dashboard-map-popup">
                                    <div className="font-sans min-w-[160px]">
                                        <div className="font-bold text-slate-800 text-sm mb-1">
                                            {report.category.charAt(0).toUpperCase() + report.category.slice(1)}
                                        </div>
                                        <div className="text-slate-500 text-xs mb-2 truncate max-w-[200px]">
                                            {report.address}
                                        </div>
                                        <div className="flex items-center gap-2 mt-2">
                                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase" style={{ color: color, backgroundColor: color + '20' }}>
                                                {report.priority}
                                            </span>
                                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600">
                                                {report.status.replace('_', ' ')}
                                            </span>
                                        </div>
                                    </div>
                                </Popup>
                            </Marker>
                        );
                    })}
                </MapContainer>
            </div>
        </div>
    );
}
