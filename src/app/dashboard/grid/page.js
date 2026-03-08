'use client';

import { useState, useEffect } from 'react';
import {
    Grid3X3, Zap, Battery, BatteryCharging, AlertTriangle,
    CheckCircle2, XCircle, Wifi, WifiOff, MapPin,
    ArrowUpRight, Settings, RefreshCw, Power, Wrench
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer
} from 'recharts';
import { getZones, getStations, updateStationStatus, getGridMetrics } from '@/lib/database';
import { parkingZones as fallbackZones, gridLoadData as fallbackGridData } from '@/lib/mock-data';
import { getLoadStatus } from '@/lib/utils';
import styles from './page.module.css';

const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className={styles.tooltip}>
            <p className={styles.tooltipLabel}>{label}</p>
            {payload.map((entry, i) => (
                <p key={i} style={{ color: entry.color }} className={styles.tooltipValue}>
                    {entry.name}: {entry.value}%
                </p>
            ))}
        </div>
    );
};

export default function GridManagerPage() {
    const [zones, setZones] = useState([]);
    const [stations, setStations] = useState([]);
    const [selectedZoneId, setSelectedZoneId] = useState(null);
    const [gridData, setGridData] = useState(fallbackGridData);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [zonesRes, stationsRes, gridRes] = await Promise.all([
                getZones(),
                getStations(),
                getGridMetrics(24),
            ]);

            if (zonesRes.data?.length > 0) {
                setZones(zonesRes.data);
                if (!selectedZoneId) setSelectedZoneId(zonesRes.data[0].id);
            }
            if (stationsRes.data?.length > 0) {
                setStations(stationsRes.data);
            }
            if (gridRes.data?.length > 0) {
                setGridData(gridRes.data.map(m => ({
                    time: new Date(m.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
                    load: Math.round((m.total_load_kw / m.total_capacity_kw) * 100),
                })));
            }
        } catch (err) {
            console.error('Error loading grid data:', err);
        }
        setLoading(false);
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    };

    const handleToggleStation = async (station) => {
        const newStatus = station.status === 'available' ? 'maintenance'
            : station.status === 'maintenance' ? 'available'
                : station.status;

        if (station.status === 'charging') return; // Can't toggle while charging

        await updateStationStatus(station.id, newStatus);
        // Refresh stations
        const { data } = await getStations();
        if (data) setStations(data);
    };

    // Compute stats from real data
    const zoneStations = stations.filter(s => s.zone_id === selectedZoneId);
    const selectedZone = zones.find(z => z.id === selectedZoneId);

    const totalStations = stations.length;
    const availableStations = stations.filter(s => s.status === 'available').length;
    const chargingStations = stations.filter(s => s.status === 'charging').length;
    const offlineStations = stations.filter(s => s.status === 'maintenance' || s.status === 'offline').length;

    const zoneDisplayData = zones.length > 0 ? zones.map(z => {
        const zStations = stations.filter(s => s.zone_id === z.id);
        const zCharging = zStations.filter(s => s.status === 'charging').length;
        const zAvailable = zStations.filter(s => s.status === 'available').length;
        const zActive = zStations.filter(s => s.status !== 'maintenance' && s.status !== 'offline').length;
        const loadPercent = zStations.length > 0 ? Math.round((zCharging / zStations.length) * 100) : 0;
        return { ...z, stationCount: zStations.length, chargingCount: zCharging, availableCount: zAvailable, activeCount: zActive, loadPercent };
    }) : fallbackZones.map(z => ({
        id: z.id, name: z.name, zone_code: z.id.replace('zone-', '').toUpperCase(),
        total_stations: z.totalStations, charger_type: z.chargerType,
        max_capacity_kw: z.maxCapacity, price_per_kwh: z.pricePerKwh,
        stationCount: z.totalStations, chargingCount: z.activeStations - z.availableStations,
        availableCount: z.availableStations, activeCount: z.activeStations,
        loadPercent: Math.round((z.currentLoad / z.maxCapacity) * 100),
    }));

    const overallLoad = totalStations > 0 ? Math.round((chargingStations / totalStations) * 100) : 0;

    return (
        <div className={styles.grid}>
            {/* Page Header */}
            <div className={styles.pageHeader}>
                <div>
                    <h1 className={styles.pageTitle}>Grid Manager</h1>
                    <p className={styles.pageSubtitle}>Real-time station monitoring & zone management</p>
                </div>
                <div className={styles.headerActions}>
                    <button className="btn btn-secondary btn-sm" onClick={handleRefresh} disabled={refreshing}>
                        <RefreshCw size={14} className={refreshing ? styles.spinning : ''} />
                        {refreshing ? 'Refreshing...' : 'Refresh'}
                    </button>
                </div>
            </div>

            {/* Overall Grid Status */}
            <div className={styles.overallGrid}>
                <div className={styles.overallCard}>
                    <div className={styles.overallIcon} style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--primary)' }}>
                        <Zap size={20} />
                    </div>
                    <div>
                        <span className={styles.overallLabel}>Grid Utilization</span>
                        <span className={styles.overallValue}>{overallLoad}%</span>
                    </div>
                    <div className="progress-bar" style={{ width: '100px' }}>
                        <div className="progress-bar-fill" style={{
                            width: `${overallLoad}%`,
                            background: overallLoad >= 90 ? 'var(--danger)' : overallLoad >= 75 ? 'var(--warning)' : 'linear-gradient(90deg, var(--primary), var(--primary-light))'
                        }} />
                    </div>
                </div>
                <div className={styles.overallCard}>
                    <div className={styles.overallIcon} style={{ background: 'rgba(59, 130, 246, 0.1)', color: 'var(--info)' }}>
                        <Grid3X3 size={20} />
                    </div>
                    <div>
                        <span className={styles.overallLabel}>Total Stations</span>
                        <span className={styles.overallValue}>{totalStations}</span>
                    </div>
                </div>
                <div className={styles.overallCard}>
                    <div className={styles.overallIcon} style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--primary)' }}>
                        <CheckCircle2 size={20} />
                    </div>
                    <div>
                        <span className={styles.overallLabel}>Available</span>
                        <span className={styles.overallValue}>{availableStations} stations</span>
                    </div>
                </div>
                <div className={styles.overallCard}>
                    <div className={styles.overallIcon} style={{ background: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning)' }}>
                        <Wrench size={20} />
                    </div>
                    <div>
                        <span className={styles.overallLabel}>Maintenance</span>
                        <span className={styles.overallValue}>{offlineStations} stations</span>
                    </div>
                </div>
            </div>

            {/* Zone Selector + Station Grid */}
            <div className={styles.mainContent}>
                {/* Zone Tabs */}
                <div className={styles.zoneSelector}>
                    {zoneDisplayData.map(z => {
                        const zStatus = getLoadStatus(z.loadPercent);
                        return (
                            <button
                                key={z.id}
                                className={`${styles.zoneTab} ${selectedZoneId === z.id ? styles.zoneTabActive : ''}`}
                                onClick={() => setSelectedZoneId(z.id)}
                            >
                                <div className={styles.zoneTabHeader}>
                                    <span className={styles.zoneTabName}>{z.name}</span>
                                    <span className={`badge badge-${zStatus.class === 'active' ? 'success' : zStatus.class}`}>
                                        {zStatus.label}
                                    </span>
                                </div>
                                <div className={styles.zoneTabStats}>
                                    <span>{z.chargingCount}/{z.stationCount} charging</span>
                                    <span>{z.availableCount} free</span>
                                </div>
                                <div className="progress-bar">
                                    <div className="progress-bar-fill" style={{
                                        width: `${z.loadPercent}%`,
                                        background: z.loadPercent >= 90 ? 'var(--danger)' : z.loadPercent >= 75 ? 'var(--warning)' : 'linear-gradient(90deg, var(--primary), var(--primary-light))'
                                    }} />
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* Station Grid */}
                <div className={styles.stationArea}>
                    <div className={`card ${styles.stationCard}`}>
                        <div className={styles.cardHeader}>
                            <div>
                                <h3 className={styles.cardTitle}>{selectedZone?.name || 'Zone'}</h3>
                                <p className={styles.cardSubtitle}>
                                    {selectedZone?.charger_type || ''} · ₹{selectedZone?.price_per_kwh || 0}/kWh · {zoneStations.length} stations
                                </p>
                            </div>
                            <div className={styles.zoneMetrics}>
                                <div className={styles.zoneMetric}>
                                    <span className={styles.zoneMetricLabel}>Charging</span>
                                    <span className={styles.zoneMetricValue}>{zoneStations.filter(s => s.status === 'charging').length}</span>
                                </div>
                                <div className={styles.zoneMetric}>
                                    <span className={styles.zoneMetricLabel}>Available</span>
                                    <span className={styles.zoneMetricValue}>{zoneStations.filter(s => s.status === 'available').length}</span>
                                </div>
                                <div className={styles.zoneMetric}>
                                    <span className={styles.zoneMetricLabel}>Capacity</span>
                                    <span className={styles.zoneMetricValue}>{selectedZone?.max_capacity_kw || 0} kW</span>
                                </div>
                            </div>
                        </div>

                        <div className={styles.stationsGrid}>
                            {zoneStations.map(station => (
                                <div
                                    key={station.id}
                                    className={`${styles.station} ${styles[`station${station.status.charAt(0).toUpperCase() + station.status.slice(1)}`]}`}
                                    onClick={() => handleToggleStation(station)}
                                    title={station.status === 'charging' ? 'Currently charging' : `Click to toggle ${station.status === 'available' ? 'maintenance' : 'available'}`}
                                    style={{ cursor: station.status === 'charging' ? 'not-allowed' : 'pointer' }}
                                >
                                    <div className={styles.stationHeader}>
                                        <span className={styles.stationId}>{station.station_code}</span>
                                        {station.status === 'charging' && <Wifi size={10} className={styles.stationWifi} />}
                                        {(station.status === 'maintenance' || station.status === 'offline') && <WifiOff size={10} className={styles.stationOffline} />}
                                    </div>
                                    {station.status === 'charging' ? (
                                        <>
                                            <BatteryCharging size={20} className={styles.stationIcon} />
                                            <span className={styles.stationCharge}>In Use</span>
                                            <span className={styles.stationPower}>{station.max_power_kw} kW</span>
                                        </>
                                    ) : station.status === 'available' ? (
                                        <>
                                            <Battery size={20} className={styles.stationIcon} />
                                            <span className={styles.stationAvail}>Available</span>
                                        </>
                                    ) : (
                                        <>
                                            <XCircle size={20} className={styles.stationIcon} />
                                            <span className={styles.stationOff}>Maintenance</span>
                                        </>
                                    )}
                                </div>
                            ))}
                            {zoneStations.length === 0 && (
                                <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px', color: 'var(--text-tertiary)' }}>
                                    No stations found. Run seed_stations.sql in Supabase.
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Zone Load Chart */}
                    <div className={`card ${styles.zoneChartCard}`}>
                        <div className={styles.cardHeader}>
                            <div>
                                <h3 className={styles.cardTitle}>Grid Load Timeline</h3>
                                <p className={styles.cardSubtitle}>Today&apos;s load pattern</p>
                            </div>
                        </div>
                        <ResponsiveContainer width="100%" height={200}>
                            <AreaChart data={gridData.slice(0, 12)} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                                <defs>
                                    <linearGradient id="zoneLoadGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                                        <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                <XAxis dataKey="time" stroke="#475569" fontSize={11} tickLine={false} />
                                <YAxis stroke="#475569" fontSize={11} tickLine={false} unit="%" />
                                <Tooltip content={<CustomTooltip />} />
                                <Area type="monotone" dataKey="load" name="Load" stroke="#10b981" fill="url(#zoneLoadGrad)" strokeWidth={2} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}
