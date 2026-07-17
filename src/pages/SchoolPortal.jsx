import React, { useContext, useState } from 'react';
import { StateContext } from '../context/StateContext';
import { calculateWeight } from '../state/waste';
import { 
  TrendingDown, 
  TrendingUp, 
  Trash2, 
  ChevronRight, 
  FileText, 
  CheckCircle2, 
  Clock, 
  Calculator,
  User,
  Info,
  Calendar,
  WifiOff,
  Wifi,
  Settings,
  HelpCircle,
  AlertTriangle,
  Languages,
  Check
} from 'lucide-react';

export default function SchoolPortal({ activeTab, setActiveTab }) {
  const {
    schools,
    wastePosts,
    history,
    notifications,
    selectedSchoolId,
    uploadWaste,
    confirmCollection,
    getSchoolStatistics,
    getComparableSchools,
    getSchoolInsights,
    getMealPrediction,
    updateSchoolOnboarding,
    isOfflineMode,
    setIsOfflineMode,
    offlineUploadQueue,
    isDarkMode,
    setIsDarkMode
  } = useContext(StateContext);

  const school = schools.find(s => s.id === selectedSchoolId);
  const activePost = wastePosts.find(p => p.schoolId === selectedSchoolId && p.status !== 'Collected');
  
  // Tab states and form controls
  const [showUploadWizard, setShowUploadWizard] = useState(false);
  const [uploadStep, setUploadStep] = useState(1);
  const [formData, setFormData] = useState({ drumLevel: 0.50, reason: 'Low Attendance', customWeight: '' });
  
  // Active settings tabs
  const [activeSettingsSubPage, setActiveSettingsSubPage] = useState('menu'); // 'menu' | 'settings' | 'help'
  
  // Prediction calculator states
  const [predAttendance, setPredAttendance] = useState(school ? school.studentStrength - 30 : 390);
  const [predMenu, setPredMenu] = useState('Rice & Sambhar');
  const [predDay, setPredDay] = useState('Wednesday');

  // Profile forms
  const [profileData, setProfileData] = useState({
    studentStrength: school?.studentStrength || 400,
    drumCapacity: school?.drumCapacity || 40,
    contact: school?.contact || '',
    address: school?.address || ''
  });

  // Help page ticket submission
  const [ticketMsg, setTicketMsg] = useState('');

  if (!school) return <div style={{ padding: '20px' }}>School Profile Not Found</div>;

  // Pre-computed cached statistics
  const stats = getSchoolStatistics(selectedSchoolId);
  const comparableSchools = getComparableSchools(selectedSchoolId);
  const insights = getSchoolInsights(selectedSchoolId);

  // Predictions result
  const prediction = getMealPrediction(selectedSchoolId, predAttendance, predMenu, predDay);

  const handleUploadSubmit = () => {
    // 1. Data Validation: if custom weight input is entered, check it.
    let weightToPost = null;
    if (formData.customWeight && formData.customWeight.trim() !== '') {
      weightToPost = parseFloat(formData.customWeight);
      if (isNaN(weightToPost) || weightToPost <= 0) {
        alert('Validation Error: Please enter a valid weight.');
        return;
      }
    } else {
      weightToPost = calculateWeight(school.drumCapacity, formData.drumLevel);
    }

    // 2. validation check: Cap at 150kg
    if (weightToPost > 150) {
      alert(`Data Validation Error: Waste entered is ${weightToPost} kg. "Please check entered value." (Limit 150 kg per post)`);
      return;
    }

    const success = uploadWaste(school.id, formData.drumLevel, formData.reason, formData.customWeight ? weightToPost : null);
    if (success) {
      setShowUploadWizard(false);
      setUploadStep(1);
      setFormData(f => ({ ...f, customWeight: '' }));
    }
  };

  const handleProfileSave = (e) => {
    e.preventDefault();
    updateSchoolOnboarding(
      school.id,
      profileData.studentStrength,
      profileData.drumCapacity,
      profileData.contact,
      profileData.address
    );
    alert('School configurations updated successfully!');
  };

  const handleTicketSubmit = (e) => {
    e.preventDefault();
    if (!ticketMsg.trim()) return;
    alert(`Support Ticket Raised: "${ticketMsg}". Support officials will review shortly.`);
    setTicketMsg('');
  };

  // Group notifications for this school
  const schoolNotifications = notifications.filter(n => n.role === 'school' && n.targetId === school.id);
  const todayNotifs = schoolNotifications.filter(n => {
    const elapsed = Date.now() - new Date(n.timestamp).getTime();
    return elapsed < 24 * 3600 * 1000;
  });
  const olderNotifs = schoolNotifications.filter(n => {
    const elapsed = Date.now() - new Date(n.timestamp).getTime();
    return elapsed >= 24 * 3600 * 1000;
  });

  return (
    <div style={styles.container}>
      {/* Offline Mode Warning Banner */}
      {isOfflineMode && (
        <div style={styles.offlineBanner}>
          <WifiOff size={14} style={{ marginRight: '6px' }} />
          <span>Simulated Offline Mode Active. Logs cache locally ({offlineUploadQueue.length} queued).</span>
        </div>
      )}

      {/* 1. HOME TAB */}
      {activeTab === 'home' && (
        <div style={styles.scrollable}>
          <div style={styles.headerFlex}>
            <div style={styles.welcomeSection}>
              <p style={styles.subGreeting}>Good Morning,</p>
              <h2 style={styles.mainGreeting}>{school.name}</h2>
              <span style={styles.subtext}>{school.district}</span>
            </div>

            {/* Offline Simulator Switcher */}
            <button 
              onClick={() => setIsOfflineMode(!isOfflineMode)}
              style={{
                ...styles.offlineToggleBtn,
                backgroundColor: isOfflineMode ? 'rgba(211, 47, 47, 0.1)' : 'rgba(46, 125, 50, 0.1)',
                color: isOfflineMode ? 'var(--color-error)' : 'var(--color-primary)',
                borderColor: isOfflineMode ? 'var(--color-error)' : 'var(--color-primary)'
              }}
            >
              {isOfflineMode ? <WifiOff size={14} /> : <Wifi size={14} />}
              <span style={{ fontSize: '0.65rem', fontWeight: 700, marginLeft: '4px' }}>
                {isOfflineMode ? 'OFFLINE' : 'ONLINE'}
              </span>
            </button>
          </div>

          {/* Upload Status Card */}
          <div className="card" style={styles.statusCard}>
            <div style={styles.statusRow}>
              <div>
                <h4 style={styles.cardHeader}>Today's Waste Logs</h4>
                <p style={styles.cardSub}>
                  {isOfflineMode && offlineUploadQueue.length > 0
                    ? `${offlineUploadQueue.length} logs stored locally (Offline)`
                    : activePost ? 'Waste uploaded successfully' : 'No waste logs submitted today'}
                </p>
              </div>
              <span style={{
                ...styles.statusIndicator,
                backgroundColor: (activePost || (isOfflineMode && offlineUploadQueue.length > 0)) ? 'rgba(46, 125, 50, 0.1)' : 'rgba(211, 47, 47, 0.1)',
                color: (activePost || (isOfflineMode && offlineUploadQueue.length > 0)) ? 'var(--color-primary)' : 'var(--color-error)'
              }}>
                {(activePost || (isOfflineMode && offlineUploadQueue.length > 0)) ? 'SUBMITTED' : 'PENDING'}
              </span>
            </div>
            
            {activePost ? (
              <div style={styles.activePostSummary}>
                <div style={styles.postDetails}>
                  <span style={styles.postLabel}>Level: {Math.round(activePost.drumLevel * 100)}%</span>
                  <span style={styles.postLabel}>Est. Weight: <strong>{activePost.estimatedWeight} kg</strong></span>
                  <span style={styles.postLabel}>Reason: {activePost.reason}</span>
                </div>
                <button 
                  onClick={() => setActiveTab('collections')}
                  className="btn-secondary" 
                  style={{ marginTop: '12px', minHeight: '36px' }}
                >
                  Track Pickup Status
                </button>
              </div>
            ) : (
              <button 
                onClick={() => {
                  setShowUploadWizard(true);
                  setUploadStep(1);
                }} 
                className="btn-primary" 
                style={styles.uploadBtn}
              >
                Upload Today's Waste
              </button>
            )}
          </div>

          {/* Interactive Servings Predictor Card */}
          <div className="card" style={{ marginTop: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <Calculator color="var(--color-primary)" size={20} />
              <h3 style={{ fontSize: '1rem' }}>Smart Meal Quantity Recommender</h3>
            </div>
            
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '12px' }}>
              Inputs consider attendance, menu choices, and local waste history.
            </p>

            <div style={styles.grid2}>
              <div className="form-group">
                <label style={styles.smallLabel}>Est. Attendance</label>
                <input 
                  type="number" 
                  value={predAttendance} 
                  onChange={(e) => setPredAttendance(parseInt(e.target.value) || 0)}
                  style={{ ...styles.smallInput, minHeight: '38px' }}
                />
              </div>
              <div className="form-group">
                <label style={styles.smallLabel}>Weekday</label>
                <select 
                  value={predDay} 
                  onChange={(e) => setPredDay(e.target.value)}
                  style={{ ...styles.smallInput, minHeight: '38px' }}
                >
                  <option value="Monday">Monday</option>
                  <option value="Wednesday">Wednesday</option>
                  <option value="Friday">Friday</option>
                </select>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label style={styles.smallLabel}>Meal Menu</label>
              <select 
                value={predMenu} 
                onChange={(e) => setPredMenu(e.target.value)}
                style={{ ...styles.smallInput, minHeight: '38px' }}
              >
                <option value="Rice & Sambhar">Rice & Sambhar (High Yield)</option>
                <option value="Chapati & Dal">Chapati & Veg Curry (Avg Yield)</option>
                <option value="Wheat Upma">Wheat Rava Upma (Low Preferred)</option>
              </select>
            </div>

            {/* Prediction Output */}
            <div style={styles.predictionOutputContainer}>
              <div style={styles.predictionRow}>
                <span style={styles.predictionLabel}>Recommended Servings:</span>
                <span style={styles.predictionValue}>{prediction.recommendedServings} servings</span>
              </div>
              <div style={styles.predictionRow}>
                <span style={styles.predictionLabel}>Expected Waste:</span>
                <span style={{ ...styles.predictionSubValue, color: 'var(--color-accent)' }}>~{prediction.expectedWasteKg} kg</span>
              </div>
              {prediction.suggestedReductionKg > 0 && (
                <div style={styles.predictionRow}>
                  <span style={styles.predictionLabel}>Reduction from base servings:</span>
                  <span style={{ ...styles.predictionSubValue, color: 'var(--color-primary)' }}>-{prediction.suggestedReductionKg} kg saved</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. DASHBOARD TAB */}
      {activeTab === 'dashboard' && (
        <div style={styles.scrollable}>
          <h3 style={styles.sectionTitle}>Performance Dashboard</h3>

          {/* KPI Grid */}
          <div style={styles.grid2}>
            {/* KPI: Waste Score */}
            <div className="card" style={styles.kpiCard}>
              <span style={styles.kpiLabel}>Waste Score</span>
              <span style={styles.kpiNumber}>{stats.wasteScore}/100</span>
              <span style={{ ...styles.kpiTrend, color: 'var(--color-primary)' }}>
                <TrendingDown size={14} style={{ marginRight: '2px' }} />
                Diverting 92%
              </span>
              {/* Mini Sparkline graph */}
              <svg viewBox="0 0 100 25" style={styles.sparkline}>
                <path d="M0,20 Q15,5 30,18 T60,8 T90,2 T100,10" fill="none" stroke="var(--color-primary)" strokeWidth="2" />
              </svg>
            </div>

            {/* KPI: Food Diverted */}
            <div className="card" style={styles.kpiCard}>
              <span style={styles.kpiLabel}>Food Diverted</span>
              <span style={styles.kpiNumber}>{stats.totalCollected} kg</span>
              <span style={{ ...styles.kpiTrend, color: 'var(--color-primary)' }}>
                <TrendingUp size={14} style={{ marginRight: '2px' }} />
                Landfill Free
              </span>
              <svg viewBox="0 0 100 25" style={styles.sparkline}>
                <path d="M0,22 Q20,18 40,12 T70,4 T100,0" fill="none" stroke="var(--color-secondary)" strokeWidth="2" />
              </svg>
            </div>
          </div>

          <div style={styles.grid2}>
            {/* KPI: Money Saved */}
            <div className="card" style={styles.kpiCard}>
              <span style={styles.kpiLabel}>Money Diverted</span>
              <span style={styles.kpiNumber}>₹{stats.moneySaved}</span>
              <span style={{ ...styles.kpiTrend, color: 'var(--color-primary)' }}>
                Feed Saved
              </span>
              <svg viewBox="0 0 100 25" style={styles.sparkline}>
                <path d="M0,25 L10,22 L30,19 L50,15 L70,8 L90,2 L100,0" fill="none" stroke="var(--color-accent)" strokeWidth="2" />
              </svg>
            </div>

            {/* KPI: Total Generated */}
            <div className="card" style={styles.kpiCard}>
              <span style={styles.kpiLabel}>Total Generated</span>
              <span style={styles.kpiNumber}>{stats.totalGenerated} kg</span>
              <span style={{ ...styles.kpiTrend, color: 'var(--color-text-secondary)' }}>
                Active + History
              </span>
              <svg viewBox="0 0 100 25" style={styles.sparkline}>
                <path d="M0,25 Q30,10 60,18 T100,12" fill="none" stroke="var(--color-border)" strokeWidth="2" />
              </svg>
            </div>
          </div>

          {/* Actionable Insights */}
          <div className="card" style={{ marginTop: '16px' }}>
            <h4 style={{ fontSize: '0.9rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Info size={16} color="var(--color-primary)" />
              School Actionable Insights
            </h4>
            <div style={styles.insightsList}>
              {insights.map((insight, idx) => (
                <div key={idx} style={styles.insightItem}>
                  <div style={styles.insightBullet} />
                  <p style={styles.insightText}>{insight}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Comparable School Benchmarking Leaderboard */}
          <div className="card" style={{ marginTop: '16px' }}>
            <h4 style={{ fontSize: '0.9rem', marginBottom: '8px' }}>Comparable Schools Leaderboard</h4>
            <p style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)', marginBottom: '12px' }}>
              Comparing schools in your district with similar student capacity (±20% size).
            </p>
            <div style={styles.leaderboardList}>
              <div style={{ ...styles.leaderboardRow, backgroundColor: 'rgba(76, 175, 80, 0.1)' }}>
                <span style={styles.leaderboardRank}>🥇</span>
                <span style={styles.leaderboardName}>{school.name} (You)</span>
                <span style={styles.leaderboardScore}>{stats.wasteScore} pts</span>
              </div>
              {comparableSchools.map((comp, idx) => (
                <div key={comp.id} style={styles.leaderboardRow}>
                  <span style={styles.leaderboardRank}>{idx === 0 ? '🥈' : '🥉'}</span>
                  <span style={styles.leaderboardName}>{comp.name}</span>
                  <span style={styles.leaderboardScore}>85 pts</span>
                </div>
              ))}
              {comparableSchools.length === 0 && (
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', textAlign: 'center', padding: '8px' }}>
                  No other schools within ±20% size found in database.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3. COLLECTIONS TAB */}
      {activeTab === 'collections' && (
        <div style={styles.scrollable}>
          <h3 style={styles.sectionTitle}>Collection Status</h3>
          
          {activePost ? (
            <div>
              {/* Progress Tracker */}
              <div className="card" style={{ marginBottom: '16px' }}>
                <h4 style={{ fontSize: '0.95rem', marginBottom: '16px' }}>Active Waste Pickup Progress</h4>
                
                <div style={styles.stepContainer}>
                  {[
                    { key: 'Available', label: 'Available' },
                    { key: 'Reserved', label: 'Reserved' },
                    { key: 'In Transit', label: 'In Transit' },
                    { key: 'Awaiting School Confirmation', label: 'Collected' }
                  ].map((step, idx) => {
                    const statuses = ['Available', 'Reserved', 'In Transit', 'Awaiting School Confirmation', 'Collected'];
                    const currentIdx = statuses.indexOf(activePost.status);
                    const stepIdx = statuses.indexOf(step.key);
                    const isPassed = currentIdx >= stepIdx;
                    
                    return (
                      <div key={step.key} style={styles.stepWrapper}>
                        <div style={{
                          ...styles.stepDot,
                          backgroundColor: isPassed ? 'var(--color-primary)' : 'var(--color-border)',
                          color: isPassed ? '#FFFFFF' : 'var(--color-text-secondary)'
                        }}>
                          {isPassed ? '✓' : idx + 1}
                        </div>
                        <span style={{
                          ...styles.stepLabel,
                          fontWeight: isPassed ? '600' : '400',
                          color: isPassed ? 'var(--color-text-primary)' : 'var(--color-text-secondary)'
                        }}>
                          {step.label}
                        </span>
                        {idx < 3 && <div style={{
                          ...styles.stepConnector,
                          backgroundColor: currentIdx > stepIdx ? 'var(--color-primary)' : 'var(--color-border)'
                        }} />}
                      </div>
                    );
                  })}
                </div>

                {activePost.status === 'Awaiting School Confirmation' && (
                  <div style={{ marginTop: '20px' }}>
                    <div style={styles.confirmationAlert}>
                      <p style={{ fontSize: '0.8rem', fontWeight: 600, color: '#e65100', marginBottom: '8px' }}>
                        Collector completed pickup. Please verify waste has been removed from site.
                      </p>
                      <button 
                        onClick={() => confirmCollection(activePost.id)}
                        className="btn-primary" 
                        style={{ minHeight: '44px' }}
                      >
                        Confirm Collection
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Activity Log */}
              <div className="card">
                <h4 style={{ fontSize: '0.9rem', marginBottom: '12px' }}>Activity Log</h4>
                <div style={styles.logList}>
                  {activePost.history.map((log, index) => (
                    <div key={index} style={styles.logRow}>
                      <span style={styles.logTime}>
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span style={styles.logMessage}>{log.message || log.note}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div style={styles.emptyContainer}>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '12px' }}>
                No active waste logs posted currently.
              </p>
              <button 
                onClick={() => setActiveTab('home')}
                className="btn-primary" 
                style={{ width: 'auto', padding: '0 20px', minHeight: '44px' }}
              >
                Upload Waste Now
              </button>
            </div>
          )}

          {/* Collection History */}
          <h3 style={{ ...styles.sectionTitle, marginTop: '24px' }}>Historical Collections</h3>
          <div style={styles.historyList}>
            {history.filter(h => h.schoolId === school.id).map(hist => (
              <div key={hist.id} className="card" style={{ marginBottom: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{hist.collectorName} ({hist.collectorType})</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-primary)' }}>{hist.estimatedWeight} kg</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--color-text-secondary)' }}>
                  <span>Reason: {hist.reason}</span>
                  <span>{new Date(hist.date).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
            {history.filter(h => h.schoolId === school.id).length === 0 && (
              <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--color-text-secondary)', padding: '16px' }}>
                No completed history records found.
              </p>
            )}
          </div>
        </div>
      )}

      {/* 4. NOTIFICATIONS TAB */}
      {activeTab === 'notifications' && (
        <div style={styles.scrollable}>
          <h3 style={styles.sectionTitle}>Alert Center</h3>
          
          <h4 style={styles.dateHeader}>Today</h4>
          {todayNotifs.map(notif => (
            <div key={notif.id} className="card" style={{ ...styles.notifCard, borderLeft: `4px solid ${notif.type === 'warning' ? 'var(--color-accent)' : 'var(--color-primary)'}` }}>
              <div style={styles.notifContent}>
                <span style={styles.notifTitle}>{notif.title}</span>
                <p style={styles.notifMsg}>{notif.message}</p>
                <span style={styles.notifTime}>{new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>
          ))}
          {todayNotifs.length === 0 && (
            <p style={styles.emptyNotifs}>No notifications for today.</p>
          )}

          <h4 style={{ ...styles.dateHeader, marginTop: '16px' }}>Older</h4>
          {olderNotifs.map(notif => (
            <div key={notif.id} className="card" style={{ ...styles.notifCard, opacity: 0.8 }}>
              <div style={styles.notifContent}>
                <span style={styles.notifTitle}>{notif.title}</span>
                <p style={styles.notifMsg}>{notif.message}</p>
                <span style={styles.notifTime}>{new Date(notif.timestamp).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
          {olderNotifs.length === 0 && (
            <p style={styles.emptyNotifs}>No older notifications.</p>
          )}
        </div>
      )}

      {/* 5. PROFILE TAB */}
      {activeTab === 'profile' && (
        <div style={styles.scrollable}>
          {/* Sub Navigation headers inside profile */}
          <div style={styles.subPageNav}>
            <button 
              onClick={() => setActiveSettingsSubPage('menu')}
              style={{ ...styles.subPageNavBtn, borderBottom: activeSettingsSubPage === 'menu' ? '2px solid var(--color-primary)' : 'none' }}
            >
              Configure
            </button>
            <button 
              onClick={() => setActiveSettingsSubPage('settings')}
              style={{ ...styles.subPageNavBtn, borderBottom: activeSettingsSubPage === 'settings' ? '2px solid var(--color-primary)' : 'none' }}
            >
              Settings
            </button>
            <button 
              onClick={() => setActiveSettingsSubPage('help')}
              style={{ ...styles.subPageNavBtn, borderBottom: activeSettingsSubPage === 'help' ? '2px solid var(--color-primary)' : 'none' }}
            >
              Help Page
            </button>
          </div>

          {activeSettingsSubPage === 'menu' && (
            <form onSubmit={handleProfileSave} className="card" style={{ marginTop: '12px' }}>
              <div className="form-group">
                <label className="form-label">School Name</label>
                <input type="text" className="form-input" value={school.name} disabled style={{ backgroundColor: 'var(--color-background)' }} />
              </div>

              <div className="form-group">
                <label className="form-label">Student Strength</label>
                <input 
                  type="number" 
                  className="form-input" 
                  value={profileData.studentStrength}
                  onChange={(e) => setProfileData(p => ({ ...p, studentStrength: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Drum Capacity (kg)</label>
                <input 
                  type="number" 
                  className="form-input" 
                  value={profileData.drumCapacity}
                  onChange={(e) => setProfileData(p => ({ ...p, drumCapacity: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Contact Number</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={profileData.contact}
                  onChange={(e) => setProfileData(p => ({ ...p, contact: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label className="form-label">School Address</label>
                <textarea 
                  className="form-input" 
                  style={{ minHeight: '80px', resize: 'none' }}
                  value={profileData.address}
                  onChange={(e) => setProfileData(p => ({ ...p, address: e.target.value }))}
                />
              </div>

              <button type="submit" className="btn-primary" style={{ marginTop: '12px' }}>
                Save Configurations
              </button>
            </form>
          )}

          {activeSettingsSubPage === 'settings' && (
            <div className="card" style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h4 style={{ fontSize: '0.9rem' }}>General Settings</h4>
              
              {/* Language selection */}
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Languages size={14} /> Language
                </label>
                <select className="form-input" defaultValue="en">
                  <option value="en">English</option>
                  <option value="kn">ಕನ್ನಡ (Kannada)</option>
                  <option value="hi">हिन्दी (Hindi)</option>
                  <option value="ta">தமிழ் (Tamil)</option>
                </select>
              </div>

              {/* Dark mode switcher */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--color-border)', paddingTop: '16px' }}>
                <div>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Dark Theme Mode</span>
                  <p style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)' }}>Toggle dark interface layout colors.</p>
                </div>
                <button 
                  onClick={() => setIsDarkMode(!isDarkMode)}
                  style={{
                    ...styles.toggleThemeBtn,
                    backgroundColor: isDarkMode ? 'var(--color-primary)' : 'var(--color-border)',
                    color: isDarkMode ? '#FFFFFF' : 'var(--color-text-secondary)'
                  }}
                >
                  {isDarkMode ? 'ACTIVE' : 'INACTIVE'}
                </button>
              </div>

              {/* Privacy block */}
              <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '16px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Privacy & Terms</span>
                <p style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)', marginTop: '4px', lineHeight: '1.3' }}>
                  IDEX platform operates municipal mid-day meal logs in accordance with state sanitation bylaws. All records audit logs are publicly accessible for municipal authorities.
                </p>
              </div>
            </div>
          )}

          {activeSettingsSubPage === 'help' && (
            <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="card">
                <h4 style={{ fontSize: '0.9rem', marginBottom: '12px' }}>Frequently Asked Questions</h4>
                <div style={styles.faqList}>
                  <div style={styles.faqItem}>
                    <span style={styles.faqQuestion}>Q: How does meal quantity predictor work?</span>
                    <p style={styles.faqAnswer}>
                      It parses your school attendance registers, current menu items, and your last 4 weeks of logged waste to output recommended cook quantities using running averages.
                    </p>
                  </div>
                  <div style={{ ...styles.faqItem, marginTop: '10px' }}>
                    <span style={styles.faqQuestion}>Q: What is the 30-minute collector timeout?</span>
                    <p style={styles.faqAnswer}>
                      Once a collector reserves your waste listing, they must pick it up within 30 minutes. If they fail, the system automatically reverts the status to Available so another collector can claim it.
                    </p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleTicketSubmit} className="card">
                <h4 style={{ fontSize: '0.9rem', marginBottom: '8px' }}>Raise Support Ticket</h4>
                <p style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)', marginBottom: '12px' }}>
                  Encountered app bugs or transport conflicts? Submit a ticket to municipal sanitation desk.
                </p>
                <div className="form-group">
                  <textarea 
                    placeholder="Describe your issue in detail..." 
                    className="form-input" 
                    style={{ minHeight: '80px', resize: 'none' }}
                    value={ticketMsg}
                    onChange={(e) => setTicketMsg(e.target.value)}
                    required
                  />
                </div>
                <button type="submit" className="btn-primary" style={{ minHeight: '38px', marginTop: '4px' }}>
                  Submit Ticket
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      {/* MULTI-STEP UPLOAD WASTE WIZARD */}
      {showUploadWizard && (
        <div style={styles.wizardOverlay}>
          <div style={styles.wizardPanel}>
            <div style={styles.wizardHeader}>
              <h3>Upload Waste</h3>
              <span>Step {uploadStep} of 3</span>
            </div>

            {uploadStep === 1 && (
              <div>
                <p style={styles.wizardQuestion}>1. Select organic waste level OR enter custom weight:</p>
                <div style={styles.levelButtons}>
                  {[
                    { value: 0.25, label: '25% (Low)' },
                    { value: 0.50, label: '50% (Half)' },
                    { value: 0.75, label: '75% (High)' },
                    { value: 1.00, label: '100% (Full)' }
                  ].map(lvl => (
                    <button
                      key={lvl.value}
                      onClick={() => {
                        setFormData(f => ({ ...f, drumLevel: lvl.value }));
                      }}
                      style={{
                        ...styles.lvlBtn,
                        border: formData.drumLevel === lvl.value && !formData.customWeight ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                        backgroundColor: formData.drumLevel === lvl.value && !formData.customWeight ? 'rgba(46, 125, 50, 0.05)' : '#FFFFFF',
                        color: 'var(--color-text-primary)'
                      }}
                    >
                      {lvl.label}
                    </button>
                  ))}
                </div>

                <div className="form-group" style={{ marginTop: '16px' }}>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Or input custom weight (kg)</label>
                  <input 
                    type="number" 
                    placeholder="Enter precise weight in kg (Max 150kg)" 
                    className="form-input" 
                    style={{ minHeight: '40px' }}
                    value={formData.customWeight}
                    onChange={(e) => setFormData(f => ({ ...f, customWeight: e.target.value }))}
                  />
                </div>

                <div style={styles.weightCalculatorNote}>
                  Calculated weight: <strong>{formData.customWeight ? formData.customWeight : calculateWeight(school.drumCapacity, formData.drumLevel)} kg</strong>
                </div>
              </div>
            )}

            {uploadStep === 2 && (
              <div>
                <p style={styles.wizardQuestion}>2. Choose the primary reason for this waste surplus:</p>
                <div className="form-group">
                  <select 
                    className="form-input"
                    value={formData.reason}
                    onChange={(e) => setFormData(f => ({ ...f, reason: e.target.value }))}
                  >
                    <option value="Low Attendance">Low Attendance</option>
                    <option value="Overcooked">Overcooked / Kitchen surplus</option>
                    <option value="Students disliked menu">Students disliked menu</option>
                    <option value="Preparation waste">Preparation waste (peels/scraps)</option>
                    <option value="Spoilage">Spoilage / Infestation</option>
                    <option value="Holiday/Event">Holiday / Shortened schedule</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            )}

            {uploadStep === 3 && (
              <div>
                <p style={styles.wizardQuestion}>3. Review waste post details before submitting:</p>
                <div style={styles.reviewCard}>
                  <div style={styles.reviewRow}>
                    <span>School Name:</span>
                    <strong>{school.name}</strong>
                  </div>
                  <div style={styles.reviewRow}>
                    <span>Weight Method:</span>
                    <strong>{formData.customWeight ? 'Custom Weight' : `Drum Level (${formData.drumLevel * 100}%)`}</strong>
                  </div>
                  <div style={styles.reviewRow}>
                    <span>Diverting Weight:</span>
                    <strong style={{ color: 'var(--color-primary)' }}>
                      {formData.customWeight ? formData.customWeight : calculateWeight(school.drumCapacity, formData.drumLevel)} kg
                    </strong>
                  </div>
                  <div style={styles.reviewRow}>
                    <span>Primary Reason:</span>
                    <strong>{formData.reason}</strong>
                  </div>
                </div>
              </div>
            )}

            <div style={styles.wizardFooter}>
              {uploadStep > 1 ? (
                <button onClick={() => setUploadStep(s => s - 1)} className="btn-secondary" style={styles.wizardNavBtn}>
                  Back
                </button>
              ) : (
                <button onClick={() => setShowUploadWizard(false)} className="btn-secondary" style={styles.wizardNavBtn}>
                  Cancel
                </button>
              )}

              {uploadStep < 3 ? (
                <button onClick={() => setUploadStep(s => s + 1)} className="btn-primary" style={styles.wizardNavBtn}>
                  Next
                </button>
              ) : (
                <button onClick={handleUploadSubmit} className="btn-primary" style={styles.wizardNavBtn}>
                  Submit Logs
                </button>
              )}
            </div>
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
    flex: 1,
    overflowY: 'hidden',
    position: 'relative'
  },
  offlineBanner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff9c4',
    borderBottom: '1px solid #fff59d',
    color: '#f57f17',
    fontSize: '0.65rem',
    fontWeight: 600,
    padding: '4px var(--spacing-md)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100
  },
  scrollable: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    overflowY: 'auto',
    paddingBottom: 'var(--spacing-lg)',
    marginTop: '6px'
  },
  headerFlex: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 'var(--spacing-md)'
  },
  welcomeSection: {
    flex: 1
  },
  subGreeting: {
    fontSize: '0.8rem',
    color: 'var(--color-text-secondary)',
    fontWeight: 500
  },
  mainGreeting: {
    fontSize: '1.2rem',
    lineHeight: '1.2'
  },
  subtext: {
    fontSize: '0.7rem',
    color: 'var(--color-text-secondary)',
    fontWeight: 600,
    textTransform: 'uppercase'
  },
  offlineToggleBtn: {
    border: '1px solid',
    borderRadius: '10px',
    padding: '4px 8px',
    display: 'inline-flex',
    alignItems: 'center',
    minHeight: '28px',
    minWidth: 'auto',
    backgroundColor: '#FFFFFF',
    cursor: 'pointer'
  },
  statusCard: {
    backgroundColor: 'var(--color-white)',
    border: '1px solid var(--color-border)',
    boxShadow: 'var(--shadow-subtle)'
  },
  statusRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 'var(--spacing-md)'
  },
  cardHeader: {
    fontSize: '0.95rem'
  },
  cardSub: {
    fontSize: '0.75rem',
    color: 'var(--color-text-secondary)'
  },
  statusIndicator: {
    fontSize: '0.65rem',
    fontWeight: 700,
    padding: '4px 8px',
    borderRadius: '12px',
    letterSpacing: '0.05em'
  },
  uploadBtn: {
    marginTop: 'var(--spacing-xs)'
  },
  activePostSummary: {
    borderTop: '1px dashed var(--color-border)',
    paddingTop: '12px'
  },
  postDetails: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 'var(--spacing-sm)'
  },
  postLabel: {
    fontSize: '0.75rem',
    backgroundColor: 'var(--color-background)',
    padding: '4px 8px',
    borderRadius: '6px',
    color: 'var(--color-text-primary)'
  },
  sectionTitle: {
    fontSize: '1.05rem',
    marginBottom: 'var(--spacing-md)'
  },
  grid2: {
    display: 'flex',
    gap: 'var(--spacing-md)',
    marginBottom: '12px'
  },
  kpiCard: {
    flex: 1,
    padding: 'var(--spacing-md)',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    overflow: 'hidden'
  },
  kpiLabel: {
    fontSize: '0.7rem',
    color: 'var(--color-text-secondary)',
    fontWeight: 600,
    textTransform: 'uppercase'
  },
  kpiNumber: {
    fontFamily: 'var(--font-display)',
    fontSize: '1.4rem',
    fontWeight: 700,
    margin: '4px 0 2px 0'
  },
  kpiTrend: {
    fontSize: '0.65rem',
    fontWeight: 600,
    display: 'inline-flex',
    alignItems: 'center'
  },
  sparkline: {
    width: '100%',
    height: '25px',
    marginTop: '8px'
  },
  insightsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  insightItem: {
    display: 'flex',
    gap: '8px',
    alignItems: 'flex-start'
  },
  insightBullet: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: 'var(--color-primary)',
    marginTop: '6px',
    flexShrink: 0
  },
  insightText: {
    fontSize: '0.75rem',
    lineHeight: '1.3',
    color: 'var(--color-text-primary)'
  },
  leaderboardList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  leaderboardRow: {
    display: 'flex',
    alignItems: 'center',
    padding: '8px 12px',
    borderRadius: '8px',
    border: '1px solid var(--color-border)',
    fontSize: '0.75rem'
  },
  leaderboardRank: {
    marginRight: '8px',
    fontSize: '0.9rem'
  },
  leaderboardName: {
    flex: 1,
    fontWeight: 500
  },
  leaderboardScore: {
    fontWeight: 600,
    color: 'var(--color-primary)'
  },
  stepContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    position: 'relative',
    marginTop: '8px'
  },
  stepWrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    flex: 1,
    position: 'relative',
    zIndex: 1
  },
  stepDot: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.75rem',
    fontWeight: 600,
    border: '2px solid #FFFFFF'
  },
  stepLabel: {
    fontSize: '0.6rem',
    textAlign: 'center',
    marginTop: '6px',
    whiteSpace: 'nowrap'
  },
  stepConnector: {
    position: 'absolute',
    height: '2px',
    width: '100%',
    top: '14px',
    left: '50%',
    zIndex: -1
  },
  confirmationAlert: {
    backgroundColor: '#fff3e0',
    border: '1px solid #ffe0b2',
    padding: 'var(--spacing-md)',
    borderRadius: '12px',
    textAlign: 'center'
  },
  logList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  logRow: {
    display: 'flex',
    fontSize: '0.75rem',
    borderBottom: '1px dashed var(--color-border)',
    paddingBottom: '4px'
  },
  logTime: {
    width: '60px',
    color: 'var(--color-text-secondary)',
    fontWeight: 500
  },
  logMessage: {
    flex: 1
  },
  emptyContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 'var(--spacing-xl)',
    textAlign: 'center',
    flex: 1
  },
  historyList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  dateHeader: {
    fontSize: '0.75rem',
    textTransform: 'uppercase',
    color: 'var(--color-text-secondary)',
    letterSpacing: '0.05em',
    marginBottom: '8px',
    fontWeight: 700
  },
  notifCard: {
    marginBottom: '8px',
    padding: '12px'
  },
  notifContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px'
  },
  notifTitle: {
    fontSize: '0.8rem',
    fontWeight: 600
  },
  notifMsg: {
    fontSize: '0.75rem',
    color: 'var(--color-text-secondary)'
  },
  notifTime: {
    fontSize: '0.6rem',
    color: 'var(--color-text-secondary)',
    marginTop: '4px',
    textAlign: 'right'
  },
  emptyNotifs: {
    fontSize: '0.75rem',
    color: 'var(--color-text-secondary)',
    textAlign: 'center',
    padding: '12px'
  },
  subPageNav: {
    display: 'flex',
    borderBottom: '1px solid var(--color-border)',
    marginBottom: '8px'
  },
  subPageNavBtn: {
    flex: 1,
    minHeight: '40px',
    fontSize: '0.8rem',
    fontWeight: 600,
    color: 'var(--color-text-secondary)',
    cursor: 'pointer',
    borderRadius: 0
  },
  toggleThemeBtn: {
    minHeight: '32px',
    padding: '0 var(--spacing-md)',
    fontSize: '0.7rem',
    fontWeight: 700,
    borderRadius: '8px',
    minWidth: 'auto'
  },
  faqList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  faqItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  faqQuestion: {
    fontSize: '0.8rem',
    fontWeight: 600,
    color: 'var(--color-primary)'
  },
  faqAnswer: {
    fontSize: '0.75rem',
    lineHeight: '1.3',
    color: 'var(--color-text-secondary)'
  },
  wizardOverlay: {
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
  wizardPanel: {
    backgroundColor: 'var(--color-white)',
    borderRadius: '16px',
    width: '100%',
    maxWidth: '400px',
    padding: 'var(--spacing-lg)',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 10px 25px rgba(0,0,0,0.15)'
  },
  wizardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid var(--color-border)',
    paddingBottom: '8px',
    marginBottom: '16px'
  },
  wizardQuestion: {
    fontSize: '0.85rem',
    fontWeight: 600,
    marginBottom: '12px',
    color: 'var(--color-text-primary)'
  },
  levelButtons: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  lvlBtn: {
    width: '100%',
    minHeight: '44px',
    borderRadius: '8px',
    textAlign: 'left',
    padding: '0 var(--spacing-md)',
    justifyContent: 'flex-start',
    fontSize: '0.85rem',
    fontWeight: 500
  },
  weightCalculatorNote: {
    fontSize: '0.75rem',
    color: 'var(--color-text-secondary)',
    marginTop: '12px',
    textAlign: 'center'
  },
  reviewCard: {
    backgroundColor: 'var(--color-background)',
    padding: 'var(--spacing-md)',
    borderRadius: '10px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  reviewRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.8rem',
    borderBottom: '1px solid #E2E8F0',
    paddingBottom: '4px'
  },
  wizardFooter: {
    display: 'flex',
    gap: 'var(--spacing-md)',
    marginTop: '20px'
  },
  wizardNavBtn: {
    flex: 1
  },
  smallLabel: {
    fontSize: '0.7rem',
    fontWeight: 600,
    color: 'var(--color-text-secondary)',
    textTransform: 'uppercase',
    marginBottom: '2px'
  },
  smallInput: {
    padding: '4px 8px',
    fontSize: '0.8rem',
    border: '1px solid var(--color-border)',
    borderRadius: '6px',
    backgroundColor: 'var(--color-background)',
    width: '100%'
  },
  predictionOutputContainer: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: '10px',
    padding: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    border: '1px solid rgba(76, 175, 80, 0.2)'
  },
  predictionRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '0.75rem'
  },
  predictionLabel: {
    fontWeight: 500,
    color: 'var(--color-primary)'
  },
  predictionValue: {
    fontWeight: 700,
    color: 'var(--color-primary)',
    fontSize: '0.85rem'
  },
  predictionSubValue: {
    fontWeight: 600,
    fontSize: '0.8rem'
  }
};
