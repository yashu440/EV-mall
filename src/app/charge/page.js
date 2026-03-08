'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    Zap, Battery, BatteryCharging, Car, Clock, MapPin,
    ArrowRight, ArrowLeft, CheckCircle2, QrCode, Sparkles,
    ChevronDown, Info, Star, Calendar, LogIn, User,
    ClipboardList, LogOut, Home
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { bookChargingSession, getZones, getAvailableStations } from '@/lib/database';
import { vehicleMakes } from '@/lib/mock-data';
import styles from './page.module.css';

const steps = ['Vehicle Info', 'Charging Preferences', 'Slot Selection', 'Confirmation'];

export default function ChargePage() {
    const { user, profile, loading: authLoading, signOut } = useAuth();
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(0);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [zones, setZones] = useState([]);
    const [suggestedSlots, setSuggestedSlots] = useState([]);
    const [booking, setBooking] = useState(false);
    const [bookingResult, setBookingResult] = useState(null);
    const [bookingError, setBookingError] = useState('');
    const [formData, setFormData] = useState({
        vehicleModel: '',
        customVehicle: '',
        licensePlate: '',
        currentCharge: 20,
        targetCharge: 85,
        shoppingDuration: '2',
        preferredZone: 'any',
        priority: 'standard',
        phone: '',
        smsUpdates: true,
    });

    // Load zones from DB
    useEffect(() => {
        async function loadZones() {
            const { data } = await getZones();
            if (data && data.length > 0) setZones(data);
        }
        loadZones();
    }, []);

    // Generate suggested slots when reaching step 3
    useEffect(() => {
        if (currentStep === 2) {
            generateSlots();
        }
    }, [currentStep]);

    const generateSlots = async () => {
        // Try getting available stations first
        const { data: stations } = await getAvailableStations();
        const estimatedKwh = ((formData.targetCharge - formData.currentCharge) / 100) * 40;

        if (stations && stations.length > 0) {
            // Build slots from real available stations
            const grouped = {};
            stations.forEach(s => {
                const zoneKey = s.parking_zones?.zone_code || 'X';
                if (!grouped[zoneKey]) grouped[zoneKey] = [];
                grouped[zoneKey].push(s);
            });

            const slotEntries = Object.entries(grouped).slice(0, 3);
            const slots = slotEntries.map(([zoneCode, zoneStations], index) => {
                const station = zoneStations[0];
                const pricePerKwh = station.parking_zones?.price_per_kwh || 29;
                const cost = Math.round(estimatedKwh * Number(pricePerKwh));
                const power = station.max_power_kw || 22;
                const chargingHours = estimatedKwh / power;
                const hours = Math.floor(chargingHours);
                const mins = Math.round((chargingHours - hours) * 60);
                const duration = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
                const now = new Date();

                return {
                    id: index + 1,
                    stationId: station.id,
                    zone: station.parking_zones?.name || `Zone ${zoneCode}`,
                    station: station.station_code,
                    startTime: now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
                    duration,
                    chargeGain: `${formData.currentCharge}% → ${formData.targetCharge}%`,
                    cost: `₹${cost.toLocaleString('en-IN')}`,
                    costNum: cost,
                    waitTime: index === 0 ? '0 min' : `${index * 5} min`,
                    recommended: index === 0,
                    reason: index === 0 ? 'Best match: Low wait, optimal grid load'
                        : index === 1 ? 'Fastest charge with DC Fast'
                            : 'Lowest cost option',
                };
            });

            // Sort: recommended first, then by cost
            slots.sort((a, b) => (b.recommended ? 1 : 0) - (a.recommended ? 1 : 0) || a.costNum - b.costNum);
            setSuggestedSlots(slots);
        } else if (zones.length > 0) {
            // Fallback: generate virtual slots from zones
            const slots = zones.slice(0, 3).map((zone, index) => {
                const pricePerKwh = Number(zone.price_per_kwh) || 29;
                const cost = Math.round(estimatedKwh * pricePerKwh);
                const power = zone.charger_type?.includes('DC') ?
                    (zone.charger_type?.includes('Ultra') ? 350 : 150) :
                    (zone.charger_type?.includes('22') ? 22 : 11);
                const chargingHours = estimatedKwh / power;
                const hours = Math.floor(chargingHours);
                const mins = Math.round((chargingHours - hours) * 60);
                const duration = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
                const now = new Date();

                return {
                    id: index + 1,
                    zone: zone.name,
                    station: `${zone.zone_code}-01`,
                    startTime: now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
                    duration,
                    chargeGain: `${formData.currentCharge}% → ${formData.targetCharge}%`,
                    cost: `₹${cost.toLocaleString('en-IN')}`,
                    costNum: cost,
                    waitTime: index === 0 ? '0 min' : `${index * 5} min`,
                    recommended: index === 0,
                    reason: index === 0 ? 'Best match: Low wait, optimal grid load'
                        : cost < 1000 ? 'Lowest cost option'
                            : 'Fastest charge option',
                };
            });
            setSuggestedSlots(slots);
        } else {
            // Final fallback: hardcoded slots
            setSuggestedSlots([
                { id: 1, zone: 'Zone B – Standard', station: 'B-08', startTime: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }), duration: '2h 15m', chargeGain: `${formData.currentCharge}% → ${formData.targetCharge}%`, cost: `₹${Math.round(estimatedKwh * 29).toLocaleString('en-IN')}`, waitTime: '0 min', recommended: true, reason: 'Best match: Low wait, optimal grid load' },
                { id: 2, zone: 'Zone A – Premium', station: 'A-12', startTime: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }), duration: '1h 30m', chargeGain: `${formData.currentCharge}% → ${formData.targetCharge}%`, cost: `₹${Math.round(estimatedKwh * 37.5).toLocaleString('en-IN')}`, waitTime: '15 min', recommended: false, reason: 'Fastest charge with DC Fast' },
                { id: 3, zone: 'Zone C – Economy', station: 'C-05', startTime: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }), duration: '3h 00m', chargeGain: `${formData.currentCharge}% → ${formData.targetCharge}%`, cost: `₹${Math.round(estimatedKwh * 23).toLocaleString('en-IN')}`, waitTime: '0 min', recommended: false, reason: 'Lowest cost option' },
            ]);
        }
    };

    const handleChange = (key, value) => {
        setFormData(prev => ({ ...prev, [key]: value }));
    };

    const canProceed = () => {
        if (currentStep === 0) {
            const hasVehicle = formData.vehicleModel === 'Other (Custom)'
                ? formData.customVehicle.trim()
                : formData.vehicleModel;
            return hasVehicle && formData.licensePlate;
        }
        if (currentStep === 1) return true;
        if (currentStep === 2) return selectedSlot !== null;
        return true;
    };

    const handleNext = async () => {
        if (currentStep === 2 && canProceed()) {
            setBooking(true);
            setBookingError('');
            const vehicleModel = formData.vehicleModel === 'Other (Custom)'
                ? formData.customVehicle
                : formData.vehicleModel;

            const { data, error } = await bookChargingSession({
                userId: user.id,
                vehicleModel,
                licensePlate: formData.licensePlate,
                currentCharge: formData.currentCharge,
                targetCharge: formData.targetCharge,
                shoppingDuration: formData.shoppingDuration,
                preferredZone: formData.preferredZone,
                priority: formData.priority,
                phone: formData.phone,
            });

            setBooking(false);
            if (error) {
                setBookingError(error.message || 'Booking failed. Please try again.');
                return;
            }
            setBookingResult(data);
            setCurrentStep(3);
        } else if (currentStep < steps.length - 1 && canProceed()) {
            setCurrentStep(currentStep + 1);
        }
    };

    const handleBack = () => {
        if (currentStep > 0) setCurrentStep(currentStep - 1);
    };

    // Auth loading
    if (authLoading) {
        return (
            <div className={styles.chargePage}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', color: 'var(--text-secondary)' }}>
                    <div style={{ textAlign: 'center' }}>
                        <Zap size={32} style={{ color: 'var(--primary)', marginBottom: '12px' }} />
                        <p>Loading...</p>
                    </div>
                </div>
            </div>
        );
    }

    // Auth guard
    if (!user) {
        return (
            <div className={styles.chargePage}>
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
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '70vh', gap: '20px', textAlign: 'center', padding: '0 20px' }}>
                    <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--primary-transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <LogIn size={36} style={{ color: 'var(--primary)' }} />
                    </div>
                    <h2 style={{ color: 'var(--text-primary)', fontSize: '1.75rem', fontWeight: '700' }}>Login Required</h2>
                    <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', lineHeight: '1.6' }}>
                        Please sign in or create an account to request a charging session.
                    </p>
                    <Link href="/login" className="btn btn-primary btn-lg" style={{ marginTop: '8px' }}>
                        <LogIn size={18} />
                        Sign In / Create Account
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.chargePage}>
            <div className={styles.bgGlow} />
            <div className={styles.bgGlow2} />

            {/* Professional Top Nav */}
            <nav className={styles.topNav}>
                <Link href="/" className={styles.logo}>
                    <div className={styles.logoIcon}>
                        <Zap size={18} />
                    </div>
                    <span className={styles.logoText}>GridWise</span>
                </Link>
                <div className={styles.navRight}>
                    <Link href="/bookings" className={styles.navLink}>
                        <ClipboardList size={14} />
                        <span>My Bookings</span>
                    </Link>
                    <Link href="/status" className={styles.navLink}>
                        <BatteryCharging size={14} />
                        <span>Track Session</span>
                    </Link>
                    <div className={styles.navDivider} />
                    <div className={styles.userBadge}>
                        <div className={styles.userAvatar}>
                            <User size={12} />
                        </div>
                        <span className={styles.userName}>{profile?.full_name || 'User'}</span>
                    </div>
                    <button onClick={() => { signOut(); router.push('/'); }} className={styles.navLink} style={{ color: 'var(--text-tertiary)' }}>
                        <LogOut size={14} />
                    </button>
                </div>
            </nav>

            <div className={styles.chargeContainer}>
                {/* Header */}
                <div className={styles.chargeHeader}>
                    <div className={styles.chargeBadge}>
                        <BatteryCharging size={14} />
                        <span>Smart Charging Request</span>
                    </div>
                    <h1 className={styles.chargeTitle}>
                        Request a Charge
                    </h1>
                    <p className={styles.chargeSubtitle}>
                        Our AI will find the optimal charging slot based on your needs.
                    </p>
                </div>

                {/* Step Indicator */}
                <div className={styles.stepIndicator}>
                    {steps.map((step, index) => (
                        <div key={step} className={`${styles.step} ${index <= currentStep ? styles.stepActive : ''} ${index < currentStep ? styles.stepComplete : ''}`}>
                            <div className={styles.stepDot}>
                                {index < currentStep ? <CheckCircle2 size={16} /> : <span>{index + 1}</span>}
                            </div>
                            <span className={styles.stepLabel}>{step}</span>
                            {index < steps.length - 1 && <div className={styles.stepLine} />}
                        </div>
                    ))}
                </div>

                {/* Step Content */}
                <div className={styles.stepContent}>
                    {/* Step 1: Vehicle Info */}
                    {currentStep === 0 && (
                        <div className={styles.formSection}>
                            <div className={styles.formCard}>
                                <div className={styles.formCardHeader}>
                                    <Car size={20} />
                                    <h2>Vehicle Information</h2>
                                </div>
                                <div className={styles.formGrid}>
                                    <div className="input-group">
                                        <label className="input-label">Vehicle Model</label>
                                        <select
                                            className="input select"
                                            value={formData.vehicleModel}
                                            onChange={(e) => handleChange('vehicleModel', e.target.value)}
                                        >
                                            <option value="">Select your vehicle</option>
                                            {vehicleMakes.map(v => (
                                                <option key={v} value={v}>{v}</option>
                                            ))}
                                        </select>
                                    </div>
                                    {formData.vehicleModel === 'Other (Custom)' && (
                                        <div className="input-group">
                                            <label className="input-label">Custom Vehicle Name</label>
                                            <input
                                                className="input"
                                                placeholder="e.g., Ola S1 Pro, Ather 450X"
                                                value={formData.customVehicle}
                                                onChange={(e) => handleChange('customVehicle', e.target.value)}
                                            />
                                        </div>
                                    )}
                                    <div className="input-group">
                                        <label className="input-label">License Plate</label>
                                        <input
                                            className="input"
                                            placeholder="e.g., MH-02-EV-1234"
                                            value={formData.licensePlate}
                                            onChange={(e) => handleChange('licensePlate', e.target.value.toUpperCase())}
                                        />
                                    </div>
                                </div>
                                <div className={styles.qrSection}>
                                    <div className={styles.qrDivider}>
                                        <span>or</span>
                                    </div>
                                    <button className={`btn btn-secondary ${styles.qrBtn}`}>
                                        <QrCode size={18} />
                                        Scan Parking QR Code
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Preferences */}
                    {currentStep === 1 && (
                        <div className={styles.formSection}>
                            <div className={styles.formCard}>
                                <div className={styles.formCardHeader}>
                                    <Battery size={20} />
                                    <h2>Charging Preferences</h2>
                                </div>

                                <div className={styles.rangeGroup}>
                                    <div className={styles.rangeHeader}>
                                        <label className="input-label">Current Battery Level</label>
                                        <span className={styles.rangeValue}>{formData.currentCharge}%</span>
                                    </div>
                                    <input
                                        type="range"
                                        className={styles.rangeInput}
                                        min="5"
                                        max="95"
                                        value={formData.currentCharge}
                                        onChange={(e) => handleChange('currentCharge', parseInt(e.target.value))}
                                    />
                                </div>

                                <div className={styles.rangeGroup}>
                                    <div className={styles.rangeHeader}>
                                        <label className="input-label">Target Charge Level</label>
                                        <span className={styles.rangeValue}>{formData.targetCharge}%</span>
                                    </div>
                                    <input
                                        type="range"
                                        className={styles.rangeInput}
                                        min={formData.currentCharge + 5}
                                        max="100"
                                        value={formData.targetCharge}
                                        onChange={(e) => handleChange('targetCharge', parseInt(e.target.value))}
                                    />
                                </div>

                                <div className={styles.formGrid}>
                                    <div className="input-group">
                                        <label className="input-label">Shopping Duration</label>
                                        <select
                                            className="input select"
                                            value={formData.shoppingDuration}
                                            onChange={(e) => handleChange('shoppingDuration', e.target.value)}
                                        >
                                            <option value="0.5">30 minutes</option>
                                            <option value="1">1 hour</option>
                                            <option value="1.5">1.5 hours</option>
                                            <option value="2">2 hours</option>
                                            <option value="2.5">2.5 hours</option>
                                            <option value="3">3 hours</option>
                                            <option value="4">4+ hours</option>
                                        </select>
                                    </div>
                                    <div className="input-group">
                                        <label className="input-label">Preferred Zone</label>
                                        <select
                                            className="input select"
                                            value={formData.preferredZone}
                                            onChange={(e) => handleChange('preferredZone', e.target.value)}
                                        >
                                            <option value="any">No Preference (AI decides)</option>
                                            {zones.map(z => (
                                                <option key={z.id} value={z.zone_code?.toLowerCase()}>
                                                    {z.name} ({z.charger_type})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="input-group">
                                        <label className="input-label">Phone Number (optional)</label>
                                        <input
                                            className="input"
                                            placeholder="+91 98765 43210"
                                            value={formData.phone}
                                            onChange={(e) => handleChange('phone', e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Slot Selection */}
                    {currentStep === 2 && (
                        <div className={styles.formSection}>
                            <div className={styles.slotsHeader}>
                                <Sparkles size={18} className={styles.sparkle} />
                                <div>
                                    <h2 className={styles.slotsTitle}>AI-Recommended Slots</h2>
                                    <p className={styles.slotsSubtitle}>
                                        Based on current grid load, your preferences, and available stations.
                                    </p>
                                </div>
                            </div>

                            {bookingError && (
                                <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.9rem' }}>
                                    {bookingError}
                                </div>
                            )}

                            {suggestedSlots.length > 0 ? (
                                <div className={styles.slotsGrid}>
                                    {suggestedSlots.map(slot => (
                                        <div
                                            key={slot.id}
                                            className={`${styles.slotCard} ${selectedSlot === slot.id ? styles.slotSelected : ''} ${slot.recommended ? styles.slotRecommended : ''}`}
                                            onClick={() => setSelectedSlot(slot.id)}
                                        >
                                            {slot.recommended && (
                                                <div className={styles.recommendedBadge}>
                                                    <Star size={10} />
                                                    Recommended
                                                </div>
                                            )}
                                            <div className={styles.slotZone}>{slot.zone}</div>
                                            <div className={styles.slotStation}>Station {slot.station}</div>

                                            <div className={styles.slotDetails}>
                                                <div className={styles.slotDetail}>
                                                    <Clock size={12} />
                                                    <span>{slot.startTime} · {slot.duration}</span>
                                                </div>
                                                <div className={styles.slotDetail}>
                                                    <Battery size={12} />
                                                    <span>{slot.chargeGain}</span>
                                                </div>
                                                <div className={styles.slotDetail}>
                                                    <MapPin size={12} />
                                                    <span>Wait: {slot.waitTime}</span>
                                                </div>
                                            </div>

                                            <div className={styles.slotCost}>{slot.cost}</div>
                                            <div className={styles.slotReason}>
                                                <Info size={10} />
                                                {slot.reason}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)' }}>
                                    <Battery size={40} style={{ marginBottom: '12px', opacity: 0.5 }} />
                                    <p>Loading available slots...</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Step 4: Confirmation */}
                    {currentStep === 3 && bookingResult && (
                        <div className={styles.confirmation}>
                            <div className={styles.confirmIcon}>
                                <CheckCircle2 size={48} />
                            </div>
                            <h2 className={styles.confirmTitle}>Charging Request Submitted!</h2>
                            <p className={styles.confirmSubtitle}>Your session has been queued successfully.</p>

                            <div className={styles.confirmCard}>
                                <div className={styles.confirmRow}>
                                    <span>Session ID</span>
                                    <span className={styles.confirmValue}>{bookingResult.sessionCode || bookingResult.session_code}</span>
                                </div>
                                <div className={styles.confirmRow}>
                                    <span>Vehicle</span>
                                    <span className={styles.confirmValue}>{formData.vehicleModel === 'Other (Custom)' ? formData.customVehicle : formData.vehicleModel}</span>
                                </div>
                                <div className={styles.confirmRow}>
                                    <span>License Plate</span>
                                    <span className={styles.confirmValue}>{formData.licensePlate}</span>
                                </div>
                                <div className={styles.confirmRow}>
                                    <span>Station</span>
                                    <span className={styles.confirmValue}>{bookingResult.station || 'Assigned'}</span>
                                </div>
                                <div className={styles.confirmRow}>
                                    <span>Zone</span>
                                    <span className={styles.confirmValue}>{bookingResult.zone || 'Assigned'}</span>
                                </div>
                                <div className={styles.confirmRow}>
                                    <span>Charge Target</span>
                                    <span className={styles.confirmValue}>{formData.currentCharge}% → {formData.targetCharge}%</span>
                                </div>
                                <div className={styles.confirmRow}>
                                    <span>Est. Cost</span>
                                    <span className={styles.confirmValue}>₹{(bookingResult.estimatedCost || bookingResult.total_cost || 0).toLocaleString('en-IN')}</span>
                                </div>
                            </div>

                            <div className={styles.confirmActions}>
                                <Link href={`/status?session=${bookingResult.sessionCode || bookingResult.session_code}`} className="btn btn-primary btn-lg">
                                    Track My Session
                                    <ArrowRight size={18} />
                                </Link>
                                <Link href="/bookings" className="btn btn-secondary btn-lg">
                                    View All Bookings
                                </Link>
                            </div>
                        </div>
                    )}
                </div>

                {/* Navigation */}
                {currentStep < 3 && (
                    <div className={styles.formNav}>
                        {currentStep > 0 ? (
                            <button className="btn btn-secondary" onClick={handleBack}>
                                <ArrowLeft size={16} />
                                Back
                            </button>
                        ) : <div />}
                        <button
                            className="btn btn-primary"
                            onClick={handleNext}
                            disabled={!canProceed() || booking}
                        >
                            {booking ? 'Booking...' : currentStep === 2 ? 'Confirm Booking' : 'Continue'}
                            {!booking && <ArrowRight size={16} />}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
