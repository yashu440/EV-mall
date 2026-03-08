'use client';

import { useState, useEffect } from 'react';
import { getAllSessions, getZones, getDashboardStats } from '@/lib/database';
import {
    BarChart3, TrendingUp, DollarSign, Zap, Users,
    Calendar, Download, ArrowUpRight, ArrowDownRight,
    Battery, Leaf, Clock, Target
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, BarChart, Bar, LineChart, Line,
    RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
    ComposedChart,
} from 'recharts';
import { weeklyEnergy, revenueData, customerSatisfactionData, hourlyTraffic } from '@/lib/mock-data';
import { formatCurrency } from '@/lib/utils';
import styles from './page.module.css';

const defaultSummary = [
    { title: 'Total Revenue', value: '₹0', change: '--', up: true, icon: DollarSign, color: '#6366f1' },
    { title: 'Total Energy', value: '0 kWh', change: '--', up: true, icon: Zap, color: '#10b981' },
    { title: 'Total Sessions', value: '0', change: '--', up: true, icon: Battery, color: '#3b82f6' },
    { title: 'Avg Session', value: '0 kWh', change: '--', up: false, icon: Target, color: '#f59e0b' },
];

const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className={styles.tooltip}>
            <p className={styles.tooltipLabel}>{label}</p>
            {payload.map((entry, i) => (
                <p key={i} style={{ color: entry.color }} className={styles.tooltipValue}>
                    {entry.name}: {typeof entry.value === 'number' && entry.name.toLowerCase().includes('revenue')
                        ? formatCurrency(entry.value)
                        : entry.value}
                    {entry.name.toLowerCase().includes('energy') ? ' kWh' : ''}
                </p>
            ))}
        </div>
    );
};

