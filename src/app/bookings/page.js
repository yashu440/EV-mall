'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    Zap, BatteryCharging, Clock, MapPin, CheckCircle2,
    ArrowRight, User, LogIn, LogOut, Home, ClipboardList,
    Calendar, DollarSign, Battery, Car, AlertCircle,
    Loader, Eye, ChevronRight
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getUserSessions } from '@/lib/database';
import styles from './page.module.css';

const statusConfig = {
    charging: { icon: Loader, color: '#10b981', bg: 'rgba(16,185,129,0.1)', label: 'Charging' },
    completed: { icon: CheckCircle2, color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', label: 'Completed' },
    queued: { icon: Clock, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', label: 'Queued' },
    cancelled: { icon: AlertCircle, color: '#ef4444', bg: 'rgba(239,68,68,0.1)', label: 'Cancelled' },
};

export default function BookingsPage() {
    const { user, profile, loading: authLoading, signOut } = useAuth();
    const router = useRouter();
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        if (user) loadSessions();
    }, [user]);

    const loadSessions = async () => {
        setLoading(true);
        const { data } = await getUserSessions(user.id);
        if (data) setSessions(data);
        setLoading(false);
    };

    const filteredSessions = sessions.filter(s => {
        if (filter === 'all') return true;
        return s.status === filter;
    });

    const stats = {
        total: sessions.length,
        active: sessions.filter(s => s.status === 'charging' || s.status === 'queued').length,
        completed: sessions.filter(s => s.status === 'completed').length,
        totalSpent: sessions.reduce((sum, s) => sum + (Number(s.total_cost) || 0), 0),
    };

    if (authLoading) {
        return (
            <div className={styles.bookingsPage}>
                <div className={styles.loadingState}>
                    <Zap size={32} style={{ color: 'var(--primary)' }} />
                    <p>Loading...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className={styles.bookingsPage}>
                <div className={styles.bgGlow} />
                <nav className={styles.topNav}>
                    <Link href="/" className={styles.logo}>
                        <div className={styles.logoIcon}><Zap size={18} /></div>
                        <span className={styles.logoText}>GridWise</span>
                    </Link>
                    <Link href="/login" className="btn btn-primary btn-sm">
                        <LogIn size={14} />
                        Login
                    </Link>
                </nav>
                <div className={styles.authRequired}>
                    <div className={styles.authIcon}>
                        <LogIn size={36} />
                    </div>
                    <h2>Login Required</h2>
                    <p>Sign in to view your booking history.</p>
                    <Link href="/login" className="btn btn-primary btn-lg">
                        <LogIn size={18} />
                        Sign In / Create Account
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.bookingsPage}>
            <div className={styles.bgGlow} />

            {/* Top Nav */}
            <nav className={styles.topNav}>
                <Link href="/" className={styles.logo}>
                    <div className={styles.logoIcon}><Zap size={18} /></div>
                    <span className={styles.logoText}>GridWise</span>
                </Link>
                <div className={styles.navRight}>
                    <Link href="/charge" className={styles.navLink}>
                        <BatteryCharging size={14} />
                        <span>New Charge</span>
                    </Link>
                    <Link href="/status" className={styles.navLink}>
                        <Eye size={14} />
                        <span>Track Session</span>
                    </Link>
                    <div className={styles.navDivider} />
                    <div className={styles.userBadge}>
                        <div className={styles.userAvatar}><User size={12} /></div>
                        <span className={styles.userNameText}>{profile?.full_name || 'User'}</span>
                    </div>
                    <button onClick={() => { signOut(); router.push('/'); }} className={styles.navLink}>
                        <LogOut size={14} />
                    </button>
                </div>
            </nav>

            <div className={styles.container}>
                {/* Header */}
                <div className={styles.header}>
                    <div className={styles.headerLeft}>
                        <div className={styles.headerBadge}>
                            <ClipboardList size={14} />
                            <span>Booking History</span>
                        </div>
                        <h1 className={styles.headerTitle}>My Bookings</h1>
                        <p className={styles.headerSubtitle}>View and manage your charging sessions</p>
                    </div>
                    <Link href="/charge" className="btn btn-primary">
                        <BatteryCharging size={16} />
                        New Charge Request
                    </Link>
                </div>

                {/* Stats Cards */}
                <div className={styles.statsGrid}>
                    <div className={styles.statCard}>
                        <div className={styles.statIcon} style={{ background: 'rgba(99,102,241,0.1)', color: '#6366f1' }}>
                            <ClipboardList size={18} />
                        </div>
                        <div>
                            <span className={styles.statValue}>{stats.total}</span>
                            <span className={styles.statLabel}>Total Bookings</span>
                        </div>
                    </div>
                    <div className={styles.statCard}>
                        <div className={styles.statIcon} style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>
                            <BatteryCharging size={18} />
                        </div>
                        <div>
                            <span className={styles.statValue}>{stats.active}</span>
                            <span className={styles.statLabel}>Active</span>
                        </div>
                    </div>
                    <div className={styles.statCard}>
                        <div className={styles.statIcon} style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}>
                            <CheckCircle2 size={18} />
                        </div>
                        <div>
                            <span className={styles.statValue}>{stats.completed}</span>
                            <span className={styles.statLabel}>Completed</span>
                        </div>
                    </div>
                    <div className={styles.statCard}>
                        <div className={styles.statIcon} style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b' }}>
                            <DollarSign size={18} />
                        </div>
                        <div>
                            <span className={styles.statValue}>₹{stats.totalSpent.toLocaleString('en-IN')}</span>
                            <span className={styles.statLabel}>Total Spent</span>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className={styles.filterBar}>
                    {['all', 'charging', 'queued', 'completed'].map(f => (
                        <button
                            key={f}
                            className={`${styles.filterBtn} ${filter === f ? styles.filterActive : ''}`}
                            onClick={() => setFilter(f)}
                        >
                            {f.charAt(0).toUpperCase() + f.slice(1)}
                            {f !== 'all' && (
                                <span className={styles.filterCount}>
                                    {sessions.filter(s => s.status === f).length}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Sessions List */}
                {loading ? (
                    <div className={styles.loadingState}>
                        <Loader size={24} className={styles.spin} />
                        <p>Loading your bookings...</p>
                    </div>
                ) : filteredSessions.length > 0 ? (
                    <div className={styles.sessionsList}>
                        {filteredSessions.map(session => {
                            const config = statusConfig[session.status] || statusConfig.queued;
                            const StatusIcon = config.icon;
                            return (
                                <Link
                                    key={session.id}
                                    href={`/status?session=${session.session_code}`}
                                    className={styles.sessionCard}
                                >
                                    <div className={styles.sessionLeft}>
                                        <div className={styles.sessionStatus} style={{ background: config.bg, color: config.color }}>
                                            <StatusIcon size={16} className={session.status === 'charging' ? styles.spin : ''} />
                                        </div>
                                        <div className={styles.sessionInfo}>
                                            <div className={styles.sessionId}>{session.session_code}</div>
                                            <div className={styles.sessionVehicle}>
                                                <Car size={12} />
                                                {session.vehicles?.make_model || 'Vehicle'}
                                            </div>
                                            <div className={styles.sessionMeta}>
                                                <span>
                                                    <Calendar size={10} />
                                                    {new Date(session.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                </span>
                                                <span>
                                                    <MapPin size={10} />
                                                    {session.parking_zones?.name || 'Zone'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className={styles.sessionRight}>
                                        <div className={styles.sessionCost}>
                                            ₹{Number(session.total_cost || 0).toLocaleString('en-IN')}
                                        </div>
                                        <div className={styles.sessionBadge} style={{ background: config.bg, color: config.color }}>
                                            {config.label}
                                        </div>
                                        <ChevronRight size={16} className={styles.sessionArrow} />
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                ) : (
                    <div className={styles.emptyState}>
                        <div className={styles.emptyIcon}>
                            <ClipboardList size={40} />
                        </div>
                        <h3>No Bookings Found</h3>
                        <p>
                            {filter === 'all'
                                ? "You haven't made any charging requests yet."
                                : `No ${filter} sessions found.`
                            }
                        </p>
                        <Link href="/charge" className="btn btn-primary">
                            <BatteryCharging size={16} />
                            Book Your First Charge
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
