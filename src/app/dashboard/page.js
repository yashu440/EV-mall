'use client';

import { useState, useEffect } from 'react';
import {
    Zap, Battery, BatteryCharging, Users, DollarSign,
    TrendingUp, Activity, Clock, Leaf, AlertTriangle,
    ArrowUpRight, ArrowDownRight, Eye, Sparkles, Cpu
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar
} from 'recharts';
import { getDashboardStats, getAllSessions, getZones, getAIInsights, getGridMetrics } from '@/lib/database';
import { dashboardStats as fallbackStats, gridLoadData as fallbackGridData, energyDistribution, aiInsights as fallbackInsights, parkingZones as fallbackZones } from '@/lib/mock-data';
import { formatCurrency, formatEnergy, getStatusBadgeClass, getLoadStatus } from '@/lib/utils';
import styles from './page.module.css';

const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className={styles.chartTooltip}>
            <p className={styles.tooltipLabel}>{label}</p>
            {payload.map((entry, index) => (
                <p key={index} style={{ color: entry.color }} className={styles.tooltipValue}>
                    {entry.name}: {entry.value}{entry.name === 'Load' || entry.name === 'Solar' ? '%' : ' kW'}
                </p>
            ))}
        </div>
    );
};

export default function DashboardOverview() {
    const [activeTab, setActiveTab] = useState('live');
    const [stats, setStats] = useState(null);
    const [sessions, setSessions] = useState([]);
    const [zones, setZones] = useState([]);
    const [insights, setInsights] = useState([]);
    const [gridData, setGridData] = useState(fallbackGridData);
    const [loadingData, setLoadingData] = useState(true);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        setLoadingData(true);
        try {
            const [statsRes, sessionsRes, zonesRes, insightsRes, gridRes] = await Promise.all([
                getDashboardStats(),
                getAllSessions({ limit: 10 }),
                getZones(),
                getAIInsights(),
                getGridMetrics(24),
            ]);

            if (statsRes) setStats(statsRes);
            if (sessionsRes.data?.length > 0) setSessions(sessionsRes.data);
            if (zonesRes.data?.length > 0) setZones(zonesRes.data);
            if (insightsRes.data?.length > 0) setInsights(insightsRes.data);
            if (gridRes.data?.length > 0) {
                setGridData(gridRes.data.map(m => ({
                    time: new Date(m.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
                    load: Math.round((m.total_load_kw / m.total_capacity_kw) * 100),
                    capacity: 100,
                    solar: Math.round((m.solar_generation_kw / m.total_capacity_kw) * 100),
                })));
            }
        } catch (err) {
            console.error('Error loading dashboard data:', err);
        }
        setLoadingData(false);
    };

    const displayStats = stats || {
        activeSessions: fallbackStats.activeSessions,
        totalChargers: fallbackStats.totalChargers,
        activeChargers: fallbackStats.activeChargers,
        totalEnergy: fallbackStats.totalEnergy,
        revenue: fallbackStats.revenue,
        avgWaitTime: fallbackStats.avgWaitTime,
    };

    const kpiCards = [
        {
            title: 'Active Sessions',
            value: displayStats.activeSessions,
            suffix: '',
            change: '+12%',
            changeType: 'up',
            icon: BatteryCharging,
            color: 'var(--primary)',
            bg: 'rgba(16, 185, 129, 0.1)',
        },
        {
            title: 'Grid Load',
            value: displayStats.activeChargers > 0 ? Math.round((displayStats.activeSessions / displayStats.totalChargers) * 100) : fallbackStats.peakLoad,
            suffix: '%',
            change: '-3%',
            changeType: 'down',
            icon: Zap,
            color: 'var(--warning)',
            bg: 'rgba(245, 158, 11, 0.1)',
        },
        {
            title: 'Energy Today',
            value: displayStats.totalEnergy,
            suffix: ' kWh',
            change: '+8%',
            changeType: 'up',
            icon: Activity,
            color: 'var(--info)',
            bg: 'rgba(59, 130, 246, 0.1)',
        },
        {
            title: 'Revenue Today',
            value: '₹' + displayStats.revenue.toLocaleString('en-IN'),
            suffix: '',
            change: '+15%',
            changeType: 'up',
            icon: DollarSign,
            color: 'var(--accent)',
            bg: 'rgba(99, 102, 241, 0.1)',
        },
        {
            title: 'Avg Wait Time',
            value: displayStats.avgWaitTime,
            suffix: ' min',
            change: '-22%',
            changeType: 'down',
            icon: Clock,
            color: 'var(--primary-light)',
            bg: 'rgba(52, 211, 153, 0.1)',
        },
        {
            title: 'Chargers',
            value: `${displayStats.activeChargers}/${displayStats.totalChargers}`,
            suffix: '',
            change: '—',
            changeType: 'up',
            icon: Leaf,
            color: '#14b8a6',
            bg: 'rgba(20, 184, 166, 0.1)',
        },
    ];

    const displayZones = zones.length > 0 ? zones.map(z => ({
        id: z.id,
        name: z.name,
        totalStations: z.total_stations,
        activeStations: z.total_stations, // TODO: count from stations table
        availableStations: 0,
        maxCapacity: Number(z.max_capacity_kw),
        currentLoad: Number(z.max_capacity_kw) * 0.7, // placeholder
        chargerType: z.charger_type,
        pricePerKwh: Number(z.price_per_kwh),
    })) : fallbackZones;

    const displayInsights = insights.length > 0 ? insights.map(i => ({
        id: i.id,
        type: i.type,
        title: i.title,
        description: i.description,
        impact: i.impact,
        savings: i.estimated_savings || '',
    })) : fallbackInsights;

    const displaySessions = sessions.length > 0 ? sessions.filter(s => s.status === 'charging').map(s => ({
        id: s.session_code,
        vehicle: s.vehicles?.make_model || 'Unknown',
        station: s.charging_stations?.station_code || '—',
        customerName: s.vehicles?.owner_name || '',
        currentCharge: Number(s.current_charge_percent) || 0,
        energyDelivered: Number(s.energy_delivered_kwh) || 0,
        status: s.status,
    })) : [];

    return (
        <div className={styles.dashboard}>
            {/* Page Header */}
            <div className={styles.pageHeader}>
                <div>
                    <h1 className={styles.pageTitle}>Dashboard</h1>
                    <p className={styles.pageSubtitle}>Real-time monitoring & system overview</p>
                </div>
                <div className={styles.headerActions}>
                    <div className={styles.liveIndicator}>
                        <span className={styles.liveDot} />
                        {loadingData ? 'Loading...' : 'Live'}
                    </div>
                    <span className={styles.lastUpdate}>Last updated: Just now</span>
                </div>
            </div>

            {/* KPI Cards */}
            <div className={styles.kpiGrid}>
                {kpiCards.map((card, index) => (
                    <div key={card.title} className={styles.kpiCard} style={{ animationDelay: `${index * 0.05}s` }}>
                        <div className={styles.kpiHeader}>
                            <span className={styles.kpiTitle}>{card.title}</span>
                            <div className={styles.kpiIcon} style={{ background: card.bg, color: card.color }}>
                                <card.icon size={16} />
                            </div>
                        </div>
                        <div className={styles.kpiValue}>
                            {typeof card.value === 'number' ? card.value.toLocaleString() : card.value}{card.suffix}
                        </div>
                        <div className={styles.kpiChange}>
                            {card.changeType === 'up' ? (
                                <ArrowUpRight size={14} className={styles.changeUp} />
                            ) : (
                                <ArrowDownRight size={14} className={styles.changeDown} />
                            )}
                            <span className={card.changeType === 'up' ? styles.changeUp : styles.changeDown}>
                                {card.change}
                            </span>
                            <span className={styles.changeLabel}>vs last week</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Main Grid */}
            <div className={styles.mainGrid}>
                {/* Grid Load Chart */}
                <div className={`card ${styles.chartCard}`}>
                    <div className={styles.cardHeader}>
                        <div>
                            <h3 className={styles.cardTitle}>Grid Load Overview</h3>
                            <p className={styles.cardSubtitle}>Real-time energy consumption vs capacity</p>
                        </div>
                        <div className={styles.chartTabs}>
                            {['live', 'today', 'week'].map(tab => (
                                <button
                                    key={tab}
                                    className={`${styles.chartTab} ${activeTab === tab ? styles.chartTabActive : ''}`}
                                    onClick={() => setActiveTab(tab)}
                                >
                                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className={styles.chartContainer}>
                        <ResponsiveContainer width="100%" height={280}>
                            <AreaChart data={gridData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                                <defs>
                                    <linearGradient id="loadGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                                        <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="solarGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.3} />
                                        <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                <XAxis dataKey="time" stroke="#475569" fontSize={12} tickLine={false} />
                                <YAxis stroke="#475569" fontSize={12} tickLine={false} unit="%" />
                                <Tooltip content={<CustomTooltip />} />
                                <Area type="monotone" dataKey="load" name="Load" stroke="#10b981" fill="url(#loadGradient)" strokeWidth={2} />
                                <Area type="monotone" dataKey="solar" name="Solar" stroke="#f59e0b" fill="url(#solarGradient)" strokeWidth={2} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Energy Distribution */}
                <div className={`card ${styles.chartCard}`}>
                    <div className={styles.cardHeader}>
                        <div>
                            <h3 className={styles.cardTitle}>Energy Distribution</h3>
                            <p className={styles.cardSubtitle}>By parking zone</p>
                        </div>
                    </div>
                    <div className={styles.pieContainer}>
                        <ResponsiveContainer width="100%" height={200}>
                            <PieChart>
                                <Pie data={energyDistribution} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="value">
                                    {energyDistribution.map((entry, index) => (
                                        <Cell key={index} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className={styles.pieLegend}>
                            {energyDistribution.map((entry) => (
                                <div key={entry.name} className={styles.legendItem}>
                                    <span className={styles.legendDot} style={{ background: entry.color }} />
                                    <span className={styles.legendLabel}>{entry.name}</span>
                                    <span className={styles.legendValue}>{entry.value}%</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Zone Status + Active Sessions */}
            <div className={styles.bottomGrid}>
                {/* Parking Zones */}
                <div className={`card ${styles.zonesCard}`}>
                    <div className={styles.cardHeader}>
                        <div>
                            <h3 className={styles.cardTitle}>Parking Zones</h3>
                            <p className={styles.cardSubtitle}>Station utilization by zone</p>
                        </div>
                    </div>
                    <div className={styles.zonesList}>
                        {displayZones.map((zone) => {
                            const loadPercent = Math.round((zone.currentLoad / zone.maxCapacity) * 100);
                            const status = getLoadStatus(loadPercent);
                            return (
                                <div key={zone.id} className={styles.zoneItem}>
                                    <div className={styles.zoneInfo}>
                                        <div className={styles.zoneHeader}>
                                            <span className={styles.zoneName}>{zone.name}</span>
                                            <span className={`badge badge-${status.class === 'active' ? 'success' : status.class}`}>
                                                {status.label}
                                            </span>
                                        </div>
                                        <div className={styles.zoneStats}>
                                            <span>{zone.totalStations} stations</span>
                                            <span>{zone.chargerType}</span>
                                            <span>₹{zone.pricePerKwh}/kWh</span>
                                        </div>
                                    </div>
                                    <div className={styles.zoneLoad}>
                                        <div className={styles.zoneLoadHeader}>
                                            <span className={styles.zoneLoadLabel}>Load</span>
                                            <span className={styles.zoneLoadValue}>{loadPercent}%</span>
                                        </div>
                                        <div className="progress-bar">
                                            <div className="progress-bar-fill" style={{
                                                width: `${loadPercent}%`,
                                                background: loadPercent >= 90 ? 'var(--danger)' :
                                                    loadPercent >= 75 ? 'var(--warning)' :
                                                        'linear-gradient(90deg, var(--primary), var(--primary-light))'
                                            }} />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Active Sessions */}
                <div className={`card ${styles.sessionsCard}`}>
                    <div className={styles.cardHeader}>
                        <div>
                            <h3 className={styles.cardTitle}>Active Sessions</h3>
                            <p className={styles.cardSubtitle}>{displaySessions.length} vehicles charging</p>
                        </div>
                        <a href="/dashboard/sessions" className={styles.viewAll}>
                            View All <ArrowUpRight size={14} />
                        </a>
                    </div>
                    <div className={styles.sessionsList}>
                        {displaySessions.length > 0 ? displaySessions.slice(0, 5).map((session) => (
                            <div key={session.id} className={styles.sessionItem}>
                                <div className={styles.sessionLeft}>
                                    <div className={styles.sessionIcon}>
                                        <BatteryCharging size={16} />
                                    </div>
                                    <div>
                                        <div className={styles.sessionVehicle}>{session.vehicle}</div>
                                        <div className={styles.sessionMeta}>
                                            {session.id} · Station {session.station}
                                        </div>
                                    </div>
                                </div>
                                <div className={styles.sessionRight}>
                                    <div className={styles.sessionCharge}>
                                        <span className={styles.sessionPercent}>{session.currentCharge}%</span>
                                        <div className="progress-bar" style={{ width: '80px' }}>
                                            <div className="progress-bar-fill" style={{ width: `${session.currentCharge}%` }} />
                                        </div>
                                    </div>
                                    <span className={styles.sessionEnergy}>{session.energyDelivered} kWh</span>
                                </div>
                            </div>
                        )) : (
                            <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-tertiary)' }}>
                                No active charging sessions
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* AI Insights */}
            <div className={`card ${styles.insightsCard}`}>
                <div className={styles.cardHeader}>
                    <div className={styles.insightsTitle}>
                        <Sparkles size={18} className={styles.sparkleIcon} />
                        <div>
                            <h3 className={styles.cardTitle}>AI Insights</h3>
                            <p className={styles.cardSubtitle}>Intelligent recommendations from GridWise AI</p>
                        </div>
                    </div>
                </div>
                <div className={styles.insightsGrid}>
                    {displayInsights.map((insight) => (
                        <div key={insight.id} className={styles.insightItem}>
                            <div className={styles.insightHeader}>
                                <span className={`badge ${insight.impact === 'high' ? 'badge-danger' : 'badge-warning'}`}>
                                    {insight.impact} impact
                                </span>
                                <span className={styles.insightSavings}>{insight.savings}</span>
                            </div>
                            <h4 className={styles.insightTitle}>{insight.title}</h4>
                            <p className={styles.insightDesc}>{insight.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
