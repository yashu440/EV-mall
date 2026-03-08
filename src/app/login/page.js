'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    Zap, Mail, Lock, User as UserIcon, Eye, EyeOff,
    ArrowRight, BatteryCharging, Sparkles, Shield
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import styles from './page.module.css';

export default function LoginPage() {
    const [mode, setMode] = useState('login'); // login or signup
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const { signIn, signUp, fetchProfile } = useAuth();
    const router = useRouter();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        try {
            if (mode === 'login') {
                const { data, error: err } = await signIn(email, password);
                if (err) {
                    setError(err.message);
                } else {
                    // Check if admin and redirect accordingly
                    const profile = await fetchProfile(data.user.id);
                    if (profile?.role === 'admin') {
                        router.push('/dashboard');
                    } else {
                        router.push('/charge');
                    }
                }
            } else {
                if (!fullName.trim()) {
                    setError('Please enter your full name');
                    setLoading(false);
                    return;
                }
                const { data, error: err } = await signUp(email, password, fullName);
                if (err) {
                    setError(err.message);
                } else if (data?.user?.identities?.length === 0) {
                    setError('An account with this email already exists.');
                } else {
                    setSuccess('Account created! You can now log in.');
                    setMode('login');
                    setPassword('');
                }
            }
        } catch (err) {
            setError('Something went wrong. Please try again.');
        }
        setLoading(false);
    };

    return (
        <div className={styles.loginPage}>
            <div className={styles.bgGlow} />
            <div className={styles.bgGlow2} />

            {/* Top Nav */}
            <nav className={styles.topNav}>
                <Link href="/" className={styles.logo}>
                    <div className={styles.logoIcon}>
                        <Zap size={18} />
                    </div>
                    <span className={styles.logoText}>GridWise</span>
                </Link>
            </nav>

            <div className={styles.loginContainer}>
                {/* Left Panel — Features */}
                <div className={styles.leftPanel}>
                    <div className={styles.leftContent}>
                        <div className={styles.leftBadge}>
                            <BatteryCharging size={14} />
                            <span>Smart EV Charging</span>
                        </div>
                        <h1 className={styles.leftTitle}>
                            Charge Smarter,
                            <br />
                            <span className={styles.leftGradient}>Not Harder</span>
                        </h1>
                        <p className={styles.leftDescription}>
                            Book your EV charging slot powered by AI. Get optimal scheduling,
                            real-time tracking, and transparent pricing.
                        </p>

                        <div className={styles.featureList}>
                            <div className={styles.featureItem}>
                                <div className={styles.featureIcon}>
                                    <Sparkles size={16} />
                                </div>
                                <div>
                                    <h4>AI-Optimized Slots</h4>
                                    <p>Get the best charging slot based on grid load and your schedule</p>
                                </div>
                            </div>
                            <div className={styles.featureItem}>
                                <div className={styles.featureIcon}>
                                    <BatteryCharging size={16} />
                                </div>
                                <div>
                                    <h4>Live Tracking</h4>
                                    <p>Monitor your charging progress in real-time</p>
                                </div>
                            </div>
                            <div className={styles.featureItem}>
                                <div className={styles.featureIcon}>
                                    <Shield size={16} />
                                </div>
                                <div>
                                    <h4>Secure & Reliable</h4>
                                    <p>Your data is protected with enterprise-grade security</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Panel — Form */}
                <div className={styles.rightPanel}>
                    <div className={styles.formCard}>
                        <div className={styles.formHeader}>
                            <h2>{mode === 'login' ? 'Welcome Back' : 'Create Account'}</h2>
                            <p>{mode === 'login'
                                ? 'Sign in to manage your charging sessions'
                                : 'Join GridWise to start charging smarter'
                            }</p>
                        </div>

                        {/* Mode Toggle */}
                        <div className={styles.modeToggle}>
                            <button
                                className={`${styles.modeBtn} ${mode === 'login' ? styles.modeBtnActive : ''}`}
                                onClick={() => { setMode('login'); setError(''); setSuccess(''); }}
                            >
                                Login
                            </button>
                            <button
                                className={`${styles.modeBtn} ${mode === 'signup' ? styles.modeBtnActive : ''}`}
                                onClick={() => { setMode('signup'); setError(''); setSuccess(''); }}
                            >
                                Sign Up
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className={styles.form}>
                            {mode === 'signup' && (
                                <div className={styles.inputGroup}>
                                    <label>Full Name</label>
                                    <div className={styles.inputWrapper}>
                                        <UserIcon size={16} className={styles.inputIcon} />
                                        <input
                                            type="text"
                                            placeholder="Enter your full name"
                                            value={fullName}
                                            onChange={(e) => setFullName(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>
                            )}

                            <div className={styles.inputGroup}>
                                <label>Email Address</label>
                                <div className={styles.inputWrapper}>
                                    <Mail size={16} className={styles.inputIcon} />
                                    <input
                                        type="email"
                                        placeholder="you@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <div className={styles.inputGroup}>
                                <label>Password</label>
                                <div className={styles.inputWrapper}>
                                    <Lock size={16} className={styles.inputIcon} />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="Enter your password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        minLength={6}
                                    />
                                    <button
                                        type="button"
                                        className={styles.eyeBtn}
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>

                            {error && <div className={styles.errorMsg}>{error}</div>}
                            {success && <div className={styles.successMsg}>{success}</div>}

                            <button
                                type="submit"
                                className={styles.submitBtn}
                                disabled={loading}
                            >
                                {loading ? (
                                    <span className={styles.spinner} />
                                ) : (
                                    <>
                                        {mode === 'login' ? 'Sign In' : 'Create Account'}
                                        <ArrowRight size={16} />
                                    </>
                                )}
                            </button>
                        </form>

                        <div className={styles.formFooter}>
                            <p>
                                {mode === 'login'
                                    ? "Don't have an account? "
                                    : 'Already have an account? '
                                }
                                <button
                                    className={styles.switchBtn}
                                    onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); setSuccess(''); }}
                                >
                                    {mode === 'login' ? 'Sign Up' : 'Sign In'}
                                </button>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
