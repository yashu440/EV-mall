'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
    Zap, Battery, BatteryCharging, Clock, MapPin,
    CheckCircle2, ArrowRight, Search, Sparkles,
    Car, DollarSign, Activity, Wifi, LogIn
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getSessionByCode, getUserSessions } from '@/lib/database';
import styles from './page.module.css';

function StatusPageContent() {
    const { user, loading: authLoading } = useAuth();
    const searchParams = useSearchParams();
    const [sessionId, setSessionId] = useState('');
    const [sessionData, setSessionData] = useState(null);
    const [userSessions, setUserSessions] = useState([]);
    const [searching, setSearching] = useState(false);
    const [notFound, setNotFound] = useState(false);
    const [chargeLevel, setChargeLevel] = useState(0);

    // Load session from URL param or user's sessions
    useEffect(() => {
        const sessionParam = searchParams.get('session');
        if (sessionParam) {
            setSessionId(sessionParam);
            searchSession(sessionParam);
        }
    }, [searchParams]);

    // Load user's sessions
    useEffect(() => {
        if (user) {
            loadUserSessions();
        }
    }, [user]);

    const loadUserSessions = async () => {
        if (!user) return;
        const { data } = await getUserSessions(user.id);
        if (data) setUserSessions(data);
    };

    const searchSession = async (code) => {
        setSearching(true);
        setNotFound(false);
        setSessionData(null);

        const { data, error } = await getSessionByCode(code || sessionId);
        setSearching(false);

        if (error || !data) {
            setNotFound(true);
            return;
        }

        setSessionData(data);
        setChargeLevel(Number(data.current_charge_percent) || 0);
    };

    // Simulate live charging
    useEffect(() => {
        if (!sessionData || sessionData.status !== 'charging') return;
        const target = Number(sessionData.target_charge_percent) || 100;
        const interval = setInterval(() => {
            setChargeLevel(prev => {
                if (prev >= target) return target;
                return prev + 1;
            });
        }, 3000);
        return () => clearInterval(interval);
    }, [sessionData]);

    const circumference = 2 * Math.PI * 70;
    const dashOffset = circumference - (chargeLevel / 100) * circumference;

    const getTimeline = () => {
        if (!sessionData) return [];
        const lines = [
            { time: new Date(sessionData.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }), event: 'Charging request submitted', status: 'done' },
        ];
        if (sessionData.start_time) {
            lines.push({
                time: new Date(sessionData.start_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
                event: `AI assigned Station ${sessionData.charging_stations?.station_code || ''} (${sessionData.parking_zones?.name || ''})`,
                status: 'done'
            });
            lines.push({
                time: new Date(sessionData.start_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
                event: 'Charging session started',
                status: sessionData.status === 'queued' ? 'pending' : 'done'
            });
        }
        if (sessionData.status === 'charging') {
            lines.push({ time: 'Now', event: `${chargeLevel}% charge – Current`, status: 'active' });
        }
        if (sessionData.estimated_end_time) {
            lines.push({
                time: `~${new Date(sessionData.estimated_end_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`,
                event: `Estimated completion (${sessionData.target_charge_percent}%)`,
                status: sessionData.status === 'completed' ? 'done' : 'pending'
            });
        }
        if (sessionData.status === 'completed') {
            lines.push({ time: sessionData.actual_end_time ? new Date(sessionData.actual_end_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : 'Done', event: 'Charging completed!', status: 'done' });
        }
        return lines;
    };

    return (
        <div className={styles.statusPage}>
            <div className={styles.bgGlow} />

            {/* Top Nav */}
            <nav className={styles.topNav}>
                <Link href="/" className={styles.logo}>
                    <div className={styles.logoIcon}>
                        <Zap size={18} />
                    </div>
                    <span className={styles.logoText}>GridWise</span>
                </Link>
                <div style={{ display: 'flex', gap: '8px' }}>
                    {user ? (
                        <Link href="/charge" className="btn btn-ghost btn-sm">
                            <BatteryCharging size={14} />
                            New Charge
                        </Link>
                    ) : (
                        <Link href="/login" className="btn btn-ghost btn-sm">
                            <LogIn size={14} />
                            Sign In
                        </Link>
                    )}
                </div>
            </nav>

            <div className={styles.statusContainer}>
                {/* Search */}
                <div className={styles.searchSection}>
                    <h1 className={styles.searchTitle}>Track Your Charging Session</h1>
                    <div className={styles.searchBox}>
                        <Search size={18} />
                        <input
                            className={styles.searchInput}
                            placeholder="Enter your Session ID (e.g., CS-2847)"
                            value={sessionId}
                            onChange={(e) => setSessionId(e.target.value.toUpperCase())}
                        />
                        <button
                            className="btn btn-primary btn-sm"
                            onClick={() => searchSession()}
                            disabled={searching || !sessionId}
                        >
                            {searching ? 'Searching...' : 'Track'}
                        </button>
                    </div>
                </div>

                {/* User's recent sessions */}
                {user && userSessions.length > 0 && !sessionData && !notFound && (
                    <div style={{ marginBottom: '24px' }}>
                        <h3 style={{ color: 'var(--text-primary)', marginBottom: '12px', fontSize: '1rem' }}>Your Recent Sessions</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {userSessions.slice(0, 5).map(s => (
                                <button
                                    key={s.id}
                                    onClick={() => { setSessionId(s.session_code); searchSession(s.session_code); }}
                                    style={{
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                        background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                                        borderRadius: '8px', padding: '12px 16px', cursor: 'pointer',
                                        color: 'var(--text-primary)', textAlign: 'left'
                                    }}
                                >
                                    <div>
                                        <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{s.session_code}</div>
                                        <div style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem' }}>
                                            {s.vehicles?.make_model || 'Vehicle'} · {new Date(s.created_at).toLocaleDateString('en-IN')}
                                        </div>
                                    </div>
                                    <span className={`badge badge-${s.status === 'charging' ? 'primary' : s.status === 'completed' ? 'info' : s.status === 'queued' ? 'warning' : ''}`}>
                                        {s.status}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {sessionData ? (
                    <div className={styles.sessionContent}>
                        {/* Charging Visualization */}
                        <div className={styles.chargeVisual}>
                            <div className={styles.circleContainer}>
                                <svg className={styles.circleSvg} viewBox="0 0 160 160">
                                    <circle cx="80" cy="80" r="70" fill="none" stroke="var(--bg-tertiary)" strokeWidth="8" />
                                    <circle cx="80" cy="80" r="70" fill="none" stroke="url(#chargeGradient)"
                                        strokeWidth="8" strokeLinecap="round"
                                        strokeDasharray={circumference} strokeDashoffset={dashOffset}
                                        transform="rotate(-90 80 80)" className={styles.chargeCircle}
                                    />
                                    <defs>
                                        <linearGradient id="chargeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                            <stop offset="0%" stopColor="var(--primary)" />
                                            <stop offset="100%" stopColor="var(--primary-light)" />
                                        </linearGradient>
                                    </defs>
                                </svg>
                                <div className={styles.circleContent}>
                                    <BatteryCharging size={24} className={styles.circleIcon} />
                                    <span className={styles.circlePercent}>{chargeLevel}%</span>
                                    <span className={styles.circleLabel}>{sessionData.status}</span>
                                </div>
                            </div>
                            {sessionData.status === 'charging' && (
                                <div className={styles.liveIndicator}>
                                    <div className={styles.liveDot} />
                                    <span>Live</span>
                                    <Wifi size={12} />
                                </div>
                            )}
                        </div>

                        {/* Info Cards */}
                        <div className={styles.infoGrid}>
                            <div className={styles.infoCard}>
                                <Car size={16} className={styles.infoIcon} />
                                <div>
                                    <span className={styles.infoLabel}>Vehicle</span>
                                    <span className={styles.infoValue}>{sessionData.vehicles?.make_model || 'N/A'}</span>
                                    <span className={styles.infoMeta}>{sessionData.vehicles?.license_plate || ''}</span>
                                </div>
                            </div>
                            <div className={styles.infoCard}>
                                <MapPin size={16} className={styles.infoIcon} />
                                <div>
                                    <span className={styles.infoLabel}>Location</span>
                                    <span className={styles.infoValue}>{sessionData.parking_zones?.name || 'Assigned'}</span>
                                    <span className={styles.infoMeta}>Station {sessionData.charging_stations?.station_code || ''}</span>
                                </div>
                            </div>
                            <div className={styles.infoCard}>
                                <Clock size={16} className={styles.infoIcon} />
                                <div>
                                    <span className={styles.infoLabel}>Started</span>
                                    <span className={styles.infoValue}>{sessionData.start_time ? new Date(sessionData.start_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : 'Queued'}</span>
                                    <span className={styles.infoMeta}>{sessionData.estimated_end_time ? `Est. end: ${new Date(sessionData.estimated_end_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}` : ''}</span>
                                </div>
                            </div>
                            <div className={styles.infoCard}>
                                <Activity size={16} className={styles.infoIcon} />
                                <div>
                                    <span className={styles.infoLabel}>Charging Speed</span>
                                    <span className={styles.infoValue}>{sessionData.charging_stations?.max_power_kw ? `${sessionData.charging_stations.max_power_kw} kW` : 'N/A'}</span>
                                    <span className={styles.infoMeta}>{Number(sessionData.energy_delivered_kwh || 0).toFixed(1)} kWh delivered</span>
                                </div>
                            </div>
                            <div className={styles.infoCard}>
                                <DollarSign size={16} className={styles.infoIcon} />
                                <div>
                                    <span className={styles.infoLabel}>Current Cost</span>
                                    <span className={styles.infoValue}>₹{Number(sessionData.total_cost || 0).toLocaleString('en-IN')}</span>
                                    <span className={styles.infoMeta}>{sessionData.parking_zones?.price_per_kwh ? `Rate: ₹${sessionData.parking_zones.price_per_kwh}/kWh` : ''}</span>
                                </div>
                            </div>
                            <div className={styles.infoCard}>
                                <Battery size={16} className={styles.infoIcon} />
                                <div>
                                    <span className={styles.infoLabel}>Charge Progress</span>
                                    <span className={styles.infoValue}>{chargeLevel}% → {sessionData.target_charge_percent}%</span>
                                    <span className={styles.infoMeta}>{Math.max(0, Number(sessionData.target_charge_percent) - chargeLevel)}% remaining</span>
                                </div>
                            </div>
                        </div>

                        {/* Timeline */}
                        <div className={styles.timelineSection}>
                            <h3 className={styles.timelineTitle}>Session Timeline</h3>
                            <div className={styles.timeline}>
                                {getTimeline().map((item, index) => (
                                    <div key={index} className={`${styles.timelineItem} ${styles[`timeline${item.status.charAt(0).toUpperCase() + item.status.slice(1)}`]}`}>
                                        <div className={styles.timelineDot}>
                                            {item.status === 'done' ? <CheckCircle2 size={14} /> :
                                                item.status === 'active' ? <BatteryCharging size={14} /> :
                                                    <Clock size={14} />}
                                        </div>
                                        <div className={styles.timelineContent}>
                                            <span className={styles.timelineTime}>{item.time}</span>
                                            <span className={styles.timelineEvent}>{item.event}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ) : notFound ? (
                    <div className={styles.notFound}>
                        <Search size={48} />
                        <h3>Session Not Found</h3>
                        <p>No session found with ID &ldquo;{sessionId}&rdquo;. Please check your session ID and try again.</p>
                        <Link href="/charge" className="btn btn-primary">
                            Request a New Charge
                        </Link>
                    </div>
                ) : null}
            </div>
        </div>
    );
}

export default function StatusPage() {
    return (
        <Suspense fallback={
            <div className={styles.statusPage}>
                <div className={styles.bgGlow} />
                <nav className={styles.topNav}>
                    <Link href="/" className={styles.logo}>
                        <div className={styles.logoIcon}>
                            <Zap size={18} />
                        </div>
                        <span className={styles.logoText}>GridWise</span>
                    </Link>
                </nav>
                <div className={styles.statusContainer}>
                    <div className={styles.searchSection}>
                        <h1 className={styles.searchTitle}>Loading...</h1>
                    </div>
                </div>
            </div>
        }>
            <StatusPageContent />
        </Suspense>
    );
}
