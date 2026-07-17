import React, { useContext, useState, useEffect } from 'react';
import { StateContext } from '../context/StateContext';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
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
  History
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
        ${Math.round(weight)}kg
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
    setIsDarkMode
  } = useContext(StateContext);

  const collector = collectors.find(c => c.id === selectedCollectorId);

  // Search & filter states
  const [searchName, setSearchName] = useState('');
  const [minWeight, setMinWeight] = useState('');
  const [maxDistance, setMaxDistance] = useState('');
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'map'
  const [showFilters, setShowFilters] = useState(false);

  // Sub pages for settings
  const [activeSettingsSubPage, setActiveSettingsSubPage] = useState('menu'); // 'menu' | 'settings' | 'help'

  // Active reservation timer states
  const [timerSeconds, setTimerSeconds] = useState({});

  // Help ticket
  const [ticketMsg, setTicketMsg] = useState('');

  // Profile forms
  const [profileData, setProfileData] = useState({
    collectorType: collector?.collectorType || 'Farmer',
    radius: collector?.radius || 10,
    vehicle: collector?.vehicle || ''
  });

  // Calculate remaining timer for active reserved posts
  useEffect(() => {
    const interval = setInterval(() => {
      const activeReserved = wastePosts.filter(p => p.status === 'Reserved' && p.collectorId === selectedCollectorId);
      const times = {};
      
      activeReserved.forEach(post => {
        if (post.reservedAt) {
          const elapsedMs = Date.now() - new Date(post.reservedAt).getTime();
          const limitMs = 2 * 60 * 1000; // 2 minutes demo limit
          const remainingSecs = Math.max(0, Math.floor((limitMs - elapsedMs) / 1000));
          times[post.id] = remainingSecs;
        }
      });
      
      setTimerSeconds(times);
    }, 1000);

    return () => clearInterval(interval);
  }, [wastePosts, selectedCollectorId]);

  if (!collector) return <div style={{ padding: '20px' }}>Collector Profile Not Found</div>;

  // Apply filters and sorting: (Closest, Highest Weight, Latest)
  const filters = { searchName, minWeight: parseFloat(minWeight) || null, maxDistance: parseFloat(maxDistance) || null };
  const filteredPosts = getFilteredWastePosts(filters, selectedCollectorId);

  // Get active pickups belonging to this collector
  const activePickups = wastePosts.filter(p => 
    p.collectorId === selectedCollectorId && 
    ['Reserved', 'In Transit', 'Awaiting School Confirmation'].includes(p.status)
  );

  // Get completed history for this collector
  const collectorHistory = history.filter(h => h.collectorId === selectedCollectorId);

  // Compute collector statistics
  const totalWeightCollected = collectorHistory.reduce((sum, h) => sum + h.estimatedWeight, 0);
  const uniqueSchoolsVisited = new Set(collectorHistory.map(h => h.schoolId)).size;

  const handleProfileSave = (e) => {
    e.preventDefault();
    updateCollectorOnboarding(
      collector.id,
      profileData.collectorType,
      profileData.radius,
      profileData.vehicle
    );
    alert('Collector settings updated successfully!');
  };

  const handleTicketSubmit = (e) => {
    e.preventDefault();
    if (!ticketMsg.trim()) return;
    alert(`Issue Reported: "${ticketMsg}". Support staff will investigate.`);
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

  return (
    <div style={styles.container}>
      {/* 1. DEDICATED HOME TAB */}
      {activeTab === 'home' && (
        <div style={styles.scrollable}>
          <div style={styles.welcomeSection}>
            <p style={styles.subGreeting}>Hello,</p>
            <h2 style={styles.mainGreeting}>{collector.name}</h2>
            <span style={styles.subtext}>{collector.collectorType} Portal</span>
          </div>

          {/* Quick Stats Banner */}
          <div className="card" style={{ display: 'flex', justifyContent: 'space-around', padding: '12px', marginBottom: '16px' }}>
            <div style={{ textAlign: 'center' }}>
              <span style={{ fontSize: '0.65rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>TOTAL COLLECTED</span>
              <h4 style={{ color: 'var(--color-primary)', fontSize: '1.1rem', fontWeight: 700 }}>{totalWeightCollected} kg</h4>
            </div>
            <div style={{ width: '1px', backgroundColor: 'var(--color-border)' }} />
            <div style={{ textAlign: 'center' }}>
              <span style={{ fontSize: '0.65rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>SCHOOLS VISITED</span>
              <h4 style={{ color: 'var(--color-primary)', fontSize: '1.1rem', fontWeight: 700 }}>{uniqueSchoolsVisited}</h4>
            </div>
          </div>

          <h3 style={{ ...styles.sectionTitle, marginBottom: '8px' }}>Available Nearby</h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '12px' }}>
            Swiggy-style listings matching your radius and filters:
          </p>

          <div style={styles.swiggyScrollContainer}>
            {filteredPosts.map(post => (
              <div key={post.id} className="card" style={styles.swiggyCard}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={styles.swiggyWeight}>{post.estimatedWeight} kg</span>
                  <span style={styles.swiggyDist}>{getDistanceToPost(post)} km</span>
                </div>
                <h4 style={styles.swiggySchool}>{post.schoolName}</h4>
                <p style={styles.swiggyReason}>Reason: {post.reason}</p>
                <button 
                  onClick={() => reserveWaste(post.id, collector.id)}
                  className="btn-primary" 
                  style={styles.swiggyBtn}
                >
                  Reserve Pickup
                </button>
              </div>
            ))}
            {filteredPosts.length === 0 && (
              <div style={styles.emptySwiggy}>
                <span style={{ fontSize: '1.5rem' }}>📭</span>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>"No waste listings nearby."</p>
              </div>
            )}
          </div>

          {/* Quick Map preview box */}
          <div className="card" style={{ marginTop: '16px', padding: '16px' }}>
            <h4 style={{ fontSize: '0.9rem', marginBottom: '6px' }}>Marketplace Map Finder</h4>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '12px' }}>
              Toggle map tab to see geolocated coordinates of all available organic food drums.
            </p>
            <button onClick={() => setActiveTab('nearby')} className="btn-secondary" style={{ minHeight: '38px' }}>
              View Interactive Map
            </button>
          </div>
        </div>
      )}

      {/* 2. NEARBY / MAP TAB */}
      {activeTab === 'nearby' && (
        <div style={styles.flexLayout}>
          {/* Search bar & filter controls */}
          <div style={styles.searchContainer}>
            <div style={styles.searchRow}>
              <div style={styles.searchInputWrapper}>
                <Search size={18} color="var(--color-text-secondary)" style={styles.searchIcon} />
                <input 
                  type="text" 
                  placeholder="Search schools by name..." 
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
                <SlidersHorizontal size={18} />
              </button>

              <button 
                onClick={() => setViewMode(viewMode === 'list' ? 'map' : 'list')} 
                style={styles.iconBtn}
              >
                {viewMode === 'list' ? <MapIcon size={18} /> : <List size={18} />}
              </button>
            </div>

            {/* Filter Drawer */}
            {showFilters && (
              <div className="card" style={styles.filterDrawer}>
                <div style={styles.grid2}>
                  <div className="form-group" style={{ flex: 1 }}>
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
                  <div className="form-group" style={{ flex: 1 }}>
                    <label style={styles.filterLabel}>Max Distance (km)</label>
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
                <button 
                  onClick={() => {
                    setMinWeight('');
                    setMaxDistance('');
                    setSearchName('');
                  }} 
                  className="btn-secondary" 
                  style={{ minHeight: '32px', fontSize: '0.75rem', padding: '4px' }}
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>

          {/* Map View or List View */}
          <div style={styles.contentArea}>
            {viewMode === 'map' ? (
              <div style={styles.mapContainer}>
                <MapContainer 
                  center={[collector.latitude, collector.longitude]} 
                  zoom={14} 
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  />
                  {/* Collector Marker */}
                  <Marker 
                    position={[collector.latitude, collector.longitude]}
                    icon={L.divIcon({
                      className: 'collector-pin',
                      html: `<div style="background-color: #1A237E; color: white; width: 14px; height: 14px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.5);"></div>`,
                      iconSize: [20, 20]
                    })}
                  >
                    <Popup>
                      <strong>Your Location</strong><br/>
                      {collector.name} ({collector.vehicle})
                    </Popup>
                  </Marker>

                  {/* School Pins */}
                  {filteredPosts.map(post => {
                    const school = schools.find(s => s.id === post.schoolId);
                    if (!school) return null;
                    return (
                      <Marker 
                        key={post.id} 
                        position={[school.latitude, school.longitude]}
                        icon={createMarkerIcon(post.estimatedWeight, post.status)}
                      >
                        <Popup>
                          <div style={styles.popupContent}>
                            <h4 style={styles.popupTitle}>{school.name}</h4>
                            <p style={styles.popupText}>Waste Available: <strong>{post.estimatedWeight} kg</strong></p>
                            <p style={styles.popupText}>Distance: {getDistanceToPost(post)} km</p>
                            <button 
                              onClick={() => reserveWaste(post.id, collector.id)}
                              className="btn-primary" 
                              style={styles.popupBtn}
                            >
                              Reserve Pickup
                            </button>
                          </div>
                        </Popup>
                      </Marker>
                    );
                  })}
                </MapContainer>
              </div>
            ) : (
              <div style={styles.scrollArea}>
                <div style={styles.listHeader}>
                  <span>Nearby Listings ({filteredPosts.length})</span>
                  <span style={styles.sortingNote}>Sorted: Closest → Heaviest</span>
                </div>

                {filteredPosts.map(post => (
                  <div key={post.id} className="card card-interactive" style={styles.listingCard}>
                    <div style={styles.listingHeader}>
                      <h4 style={styles.schoolTitle}>{post.schoolName}</h4>
                      <span className="badge badge-available">AVAILABLE</span>
                    </div>
                    <div style={styles.listingBody}>
                      <div style={styles.metaRow}>
                        <span style={styles.metaLabel}>Weight: <strong>{post.estimatedWeight} kg</strong></span>
                        <span style={styles.metaLabel}>Distance: {getDistanceToPost(post)} km</span>
                      </div>
                      <p style={styles.reasonText}>Reason: {post.reason}</p>
                    </div>
                    <button 
                      onClick={() => reserveWaste(post.id, collector.id)}
                      className="btn-primary"
                      style={styles.reserveBtn}
                    >
                      Reserve Pickup
                      <ArrowRight size={16} style={{ marginLeft: '6px' }} />
                    </button>
                  </div>
                ))}

                {filteredPosts.length === 0 && (
                  <div style={styles.emptyView}>
                    <span>📭</span>
                    <p>"No waste listings nearby."</p>
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
          <h3 style={styles.sectionTitle}>Active Pickups ({activePickups.length})</h3>

          {activePickups.map(post => {
            const timeRemaining = timerSeconds[post.id];
            const isTimeoutWarning = timeRemaining !== undefined && timeRemaining <= 30;

            return (
              <div key={post.id} className="card" style={{ marginBottom: '16px', borderLeft: `4px solid ${post.status === 'In Transit' ? '#2196F3' : 'var(--color-accent)'}` }}>
                <div style={styles.activeHeader}>
                  <div>
                    <h4 style={{ fontSize: '0.95rem' }}>{post.schoolName}</h4>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                      Weight: <strong>{post.estimatedWeight} kg</strong> | Distance: {getDistanceToPost(post)} km
                    </span>
                  </div>
                  
                  {/* Reservation Timer UI */}
                  {post.status === 'Reserved' && (
                    <div style={{
                      ...styles.timerBox,
                      backgroundColor: isTimeoutWarning ? 'rgba(211, 47, 47, 0.1)' : 'rgba(249, 168, 37, 0.1)',
                      color: isTimeoutWarning ? 'var(--color-error)' : '#F57F17'
                    }}>
                      <Clock size={14} style={{ marginRight: '4px' }} />
                      <span style={{ fontWeight: 700, fontSize: '0.75rem' }}>
                        {formatTimer(timeRemaining)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Simulation Time Travel Controls */}
                {post.status === 'Reserved' && (
                  <div style={styles.simControls}>
                    <button 
                      onClick={() => forceSimulateTimeout(post.id)}
                      className="btn-secondary" 
                      style={styles.simBtn}
                    >
                      <AlertTriangle size={12} style={{ marginRight: '4px' }} />
                      Simulate Reservation Expiration (Time Travel 2m)
                    </button>
                  </div>
                )}

                {/* Step Action Trigger Panel */}
                <div style={{ marginTop: '16px', borderTop: '1px solid var(--color-border)', paddingTop: '12px' }}>
                  {post.status === 'Reserved' && (
                    <div style={styles.actionButtonGroup}>
                      <button 
                        onClick={() => cancelReservation(post.id)}
                        className="btn-secondary" 
                        style={{ flex: 1, minHeight: '40px' }}
                      >
                        Cancel Reservation
                      </button>
                      <button 
                        onClick={() => startTransit(post.id)}
                        className="btn-primary" 
                        style={{ flex: 1, minHeight: '40px' }}
                      >
                        <Navigation size={14} style={{ marginRight: '6px' }} />
                        Start Transit
                      </button>
                    </div>
                  )}

                  {post.status === 'In Transit' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <p style={{ fontSize: '0.75rem', color: '#1565c0', fontWeight: 600, textAlign: 'center', marginBottom: '4px' }}>
                        🚛 Routing simulation active: collector heading to site.
                      </p>
                      <button 
                        onClick={() => completePickup(post.id)}
                        className="btn-primary" 
                        style={{ minHeight: '44px' }}
                      >
                        <CheckCircle size={14} style={{ marginRight: '6px' }} />
                        Complete Waste Pickup
                      </button>
                    </div>
                  )}

                  {post.status === 'Awaiting School Confirmation' && (
                    <div style={styles.awaitingBox}>
                      <Clock size={16} color="var(--color-text-secondary)" style={{ marginRight: '6px' }} />
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
                        Awaiting confirmation from school to close ticket.
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {activePickups.length === 0 && (
            <div style={styles.emptyContainer}>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '12px' }}>
                You have no active waste reservations right now.
              </p>
              <button 
                onClick={() => setActiveTab('nearby')}
                className="btn-primary" 
                style={{ width: 'auto', padding: '0 20px', minHeight: '44px' }}
              >
                Browse Nearby Listings
              </button>
            </div>
          )}
        </div>
      )}

      {/* 4. DEDICATED COLLECTOR DASHBOARD TAB */}
      {activeTab === 'marketplace' && (
        <div style={styles.scrollable}>
          <h3 style={styles.sectionTitle}>Collector Dashboard</h3>
          <p style={styles.subText}>Track your environmental metrics and collection history.</p>

          <div style={styles.grid2}>
            <div className="card" style={{ flex: 1, padding: '12px' }}>
              <span style={{ fontSize: '0.65rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>LANDFILL DIVERTED</span>
              <h4 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '4px 0' }}>{totalWeightCollected} kg</h4>
              <span style={{ fontSize: '0.6rem', color: 'var(--color-primary)', fontWeight: 600 }}>Verified organic mass</span>
            </div>
            
            <div className="card" style={{ flex: 1, padding: '12px' }}>
              <span style={{ fontSize: '0.65rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>PICKUPS COMPLETE</span>
              <h4 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '4px 0' }}>{collectorHistory.length} times</h4>
              <span style={{ fontSize: '0.6rem', color: 'var(--color-primary)', fontWeight: 600 }}>100% success rate</span>
            </div>
          </div>

          {/* SVG Bar Chart representing monthly collections */}
          <div className="card" style={{ marginTop: '12px', padding: '16px' }}>
            <h4 style={{ fontSize: '0.85rem', marginBottom: '16px' }}>Monthly Diversion Volume (kg)</h4>
            <div style={styles.barChartContainer}>
              <div style={styles.barItem}><div style={{ ...styles.bar, height: '40px' }}></div><span style={styles.barLabel}>May</span></div>
              <div style={styles.barItem}><div style={{ ...styles.bar, height: '70px' }}></div><span style={styles.barLabel}>Jun</span></div>
              <div style={styles.barItem}><div style={{ ...styles.bar, height: `${Math.min(100, 30 + totalWeightCollected * 1.5)}px`, backgroundColor: 'var(--color-primary)' }}></div><span style={styles.barLabel}>Jul</span></div>
            </div>
          </div>

          <div className="card" style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Award size={24} color="var(--color-accent)" />
            <div>
              <h5 style={{ fontSize: '0.8rem', fontWeight: 600 }}>Environmental Impact badge</h5>
              <p style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)', lineHeight: '1.2' }}>
                Your collections reduced carbon emissions equivalent to planting **{Math.round(totalWeightCollected * 0.4)} trees**!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 5. HISTORY TAB */}
      {activeTab === 'history' && (
        <div style={styles.scrollable}>
          <h3 style={styles.sectionTitle}>Completed Pickups History</h3>
          <p style={styles.subText}>List of organic feedstock loads you collected successfully.</p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
            {collectorHistory.map(hist => (
              <div key={hist.id} className="card" style={{ padding: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{hist.schoolName}</span>
                  <strong style={{ fontSize: '0.85rem', color: 'var(--color-primary)' }}>{hist.estimatedWeight} kg</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--color-text-secondary)' }}>
                  <span>Reason: {hist.reason}</span>
                  <span>{new Date(hist.date).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
            {collectorHistory.length === 0 && (
              <p style={{ textAlign: 'center', fontSize: '0.80rem', color: 'var(--color-text-secondary)', padding: '24px' }}>
                No completed pickup logs found.
              </p>
            )}
          </div>
        </div>
      )}

      {/* 6. NOTIFICATIONS TAB */}
      {activeTab === 'notifications' && (
        <div style={styles.scrollable}>
          <h3 style={styles.sectionTitle}>Alert Center</h3>
          {notifications.filter(n => n.role === 'collector' && n.targetId === collector.id).map(notif => (
            <div key={notif.id} className="card" style={{ ...styles.notifCard, borderLeft: `4px solid ${notif.type === 'error' ? 'var(--color-error)' : notif.type === 'warning' ? 'var(--color-accent)' : 'var(--color-primary)'}` }}>
              <span style={styles.notifTitle}>{notif.title}</span>
              <p style={styles.notifMsg}>{notif.message}</p>
              <span style={styles.notifTime}>{new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          ))}
          {notifications.filter(n => n.role === 'collector' && n.targetId === collector.id).length === 0 && (
            <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--color-text-secondary)', padding: '24px' }}>
              No notifications for you yet.
            </p>
          )}
        </div>
      )}

      {/* 7. PROFILE TAB */}
      {activeTab === 'profile' && (
        <div style={styles.scrollable}>
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
                <label className="form-label">Full Name</label>
                <input type="text" className="form-input" value={collector.name} disabled style={{ backgroundColor: 'var(--color-background)' }} />
              </div>

              <div className="form-group">
                <label className="form-label">Collector Category</label>
                <select 
                  className="form-input"
                  value={profileData.collectorType}
                  onChange={(e) => setProfileData(p => ({ ...p, collectorType: e.target.value }))}
                >
                  <option value="Farmer">Farmer (Livestock Feed)</option>
                  <option value="Compost Company">Compost Producer</option>
                  <option value="Vermicompost Producer">Vermicompost Scraps</option>
                  <option value="Organic Buyer">Organic Waste Buyer</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Operating Radius (km)</label>
                <input 
                  type="number" 
                  className="form-input" 
                  value={profileData.radius}
                  onChange={(e) => setProfileData(p => ({ ...p, radius: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Transport Vehicle Details</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={profileData.vehicle}
                  onChange={(e) => setProfileData(p => ({ ...p, vehicle: e.target.value }))}
                />
              </div>

              <button type="submit" className="btn-primary" style={{ marginTop: '12px' }}>
                Save Changes
              </button>
            </form>
          )}

          {activeSettingsSubPage === 'settings' && (
            <div className="card" style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h4 style={{ fontSize: '0.9rem' }}>App Settings</h4>
              
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Languages size={14} /> Language
                </label>
                <select className="form-input" defaultValue="en">
                  <option value="en">English</option>
                  <option value="kn">ಕನ್ನಡ (Kannada)</option>
                  <option value="hi">हिन्दी (Hindi)</option>
                </select>
              </div>

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
            </div>
          )}

          {activeSettingsSubPage === 'help' && (
            <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="card">
                <h4 style={{ fontSize: '0.9rem', marginBottom: '12px' }}>Help & FAQs</h4>
                <div style={styles.faqList}>
                  <div style={styles.faqItem}>
                    <span style={styles.faqQuestion}>Q: How do I reserve waste postings?</span>
                    <p style={styles.faqAnswer}>
                      Go to the Map or List view, search/find the school listing matching your capacity, and tap "Reserve". You have a 30-minute window to pick it up.
                    </p>
                  </div>
                  <div style={{ ...styles.faqItem, marginTop: '10px' }}>
                    <span style={styles.faqQuestion}>Q: What should I do upon arriving at the school?</span>
                    <p style={styles.faqAnswer}>
                      Collect the waste from the standard organic drum, tap "Complete Waste Pickup" in the Active tab, and ask the school supervisor to confirm the collection on their portal.
                    </p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleTicketSubmit} className="card">
                <h4 style={{ fontSize: '0.9rem', marginBottom: '8px' }}>Report Issue / Support</h4>
                <div className="form-group">
                  <textarea 
                    placeholder="Describe transport conflicts or issue..." 
                    className="form-input" 
                    style={{ minHeight: '80px', resize: 'none' }}
                    value={ticketMsg}
                    onChange={(e) => setTicketMsg(e.target.value)}
                    required
                  />
                </div>
                <button type="submit" className="btn-primary" style={{ minHeight: '38px' }}>
                  Send Issue Report
                </button>
              </form>
            </div>
          )}
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
    overflowY: 'hidden'
  },
  scrollable: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    overflowY: 'auto',
    paddingBottom: 'var(--spacing-lg)'
  },
  flexLayout: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    overflow: 'hidden'
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
    lineHeight: '1.2'
  },
  subtext: {
    fontSize: '0.7rem',
    color: 'var(--color-text-secondary)',
    fontWeight: 600,
    textTransform: 'uppercase'
  },
  swiggyScrollContainer: {
    display: 'flex',
    gap: '12px',
    overflowX: 'auto',
    padding: '4px 0 var(--spacing-md) 0',
    scrollSnapType: 'x mandatory'
  },
  swiggyCard: {
    minWidth: '220px',
    maxWidth: '240px',
    flexShrink: 0,
    scrollSnapAlign: 'start',
    padding: '14px',
    border: '1px solid var(--color-border)',
    boxShadow: 'var(--shadow-subtle)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between'
  },
  swiggyWeight: {
    fontSize: '0.85rem',
    fontWeight: 700,
    color: 'var(--color-primary)',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    padding: '2px 8px',
    borderRadius: '8px'
  },
  swiggyDist: {
    fontSize: '0.75rem',
    color: 'var(--color-text-secondary)',
    fontWeight: 500
  },
  swiggySchool: {
    fontSize: '0.85rem',
    margin: '12px 0 4px 0',
    lineHeight: '1.3'
  },
  swiggyReason: {
    fontSize: '0.7rem',
    color: 'var(--color-text-secondary)',
    marginBottom: '14px'
  },
  swiggyBtn: {
    width: '100%',
    minHeight: '36px',
    fontSize: '0.75rem',
    padding: '6px'
  },
  emptySwiggy: {
    width: '100%',
    textAlign: 'center',
    padding: '32px 0',
    backgroundColor: 'var(--color-background)',
    borderRadius: '16px',
    border: '1px dashed var(--color-border)'
  },
  searchContainer: {
    marginBottom: 'var(--spacing-md)'
  },
  searchRow: {
    display: 'flex',
    gap: 'var(--spacing-sm)'
  },
  searchInputWrapper: {
    flex: 1,
    position: 'relative',
    display: 'flex',
    alignItems: 'center'
  },
  searchIcon: {
    position: 'absolute',
    left: '12px'
  },
  searchInput: {
    paddingLeft: '38px',
    height: '42px',
    minHeight: 'auto'
  },
  iconBtn: {
    border: '1px solid var(--color-border)',
    borderRadius: '12px',
    width: '42px',
    height: '42px',
    minHeight: 'auto',
    minWidth: 'auto',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF'
  },
  filterDrawer: {
    marginTop: '8px',
    padding: '12px',
    border: '1px solid var(--color-border)'
  },
  filterLabel: {
    fontSize: '0.65rem',
    fontWeight: 600,
    color: 'var(--color-text-secondary)',
    textTransform: 'uppercase'
  },
  filterInput: {
    minHeight: '36px',
    padding: '4px 8px',
    fontSize: '0.75rem'
  },
  contentArea: {
    flex: 1,
    overflow: 'hidden',
    position: 'relative'
  },
  mapContainer: {
    height: '100%',
    width: '100%',
    borderRadius: '16px',
    overflow: 'hidden'
  },
  scrollArea: {
    height: '100%',
    overflowY: 'auto',
    paddingBottom: 'var(--spacing-lg)'
  },
  listHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.75rem',
    fontWeight: 600,
    color: 'var(--color-text-secondary)',
    marginBottom: '10px'
  },
  sortingNote: {
    color: 'var(--color-primary)'
  },
  listingCard: {
    marginBottom: '12px',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  listingHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  schoolTitle: {
    fontSize: '0.9rem',
    lineHeight: '1.2',
    flex: 1
  },
  listingBody: {
    borderBottom: '1px dashed var(--color-border)',
    paddingBottom: '10px'
  },
  metaRow: {
    display: 'flex',
    gap: '16px',
    fontSize: '0.75rem'
  },
  metaLabel: {
    color: 'var(--color-text-secondary)'
  },
  reasonText: {
    fontSize: '0.75rem',
    color: 'var(--color-text-secondary)',
    marginTop: '4px'
  },
  reserveBtn: {
    width: '100%',
    minHeight: '40px'
  },
  emptyView: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 'var(--spacing-xl)',
    textAlign: 'center',
    gap: '12px',
    color: 'var(--color-text-secondary)',
    fontSize: '0.85rem'
  },
  sectionTitle: {
    fontSize: '1.05rem',
    marginBottom: 'var(--spacing-sm)'
  },
  subText: {
    fontSize: '0.75rem',
    color: 'var(--color-text-secondary)',
    marginBottom: '12px'
  },
  activeHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  timerBox: {
    display: 'flex',
    alignItems: 'center',
    padding: '4px 8px',
    borderRadius: '8px',
    fontWeight: 600
  },
  simControls: {
    marginTop: '10px',
    backgroundColor: 'var(--color-background)',
    padding: '8px',
    borderRadius: '8px',
    border: '1px solid var(--color-border)'
  },
  simBtn: {
    width: '100%',
    minHeight: '32px',
    fontSize: '0.65rem',
    color: 'var(--color-primary)',
    backgroundColor: 'transparent',
    padding: 0
  },
  actionButtonGroup: {
    display: 'flex',
    gap: '10px'
  },
  awaitingBox: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: 'var(--color-background)',
    padding: '10px',
    borderRadius: '8px'
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
  notifCard: {
    marginBottom: '8px',
    padding: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
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
    textAlign: 'right'
  },
  popupContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    minWidth: '150px'
  },
  popupTitle: {
    fontSize: '0.85rem',
    margin: 0
  },
  popupText: {
    fontSize: '0.75rem',
    margin: 0
  },
  popupBtn: {
    minHeight: '32px',
    fontSize: '0.75rem',
    padding: '4px'
  },
  grid2: {
    display: 'flex',
    gap: '10px'
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
  barChartContainer: {
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    height: '120px',
    paddingTop: '20px',
    borderBottom: '1px solid var(--color-border)',
    paddingBottom: '4px'
  },
  barItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '40px'
  },
  bar: {
    width: '24px',
    backgroundColor: 'var(--color-secondary)',
    borderRadius: '4px 4px 0 0',
    transition: 'height 0.3s ease'
  },
  barLabel: {
    fontSize: '0.65rem',
    color: 'var(--color-text-secondary)',
    marginTop: '6px',
    fontWeight: 600
  }
};
