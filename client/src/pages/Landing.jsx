import { Link } from 'react-router-dom';
import './Landing.css';

/**
 * Landing — Public homepage.
 * Hero section + How It Works + CTA.
 */
function Landing() {
  return (
    <div className="landing-page">
      {/* Navbar */}
      <nav className="landing-nav" id="landing-navbar">
        <div className="container landing-nav-inner">
          <Link to="/" className="landing-logo">
            <span className="gradient-text">Naukri</span>Boost
          </Link>
          <div className="landing-nav-actions">
            <Link to="/login" className="btn btn-ghost" id="nav-login-btn">
              Log In
            </Link>
            <Link to="/signup" className="btn btn-primary" id="nav-signup-btn">
              Sign Up Free
            </Link>
          </div>
        </div>
      </nav>

      {/* Background Grid Pattern */}
      <div className="landing-bg-grid" aria-hidden="true" />
      <div className="landing-bg-glow" aria-hidden="true" />

      {/* Hero Section */}
      <section className="hero-section" id="hero">
        <div className="container hero-content animate-fade-in-up">
          <div className="hero-badge">
            <span className="badge badge-success">✨ Free while in beta</span>
          </div>
          <h1 className="hero-title">
            Keep Your Naukri Profile Fresh.{' '}
            <span className="gradient-text">Automatically.</span>
          </h1>
          <p className="hero-subtitle">
            Boost your visibility to recruiters with daily AI-powered profile updates.
            Upload your resume once, and we handle the rest — headline refreshes,
            resume re-uploads, and activity tracking.
          </p>
          <div className="hero-actions">
            <Link to="/signup" className="btn btn-primary btn-lg" id="hero-cta-btn">
              Get Started Free
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12,5 19,12 12,19" />
              </svg>
            </Link>
            <a href="#how-it-works" className="btn btn-ghost btn-lg" id="hero-learn-more-btn">
              Learn More
            </a>
          </div>
          <p className="hero-trust">
            Trusted by <strong>200+</strong> professionals across India
          </p>
        </div>
      </section>

      {/* How It Works */}
      <section className="how-section" id="how-it-works">
        <div className="container">
          <h2 className="section-title animate-fade-in-up">
            How It Works
          </h2>
          <p className="section-subtitle animate-fade-in-up">
            Three simple steps to keep your profile at the top of recruiter searches.
          </p>

          <div className="steps-grid stagger-children">
            <div className="step-card glass-card" id="step-1">
              <div className="step-icon step-icon-blue">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <div className="step-number">01</div>
              <h3 className="step-title">Sign Up</h3>
              <p className="step-desc">
                Create your NaukriBoost account in 30 seconds. No credit card needed.
              </p>
            </div>

            <div className="step-card glass-card" id="step-2">
              <div className="step-icon step-icon-purple">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
                  <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
                </svg>
              </div>
              <div className="step-number">02</div>
              <h3 className="step-title">Connect Naukri</h3>
              <p className="step-desc">
                Log in to your Naukri account once through our secure browser window. We never store your password.
              </p>
            </div>

            <div className="step-card glass-card" id="step-3">
              <div className="step-icon step-icon-green">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                  <polyline points="22,4 12,14.01 9,11.01" />
                </svg>
              </div>
              <div className="step-number">03</div>
              <h3 className="step-title">Relax & Get Noticed</h3>
              <p className="step-desc">
                We automatically refresh your profile daily with AI-generated headlines and resume re-uploads.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="features-section" id="features">
        <div className="container">
          <h2 className="section-title animate-fade-in-up">
            Why NaukriBoost?
          </h2>
          <div className="features-grid stagger-children">
            <div className="feature-item">
              <div className="feature-icon">🤖</div>
              <h3>AI-Powered Headlines</h3>
              <p>Fresh, role-specific headlines generated daily using Google Gemini AI.</p>
            </div>
            <div className="feature-item">
              <div className="feature-icon">📄</div>
              <h3>Smart Resume Refresh</h3>
              <p>Your resume gets re-uploaded with a fresh timestamp — no manual work.</p>
            </div>
            <div className="feature-item">
              <div className="feature-icon">🔒</div>
              <h3>Zero Password Storage</h3>
              <p>We use session-capture tech. Your Naukri password never touches our servers.</p>
            </div>
            <div className="feature-item">
              <div className="feature-icon">📊</div>
              <h3>Activity Dashboard</h3>
              <p>Track every boost — see headlines used, success rates, and trends.</p>
            </div>
            <div className="feature-item">
              <div className="feature-icon">⏰</div>
              <h3>Custom Schedules</h3>
              <p>Choose when and how often your profile gets refreshed.</p>
            </div>
            <div className="feature-item">
              <div className="feature-icon">🛡️</div>
              <h3>Stealth Technology</h3>
              <p>Advanced anti-detection ensures your account stays safe.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section" id="final-cta">
        <div className="container cta-content">
          <h2 className="cta-title">
            Ready to Get Noticed by Recruiters?
          </h2>
          <p className="cta-subtitle">
            Join 200+ professionals who keep their Naukri profile fresh — automatically.
          </p>
          <Link to="/signup" className="btn btn-primary btn-lg" id="final-cta-btn">
            Start Free Today
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="container landing-footer-inner">
          <p className="landing-footer-text">
            © {new Date().getFullYear()} NaukriBoost. Built with ❤️ in India.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default Landing;
