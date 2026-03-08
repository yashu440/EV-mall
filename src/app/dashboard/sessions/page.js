'use client';

import { useState, useEffect } from 'react';
import {
    Search, Filter, Download, BatteryCharging, Eye,
    MoreHorizontal, Clock, Zap, ArrowUpDown,
    CheckCircle2, AlertCircle, Loader, Pause
} from 'lucide-react';
import { getAllSessions, updateSession } from '@/lib/database';
import { chargingSessions as fallbackSessions } from '@/lib/mock-data';
import { formatTime, formatCurrency, getStatusBadgeClass, getPriorityBadgeClass } from '@/lib/utils';
import styles from './page.module.css';

const statusFilters = ['All', 'Charging', 'Completed', 'Queued'];

const statusIcons = {
    charging: <Loader size={12} className={styles.spinIcon} />,
    completed: <CheckCircle2 size={12} />,
    queued: <Clock size={12} />,
    error: <AlertCircle size={12} />,
};

export default function SessionsPage() {
    const [filter, setFilter] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedSession, setSelectedSession] = useState(null);
    const [sessions, setSessions] = useState([]);
    const [loadingData, setLoadingData] = useState(true);

    useEffect(() => {
        loadSessions();
    }, []);

    const loadSessions = async () => {
        setLoadingData(true);
        const { data } = await getAllSessions();
        if (data && data.length > 0) {
            // Map DB sessions to display format
            setSessions(data.map(s => ({
                id: s.session_code,
                dbId: s.id,
                vehicle: s.vehicles?.make_model || 'Unknown',
                licensePlate: s.vehicles?.license_plate || '',
                zone: s.parking_zones?.zone_code || '—',
                station: s.charging_stations?.station_code || '—',
                startTime: s.start_time,
                estimatedEnd: s.estimated_end_time,
                currentCharge: Number(s.current_charge_percent) || 0,
                targetCharge: Number(s.target_charge_percent) || 0,
                energyDelivered: Number(s.energy_delivered_kwh) || 0,
                cost: Number(s.total_cost) || 0,
                status: s.status,
                priority: s.priority,
                customerName: s.vehicles?.owner_name || '',
                shoppingDuration: s.shopping_duration_minutes ? `${Math.round(s.shopping_duration_minutes / 60)}h ${s.shopping_duration_minutes % 60}m` : '—',
            })));
        } else {
            // Use fallback mock data
            setSessions(fallbackSessions);
        }
        setLoadingData(false);
    };

    const filteredSessions = sessions.filter(session => {
        const matchesFilter = filter === 'All' || session.status.toLowerCase() === filter.toLowerCase();
        const matchesSearch = searchQuery === '' ||
            session.vehicle.toLowerCase().includes(searchQuery.toLowerCase()) ||
            session.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            session.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            session.licensePlate.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    const handleStopSession = async (session) => {
        if (!session.dbId) return;
        await updateSession(session.dbId, {
            status: 'completed',
            actual_end_time: new Date().toISOString(),
        });
        setSelectedSession(null);
        loadSessions();
    };

    return (
        <div className={styles.sessions}>
            {/* Page Header */}
            <div className={styles.pageHeader}>
                <div>
                    <h1 className={styles.pageTitle}>Charging Sessions</h1>
                    <p className={styles.pageSubtitle}>
                        {loadingData ? 'Loading...' : `${sessions.length} total sessions · ${sessions.filter(s => s.status === 'charging').length} active`}
                    </p>
                </div>
                <div className={styles.headerActions}>
                    <button className="btn btn-secondary btn-sm" onClick={loadSessions}>
                        <Zap size={14} />
                        Refresh
                    </button>
                    <button className="btn btn-secondary btn-sm">
                        <Download size={14} />
                        Export CSV
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className={styles.filtersBar}>
                <div className={styles.searchBox}>
                    <Search size={16} />
                    <input
                        type="text"
                        placeholder="Search by vehicle, ID, customer..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={styles.searchInput}
                    />
                </div>
                <div className={styles.statusFilters}>
                    {statusFilters.map(f => (
                        <button
                            key={f}
                            className={`${styles.filterBtn} ${filter === f ? styles.filterActive : ''}`}
                            onClick={() => setFilter(f)}
                        >
                            {f}
                            {f !== 'All' && (
                                <span className={styles.filterCount}>
                                    {sessions.filter(s => s.status.toLowerCase() === f.toLowerCase()).length}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Sessions Table */}
            <div className="table-container">
                <table className="table">
                    <thead>
                        <tr>
                            <th>Session ID</th>
                            <th>Vehicle</th>
                            <th>Customer</th>
                            <th>Zone / Station</th>
                            <th>Status</th>
                            <th>Priority</th>
                            <th>Charge</th>
                            <th>Energy</th>
                            <th>Cost</th>
                            <th>Duration</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredSessions.map((session) => (
                            <tr key={session.id} onClick={() => setSelectedSession(session.id === selectedSession ? null : session.id)}>
                                <td>
                                    <span className={styles.sessionId}>{session.id}</span>
                                </td>
                                <td>
                                    <div className={styles.vehicleCell}>
                                        <span className={styles.vehicleName}>{session.vehicle}</span>
                                        <span className={styles.vehiclePlate}>{session.licensePlate}</span>
                                    </div>
                                </td>
                                <td className={styles.customerName}>{session.customerName}</td>
                                <td>
                                    <span className={styles.zoneStation}>
                                        Zone {session.zone} · {session.station}
                                    </span>
                                </td>
                                <td>
                                    <span className={`badge ${getStatusBadgeClass(session.status)}`}>
                                        {statusIcons[session.status]}
                                        {session.status}
                                    </span>
                                </td>
                                <td>
                                    <span className={`badge ${getPriorityBadgeClass(session.priority)}`}>
                                        {session.priority}
                                    </span>
                                </td>
                                <td>
                                    <div className={styles.chargeCell}>
                                        <span className={styles.chargePercent}>
                                            {session.currentCharge}%
                                        </span>
                                        <div className="progress-bar" style={{ width: '60px' }}>
                                            <div className="progress-bar-fill" style={{ width: `${session.currentCharge}%` }} />
                                        </div>
                                        <span className={styles.chargeTarget}>→{session.targetCharge}%</span>
                                    </div>
                                </td>
                                <td>
                                    <span className={styles.energyValue}>{session.energyDelivered} kWh</span>
                                </td>
                                <td>
                                    <span className={styles.costValue}>{formatCurrency(session.cost)}</span>
                                </td>
                                <td>
                                    <span className={styles.durationValue}>{session.shoppingDuration}</span>
                                </td>
                                <td>
                                    <button className={styles.moreBtn} aria-label="More options">
                                        <MoreHorizontal size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {filteredSessions.length === 0 && (
                <div className={styles.emptyState}>
                    <BatteryCharging size={48} />
                    <h3>No sessions found</h3>
                    <p>Try adjusting your search or filter criteria.</p>
                </div>
            )}

            {/* Session Detail Drawer */}
            {selectedSession && (() => {
                const session = sessions.find(s => s.id === selectedSession);
                if (!session) return null;
                return (
                    <div className={styles.drawer}>
                        <div className={styles.drawerOverlay} onClick={() => setSelectedSession(null)} />
                        <div className={styles.drawerContent}>
                            <div className={styles.drawerHeader}>
                                <h3>Session Details</h3>
                                <button onClick={() => setSelectedSession(null)} className={styles.drawerClose}>✕</button>
                            </div>
                            <div className={styles.drawerBody}>
                                <div className={styles.detailRow}>
                                    <span className={styles.detailLabel}>Session ID</span>
                                    <span className={styles.detailValue}>{session.id}</span>
                                </div>
                                <div className={styles.detailRow}>
                                    <span className={styles.detailLabel}>Vehicle</span>
                                    <span className={styles.detailValue}>{session.vehicle}</span>
                                </div>
                                <div className={styles.detailRow}>
                                    <span className={styles.detailLabel}>License Plate</span>
                                    <span className={styles.detailValue}>{session.licensePlate}</span>
                                </div>
                                <div className={styles.detailRow}>
                                    <span className={styles.detailLabel}>Customer</span>
                                    <span className={styles.detailValue}>{session.customerName}</span>
                                </div>
                                <div className={styles.detailRow}>
                                    <span className={styles.detailLabel}>Zone / Station</span>
                                    <span className={styles.detailValue}>Zone {session.zone} · {session.station}</span>
                                </div>
                                <div className={styles.detailRow}>
                                    <span className={styles.detailLabel}>Status</span>
                                    <span className={`badge ${getStatusBadgeClass(session.status)}`}>{session.status}</span>
                                </div>
                                <div className={styles.detailRow}>
                                    <span className={styles.detailLabel}>Priority</span>
                                    <span className={`badge ${getPriorityBadgeClass(session.priority)}`}>{session.priority}</span>
                                </div>
                                <div className={styles.detailDivider} />
                                <div className={styles.detailRow}>
                                    <span className={styles.detailLabel}>Charge Progress</span>
                                    <span className={styles.detailValue}>{session.currentCharge}% → {session.targetCharge}%</span>
                                </div>
                                <div className={styles.detailProgress}>
                                    <div className="progress-bar">
                                        <div className="progress-bar-fill" style={{ width: `${session.currentCharge}%` }} />
                                    </div>
                                </div>
                                <div className={styles.detailRow}>
                                    <span className={styles.detailLabel}>Energy Delivered</span>
                                    <span className={styles.detailValue}>{session.energyDelivered} kWh</span>
                                </div>
                                <div className={styles.detailRow}>
                                    <span className={styles.detailLabel}>Cost</span>
                                    <span className={styles.detailValue}>{formatCurrency(session.cost)}</span>
                                </div>
                                <div className={styles.detailRow}>
                                    <span className={styles.detailLabel}>Shopping Duration</span>
                                    <span className={styles.detailValue}>{session.shoppingDuration}</span>
                                </div>
                                <div className={styles.detailRow}>
                                    <span className={styles.detailLabel}>Start Time</span>
                                    <span className={styles.detailValue}>{session.startTime ? formatTime(session.startTime) : '—'}</span>
                                </div>
                                <div className={styles.detailRow}>
                                    <span className={styles.detailLabel}>Est. End</span>
                                    <span className={styles.detailValue}>{session.estimatedEnd ? formatTime(session.estimatedEnd) : '—'}</span>
                                </div>
                                <div className={styles.drawerActions}>
                                    {session.status === 'charging' && (
                                        <>
                                            <button className="btn btn-secondary btn-sm">
                                                <Pause size={14} />
                                                Pause Session
                                            </button>
                                            <button className="btn btn-danger btn-sm" onClick={() => handleStopSession(session)}>
                                                Stop Session
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })()}
        </div>
    );
}