export default function AnalyticsPage() {
    const [period, setPeriod] = useState('month');
    const [summaryCards, setSummaryCards] = useState(defaultSummary);

    useEffect(() => {
        async function loadStats() {
            const { data: sessions } = await getAllSessions();
            if (sessions && sessions.length > 0) {
                const totalRevenue = sessions.reduce((s, x) => s + (Number(x.total_cost) || 0), 0);
                const totalEnergy = sessions.reduce((s, x) => s + (Number(x.energy_delivered_kwh) || 0), 0);
                const totalSessions = sessions.length;
                const avgEnergy = totalSessions > 0 ? (totalEnergy / totalSessions).toFixed(2) : 0;
                setSummaryCards([
                    { title: 'Total Revenue', value: `₹${totalRevenue.toLocaleString('en-IN')}`, change: '+18.2%', up: true, icon: DollarSign, color: '#6366f1' },
                    { title: 'Total Energy', value: `${totalEnergy.toLocaleString('en-IN')} kWh`, change: '+12.4%', up: true, icon: Zap, color: '#10b981' },
                    { title: 'Total Sessions', value: totalSessions.toLocaleString('en-IN'), change: '+8.7%', up: true, icon: Battery, color: '#3b82f6' },
                    { title: 'Avg Session', value: `${avgEnergy} kWh`, change: '-2.1%', up: false, icon: Target, color: '#f59e0b' },
                ]);
            }
        }
        loadStats();
    }, []);

    return (
        <div className={styles.analytics}>
            {/* Page Header */}
            <div className={styles.pageHeader}>
                <div>
                    <h1 className={styles.pageTitle}>Analytics & Insights</h1>
                    <p className={styles.pageSubtitle}>Performance metrics and energy reports</p>
                </div>
                <div className={styles.headerActions}>
                    <div className={styles.periodTabs}>
                        {['week', 'month', 'quarter', 'year'].map(p => (
                            <button
                                key={p}
                                className={`${styles.periodTab} ${period === p ? styles.periodActive : ''}`}
                                onClick={() => setPeriod(p)}
                            >
                                {p.charAt(0).toUpperCase() + p.slice(1)}
                            </button>
                        ))}
                    </div>
                    <button className="btn btn-secondary btn-sm">
                        <Download size={14} />
                        Export Report
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className={styles.summaryGrid}>
                {summaryCards.map((card, idx) => (
                    <div key={card.title} className={styles.summaryCard}>
                        <div className={styles.summaryIcon} style={{ background: `${card.color}15`, color: card.color }}>
                            <card.icon size={18} />
                        </div>
                        <div className={styles.summaryInfo}>
                            <span className={styles.summaryLabel}>{card.title}</span>
                            <span className={styles.summaryValue}>{card.value}</span>
                            <div className={styles.summaryChange}>
                                {card.up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                                <span className={card.up ? styles.up : styles.down}>{card.change}</span>
                                <span className={styles.changeNote}>vs last {period}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Charts Grid */}
            <div className={styles.chartsGrid}>
                {/* Revenue Trend */}
                <div className={`card ${styles.chartCard} ${styles.chartWide}`}>
                    <div className={styles.cardHeader}>
                        <div>
                            <h3 className={styles.cardTitle}>Revenue Trend</h3>
                            <p className={styles.cardSubtitle}>Monthly revenue and energy consumption</p>
                        </div>
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                        <ComposedChart data={revenueData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                            <defs>
                                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#6366f1" stopOpacity={0.3} />
                                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                            <XAxis dataKey="month" stroke="#475569" fontSize={12} tickLine={false} />
                            <YAxis yAxisId="left" stroke="#475569" fontSize={12} tickLine={false} />
                            <YAxis yAxisId="right" orientation="right" stroke="#475569" fontSize={12} tickLine={false} />
                            <Tooltip content={<CustomTooltip />} />
                            <Area yAxisId="left" type="monotone" dataKey="revenue" name="Revenue" stroke="#6366f1" fill="url(#revenueGrad)" strokeWidth={2} />
                            <Bar yAxisId="right" dataKey="energy" name="Energy" fill="#10b981" radius={[4, 4, 0, 0]} opacity={0.7} barSize={24} />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>

                {/* Weekly Energy */}
                <div className={`card ${styles.chartCard}`}>
                    <div className={styles.cardHeader}>
                        <div>
                            <h3 className={styles.cardTitle}>Weekly Energy</h3>
                            <p className={styles.cardSubtitle}>Daily energy consumption & sessions</p>
                        </div>
                    </div>
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={weeklyEnergy} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                            <XAxis dataKey="day" stroke="#475569" fontSize={12} tickLine={false} />
                            <YAxis stroke="#475569" fontSize={12} tickLine={false} />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="energy" name="Energy" fill="#10b981" radius={[4, 4, 0, 0]} barSize={28} />
                            <Bar dataKey="sessions" name="Sessions" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={28} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Customer Satisfaction Radar */}
                <div className={`card ${styles.chartCard}`}>
                    <div className={styles.cardHeader}>
                        <div>
                            <h3 className={styles.cardTitle}>Satisfaction Metrics</h3>
                            <p className={styles.cardSubtitle}>Customer satisfaction by category</p>
                        </div>
                    </div>
                    <ResponsiveContainer width="100%" height={250}>
                        <RadarChart data={customerSatisfactionData} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
                            <PolarGrid stroke="rgba(255,255,255,0.1)" />
                            <PolarAngleAxis dataKey="category" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                            <PolarRadiusAxis tick={{ fontSize: 10, fill: '#475569' }} domain={[0, 100]} />
                            <Radar name="Score" dataKey="score" stroke="#10b981" fill="#10b981" fillOpacity={0.2} strokeWidth={2} />
                        </RadarChart>
                    </ResponsiveContainer>
                </div>

                {/* Hourly Traffic */}
                <div className={`card ${styles.chartCard} ${styles.chartWide}`}>
                    <div className={styles.cardHeader}>
                        <div>
                            <h3 className={styles.cardTitle}>Hourly Traffic Pattern</h3>
                            <p className={styles.cardSubtitle}>Shopper traffic vs EV arrivals throughout the day</p>
                        </div>
                    </div>
                    <ResponsiveContainer width="100%" height={280}>
                        <AreaChart data={hourlyTraffic} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                            <defs>
                                <linearGradient id="shoppersGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="evGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                                    <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                            <XAxis dataKey="hour" stroke="#475569" fontSize={12} tickLine={false} />
                            <YAxis stroke="#475569" fontSize={12} tickLine={false} />
                            <Tooltip content={<CustomTooltip />} />
                            <Area type="monotone" dataKey="shoppers" name="Shoppers" stroke="#3b82f6" fill="url(#shoppersGrad)" strokeWidth={2} />
                            <Area type="monotone" dataKey="evArrivals" name="EV Arrivals" stroke="#10b981" fill="url(#evGrad)" strokeWidth={2} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Key Metrics Table */}
            <div className={`card ${styles.metricsCard}`}>
                <div className={styles.cardHeader}>
                    <div>
                        <h3 className={styles.cardTitle}>Key Performance Indicators</h3>
                        <p className={styles.cardSubtitle}>Detailed breakdown for current period</p>
                    </div>
                </div>
                <div className={styles.metricsGrid}>
                    {[
                        { label: 'Avg Charge Time', value: '1h 42m', icon: Clock, trend: '-8%', up: false },
                        { label: 'Charger Utilization', value: '73.4%', icon: Target, trend: '+5.2%', up: true },
                        { label: 'Peak Hour Revenue', value: '₹2,36,700', icon: DollarSign, trend: '+12%', up: true },
                        { label: 'Customer Retention', value: '87%', icon: Users, trend: '+3.1%', up: true },
                        { label: 'Grid Efficiency', value: '91.2%', icon: Zap, trend: '+1.8%', up: true },
                        { label: 'CO₂ Offset', value: '4.2 tons', icon: Leaf, trend: '+6%', up: true },
                    ].map(metric => (
                        <div key={metric.label} className={styles.metricItem}>
                            <div className={styles.metricIcon}>
                                <metric.icon size={16} />
                            </div>
                            <div className={styles.metricInfo}>
                                <span className={styles.metricLabel}>{metric.label}</span>
                                <span className={styles.metricValue}>{metric.value}</span>
                            </div>
                            <span className={`${styles.metricTrend} ${metric.up ? styles.up : styles.down}`}>
                                {metric.up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                                {metric.trend}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
