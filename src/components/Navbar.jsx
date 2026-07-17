import React, { useContext, useState } from 'react';
import { StateContext } from '../context/StateContext';
import { 
  Home, 
  BarChart3, 
  ShoppingBag, 
  Bell, 
  User, 
  Shield, 
  Map, 
  Truck, 
  ListOrdered,
  Clock,
  LogOut
} from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab }) {
  const { 
    currentRole, 
    setCurrentRole, 
    schools, 
    selectedSchoolId, 
    setSelectedSchoolId,
    collectors,
    selectedCollectorId,
    setSelectedCollectorId,
    notifications,
    setIsLoggedIn
  } = useContext(StateContext);

  const [showRolePanel, setShowRolePanel] = useState(false);

  // Filter unread notifications for count badge
  const unreadCount = notifications.filter(n => {
    if (currentRole === 'school') return n.role === 'school' && n.targetId === selectedSchoolId && !n.read;
    if (currentRole === 'collector') return n.role === 'collector' && n.targetId === selectedCollectorId && !n.read;
    return false;
  }).length;

  const getTabs = () => {
    switch (currentRole) {
      case 'school':
        return [
          { id: 'home', label: 'Home', icon: Home },
          { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
          { id: 'collections', label: 'Collections', icon: Clock },
          { id: 'notifications', label: 'Alerts', icon: Bell, badge: unreadCount },
          { id: 'profile', label: 'Profile', icon: User }
        ];
      case 'collector':
        return [
          { id: 'home', label: 'Home', icon: Home },
          { id: 'nearby', label: 'Nearby', icon: Map },
          { id: 'active', label: 'Active', icon: Truck },
          { id: 'notifications', label: 'Alerts', icon: Bell, badge: unreadCount },
          { id: 'profile', label: 'Profile', icon: User }
        ];
      case 'admin':
        return [
          { id: 'dashboard', label: 'Analytics', icon: BarChart3 },
          { id: 'schools', label: 'Schools', icon: ListOrdered },
          { id: 'notifications', label: 'Alerts', icon: Bell },
          { id: 'profile', label: 'Settings', icon: Shield }
        ];
      default:
        return [];
    }
  };

  const handleRoleChange = (role) => {
    setCurrentRole(role);
    setShowRolePanel(false);
    if (role === 'school') {
      setActiveTab('home');
    } else if (role === 'collector') {
      setActiveTab('home');
    } else if (role === 'admin') {
      setActiveTab('dashboard');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
  };

  const tabs = getTabs();
  const currentSchool = schools.find(s => s.id === selectedSchoolId);
  const currentCollector = collectors.find(c => c.id === selectedCollectorId);

  return (
    <>
      {/* Top Role Switcher Header */}
      <header style={styles.header}>
        <div style={styles.brandContainer}>
          <span style={styles.logoText}>IDEX</span>
          <span style={styles.tagline}>Waste Less. Feed Better.</span>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button 
            onClick={() => setShowRolePanel(!showRolePanel)}
            style={{
              ...styles.roleButton,
              backgroundColor: currentRole === 'admin' ? '#EAEFF8' : '#E8F5E9',
              color: currentRole === 'admin' ? '#1A237E' : '#1B5E20'
            }}
          >
            <Shield size={14} style={{ marginRight: '6px' }} />
            <span style={styles.roleButtonText}>
              {currentRole === 'school' && `School: ${currentSchool?.name.split(',')[0]}`}
              {currentRole === 'collector' && `Collector: ${currentCollector?.name.split(' ')[0]}`}
              {currentRole === 'admin' && 'District Admin'}
            </span>
          </button>
          
          <button onClick={handleLogout} style={styles.logoutBtn} title="Logout">
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {/* Role Switcher Overlay Panel */}
      {showRolePanel && (
        <div style={styles.overlay}>
          <div style={styles.panel}>
            <h3 style={styles.panelTitle}>Switch Active Role Profile</h3>
            <p style={styles.panelSubtitle}>Simulate workflows between schools, collectors, and admins in real-time.</p>
            
            <div style={styles.roleOptions}>
              {/* School Profile options */}
              <div style={styles.roleSection}>
                <h4 style={styles.sectionHeader}>School Portals</h4>
                {schools.map(sch => (
                  <button
                    key={sch.id}
                    onClick={() => {
                      setSelectedSchoolId(sch.id);
                      handleRoleChange('school');
                    }}
                    style={{
                      ...styles.selectOption,
                      border: currentRole === 'school' && selectedSchoolId === sch.id ? '2px solid var(--color-primary)' : '1px solid var(--color-border)'
                    }}
                  >
                    <span>🏫 {sch.name}</span>
                    <span style={styles.selectStrength}>{sch.studentStrength} students</span>
                  </button>
                ))}
              </div>

              {/* Collector Profile options */}
              <div style={styles.roleSection}>
                <h4 style={styles.sectionHeader}>Collector Portals</h4>
                {collectors.map(col => (
                  <button
                    key={col.id}
                    onClick={() => {
                      setSelectedCollectorId(col.id);
                      handleRoleChange('collector');
                    }}
                    style={{
                      ...styles.selectOption,
                      border: currentRole === 'collector' && selectedCollectorId === col.id ? '2px solid var(--color-primary)' : '1px solid var(--color-border)'
                    }}
                  >
                    <span>🚜 {col.name} ({col.collectorType})</span>
                    <span style={styles.selectStrength}>{col.vehicle}</span>
                  </button>
                ))}
              </div>

              {/* District Admin */}
              <div style={styles.roleSection}>
                <h4 style={styles.sectionHeader}>Government Officials</h4>
                <button
                  onClick={() => handleRoleChange('admin')}
                  style={{
                    ...styles.selectOption,
                    border: currentRole === 'admin' ? '2px solid #1A237E' : '1px solid var(--color-border)',
                    backgroundColor: '#F5F5FA'
                  }}
                >
                  <span>🏛️ District Admin Dashboard</span>
                  <span style={styles.selectStrength}>North District</span>
                </button>
              </div>
            </div>

            <button onClick={() => setShowRolePanel(false)} style={styles.closeBtn}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Bottom Navigation Bar */}
      <nav style={styles.nav}>
        <div style={styles.navContainer}>
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  ...styles.tabButton,
                  color: isActive ? 'var(--color-primary)' : 'var(--color-text-secondary)'
                }}
              >
                <div style={styles.iconWrapper}>
                  <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                  {tab.badge > 0 && (
                    <span style={styles.badge}>{tab.badge}</span>
                  )}
                </div>
                <span style={{
                  ...styles.tabLabel,
                  fontWeight: isActive ? '600' : '400'
                }}>
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}

const styles = {
  header: {
    height: '60px',
    backgroundColor: '#FFFFFF',
    borderBottom: '1px solid var(--color-border)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 var(--spacing-md)',
    position: 'sticky',
    top: 0,
    zIndex: 10,
    width: '100%'
  },
  brandContainer: {
    display: 'flex',
    flexDirection: 'column'
  },
  logoText: {
    fontFamily: 'var(--font-display)',
    fontSize: '1.25rem',
    fontWeight: 700,
    color: 'var(--color-primary)',
    lineHeight: '1.1'
  },
  tagline: {
    fontSize: '0.65rem',
    color: 'var(--color-text-secondary)',
    fontWeight: 500
  },
  roleButton: {
    minHeight: '36px',
    padding: '0 var(--spacing-sm)',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer'
  },
  roleButtonText: {
    fontSize: '0.75rem',
    fontWeight: 600,
    maxWidth: '120px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  logoutBtn: {
    width: '36px',
    height: '36px',
    minWidth: 'auto',
    minHeight: 'auto',
    borderRadius: '8px',
    border: '1px solid var(--color-border)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--color-text-secondary)'
  },
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 100,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 'var(--spacing-md)'
  },
  panel: {
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    width: '100%',
    maxWidth: '400px',
    padding: 'var(--spacing-lg)',
    maxHeight: '85vh',
    overflowY: 'auto',
    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)'
  },
  panelTitle: {
    fontSize: '1.15rem',
    marginBottom: 'var(--spacing-xs)'
  },
  panelSubtitle: {
    fontSize: '0.8rem',
    color: 'var(--color-text-secondary)',
    marginBottom: 'var(--spacing-md)',
    lineHeight: '1.3'
  },
  roleOptions: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--spacing-md)'
  },
  roleSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--spacing-xs)'
  },
  sectionHeader: {
    fontSize: '0.75rem',
    textTransform: 'uppercase',
    color: 'var(--color-text-secondary)',
    letterSpacing: '0.05em',
    marginBottom: 'var(--spacing-xs)',
    fontWeight: 700
  },
  selectOption: {
    minHeight: '44px',
    backgroundColor: '#FFFFFF',
    borderRadius: '10px',
    padding: 'var(--spacing-sm) var(--spacing-md)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    textAlign: 'left',
    width: '100%',
    cursor: 'pointer'
  },
  selectStrength: {
    fontSize: '0.7rem',
    color: 'var(--color-text-secondary)',
    fontWeight: 500
  },
  closeBtn: {
    width: '100%',
    marginTop: 'var(--spacing-lg)',
    padding: 'var(--spacing-sm)',
    border: '1px solid var(--color-border)',
    borderRadius: '8px',
    color: 'var(--color-text-secondary)',
    fontSize: '0.875rem',
    fontWeight: 500
  },
  nav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '64px',
    backgroundColor: '#FFFFFF',
    borderTop: '1px solid var(--color-border)',
    zIndex: 10,
    width: '100%'
  },
  navContainer: {
    display: 'flex',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'space-around'
  },
  tabButton: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    gap: '2px',
    background: 'none',
    border: 'none',
    minWidth: 'auto',
    minHeight: 'auto',
    cursor: 'pointer'
  },
  iconWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  badge: {
    position: 'absolute',
    top: '-6px',
    right: '-8px',
    backgroundColor: 'var(--color-error)',
    color: '#FFFFFF',
    fontSize: '0.65rem',
    fontWeight: 700,
    padding: '1px 5px',
    borderRadius: '9999px',
    lineHeight: '1'
  },
  tabLabel: {
    fontSize: '0.65rem',
    letterSpacing: '-0.01em'
  }
};
