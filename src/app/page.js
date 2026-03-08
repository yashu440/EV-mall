'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Zap, Battery, BarChart3, Shield, Clock, Users,
  ChevronRight, Star, ArrowRight, Menu, X,
  Cpu, Leaf, DollarSign, MapPin, BatteryCharging,
  CheckCircle2, Sparkles, Globe, Phone
} from 'lucide-react';
import styles from './page.module.css';
import { useAuth } from '@/context/AuthContext';

const features = [
  {
    icon: Cpu,
    title: 'AI-Powered Scheduling',
    description: 'Machine learning algorithms optimize charging slots based on grid capacity, mall traffic, and customer preferences in real-time.',
    gradient: 'linear-gradient(135deg, #10b981, #059669)',
  },
  {
    icon: BarChart3,
    title: 'Real-Time Grid Analytics',
    description: 'Monitor energy distribution, peak loads, and performance metrics with live dashboards and predictive insights.',
    gradient: 'linear-gradient(135deg, #6366f1, #4f46e5)',
  },
  {
    icon: Shield,
    title: 'Fairness Engine',
    description: 'Equitable distribution of charging slots prevents monopolization and ensures every shopper gets fair access.',
    gradient: 'linear-gradient(135deg, #3b82f6, #2563eb)',
  },
  {
    icon: DollarSign,
    title: 'Cost Optimization',
    description: 'Minimize energy costs with off-peak scheduling, demand response integration, and dynamic pricing strategies.',
    gradient: 'linear-gradient(135deg, #f59e0b, #d97706)',
  },
  {
    icon: MapPin,
    title: 'Zone Management',
    description: 'Multi-zone parking allocation with premium, standard, and express charging tiers across facility levels.',
    gradient: 'linear-gradient(135deg, #ec4899, #db2777)',
  },
  {
    icon: Leaf,
    title: 'Sustainability Tracking',
    description: 'Track CO₂ savings, solar integration windows, and environmental impact metrics for ESG reporting.',
    gradient: 'linear-gradient(135deg, #14b8a6, #0d9488)',
  },
];

const stats = [
  { value: '99.7%', label: 'Uptime', icon: Zap },
  { value: '42%', label: 'Cost Reduction', icon: DollarSign },
  { value: '12k+', label: 'Sessions/Month', icon: BatteryCharging },
  { value: '4.2t', label: 'CO₂ Saved', icon: Leaf },
];

