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
  LogOut,
  MessageSquare,
  Users,
  Sun,
  Moon,
  SunMedium,
  Building2,
  Tractor,
  Leaf,
  ShieldCheck
} from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab }) {
  const { 
    currentRole, 
    setCurrentRole, 
    authenticatedRole,
    schools, 
    selectedSchoolId, 
    setSelectedSchoolId,
    collectors,
    selectedCollectorId,
    setSelectedCollectorId,
    buyers,
    selectedBuyerId,
    setSelectedBuyerId,
    notifications,
    setIsLoggedIn,
    saveStatus,
    t
  } = useContext(StateContext);

  const [showRolePanel, setShowRolePanel] = useState(false);

  // Filter unread notifications for count badge
  const unreadCount = notifications.filter(n => {
    if (currentRole === 'school') return n.role === 'school' && n.targetId === selectedSchoolId && !n.read;
    if (currentRole === 'collector') return n.role === 'collector' && n.targetId === selectedCollectorId && !n.read;
    if (currentRole === 'buyer') return n.role === 'buyer' && n.targetId === selectedBuyerId && !n.read;
    return false;
  }).length;

  const getTabs = () => {
    switch (currentRole) {
      case 'school':
        return [
          { id: 'home', label: t('dashboard'), icon: Home },
          { id: 'collections', label: t('collections'), icon: ShoppingBag },
          { id: 'dashboard', label: 'Food Audit', icon: BarChart3 },
          { id: 'notifications', label: t('notifications'), icon: Bell, badge: unreadCount },
          { id: 'profile', label: t('profile'), icon: User }
        ];
      case 'collector':
        return [
          { id: 'home', label: t('dashboard'), icon: Home },
          { id: 'nearby', label: 'Map', icon: Map },
          { id: 'active', label: t('activePickups'), icon: Truck },
          { id: 'notifications', label: t('notifications'), icon: Bell, badge: unreadCount },
          { id: 'profile', label: t('profile'), icon: User }
        ];
      case 'buyer':
        return [
          { id: 'home', label: 'Dashboard', icon: Home },
          { id: 'nearby', label: 'Feedstock Map', icon: Map },
          { id: 'active', label: 'My Orders', icon: Truck },
          { id: 'notifications', label: 'Alerts', icon: Bell, badge: unreadCount },
          { id: 'profile', label: 'Agency Profile', icon: User }
        ];
      case 'admin':
        return [
          { id: 'dashboard', label: t('analytics'), icon: BarChart3 },
          { id: 'registry', label: 'Registry Control', icon: Users },
          { id: 'sms', label: 'SMS Dispatch', icon: MessageSquare },
          { id: 'notifications', label: t('notifications'), icon: Bell },
          { id: 'profile', label: t('profile'), icon: User }
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
    } else if (role === 'buyer') {
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
  const currentBuyer = buyers?.find(b => b.id === selectedBuyerId);

  const getGreeting = () => {
    const hr = new Date().getHours();
    if (hr < 12) return { text: 'Good Morning', icon: <Sun size={15} color="#F57C00" /> };
    if (hr < 17) return { text: 'Good Afternoon', icon: <SunMedium size={15} color="#F57C00" /> };
    return { text: 'Good Evening', icon: <Moon size={15} color="#5C6BC0" /> };
  };

  const greeting = getGreeting();
  const currentName = currentRole === 'school' ? (currentSchool?.name || 'Government High School') : 
                      currentRole === 'collector' ? (currentCollector?.name || 'Collector') : 
                      currentRole === 'buyer' ? (currentBuyer?.agencyName || 'Compost Buyer Agency') : 'District Admin';

  return (
    <>
      {/* UNIFIED SINGLE HEADER BAR */}
      <header style={styles.unifiedHeader}>
        {/* Top Row: Brand, User Greeting & Controls */}
        <div style={styles.topRow}>
          <div style={styles.headerLeft}>
            <span style={styles.headerSun}>{greeting.icon}</span>
            <div style={styles.headerGreetingGroup}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={styles.headerGreeting}>{greeting.text}</span>
                <span style={{
                  fontSize: '0.55rem',
                  fontWeight: 700,
                  color: saveStatus === 'Saved' ? 'var(--color-primary)' : saveStatus === 'Saving...' ? 'var(--color-accent)' : 'var(--color-error)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '3px',
                  padding: '1px 5px',
                  borderRadius: '999px',
                  backgroundColor: saveStatus === 'Saved' ? 'rgba(46, 125, 50, 0.06)' : saveStatus === 'Saving...' ? 'rgba(249, 168, 37, 0.06)' : 'rgba(211, 47, 47, 0.06)',
                  border: '1px solid currentColor',
                  opacity: 0.9
                }}>
                  <span style={{
                    width: '4px',
                    height: '4px',
                    borderRadius: '50%',
                    backgroundColor: 'currentColor',
                    display: 'inline-block'
                  }} />
                  {saveStatus === 'Saved' ? 'Auto-saved' : saveStatus === 'Saving...' ? 'Saving...' : 'Offline'}
                </span>
              </div>
              <h1 style={styles.schoolHeaderName}>{currentName.split(',')[0]}</h1>
            </div>
          </div>

          <div style={styles.headerRight}>
            {/* Return to Admin Dashboard (Only visible when Admin is inspecting another profile) */}
            {authenticatedRole === 'admin' && currentRole !== 'admin' && (
              <button
                onClick={() => {
                  setCurrentRole('admin');
                  setActiveTab('dashboard');
                }}
                style={{
                  padding: '3px 8px',
                  backgroundColor: 'var(--color-primary)',
                  color: '#FFFFFF',
                  borderRadius: '8px',
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  border: 'none',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  marginRight: '4px'
                }}
                title="Return to District Admin Dashboard"
              >
                <ShieldCheck size={12} /> Admin Dashboard
              </button>
            )}

            {/* Profile Switcher (ADMIN ONLY) */}
            {authenticatedRole === 'admin' && (
              <button 
                onClick={() => setShowRolePanel(!showRolePanel)}
                style={styles.roleSwitchBtn}
                title="Switch Profile Role (Admin Only)"
              >
                <Shield size={12} />
              </button>
            )}

            {/* Logout Button */}
            <button 
              onClick={handleLogout}
              style={{
                padding: '4px 8px',
                backgroundColor: 'rgba(211, 47, 47, 0.08)',
                color: '#D32F2F',
                border: '1px solid rgba(211, 47, 47, 0.25)',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                cursor: 'pointer',
                fontSize: '0.7rem',
                fontWeight: 700
              }}
              title="Log Out"
            >
              <LogOut size={13} />
              <span>Logout</span>
            </button>
          </div>
        </div>

        {/* Bottom Row: Integrated Navigation Tabs */}
        <div style={styles.tabRow}>
          {tabs.map(tab => {
            const Icon = tab.icon || (tab.id === 'notifications' ? Bell : tab.id === 'active' || tab.id === 'collections' ? Truck : Home);
            const isActive = activeTab === tab.id || (tab.id === 'dashboard' && activeTab === 'home' && currentRole === 'admin');
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  ...styles.tabPill,
                  backgroundColor: isActive ? 'var(--color-primary)' : 'transparent',
                  color: isActive ? '#FFFFFF' : 'var(--color-text-secondary)'
                }}
              >
                {Icon && <Icon size={15} style={{ flexShrink: 0 }} strokeWidth={isActive ? 2.5 : 2} />}
                <span style={{ fontSize: '0.68rem', fontWeight: isActive ? 700 : 500, whiteSpace: 'nowrap' }}>{tab.label}</span>
                {tab.badge > 0 && (
                  <span style={{
                    ...styles.tabBadge,
                    backgroundColor: isActive ? '#FFFFFF' : 'var(--color-error)',
                    color: isActive ? 'var(--color-primary)' : '#FFFFFF',
                    flexShrink: 0
                  }}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
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
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Building2 size={15} color="var(--color-primary)" /> {sch.name}</span>
                    <span style={styles.selectStrength}>{sch.studentStrength} students</span>
                  </button>
                ))}
              </div>

              {/* Collector Profile options */}
              <div style={styles.roleSection}>
                <h4 style={styles.sectionHeader}>Logistics Collectors</h4>
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
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Tractor size={15} color="var(--color-primary)" /> {col.name}</span>
                    <span style={styles.selectStrength}>{col.collectorType}</span>
                  </button>
                ))}
              </div>

              {/* Compost Buyers & Agencies */}
              <div style={styles.roleSection}>
                <h4 style={styles.sectionHeader}>Compost Buyers & Agencies</h4>
                {buyers?.map(buy => (
                  <button
                    key={buy.id}
                    onClick={() => {
                      setSelectedBuyerId(buy.id);
                      handleRoleChange('buyer');
                    }}
                    style={{
                      ...styles.selectOption,
                      border: currentRole === 'buyer' && selectedBuyerId === buy.id ? '2px solid var(--color-primary)' : '1px solid var(--color-border)'
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Leaf size={15} color="var(--color-primary)" /> {buy.name}</span>
                    <span style={styles.selectStrength}>{buy.rating} Rating</span>
                  </button>
                ))}
              </div>

              {/* District Admin options */}
              <div style={styles.roleSection}>
                <h4 style={styles.sectionHeader}>District Administration</h4>
                <button
                  onClick={() => handleRoleChange('admin')}
                  style={{
                    ...styles.selectOption,
                    border: currentRole === 'admin' ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                    backgroundColor: '#F5F5FA'
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><ShieldCheck size={15} color="var(--color-primary)" /> District Admin Dashboard</span>
                  <span style={styles.selectStrength}>North District</span>
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              <button 
                onClick={handleLogout} 
                style={{
                  ...styles.closeBtn,
                  backgroundColor: '#FFEBEE',
                  color: '#C62828',
                  border: '1px solid #FFCDD2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  fontWeight: 700
                }}
              >
                <LogOut size={15} />
                Sign Out / Logout
              </button>
              <button onClick={() => setShowRolePanel(false)} style={styles.closeBtn}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const styles = {
  unifiedHeader: {
    backgroundColor: '#FFFFFF',
    borderRadius: '16px 16px 0 0',
    border: '1.5px solid var(--color-border)',
    borderBottom: 'none',
    boxShadow: 'var(--shadow-subtle)',
    position: 'relative',
    zIndex: 10,
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    padding: '12px 14px 12px 14px',
    marginBottom: 0
  },
  topRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: '6px',
    borderBottom: '1px solid rgba(0, 0, 0, 0.05)'
  },
  tabRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: '6px',
    gap: '3px',
    overflowX: 'auto',
    WebkitOverflowScrolling: 'touch'
  },
  tabPill: {
    flex: '1 0 auto',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '4px',
    padding: '6px 6px',
    borderRadius: '10px',
    border: 'none',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    minWidth: 'auto',
    minHeight: '32px',
    transition: 'all 150ms ease'
  },
  tabBadge: {
    fontSize: '0.58rem',
    fontWeight: 800,
    padding: '1px 5px',
    borderRadius: '999px',
    lineHeight: 1
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  headerSun: {
    fontSize: '1.4rem',
    display: 'flex',
    alignItems: 'center'
  },
  headerGreetingGroup: {
    display: 'flex',
    flexDirection: 'column'
  },
  headerGreeting: {
    fontSize: '0.68rem',
    color: 'var(--color-text-secondary)',
    fontWeight: 500,
    textTransform: 'uppercase',
    letterSpacing: '0.03em',
    lineHeight: '1.2'
  },
  schoolHeaderName: {
    fontSize: '0.85rem',
    fontWeight: 700,
    color: 'var(--color-text-primary)',
    margin: 0,
    fontFamily: 'var(--font-display)',
    maxWidth: '180px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    lineHeight: '1.2'
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  },
  headerIconBtn: {
    width: '38px',
    height: '38px',
    minWidth: 'auto',
    minHeight: 'auto',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    position: 'relative',
    transition: 'all 150ms ease'
  },
  bellBadge: {
    position: 'absolute',
    top: '4px',
    right: '4px',
    width: '15px',
    height: '15px',
    borderRadius: '50%',
    backgroundColor: 'var(--color-error)',
    color: '#FFFFFF',
    fontSize: '0.58rem',
    fontWeight: 800,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  roleSwitchBtn: {
    width: '28px',
    height: '28px',
    minWidth: 'auto',
    minHeight: 'auto',
    borderRadius: '8px',
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
    color: 'var(--color-text-secondary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer'
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
