'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
    LayoutDashboard, Activity, BarChart3, Settings,
    Zap, ChevronLeft, ChevronRight, Battery,
    Bell, Search, User, LogOut, Grid3X3,
    BatteryCharging, Menu, X, Shield
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import styles from './layout.module.css';

const sidebarLinks = [
    { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
    { href: '/dashboard/sessions', label: 'Sessions', icon: BatteryCharging },
    { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
    { href: '/dashboard/grid', label: 'Grid Manager', icon: Grid3X3 },
    { href: '/dashboard/settings', label: 'Settings', icon: Settings },
];

export default function DashboardLayout({ children }) {
    const pathname = usePathname();
    const router = useRouter();
    const { user, profile, loading, isAdmin, signOut } = useAuth();
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [notifOpen, setNotifOpen] = useState(false);

    // Redirect if not admin
    useEffect(() => {
        if (!loading && (!user || !isAdmin)) {
            router.push('/login');
        }
    }, [user, isAdmin, loading, router]);

    const handleSignOut = async () => {
        await signOut();
        router.push('/');
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', color: 'var(--text-secondary)' }}>
                <div style={{ textAlign: 'center' }}>
                    <Zap size={32} style={{ color: 'var(--primary)', marginBottom: '12px' }} />
                    <p>Loading...</p>
                </div>
            </div>
        );
    }

    if (!user || !isAdmin) {
        return null;
    }

    return (
        <div className={styles.dashboardLayout}>
            {/* Mobile overlay */}
            {mobileOpen && (
                <div className={styles.overlay} onClick={() => setMobileOpen(false)} />
            )}

            {/* Sidebar */}
            <aside className={`${styles.sidebar} ${collapsed ? styles.collapsed : ''} ${mobileOpen ? styles.mobileOpen : ''}`}>
                <div className={styles.sidebarHeader}>
                    <Link href="/" className={styles.logo}>
                        <div className={styles.logoIcon}>
                            <Zap size={18} />
                        </div>
                        {!collapsed && <span className={styles.logoText}>GridWise</span>}
                    </Link>
                    <button
                        className={styles.collapseBtn}
                        onClick={() => setCollapsed(!collapsed)}
                        aria-label="Toggle sidebar"
                    >
                        {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                    </button>
                </div>

                <nav className={styles.sidebarNav}>
                    <div className={styles.navSection}>
                        {!collapsed && <span className={styles.navLabel}>Admin Panel</span>}
                        {sidebarLinks.map((link) => {
                            const isActive = pathname === link.href;
                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={`${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
                                    onClick={() => setMobileOpen(false)}
                                    title={collapsed ? link.label : undefined}
                                >
                                    <link.icon size={20} />
                                    {!collapsed && <span>{link.label}</span>}
                                    {isActive && <div className={styles.activeIndicator} />}
                                </Link>
                            );
                        })}
                    </div>

                    <div className={styles.navSection}>
                        {!collapsed && <span className={styles.navLabel}>Quick Links</span>}
                        <Link href="/charge" className={styles.navItem} title={collapsed ? 'New Charge' : undefined}>
                            <Battery size={20} />
                            {!collapsed && <span>New Charge</span>}
                        </Link>
                        <button className={styles.navItem} onClick={handleSignOut} title={collapsed ? 'Sign Out' : undefined}>
                            <LogOut size={20} />
                            {!collapsed && <span>Sign Out</span>}
                        </button>
                    </div>
                </nav>

                {!collapsed && (
                    <div className={styles.sidebarFooter}>
                        <div className={styles.systemStatus}>
                            <div className={styles.statusDot} />
                            <div>
                                <span className={styles.statusLabel}>System Status</span>
                                <span className={styles.statusValue}>All Systems Operational</span>
                            </div>
                        </div>
                    </div>
                )}
            </aside>

            {/* Main Content */}
            <div className={`${styles.mainArea} ${collapsed ? styles.mainAreaExpanded : ''}`}>
                {/* Top Bar */}
                <header className={styles.topbar}>
                    <div className={styles.topbarLeft}>
                        <button
                            className={styles.mobileMenuBtn}
                            onClick={() => setMobileOpen(true)}
                            aria-label="Open menu"
                        >
                            <Menu size={20} />
                        </button>
                        <div className={styles.searchBox}>
                            <Search size={16} />
                            <input type="text" placeholder="Search sessions, stations, zones..." className={styles.searchInput} />
                        </div>
                    </div>
                    <div className={styles.topbarRight}>
                        <div className={styles.topbarNotif}>
                            <button
                                className={styles.iconBtn}
                                onClick={() => setNotifOpen(!notifOpen)}
                                aria-label="Notifications"
                            >
                                <Bell size={18} />
                                <span className={styles.notifDot} />
                            </button>
                            {notifOpen && (
                                <div className={styles.notifDropdown}>
                                    <div className={styles.notifHeader}>
                                        <span>Notifications</span>
                                        <button className={styles.notifClear}>Mark all read</button>
                                    </div>
                                    <div className={styles.notifItem}>
                                        <div className={`${styles.notifIcon} ${styles.notifAlert}`}>
                                            <Zap size={14} />
                                        </div>
                                        <div>
                                            <p className={styles.notifText}>Grid Load Warning – Zone D at 95%</p>
                                            <span className={styles.notifTime}>2 min ago</span>
                                        </div>
                                    </div>
                                    <div className={styles.notifItem}>
                                        <div className={`${styles.notifIcon} ${styles.notifSuccess}`}>
                                            <Battery size={14} />
                                        </div>
                                        <div>
                                            <p className={styles.notifText}>CS-2845 charging completed</p>
                                            <span className={styles.notifTime}>15 min ago</span>
                                        </div>
                                    </div>
                                    <div className={styles.notifItem}>
                                        <div className={`${styles.notifIcon} ${styles.notifInfo}`}>
                                            <Activity size={14} />
                                        </div>
                                        <div>
                                            <p className={styles.notifText}>AI rescheduled 3 sessions</p>
                                            <span className={styles.notifTime}>32 min ago</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className={styles.userMenu}>
                            <div className={styles.avatar} style={{ background: 'linear-gradient(135deg, var(--primary), #6366f1)' }}>
                                <Shield size={14} />
                            </div>
                            <div className={styles.userInfo}>
                                <span className={styles.userName}>{profile?.full_name || 'Admin'}</span>
                                <span className={styles.userRole}>Administrator</span>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className={styles.content}>
                    {children}
                </main>
            </div>
        </div>
    );
}