const howItWorks = [
  {
    step: '01',
    title: 'Arrive & Register',
    description: 'Scan QR code at parking entry or use the mobile app to register your vehicle and charging needs.',
  },
  {
    step: '02',
    title: 'AI Schedules',
    description: 'Our AI analyzes grid load, your shopping duration, and preferences to assign the optimal charging slot.',
  },
  {
    step: '03',
    title: 'Shop & Charge',
    description: 'Enjoy shopping while your vehicle charges. Get real-time updates on your phone.',
  },
  {
    step: '04',
    title: 'Done & Go',
    description: 'Receive completion notification, review your session summary, and drive away fully charged.',
  },
];

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, profile, isAdmin, signOut } = useAuth();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className={styles.landing}>
      {/* Navigation */}
      <nav className={`${styles.nav} ${scrolled ? styles.navScrolled : ''}`}>
        <div className={`container ${styles.navInner}`}>
          <Link href="/" className={styles.logo}>
            <div className={styles.logoIcon}>
              <Zap size={20} />
            </div>
            <span className={styles.logoText}>GridWise</span>
          </Link>

          <div className={styles.navLinks}>
            <a href="#features">Features</a>
            <a href="#how-it-works">How It Works</a>
            <a href="#stats">Impact</a>
            {user ? (
              <>
                <Link href="/charge" className="btn btn-outline btn-sm">
                  <BatteryCharging size={14} />
                  Start Charging
                </Link>
                {isAdmin && (
                  <Link href="/dashboard" className="btn btn-primary btn-sm">
                    Dashboard
                    <ArrowRight size={14} />
                  </Link>
                )}
                <button onClick={() => signOut()} className="btn btn-ghost btn-sm">
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="btn btn-outline btn-sm">
                  Login
                </Link>
                <Link href="/login" className="btn btn-primary btn-sm">
                  Sign Up
                  <ArrowRight size={14} />
                </Link>
              </>
            )}
          </div>

          <button
            className={styles.mobileToggle}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className={styles.mobileMenu}>
            <a href="#features" onClick={() => setMobileMenuOpen(false)}>Features</a>
            <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)}>How It Works</a>
            <a href="#stats" onClick={() => setMobileMenuOpen(false)}>Impact</a>
            <Link href="/charge" className="btn btn-outline" onClick={() => setMobileMenuOpen(false)}>
              Start Charging
            </Link>
            <Link href="/dashboard" className="btn btn-primary" onClick={() => setMobileMenuOpen(false)}>
              Dashboard
            </Link>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroGlow} />
        <div className={styles.heroGlowAccent} />
        <div className={`container ${styles.heroContent}`}>
          <div className={styles.heroBadge}>
            <Sparkles size={14} />
            <span>AI-Powered EV Infrastructure</span>
          </div>

          <h1 className={styles.heroTitle}>
            Smart Charging for
            <br />
            <span className={styles.heroGradient}>Modern Malls</span>
          </h1>

          <p className={styles.heroDescription}>
            Intelligent EV charging management powered by AI. Optimize grid load,
            reduce costs, and delight shoppers with seamless charging experiences.
          </p>

          <div className={styles.heroCTA}>
            <Link href="/dashboard" className="btn btn-primary btn-lg">
              <BarChart3 size={18} />
              View Dashboard
            </Link>
            <Link href="/charge" className="btn btn-secondary btn-lg">
              <BatteryCharging size={18} />
              Request Charge
            </Link>
          </div>

          <div className={styles.heroStats}>
            {stats.map((stat) => (
              <div key={stat.label} className={styles.heroStat}>
                <stat.icon size={16} className={styles.heroStatIcon} />
                <span className={styles.heroStatValue}>{stat.value}</span>
                <span className={styles.heroStatLabel}>{stat.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Animated EV graphic */}
        <div className={styles.heroVisual}>
          <div className={styles.chargingAnimation}>
            <div className={styles.chargingRing} />
            <div className={styles.chargingRing2} />
            <div className={styles.chargingCenter}>
              <BatteryCharging size={48} />
              <span>87%</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className={`section ${styles.features}`}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTag}>
              <Cpu size={14} />
              Core Features
            </span>
            <h2 className={styles.sectionTitle}>Everything You Need to Manage EV Charging</h2>
            <p className={styles.sectionDescription}>
              From AI scheduling to real-time monitoring, GridWise provides a complete
              platform for intelligent EV charging management.
            </p>
          </div>

          <div className={styles.featuresGrid}>
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className={`card card-interactive ${styles.featureCard}`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className={styles.featureIcon} style={{ background: feature.gradient }}>
                  <feature.icon size={22} color="white" />
                </div>
                <h3 className={styles.featureTitle}>{feature.title}</h3>
                <p className={styles.featureDescription}>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className={`section ${styles.howItWorks}`}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTag}>
              <Clock size={14} />
              How It Works
            </span>
            <h2 className={styles.sectionTitle}>Seamless Charging in 4 Steps</h2>
            <p className={styles.sectionDescription}>
              A frictionless charging experience from arrival to departure.
            </p>
          </div>

          <div className={styles.stepsGrid}>
            {howItWorks.map((item, index) => (
              <div key={item.step} className={styles.stepCard}>
                <div className={styles.stepNumber}>{item.step}</div>
                <div className={styles.stepConnector} />
                <h3 className={styles.stepTitle}>{item.title}</h3>
                <p className={styles.stepDescription}>{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section id="stats" className={`section ${styles.impactSection}`}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTag}>
              <Globe size={14} />
              Impact
            </span>
            <h2 className={styles.sectionTitle}>Making a Real Difference</h2>
          </div>

          <div className={styles.impactGrid}>
            <div className={styles.impactCard}>
              <div className={styles.impactValue}>₹10,35,000</div>
              <div className={styles.impactLabel}>Monthly Cost Savings</div>
              <div className={styles.impactDetail}>via AI-optimized scheduling</div>
            </div>
            <div className={styles.impactCard}>
              <div className={styles.impactValue}>4.2 tons</div>
              <div className={styles.impactLabel}>CO₂ Saved Monthly</div>
              <div className={styles.impactDetail}>through smart load balancing</div>
            </div>
            <div className={styles.impactCard}>
              <div className={styles.impactValue}>94%</div>
              <div className={styles.impactLabel}>Customer Satisfaction</div>
              <div className={styles.impactDetail}>across all parking zones</div>
            </div>
            <div className={styles.impactCard}>
              <div className={styles.impactValue}>8 min</div>
              <div className={styles.impactLabel}>Avg Wait Time</div>
              <div className={styles.impactDetail}>down from 25 min baseline</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className={`section ${styles.ctaSection}`}>
        <div className="container">
          <div className={styles.ctaCard}>
            <div className={styles.ctaGlow} />
            <h2 className={styles.ctaTitle}>Ready to Transform Your EV Charging?</h2>
            <p className={styles.ctaDescription}>
              Join leading malls and retail centers using GridWise to optimize their
              EV charging infrastructure.
            </p>
            <div className={styles.ctaButtons}>
              <Link href="/dashboard" className="btn btn-primary btn-lg">
                Explore Dashboard
                <ArrowRight size={18} />
              </Link>
              <Link href="/charge" className="btn btn-secondary btn-lg">
                Try It Now
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={`container ${styles.footerInner}`}>
          <div className={styles.footerBrand}>
            <div className={styles.logo}>
              <div className={styles.logoIcon}>
                <Zap size={18} />
              </div>
              <span className={styles.logoText}>GridWise</span>
            </div>
            <p className={styles.footerDescription}>
              AI-powered EV charging management for modern commercial spaces.
            </p>
          </div>

          <div className={styles.footerLinks}>
            <div className={styles.footerColumn}>
              <h4>Product</h4>
              <a href="#features">Features</a>
              <Link href="/dashboard">Dashboard</Link>
              <Link href="/dashboard/analytics">Analytics</Link>
              <Link href="/charge">Start Charging</Link>
            </div>
            <div className={styles.footerColumn}>
              <h4>Company</h4>
              <a href="#">About</a>
              <a href="#">Careers</a>
              <a href="#">Blog</a>
              <a href="#">Contact</a>
            </div>
            <div className={styles.footerColumn}>
              <h4>Legal</h4>
              <a href="#">Privacy</a>
              <a href="#">Terms</a>
              <a href="#">Security</a>
            </div>
          </div>
        </div>

        <div className={`container ${styles.footerBottom}`}>
          <p>&copy; 2026 GridWise. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
