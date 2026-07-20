import React, { useContext, useState } from 'react';
import { StateContext } from '../context/StateContext';
import LicenseViewer from '../components/LicenseViewer';
import { MapContainer, TileLayer, Circle } from 'react-leaflet';
import { 
  Building2, 
  Trash2, 
  Coins, 
  TrendingUp, 
  Map as MapIcon, 
  List, 
  Download,
  AlertCircle,
  Users,
  Compass,
  Star,
  Award,
  LogOut,
  Check,
  BarChart3,
  PieChart,
  Utensils,
  Tractor,
  Filter,
  Leaf,
  MapPin,
  Phone,
  Settings
} from 'lucide-react';

export default function AdminPortal({ activeTab, setActiveTab }) {
  const {
    schools,
    wastePosts,
    history,
    notifications,
    markAsRead,
    markAllAsRead,
    collectors,
    buyers,
    setCurrentRole,
    setSelectedSchoolId,
    setSelectedCollectorId,
    setSelectedBuyerId,
    setIsLoggedIn,
    adminCredentials,
    updateAdminCredentials,
    getDistrictStatistics,
    addNewSchoolProfile,
    addNewCollectorProfile,
    addNewBuyerProfile,
    removeSchoolProfile,
    removeCollectorProfile,
    removeBuyerProfile,
    updateProfileCredentials,
    districtJurisdiction,
    setDistrictJurisdiction,
    minPostingThreshold,
    setMinPostingThreshold,
    systemReservationTimeout,
    setSystemReservationTimeout,
    addToast,
    t
  } = useContext(StateContext);

  const [mapMode, setMapMode] = useState('heat'); // 'heat' | 'list'
  const [masterGraphTab, setMasterGraphTab] = useState('overall'); // 'overall' | 'schools' | 'menu' | 'diversion'
  const [adminCodeInput, setAdminCodeInput] = useState(adminCredentials?.entryCode || 'admin');
  const [adminPasswordInput, setAdminPasswordInput] = useState(adminCredentials?.password || 'admin123');

  React.useEffect(() => {
    if (adminCredentials) {
      setAdminCodeInput(adminCredentials.entryCode || 'admin');
      setAdminPasswordInput(adminCredentials.password || 'admin123');
    }
  }, [adminCredentials]);
  const [selectedSmsCollectorId, setSelectedSmsCollectorId] = useState('');
  const [smsPhone, setSmsPhone] = useState('');
  const [smsMessage, setSmsMessage] = useState('');
  const [showSmsGatewaySettings, setShowSmsGatewaySettings] = useState(false);
  const [smsApiKey, setSmsApiKey] = useState(localStorage.getItem('idex_sms_apikey') || '');
  const [smsDeviceId, setSmsDeviceId] = useState(localStorage.getItem('idex_sms_deviceid') || '');
  const [isSendingSms, setIsSendingSms] = useState(false);

  // Profile management states - Schools
  const [showAddSchool, setShowAddSchool] = useState(false);
  const [newSchoolName, setNewSchoolName] = useState('');
  const [newSchoolStrength, setNewSchoolStrength] = useState('');
  const [newSchoolCapacity, setNewSchoolCapacity] = useState('');
  const [newSchoolContact, setNewSchoolContact] = useState('');
  const [newSchoolAddress, setNewSchoolAddress] = useState('');
  const [newSchoolEntryCode, setNewSchoolEntryCode] = useState('');
  const [newSchoolPassword, setNewSchoolPassword] = useState('');

  // Profile management states - Collectors
  const [showAddCollector, setShowAddCollector] = useState(false);
  const [newColName, setNewColName] = useState('');
  const [newColPhone, setNewColPhone] = useState('');
  const [newColType, setNewColType] = useState('Farmer');
  const [newColVehicle, setNewColVehicle] = useState('Tractor');
  const [newColRadius, setNewColRadius] = useState('10');
  const [newColEntryCode, setNewColEntryCode] = useState('');
  const [newColPassword, setNewColPassword] = useState('');

  // Profile management states - Buyers (Composters)
  const [showAddBuyer, setShowAddBuyer] = useState(false);
  const [newBuyerName, setNewBuyerName] = useState('');
  const [newBuyerAgency, setNewBuyerAgency] = useState('');
  const [newBuyerContact, setNewBuyerContact] = useState('');
  const [newBuyerVehicle, setNewBuyerVehicle] = useState('Truck');
  const [newBuyerRadius, setNewBuyerRadius] = useState('25');
  const [newBuyerBudget, setNewBuyerBudget] = useState('₹50,000/mo');
  const [newBuyerEntryCode, setNewBuyerEntryCode] = useState('');
  const [newBuyerPassword, setNewBuyerPassword] = useState('');

  // Unified Registry Control View State
  const [registrySection, setRegistrySection] = useState('schools'); // 'schools' | 'collectors' | 'buyers'
  const [searchQuery, setSearchQuery] = useState('');

  // Credentials editing states
  const [editingProfileId, setEditingProfileId] = useState(null);
  const [editEntryCode, setEditEntryCode] = useState('');
  const [editPassword, setEditPassword] = useState('');

  // Map settings
  const [isMapExpanded, setIsMapExpanded] = useState(false);

  const handleSendSms = async () => {
    if (!smsPhone.trim()) {
      alert('Please enter a phone number.');
      return;
    }
    if (!smsMessage.trim()) {
      alert('Please enter message text.');
      return;
    }

    setIsSendingSms(true);
    
    // Save settings to local storage
    localStorage.setItem('idex_sms_apikey', smsApiKey);
    localStorage.setItem('idex_sms_deviceid', smsDeviceId);

    if (smsApiKey.trim() && smsDeviceId.trim()) {
      try {
        const response = await fetch(`https://api.textbee.dev/api/v1/gateway/devices/${smsDeviceId.trim()}/send-sms`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': smsApiKey.trim()
          },
          body: JSON.stringify({
            number: smsPhone.trim(),
            message: smsMessage.trim()
          })
        });

        if (response.ok) {
          addToast(`[Textbee Gateway] SMS sent successfully to ${smsPhone}!`, 'success');
        } else {
          const errText = await response.text();
          console.warn('Textbee response error:', errText);
          addToast(`Gateway failed to send. Falling back to simulation.`, 'warning');
          addToast(`[Simulated SMS] Sent successfully to ${smsPhone}!`, 'success');
        }
      } catch (err) {
        console.error('Failed calling Textbee API:', err);
        addToast(`Gateway connection error. Falling back to simulation.`, 'warning');
        addToast(`[Simulated SMS] Sent successfully to ${smsPhone}!`, 'success');
      }
    } else {
      setTimeout(() => {
        addToast(`[Simulated SMS] Sent successfully to ${smsPhone}!`, 'success');
        addToast(`Configure Textbee credentials to send real messages.`, 'info');
      }, 800);
    }

    setIsSendingSms(false);
  };

  const handleSchoolSubmit = (e) => {
    e.preventDefault();
    if (!newSchoolName.trim() || !newSchoolStrength || !newSchoolCapacity || !newSchoolEntryCode || !newSchoolPassword) {
      alert('Please fill in all required fields.');
      return;
    }
    addNewSchoolProfile({
      name: newSchoolName.trim(),
      studentStrength: parseInt(newSchoolStrength, 10),
      drumCapacity: parseFloat(newSchoolCapacity),
      contact: newSchoolContact.trim(),
      address: newSchoolAddress.trim(),
      entryCode: newSchoolEntryCode.trim(),
      password: newSchoolPassword.trim(),
      latitude: 11.0180 + (Math.random() - 0.5) * 0.04,
      longitude: 76.9680 + (Math.random() - 0.5) * 0.04
    });
    setNewSchoolName('');
    setNewSchoolStrength('');
    setNewSchoolCapacity('');
    setNewSchoolContact('');
    setNewSchoolAddress('');
    setNewSchoolEntryCode('');
    setNewSchoolPassword('');
    setShowAddSchool(false);
  };

  const handleCollectorSubmit = (e) => {
    e.preventDefault();
    if (!newColName.trim() || !newColRadius || !newColEntryCode || !newColPassword) {
      alert('Please fill in all required fields.');
      return;
    }
    addNewCollectorProfile({
      name: newColName.trim(),
      phone: newColPhone.trim(),
      collectorType: newColType,
      vehicle: newColVehicle,
      radius: parseFloat(newColRadius),
      entryCode: newColEntryCode.trim(),
      password: newColPassword.trim(),
      latitude: 11.0210 + (Math.random() - 0.5) * 0.03,
      longitude: 76.9600 + (Math.random() - 0.5) * 0.03
    });
    setNewColName('');
    setNewColPhone('');
    setNewColType('Farmer');
    setNewColVehicle('Tractor');
    setNewColRadius('10');
    setNewColEntryCode('');
    setNewColPassword('');
    setShowAddCollector(false);
  };

  const handleBuyerSubmit = (e) => {
    e.preventDefault();
    if (!newBuyerName.trim() || !newBuyerAgency.trim() || !newBuyerEntryCode || !newBuyerPassword) {
      alert('Please fill in all required fields.');
      return;
    }
    addNewBuyerProfile({
      name: newBuyerName.trim(),
      agencyName: newBuyerAgency.trim(),
      contact: newBuyerContact.trim(),
      vehicle: newBuyerVehicle.trim(),
      radius: parseFloat(newBuyerRadius),
      budget: newBuyerBudget.trim(),
      entryCode: newBuyerEntryCode.trim(),
      password: newBuyerPassword.trim(),
      latitude: 11.0250 + (Math.random() - 0.5) * 0.04,
      longitude: 76.9620 + (Math.random() - 0.5) * 0.04
    });
    setNewBuyerName('');
    setNewBuyerAgency('');
    setNewBuyerContact('');
    setNewBuyerVehicle('Truck');
    setNewBuyerRadius('25');
    setNewBuyerBudget('₹50,000/mo');
    setNewBuyerEntryCode('');
    setNewBuyerPassword('');
    setShowAddBuyer(false);
  };

  const stats = getDistrictStatistics();

  // Sort schools for rank
  const rankedSchools = [...schools].map(school => {
    const schoolHistory = history.filter(h => h.schoolId === school.id);
    const totalDiverted = schoolHistory.reduce((sum, h) => sum + h.estimatedWeight, 0);
    const score = Math.min(100, Math.round(80 + totalDiverted * 0.2));
    return {
      ...school,
      score,
      totalDiverted: parseFloat(totalDiverted.toFixed(1))
    };
  }).sort((a, b) => b.score - a.score);

  // Heat map colors depending on waste volume (more waste -> darker green)
  const getCircleColor = (weight) => {
    if (weight > 40) return '#1B5E20'; // Darkest Green
    if (weight > 25) return '#2E7D32'; // Medium Dark Green
    if (weight > 15) return '#4CAF50'; // Green
    return '#81C784'; // Light Green
  };

  // Master Analytics Computations:
  // 1. Dynamic School Waste Rankings (Which school wastes the most?)
  const schoolWasteAnalysis = [...schools].map(school => {
    const activeWaste = wastePosts.filter(p => p.schoolId === school.id).reduce((sum, p) => sum + (p.estimatedWeight || 0), 0);
    const historyWaste = history.filter(h => h.schoolId === school.id).reduce((sum, h) => sum + (h.estimatedWeight || 0), 0);
    const totalGenerated = activeWaste + historyWaste;
    const totalDiverted = history.filter(h => h.schoolId === school.id && (h.status === 'Completed' || h.confirmedBySchool)).reduce((sum, h) => sum + (h.estimatedWeight || 0), 0);
    const wastePerStudent = school.studentStrength ? parseFloat((totalGenerated / school.studentStrength).toFixed(2)) : 0;

    return {
      ...school,
      activeWaste: parseFloat(activeWaste.toFixed(1)),
      historyWaste: parseFloat(historyWaste.toFixed(1)),
      totalGenerated: parseFloat(totalGenerated.toFixed(1)),
      totalDiverted: parseFloat(totalDiverted.toFixed(1)),
      wastePerStudent
    };
  }).sort((a, b) => b.totalGenerated - a.totalGenerated);

  // 2. Menu Dish Waste Breakdown (Which meal type wastes the most?)
  const menuBreakdownData = [
    { name: 'Sambar Rice & Vegetables', percentage: 38, weightKg: Math.round(stats.totalGenerated * 0.38), color: '#E53935', icon: '🍲', highlight: 'Highest Waste Day: Wednesdays' },
    { name: 'Variety Rice (Lemon/Tomato)', percentage: 24, weightKg: Math.round(stats.totalGenerated * 0.24), color: '#FB8C00', icon: '🍋', highlight: 'Moderate Leftovers' },
    { name: 'Vegetable Biryani / Pulao', percentage: 18, weightKg: Math.round(stats.totalGenerated * 0.18), color: '#FDD835', icon: '🍚', highlight: 'Popular, lower leftovers' },
    { name: 'Spinach / Keerai Poriyal', percentage: 12, weightKg: Math.round(stats.totalGenerated * 0.12), color: '#4CAF50', icon: '🥬', highlight: 'High vegetable acceptance' },
    { name: 'Rasam & Curd Rice', percentage: 8, weightKg: Math.round(stats.totalGenerated * 0.08), color: '#1E88E5', icon: '🥛', highlight: 'Lowest leftover rate' }
  ];

  // 3. Diversion Destination Breakdown
  const diversionData = [
    { target: '🐖 Piggery Livestock Feed', weightKg: Math.round(stats.totalCollected * 0.70), percentage: 70, color: 'var(--color-primary)', subtitle: 'Direct farmer dispatch network' },
    { target: '🌿 Organic Compost Processing', weightKg: Math.round(stats.totalCollected * 0.22), percentage: 22, color: 'var(--color-accent)', subtitle: 'Commercial buyer processing' },
    { target: '🗑️ Residual / Municipal Dump', weightKg: Math.round((stats.totalGenerated - stats.totalCollected) > 0 ? (stats.totalGenerated - stats.totalCollected) : stats.totalGenerated * 0.08), percentage: 8, color: 'var(--color-error)', subtitle: 'Uncollected unserved food' }
  ];

  // 4. Weekly Timeline Points for Overall Trends Graph
  const timelineDataPoints = [
    { day: 'Mon', generated: 42, diverted: 38 },
    { day: 'Tue', generated: 35, diverted: 32 },
    { day: 'Wed', generated: 58, diverted: 52 }, // Peak day
    { day: 'Thu', generated: 31, diverted: 29 },
    { day: 'Fri', generated: 46, diverted: 42 },
    { day: 'Sat', generated: 20, diverted: 18 }
  ];
  const maxTimelineVal = Math.max(...timelineDataPoints.map(d => d.generated), 60);

  const adminNotifications = notifications.filter(n => n.role === 'admin');

  return (
    <div style={styles.container}>
      {/* 1. DISTRICT ANALYTICS TAB */}
      {(activeTab === 'dashboard' || activeTab === 'home') && (
        <div style={styles.scrollable}>
          <div style={{ marginBottom: '16px' }}>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', fontWeight: 500 }}>Municipal Overview</p>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Coimbatore Waste Control Desk</h2>
          </div>

          {/* Stats Grid - 4 KPI Cards */}
          <div style={styles.grid2}>
            <div className="card card-interactive">
              <div style={styles.statHeader}>
                <Building2 size={14} color="var(--color-primary)" />
                <span style={styles.statLabel}>Schools Onboarded</span>
              </div>
              <span style={styles.statNumber}>{schools.length}</span>
              <span style={styles.statSub}>100% active coverage</span>
            </div>

            <div className="card card-interactive">
              <div style={styles.statHeader}>
                <Trash2 size={14} color="var(--color-error)" />
                <span style={styles.statLabel}>{t('totalGenerated')}</span>
              </div>
              <span style={styles.statNumber}>{stats.totalGenerated} kg</span>
              <span style={styles.statSub}>Active + History logs</span>
            </div>
          </div>

          <div style={styles.grid2}>
            <div className="card card-interactive">
              <div style={styles.statHeader}>
                <TrendingUp size={14} color="var(--color-primary)" />
                <span style={styles.statLabel}>{t('foodDiverted')}</span>
              </div>
              <span style={styles.statNumber}>{stats.totalCollected} kg</span>
              <span style={styles.statSub}>{stats.successRate}% diversion rate</span>
            </div>

            <div className="card card-interactive">
              <div style={styles.statHeader}>
                <Coins size={14} color="var(--color-accent)" />
                <span style={styles.statLabel}>{t('moneySaved')}</span>
              </div>
              <span style={styles.statNumber}>₹{stats.moneySaved}</span>
              <span style={styles.statSub}>Equivalent feed value</span>
            </div>
          </div>

          {/* MASTER FOOD WASTE ANALYTICS CONTROL BOARD WITH TABS */}
          <div className="card" style={{ marginTop: '16px', padding: '16px', borderRadius: '14px', boxShadow: '0 4px 14px rgba(0,0,0,0.05)', border: '1px solid var(--color-border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <BarChart3 size={18} color="var(--color-primary)" />
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>Master Food Waste Analytics</h3>
                </div>
                <p style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                  District-wide real-time tracking, school ranking, and diversion metrics
                </p>
              </div>

              {/* Tab Navigation Controls */}
              <div style={{ display: 'flex', backgroundColor: 'rgba(62, 107, 95, 0.08)', padding: '4px', borderRadius: '10px', gap: '4px', flexWrap: 'wrap' }}>
                <button
                  onClick={() => setMasterGraphTab('overall')}
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    padding: '6px 12px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: masterGraphTab === 'overall' ? 'var(--color-primary)' : 'transparent',
                    color: masterGraphTab === 'overall' ? '#FFFFFF' : 'var(--color-text-secondary)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <TrendingUp size={13} /> Overall Trends
                </button>
                <button
                  onClick={() => setMasterGraphTab('schools')}
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    padding: '6px 12px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: masterGraphTab === 'schools' ? 'var(--color-primary)' : 'transparent',
                    color: masterGraphTab === 'schools' ? '#FFFFFF' : 'var(--color-text-secondary)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <Building2 size={13} /> School Rankings
                </button>
                <button
                  onClick={() => setMasterGraphTab('menu')}
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    padding: '6px 12px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: masterGraphTab === 'menu' ? 'var(--color-primary)' : 'transparent',
                    color: masterGraphTab === 'menu' ? '#FFFFFF' : 'var(--color-text-secondary)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <Utensils size={13} /> Menu Breakdown
                </button>
                <button
                  onClick={() => setMasterGraphTab('diversion')}
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    padding: '6px 12px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: masterGraphTab === 'diversion' ? 'var(--color-primary)' : 'transparent',
                    color: masterGraphTab === 'diversion' ? '#FFFFFF' : 'var(--color-text-secondary)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <Tractor size={13} /> Diversion Rate
                </button>
              </div>
            </div>

            {/* TAB 1: OVERALL FOOD WASTE TRENDS */}
            {masterGraphTab === 'overall' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                    Daily District Waste Generated vs. Diverted (kg)
                  </span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--color-primary)', fontWeight: 700 }}>
                    Peak Day: Wednesday (Sambar Rice)
                  </span>
                </div>

                {/* SVG Bar Combined Graph */}
                <div style={{ width: '100%', height: '180px', position: 'relative', marginTop: '10px' }}>
                  <svg viewBox="0 0 100 40" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                    {/* Gridlines */}
                    <line x1="0" y1="5" x2="100" y2="5" stroke="#F1F5F9" strokeWidth="0.5" />
                    <line x1="0" y1="18" x2="100" y2="18" stroke="#F1F5F9" strokeWidth="0.5" />
                    <line x1="0" y1="30" x2="100" y2="30" stroke="#F1F5F9" strokeWidth="0.5" />

                    {/* Dual Bars for Each Day */}
                    {timelineDataPoints.map((pt, idx) => {
                      const x = 8 + idx * 16.5;
                      const hGen = (pt.generated / maxTimelineVal) * 26;
                      const hDiv = (pt.diverted / maxTimelineVal) * 26;
                      const yGen = 32 - hGen;
                      const yDiv = 32 - hDiv;

                      return (
                        <g key={idx}>
                          {/* Generated Bar (Red/Orange) */}
                          <rect x={x - 3.5} y={yGen} width="4.5" height={hGen} rx="1" fill="#FF7043" opacity="0.85" />
                          {/* Diverted Bar (Green) */}
                          <rect x={x + 1.5} y={yDiv} width="4.5" height={hDiv} rx="1" fill="var(--color-primary)" />
                          {/* Value Label */}
                          <text x={x - 1} y={yGen - 2} fontSize="2.2" textAnchor="middle" fill="#555" fontWeight="bold">
                            {pt.generated}k
                          </text>
                        </g>
                      );
                    })}
                  </svg>

                  {/* Labels underneath */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 8px', marginTop: '4px' }}>
                    {timelineDataPoints.map((pt, idx) => (
                      <span key={idx} style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                        {pt.day}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Legend */}
                <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--color-border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: '#FF7043' }}></div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)', fontWeight: 500 }}>Total Waste Generated (kg)</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: 'var(--color-primary)' }}></div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)', fontWeight: 500 }}>Diverted to Livestock/Compost (kg)</span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: SCHOOL WASTE RANKINGS (WHICH SCHOOL WASTES THE MOST?) */}
            {masterGraphTab === 'schools' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                    School Food Waste Rankings (Sorted Highest to Lowest)
                  </span>
                  <span style={{ fontSize: '0.68rem', backgroundColor: '#E53935', color: '#FFF', padding: '2px 8px', borderRadius: '6px', fontWeight: 700 }}>
                    🔥 Highest Waste Focus
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {schoolWasteAnalysis.map((school, index) => {
                    const maxWaste = Math.max(...schoolWasteAnalysis.map(s => s.totalGenerated), 1);
                    const percentWidth = Math.min(100, Math.round((school.totalGenerated / maxWaste) * 100));
                    const isHighest = index === 0 && school.totalGenerated > 0;

                    return (
                      <div 
                        key={school.id} 
                        style={{
                          padding: '10px 12px',
                          borderRadius: '10px',
                          backgroundColor: isHighest ? 'rgba(229, 57, 53, 0.05)' : 'rgba(0,0,0,0.02)',
                          border: isHighest ? '1px solid rgba(229, 57, 53, 0.3)' : '1px solid var(--color-border)',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ 
                              fontSize: '0.75rem', 
                              fontWeight: 800, 
                              color: isHighest ? '#E53935' : 'var(--color-text-secondary)',
                              width: '24px'
                            }}>
                              #{index + 1}
                            </span>
                            <strong style={{ fontSize: '0.82rem', color: 'var(--color-text-primary)' }}>{school.name}</strong>
                            {isHighest && (
                              <span style={{ fontSize: '0.62rem', backgroundColor: '#E53935', color: '#FFF', padding: '1px 6px', borderRadius: '4px', fontWeight: 700 }}>
                                Wastes Most
                              </span>
                            )}
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <strong style={{ fontSize: '0.85rem', color: isHighest ? '#E53935' : 'var(--color-primary)' }}>
                              {school.totalGenerated} kg
                            </strong>
                            <span style={{ fontSize: '0.65rem', color: 'var(--color-text-secondary)', display: 'block' }}>
                              {school.wastePerStudent} kg/student
                            </span>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div style={{ width: '100%', height: '8px', backgroundColor: '#E0E0E0', borderRadius: '4px', overflow: 'hidden', margin: '6px 0 4px 0' }}>
                          <div 
                            style={{ 
                              height: '100%', 
                              width: `${percentWidth}%`, 
                              backgroundColor: isHighest ? '#E53935' : (index < 3 ? '#FB8C00' : 'var(--color-primary)'),
                              borderRadius: '4px',
                              transition: 'width 0.5s ease'
                            }} 
                          />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--color-text-secondary)' }}>
                          <span>Enrolled: {school.studentStrength} students</span>
                          <span>Diverted: <strong style={{ color: 'var(--color-primary)' }}>{school.totalDiverted} kg</strong></span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 3: MENU / DISH BREAKDOWN (WHICH FOOD WASTES THE MOST?) */}
            {masterGraphTab === 'menu' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                    Leftover Volume Breakdown by Menu Item / Dish
                  </span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--color-primary)', fontWeight: 600 }}>
                    Coimbatore Government School Audit
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {menuBreakdownData.map((item, idx) => (
                    <div key={idx} style={{ padding: '10px', borderRadius: '10px', backgroundColor: 'rgba(0,0,0,0.02)', border: '1px solid var(--color-border)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '1.2rem' }}>{item.icon}</span>
                          <div>
                            <strong style={{ fontSize: '0.8rem', color: 'var(--color-text-primary)' }}>{item.name}</strong>
                            <span style={{ fontSize: '0.65rem', color: 'var(--color-text-secondary)', display: 'block' }}>{item.highlight}</span>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <strong style={{ fontSize: '0.85rem', color: item.color }}>{item.percentage}%</strong>
                          <span style={{ fontSize: '0.65rem', color: 'var(--color-text-secondary)', display: 'block' }}>~{item.weightKg} kg</span>
                        </div>
                      </div>
                      
                      {/* Visual Bar */}
                      <div style={{ width: '100%', height: '8px', backgroundColor: '#E0E0E0', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${item.percentage}%`, backgroundColor: item.color, borderRadius: '4px' }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 4: DIVERSION & RECOVERY DESTINATIONS */}
            {masterGraphTab === 'diversion' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                    Food Waste Recovery & Diversion Destination Ratio
                  </span>
                  <span className="badge badge-collected" style={{ fontSize: '0.68rem', padding: '2px 8px' }}>
                    83% Total Diversion Rate
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {diversionData.map((item, idx) => (
                    <div key={idx} style={{ padding: '12px', borderRadius: '10px', borderLeft: `4px solid ${item.color}`, backgroundColor: 'rgba(0,0,0,0.02)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <div>
                          <strong style={{ fontSize: '0.85rem', color: 'var(--color-text-primary)' }}>{item.target}</strong>
                          <p style={{ fontSize: '0.68rem', color: 'var(--color-text-secondary)', margin: '2px 0 0 0' }}>{item.subtitle}</p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <strong style={{ fontSize: '0.9rem', color: item.color }}>{item.percentage}%</strong>
                          <span style={{ fontSize: '0.68rem', color: 'var(--color-text-secondary)', display: 'block' }}>{item.weightKg} kg diverted</span>
                        </div>
                      </div>
                      <div style={{ width: '100%', height: '8px', backgroundColor: '#E0E0E0', borderRadius: '4px', overflow: 'hidden', marginTop: '6px' }}>
                        <div style={{ height: '100%', width: `${item.percentage}%`, backgroundColor: item.color, borderRadius: '4px' }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Map view mode header toggle */}
          <div style={styles.mapToggleHeader}>
            <h4 style={{ fontSize: '0.9rem' }}>District Operations Map</h4>
            <div style={styles.btnToggleGroup}>
              <button 
                onClick={() => setMapMode('heat')}
                style={{
                  ...styles.toggleBtn,
                  backgroundColor: mapMode === 'heat' ? 'var(--color-primary)' : 'var(--color-card)',
                  color: mapMode === 'heat' ? '#FFFFFF' : 'var(--color-text-secondary)'
                }}
              >
                Heat Map
              </button>
              <button 
                onClick={() => setMapMode('list')}
                style={{
                  ...styles.toggleBtn,
                  backgroundColor: mapMode === 'list' ? 'var(--color-primary)' : 'var(--color-card)',
                  color: mapMode === 'list' ? '#FFFFFF' : 'var(--color-text-secondary)'
                }}
              >
                Active Lists
              </button>
            </div>
          </div>

          {/* Leaflet map with Circle Heat Overlay */}
          {mapMode === 'heat' ? (
            <div className="card" style={styles.mapCard}>
              <div style={{ ...styles.mapWrapper, height: isMapExpanded ? '380px' : '150px', transition: 'height 0.3s ease' }}>
                <MapContainer 
                  center={[11.0168, 76.9558]} 
                  zoom={12} 
                  scrollWheelZoom={false}
                  dragging={isMapExpanded}
                  zoomControl={isMapExpanded}
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; OpenStreetMap'
                  />
                  {/* Circle indicators reflecting waste load */}
                  {wastePosts.map(post => {
                    const school = schools.find(s => s.id === post.schoolId);
                    if (!school) return null;
                    const color = getCircleColor(post.estimatedWeight);
                    return (
                      <Circle 
                        key={post.id}
                        center={[school.latitude, school.longitude]}
                        radius={200 + post.estimatedWeight * 8}
                        pathOptions={{
                          fillColor: color,
                          color: color,
                          fillOpacity: 0.6,
                          weight: 1.5
                        }}
                      />
                    );
                  })}
                </MapContainer>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                <button
                  onClick={() => setIsMapExpanded(!isMapExpanded)}
                  className="btn-primary"
                  style={{
                    padding: '4px 10px',
                    fontSize: '0.68rem',
                    minHeight: 'auto',
                    width: 'auto',
                    backgroundColor: 'rgba(62, 107, 95, 0.08)',
                    color: 'var(--color-primary)',
                    border: '1px solid var(--color-primary)',
                    borderRadius: '8px',
                    boxShadow: 'none'
                  }}
                >
                  {isMapExpanded ? 'Collapse Map' : 'Expand Map & Interact'}
                </button>
                <span style={{ fontSize: '0.65rem', color: 'var(--color-text-secondary)' }}>
                  {isMapExpanded ? 'Scroll zoom is disabled. Drag to pan.' : 'Map locked. Scroll down past map card.'}
                </span>
              </div>
              <div style={styles.heatLegend}>
                <span style={styles.legendTitle}>Waste Load Index:</span>
                <div style={styles.legendItems}>
                  <span style={{ color: '#81C784', fontSize: '0.65rem', marginRight: '8px' }}>● Light (&lt;15kg)</span>
                  <span style={{ color: '#4CAF50', fontSize: '0.65rem', marginRight: '8px' }}>● Mod (15-25kg)</span>
                  <span style={{ color: '#2E7D32', fontSize: '0.65rem', marginRight: '8px' }}>● Heavy (25-40kg)</span>
                  <span style={{ color: '#1B5E20', fontSize: '0.65rem' }}>● Severe (&gt;40kg)</span>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {wastePosts.map(post => (
                <div key={post.id} className="card" style={{ padding: '10px', fontSize: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <strong>{post.schoolName}</strong>
                    <span className="badge badge-available">Available</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-text-secondary)' }}>
                    <span>Weight: <strong>{post.estimatedWeight} kg</strong></span>
                    <span>Reason: {post.reason}</span>
                  </div>
                </div>
              ))}
              {wastePosts.length === 0 && (
                <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--color-text-secondary)', padding: '16px' }}>
                  No active waste postings in Coimbatore marketplace.
                </p>
              )}
            </div>
          )}

          {/* Actionable Report Export */}
          <div className="card" style={{ marginTop: '16px', padding: '16px' }}>
            <h4 style={{ fontSize: '0.9rem', marginBottom: '6px' }}>Municipal Audit Dispatch</h4>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '12px' }}>
              Generate structured district compliance audit sheets.
            </p>
            <button 
              onClick={() => alert('PDF audit dispatch generated.')}
              className="btn-primary" 
              style={{ minHeight: '38px', width: 'auto', padding: '0 16px' }}
            >
              <Download size={14} style={{ marginRight: '6px' }} />
              Export District Audit (PDF)
            </button>
          </div>

          {/* District Insights surplus cause breakdown */}
          <div className="card" style={{ marginTop: '16px' }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '12px' }}>District Waste Cause Distribution</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
              {[
                { reason: 'Low Attendance', pct: 42, color: 'var(--color-accent)' },
                { reason: 'Disliked Menu', pct: 28, color: '#EF5350' },
                { reason: 'Cooking Error', pct: 18, color: '#FFA726' },
                { reason: 'Spoilage', pct: 12, color: '#95A5A6' }
              ].map(item => (
                <div key={item.reason} style={{ fontSize: '0.72rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                    <span style={{ fontWeight: 500 }}>{item.reason}</span>
                    <strong>{item.pct}%</strong>
                  </div>
                  <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--color-border)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ 
                      height: '100%', 
                      width: `${item.pct}%`, 
                      backgroundColor: item.color,
                      borderRadius: '3px'
                    }} />
                  </div>
                </div>
              ))}
            </div>
            <div style={{ 
              backgroundColor: 'rgba(30, 136, 229, 0.06)', 
              borderLeft: '3px solid var(--color-accent)', 
              padding: '8px 10px', 
              borderRadius: '4px',
              fontSize: '0.72rem',
              color: '#1565C0',
              lineHeight: '1.3'
            }}>
              <strong>District Summary:</strong> Low student attendance is the largest driver of food surplus across Coimbatore schools (42%). Promoting calendar sync features could save the municipality up to 450kg/month of raw ingredients.
            </div>
          </div>

          {/* Collector Reliability Center */}
          <div className="card" style={{ marginTop: '16px' }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '8px' }}>Logistics Collection Reliability</h4>
            <p style={{ fontSize: '0.68rem', color: 'var(--color-text-secondary)', marginBottom: '12px' }}>
              Performance stats for municipal organic collection partners.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {collectors.map(c => {
                // Generate realistic stats based on collector ID for demo purposes
                const completedCount = c.id === 'col-1' ? 28 : 22;
                const lateCount = c.id === 'col-1' ? 2 : 1;
                const cancelledCount = c.id === 'col-1' ? 1 : 0;
                
                return (
                  <div key={c.id} style={{ fontSize: '0.72rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '4px' }}>
                      <span>🚜 {c.name}</span>
                      <span style={{ color: 'var(--color-primary)' }}>Active</span>
                    </div>
                    <div style={{ display: 'flex', gap: '12px', fontSize: '0.68rem', color: 'var(--color-text-secondary)' }}>
                      <span>Completed: <strong style={{ color: 'var(--color-primary)' }}>{completedCount}</strong></span>
                      <span>Late: <strong style={{ color: '#E65100' }}>{lateCount}</strong></span>
                      <span>Cancelled: <strong style={{ color: '#C62828' }}>{cancelledCount}</strong></span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 2. MUNICIPAL REGISTRY & CREDENTIALS CONTROL TAB */}
      {activeTab === 'registry' && (
        <div style={styles.scrollable}>
          <h3 style={styles.sectionTitle}>Municipal Registry & Credentials Control</h3>
          <p style={styles.subText}>Manage login accounts, passwords, coordinates, and details for all platform profiles.</p>

          {/* Sub-Section Role Selector Tabs */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', backgroundColor: 'rgba(0,0,0,0.03)', padding: '4px', borderRadius: '12px' }}>
            {[
              { id: 'schools', label: 'Schools', icon: Building2, count: schools.length },
              { id: 'collectors', label: 'Farmers & Collectors', icon: Tractor, count: collectors.length },
              { id: 'buyers', label: 'Compost Buyers', icon: Leaf, count: buyers.length }
            ].map(tab => {
              const TabIcon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setRegistrySection(tab.id);
                    setSearchQuery('');
                  }}
                  className={registrySection === tab.id ? 'btn-primary' : ''}
                  style={{
                    flex: 1,
                    fontSize: '0.72rem',
                    padding: '6px 4px',
                    minHeight: 'auto',
                    borderRadius: '10px',
                    backgroundColor: registrySection === tab.id ? 'var(--color-primary)' : 'transparent',
                    color: registrySection === tab.id ? '#FFFFFF' : 'var(--color-text-secondary)',
                    border: 'none',
                    boxShadow: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '5px'
                  }}
                >
                  <TabIcon size={14} style={{ flexShrink: 0 }} />
                  <span>{tab.label} ({tab.count})</span>
                </button>
              );
            })}
          </div>

          {/* Search bar & Registration trigger */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            <input
              type="text"
              placeholder={`Search ${registrySection} by name or entry code...`}
              className="form-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ flex: 1, minHeight: '38px', fontSize: '0.75rem' }}
            />
            {registrySection === 'schools' && (
              <button 
                onClick={() => setShowAddSchool(!showAddSchool)} 
                className="btn-primary" 
                style={{ padding: '0 12px', fontSize: '0.72rem', borderRadius: '10px', minHeight: '38px', width: 'auto' }}
              >
                {showAddSchool ? 'Cancel' : '+ Add School'}
              </button>
            )}
            {registrySection === 'collectors' && (
              <button 
                onClick={() => setShowAddCollector(!showAddCollector)} 
                className="btn-primary" 
                style={{ padding: '0 12px', fontSize: '0.72rem', borderRadius: '10px', minHeight: '38px', width: 'auto' }}
              >
                {showAddCollector ? 'Cancel' : '+ Add Collector'}
              </button>
            )}
            {registrySection === 'buyers' && (
              <button 
                onClick={() => setShowAddBuyer(!showAddBuyer)} 
                className="btn-primary" 
                style={{ padding: '0 12px', fontSize: '0.72rem', borderRadius: '10px', minHeight: '38px', width: 'auto' }}
              >
                {showAddBuyer ? 'Cancel' : '+ Add Buyer'}
              </button>
            )}
          </div>

          {/* Registration forms */}
          {registrySection === 'schools' && showAddSchool && (
            <form onSubmit={handleSchoolSubmit} className="card" style={{ padding: '16px', marginBottom: '16px', border: '2px solid var(--color-primary)' }}>
              <h4 style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '12px', color: 'var(--color-primary)' }}>Register New School Profile</h4>
              
              <div className="form-group" style={{ marginBottom: '10px' }}>
                <label className="form-label" style={{ fontSize: '0.65rem' }}>School Name *</label>
                <input 
                  type="text" 
                  placeholder="e.g. Government High School, Peelamedu" 
                  className="form-input" 
                  value={newSchoolName}
                  onChange={(e) => setNewSchoolName(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.65rem' }}>Student Strength *</label>
                  <input 
                    type="number" 
                    placeholder="e.g. 450" 
                    className="form-input" 
                    value={newSchoolStrength}
                    onChange={(e) => setNewSchoolStrength(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.65rem' }}>Drum Capacity (kg) *</label>
                  <input 
                    type="number" 
                    placeholder="e.g. 40" 
                    className="form-input" 
                    value={newSchoolCapacity}
                    onChange={(e) => setNewSchoolCapacity(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '10px' }}>
                <label className="form-label" style={{ fontSize: '0.65rem' }}>Contact Phone</label>
                <input 
                  type="tel" 
                  placeholder="e.g. +91 98765 43212" 
                  className="form-input" 
                  value={newSchoolContact}
                  onChange={(e) => setNewSchoolContact(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '10px' }}>
                <label className="form-label" style={{ fontSize: '0.65rem' }}>Address</label>
                <input 
                  type="text" 
                  placeholder="e.g. Town Hall Road, Coimbatore" 
                  className="form-input" 
                  value={newSchoolAddress}
                  onChange={(e) => setNewSchoolAddress(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.65rem' }}>Entry Code *</label>
                  <input 
                    type="text" 
                    placeholder="Login code (e.g. 10)" 
                    className="form-input" 
                    value={newSchoolEntryCode}
                    onChange={(e) => setNewSchoolEntryCode(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.65rem' }}>Password *</label>
                  <input 
                    type="password" 
                    placeholder="Login pwd" 
                    className="form-input" 
                    value={newSchoolPassword}
                    onChange={(e) => setNewSchoolPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button type="submit" className="btn-primary" style={{ width: '100%', minHeight: '38px', fontSize: '0.75rem' }}>
                Register School Kitchen
              </button>
            </form>
          )}

          {registrySection === 'collectors' && showAddCollector && (
            <form onSubmit={handleCollectorSubmit} className="card" style={{ padding: '16px', marginBottom: '16px', border: '2px solid var(--color-primary)' }}>
              <h4 style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '12px', color: 'var(--color-primary)' }}>Register New Collector / Farmer</h4>
              
              <div className="form-group" style={{ marginBottom: '10px' }}>
                <label className="form-label" style={{ fontSize: '0.65rem' }}>Full Name *</label>
                <input 
                  type="text" 
                  placeholder="e.g. Senthil Kumar (Farms)" 
                  className="form-input" 
                  value={newColName}
                  onChange={(e) => setNewColName(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.65rem' }}>Collector Type *</label>
                  <select 
                    className="form-input" 
                    value={newColType}
                    onChange={(e) => setNewColType(e.target.value)}
                    required
                  >
                    <option value="Farmer">Farmer (Livestock Feed)</option>
                    <option value="Compost Company">Compost Company</option>
                    <option value="Vermicompost Producer">Vermicompost Producer</option>
                    <option value="Organic Buyer">Organic Buyer</option>
                    <option value="Recycling Company">Recycling Company</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.65rem' }}>Operating Radius (km) *</label>
                  <input 
                    type="number" 
                    placeholder="e.g. 10" 
                    className="form-input" 
                    value={newColRadius}
                    onChange={(e) => setNewColRadius(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.65rem' }}>Vehicle Type</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Tractor or Light Truck" 
                    className="form-input" 
                    value={newColVehicle}
                    onChange={(e) => setNewColVehicle(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.65rem' }}>Contact Phone</label>
                  <input 
                    type="tel" 
                    placeholder="e.g. +91 98765 43224" 
                    className="form-input" 
                    value={newColPhone}
                    onChange={(e) => setNewColPhone(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.65rem' }}>Entry Code *</label>
                  <input 
                    type="text" 
                    placeholder="Login code (e.g. 101)" 
                    className="form-input" 
                    value={newColEntryCode}
                    onChange={(e) => setNewColEntryCode(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.65rem' }}>Password *</label>
                  <input 
                    type="password" 
                    placeholder="Login pwd" 
                    className="form-input" 
                    value={newColPassword}
                    onChange={(e) => setNewColPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button type="submit" className="btn-primary" style={{ width: '100%', minHeight: '38px', fontSize: '0.75rem' }}>
                Register Collector Profile
              </button>
            </form>
          )}

          {registrySection === 'buyers' && showAddBuyer && (
            <form onSubmit={handleBuyerSubmit} className="card" style={{ padding: '16px', marginBottom: '16px', border: '2px solid var(--color-primary)' }}>
              <h4 style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '12px', color: 'var(--color-primary)' }}>Register New Compost Buyer</h4>
              
              <div className="form-group" style={{ marginBottom: '10px' }}>
                <label className="form-label" style={{ fontSize: '0.65rem' }}>Agency Name *</label>
                <input 
                  type="text" 
                  placeholder="e.g. GreenSoil Fertilizers Corp" 
                  className="form-input" 
                  value={newBuyerAgency}
                  onChange={(e) => setNewBuyerAgency(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '10px' }}>
                <label className="form-label" style={{ fontSize: '0.65rem' }}>Representative Name *</label>
                <input 
                  type="text" 
                  placeholder="e.g. Ramesh Kumar" 
                  className="form-input" 
                  value={newBuyerName}
                  onChange={(e) => setNewBuyerName(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.65rem' }}>Vehicle Type</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Flatbed Dump Truck" 
                    className="form-input" 
                    value={newBuyerVehicle}
                    onChange={(e) => setNewBuyerVehicle(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.65rem' }}>Operating Radius (km) *</label>
                  <input 
                    type="number" 
                    placeholder="e.g. 25" 
                    className="form-input" 
                    value={newBuyerRadius}
                    onChange={(e) => setNewBuyerRadius(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.65rem' }}>Contact Phone</label>
                  <input 
                    type="tel" 
                    placeholder="e.g. 0422 244 5566" 
                    className="form-input" 
                    value={newBuyerContact}
                    onChange={(e) => setNewBuyerContact(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.65rem' }}>Monthly Budget Estimate</label>
                  <input 
                    type="text" 
                    placeholder="e.g. ₹50,000/mo" 
                    className="form-input" 
                    value={newBuyerBudget}
                    onChange={(e) => setNewBuyerBudget(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.65rem' }}>Entry Code *</label>
                  <input 
                    type="text" 
                    placeholder="Login code (e.g. buy-3)" 
                    className="form-input" 
                    value={newBuyerEntryCode}
                    onChange={(e) => setNewBuyerEntryCode(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.65rem' }}>Password *</label>
                  <input 
                    type="password" 
                    placeholder="Login pwd" 
                    className="form-input" 
                    value={newBuyerPassword}
                    onChange={(e) => setNewBuyerPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button type="submit" className="btn-primary" style={{ width: '100%', minHeight: '38px', fontSize: '0.75rem' }}>
                Register Buyer Profile
              </button>
            </form>
          )}

          {/* Directory filtered listings */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            
            {/* 1. Schools List */}
            {registrySection === 'schools' && schools
              .filter(sch => 
                sch.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                sch.entryCode?.toLowerCase().includes(searchQuery.toLowerCase())
              )
              .map(sch => {
                const schoolHistory = history.filter(h => h.schoolId === sch.id);
                const totalDiverted = schoolHistory.reduce((sum, h) => sum + h.estimatedWeight, 0);
                const currentActive = wastePosts.find(p => p.schoolId === sch.id);

                return (
                  <div key={sch.id} className="card" style={{ padding: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <div>
                        <h4 style={{ fontSize: '0.85rem', fontWeight: 700 }}>{sch.name}</h4>
                        <span style={{ fontSize: '0.65rem', color: 'var(--color-text-secondary)' }}>ID: {sch.id}</span>
                      </div>
                      <span className={`badge ${currentActive ? 'badge-available' : 'badge-collected'}`} style={{ fontSize: '0.6rem' }}>
                        {currentActive ? 'Active Post' : 'No Active Logs'}
                      </span>
                    </div>

                    {editingProfileId === sch.id ? (
                      <div style={{
                        backgroundColor: 'rgba(62, 107, 95, 0.05)',
                        border: '1.5px solid var(--color-primary)',
                        borderRadius: '8px',
                        padding: '10px',
                        marginBottom: '8px'
                      }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                          <div>
                            <label style={{ fontSize: '0.6rem', display: 'block', marginBottom: '2px', fontWeight: 600 }}>Entry Code</label>
                            <input
                              type="text"
                              value={editEntryCode}
                              onChange={(e) => setEditEntryCode(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  updateProfileCredentials(registrySection, sch.id, editEntryCode, editPassword);
                                  setEditingProfileId(null);
                                }
                              }}
                              className="form-input"
                              style={{ fontSize: '0.7rem', padding: '4px 6px', minHeight: 'auto' }}
                            />
                          </div>
                          <div>
                            <label style={{ fontSize: '0.6rem', display: 'block', marginBottom: '2px', fontWeight: 600 }}>Password</label>
                            <input
                              type="text"
                              value={editPassword}
                              onChange={(e) => setEditPassword(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  updateProfileCredentials(registrySection, sch.id, editEntryCode, editPassword);
                                  setEditingProfileId(null);
                                }
                              }}
                              className="form-input"
                              style={{ fontSize: '0.7rem', padding: '4px 6px', minHeight: 'auto' }}
                            />
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => setEditingProfileId(null)}
                            style={{
                              fontSize: '0.65rem',
                              padding: '3px 8px',
                              backgroundColor: '#E0E0E0',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer'
                            }}
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => {
                              updateProfileCredentials(registrySection, sch.id, editEntryCode, editPassword);
                              setEditingProfileId(null);
                            }}
                            style={{
                              fontSize: '0.65rem',
                              padding: '3px 8px',
                              backgroundColor: 'var(--color-primary)',
                              color: '#FFF',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer'
                            }}
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div 
                        onClick={() => {
                          setEditingProfileId(sch.id);
                          setEditEntryCode(sch.entryCode || sch.entry_code || '');
                          setEditPassword(sch.password || '12345');
                        }}
                        style={{
                          backgroundColor: 'rgba(62, 107, 95, 0.05)',
                          border: '1.5px dashed var(--color-border)',
                          borderRadius: '8px',
                          padding: '8px 12px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '8px',
                          cursor: 'pointer'
                        }}
                      >
                        <div style={{ fontSize: '0.72rem' }}>
                          Entry Code: <strong style={{ color: 'var(--color-primary)' }}>{sch.entryCode || sch.entry_code || '-'}</strong>
                        </div>
                        <div style={{ fontSize: '0.72rem' }}>
                          Password: <strong style={{ color: 'var(--color-text-primary)' }}>{sch.password || '12345'}</strong>
                        </div>
                        <button
                          style={{
                            fontSize: '0.6rem',
                            padding: '2px 6px',
                            backgroundColor: 'transparent',
                            color: 'var(--color-primary)',
                            border: '1px solid var(--color-primary)',
                            borderRadius: '4px',
                            cursor: 'pointer'
                          }}
                        >
                          Edit
                        </button>
                      </div>
                    )}

                    <div style={styles.registryDetails}>
                      <div>Enrollment: <strong>{sch.studentStrength} pupils</strong></div>
                      <div>Drum Limit: <strong>{sch.drumCapacity} kg</strong></div>
                      <div>Diverted: <strong style={{ color: 'var(--color-primary)' }}>{totalDiverted.toFixed(1)} kg</strong></div>
                      <div style={{ gridColumn: 'span 2', fontSize: '0.7rem', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                        📍 {sch.address}
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', paddingTop: '8px', borderTop: '1px solid rgba(0,0,0,0.05)' }}>
                      <button
                        onClick={() => {
                          setSelectedSchoolId(sch.id);
                          setCurrentRole('school');
                          setActiveTab('home');
                        }}
                        style={{
                          backgroundColor: 'rgba(46, 125, 50, 0.08)',
                          color: 'var(--color-primary)',
                          border: '1px solid rgba(46, 125, 50, 0.25)',
                          borderRadius: '6px',
                          padding: '4px 10px',
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <Building2 size={12} /> Access School Portal
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Are you sure you want to remove school profile "${sch.name}"?`)) {
                            removeSchoolProfile(sch.id);
                          }
                        }}
                        style={{
                          backgroundColor: 'rgba(211, 47, 47, 0.08)',
                          color: '#D32F2F',
                          border: '1px solid rgba(211, 47, 47, 0.25)',
                          borderRadius: '6px',
                          padding: '4px 10px',
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <Trash2 size={12} /> Remove Profile
                      </button>
                    </div>
                  </div>
                );
              })}

            {/* 2. Collectors List */}
            {registrySection === 'collectors' && collectors
              .filter(col => 
                col.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                col.entryCode?.toLowerCase().includes(searchQuery.toLowerCase())
              )
              .map(col => {
                const colHistory = history.filter(h => h.collectorId === col.id);
                const colDiverted = colHistory.reduce((sum, h) => sum + h.estimatedWeight, 0);
                const activeReservation = wastePosts.find(p => p.collectorId === col.id);

                return (
                  <div key={col.id} className="card" style={{ padding: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <div>
                        <h4 style={{ fontSize: '0.85rem', fontWeight: 700 }}>{col.name}</h4>
                        <span style={{ fontSize: '0.65rem', color: 'var(--color-text-secondary)' }}>ID: {col.id}</span>
                      </div>
                      <span className="badge badge-collected" style={{ fontSize: '0.6rem', backgroundColor: activeReservation ? 'rgba(249,168,37,0.1)' : 'rgba(67,160,71,0.1)', color: activeReservation ? 'var(--color-accent)' : 'var(--color-success)' }}>
                        {activeReservation ? 'On Route' : 'Idle'}
                      </span>
                    </div>

                    {editingProfileId === col.id ? (
                      <div style={{
                        backgroundColor: 'rgba(62, 107, 95, 0.05)',
                        border: '1.5px solid var(--color-primary)',
                        borderRadius: '8px',
                        padding: '10px',
                        marginBottom: '8px'
                      }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                          <div>
                            <label style={{ fontSize: '0.6rem', display: 'block', marginBottom: '2px', fontWeight: 600 }}>Entry Code</label>
                            <input
                              type="text"
                              value={editEntryCode}
                              onChange={(e) => setEditEntryCode(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  updateProfileCredentials(registrySection, col.id, editEntryCode, editPassword);
                                  setEditingProfileId(null);
                                }
                              }}
                              className="form-input"
                              style={{ fontSize: '0.7rem', padding: '4px 6px', minHeight: 'auto' }}
                            />
                          </div>
                          <div>
                            <label style={{ fontSize: '0.6rem', display: 'block', marginBottom: '2px', fontWeight: 600 }}>Password</label>
                            <input
                              type="text"
                              value={editPassword}
                              onChange={(e) => setEditPassword(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  updateProfileCredentials(registrySection, col.id, editEntryCode, editPassword);
                                  setEditingProfileId(null);
                                }
                              }}
                              className="form-input"
                              style={{ fontSize: '0.7rem', padding: '4px 6px', minHeight: 'auto' }}
                            />
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => setEditingProfileId(null)}
                            style={{
                              fontSize: '0.65rem',
                              padding: '3px 8px',
                              backgroundColor: '#E0E0E0',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer'
                            }}
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => {
                              updateProfileCredentials(registrySection, col.id, editEntryCode, editPassword);
                              setEditingProfileId(null);
                            }}
                            style={{
                              fontSize: '0.65rem',
                              padding: '3px 8px',
                              backgroundColor: 'var(--color-primary)',
                              color: '#FFF',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer'
                            }}
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div 
                        onClick={() => {
                          setEditingProfileId(col.id);
                          setEditEntryCode(col.entryCode || col.entry_code || '');
                          setEditPassword(col.password || '12345');
                        }}
                        style={{
                          backgroundColor: 'rgba(62, 107, 95, 0.05)',
                          border: '1.5px dashed var(--color-border)',
                          borderRadius: '8px',
                          padding: '8px 12px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '8px',
                          cursor: 'pointer'
                        }}
                      >
                        <div style={{ fontSize: '0.72rem' }}>
                          Entry Code: <strong style={{ color: 'var(--color-primary)' }}>{col.entryCode || col.entry_code || '-'}</strong>
                        </div>
                        <div style={{ fontSize: '0.72rem' }}>
                          Password: <strong style={{ color: 'var(--color-text-primary)' }}>{col.password || '12345'}</strong>
                        </div>
                        <button
                          style={{
                            fontSize: '0.6rem',
                            padding: '2px 6px',
                            backgroundColor: 'transparent',
                            color: 'var(--color-primary)',
                            border: '1px solid var(--color-primary)',
                            borderRadius: '4px',
                            cursor: 'pointer'
                          }}
                        >
                          Edit
                        </button>
                      </div>
                    )}

                    <div style={styles.registryDetails}>
                      <div>Category: <strong>{col.collectorType}</strong></div>
                      <div>Vehicle: <strong>{col.vehicle}</strong></div>
                      <div>Radius: <strong>{col.radius} km</strong></div>
                      <div>Diverted: <strong style={{ color: 'var(--color-primary)' }}>{colDiverted.toFixed(1)} kg</strong></div>
                      <div style={{ gridColumn: 'span 2', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', marginTop: '4px' }}>
                        <span>Rating: <strong>★ {col.rating}</strong></span>
                        <span style={{ marginLeft: '12px' }}>Phone: <strong>{col.phone}</strong></span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', paddingTop: '8px', borderTop: '1px solid rgba(0,0,0,0.05)' }}>
                      <button
                        onClick={() => {
                          setSelectedCollectorId(col.id);
                          setCurrentRole('collector');
                          setActiveTab('home');
                        }}
                        style={{
                          backgroundColor: 'rgba(46, 125, 50, 0.08)',
                          color: 'var(--color-primary)',
                          border: '1px solid rgba(46, 125, 50, 0.25)',
                          borderRadius: '6px',
                          padding: '4px 10px',
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <Tractor size={12} /> Access Farmer Portal
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Are you sure you want to remove collector profile "${col.name}"?`)) {
                            removeCollectorProfile(col.id);
                          }
                        }}
                        style={{
                          backgroundColor: 'rgba(211, 47, 47, 0.08)',
                          color: '#D32F2F',
                          border: '1px solid rgba(211, 47, 47, 0.25)',
                          borderRadius: '6px',
                          padding: '4px 10px',
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <Trash2 size={12} /> Remove Profile
                      </button>
                    </div>
                  </div>
                );
              })}

            {/* 3. Buyers List */}
            {registrySection === 'buyers' && buyers
              .filter(buy => 
                buy.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                buy.agencyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                buy.entryCode?.toLowerCase().includes(searchQuery.toLowerCase())
              )
              .map(buy => {
                return (
                  <div key={buy.id} className="card" style={{ padding: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <div>
                        <h4 style={{ fontSize: '0.85rem', fontWeight: 700 }}>{buy.agencyName}</h4>
                        <span style={{ fontSize: '0.65rem', color: 'var(--color-text-secondary)' }}>Rep: {buy.name} | ID: {buy.id}</span>
                      </div>
                      <span className="badge badge-collected" style={{ fontSize: '0.6rem', backgroundColor: 'rgba(67,160,71,0.1)', color: 'var(--color-success)' }}>
                        Active Agency
                      </span>
                    </div>

                    {editingProfileId === buy.id ? (
                      <div style={{
                        backgroundColor: 'rgba(62, 107, 95, 0.05)',
                        border: '1.5px solid var(--color-primary)',
                        borderRadius: '8px',
                        padding: '10px',
                        marginBottom: '8px'
                      }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                          <div>
                            <label style={{ fontSize: '0.6rem', display: 'block', marginBottom: '2px', fontWeight: 600 }}>Entry Code</label>
                            <input
                              type="text"
                              value={editEntryCode}
                              onChange={(e) => setEditEntryCode(e.target.value)}
                              className="form-input"
                              style={{ fontSize: '0.7rem', padding: '4px 6px', minHeight: 'auto' }}
                            />
                          </div>
                          <div>
                            <label style={{ fontSize: '0.6rem', display: 'block', marginBottom: '2px', fontWeight: 600 }}>Password</label>
                            <input
                              type="text"
                              value={editPassword}
                              onChange={(e) => setEditPassword(e.target.value)}
                              className="form-input"
                              style={{ fontSize: '0.7rem', padding: '4px 6px', minHeight: 'auto' }}
                            />
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => setEditingProfileId(null)}
                            style={{
                              fontSize: '0.65rem',
                              padding: '3px 8px',
                              backgroundColor: '#E0E0E0',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer'
                            }}
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => {
                              updateProfileCredentials(registrySection, buy.id, editEntryCode, editPassword);
                              setEditingProfileId(null);
                            }}
                            style={{
                              fontSize: '0.65rem',
                              padding: '3px 8px',
                              backgroundColor: 'var(--color-primary)',
                              color: '#FFF',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer'
                            }}
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div style={{
                        backgroundColor: 'rgba(62, 107, 95, 0.05)',
                        border: '1.5px dashed var(--color-border)',
                        borderRadius: '8px',
                        padding: '8px 12px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '8px'
                      }}>
                        <div style={{ fontSize: '0.72rem' }}>
                          Entry Code: <strong style={{ color: 'var(--color-primary)' }}>{buy.entryCode || buy.entry_code || '-'}</strong>
                        </div>
                        <div style={{ fontSize: '0.72rem' }}>
                          Password: <strong style={{ color: 'var(--color-text-primary)' }}>{buy.password || '12345'}</strong>
                        </div>
                        <button
                          onClick={() => {
                            setEditingProfileId(buy.id);
                            setEditEntryCode(buy.entryCode || buy.entry_code || '');
                            setEditPassword(buy.password || '12345');
                          }}
                          style={{
                            fontSize: '0.6rem',
                            padding: '2px 6px',
                            backgroundColor: 'transparent',
                            color: 'var(--color-primary)',
                            border: '1px solid var(--color-primary)',
                            borderRadius: '4px',
                            cursor: 'pointer'
                          }}
                        >
                          Edit
                        </button>
                      </div>
                    )}

                    <div style={styles.registryDetails}>
                      <div>Vehicle: <strong>{buy.vehicle}</strong></div>
                      <div>Radius: <strong>{buy.radius} km</strong></div>
                      <div>Budget: <strong>{buy.budget}</strong></div>
                      <div>Rating Grade: <strong style={{ color: 'var(--color-accent)' }}>{buy.rating}</strong></div>
                      <div style={{ gridColumn: 'span 2', fontSize: '0.7rem', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                        📞 Contact: <strong>{buy.contact}</strong>
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', paddingTop: '8px', borderTop: '1px solid rgba(0,0,0,0.05)' }}>
                      <button
                        onClick={() => {
                          setSelectedBuyerId(buy.id);
                          setCurrentRole('buyer');
                          setActiveTab('home');
                        }}
                        style={{
                          backgroundColor: 'rgba(46, 125, 50, 0.08)',
                          color: 'var(--color-primary)',
                          border: '1px solid rgba(46, 125, 50, 0.25)',
                          borderRadius: '6px',
                          padding: '4px 10px',
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <Leaf size={12} /> Access Buyer Portal
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Are you sure you want to remove buyer profile "${buy.agencyName || buy.name}"?`)) {
                            removeBuyerProfile(buy.id);
                          }
                        }}
                        style={{
                          backgroundColor: 'rgba(211, 47, 47, 0.08)',
                          color: '#D32F2F',
                          border: '1px solid rgba(211, 47, 47, 0.25)',
                          borderRadius: '6px',
                          padding: '4px 10px',
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <Trash2 size={12} /> Remove Profile
                      </button>
                    </div>
                  </div>
                );
              })}

            {/* Empty States */}
            {((registrySection === 'schools' && schools.length === 0) ||
              (registrySection === 'collectors' && collectors.length === 0) ||
              (registrySection === 'buyers' && buyers.length === 0)) && (
              <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--color-text-secondary)', padding: '24px' }}>
                No active profiles found under this section.
              </p>
            )}
          </div>
        </div>
      )}

      {/* 4. NOTIFICATIONS TAB */}
      {activeTab === 'notifications' && (
        <div style={styles.scrollable}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={styles.sectionTitle}>District Notifications Log</h3>
            {adminNotifications.some(n => !n.read) && (
              <button 
                onClick={() => markAllAsRead('admin')}
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  padding: '4px 10px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(62, 107, 95, 0.1)',
                  color: 'var(--color-primary)',
                  border: '1px solid var(--color-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  cursor: 'pointer'
                }}
              >
                <Check size={14} /> Mark All as Read
              </button>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {adminNotifications.map(notif => (
              <div 
                key={notif.id} 
                className="card" 
                style={{ 
                  borderLeft: `4px solid ${notif.read ? 'var(--color-border)' : 'var(--color-primary)'}`, 
                  padding: '12px',
                  opacity: notif.read ? 0.85 : 1,
                  backgroundColor: notif.read ? '#FAFAFA' : '#FFFFFF'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <strong style={{ fontSize: '0.8rem' }}>{notif.title}</strong>
                  <span style={{ fontSize: '0.65rem', color: 'var(--color-text-secondary)' }}>
                    {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>{notif.message}</p>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  {notif.read ? (
                    <span style={{ fontSize: '0.65rem', color: 'var(--color-primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '2px' }}>
                      ✓ Read
                    </span>
                  ) : (
                    <button
                      onClick={() => markAsRead(notif.id)}
                      style={{
                        fontSize: '0.65rem',
                        fontWeight: 600,
                        padding: '2px 8px',
                        backgroundColor: 'var(--color-primary)',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <Check size={12} /> Mark as Read
                    </button>
                  )}
                </div>
              </div>
            ))}
            {adminNotifications.length === 0 && (
              <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--color-text-secondary)', padding: '24px' }}>
                No administrative alerts logged.
              </p>
            )}
          </div>
        </div>
      )}

      {/* 5. SETTINGS / PROFILE TAB */}
      {activeTab === 'profile' && (
        <div style={styles.scrollable}>
          <h3 style={styles.sectionTitle}>District Configurations</h3>
          
          <div className="card">
            <h4 style={{ fontSize: '0.9rem', marginBottom: '12px' }}>Government Control Panel</h4>
            
            <div className="form-group">
              <label className="form-label">Active District Jurisdiction</label>
              <input 
                type="text" 
                className="form-input" 
                value={districtJurisdiction} 
                onChange={(e) => setDistrictJurisdiction(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Min Posting Threshold (kg)</label>
              <input 
                type="number" 
                className="form-input" 
                value={minPostingThreshold} 
                onChange={(e) => setMinPostingThreshold(parseInt(e.target.value, 10) || 0)}
              />
              <span style={{ fontSize: '0.65rem', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                Schools only post when waste exceeds this threshold (prevents inefficient collections).
              </span>
            </div>

            <div className="form-group">
              <label className="form-label">System Reservation Timeout (min)</label>
              <input 
                type="number" 
                className="form-input" 
                value={systemReservationTimeout} 
                onChange={(e) => setSystemReservationTimeout(parseInt(e.target.value, 10) || 0)}
              />
            </div>

            <div style={{ marginTop: '16px', display: 'flex', gap: '8px', padding: '10px', backgroundColor: 'rgba(46, 125, 50, 0.05)', borderRadius: '8px', border: '1px solid rgba(46, 125, 50, 0.1)' }}>
              <AlertCircle size={18} color="var(--color-primary)" style={{ flexShrink: 0 }} />
              <p style={{ fontSize: '0.7rem', color: 'var(--color-primary)', lineHeight: '1.3' }}>
                Official municipal control board setup. Configuration changes are auto-saved in real-time.
              </p>
            </div>
          </div>

          {/* Admin Credentials Manager Card */}
          <div className="card" style={{ marginTop: '16px' }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-primary)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              🔑 Admin Security & Login Credentials
            </h4>
            <p style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)', marginBottom: '12px' }}>
              Change the administrator login ID/Code and Password. When updated, you must use these new credentials to log into the District Admin dashboard.
            </p>

            <div className="form-group" style={{ marginBottom: '12px' }}>
              <label className="form-label">Admin Entry Code / Login ID</label>
              <input 
                type="text" 
                className="form-input" 
                value={adminCodeInput} 
                onChange={(e) => setAdminCodeInput(e.target.value)}
                placeholder="e.g. admin"
              />
            </div>

            <div className="form-group" style={{ marginBottom: '12px' }}>
              <label className="form-label">Admin Password</label>
              <input 
                type="text" 
                className="form-input" 
                value={adminPasswordInput} 
                onChange={(e) => setAdminPasswordInput(e.target.value)}
                placeholder="e.g. admin123"
              />
            </div>

            <button 
              onClick={() => {
                updateAdminCredentials(adminCodeInput, adminPasswordInput);
              }}
              className="btn-primary"
              style={{ width: '100%', marginTop: '4px' }}
            >
              Save Admin Login Credentials
            </button>
          </div>

          <LicenseViewer />

          <div style={{ marginTop: '16px' }}>
            <button 
              onClick={() => setIsLoggedIn(false)}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#FFEBEE',
                color: '#C62828',
                border: '1.5px solid #FFCDD2',
                borderRadius: '12px',
                fontWeight: 700,
                fontSize: '0.9rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                cursor: 'pointer'
              }}
            >
              <LogOut size={18} />
              Log Out of Admin Account
            </button>
          </div>
        </div>
      )}

      {/* 6. SMS DISPATCHER TAB */}
      {activeTab === 'sms' && (
        <div style={styles.scrollable}>
          <h3 style={styles.sectionTitle}>Compost Feedstock SMS Dispatcher</h3>
          <p style={styles.subText}>Send direct SMS alerts to farmers without smartphones. Powered by free Android SMS gateways.</p>
          
          <div className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-primary)', margin: 0 }}>Broadcast Alert</h4>
            
            <div className="form-group">
              <label className="form-label">Select Farmer / Recipient</label>
              <select 
                className="form-input"
                style={{ fontSize: '0.8rem' }}
                value={selectedSmsCollectorId}
                onChange={(e) => {
                  setSelectedSmsCollectorId(e.target.value);
                  const col = collectors.find(c => c.id === e.target.value);
                  if (col) {
                    setSmsPhone(col.phone || col.contact || '+91 98765 43220');
                    setSmsMessage(`Hello ${col.name}, a new organic feedstock batch is available for pickup. Please log in to check locations.`);
                  }
                }}
              >
                <option value="">-- Select Farmer --</option>
                {collectors.map(col => (
                  <option key={col.id} value={col.id}>{col.name} ({col.collectorType})</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Recipient Phone Number</label>
              <input 
                type="tel" 
                className="form-input" 
                placeholder="+91 xxxxx xxxxx" 
                value={smsPhone}
                onChange={(e) => setSmsPhone(e.target.value)}
                style={{ fontSize: '0.8rem' }}
              />
            </div>

            <div className="form-group">
              <label className="form-label">SMS Message Body</label>
              <textarea 
                className="form-input" 
                style={{ minHeight: '80px', resize: 'none', fontSize: '0.8rem' }}
                value={smsMessage}
                onChange={(e) => setSmsMessage(e.target.value)}
                placeholder="Write SMS alert contents here..."
              />
            </div>

            {/* Gateway settings (Advanced configuration) */}
            <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '12px', marginTop: '4px' }}>
              <button 
                onClick={() => setShowSmsGatewaySettings(!showSmsGatewaySettings)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-primary)',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: 0
                }}
              >
                ⚙️ {showSmsGatewaySettings ? 'Hide Gateway Settings' : 'Configure Android Gateway (Textbee.dev)'}
              </button>
              
              {showSmsGatewaySettings && (
                <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }} className="animate-scale">
                  <div className="form-group">
                    <label style={{ fontSize: '0.65rem', color: 'var(--color-text-secondary)', fontWeight: 600, marginBottom: '4px', display: 'block' }}>Textbee API Key</label>
                    <input 
                      type="password" 
                      placeholder="Paste your Textbee API Key..." 
                      className="form-input"
                      value={smsApiKey}
                      onChange={(e) => setSmsApiKey(e.target.value)}
                      style={{ fontSize: '0.75rem', minHeight: '34px' }}
                    />
                  </div>
                  <div className="form-group">
                    <label style={{ fontSize: '0.65rem', color: 'var(--color-text-secondary)', fontWeight: 600, marginBottom: '4px', display: 'block' }}>Textbee Device ID</label>
                    <input 
                      type="text" 
                      placeholder="Enter Textbee Device ID..." 
                      className="form-input"
                      value={smsDeviceId}
                      onChange={(e) => setSmsDeviceId(e.target.value)}
                      style={{ fontSize: '0.75rem', minHeight: '34px' }}
                    />
                  </div>
                </div>
              )}
            </div>

            <button 
              onClick={handleSendSms}
              className="btn-primary animate-ripple"
              style={{ minHeight: '44px', fontWeight: 700, borderRadius: '14px', marginTop: '8px' }}
              disabled={isSendingSms}
            >
              {isSendingSms ? 'Sending SMS Alert...' : '🚀 Dispatch SMS Alert'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: 'var(--spacing-md)',
    display: 'flex',
    flexDirection: 'column',
    width: '100%'
  },
  scrollable: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%'
  },
  sectionTitle: {
    fontSize: '0.95rem',
    marginBottom: '12px'
  },
  grid2: {
    display: 'flex',
    gap: '12px',
    marginBottom: '12px'
  },
  statHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    marginBottom: '4px'
  },
  statLabel: {
    fontSize: '0.65rem',
    color: 'var(--color-text-secondary)',
    fontWeight: 600,
    textTransform: 'uppercase'
  },
  statNumber: {
    fontFamily: 'var(--font-display)',
    fontSize: '1.25rem',
    fontWeight: 700,
    color: 'var(--color-text-primary)'
  },
  statSub: {
    fontSize: '0.65rem',
    color: 'var(--color-text-secondary)',
    marginTop: '2px'
  },
  mapToggleHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '16px',
    marginBottom: '10px'
  },
  btnToggleGroup: {
    display: 'flex',
    border: '1px solid var(--color-border)',
    borderRadius: '8px',
    overflow: 'hidden'
  },
  toggleBtn: {
    padding: '4px 10px',
    fontSize: '0.75rem',
    fontWeight: 600,
    minWidth: 'auto',
    minHeight: '28px',
    borderRadius: 0,
    border: 'none',
    cursor: 'pointer'
  },
  mapCard: {
    padding: '10px',
    border: '1px solid var(--color-border)',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  mapWrapper: {
    height: '220px',
    width: '100%',
    borderRadius: '12px',
    overflow: 'hidden'
  },
  heatLegend: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '4px 0 0 0',
    borderTop: '1px solid var(--color-border)',
    paddingTop: '8px'
  },
  legendTitle: {
    fontSize: '0.65rem',
    fontWeight: 600,
    color: 'var(--color-text-secondary)'
  },
  legendItems: {
    display: 'flex'
  },
  subText: {
    fontSize: '0.75rem',
    color: 'var(--color-text-secondary)',
    marginBottom: '12px',
    marginTop: '-8px'
  },
  registryDetails: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '8px',
    fontSize: '0.75rem',
    borderTop: '1px solid var(--color-border)',
    paddingTop: '8px',
    marginTop: '8px'
  },
  registryRow: {
    display: 'flex',
    justifyContent: 'space-between'
  },
  registryLabel: {
    color: 'var(--color-text-secondary)'
  }
};
