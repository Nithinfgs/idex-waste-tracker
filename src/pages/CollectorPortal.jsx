import React, { useContext, useState, useEffect } from 'react';
import { StateContext } from '../context/StateContext';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  Search, 
  SlidersHorizontal, 
  Map as MapIcon, 
  List, 
  Navigation,
  CheckCircle,
  Clock,
  Phone,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Award,
  HelpCircle,
  Languages,
  LogOut,
  History,
  ShoppingBag,
  RefreshCw
} from 'lucide-react';

const createMarkerIcon = (weight, status) => {
  let bgColor = 'var(--color-primary)';
  if (status === 'Reserved') bgColor = 'var(--color-accent)';
  if (status === 'In Transit') bgColor = '#2196F3';

  return L.divIcon({
    className: 'custom-pin',
    html: `
      <div style="
        background-color: ${bgColor}; 
        color: white; 
        width: 32px; 
        height: 32px; 
        border-radius: 50%; 
        display: flex; 
        align-items: center; 
        justify-content: center; 
        font-weight: bold; 
        font-size: 10px; 
        border: 2px solid white; 
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
      ">
        ${Math.round(weight)}k
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16]
  });
};

export default function CollectorPortal({ activeTab, setActiveTab }) {
  const {
    schools,
    wastePosts,
    producePosts,
    history,
    notifications,
    selectedCollectorId,
    collectors,
    reserveWaste,
    startTransit,
    completePickup,
    cancelReservation,
    forceSimulateTimeout,
    getFilteredWastePosts,
    updateCollectorOnboarding,
    isDarkMode,
    setIsDarkMode,
    addToast,
    language,
    setLanguage,
    t,
    syncPasscode,
    setSyncPasscode,
    uploadStateToCloud,
    downloadStateFromCloud,
    uploadProducePost
  } = useContext(StateContext);

  const collector = collectors.find(c => c.id === selectedCollectorId);

  // Search & filter states
  const [searchName, setSearchName] = useState('');
  const [minWeight, setMinWeight] = useState('');
  const [maxDistance, setMaxDistance] = useState('');
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'map'
  const [showFilters, setShowFilters] = useState(false);
  const [selectedPostForBottomSheet, setSelectedPostForBottomSheet] = useState(null);
  
  // Confirmation state for reservation
  const [showReserveConfirmationPost, setShowReserveConfirmationPost] = useState(null);

  // Simulated Loading state for Skeletons
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Sub pages for settings
  const [activeSettingsSubPage, setActiveSettingsSubPage] = useState('menu'); // 'menu' | 'settings' | 'help'

  // Active reservation timer states
  const [timerSeconds, setTimerSeconds] = useState({});

  // Help ticket
  const [ticketMsg, setTicketMsg] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);

  // Produce Listings states
  const [showProduceModal, setShowProduceModal] = useState(false);
  const [produceForm, setProduceForm] = useState({
    title: 'Tomatoes',
    quantity: '10',
    price: '0',
    deliveryEstimate: 'Tomorrow Morning',
    description: '',
    imageUrl: ''
  });

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

  // Profile forms
  const [profileData, setProfileData] = useState({
    collectorType: collector?.collectorType || 'Farmer',
    radius: collector?.radius || 10,
    vehicle: collector?.vehicle || ''
  });

  // Calculate remaining timer for active reserved & transit posts
  useEffect(() => {
    const interval = setInterval(() => {
      const updatedTimers = {};
      wastePosts.forEach(post => {
        if (post.collectorId === collector?.id) {
          if (post.status === 'Reserved' && post.reservedAt) {
            const elapsed = Math.floor((Date.now() - new Date(post.reservedAt).getTime()) / 1000);
            const limit = 2 * 60; // 2 minutes for easy simulation timeout
            const remaining = Math.max(limit - elapsed, 0);
            updatedTimers[post.id] = remaining;
          } else if (post.status === 'In Transit' && post.transitStartedAt) {
            const elapsed = Math.floor((Date.now() - new Date(post.transitStartedAt).getTime()) / 1000);
            const limit = 2 * 60; // 2 minutes transit ETA timer simulation
            const remaining = Math.max(limit - elapsed, 0);
            updatedTimers[post.id] = remaining;
          }
        }
      });
      setTimerSeconds(updatedTimers);
    }, 1000);

    return () => clearInterval(interval);
  }, [wastePosts, collector]);

  if (!collector) return <div style={{ padding: '20px' }}>Collector Profile Not Found</div>;

  const handleProfileSave = (e) => {
    e.preventDefault();
    updateCollectorOnboarding(
      collector.id,
      profileData.collectorType,
      profileData.radius,
      profileData.vehicle
    );
    addToast('Profile configurations updated!', 'success');
  };

  const handleTicketSubmit = (e) => {
    e.preventDefault();
    if (!ticketMsg.trim()) return;
    const subject = `IDEX Collector Support Ticket - ${collector.name}`;
    const body = `Collector Name: ${collector.name}\nCollector ID: ${collector.id}\nType: ${collector.collectorType}\nVehicle: ${collector.vehicle}\n\nIssue:\n${ticketMsg}`;
    window.location.href = `mailto:nithinselvaraj9@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    addToast('Ticket dispatched to nithinselvaraj9@gmail.com!', 'success');
    setTicketMsg('');
  };

  const formatTimer = (seconds) => {
    if (seconds === undefined) return '';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const getDistanceToPost = (post) => {
    const school = schools.find(s => s.id === post.schoolId);
    if (!school) return 0;
    const dist = Math.sqrt((school.latitude - collector.latitude) ** 2 + (school.longitude - collector.longitude) ** 2) * 111.32;
    return parseFloat(dist.toFixed(1));
  };

  // Pull to refresh simulation
  const handlePullToRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      addToast('Listings refreshed!', 'success');
    }, 1000);
  };

  // Filters logic
  const filteredPosts = getFilteredWastePosts({ searchName, minWeight, maxDistance }, collector.id);

  // Active pick-ups for current collector
  const activePickups = wastePosts.filter(p => p.collectorId === collector.id && (p.status === 'Reserved' || p.status === 'In Transit' || p.status === 'Awaiting School Confirmation'));

  // Historical calculations
  const collectorHistory = history.filter(h => h.collectorId === collector.id);
  const totalWeightCollected = collectorHistory.reduce((sum, h) => sum + h.estimatedWeight, 0);
  const uniqueSchoolsVisited = new Set(collectorHistory.map(h => h.schoolId)).size;

  const collectorNotifications = notifications.filter(n => n.role === 'collector' && n.targetId === collector.id);

  const myProducePosts = (producePosts || []).filter(p => p.collectorId === collector.id);

  const getProduceIcon = (title) => {
    const t = (title || '').toLowerCase();
    if (t.includes('tomato')) return '🍅';
    if (t.includes('spinach') || t.includes('keerai') || t.includes('leaf') || t.includes('green')) return '🥬';
    if (t.includes('banana')) return '🍌';
    if (t.includes('pumpkin')) return '🎃';
    if (t.includes('potato')) return '🥔';
    if (t.includes('onion')) return '🧅';
    if (t.includes('carrot')) return '🥕';
    if (t.includes('cabbage')) return ' Keerai 🥬';
    if (t.includes('milk')) return '🥛';
    if (t.includes('egg')) return '🥚';
    return '🍎';
  };

  return (
    <div style={styles.container}>
      {/* 1. DEDICATED HOME TAB (SWIGGY-STYLE PICKUPS) */}
      {activeTab === 'home' && (
        <div style={styles.scrollable}>
          <div style={styles.welcomeSection}>
            <p style={styles.subGreeting}>{t('goodMorning')},</p>
            <h2 style={styles.mainGreeting}>{collector.name}</h2>
            <span style={styles.subtext}>{collector.collectorType} {t('profile')}</span>
          </div>

          {/* Quick Stats Grid */}
          <div style={styles.statsGrid}>
            <div className="card">
              <span style={styles.statsLabel}>{t('foodDiverted')}</span>
              <h4 style={styles.statsNumber}>{totalWeightCollected} kg</h4>
            </div>
            <div className="card">
              <span style={styles.statsLabel}>SCHOOLS VISITED</span>
              <h4 style={styles.statsNumber}>{uniqueSchoolsVisited}</h4>
            </div>
          </div>

          {/* Swiggy-style available listings header */}
          <div style={styles.swiggyHeaderFlex}>
            <h3 style={styles.sectionTitle}>Available Nearby Pickups</h3>
            <button onClick={handlePullToRefresh} style={styles.refreshBtn} disabled={isRefreshing}>
              <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>
          </div>

          {/* Pull to refresh indicator */}
          {isRefreshing && (
            <div style={styles.refreshIndicator}>Refreshed Coimbatore listings...</div>
          )}

          {/* Swiggy Cards */}
          <div style={styles.swiggyList}>
            {filteredPosts.map(post => (
              <div key={post.id} className="card card-interactive" style={styles.swiggyCard}>
                <div style={styles.swiggyMetaRow}>
                  <div style={styles.swiggyLeftCol}>
                    <h4 style={styles.swiggySchool}>{post.schoolName}</h4>
                    <span style={styles.swiggyDetails}>
                      📍 {getDistanceToPost(post)} km away | Weight: <strong>{post.estimatedWeight} kg</strong>
                    </span>
                  </div>
                  <span className="badge badge-available">Available</span>
                </div>
                <div style={styles.swiggyActionRow}>
                  <span style={styles.swiggyReason}>{t('cancellationReason')}: {post.reason}</span>
                  <button 
                    onClick={() => setShowReserveConfirmationPost(post)}
                    className="btn-primary" 
                    style={styles.swiggyBtn}
                  >
                    {t('reserve')}
                  </button>
                </div>
              </div>
            ))}
            {filteredPosts.length === 0 && (
              <div style={styles.emptyContainer}>
                <span>🌱</span>
                <p>No Waste Listings Available Today</p>
                <button onClick={handlePullToRefresh} className="btn-secondary" style={{ width: 'auto', minHeight: '38px', marginTop: '12px' }}>
                  Pull to Refresh
                </button>
              </div>
            )}
          </div>

          {/* Farmer Excess Produce Section */}
          <div style={{ marginTop: '30px', borderTop: '1px solid var(--color-border)', paddingTop: '24px', paddingBottom: '30px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={styles.sectionTitle}>👨‍🌾 My Excess Produce Listings</h3>
              <button 
                onClick={() => setShowProduceModal(true)} 
                className="btn-primary animate-ripple" 
                style={{ width: 'auto', minHeight: '36px', padding: '0 14px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <span>+ List Produce</span>
              </button>
            </div>

            {/* List of active produce listings */}
            <div style={styles.swiggyList}>
              {myProducePosts.map(p => (
                <div key={p.id} className="card card-interactive" style={{ ...styles.swiggyCard, borderLeft: p.status === 'Claimed' ? '4px solid var(--color-primary)' : '4px solid #FFA726' }}>
                  <div style={styles.swiggyMetaRow}>
                    <div style={styles.swiggyLeftCol}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '1.25rem' }}>{getProduceIcon(p.title)}</span>
                        <h4 style={styles.swiggySchool}>{p.title} ({p.quantity} kg)</h4>
                      </div>
                      <span style={styles.swiggyDetails}>
                        Price: <strong>{parseFloat(p.price) > 0 ? `₹${p.price}/kg` : 'Free'}</strong> | Delivery: <strong>{p.deliveryEstimate}</strong>
                      </span>
                      {p.description && (
                        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '6px', fontStyle: 'italic' }}>
                          "{p.description}"
                        </p>
                      )}
                    </div>
                    <div>
                      {p.status === 'Claimed' ? (
                        <span className="badge" style={{ backgroundColor: 'rgba(46, 125, 50, 0.08)', color: 'var(--color-primary)' }}>
                          Claimed by {schools.find(s => s.id === p.claimedBySchoolId)?.name.split(',')[0] || 'Claimed'}
                        </span>
                      ) : (
                        <span className="badge" style={{ backgroundColor: 'rgba(255, 167, 38, 0.08)', color: '#F57C00' }}>
                          Available
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {myProducePosts.length === 0 && (
                <div style={{ ...styles.emptyContainer, padding: '24px 0' }}>
                  <span>🍎</span>
                  <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>You haven't listed any excess produce yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. MAP / NEARBY SEARCH TAB (70% MAP / 30% UBER BOTTOM SHEET) */}
      {activeTab === 'nearby' && (
        <div style={styles.flexLayout}>
          {/* Map search filters */}
          <div style={styles.searchContainer}>
            <div style={styles.searchRow}>
              <div style={styles.searchInputWrapper}>
                <Search size={16} color="var(--color-text-secondary)" style={styles.searchIcon} />
                <input 
                  type="text" 
                  placeholder="Search schools in Coimbatore..." 
                  className="form-input" 
                  style={styles.searchInput}
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                />
              </div>
              
              <button 
                onClick={() => setShowFilters(!showFilters)} 
                style={{
                  ...styles.iconBtn,
                  borderColor: showFilters ? 'var(--color-primary)' : 'var(--color-border)',
                  backgroundColor: showFilters ? 'rgba(46, 125, 50, 0.05)' : '#FFFFFF'
                }}
              >
                <SlidersHorizontal size={16} />
              </button>

              <button 
                onClick={() => setViewMode(viewMode === 'list' ? 'map' : 'list')} 
                style={styles.iconBtn}
              >
                {viewMode === 'list' ? <MapIcon size={16} /> : <List size={16} />}
              </button>
            </div>

            {showFilters && (
              <div className="card" style={styles.filterDrawer}>
                <div style={styles.grid2}>
                  <div className="form-group">
                    <label style={styles.filterLabel}>Min Weight (kg)</label>
                    <input 
                      type="number" 
                      placeholder="e.g. 20" 
                      className="form-input" 
                      style={styles.filterInput}
                      value={minWeight}
                      onChange={(e) => setMinWeight(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label style={styles.filterLabel}>Max Radius (km)</label>
                    <input 
                      type="number" 
                      placeholder="e.g. 10" 
                      className="form-input" 
                      style={styles.filterInput}
                      value={maxDistance}
                      onChange={(e) => setMaxDistance(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div style={styles.contentArea}>
            {viewMode === 'map' ? (
              <div style={styles.mapWrapperRelative}>
                {/* Map renders 70% height if Bottom Sheet is visible */}
                <div style={{ height: selectedPostForBottomSheet ? '68%' : '100%', width: '100%', transition: 'height 300ms ease' }}>
                  <MapContainer 
                    center={[collector.latitude, collector.longitude]} 
                    zoom={13} 
                    style={{ height: '100%', width: '100%' }}
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; OpenStreetMap'
                    />
                    
                    {/* Collector Location marker */}
                    <Marker 
                      position={[collector.latitude, collector.longitude]}
                      icon={L.divIcon({
                        className: 'col-pin',
                        html: `<div style="background-color: #1E3A8A; color: white; width: 14px; height: 14px; border-radius: 50%; border: 2.5px solid white; box-shadow: 0 0 8px rgba(0,0,0,0.3);"></div>`,
                        iconSize: [16, 16]
                      })}
                    />

                    {/* School markers */}
                    {filteredPosts.map(post => {
                      const school = schools.find(s => s.id === post.schoolId);
                      if (!school) return null;
                      return (
                        <Marker 
                          key={post.id} 
                          position={[school.latitude, school.longitude]}
                          icon={createMarkerIcon(post.estimatedWeight, post.status)}
                          eventHandlers={{
                            click: () => {
                              setSelectedPostForBottomSheet(post);
                            }
                          }}
                        />
                      );
                    })}
                  </MapContainer>
                </div>

                {/* Uber-style slide up bottom sheet (30% height) */}
                {selectedPostForBottomSheet && (
                  <div className="bottom-sheet" style={{ height: '30%', display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid var(--color-border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }} onClick={() => setSelectedPostForBottomSheet(null)}>
                      <div style={{ width: '40px', height: '4px', backgroundColor: 'var(--color-border)', borderRadius: '2px', marginTop: '2px', cursor: 'pointer' }} />
                    </div>
                    <div style={styles.sheetHeader}>
                      <h4 style={styles.sheetSchool}>{selectedPostForBottomSheet.schoolName}</h4>
                      <button onClick={() => setSelectedPostForBottomSheet(null)} style={styles.sheetCloseBtn}>×</button>
                    </div>
                    <div style={styles.sheetBody}>
                      <div style={styles.sheetMeta}>
                        <span>⚖️ Weight: <strong>{selectedPostForBottomSheet.estimatedWeight} kg</strong></span>
                        <span>📍 Distance: <strong>{getDistanceToPost(selectedPostForBottomSheet)} km</strong></span>
                      </div>
                      <p style={styles.sheetReason}>Surplus Reason: {selectedPostForBottomSheet.reason}</p>
                      <button 
                        onClick={() => {
                          setShowReserveConfirmationPost(selectedPostForBottomSheet);
                          setSelectedPostForBottomSheet(null);
                        }}
                        className="btn-primary animate-ripple" 
                        style={{ ...styles.sheetReserveBtn, minHeight: '44px', borderRadius: '14px', fontSize: '0.85rem' }}
                      >
                        Reserve Pickup
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div style={styles.scrollArea}>
                {filteredPosts.map(post => (
                  <div key={post.id} className="card card-interactive" style={{ marginBottom: '16px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>{post.schoolName}</h4>
                      <span className="badge badge-available">Available</span>
                    </div>
                    <div style={{ display: 'flex', gap: '16px', fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                      <span>⚖️ Weight: <strong style={{ color: 'var(--color-text-primary)' }}>{post.estimatedWeight} kg</strong></span>
                      <span>📍 Distance: <strong style={{ color: 'var(--color-text-primary)' }}>{getDistanceToPost(post)} km</strong></span>
                    </div>
                    <button 
                      onClick={() => setShowReserveConfirmationPost(post)}
                      className="btn-primary animate-ripple" 
                      style={{ minHeight: '44px', fontSize: '0.85rem', fontWeight: 700, borderRadius: '14px', marginTop: '4px' }}
                    >
                      Reserve Pickup
                    </button>
                  </div>
                ))}
                {filteredPosts.length === 0 && (
                  <div style={styles.emptyContainer}>
                    <span>📭</span>
                    <p>No listings matched your criteria.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. ACTIVE PICKUPS TAB */}
      {activeTab === 'active' && (
        <div style={styles.scrollable}>
          <h3 style={styles.sectionTitle}>{t('activePickups')} ({activePickups.length})</h3>

          {activePickups.map(post => {
            const timeRemaining = timerSeconds[post.id];
            const isWarning = timeRemaining !== undefined && timeRemaining <= 30;

            return (
              <div key={post.id} className="card" style={{ marginBottom: '16px', borderLeft: `4px solid ${post.status === 'In Transit' ? '#2196F3' : 'var(--color-accent)'}` }}>
                <div style={styles.activeHeader}>
                  <div>
                    <h4 style={{ fontSize: '0.9rem' }}>{post.schoolName}</h4>
                    <span style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)' }}>
                      Weight: <strong>{post.estimatedWeight} kg</strong> | Dist: {getDistanceToPost(post)} km
                    </span>
                  </div>

                  {(post.status === 'Reserved' || post.status === 'In Transit') && (
                    <div style={{
                      ...styles.timerBadge,
                      backgroundColor: post.status === 'In Transit' ? 'rgba(33, 150, 243, 0.08)' : (isWarning ? 'rgba(211, 47, 47, 0.08)' : 'rgba(249, 168, 37, 0.08)'),
                      color: post.status === 'In Transit' ? '#1565C0' : (isWarning ? 'var(--color-error)' : '#E65100')
                    }}>
                      <Clock size={12} style={{ marginRight: '4px' }} />
                      <span>{post.status === 'In Transit' ? `Arriving in ${formatTimer(timeRemaining)}` : formatTimer(timeRemaining)}</span>
                    </div>
                  )}
                </div>

                {post.status === 'Reserved' && (
                  <div style={styles.simControls}>
                    <button 
                      onClick={() => forceSimulateTimeout(post.id)}
                      className="btn-secondary" 
                      style={styles.simBtn}
                    >
                      <AlertTriangle size={12} style={{ marginRight: '4px' }} />
                      Simulate Expiration (Fast-Forward)
                    </button>
                  </div>
                )}

                <div style={styles.activeActionsPanel}>
                  {post.status === 'Reserved' && (
                    <div style={styles.actionRowGrid}>
                      <button onClick={() => cancelReservation(post.id)} className="btn-secondary" style={{ minHeight: '38px', fontSize: '0.75rem' }}>
                        {t('cancel')}
                      </button>
                      <button onClick={() => startTransit(post.id)} className="btn-primary" style={{ minHeight: '38px', fontSize: '0.75rem' }}>
                        <Navigation size={12} style={{ marginRight: '4px' }} />
                        {t('transitStart')}
                      </button>
                    </div>
                  )}

                  {post.status === 'In Transit' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <p style={{ fontSize: '0.7rem', color: '#1565C0', fontWeight: 600, textAlign: 'center' }}>
                        🚛 Routing simulation active: collector heading to site.
                      </p>
                      
                      {(() => {
                        const school = schools.find(s => s.id === post.schoolId);
                        return school ? (
                          <a 
                            href={`https://www.google.com/maps/dir/?api=1&destination=${school.latitude},${school.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-secondary"
                            style={{ 
                              minHeight: '38px', 
                              fontSize: '0.75rem', 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center', 
                              gap: '6px',
                              textDecoration: 'none',
                              backgroundColor: '#FFFFFF',
                              border: '1px solid var(--color-border)',
                              color: 'var(--color-text-primary)'
                            }}
                          >
                            🗺️ {t('navigate')}
                          </a>
                        ) : null;
                      })()}

                      <button onClick={() => completePickup(post.id)} className="btn-primary" style={{ minHeight: '40px', fontSize: '0.8rem' }}>
                        {t('completePickup')}
                      </button>
                    </div>
                  )}

                  {post.status === 'Awaiting School Confirmation' && (
                    <p style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)', textAlign: 'center', fontStyle: 'italic' }}>
                      Awaiting school verification check.
                    </p>
                  )}
                </div>
              </div>
            );
          })}

          {activePickups.length === 0 && (
            <div style={styles.emptyContainer}>
              <span>📦</span>
              <p>No active reserved pickups.</p>
            </div>
          )}
        </div>
      )}

      {/* 4. NOTIFICATIONS TAB */}
      {activeTab === 'notifications' && (
        <div style={styles.scrollable}>
          <h3 style={styles.sectionTitle}>{t('alerts')}</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {collectorNotifications.map(notif => (
              <div key={notif.id} className="card" style={{ borderLeft: '4px solid var(--color-primary)', padding: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <strong style={{ fontSize: '0.8rem' }}>{notif.title}</strong>
                  <span style={{ fontSize: '0.65rem', color: 'var(--color-text-secondary)' }}>
                    {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{notif.message}</p>
              </div>
            ))}
            {collectorNotifications.length === 0 && (
              <div style={styles.emptyContainer}>
                <span>🔔</span>
                <p>No new notifications.</p>
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
              { id: 'menu', label: 'Collector Details' },
              { id: 'settings', label: t('profile') },
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
            <>
              <form onSubmit={handleProfileSave} className="card" style={{ marginTop: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Collector Name</label>
                  <input type="text" className="form-input" value={collector.name} disabled />
                </div>
                <div className="form-group">
                  <label className="form-label">Collector Category</label>
                  <select 
                    className="form-input"
                    value={profileData.collectorType}
                    onChange={(e) => setProfileData(p => ({ ...p, collectorType: e.target.value }))}
                  >
                    <option value="Farmer">Farmer / Livestock Owner</option>
                    <option value="Compost Company">Compost Company</option>
                    <option value="Vermicompost Site">Vermicompost Facility</option>
                    <option value="Organic Buyer">Organic Resource Buyer</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Operating Travel Radius (km)</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    value={profileData.radius}
                    onChange={(e) => setProfileData(p => ({ ...p, radius: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Vehicle Type</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={profileData.vehicle}
                    onChange={(e) => setProfileData(p => ({ ...p, vehicle: e.target.value }))}
                  />
                </div>
                <button type="submit" className="btn-primary" style={{ marginTop: '8px' }}>
                  {t('comConfigurations')}
                </button>
              </form>

              {/* Collector Reliability stats card */}
              <div className="card" style={{ marginTop: '16px' }}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '8px' }}>Logistics Reliability Statistics</h4>
                <p style={{ fontSize: '0.68rem', color: 'var(--color-text-secondary)', marginBottom: '12px' }}>
                  Your municipal collection scores for mid-day meal pickups.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                  <div style={{ backgroundColor: 'var(--color-background)', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
                    <span style={{ fontSize: '0.65rem', color: 'var(--color-text-secondary)', display: 'block' }}>Completed</span>
                    <strong style={{ fontSize: '1rem', color: 'var(--color-primary)' }}>{collector.id === 'col-1' ? 28 : 22}</strong>
                  </div>
                  <div style={{ backgroundColor: 'var(--color-background)', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
                    <span style={{ fontSize: '0.65rem', color: 'var(--color-text-secondary)', display: 'block' }}>Late Arrived</span>
                    <strong style={{ fontSize: '1rem', color: '#E65100' }}>{collector.id === 'col-1' ? 2 : 1}</strong>
                  </div>
                  <div style={{ backgroundColor: 'var(--color-background)', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
                    <span style={{ fontSize: '0.65rem', color: 'var(--color-text-secondary)', display: 'block' }}>Cancelled</span>
                    <strong style={{ fontSize: '1rem', color: '#C62828' }}>{collector.id === 'col-1' ? 1 : 0}</strong>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeSettingsSubPage === 'settings' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '12px' }}>
              <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{t('darkTheme')}</span>
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
                    placeholder="e.g. coimbatore-collector" 
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
                <h4 style={{ fontSize: '0.9rem', marginBottom: '12px' }}>{t('faq')}</h4>
                <div style={styles.faqList}>
                  <div style={styles.faqItem}>
                    <span style={styles.faqQuestion}>Q: Why can't I reserve more than one pickup?</span>
                    <p style={styles.faqAnswer}>
                      To prevent slot hoarding and ensure fresh feed/compost material, collectors are restricted to one active reservation route at a time.
                    </p>
                  </div>
                  <div style={{ ...styles.faqItem, marginTop: '10px' }}>
                    <span style={styles.faqQuestion}>Q: What is the 30-minute collector timeout?</span>
                    <p style={styles.faqAnswer}>
                      Once a collector reserves a school listing, they must start transit and pickup within 30 minutes, or the listing is automatically unlocked for others.
                    </p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleTicketSubmit} className="card">
                <h4 style={{ fontSize: '0.9rem', marginBottom: '8px' }}>{t('support')}</h4>
                <p style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)', marginBottom: '12px' }}>
                  Encountered gate closed, weight mismatch, or school locked? File a quick report.
                </p>
                <div className="form-group">
                  <textarea 
                    placeholder="Describe your issue..." 
                    className="form-input" 
                    style={{ minHeight: '80px', resize: 'none' }}
                    value={ticketMsg}
                    onChange={(e) => setTicketMsg(e.target.value)}
                    required
                  />
                </div>
                <button type="submit" className="btn-primary" style={{ minHeight: '38px', marginTop: '4px' }}>
                  {t('submit')}
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      {/* 6. RESERVATION CONFIRMATION MODAL */}
      {showReserveConfirmationPost && (
        <div style={styles.modalOverlay}>
          <div className="card animate-scale" style={styles.confirmModal}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '8px', color: 'var(--color-text-primary)' }}>
              {t('confirmReserve')}
            </h3>
            <p style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)', marginBottom: '14px', lineHeight: '1.4' }}>
              {t('confirmMsg')}
            </p>
            <div style={{ border: '1px dashed var(--color-border)', borderRadius: '8px', padding: '10px', marginBottom: '16px', backgroundColor: 'var(--color-background)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', marginBottom: '4px' }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>School:</span>
                <strong style={{ color: 'var(--color-text-primary)' }}>{showReserveConfirmationPost.schoolName}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', marginBottom: '4px' }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>Waste Load:</span>
                <strong style={{ color: 'var(--color-primary)' }}>{showReserveConfirmationPost.estimatedWeight} kg</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem' }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>Distance:</span>
                <strong style={{ color: 'var(--color-text-primary)' }}>{getDistanceToPost(showReserveConfirmationPost)} km</strong>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                onClick={() => setShowReserveConfirmationPost(null)} 
                className="btn-secondary" 
                style={{ flex: 1, minHeight: '38px', fontSize: '0.75rem', padding: '0 4px' }}
              >
                {t('cancel')}
              </button>
              <button 
                onClick={() => {
                  reserveWaste(showReserveConfirmationPost.id, collector.id);
                  setShowReserveConfirmationPost(null);
                }} 
                className="btn-primary" 
                style={{ flex: 1, minHeight: '38px', fontSize: '0.75rem', padding: '0 4px' }}
              >
                {t('confirmReserve')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. FARMER PRODUCE LISTING MODAL */}
      {showProduceModal && (
        <div style={styles.modalOverlay}>
          <div className="card animate-scale" style={{ ...styles.confirmModal, maxWidth: '420px', padding: '16px' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '4px', color: 'var(--color-text-primary)' }}>
              👨‍🌾 List Excess Produce
            </h3>
            <p style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)', marginBottom: '12px' }}>
              Create a listing of surplus food ingredients. Nearby school kitchens will be notified immediately to claim it.
            </p>

            <form onSubmit={(e) => {
              e.preventDefault();
              const finalTitle = produceForm.title === 'Custom' ? (produceForm.customTitle || 'Produce') : produceForm.title;
              const finalDelivery = produceForm.deliveryEstimate === 'Custom' ? (produceForm.customDelivery || 'Immediate') : produceForm.deliveryEstimate;
              
              uploadProducePost(
                collector.id,
                finalTitle,
                produceForm.quantity,
                produceForm.price,
                finalDelivery,
                '', // image_url
                produceForm.description
              );
              setShowProduceModal(false);
              setProduceForm({
                title: 'Tomatoes',
                quantity: '10',
                price: '0',
                deliveryEstimate: 'Tomorrow Morning',
                description: '',
                imageUrl: ''
              });
            }}>
              <div className="form-group" style={{ marginBottom: '10px' }}>
                <label className="form-label" style={{ fontSize: '0.7rem', marginBottom: '4px' }}>Produce Item</label>
                <select 
                  className="form-input" 
                  style={{ minHeight: '38px', fontSize: '0.75rem' }}
                  value={produceForm.title}
                  onChange={(e) => setProduceForm(p => ({ ...p, title: e.target.value }))}
                >
                  <option value="Tomatoes">🍅 Tomatoes</option>
                  <option value="Spinach">Keerai / Spinach 🥬</option>
                  <option value="Bananas">🍌 Bananas</option>
                  <option value="Pumpkins">🎃 Pumpkins</option>
                  <option value="Potatoes">🥔 Potatoes</option>
                  <option value="Custom">Custom Item...</option>
                </select>
              </div>

              {produceForm.title === 'Custom' && (
                <div className="form-group" style={{ marginBottom: '10px' }}>
                  <label className="form-label" style={{ fontSize: '0.7rem', marginBottom: '4px' }}>Custom Item Name</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    style={{ minHeight: '38px', fontSize: '0.75rem' }}
                    placeholder="e.g. Fresh Carrots"
                    value={produceForm.customTitle || ''}
                    onChange={(e) => setProduceForm(p => ({ ...p, customTitle: e.target.value }))}
                    required
                  />
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label" style={{ fontSize: '0.7rem', marginBottom: '4px' }}>Quantity (kg)</label>
                  <input 
                    type="number" 
                    min="1" 
                    className="form-input" 
                    style={{ minHeight: '38px', fontSize: '0.75rem' }}
                    value={produceForm.quantity}
                    onChange={(e) => setProduceForm(p => ({ ...p, quantity: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label" style={{ fontSize: '0.7rem', marginBottom: '4px' }}>Price per kg (₹)</label>
                  <input 
                    type="number" 
                    min="0" 
                    className="form-input" 
                    style={{ minHeight: '38px', fontSize: '0.75rem' }}
                    placeholder="0 for Free"
                    value={produceForm.price}
                    onChange={(e) => setProduceForm(p => ({ ...p, price: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '10px' }}>
                <label className="form-label" style={{ fontSize: '0.7rem', marginBottom: '4px' }}>Delivery Estimate</label>
                <select 
                  className="form-input" 
                  style={{ minHeight: '38px', fontSize: '0.75rem' }}
                  value={produceForm.deliveryEstimate}
                  onChange={(e) => setProduceForm(p => ({ ...p, deliveryEstimate: e.target.value }))}
                >
                  <option value="Immediate (Within 2 Hours)">Immediate (Within 2 Hours)</option>
                  <option value="Today Evening">Today Evening</option>
                  <option value="Tomorrow Morning">Tomorrow Morning</option>
                  <option value="Custom">Custom Time...</option>
                </select>
              </div>

              {produceForm.deliveryEstimate === 'Custom' && (
                <div className="form-group" style={{ marginBottom: '10px' }}>
                  <label className="form-label" style={{ fontSize: '0.7rem', marginBottom: '4px' }}>Custom Delivery Time</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    style={{ minHeight: '38px', fontSize: '0.75rem' }}
                    placeholder="e.g. Sunday Morning, 9 AM"
                    value={produceForm.customDelivery || ''}
                    onChange={(e) => setProduceForm(p => ({ ...p, customDelivery: e.target.value }))}
                    required
                  />
                </div>
              )}

              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label className="form-label" style={{ fontSize: '0.7rem', marginBottom: '4px' }}>Description / Notes</label>
                <textarea 
                  className="form-input" 
                  style={{ minHeight: '50px', fontSize: '0.75rem' }}
                  placeholder="e.g. Harvested from our organic patch today. Very fresh."
                  value={produceForm.description}
                  onChange={(e) => setProduceForm(p => ({ ...p, description: e.target.value }))}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  type="button"
                  onClick={() => setShowProduceModal(false)} 
                  className="btn-secondary" 
                  style={{ flex: 1, minHeight: '38px', fontSize: '0.75rem' }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-primary" 
                  style={{ flex: 1, minHeight: '38px', fontSize: '0.75rem' }}
                >
                  Post Listing
                </button>
              </div>
            </form>
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
  scrollable: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    overflowY: 'auto',
    paddingBottom: '32px'
  },
  welcomeSection: {
    marginBottom: 'var(--spacing-md)'
  },
  subGreeting: {
    fontSize: '0.8rem',
    color: 'var(--color-text-secondary)',
    fontWeight: 500
  },
  mainGreeting: {
    fontSize: '1.2rem',
    fontWeight: 700
  },
  subtext: {
    fontSize: '0.65rem',
    color: 'var(--color-text-secondary)',
    fontWeight: 600,
    textTransform: 'uppercase'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '12px',
    marginBottom: '16px'
  },
  statsLabel: {
    fontSize: '0.65rem',
    color: 'var(--color-text-secondary)',
    fontWeight: 600
  },
  statsNumber: {
    fontSize: '1.15rem',
    fontWeight: 700,
    color: 'var(--color-primary)',
    marginTop: '2px'
  },
  swiggyHeaderFlex: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px'
  },
  sectionTitle: {
    fontSize: '0.9rem',
    fontWeight: 700
  },
  refreshBtn: {
    minHeight: '30px',
    minWidth: '70px',
    border: '1px solid var(--color-border)',
    borderRadius: '16px',
    fontSize: '0.7rem',
    fontWeight: 600,
    display: 'flex',
    gap: '4px',
    alignItems: 'center',
    padding: '0 8px',
    backgroundColor: 'var(--color-card)',
    color: 'var(--color-text-secondary)'
  },
  refreshIndicator: {
    fontSize: '0.65rem',
    color: 'var(--color-primary)',
    textAlign: 'center',
    marginBottom: '8px',
    fontWeight: 600
  },
  swiggyList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  swiggyCard: {
    padding: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    border: '1px solid rgba(0,0,0,0.03)'
  },
  swiggyMetaRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  swiggyLeftCol: {
    flex: 1
  },
  swiggySchool: {
    fontSize: '0.85rem',
    fontWeight: 700
  },
  swiggyDetails: {
    fontSize: '0.7rem',
    color: 'var(--color-text-secondary)',
    display: 'block',
    marginTop: '2px'
  },
  swiggyActionRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '4px'
  },
  swiggyReason: {
    fontSize: '0.7rem',
    color: 'var(--color-text-secondary)'
  },
  swiggyBtn: {
    minHeight: '34px',
    minWidth: '100px',
    padding: '0 12px',
    fontSize: '0.75rem',
    fontWeight: 700,
    borderRadius: '8px',
    width: 'auto'
  },
  emptyContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '36px 16px',
    textAlign: 'center',
    fontSize: '0.8rem',
    color: 'var(--color-text-secondary)'
  },
  flexLayout: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    overflow: 'hidden'
  },
  searchContainer: {
    marginBottom: '12px'
  },
  searchRow: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center'
  },
  searchInputWrapper: {
    flex: 1,
    position: 'relative'
  },
  searchIcon: {
    position: 'absolute',
    left: '12px',
    top: '14px',
    marginTop: '2px'
  },
  searchInput: {
    paddingLeft: '36px',
    fontSize: '0.8rem',
    minHeight: '44px'
  },
  iconBtn: {
    width: '44px',
    height: '44px',
    minWidth: 'auto',
    minHeight: 'auto',
    borderRadius: '10px',
    border: '1px solid var(--color-border)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--color-text-secondary)',
    backgroundColor: '#FFFFFF'
  },
  filterDrawer: {
    marginTop: '8px',
    padding: '12px'
  },
  filterLabel: {
    fontSize: '0.65rem',
    fontWeight: 600,
    color: 'var(--color-text-secondary)',
    marginBottom: '4px'
  },
  filterInput: {
    minHeight: '34px',
    fontSize: '0.75rem',
    padding: '4px 8px'
  },
  contentArea: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden'
  },
  mapWrapperRelative: {
    position: 'relative',
    height: '100%',
    width: '100%'
  },
  sheetHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid var(--color-border)',
    paddingBottom: '8px',
    marginBottom: '8px'
  },
  sheetSchool: {
    fontSize: '0.9rem',
    fontWeight: 700
  },
  sheetCloseBtn: {
    fontSize: '1.5rem',
    color: 'var(--color-text-secondary)',
    minHeight: '24px',
    minWidth: '24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  sheetBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  sheetMeta: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.75rem',
    color: 'var(--color-text-secondary)'
  },
  sheetReason: {
    fontSize: '0.75rem',
    color: 'var(--color-text-secondary)',
    margin: '4px 0'
  },
  sheetReserveBtn: {
    minHeight: '40px',
    marginTop: '4px'
  },
  scrollArea: {
    height: '100%',
    overflowY: 'auto',
    paddingBottom: '24px'
  },
  activeHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  timerBadge: {
    display: 'flex',
    alignItems: 'center',
    padding: '4px 8px',
    borderRadius: '12px',
    fontWeight: 700,
    fontSize: '0.75rem'
  },
  simControls: {
    marginTop: '10px'
  },
  simBtn: {
    minHeight: '28px',
    fontSize: '0.65rem',
    padding: '2px 8px',
    borderColor: '#FFE082',
    backgroundColor: '#FFFDE7',
    color: '#F57F17',
    display: 'inline-flex',
    borderRadius: '6px',
    fontWeight: 600
  },
  activeActionsPanel: {
    marginTop: '12px',
    borderTop: '1px solid var(--color-border)',
    paddingTop: '10px'
  },
  actionRowGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '10px'
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
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2000,
    padding: '20px'
  },
  confirmModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    padding: '20px',
    width: '100%',
    maxWidth: '340px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.18)'
  }
};
