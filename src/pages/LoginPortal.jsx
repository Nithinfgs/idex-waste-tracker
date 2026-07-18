import React, { useContext, useState } from 'react';
import { StateContext } from '../context/StateContext';
import { Shield, Sparkles, Phone, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';

export default function LoginPortal({ onLoginSuccess }) {
  const { 
    schools, 
    collectors, 
    setCurrentRole, 
    setSelectedSchoolId, 
    setSelectedCollectorId,
    addToast
  } = useContext(StateContext);

  const [step, setStep] = useState('splash'); // 'splash' | 'role-select' | 'phone-input' | 'otp-input' | 'onboarding'
  const [role, setRole] = useState(''); // 'school' | 'collector' | 'admin'
  
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');

  // Onboarding wizard states
  const [onboardStep, setOnboardStep] = useState(1);
  const [schoolDetails, setSchoolDetails] = useState({
    name: 'Government High School, Gandhipuram',
    strength: 420,
    capacity: 40,
    contact: '',
    address: 'Cross Cut Road, Gandhipuram, Coimbatore'
  });
  const [collectorDetails, setCollectorDetails] = useState({
    name: 'Ravi Kumar',
    type: 'Farmer',
    radius: 10,
    vehicle: 'Tractor'
  });

  const handleRoleSelect = (selectedRole) => {
    setRole(selectedRole);
    setStep('phone-input');
  };

  const handleSendOtp = (e) => {
    e.preventDefault();
    if (!phone || phone.length < 10) {
      alert('Please enter a valid 10-digit phone number.');
      return;
    }
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    setGeneratedOtp(code);
    setStep('otp-input');
    setTimeout(() => {
      addToast(`[SMS Gateway] OTP sent to +91 ${phone}: ${code}`, 'success');
    }, 800);
  };

  const handleVerifyOtp = (e) => {
    e.preventDefault();
    if (otp === generatedOtp || otp === '1234' || otp === '0000') {
      setOtpError('');
      // Set roles and profiles
      setCurrentRole(role);
      if (role === 'school') {
        const found = schools.find(s => s.contact.includes(phone) || s.id === 'sch-1');
        setSelectedSchoolId(found ? found.id : 'sch-1');
        setStep('onboarding');
      } else if (role === 'collector') {
        const found = collectors.find(c => c.phone.includes(phone) || c.id === 'col-1');
        setSelectedCollectorId(found ? found.id : 'col-1');
        setStep('onboarding');
      } else {
        // Admin skips onboarding
        onLoginSuccess();
      }
    } else {
      setOtpError(`Invalid OTP code. Please enter the code sent via SMS (${generatedOtp}) or 1234.`);
    }
  };

  const handleSchoolOnboard = () => {
    if (onboardStep < 4) {
      setOnboardStep(s => s + 1);
    } else {
      // Completed School Onboarding
      onLoginSuccess();
    }
  };

  const handleCollectorOnboard = () => {
    if (onboardStep < 4) {
      setOnboardStep(s => s + 1);
    } else {
      // Completed Collector Onboarding
      onLoginSuccess();
    }
  };

  return (
    <div style={styles.container}>
      {/* 1. SPLASH SCREEN */}
      {step === 'splash' && (
        <div style={styles.content}>
          <div style={styles.logoBadge}>
            <Sparkles size={48} color="var(--color-primary)" />
          </div>
          <h1 style={styles.brandTitle}>IDEX</h1>
          <p style={styles.tagline}>Waste Less. Feed Better.</p>
          
          <div className="card" style={styles.splashCard}>
            <p style={styles.splashDesc}>
              A smart marketplace connecting school mid-day meal programs with local organic collectors. Divert food waste, recommendations, and feed farmers.
            </p>
          </div>

          <button 
            onClick={() => setStep('role-select')} 
            className="btn-primary" 
            style={styles.actionBtn}
          >
            Get Started
            <ArrowRight size={18} style={{ marginLeft: '8px' }} />
          </button>
        </div>
      )}

      {/* 2. CHOOSE USER TYPE */}
      {step === 'role-select' && (
        <div style={styles.content}>
          <h2 style={styles.stepTitle}>Choose User Type</h2>
          <p style={styles.stepSubtitle}>Select your profile type to register or log into the platform.</p>
          
          <div style={styles.roleGrid}>
            <button 
              onClick={() => handleRoleSelect('school')} 
              className="card card-interactive" 
              style={styles.roleCard}
            >
              <span style={styles.roleIcon}>🏫</span>
              <div>
                <h4 style={styles.roleCardTitle}>Mid-day Meal School</h4>
                <p style={styles.roleCardDesc}>Cook daily meals, track waste levels, and request pickups.</p>
              </div>
            </button>

            <button 
              onClick={() => handleRoleSelect('collector')} 
              className="card card-interactive" 
              style={styles.roleCard}
            >
              <span style={styles.roleIcon}>🚜</span>
              <div>
                <h4 style={styles.roleCardTitle}>Waste Collector / Farmer</h4>
                <p style={styles.roleCardDesc}>Divert organic waste for composting or livestock feed.</p>
              </div>
            </button>

            <button 
              onClick={() => handleRoleSelect('admin')} 
              className="card card-interactive" 
              style={styles.roleCard}
            >
              <span style={styles.roleIcon}>🏛️</span>
              <div>
                <h4 style={styles.roleCardTitle}>District Administrator</h4>
                <p style={styles.roleCardDesc}>Monitor waste generation and collection success rates.</p>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* 3. PHONE NUMBER LOGIN */}
      {step === 'phone-input' && (
        <div style={styles.content}>
          <h2 style={styles.stepTitle}>Enter Phone Number</h2>
          <p style={styles.stepSubtitle}>We will send a one-time OTP to authenticate your profile.</p>

          <form onSubmit={handleSendOtp} className="card" style={{ width: '100%', padding: '20px' }}>
            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label className="form-label">Phone Number</label>
              <div style={styles.inputWithIcon}>
                <Phone size={18} style={styles.inputIcon} />
                <input 
                  type="tel" 
                  placeholder="e.g. 9876543210" 
                  className="form-input" 
                  style={{ paddingLeft: '38px' }}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn-primary">
              Send OTP
              <ChevronRightIcon />
            </button>
          </form>

          <button onClick={() => setStep('role-select')} style={styles.backLink}>
            Back to roles
          </button>
        </div>
      )}

      {/* 4. OTP VERIFICATION */}
      {step === 'otp-input' && (
        <div style={styles.content}>
          <h2 style={styles.stepTitle}>Enter Verification Code</h2>
          <p style={styles.stepSubtitle}>Type the 4-digit code sent to your phone (Use 1234 to bypass).</p>

          <form onSubmit={handleVerifyOtp} className="card" style={{ width: '100%', padding: '20px' }}>
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label className="form-label">One-Time Password (OTP)</label>
              <input 
                type="text" 
                placeholder="xxxx" 
                className="form-input" 
                style={{ textAlign: 'center', fontSize: '1.25rem', letterSpacing: '0.5em' }}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 4))}
                required
              />
              {otpError && <span style={styles.errorText}>{otpError}</span>}
            </div>

            <button type="submit" className="btn-primary">
              Verify Code
            </button>
          </form>

          <button onClick={() => setStep('phone-input')} style={styles.backLink}>
            Resend Code
          </button>
        </div>
      )}

      {/* 5. ONBOARDING WIZARD */}
      {step === 'onboarding' && (
        <div style={styles.content}>
          {role === 'school' ? (
            /* School Onboarding Steps */
            <div className="card" style={{ width: '100%', padding: '20px' }}>
              <div style={styles.onboardHeader}>
                <h3>School Setup</h3>
                <span>Step {onboardStep} of 4</span>
              </div>

              {onboardStep === 1 && (
                <div>
                  <h4 style={styles.onboardTitle}>Welcome to IDEX!</h4>
                  <p style={styles.onboardDesc}>
                    IDEX helps government schools minimize surplus meals and divert inevitable organic waste to verified local collectors.
                  </p>
                  <div style={styles.shieldInfo}>
                    <ShieldCheck size={28} color="var(--color-primary)" style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: '0.75rem', color: '#1B5E20' }}>
                      Your profile matches district sanitation programs.
                    </span>
                  </div>
                </div>
              )}

              {onboardStep === 2 && (
                <div>
                  <h4 style={styles.onboardTitle}>Verify School Profile</h4>
                  <p style={styles.onboardDesc}>Confirm school metadata matches district registration files.</p>
                  
                  <div className="form-group">
                    <label className="form-label">School Name</label>
                    <input 
                      type="text" 
                      className="form-input"
                      value={schoolDetails.name}
                      onChange={(e) => setSchoolDetails(s => ({ ...s, name: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Total Student Strength</label>
                    <input 
                      type="number" 
                      className="form-input"
                      value={schoolDetails.strength}
                      onChange={(e) => setSchoolDetails(s => ({ ...s, strength: parseInt(e.target.value) || 0 }))}
                    />
                  </div>
                </div>
              )}

              {onboardStep === 3 && (
                <div>
                  <h4 style={styles.onboardTitle}>Set Food Drum Capacity</h4>
                  <p style={styles.onboardDesc}>Configure standard organic waste container capacity in kilograms.</p>
                  
                  <div className="form-group">
                    <label className="form-label">Drums Capacity (kg)</label>
                    <input 
                      type="number" 
                      className="form-input"
                      value={schoolDetails.capacity}
                      onChange={(e) => setSchoolDetails(s => ({ ...s, capacity: parseFloat(e.target.value) || 0 }))}
                    />
                  </div>
                  <p style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)' }}>
                    Note: Typical schools use standard 40kg food waste drums.
                  </p>
                </div>
              )}

              {onboardStep === 4 && (
                <div style={{ textAlign: 'center' }}>
                  <CheckCircle2 size={48} color="var(--color-primary)" style={{ margin: '0 auto 12px auto' }} />
                  <h4 style={styles.onboardTitle}>Onboarding Completed!</h4>
                  <p style={styles.onboardDesc}>
                    Your school is registered. You can now request meal recommendation predictions and post surplus food.
                  </p>
                </div>
              )}

              <button onClick={handleSchoolOnboard} className="btn-primary" style={{ marginTop: '20px' }}>
                {onboardStep === 4 ? 'Enter Dashboard' : 'Next'}
              </button>
            </div>
          ) : (
            /* Collector Onboarding Steps */
            <div className="card" style={{ width: '100%', padding: '20px' }}>
              <div style={styles.onboardHeader}>
                <h3>Collector Onboarding</h3>
                <span>Step {onboardStep} of 4</span>
              </div>

              {onboardStep === 1 && (
                <div>
                  <h4 style={styles.onboardTitle}>Become a waste collector</h4>
                  <p style={styles.onboardDesc}>
                    Match with nearby schools to collect rich organic feedstock. Help farms secure feed and divert waste.
                  </p>
                </div>
              )}

              {onboardStep === 2 && (
                <div>
                  <h4 style={styles.onboardTitle}>Choose Collector Type</h4>
                  <p style={styles.onboardDesc}>Select what category fits your business profile.</p>
                  
                  <div className="form-group">
                    <select 
                      className="form-input"
                      value={collectorDetails.type}
                      onChange={(e) => setCollectorDetails(c => ({ ...c, type: e.target.value }))}
                    >
                      <option value="Farmer">Farmer (Livestock Feed)</option>
                      <option value="Compost Company">Compost Producer</option>
                      <option value="Vermicompost Producer">Vermicompost Producer</option>
                      <option value="Organic Buyer">Organic Waste Buyer</option>
                      <option value="Recycling Company">Recycling Factory</option>
                    </select>
                  </div>
                </div>
              )}

              {onboardStep === 3 && (
                <div>
                  <h4 style={styles.onboardTitle}>Set Operating Radius</h4>
                  <p style={styles.onboardDesc}>Define the maximum distance you will travel to pick up waste.</p>
                  
                  <div className="form-group">
                    <label className="form-label">Operating Radius (km)</label>
                    <input 
                      type="number" 
                      className="form-input"
                      value={collectorDetails.radius}
                      onChange={(e) => setCollectorDetails(c => ({ ...c, radius: parseFloat(e.target.value) || 0 }))}
                    />
                  </div>
                </div>
              )}

              {onboardStep === 4 && (
                <div style={{ textAlign: 'center' }}>
                  <CheckCircle2 size={48} color="var(--color-primary)" style={{ margin: '0 auto 12px auto' }} />
                  <h4 style={styles.onboardTitle}>Setup Successful!</h4>
                  <p style={styles.onboardDesc}>
                    We will notify you immediately whenever new organic waste matches your radius and filters.
                  </p>
                </div>
              )}

              <button onClick={handleCollectorOnboard} className="btn-primary" style={{ marginTop: '20px' }}>
                {onboardStep === 4 ? 'Browse Marketplace' : 'Next'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const ChevronRightIcon = () => (
  <svg style={{ marginLeft: '8px' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
);

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    padding: '24px',
    backgroundColor: 'var(--color-background)'
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '100%',
    maxWidth: '360px'
  },
  logoBadge: {
    backgroundColor: '#E8F5E9',
    padding: '16px',
    borderRadius: '24px',
    marginBottom: '12px'
  },
  brandTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: '2.5rem',
    fontWeight: 700,
    color: 'var(--color-primary)',
    lineHeight: '1',
    letterSpacing: '-0.03em'
  },
  tagline: {
    fontFamily: 'var(--font-display)',
    fontSize: '0.85rem',
    color: 'var(--color-text-secondary)',
    fontWeight: 500,
    marginBottom: '24px'
  },
  splashCard: {
    padding: '16px',
    textAlign: 'center',
    marginBottom: '32px',
    border: '1px solid var(--color-border)'
  },
  splashDesc: {
    fontSize: '0.8rem',
    lineHeight: '1.4',
    color: 'var(--color-text-secondary)'
  },
  actionBtn: {
    width: '100%'
  },
  stepTitle: {
    fontSize: '1.35rem',
    marginBottom: '4px',
    textAlign: 'center'
  },
  stepSubtitle: {
    fontSize: '0.8rem',
    color: 'var(--color-text-secondary)',
    textAlign: 'center',
    marginBottom: '24px',
    lineHeight: '1.3'
  },
  roleGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    width: '100%'
  },
  roleCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '16px',
    textAlign: 'left',
    cursor: 'pointer',
    border: '1px solid var(--color-border)'
  },
  roleIcon: {
    fontSize: '1.75rem',
    backgroundColor: 'var(--color-background)',
    padding: '8px',
    borderRadius: '12px',
    flexShrink: 0
  },
  roleCardTitle: {
    fontSize: '0.9rem',
    fontWeight: 600,
    marginBottom: '2px'
  },
  roleCardDesc: {
    fontSize: '0.75rem',
    color: 'var(--color-text-secondary)',
    lineHeight: '1.3'
  },
  inputWithIcon: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center'
  },
  inputIcon: {
    position: 'absolute',
    left: '12px',
    color: 'var(--color-text-secondary)'
  },
  backLink: {
    marginTop: '20px',
    fontSize: '0.8rem',
    color: 'var(--color-text-secondary)',
    cursor: 'pointer',
    textDecoration: 'underline',
    border: 'none',
    minHeight: 'auto',
    minWidth: 'auto'
  },
  errorText: {
    fontSize: '0.7rem',
    color: 'var(--color-error)',
    marginTop: '4px',
    fontWeight: 500
  },
  onboardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid var(--color-border)',
    paddingBottom: '8px',
    marginBottom: '16px'
  },
  onboardTitle: {
    fontSize: '1rem',
    marginBottom: '8px'
  },
  onboardDesc: {
    fontSize: '0.75rem',
    color: 'var(--color-text-secondary)',
    lineHeight: '1.4',
    marginBottom: '16px'
  },
  shieldInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: '#E8F5E9',
    padding: '10px',
    borderRadius: '8px',
    border: '1px solid #C8E6C9'
  }
};
