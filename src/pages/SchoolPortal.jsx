import React, { useContext, useState } from 'react';
import { StateContext } from '../context/StateContext';
import { calculateWeight } from '../state/waste';
import { 
  TrendingDown, 
  TrendingUp, 
  Trash2, 
  ChevronRight, 
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
  Check,
  Plus,
  ShoppingBag,
  BarChart3,
  Award
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
    setIsDarkMode,
    addToast,
    language,
    setLanguage,
    t,
    syncPasscode,
    setSyncPasscode,
    uploadStateToCloud,
    downloadStateFromCloud
  } = useContext(StateContext);

  const school = schools.find(s => s.id === selectedSchoolId);
  const activePost = wastePosts.find(p => p.schoolId === selectedSchoolId && p.status !== 'Collected');
  
  // Tab states and form controls
  const [showUploadWizard, setShowUploadWizard] = useState(false);
  const [uploadStep, setUploadStep] = useState(1);
  const [formData, setFormData] = useState({ drumLevel: 0.50, reason: 'Low Attendance', customWeight: '' });
  
  // Active settings subpage
  const [activeSettingsSubPage, setActiveSettingsSubPage] = useState('menu'); // 'menu' | 'settings' | 'help'
  
  // Prediction calculator states
  const [predAttendance, setPredAttendance] = useState(school ? school.studentStrength - 30 : 390);
  const [predMenu, setPredMenu] = useState('Rice & Sambhar');
  const [predDay, setPredDay] = useState('Wednesday');

  const getMenuOptions = () => {
    if (!school) return ['Rice & Sambhar'];
    let menuStr = '';
    const day = predDay;
    if (day === 'Monday') menuStr = school.menuMon || school.menu_mon || '';
    else if (day === 'Tuesday') menuStr = school.menuTue || school.menu_tue || '';
    else if (day === 'Wednesday') menuStr = school.menuWed || school.menu_wed || '';
    else if (day === 'Thursday') menuStr = school.menuThu || school.menu_thu || '';
    else if (day === 'Friday') menuStr = school.menuFri || school.menu_fri || '';

    if (!menuStr) return ['Rice & Sambhar'];

    // Clean up menu text and split into clean lines
    const rawLines = menuStr.split(/\n+/);
    const cleanLines = [];
    rawLines.forEach(line => {
      let clean = line.replace(/^\d+(st|nd|rd|th)\s*Week\s*:\s*/i, '').trim();
      clean = clean.replace(/^[a-zA-Z0-9\s/]+Week:\s*/i, '').trim();
      if (clean && clean.length > 2) {
        cleanLines.push(clean);
      }
    });

    return cleanLines.length > 0 ? cleanLines : [menuStr];
  };

  const menuOptions = getMenuOptions();

  React.useEffect(() => {
    if (menuOptions.length > 0 && !menuOptions.includes(predMenu)) {
      setPredMenu(menuOptions[0]);
    }
  }, [predDay, selectedSchoolId, menuOptions.join(',')]);

  // Profile forms
  const [profileData, setProfileData] = useState({
    studentStrength: school?.studentStrength || 400,
    drumCapacity: school?.drumCapacity || 40,
    contact: school?.contact || '',
    address: school?.address || ''
  });

  // Help page ticket submission
  const [ticketMsg, setTicketMsg] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);

  const handleCloudUpload = async () => {
    if (!syncPasscode.trim()) {
      addToast('Please enter a sync passcode first.', 'error');
      return;
    }
    setIsSyncing(true);
    const ok = await uploadStateToCloud(syncPasscode);
    setIsSyncing(false);
    if (ok) {
      addToast('Data uploaded to cloud successfully!', 'success');
    } else {
      addToast('Upload failed. Try again.', 'error');
    }
  };

  const handleCloudDownload = async () => {
    if (!syncPasscode.trim()) {
      addToast('Please enter a sync passcode first.', 'error');
      return;
    }
    setIsSyncing(true);
    const ok = await downloadStateFromCloud(syncPasscode);
    setIsSyncing(false);
    if (ok) {
      addToast('Data downloaded and synchronized!', 'success');
    } else {
      addToast('Download failed. Passcode invalid or empty.', 'error');
    }
  };

  if (!school) return <div style={{ padding: '20px' }}>School Profile Not Found</div>;

  // Get real data for the last 6 weekdays: Mon, Tue, Wed, Thu, Fri, Sat
  const getWeeklyWasteData = () => {
    const weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const dailyWeights = { Monday: 0, Tuesday: 0, Wednesday: 0, Thursday: 0, Friday: 0, Saturday: 0 };

    const schoolHistory = history.filter(h => h.schoolId === selectedSchoolId);
    schoolHistory.forEach(h => {
      if (h.date) {
        const day = new Date(h.date).toLocaleDateString('en-US', { weekday: 'long' });
        if (dailyWeights[day] !== undefined) {
          dailyWeights[day] += h.estimatedWeight;
        }
      }
    });

    if (activePost) {
      const todayDay = new Date().toLocaleDateString('en-US', { weekday: 'long' });
      if (dailyWeights[todayDay] !== undefined) {
        dailyWeights[todayDay] += activePost.estimatedWeight;
      }
    }

    const defaults = { Monday: 22, Tuesday: 18, Wednesday: 26, Thursday: 21, Friday: 10, Saturday: 6 };
    return weekdays.map(day => {
      return dailyWeights[day] > 0 ? dailyWeights[day] : defaults[day];
    });
  };

  const weeklyWeights = getWeeklyWasteData();
  const maxW = Math.max(...weeklyWeights, 30);
  const chartPoints = weeklyWeights.map((w, idx) => {
    const x = idx * 20;
    const y = 30 - (w / maxW) * 22;
    return { x, y, weight: w };
  });

  const linePath = chartPoints.reduce((path, p, idx) => {
    return path + (idx === 0 ? `M${p.x},${p.y}` : ` L${p.x},${p.y}`);
  }, "");
  const areaPath = `M0,35 ` + chartPoints.map(p => `L${p.x},${p.y}`).join(" ") + ` L100,35 Z`;

  // Kitchen efficiency calculated from actual history completed logs
  const schoolHistoryForEfficiency = history.filter(h => h.schoolId === selectedSchoolId);
  const totalCompletedCount = schoolHistoryForEfficiency.length;
  const avgDailyWasteForEfficiency = totalCompletedCount > 0 
    ? (schoolHistoryForEfficiency.reduce((sum, h) => sum + h.estimatedWeight, 0) / totalCompletedCount)
    : 0;
  const expectedServingsWeight = school.studentStrength * 0.15; // 150g per student
  const kitchenEfficiency = Math.max(
    50, 
    Math.min(100, Math.round(100 - (avgDailyWasteForEfficiency / expectedServingsWeight) * 100))
  );

  // Pre-computed cached statistics
  const stats = getSchoolStatistics(selectedSchoolId);
  const comparableSchools = getComparableSchools(selectedSchoolId);
  const insights = getSchoolInsights(selectedSchoolId);

  // Predictions result
  const prediction = getMealPrediction(selectedSchoolId, predAttendance, predMenu, predDay);

  const handleUploadSubmit = () => {
    let weightToPost = null;
    if (formData.customWeight && formData.customWeight.trim() !== '') {
      weightToPost = parseFloat(formData.customWeight);
      if (isNaN(weightToPost) || weightToPost <= 0) {
        addToast('Please enter a valid weight.', 'error');
        return;
      }
    } else {
      weightToPost = calculateWeight(school.drumCapacity, formData.drumLevel);
    }

    if (weightToPost > 150) {
      addToast('Please check entered value.', 'error');
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
    addToast('School configurations updated!', 'success');
  };

  const handleTicketSubmit = (e) => {
    e.preventDefault();
    if (!ticketMsg.trim()) return;
    const subject = `IDEX Support Ticket - ${school.name}`;
    const body = `School Name: ${school.name}\nSchool ID: ${school.id}\nDistrict: ${school.district}\nContact: ${school.contact}\n\nIssue:\n${ticketMsg}`;
    window.location.href = `mailto:nithinselvaraj9@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    addToast('Ticket dispatched to nithinselvaraj9@gmail.com!', 'success');
    setTicketMsg('');
  };

  // Group notifications for this school
  const schoolNotifications = notifications.filter(n => n.role === 'school' && n.targetId === school.id);

  return (
    <div style={styles.container}>
      {/* Offline Mode Warning Banner */}
      {isOfflineMode && (
        <div style={styles.offlineBanner}>
          <WifiOff size={12} style={{ marginRight: '6px' }} />
          <span>Simulated Offline Mode Active ({offlineUploadQueue.length} queued)</span>
        </div>
      )}

      {/* Floating Action Button (FAB) for School Upload */}
      {activeTab === 'home' && !activePost && (
        <button 
          onClick={() => {
            setShowUploadWizard(true);
            setUploadStep(1);
          }} 
          className="fab animate-ripple"
          title="Upload Waste"
        >
          <Plus size={24} />
        </button>
      )}

      {/* 1. DASHBOARD LAYOUT (ONE SCROLL HOME TAB) */}
      {activeTab === 'home' && (
        <div style={styles.scrollable}>
          <div style={styles.headerFlex}>
            <div style={styles.welcomeSection}>
              <p style={styles.subGreeting}>{t('welcomeBack')},</p>
              <h2 style={styles.mainGreeting}>{school.name}</h2>
              <span style={styles.subtext}>{school.district}</span>
            </div>

            {/* Offline Switcher */}
            <button 
              onClick={() => setIsOfflineMode(!isOfflineMode)}
              style={{
                ...styles.offlineToggleBtn,
                backgroundColor: isOfflineMode ? 'rgba(211, 47, 47, 0.08)' : 'rgba(46, 125, 50, 0.08)',
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

          {/* Quick Stats Grid - 4 Equal Cards */}
          <div style={styles.quickStatsGrid}>
            <div className="card card-interactive">
              <span style={styles.kpiLabel}>{t('todaysWaste')}</span>
              <span style={styles.kpiNumber}>{activePost ? `${activePost.estimatedWeight} kg` : '0 kg'}</span>
              <span style={styles.kpiSub}>Active Listing</span>
            </div>
            <div className="card card-interactive">
              <span style={styles.kpiLabel}>{t('foodDiverted')}</span>
              <span style={styles.kpiNumber}>{stats.totalCollected} kg</span>
              <span style={styles.kpiSub}>Landfill Saved</span>
            </div>
            <div className="card card-interactive">
              <span style={styles.kpiLabel}>{t('moneySaved')}</span>
              <span style={styles.kpiNumber}>₹{stats.moneySaved}</span>
              <span style={styles.kpiSub}>Feed Value</span>
            </div>
            <div className="card card-interactive">
              <span style={styles.kpiLabel}>{t('totalGenerated')}</span>
              <span style={styles.kpiNumber}>{stats.totalGenerated} kg</span>
              <span style={styles.kpiSub}>All-Time Logs</span>
            </div>
          </div>

          {/* Meal Prediction Card */}
          <div className="card" style={{ marginTop: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <Calculator color="var(--color-primary)" size={18} />
              <h3 style={{ fontSize: '0.95rem' }}>{t('recommendedServings')}</h3>
            </div>
            
            <div style={styles.grid2}>
              <div className="form-group">
                <label style={styles.smallLabel}>{t('attendance')}</label>
                <input 
                  type="number" 
                  value={predAttendance} 
                  onChange={(e) => setPredAttendance(parseInt(e.target.value) || 0)}
                  style={styles.smallInput}
                />
              </div>
              <div className="form-group">
                <label style={styles.smallLabel}>{t('weekday')}</label>
                <select 
                  value={predDay} 
                  onChange={(e) => setPredDay(e.target.value)}
                  style={styles.smallInput}
                >
                  <option value="Monday">Monday</option>
                  <option value="Tuesday">Tuesday</option>
                  <option value="Wednesday">Wednesday</option>
                  <option value="Thursday">Thursday</option>
                  <option value="Friday">Friday</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label style={styles.smallLabel}>{t('menu')}</label>
              <select 
                value={predMenu} 
                onChange={(e) => setPredMenu(e.target.value)}
                style={styles.smallInput}
              >
                {menuOptions.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>

            <div style={styles.predictionBox}>
              <div style={styles.predictionRow}>
                <span>Recommended Servings:</span>
                <strong>{prediction.recommendedServings} servings</strong>
              </div>
              <div style={styles.predictionRow}>
                <span>Expected Waste:</span>
                <span style={{ color: 'var(--color-accent)', fontWeight: 600 }}>~{prediction.expectedWasteKg} kg</span>
              </div>
              {prediction.suggestedReductionKg > 0 && (
                <div style={styles.predictionRow}>
                  <span>Reduction from baseline:</span>
                  <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>-{prediction.suggestedReductionKg} kg saved</span>
                </div>
              )}
            </div>
          </div>

          {/* Today's Upload Card */}
          <div className="card" style={{ marginTop: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <h4 style={{ fontSize: '0.9rem' }}>Today's Logging Status</h4>
              <span className={`badge ${activePost ? 'badge-available' : 'badge-awaiting'}`}>
                {activePost ? 'SUBMITTED' : 'PENDING'}
              </span>
            </div>
            {activePost ? (
              <div style={styles.activePostDetails}>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                  Active post is live in the Coimbatore marketplace.
                </p>
                <div style={styles.activePostGrid}>
                  <div>Level: <strong>{activePost.drumLevel * 100}%</strong></div>
                  <div>Weight: <strong>{activePost.estimatedWeight} kg</strong></div>
                  <div>Reason: <strong>{activePost.reason}</strong></div>
                </div>
                <button 
                  onClick={() => setActiveTab('collections')}
                  className="btn-secondary" 
                  style={{ marginTop: '12px', minHeight: '36px' }}
                >
                  Track Collection Progress
                </button>
              </div>
            ) : (
              <div style={styles.emptyLogsCard}>
                <span>🌱</span>
                <p>No Waste Posted Today</p>
                <button 
                  onClick={() => {
                    setShowUploadWizard(true);
                    setUploadStep(1);
                  }}
                  className="btn-primary"
                  style={{ width: 'auto', padding: '0 20px', minHeight: '38px', marginTop: '12px' }}
                >
                  Upload Waste Logs
                </button>
              </div>
            )}
          </div>

          {/* Weekly Graph - Animated SVG chart */}
          <div className="card" style={{ marginTop: '16px' }}>
            <h4 style={{ fontSize: '0.9rem', marginBottom: '12px' }}>Weekly Waste Generation (kg)</h4>
            <div style={styles.chartWrapper}>
              <svg viewBox="0 0 100 35" style={styles.lineChart}>
                {/* Gridlines */}
                <line x1="0" y1="5" x2="100" y2="5" stroke="#F1F5F9" strokeWidth="0.5" />
                <line x1="0" y1="15" x2="100" y2="15" stroke="#F1F5F9" strokeWidth="0.5" />
                <line x1="0" y1="25" x2="100" y2="25" stroke="#F1F5F9" strokeWidth="0.5" />
                {/* Area Fill */}
                <path d={areaPath} fill="rgba(76, 175, 80, 0.05)" />
                {/* Chart Line */}
                <path d={linePath} fill="none" stroke="var(--color-primary)" strokeWidth="1.5" className="animate-path" />
                {/* Markers */}
                {chartPoints.map((p, idx) => (
                  <circle key={idx} cx={p.x} cy={p.y} r="1.5" fill="var(--color-primary)" />
                ))}
              </svg>
              <div style={styles.chartLabels}>
                <span>Mon</span>
                <span>Tue</span>
                <span>Wed</span>
                <span>Thu</span>
                <span>Fri</span>
                <span>Sat</span>
              </div>
            </div>
          </div>

          {/* Actionable Insight Cards */}
          <div className="card" style={{ marginTop: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Info size={16} color="var(--color-primary)" />
                <h4 style={{ fontSize: '0.9rem' }}>Kitchen Efficiency Insights</h4>
              </div>
              <span className="badge badge-collected" style={{ fontSize: '0.75rem', padding: '4px 8px', backgroundColor: 'rgba(46, 125, 50, 0.1)', color: 'var(--color-primary)', fontWeight: 'bold' }}>
                Efficiency: {kitchenEfficiency}%
              </span>
            </div>
            <div style={styles.insightGrid}>
              {insights.map((insight, idx) => (
                <div key={idx} style={styles.insightCard}>
                  <span>💡</span>
                  <p>{insight}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Leaderboard comparisons (Rank badges) */}
          <div className="card" style={{ marginTop: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Award size={18} color="var(--color-accent)" />
              <h4 style={{ fontSize: '0.9rem' }}>District Rankings (±20% Strength)</h4>
            </div>
            <p style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)', marginBottom: '12px' }}>
              Comparing waste diversion records of similarly sized Coimbatore schools.
            </p>
            <div style={styles.rankList}>
              <div style={styles.rankRowActive}>
                <span style={styles.rankBadge}>🥇</span>
                <span style={styles.rankName}>{school.name} (You)</span>
                <strong style={styles.rankPoints}>{stats.wasteScore} pts</strong>
              </div>
              {comparableSchools.map((comp, idx) => (
                <div key={comp.id} style={styles.rankRow}>
                  <span style={styles.rankBadge}>{idx === 0 ? '🥈' : '🥉'}</span>
                  <span style={styles.rankName}>{comp.name}</span>
                  <strong style={styles.rankPoints}>85 pts</strong>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 2. ANALYTICS DEEP DIVE TAB */}
      {activeTab === 'dashboard' && (
        <div style={styles.scrollable}>
          <h3 style={styles.sectionTitle}>District Performance Insights</h3>
          <div className="card">
            <h4 style={{ fontSize: '0.9rem', marginBottom: '12px' }}>Landfill Diversion Trends</h4>
            <div style={styles.chartWrapper}>
              {/* Bar Chart representation */}
              <div style={styles.barGrid}>
                {[
                  { label: 'Week 1', val: 78 },
                  { label: 'Week 2', val: 90 },
                  { label: 'Week 3', val: 84 },
                  { label: 'Week 4', val: 92 }
                ].map((wk, idx) => (
                  <div key={idx} style={styles.barCol}>
                    <div style={{ height: '100px', width: '24px', backgroundColor: '#F1F5F9', borderRadius: '12px', overflow: 'hidden', display: 'flex', alignItems: 'end' }}>
                      <div style={{ height: `${wk.val}%`, width: '100%', backgroundColor: 'var(--color-primary)', borderRadius: '12px' }} />
                    </div>
                    <span style={{ fontSize: '0.65rem', marginTop: '6px', color: 'var(--color-text-secondary)' }}>{wk.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="card" style={{ marginTop: '16px' }}>
            <h4 style={{ fontSize: '0.9rem', marginBottom: '8px' }}>Organic Waste Breakdown</h4>
            <div style={styles.breakdownRow}>
              <span>Overcooked Grains</span>
              <strong>40%</strong>
            </div>
            <div style={styles.breakdownRow}>
              <span>Low Student Attendance</span>
              <strong>35%</strong>
            </div>
            <div style={styles.breakdownRow}>
              <span>Kitchen Scraps / Peels</span>
              <strong>25%</strong>
            </div>
          </div>
        </div>
      )}

      {/* 3. COLLECTIONS TAB (TIMELINE PROGRESS & LOGS) */}
      {activeTab === 'collections' && (
        <div style={styles.scrollable}>
          <h3 style={styles.sectionTitle}>Active Pickups</h3>
          
          {activePost ? (
            <div>
              <div className="card" style={{ marginBottom: '16px' }}>
                <h4 style={{ fontSize: '0.9rem', marginBottom: '16px' }}>Progress Timeline</h4>
                
                {/* Timeline progress mapping */}
                <div style={styles.timelineWrapper}>
                  {[
                    { state: 'Available', label: 'Posted', desc: 'Waste listed in marketplace.' },
                    { state: 'Reserved', label: 'Reserved', desc: 'Collector assigned (30m clock started).' },
                    { state: 'In Transit', label: 'Transit', desc: 'Collector en route to kitchen.' },
                    { state: 'Awaiting School Confirmation', label: 'Confirmation', desc: 'Awaiting supervisor confirmation.' },
                    { state: 'Collected', label: 'Completed', desc: 'Waste successfully cleared.' }
                  ].map((step, idx) => {
                    const statuses = ['Available', 'Reserved', 'In Transit', 'Awaiting School Confirmation', 'Collected'];
                    const currentIdx = statuses.indexOf(activePost.status);
                    const stepIdx = statuses.indexOf(step.state);
                    const isPassed = currentIdx >= stepIdx;

                    return (
                      <div key={idx} className="timeline-item">
                        {idx < 4 && <div className="timeline-line" style={{ backgroundColor: currentIdx > stepIdx ? 'var(--color-primary)' : 'var(--color-border)' }} />}
                        <div className={`timeline-dot ${isPassed ? 'active' : ''}`}>
                          {isPassed ? <Check size={12} /> : null}
                        </div>
                        <div className="timeline-content">
                          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: isPassed ? 'var(--color-text-primary)' : 'var(--color-text-secondary)' }}>
                            {step.label}
                          </span>
                          <p style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)' }}>{step.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {activePost.status === 'Awaiting School Confirmation' && (
                  <div style={styles.confirmationPanel}>
                    <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#e65100', marginBottom: '10px' }}>
                      Collector arrived. Verify waste removal and finalize transaction:
                    </p>
                    <button 
                      onClick={() => confirmCollection(activePost.id)}
                      className="btn-primary" 
                      style={{ minHeight: '44px' }}
                    >
                      Confirm Collection Complete
                    </button>
                  </div>
                )}
              </div>

              {/* Activity Log */}
              <div className="card">
                <h4 style={{ fontSize: '0.9rem', marginBottom: '12px' }}>Audit Log</h4>
                <div style={styles.activityLogContainer}>
                  {activePost.history.map((log, index) => (
                    <div key={index} style={styles.logRow}>
                      <span style={styles.logTime}>
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span>{log.message}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div style={styles.emptyLogsCard}>
              <span>🌱</span>
              <p>No active waste listing found.</p>
              <button 
                onClick={() => {
                  setShowUploadWizard(true);
                  setUploadStep(1);
                }}
                className="btn-primary"
                style={{ width: 'auto', padding: '0 20px', minHeight: '38px', marginTop: '12px' }}
              >
                Upload Waste Logs
              </button>
            </div>
          )}

          {/* Historical Logs */}
          <h3 style={{ ...styles.sectionTitle, marginTop: '24px' }}>Historical Collections</h3>
          <div style={styles.historyList}>
            {history.filter(h => h.schoolId === school.id).map(hist => (
              <div key={hist.id} className="card" style={{ marginBottom: '12px', padding: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <strong style={{ fontSize: '0.85rem' }}>{hist.collectorName}</strong>
                  <span style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)' }}>
                    {new Date(hist.date).toLocaleDateString()}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                  <span>Weight: <strong>{hist.estimatedWeight} kg</strong></span>
                  <span>Reason: {hist.reason}</span>
                </div>
              </div>
            ))}
            {history.filter(h => h.schoolId === school.id).length === 0 && (
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', textAlign: 'center', padding: '16px' }}>
                No completed history records found.
              </p>
            )}
          </div>
        </div>
      )}

      {/* 4. NOTIFICATIONS TAB */}
      {activeTab === 'notifications' && (
        <div style={styles.scrollable}>
          <h3 style={styles.sectionTitle}>System Alerts</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {schoolNotifications.map(notif => (
              <div key={notif.id} className="card" style={{ borderLeft: '4px solid var(--color-primary)', padding: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <strong style={{ fontSize: '0.85rem' }}>{notif.title}</strong>
                  <span style={{ fontSize: '0.65rem', color: 'var(--color-text-secondary)' }}>
                    {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{notif.message}</p>
              </div>
            ))}
            {schoolNotifications.length === 0 && (
              <div style={styles.emptyLogsCard}>
                <span>🔔</span>
                <p>All caught up! No new notifications.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. PROFILE & SETTINGS TAB */}
      {activeTab === 'profile' && (
        <div style={styles.scrollable}>
          <div style={styles.subSettingsHeader}>
            {[
              { id: 'menu', label: 'School Details' },
              { id: 'settings', label: 'Theme & Preferences' },
              { id: 'help', label: 'Support FAQs' }
            ].map(sub => (
              <button
                key={sub.id}
                onClick={() => setActiveSettingsSubPage(sub.id)}
                style={{
                  ...styles.subSettingsBtn,
                  borderBottom: activeSettingsSubPage === sub.id ? '2px solid var(--color-primary)' : 'none',
                  color: activeSettingsSubPage === sub.id ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                  fontWeight: activeSettingsSubPage === sub.id ? '700' : '500'
                }}
              >
                {sub.label}
              </button>
            ))}
          </div>

          {activeSettingsSubPage === 'menu' && (
            <form onSubmit={handleProfileSave} className="card" style={{ marginTop: '12px' }}>
              <div className="form-group">
                <label className="form-label">School Kitchen Name</label>
                <input type="text" className="form-input" value={school.name} disabled />
              </div>
              <div className="form-group">
                <label className="form-label">Student Enrollment Strength</label>
                <input 
                  type="number" 
                  className="form-input" 
                  value={profileData.studentStrength}
                  onChange={(e) => setProfileData(p => ({ ...p, studentStrength: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Kitchen Drum Container Capacity (kg)</label>
                <input 
                  type="number" 
                  className="form-input" 
                  value={profileData.drumCapacity}
                  onChange={(e) => setProfileData(p => ({ ...p, drumCapacity: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Emergency Phone</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={profileData.contact}
                  onChange={(e) => setProfileData(p => ({ ...p, contact: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Address Location</label>
                <textarea 
                  className="form-input" 
                  style={{ minHeight: '60px' }}
                  value={profileData.address}
                  onChange={(e) => setProfileData(p => ({ ...p, address: e.target.value }))}
                />
              </div>
              <button type="submit" className="btn-primary" style={{ marginTop: '8px' }}>
                Save Configurations
              </button>
            </form>
          )}

          {activeSettingsSubPage === 'settings' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '12px' }}>
              <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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

                <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '16px' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{t('language')}</span>
                  <select 
                    className="form-input" 
                    style={{ marginTop: '8px', minHeight: '38px' }}
                    value={language}
                    onChange={(e) => {
                      setLanguage(e.target.value);
                      addToast(`Language updated successfully!`, 'success');
                    }}
                  >
                    <option value="en">English</option>
                    <option value="ta">Tamil (தமிழ்)</option>
                    <option value="kn">Kannada (ಕನ್ನಡ)</option>
                    <option value="hi">Hindi (हिन्दी)</option>
                  </select>
                </div>
              </div>

              {/* Cross-Device Sync Card */}
              <div className="card">
                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>☁️ Cross-Device Cloud Sync</span>
                <p style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)', marginTop: '4px', marginBottom: '12px' }}>
                  Sync your data revisions across different devices using a shared passcode.
                </p>
                <div className="form-group" style={{ marginBottom: '12px' }}>
                  <label className="form-label">Sync Passcode</label>
                  <input 
                    type="text" 
                    placeholder="e.g. coimbatore-school" 
                    className="form-input" 
                    style={{ minHeight: '38px', fontSize: '0.8rem' }}
                    value={syncPasscode}
                    onChange={(e) => setSyncPasscode(e.target.value)}
                  />
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button 
                    onClick={handleCloudUpload}
                    className="btn-primary" 
                    style={{ flex: 1, minHeight: '38px', fontSize: '0.75rem' }}
                    disabled={isSyncing}
                  >
                    {isSyncing ? 'Uploading...' : 'Upload to Cloud'}
                  </button>
                  <button 
                    onClick={handleCloudDownload}
                    className="btn-secondary" 
                    style={{ flex: 1, minHeight: '38px', fontSize: '0.75rem' }}
                    disabled={isSyncing}
                  >
                    {isSyncing ? 'Downloading...' : 'Download from Cloud'}
                  </button>
                </div>
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
                      It parses your school attendance, current menu items, and your last 4 weeks of logged waste to output recommended cook quantities using running averages.
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
                  Encountered app bugs or transport conflicts? Submit a ticket to Coimbatore municipal sanitation desk.
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

      {/* ONE-QUESTION-PER-SCREEN UPLOAD WIZARD */}
      {showUploadWizard && (
        <div style={styles.wizardOverlay}>
          <div style={styles.wizardPanel}>
            <div style={styles.wizardHeader}>
              <h3 style={{ fontSize: '1rem' }}>Upload Waste Log</h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Step {uploadStep} of 3</span>
            </div>

            <div style={styles.wizardBody}>
              {uploadStep === 1 && (
                <div>
                  <p style={styles.wizardQuestion}>1. Select organic waste drum fill level:</p>
                  <div style={styles.levelCirclesContainer}>
                    {[
                      { value: 0.25, label: '25%' },
                      { value: 0.50, label: '50%' },
                      { value: 0.75, label: '75%' },
                      { value: 1.00, label: '100%' }
                    ].map(lvl => (
                      <button
                        key={lvl.value}
                        onClick={() => {
                          setFormData(f => ({ ...f, drumLevel: lvl.value, customWeight: '' }));
                          setUploadStep(2); // Auto advance
                        }}
                        style={{
                          ...styles.lvlCircle,
                          borderColor: formData.drumLevel === lvl.value && !formData.customWeight ? 'var(--color-primary)' : 'var(--color-border)',
                          backgroundColor: formData.drumLevel === lvl.value && !formData.customWeight ? 'var(--color-primary)' : '#FFFFFF',
                          color: formData.drumLevel === lvl.value && !formData.customWeight ? '#FFFFFF' : 'var(--color-text-primary)'
                        }}
                      >
                        {lvl.label}
                      </button>
                    ))}
                  </div>

                  <div style={{ textAlign: 'center', margin: '16px 0', fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>— OR —</div>

                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.75rem' }}>Input exact custom weight (kg)</label>
                    <input 
                      type="number" 
                      placeholder="Enter weight in kg (Max 150kg)" 
                      className="form-input" 
                      value={formData.customWeight}
                      onChange={(e) => setFormData(f => ({ ...f, customWeight: e.target.value }))}
                    />
                  </div>

                  <div style={styles.wizardCalculatedNote}>
                    Calculated weight: <strong>{formData.customWeight ? formData.customWeight : calculateWeight(school.drumCapacity, formData.drumLevel)} kg</strong>
                  </div>
                </div>
              )}

              {uploadStep === 2 && (
                <div>
                  <p style={styles.wizardQuestion}>2. Select the main reason for waste surplus:</p>
                  <div style={styles.reasonOptionList}>
                    {[
                      'Low Attendance',
                      'Overcooked',
                      'Disliked Menu',
                      'Scraps / Peels',
                      'Spoilage',
                      'Other'
                    ].map(reason => (
                      <button
                        key={reason}
                        onClick={() => {
                          setFormData(f => ({ ...f, reason }));
                          setUploadStep(3); // Auto advance
                        }}
                        style={{
                          ...styles.reasonSelectBtn,
                          border: formData.reason === reason ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                          backgroundColor: formData.reason === reason ? 'rgba(46, 125, 50, 0.05)' : '#FFFFFF'
                        }}
                      >
                        {reason}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {uploadStep === 3 && (
                <div>
                  <p style={styles.wizardQuestion}>3. Confirm details before publishing:</p>
                  <div style={styles.reviewCard}>
                    <div style={styles.reviewRow}>
                      <span>School Kitchen:</span>
                      <strong>{school.name}</strong>
                    </div>
                    <div style={styles.reviewRow}>
                      <span>Measurement:</span>
                      <strong>{formData.customWeight ? 'Custom Weight' : `Drum Level (${formData.drumLevel * 100}%)`}</strong>
                    </div>
                    <div style={styles.reviewRow}>
                      <span>Est. Weight:</span>
                      <strong style={{ color: 'var(--color-primary)', fontSize: '1.05rem' }}>
                        {formData.customWeight ? formData.customWeight : calculateWeight(school.drumCapacity, formData.drumLevel)} kg
                      </strong>
                    </div>
                    <div style={styles.reviewRow}>
                      <span>Surplus Reason:</span>
                      <strong>{formData.reason}</strong>
                    </div>
                  </div>
                </div>
              )}
            </div>

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
                  Publish Post
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
    backgroundColor: 'rgba(249, 168, 37, 0.12)',
    borderBottom: '1px solid rgba(249, 168, 37, 0.2)',
    color: '#D38A00',
    fontSize: '0.65rem',
    fontWeight: 700,
    padding: '6px var(--spacing-md)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '-16px -16px 12px -16px'
  },
  scrollable: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    overflowY: 'auto',
    paddingBottom: '32px'
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
    fontSize: '1.15rem',
    fontWeight: 700,
    lineHeight: '1.2'
  },
  subtext: {
    fontSize: '0.65rem',
    color: 'var(--color-text-secondary)',
    fontWeight: 500
  },
  offlineToggleBtn: {
    minHeight: '32px',
    minWidth: '76px',
    padding: '0 8px',
    borderRadius: '16px',
    border: '1px solid',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  quickStatsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '12px',
    marginTop: '4px'
  },
  kpiLabel: {
    fontSize: '0.65rem',
    color: 'var(--color-text-secondary)',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.02em'
  },
  kpiNumber: {
    fontSize: '1.2rem',
    fontWeight: 700,
    margin: '4px 0',
    fontFamily: 'var(--font-primary)'
  },
  kpiSub: {
    fontSize: '0.65rem',
    color: 'var(--color-text-secondary)'
  },
  smallLabel: {
    fontSize: '0.7rem',
    fontWeight: 600,
    color: 'var(--color-text-secondary)',
    marginBottom: '4px'
  },
  smallInput: {
    minHeight: '36px',
    padding: '6px 10px',
    borderRadius: '8px',
    border: '1px solid var(--color-border)',
    fontSize: '0.8rem',
    backgroundColor: 'var(--color-background)',
    color: 'var(--color-text-primary)',
    width: '100%'
  },
  grid2: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '12px'
  },
  predictionBox: {
    backgroundColor: '#F8FAF9',
    borderRadius: '10px',
    padding: '12px',
    marginTop: '12px',
    border: '1px solid rgba(46, 125, 50, 0.04)',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  predictionRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.75rem'
  },
  activePostDetails: {
    marginTop: '8px'
  },
  activePostGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '8px',
    backgroundColor: 'rgba(33, 150, 243, 0.05)',
    borderRadius: '8px',
    padding: '10px',
    marginTop: '10px',
    fontSize: '0.7rem'
  },
  emptyLogsCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px 16px',
    textAlign: 'center'
  },
  chartWrapper: {
    marginTop: '8px'
  },
  lineChart: {
    width: '100%',
    height: 'auto'
  },
  chartLabels: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.6rem',
    color: 'var(--color-text-secondary)',
    padding: '0 4px',
    marginTop: '4px'
  },
  insightGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '10px'
  },
  insightCard: {
    border: '1px solid var(--color-border)',
    borderRadius: '10px',
    padding: '10px',
    display: 'flex',
    gap: '6px',
    alignItems: 'flex-start',
    fontSize: '0.7rem',
    lineHeight: '1.3'
  },
  rankList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  rankRowActive: {
    display: 'flex',
    alignItems: 'center',
    padding: '8px 12px',
    borderRadius: '10px',
    backgroundColor: 'rgba(76, 175, 80, 0.08)',
    fontSize: '0.75rem'
  },
  rankRow: {
    display: 'flex',
    alignItems: 'center',
    padding: '8px 12px',
    borderRadius: '10px',
    border: '1px solid var(--color-border)',
    fontSize: '0.75rem'
  },
  rankBadge: {
    marginRight: '8px',
    fontSize: '0.9rem'
  },
  rankName: {
    flex: 1,
    fontWeight: 500
  },
  rankPoints: {
    color: 'var(--color-text-primary)'
  },
  sectionTitle: {
    fontSize: '0.95rem',
    marginBottom: '12px'
  },
  barGrid: {
    display: 'flex',
    justifyContent: 'space-around',
    alignItems: 'end',
    paddingTop: '16px'
  },
  barCol: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  },
  breakdownRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.8rem',
    padding: '8px 0',
    borderBottom: '1px solid var(--color-border)'
  },
  timelineWrapper: {
    display: 'flex',
    flexDirection: 'column',
    marginTop: '8px',
    paddingLeft: '8px'
  },
  confirmationPanel: {
    marginTop: '16px',
    padding: '12px',
    borderRadius: '10px',
    backgroundColor: 'rgba(249, 168, 37, 0.05)',
    border: '1px solid rgba(249, 168, 37, 0.1)'
  },
  activityLogContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    maxHeight: '150px',
    overflowY: 'auto',
    fontSize: '0.75rem'
  },
  logRow: {
    display: 'flex',
    gap: '12px',
    borderBottom: '1px dotted var(--color-border)',
    paddingBottom: '4px'
  },
  logTime: {
    color: 'var(--color-text-secondary)',
    fontWeight: 600
  },
  subSettingsHeader: {
    display: 'flex',
    borderBottom: '1px solid var(--color-border)',
    marginBottom: '8px'
  },
  subSettingsBtn: {
    flex: 1,
    fontSize: '0.75rem',
    padding: '10px 0',
    textAlign: 'center',
    cursor: 'pointer'
  },
  toggleThemeBtn: {
    minHeight: '32px',
    minWidth: '70px',
    fontSize: '0.7rem',
    fontWeight: 700,
    borderRadius: '16px',
    display: 'inline-flex'
  },
  faqList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  faqItem: {
    fontSize: '0.75rem'
  },
  faqQuestion: {
    fontWeight: 600,
    color: 'var(--color-text-primary)'
  },
  faqAnswer: {
    color: 'var(--color-text-secondary)',
    marginTop: '2px',
    lineHeight: '1.3'
  },
  wizardOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 9999,
    display: 'flex',
    alignItems: 'end',
    justifyContent: 'center'
  },
  wizardPanel: {
    backgroundColor: 'var(--color-card)',
    width: '100%',
    borderRadius: '16px 16px 0 0',
    padding: 'var(--spacing-md)',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 -4px 16px rgba(0,0,0,0.1)',
    animation: 'slideUp 300ms cubic-bezier(0.4, 0, 0.2, 1) forwards'
  },
  wizardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid var(--color-border)',
    paddingBottom: '10px',
    marginBottom: '12px'
  },
  wizardBody: {
    minHeight: '180px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center'
  },
  wizardQuestion: {
    fontWeight: 600,
    fontSize: '0.85rem',
    marginBottom: '16px',
    color: 'var(--color-text-primary)'
  },
  levelCirclesContainer: {
    display: 'flex',
    justifyContent: 'space-around',
    gap: '8px'
  },
  lvlCircle: {
    width: '64px',
    height: '64px',
    borderRadius: '32px',
    border: '1.5px solid',
    fontSize: '0.85rem',
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: 'var(--shadow-subtle)'
  },
  reasonOptionList: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '10px'
  },
  reasonSelectBtn: {
    minHeight: '44px',
    borderRadius: '10px',
    fontSize: '0.8rem',
    fontWeight: 600,
    color: 'var(--color-text-primary)',
    boxShadow: 'var(--shadow-subtle)'
  },
  wizardCalculatedNote: {
    backgroundColor: '#F8FAF9',
    padding: '8px',
    borderRadius: '6px',
    textAlign: 'center',
    fontSize: '0.75rem',
    color: 'var(--color-text-secondary)',
    marginTop: '10px'
  },
  reviewCard: {
    backgroundColor: 'rgba(46, 125, 50, 0.02)',
    border: '1px solid rgba(46, 125, 50, 0.05)',
    borderRadius: '10px',
    padding: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  reviewRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.75rem'
  },
  wizardFooter: {
    display: 'flex',
    gap: '12px',
    marginTop: '16px',
    borderTop: '1px solid var(--color-border)',
    paddingTop: '12px'
  },
  wizardNavBtn: {
    flex: 1
  }
};
