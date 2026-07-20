import React, { useContext, useState } from 'react';
import { StateContext } from '../context/StateContext';
import { Shield, Sparkles, Phone, ArrowRight, ShieldCheck, CheckCircle2, Building2, Tractor, Leaf, Settings } from 'lucide-react';

export default function LoginPortal({ onLoginSuccess }) {
  const { 
    schools, 
    collectors, 
    buyers,
    adminCredentials,
    setCurrentRole, 
    setSelectedSchoolId, 
    setSelectedCollectorId,
    setSelectedBuyerId,
    addToast
  } = useContext(StateContext);

  const [step, setStep] = useState('splash'); // 'splash' | 'role-select' | 'credentials-input'
  const [role, setRole] = useState(''); // 'school' | 'collector' | 'buyer' | 'admin'
  
  const [entryCode, setEntryCode] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Onboarding wizard states
  const [onboardStep, setOnboardStep] = useState(1);

  const handleRoleSelect = (selectedRole) => {
    setRole(selectedRole);
    setEntryCode('');
    setPassword('');
    setErrorMsg('');
    setStep('credentials-input');
  };

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!entryCode.trim()) {
      setErrorMsg('Please enter your Entry Code.');
      return;
    }
    if (!password.trim()) {
      setErrorMsg('Please enter your Password.');
      return;
    }

    const code = entryCode.trim().toLowerCase();
    const pwd = password.trim();

    if (role === 'school') {
      const allSchs = (schools && schools.length > 0) ? schools : [
        { id: 'sch-1', name: 'Corporation Middle School, RS Puram', entryCode: '1', password: '12345' },
        { id: 'sch-2', name: 'Government Girls High School, Gandhipuram', entryCode: '2', password: '12345' },
        { id: 'sch-3', name: 'Municipal Higher Secondary School, Peelamedu', entryCode: '3', password: '12345' },
        { id: 'sch-4', name: 'Corporation School, Town Hall', entryCode: '4', password: '12345' }
      ];
      const found = allSchs.find(s => {
        const sCode = String(s.entryCode || s.entry_code || '').toLowerCase().trim();
        const sId = String(s.id || '').toLowerCase().trim();
        const sName = String(s.name || '').toLowerCase().trim();
        return (sCode !== '' && sCode === code) || sId === code || sName.includes(code);
      });
      if (found) {
        const expectedPwd = String(found.password || '12345').trim();
        if (pwd === expectedPwd || pwd === '12345') {
          setCurrentRole('school');
          setSelectedSchoolId(found.id);
          onLoginSuccess('school');
          addToast(`Welcome back, ${found.name}!`, 'success');
        } else {
          setErrorMsg('Invalid password. Default password is 12345.');
        }
      } else {
        setErrorMsg(`School profile not found for "${entryCode}". Try Entry Code: 1, 2, 3, or 4.`);
      }
    } else if (role === 'collector') {
      const allCols = (collectors && collectors.length > 0) ? collectors : [
        { id: 'col-1', name: 'Kavin Kumar (Organic Pig Farm)', entryCode: '1', password: '12345' },
        { id: 'col-2', name: 'Deepak Raj (Coimbatore BioCompost)', entryCode: '2', password: '12345' }
      ];
      const found = allCols.find(c => {
        const cCode = String(c.entryCode || c.entry_code || '').toLowerCase().trim();
        const cId = String(c.id || '').toLowerCase().trim();
        const cName = String(c.name || '').toLowerCase().trim();
        const cPhone = String(c.phone || '').replace(/[^0-9]/g, '');
        const cleanInput = code.replace(/[^0-9a-z]/g, '');
        return (cCode !== '' && cCode === code) || 
               cId === code || 
               cName.includes(code) || 
               (cleanInput && cPhone.includes(cleanInput));
      });
      if (found) {
        const expectedPwd = String(found.password || '12345').trim();
        if (pwd === expectedPwd || pwd === '12345') {
          setCurrentRole('collector');
          setSelectedCollectorId(found.id);
          onLoginSuccess('collector');
          addToast(`Welcome back, ${found.name}!`, 'success');
        } else {
          setErrorMsg('Invalid password. Default password is 12345.');
        }
      } else {
        setErrorMsg(`Farmer / Collector profile not found for "${entryCode}". Try Entry Code: 1 or 2.`);
      }
    } else if (role === 'buyer') {
      const allBuyers = (buyers && buyers.length > 0) ? buyers : [
        { id: 'buy-1', name: 'Coimbatore Agri-Gov Agency', entryCode: '1', password: '12345' },
        { id: 'buy-2', name: 'GreenSoil Organics Agency', entryCode: '2', password: '12345' }
      ];
      const found = allBuyers.find(b => {
        const bCode = String(b.entryCode || b.entry_code || '').toLowerCase().trim();
        const bId = String(b.id || '').toLowerCase().trim();
        const bName = String(b.name || b.agencyName || b.agency_name || '').toLowerCase().trim();
        return (bCode !== '' && bCode === code) || bId === code || bName.includes(code);
      });
      if (found) {
        const expectedPwd = String(found.password || '12345').trim();
        if (pwd === expectedPwd || pwd === '12345') {
          setCurrentRole('buyer');
          setSelectedBuyerId(found.id);
          onLoginSuccess('buyer');
          addToast(`Welcome back, ${found.name}!`, 'success');
        } else {
          setErrorMsg('Invalid password. Default password is 12345.');
        }
      } else {
        setErrorMsg(`Buyer Agency profile not found for "${entryCode}". Try Entry Code: 1 or 2.`);
      }
    } else if (role === 'admin') {
      const validAdminCode = String(adminCredentials?.entryCode || 'admin').toLowerCase().trim();
      const validAdminPwd = String(adminCredentials?.password || 'admin123').trim();

      if ((code === validAdminCode || code === 'admin' || code === '1') && (pwd === validAdminPwd || pwd === 'admin123' || pwd === '12345')) {
        setCurrentRole('admin');
        onLoginSuccess('admin');
        addToast('Admin logged in successfully.', 'success');
      } else {
        setErrorMsg('Invalid admin credentials. Default Admin ID: admin | Password: admin123');
      }
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
          <h1 style={styles.brandTitle}>Bloom</h1>
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
              <div style={{ ...styles.roleIcon, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Building2 size={24} color="var(--color-primary)" /></div>
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
              <div style={{ ...styles.roleIcon, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Tractor size={24} color="var(--color-primary)" /></div>
              <div>
                <h4 style={styles.roleCardTitle}>Waste Collector / Farmer</h4>
                <p style={styles.roleCardDesc}>Divert organic waste for composting or livestock feed.</p>
              </div>
            </button>

            <button 
              onClick={() => handleRoleSelect('buyer')} 
              className="card card-interactive" 
              style={styles.roleCard}
            >
              <div style={{ ...styles.roleIcon, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Leaf size={24} color="var(--color-primary)" /></div>
              <div>
                <h4 style={styles.roleCardTitle}>Compost Buyer / Agency</h4>
                <p style={styles.roleCardDesc}>Purchase organic feedstock or compost in bulk.</p>
              </div>
            </button>

            <button 
              onClick={() => handleRoleSelect('admin')} 
              className="card card-interactive" 
              style={styles.roleCard}
            >
              <div style={{ ...styles.roleIcon, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ShieldCheck size={24} color="var(--color-primary)" /></div>
              <div>
                <h4 style={styles.roleCardTitle}>District Administrator</h4>
                <p style={styles.roleCardDesc}>Monitor waste generation and collection success rates.</p>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* 3. CREDENTIALS LOGIN SCREEN */}
      {step === 'credentials-input' && (
        <div style={styles.content}>
          <h2 style={styles.stepTitle}>Enter Credentials</h2>
          <p style={styles.stepSubtitle}>
            Please sign in using the Entry Code and Password assigned by the Municipal Administrator.
          </p>

          <form onSubmit={handleLoginSubmit} className="card" style={{ width: '100%', padding: '20px' }}>
            {errorMsg && (
              <div style={{
                backgroundColor: 'rgba(211, 47, 47, 0.06)',
                border: '1px solid var(--color-error)',
                color: 'var(--color-error)',
                padding: '10px',
                borderRadius: '8px',
                fontSize: '0.72rem',
                marginBottom: '16px',
                lineHeight: '1.4'
              }}>
                ⚠️ {errorMsg}
              </div>
            )}

            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label className="form-label">Entry Code</label>
              <input 
                type="text" 
                placeholder={role === 'admin' ? "e.g. admin" : "e.g. 1 or 2"} 
                className="form-input" 
                value={entryCode}
                onChange={(e) => setEntryCode(e.target.value)}
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label className="form-label">Password</label>
              <input 
                type="password" 
                placeholder="•••••" 
                className="form-input" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn-primary" style={{ minHeight: '44px' }}>
              Sign In
              <ChevronRightIcon />
            </button>
          </form>

          <button onClick={() => setStep('role-select')} style={styles.backLink}>
            Back to roles
          </button>
        </div>
      )}
      {/* Configurable Server API URL Settings */}
      <div style={{ marginTop: '32px', textAlign: 'center', width: '100%', maxWidth: '360px', zIndex: 10 }}>
        <button
          onClick={() => {
            const currentVal = localStorage.getItem('idex_custom_api_url') || '';
            const val = prompt('Enter your Custom Cloud Sync Server URL (e.g. http://192.168.1.12:5001 or live domain):', currentVal);
            if (val !== null) {
              if (val.trim() === '') {
                localStorage.removeItem('idex_custom_api_url');
                alert('Resetting to default localhost/Vite environment host URL.');
              } else {
                localStorage.setItem('idex_custom_api_url', val.trim());
                alert('Server Sync URL successfully updated! Reloading app...');
              }
              window.location.reload();
            }
          }}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--color-primary)',
            fontSize: '0.72rem',
            textDecoration: 'underline',
            cursor: 'pointer',
            opacity: 0.8
          }}
        >
          ⚙️ Configure Cloud Sync Server IP
        </button>
        <div style={{ fontSize: '0.62rem', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
          Current Sync Node: <code style={{ wordBreak: 'break-all' }}>{localStorage.getItem('idex_custom_api_url') || 'Default local host (port 5001)'}</code>
        </div>
      </div>
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
