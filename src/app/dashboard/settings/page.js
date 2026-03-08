'use client';

import { useState, useEffect } from 'react';
import {
    Settings, Zap, DollarSign, Clock, Shield,
    Bell, Save, RefreshCw, ToggleLeft, ToggleRight,
    Map, Battery, AlertTriangle, Globe
} from 'lucide-react';
import styles from './page.module.css';
import { getSettings, updateSetting, getZones, updateZone } from '@/lib/database';

const settingsSections = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'pricing', label: 'Pricing', icon: DollarSign },
    { id: 'scheduling', label: 'Scheduling', icon: Clock },
    { id: 'grid', label: 'Grid Rules', icon: Zap },
    { id: 'notifications', label: 'Notifications', icon: Bell },
];

export default function SettingsPage() {
    const [activeSection, setActiveSection] = useState('general');
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [settings, setSettings] = useState({
        mallName: 'Phoenix Marketcity, Mumbai',
        timezone: 'Asia/Kolkata',
        operatingStart: '06:00',
        operatingEnd: '23:00',
        autoScheduling: true,
        fairnessEngine: true,
        demandResponse: true,
        solarIntegration: true,
        maxGridLoad: 85,
        peakHourStart: '11:00',
        peakHourEnd: '14:00',
        premiumRate: 37.50,
        standardRate: 29.00,
        economyRate: 23.00,
        expressRate: 46.00,
        peakSurcharge: 15,
        offPeakDiscount: 10,
        maxSessionDuration: 240,
        minChargeLevel: 20,
        maxQueueSize: 15,
        priorityBoost: true,
        emailNotifications: true,
        smsNotifications: true,
        gridAlerts: true,
        maintenanceAlerts: true,
        alertThreshold: 90,
    });

    const handleToggle = (key) => {
        setSettings(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleChange = (key, value) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    const Toggle = ({ checked, onChange }) => (
        <button className={`${styles.toggle} ${checked ? styles.toggleOn : ''}`} onClick={onChange}>
            <div className={styles.toggleDot} />
        </button>
    );

    // Load settings from DB
    useEffect(() => {
        async function load() {
            const { data } = await getSettings();
            if (data && Object.keys(data).length > 0) {
                if (data.mall_name) setSettings(prev => ({ ...prev, mallName: data.mall_name }));
                if (data.operating_hours) {
                    setSettings(prev => ({
                        ...prev,
                        operatingStart: data.operating_hours.start || prev.operatingStart,
                        operatingEnd: data.operating_hours.end || prev.operatingEnd,
                    }));
                }
                if (data.max_grid_load) setSettings(prev => ({ ...prev, maxGridLoad: Number(data.max_grid_load) }));
                if (data.auto_scheduling !== undefined) setSettings(prev => ({ ...prev, autoScheduling: data.auto_scheduling === true || data.auto_scheduling === 'true' }));
            }

            // Load zone pricing
            const { data: zones } = await getZones();
            if (zones) {
                zones.forEach(z => {
                    const rate = Number(z.price_per_kwh);
                    if (z.zone_code === 'A') setSettings(prev => ({ ...prev, premiumRate: rate }));
                    if (z.zone_code === 'B') setSettings(prev => ({ ...prev, standardRate: rate }));
                    if (z.zone_code === 'C') setSettings(prev => ({ ...prev, economyRate: rate }));
                    if (z.zone_code === 'D') setSettings(prev => ({ ...prev, expressRate: rate }));
                });
            }
        }
        load();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        setSaved(false);
        try {
            await updateSetting('mall_name', settings.mallName);
            await updateSetting('operating_hours', { start: settings.operatingStart, end: settings.operatingEnd });
            await updateSetting('max_grid_load', settings.maxGridLoad);
            await updateSetting('auto_scheduling', settings.autoScheduling);

            // Update zone pricing
            const { data: zones } = await getZones();
            if (zones) {
                for (const z of zones) {
                    let rate;
                    if (z.zone_code === 'A') rate = settings.premiumRate;
                    if (z.zone_code === 'B') rate = settings.standardRate;
                    if (z.zone_code === 'C') rate = settings.economyRate;
                    if (z.zone_code === 'D') rate = settings.expressRate;
                    if (rate !== undefined) {
                        await updateZone(z.id, { price_per_kwh: rate });
                    }
                }
            }
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (err) {
            console.error('Error saving settings:', err);
        }
        setSaving(false);
    };

    return (
        <div className={styles.settings}>
            <div className={styles.pageHeader}>
                <div>
                    <h1 className={styles.pageTitle}>Settings</h1>
                    <p className={styles.pageSubtitle}>System configuration & operational rules</p>
                </div>
                <div className={styles.headerActions}>
                    <button className="btn btn-secondary btn-sm">
                        <RefreshCw size={14} />
                        Reset Defaults
                    </button>
                    <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>
                        <Save size={14} />
                        {saving ? 'Saving...' : saved ? '✓ Saved!' : 'Save Changes'}
                    </button>
                </div>
            </div>

            <div className={styles.settingsLayout}>
                {/* Sidebar Nav */}
                <div className={styles.settingsNav}>
                    {settingsSections.map(section => (
                        <button
                            key={section.id}
                            className={`${styles.settingsNavItem} ${activeSection === section.id ? styles.settingsNavActive : ''}`}
                            onClick={() => setActiveSection(section.id)}
                        >
                            <section.icon size={16} />
                            <span>{section.label}</span>
                        </button>
                    ))}
                </div>

                {/* Settings Content */}
                <div className={styles.settingsContent}>
                    {activeSection === 'general' && (
                        <div className={styles.settingsSection}>
                            <h2 className={styles.sectionTitle}>General Settings</h2>
                            <p className={styles.sectionDescription}>Configure basic system parameters and mall information.</p>

                            <div className={styles.formGrid}>
                                <div className="input-group">
                                    <label className="input-label">Mall Name</label>
                                    <input
                                        type="text"
                                        className="input"
                                        value={settings.mallName}
                                        onChange={(e) => handleChange('mallName', e.target.value)}
                                    />
                                </div>
                                <div className="input-group">
                                    <label className="input-label">Timezone</label>
                                    <select
                                        className="input select"
                                        value={settings.timezone}
                                        onChange={(e) => handleChange('timezone', e.target.value)}
                                    >
                                        <option value="Asia/Kolkata">India Standard Time (IST)</option>
                                        <option value="Asia/Kolkata">IST (UTC+5:30)</option>
                                    </select>
                                </div>
                                <div className="input-group">
                                    <label className="input-label">Operating Hours Start</label>
                                    <input
                                        type="time"
                                        className="input"
                                        value={settings.operatingStart}
                                        onChange={(e) => handleChange('operatingStart', e.target.value)}
                                    />
                                </div>
                                <div className="input-group">
                                    <label className="input-label">Operating Hours End</label>
                                    <input
                                        type="time"
                                        className="input"
                                        value={settings.operatingEnd}
                                        onChange={(e) => handleChange('operatingEnd', e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className={styles.toggleSection}>
                                <h3 className={styles.toggleSectionTitle}>AI Features</h3>
                                <div className={styles.toggleList}>
                                    <div className={styles.toggleItem}>
                                        <div>
                                            <span className={styles.toggleLabel}>Auto Scheduling</span>
                                            <span className={styles.toggleDesc}>AI automatically assigns optimal charging slots</span>
                                        </div>
                                        <Toggle checked={settings.autoScheduling} onChange={() => handleToggle('autoScheduling')} />
                                    </div>
                                    <div className={styles.toggleItem}>
                                        <div>
                                            <span className={styles.toggleLabel}>Fairness Engine</span>
                                            <span className={styles.toggleDesc}>Ensure equitable slot distribution among shoppers</span>
                                        </div>
                                        <Toggle checked={settings.fairnessEngine} onChange={() => handleToggle('fairnessEngine')} />
                                    </div>
                                    <div className={styles.toggleItem}>
                                        <div>
                                            <span className={styles.toggleLabel}>Demand Response</span>
                                            <span className={styles.toggleDesc}>Participate in grid demand response programs</span>
                                        </div>
                                        <Toggle checked={settings.demandResponse} onChange={() => handleToggle('demandResponse')} />
                                    </div>
                                    <div className={styles.toggleItem}>
                                        <div>
                                            <span className={styles.toggleLabel}>Solar Integration</span>
                                            <span className={styles.toggleDesc}>Optimize charging with solar generation windows</span>
                                        </div>
                                        <Toggle checked={settings.solarIntegration} onChange={() => handleToggle('solarIntegration')} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeSection === 'pricing' && (
                        <div className={styles.settingsSection}>
                            <h2 className={styles.sectionTitle}>Pricing Configuration</h2>
                            <p className={styles.sectionDescription}>Set charging rates per zone and configure dynamic pricing rules.</p>

                            <div className={styles.pricingGrid}>
                                {[
                                    { label: 'Premium (Zone A)', key: 'premiumRate', color: '#10b981' },
                                    { label: 'Standard (Zone B)', key: 'standardRate', color: '#6366f1' },
                                    { label: 'Economy (Zone C)', key: 'economyRate', color: '#3b82f6' },
                                    { label: 'Express (Zone D)', key: 'expressRate', color: '#f59e0b' },
                                ].map(zone => (
                                    <div key={zone.key} className={styles.pricingCard}>
                                        <div className={styles.pricingDot} style={{ background: zone.color }} />
                                        <div className={styles.pricingInfo}>
                                            <span className={styles.pricingLabel}>{zone.label}</span>
                                            <div className={styles.pricingInput}>
                                                <span className={styles.pricingPrefix}>₹</span>
                                                <input
                                                    type="number"
                                                    className="input"
                                                    value={settings[zone.key]}
                                                    onChange={(e) => handleChange(zone.key, parseFloat(e.target.value))}
                                                    step="0.01"
                                                    min="0"
                                                />
                                                <span className={styles.pricingSuffix}>/kWh</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className={styles.formGrid} style={{ marginTop: 'var(--space-6)' }}>
                                <div className="input-group">
                                    <label className="input-label">Peak Hour Surcharge (%)</label>
                                    <input
                                        type="number"
                                        className="input"
                                        value={settings.peakSurcharge}
                                        onChange={(e) => handleChange('peakSurcharge', parseInt(e.target.value))}
                                    />
                                </div>
                                <div className="input-group">
                                    <label className="input-label">Off-Peak Discount (%)</label>
                                    <input
                                        type="number"
                                        className="input"
                                        value={settings.offPeakDiscount}
                                        onChange={(e) => handleChange('offPeakDiscount', parseInt(e.target.value))}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {activeSection === 'scheduling' && (
                        <div className={styles.settingsSection}>
                            <h2 className={styles.sectionTitle}>Scheduling Rules</h2>
                            <p className={styles.sectionDescription}>Configure session limits, queue sizes, and timing rules.</p>

                            <div className={styles.formGrid}>
                                <div className="input-group">
                                    <label className="input-label">Max Session Duration (minutes)</label>
                                    <input
                                        type="number"
                                        className="input"
                                        value={settings.maxSessionDuration}
                                        onChange={(e) => handleChange('maxSessionDuration', parseInt(e.target.value))}
                                    />
                                </div>
                                <div className="input-group">
                                    <label className="input-label">Min Charge Level to Start (%)</label>
                                    <input
                                        type="number"
                                        className="input"
                                        value={settings.minChargeLevel}
                                        onChange={(e) => handleChange('minChargeLevel', parseInt(e.target.value))}
                                    />
                                </div>
                                <div className="input-group">
                                    <label className="input-label">Max Queue Size per Zone</label>
                                    <input
                                        type="number"
                                        className="input"
                                        value={settings.maxQueueSize}
                                        onChange={(e) => handleChange('maxQueueSize', parseInt(e.target.value))}
                                    />
                                </div>
                                <div className="input-group">
                                    <label className="input-label">Peak Hours Start</label>
                                    <input
                                        type="time"
                                        className="input"
                                        value={settings.peakHourStart}
                                        onChange={(e) => handleChange('peakHourStart', e.target.value)}
                                    />
                                </div>
                                <div className="input-group">
                                    <label className="input-label">Peak Hours End</label>
                                    <input
                                        type="time"
                                        className="input"
                                        value={settings.peakHourEnd}
                                        onChange={(e) => handleChange('peakHourEnd', e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className={styles.toggleSection}>
                                <div className={styles.toggleList}>
                                    <div className={styles.toggleItem}>
                                        <div>
                                            <span className={styles.toggleLabel}>Priority Boost</span>
                                            <span className={styles.toggleDesc}>Give priority to vehicles with very low battery (&lt;15%)</span>
                                        </div>
                                        <Toggle checked={settings.priorityBoost} onChange={() => handleToggle('priorityBoost')} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeSection === 'grid' && (
                        <div className={styles.settingsSection}>
                            <h2 className={styles.sectionTitle}>Grid Rules</h2>
                            <p className={styles.sectionDescription}>Define grid load limits and power distribution rules.</p>

                            <div className={styles.formGrid}>
                                <div className="input-group">
                                    <label className="input-label">Max Grid Load (%)</label>
                                    <input
                                        type="number"
                                        className="input"
                                        value={settings.maxGridLoad}
                                        onChange={(e) => handleChange('maxGridLoad', parseInt(e.target.value))}
                                        max="100"
                                        min="50"
                                    />
                                    <span className={styles.inputHint}>Sessions will be throttled above this threshold</span>
                                </div>
                                <div className="input-group">
                                    <label className="input-label">Alert Threshold (%)</label>
                                    <input
                                        type="number"
                                        className="input"
                                        value={settings.alertThreshold}
                                        onChange={(e) => handleChange('alertThreshold', parseInt(e.target.value))}
                                        max="100"
                                        min="50"
                                    />
                                    <span className={styles.inputHint}>Alerts triggered when load exceeds this level</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeSection === 'notifications' && (
                        <div className={styles.settingsSection}>
                            <h2 className={styles.sectionTitle}>Notification Preferences</h2>
                            <p className={styles.sectionDescription}>Configure alerts and notification channels.</p>

                            <div className={styles.toggleSection}>
                                <div className={styles.toggleList}>
                                    <div className={styles.toggleItem}>
                                        <div>
                                            <span className={styles.toggleLabel}>Email Notifications</span>
                                            <span className={styles.toggleDesc}>Receive daily summaries and critical alerts via email</span>
                                        </div>
                                        <Toggle checked={settings.emailNotifications} onChange={() => handleToggle('emailNotifications')} />
                                    </div>
                                    <div className={styles.toggleItem}>
                                        <div>
                                            <span className={styles.toggleLabel}>SMS Notifications</span>
                                            <span className={styles.toggleDesc}>Send session updates to customers via SMS</span>
                                        </div>
                                        <Toggle checked={settings.smsNotifications} onChange={() => handleToggle('smsNotifications')} />
                                    </div>
                                    <div className={styles.toggleItem}>
                                        <div>
                                            <span className={styles.toggleLabel}>Grid Load Alerts</span>
                                            <span className={styles.toggleDesc}>Alert when grid load exceeds configured threshold</span>
                                        </div>
                                        <Toggle checked={settings.gridAlerts} onChange={() => handleToggle('gridAlerts')} />
                                    </div>
                                    <div className={styles.toggleItem}>
                                        <div>
                                            <span className={styles.toggleLabel}>Maintenance Alerts</span>
                                            <span className={styles.toggleDesc}>Notify when stations require maintenance attention</span>
                                        </div>
                                        <Toggle checked={settings.maintenanceAlerts} onChange={() => handleToggle('maintenanceAlerts')} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
