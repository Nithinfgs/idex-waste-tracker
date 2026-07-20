import React, { useContext, useState, useEffect } from 'react';
import { StateContext } from '../context/StateContext';
import LicenseViewer from '../components/LicenseViewer';
import { 
  MapPin, 
  Phone, 
  Trash2, 
  Check, 
  X, 
  Truck, 
  AlertTriangle, 
  Calendar,
  Clock, 
  Award,
  ChevronRight,
  TrendingDown,
  Building,
  Search,
  Filter,
  Sliders,
  DollarSign,
  AlertCircle,
  TrendingUp,
  Map,
  Home,
  User,
  Bell,
  LogOut,
  Scale,
  Package,
  CheckCircle2
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Circle } from 'react-leaflet';
import L from 'leaflet';

export default function BuyerPortal({ activeTab: propActiveTab, setActiveTab: propSetActiveTab }) {
  const { 
    buyers,
    selectedBuyerId,
    schools,
    wastePosts,
    setWastePosts,
    history,
    setHistory,
    notifications,
    markAsRead,
    markAllAsRead,
    setIsLoggedIn,
    setNotifications,
    isOfflineMode,
    addToast,
    triggerConfetti,
    t
  } = useContext(StateContext);

  const buyer = buyers?.find(b => b.id === selectedBuyerId) || {
    id: 'buy-1',
    name: 'Coimbatore Agri-Gov Agency',
    agencyName: 'Coimbatore Agriculture Department',
    contact: '0422 230 1122',
    latitude: 11.0250,
    longitude: 76.9620,
    vehicle: 'Agriculture Dept Truck',
    radius: 25,
    budget: '₹50,000/mo',
    rating: 'A+'
  };

  const [internalTab, setInternalTab] = useState('home');
  const activeTab = propActiveTab || internalTab;
  const setActiveTab = propSetActiveTab || setInternalTab;
  const [viewMode, setViewMode] = useState('map'); // 'map' | 'list'
  const [selectedPostForBottomSheet, setSelectedPostForBottomSheet] = useState(null);
  const [showReserveConfirmationPost, setShowReserveConfirmationPost] = useState(null);
  
  // Filter States
  const [showFilters, setShowFilters] = useState(false);
  const [minWeight, setMinWeight] = useState('');
  const [maxDistance, setMaxDistance] = useState('');

  // Active reservation timer seconds state
  const [timerSeconds, setTimerSeconds] = useState({});

  // Calculate distance between two coordinates
  const getDistanceToPost = (post) => {
    const school = schools.find(s => s.id === post.schoolId);
    if (!school) return 0;
    
    // Simple Haversine approximation
    const R = 6371;
    const dLat = ((school.latitude - buyer.latitude) * Math.PI) / 180;
    const dLon = ((school.longitude - buyer.longitude) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((buyer.latitude * Math.PI) / 180) *
        Math.cos((school.latitude * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 10) / 10;
  };

  // Filter listings
  const filteredPosts = wastePosts.filter(post => {
    // Only available postings
    if (post.status !== 'Available') return false;
    
    // Weight filter
    if (minWeight && post.estimatedWeight < parseFloat(minWeight)) return false;
    
    // Proximity radius filter
    const dist = getDistanceToPost(post);
    if (maxDistance && dist > parseFloat(maxDistance)) return false;
    
    return true;
  });

  // Calculate buyer specific statistics
  const buyerHistory = history.filter(h => h.collectorId === buyer.id || h.buyerId === buyer.id);
  const stats = {
    totalPurchased: buyerHistory.reduce((acc, h) => acc + (h.estimatedWeight || 0), 0),
    totalSpend: buyerHistory.reduce((acc, h) => acc + Math.round((h.estimatedWeight || 0) * 15), 0), // Feedstock base rate ₹15/kg
    completedOrders: buyerHistory.length,
    activeOrdersCount: wastePosts.filter(p => p.collectorId === buyer.id && p.status !== 'Collected').length
  };

  // List of active purchases
  const activePurchases = wastePosts.filter(post => post.collectorId === buyer.id && post.status !== 'Collected');

  // Timer runner for active reservations
  useEffect(() => {
    const interval = setInterval(() => {
      setTimerSeconds(prev => {
        const copy = { ...prev };
        let hasChanges = false;
        
        activePurchases.forEach(post => {
          if (!post.reservedAt) return;
          const totalDuration = 2 * 60; // 2 minutes simulation limit
          const elapsed = Math.floor((Date.now() - new Date(post.reservedAt).getTime()) / 1000);
          const remaining = Math.max(0, totalDuration - elapsed);
          
          if (copy[post.id] !== remaining) {
            copy[post.id] = remaining;
            hasChanges = true;
          }
        });
        
        return hasChanges ? copy : prev;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [activePurchases]);

  // Format timer seconds
  const formatTimer = (sec) => {
    if (sec === undefined || sec <= 0) return '00:00';
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle feedstock reservation
  const handleReserveFeedstock = (post) => {
    if (isOfflineMode) {
      addToast('Cannot reserve feedstock while offline!', 'error');
      return;
    }

    const timestamp = new Date().toISOString();
    
    setWastePosts(prev => prev.map(p => {
      if (p.id === post.id) {
        return {
          ...p,
          status: 'Reserved',
          collectorId: buyer.id,
          collectorName: buyer.name,
          reservedAt: timestamp,
          history: [
            ...p.history,
            { status: 'Reserved', timestamp, message: `Feedstock reserved by Agency: ${buyer.agencyName}` }
          ]
        };
      }
      return p;
    }));

    // Trigger notification to school
    setNotifications(prev => [
      {
        id: `notif-${Date.now()}`,
        role: 'school',
        targetId: post.schoolId,
        title: 'Feedstock Reserved',
        message: `Compost Agency ${buyer.name} has reserved your organic feedstock. Pickup in progress.`,
        type: 'info',
        read: false,
        timestamp
      },
      ...prev
    ]);

    addToast(`Reserved successfully! You have 30 mins for pickup.`, 'success');
    setShowReserveConfirmationPost(null);
    setActiveTab('active');
  };

  // Start transit route simulation
  const handleStartTransit = (postId) => {
    const timestamp = new Date().toISOString();
    setWastePosts(prev => prev.map(p => {
      if (p.id === postId) {
        return {
          ...p,
          status: 'In Transit',
          history: [
            ...p.history,
            { status: 'In Transit', timestamp, message: `Agency logistics vehicle in transit to school.` }
          ]
        };
      }
      return p;
    }));
    addToast('Transit path simulation active!', 'info');
  };

  // Complete organic feedstock pickup
  const handleCompletePickup = (post) => {
    const timestamp = new Date().toISOString();
    
    setWastePosts(prev => prev.map(p => {
      if (p.id === post.id) {
        return {
          ...p,
          status: 'Collected',
          history: [
            ...p.history,
            { status: 'Collected', timestamp, message: `Feedstock loaded to vehicle. Transferred to Composting site.` }
          ]
        };
      }
      return p;
    }));

    // Log transaction history entry
    const newHistoryEntry = {
      id: `hist-${Date.now()}`,
      schoolId: post.schoolId,
      schoolName: post.schoolName,
      estimatedWeight: post.estimatedWeight,
      date: timestamp,
      collectorId: buyer.id,
      collectorName: buyer.name,
      buyerId: buyer.id,
      status: 'Collected'
    };

    setHistory(prev => [newHistoryEntry, ...prev]);

    // Send notifications to school and buyer
    setNotifications(prev => [
      {
        id: `notif-${Date.now()}-1`,
        role: 'school',
        targetId: post.schoolId,
        title: 'Collection Completed',
        message: `Feedstock successfully collected by ${buyer.agencyName}. ₹${Math.round(post.estimatedWeight * 15)} added to feed credits.`,
        type: 'success',
        read: false,
        timestamp
      },
      {
        id: `notif-${Date.now()}-2`,
        role: 'buyer',
        targetId: buyer.id,
        title: 'Purchase Successful',
        message: `Acquired ${post.estimatedWeight} kg feedstock from ${post.schoolName}.`,
        type: 'success',
        read: false,
        timestamp
      },
      ...prev
    ]);

    triggerConfetti();
    addToast('Feedstock collection successfully completed!', 'success');
  };

  // Custom marker configuration for leaflet mapping
  const createMarkerIcon = (weight, status) => {
    let color = '#2E7D32'; // Green for available feedstock
    if (status === 'Reserved') color = '#F9A825'; // Amber
    if (status === 'In Transit') color = '#1976D2'; // Blue
    
    return L.divIcon({
      className: 'custom-pin',
      html: `<div style="background-color: ${color}; color: white; border-radius: 50%; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 2px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.15); font-size: 0.72rem;">${weight}k</div>`,
      iconSize: [34, 34],
      iconAnchor: [17, 17]
    });
  };

  return (
    <div style={styles.container}>
      
      {/* 1. HOME DASHBOARD VIEW */}
      {activeTab === 'home' && (
        <div style={styles.scrollable}>
          <div style={styles.welcomeHero}>
            <span style={styles.agencyTag}>ORGANIC FEEDSTOCK BUYER</span>
            <h2 style={styles.welcomeTitle}>{buyer.agencyName}</h2>
            <p style={styles.welcomeSub}>Government Registered Compost & Bio-Gas Supplier</p>
          </div>

          {/* Quick Stats Grid */}
          <div style={styles.quickStatsGrid}>
            <div className="card card-interactive" style={styles.statCard}>
              <div>
                <span style={styles.kpiLabel}>Feedstock Acquired</span>
                <span style={styles.kpiNumber}>{stats.totalPurchased} kg</span>
              </div>
              <div style={styles.statBottom}>
                <span style={{ ...styles.kpiSub, color: 'var(--color-primary)' }}>+15% this week</span>
                <svg viewBox="0 0 30 10" style={{ width: '40px', height: '14px' }}>
                  <path d="M 0 9 Q 8 6 15 3 T 30 1" fill="none" stroke="var(--color-primary)" strokeWidth="1.5" />
                </svg>
              </div>
            </div>

            <div className="card card-interactive" style={styles.statCard}>
              <div>
                <span style={styles.kpiLabel}>Compost Credits</span>
                <span style={styles.kpiNumber}>₹{stats.totalSpend}</span>
              </div>
              <div style={styles.statBottom}>
                <span style={{ ...styles.kpiSub, color: 'var(--color-primary)' }}>₹15/kg base rate</span>
                <svg viewBox="0 0 30 10" style={{ width: '40px', height: '14px' }}>
                  <path d="M 0 7 L 10 5 L 20 8 L 30 2" fill="none" stroke="var(--color-primary)" strokeWidth="1.5" />
                </svg>
              </div>
            </div>

            <div className="card card-interactive" style={styles.statCard}>
              <div>
                <span style={styles.kpiLabel}>Acquisition Rating</span>
                <span style={styles.kpiNumber}>{buyer.rating} Grade</span>
              </div>
              <div style={styles.statBottom}>
                <span style={{ ...styles.kpiSub, color: 'var(--color-primary)' }}>Official Partner</span>
                <svg viewBox="0 0 30 10" style={{ width: '40px', height: '14px' }}>
                  <path d="M 0 9 L 10 7 L 20 5 L 30 3" fill="none" stroke="var(--color-primary)" strokeWidth="1.5" />
                </svg>
              </div>
            </div>

            <div className="card card-interactive" style={styles.statCard}>
              <div>
                <span style={styles.kpiLabel}>Active Orders</span>
                <span style={styles.kpiNumber}>{stats.activeOrdersCount} Pending</span>
              </div>
              <div style={styles.statBottom}>
                <span style={{ ...styles.kpiSub, color: 'var(--color-accent)' }}>Acquiring...</span>
                <svg viewBox="0 0 30 10" style={{ width: '40px', height: '14px' }}>
                  <path d="M 0 8 Q 8 2 15 7 T 30 2" fill="none" stroke="var(--color-accent)" strokeWidth="1.5" />
                </svg>
              </div>
            </div>
          </div>

          {/* Map quick check card */}
          <div className="card card-interactive" style={{ marginTop: '16px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} onClick={() => setActiveTab('nearby')}>
            <div>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-text-primary)', margin: '0 0 4px 0' }}>Launch Feedstock Map</h4>
              <p style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)', margin: 0 }}>
                Browse {filteredPosts.length} Coimbatore school kitchens offering organic waste feedstock nearby.
              </p>
            </div>
            <ChevronRight size={20} color="var(--color-primary)" />
          </div>

          {/* Recent Feedstock acquisitions */}
          <div className="card" style={{ marginTop: '16px', marginBottom: '30px' }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '12px' }}>Recent Acquisitions</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {buyerHistory.slice(0, 3).map(hist => (
                <div key={hist.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border)', paddingBottom: '8px', fontSize: '0.72rem' }}>
                  <div>
                    <span style={{ display: 'block', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                      Acquired {hist.estimatedWeight} kg feedstock
                    </span>
                    <span style={{ fontSize: '0.65rem', color: 'var(--color-text-secondary)' }}>
                      Origin: {hist.schoolName}
                    </span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ display: 'block', fontWeight: 700, color: 'var(--color-primary)' }}>₹{Math.round(hist.estimatedWeight * 15)}</span>
                    <span style={{ fontSize: '0.62rem', color: 'var(--color-text-secondary)' }}>
                      {new Date(hist.date).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
              {buyerHistory.length === 0 && (
                <p style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)', textAlign: 'center', padding: '16px' }}>
                  No acquisitions completed yet. Click 'Feedstock Map' to claim available feedstock logs!
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. MAP VIEW TAB (70% Map, 30% Sheet) */}
      {activeTab === 'nearby' && (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', position: 'relative' }}>
          
          {/* Search and Filters Header */}
          <div style={styles.filterBar}>
            <div style={styles.searchRow}>
              <div style={styles.searchContainer}>
                <Search size={16} style={styles.searchIcon} />
                <input 
                  type="text" 
                  placeholder="Search Coimbatore schools..." 
                  className="form-input" 
                  style={styles.searchInput}
                  readOnly
                />
              </div>
              <button 
                onClick={() => setShowFilters(!showFilters)}
                style={{
                  ...styles.filterBtn,
                  backgroundColor: showFilters ? 'rgba(46, 125, 50, 0.08)' : 'transparent',
                  borderColor: showFilters ? 'var(--color-primary)' : 'var(--color-border)',
                  color: showFilters ? 'var(--color-primary)' : 'var(--color-text-secondary)'
                }}
              >
                <Sliders size={16} />
              </button>
              <button 
                onClick={() => setViewMode(v => v === 'map' ? 'list' : 'map')}
                style={styles.viewToggleBtn}
              >
                {viewMode === 'map' ? 'List View' : 'Map View'}
              </button>
            </div>

            {showFilters && (
              <div className="card animate-scale" style={styles.filterPanel}>
                <h5 style={{ margin: '0 0 12px 0', fontSize: '0.8rem', fontWeight: 700 }}>Filter Available Feedstock</h5>
                <div style={styles.grid2}>
                  <div className="form-group">
                    <label style={styles.filterLabel}>Min leftovers (kg)</label>
                    <input 
                      type="number" 
                      placeholder="e.g. 10" 
                      className="form-input" 
                      style={styles.filterInput}
                      value={minWeight}
                      onChange={(e) => setMinWeight(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label style={styles.filterLabel}>Max Distance (km)</label>
                    <input 
                      type="number" 
                      placeholder="e.g. 20" 
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
                {/* Leaflet map taking 70% height if Bottom Sheet is visible */}
                <div style={{ height: selectedPostForBottomSheet ? '68%' : '100%', width: '100%', transition: 'height 300ms ease' }}>
                  <MapContainer 
                    center={[buyer.latitude, buyer.longitude]} 
                    zoom={13} 
                    style={{ height: '100%', width: '100%' }}
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; OpenStreetMap'
                    />
                    
                    {/* Buyer Agency marker pin */}
                    <Marker 
                      position={[buyer.latitude, buyer.longitude]}
                      icon={L.divIcon({
                        className: 'buyer-pin',
                        html: `<div style="background-color: #2E7D32; color: white; width: 14px; height: 14px; border-radius: 50%; border: 2.5px solid white; box-shadow: 0 0 8px rgba(0,0,0,0.3);"></div>`,
                        iconSize: [16, 16]
                      })}
                    />

                    {/* Travel Radius Highlights */}
                    <Circle 
                      center={[buyer.latitude, buyer.longitude]}
                      radius={buyer.radius * 1000}
                      pathOptions={{
                        fillColor: 'var(--color-primary)',
                        fillOpacity: 0.08,
                        color: 'var(--color-primary)',
                        weight: 1.5,
                        dashArray: '4, 4'
                      }}
                    />

                    {/* School pins */}
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

                {/* Swiggy-style slide up Bottom Sheet */}
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
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Scale size={13} /> Available: <strong>{selectedPostForBottomSheet.estimatedWeight} kg</strong></span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><MapPin size={13} /> Proximity: <strong>{getDistanceToPost(selectedPostForBottomSheet)} km</strong></span>
                      </div>
                      <p style={styles.sheetReason}>Surplus Cause: {selectedPostForBottomSheet.reason}</p>
                      <button 
                        onClick={() => {
                          setShowReserveConfirmationPost(selectedPostForBottomSheet);
                          setSelectedPostForBottomSheet(null);
                        }}
                        className="btn-primary animate-ripple" 
                        style={{ ...styles.sheetReserveBtn, minHeight: '44px', borderRadius: '14px', fontSize: '0.85rem' }}
                      >
                        Reserve Feedstock
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              // List View of schools with available feedstock
              <div style={styles.scrollArea}>
                {filteredPosts.map(post => (
                  <div key={post.id} className="card card-interactive" style={{ marginBottom: '16px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>{post.schoolName}</h4>
                      <span className="badge badge-available">Available Feedstock</span>
                    </div>
                    <div style={{ display: 'flex', gap: '16px', fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Scale size={13} /> Feedstock: <strong style={{ color: 'var(--color-text-primary)' }}>{post.estimatedWeight} kg</strong></span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><MapPin size={13} /> Proximity: <strong style={{ color: 'var(--color-text-primary)' }}>{getDistanceToPost(post)} km</strong></span>
                    </div>
                    <button 
                      onClick={() => setShowReserveConfirmationPost(post)}
                      className="btn-primary animate-ripple" 
                      style={{ minHeight: '44px', fontSize: '0.85rem', fontWeight: 700, borderRadius: '14px', marginTop: '4px' }}
                    >
                      Reserve Feedstock
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

      {/* 3. ACTIVE PURCHASES / ORDERS TAB */}
      {activeTab === 'active' && (
        <div style={styles.scrollable}>
          <h3 style={styles.sectionTitle}>Active Feedstock Orders ({activePurchases.length})</h3>

          {activePurchases.map(post => {
            const timeRemaining = timerSeconds[post.id];
            const isWarning = timeRemaining !== undefined && timeRemaining <= 30;

            return (
              <div key={post.id} className="card" style={{ marginBottom: '16px', borderLeft: `4px solid ${post.status === 'In Transit' ? '#1976D2' : 'var(--color-accent)'}` }}>
                <div style={styles.activeHeader}>
                  <div>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: 700 }}>{post.schoolName}</h4>
                    <span style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)' }}>
                      Feedstock: <strong>{post.estimatedWeight} kg</strong> | Dist: {getDistanceToPost(post)} km
                    </span>
                  </div>

                  {(post.status === 'Reserved' || post.status === 'In Transit') && (
                    <div style={{
                      ...styles.timerBadge,
                      backgroundColor: post.status === 'In Transit' ? 'rgba(25, 118, 210, 0.08)' : (isWarning ? 'rgba(211, 47, 47, 0.08)' : 'rgba(249, 168, 37, 0.08)'),
                      color: post.status === 'In Transit' ? '#1976D2' : (isWarning ? 'var(--color-error)' : '#F9A825')
                    }}>
                      <Clock size={12} style={{ marginRight: '4px' }} />
                      <span>{post.status === 'In Transit' ? `Arriving in ${formatTimer(timeRemaining)}` : formatTimer(timeRemaining)}</span>
                    </div>
                  )}
                </div>

                {post.status === 'Reserved' && (
                  <div style={styles.simControls}>
                    <button 
                      onClick={() => handleStartTransit(post.id)}
                      className="btn-primary" 
                      style={{ minHeight: '38px', fontSize: '0.75rem', flex: 1 }}
                    >
                      <Truck size={14} style={{ marginRight: '6px' }} />
                      Simulate Vehicle Dispatch
                    </button>
                  </div>
                )}

                {post.status === 'In Transit' && (
                  <div style={styles.simControls}>
                    <button 
                      onClick={() => handleCompletePickup(post)}
                      className="btn-primary animate-ripple" 
                      style={{ minHeight: '38px', fontSize: '0.75rem', flex: 1, backgroundColor: 'var(--color-success)' }}
                    >
                      <Check size={14} style={{ marginRight: '6px' }} />
                      Confirm Feedstock Loaded
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          {activePurchases.length === 0 && (
            <div style={styles.emptyContainer}>
              <Package size={32} color="var(--color-primary)" />
              <p>No active purchases or transit collections currently running.</p>
              <button 
                onClick={() => setActiveTab('nearby')}
                className="btn-primary"
                style={{ width: 'auto', padding: '0 20px', minHeight: '38px', marginTop: '12px' }}
              >
                Browse Available Feedstock
              </button>
            </div>
          )}
        </div>
      )}

      {/* 4. ALERTS / NOTIFICATIONS TAB */}
      {activeTab === 'notifications' && (
        <div style={styles.scrollable}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={styles.sectionTitle}>Compost Agency Alerts</h3>
            {notifications.some(n => n.role === 'buyer' && n.targetId === buyer?.id && !n.read) && (
              <button 
                onClick={() => markAllAsRead('buyer', buyer?.id)}
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {notifications.filter(n => n.role === 'buyer' && n.targetId === buyer?.id).map(notif => (
              <div 
                key={notif.id} 
                className="card" 
                style={{ 
                  display: 'flex', 
                  flexDirection: 'column',
                  gap: '8px', 
                  padding: '14px', 
                  borderLeft: `4px solid ${notif.read ? 'var(--color-border)' : (notif.type === 'success' ? 'var(--color-success)' : 'var(--color-primary)')}`,
                  opacity: notif.read ? 0.85 : 1,
                  backgroundColor: notif.read ? '#FAFAFA' : '#FFFFFF'
                }}
              >
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '1.25rem', marginTop: '2px' }}>{notif.type === 'success' ? <CheckCircle2 size={20} color="var(--color-success)" /> : <Bell size={20} color="var(--color-primary)" />}</span>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text-primary)', margin: '0 0 2px 0' }}>{notif.title}</h4>
                    <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', margin: '0 0 4px 0', lineHeight: '1.3' }}>{notif.message}</p>
                    <span style={{ fontSize: '0.62rem', color: 'var(--color-text-secondary)' }}>{new Date(notif.timestamp).toLocaleTimeString()}</span>
                  </div>
                </div>
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
            {notifications.filter(n => n.role === 'buyer' && n.targetId === buyer?.id).length === 0 && (
              <div style={styles.emptyContainer}>
                <span>🔔</span>
                <p>No new alerts at this time.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. AGENCY PROFILE VIEW */}
      {activeTab === 'profile' && (
        <div style={styles.scrollable}>
          <div className="card" style={{ padding: '20px', textAlign: 'center' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'rgba(46, 125, 50, 0.08)', display: 'flex', alignItems: 'center', margin: '0 auto 12px auto', justifyContent: 'center' }}>
              <Building size={32} color="var(--color-primary)" />
            </div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0 0 2px 0' }}>{buyer.agencyName}</h3>
            <span className="badge badge-available" style={{ fontSize: '0.68rem', padding: '3px 8px' }}>Verified Government Buyer</span>
            
            <div style={{ marginTop: '20px', borderTop: '1px solid var(--color-border)', paddingTop: '16px', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={styles.profileRow}>
                <span style={styles.profileLabel}>Agency ID:</span>
                <strong style={styles.profileVal}>TN-AGRI-COIM-99</strong>
              </div>
              <div style={styles.profileRow}>
                <span style={styles.profileLabel}>Primary Contact:</span>
                <strong style={styles.profileVal}>{buyer.contact}</strong>
              </div>
              <div style={styles.profileRow}>
                <span style={styles.profileLabel}>Logistics Vehicle:</span>
                <strong style={styles.profileVal}>{buyer.vehicle}</strong>
              </div>
              <div style={styles.profileRow}>
                <span style={styles.profileLabel}>Acquisition Radius:</span>
                <strong style={styles.profileVal}>{buyer.radius} km</strong>
              </div>
              <div style={styles.profileRow}>
                <span style={styles.profileLabel}>Monthly Budget:</span>
                <strong style={styles.profileVal}>{buyer.budget}</strong>
              </div>

              <LicenseViewer />

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
                  cursor: 'pointer',
                  marginTop: '16px'
                }}
              >
                <LogOut size={18} />
                Log Out of Buyer Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION OVERLAY FOR ACQUISITION RESERVATION */}
      {showReserveConfirmationPost && (
        <div style={styles.confirmOverlay}>
          <div className="card animate-scale" style={styles.confirmPanel}>
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '8px' }}>🚜</span>
              <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Confirm Feedstock Reservation</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', margin: '4px 0 0 0' }}>
                You are claiming organic waste feedstock from <strong>{showReserveConfirmationPost.schoolName}</strong>.
              </p>
            </div>
            
            <div style={styles.confirmMetaGrid}>
              <div style={styles.confirmMetaItem}>
                <span>Feedstock Weight</span>
                <strong>{showReserveConfirmationPost.estimatedWeight} kg</strong>
              </div>
              <div style={styles.confirmMetaItem}>
                <span>Feedstock Credit Cost</span>
                <strong style={{ color: 'var(--color-primary)' }}>₹{Math.round(showReserveConfirmationPost.estimatedWeight * 15)}</strong>
              </div>
            </div>

            <div style={styles.confirmFooter}>
              <button 
                onClick={() => setShowReserveConfirmationPost(null)}
                className="btn-secondary"
                style={{ flex: 1, minHeight: '40px' }}
              >
                Cancel
              </button>
              <button 
                onClick={() => handleReserveFeedstock(showReserveConfirmationPost)}
                className="btn-primary"
                style={{ flex: 1, minHeight: '40px' }}
              >
                Confirm Claim
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    position: 'relative'
  },
  scrollable: {
    display: 'flex',
    flexDirection: 'column',
    padding: '16px',
    width: '100%'
  },
  welcomeHero: {
    marginBottom: '16px',
    marginTop: '8px'
  },
  agencyTag: {
    fontSize: '0.62rem',
    fontWeight: 800,
    color: 'var(--color-primary)',
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
    display: 'inline-block',
    marginBottom: '2px'
  },
  welcomeTitle: {
    fontSize: '1.2rem',
    fontWeight: 700,
    color: 'var(--color-text-primary)',
    margin: '0 0 2px 0',
    fontFamily: 'var(--font-display)'
  },
  welcomeSub: {
    fontSize: '0.72rem',
    color: 'var(--color-text-secondary)',
    margin: 0
  },
  quickStatsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '12px',
    marginTop: '8px'
  },
  statCard: {
    padding: '14px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    minHeight: '100px'
  },
  kpiLabel: {
    fontSize: '0.65rem',
    color: 'var(--color-text-secondary)',
    fontWeight: 500,
    display: 'block',
    marginBottom: '4px'
  },
  kpiNumber: {
    fontSize: '1.15rem',
    fontWeight: 800,
    color: 'var(--color-text-primary)',
    fontFamily: 'var(--font-primary)'
  },
  statBottom: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'end',
    marginTop: '6px'
  },
  kpiSub: {
    fontSize: '0.58rem',
    fontWeight: 600
  },
  sectionTitle: {
    fontSize: '0.95rem',
    fontWeight: 700,
    marginBottom: '16px',
    color: 'var(--color-text-primary)'
  },
  filterBar: {
    padding: '12px 16px',
    borderBottom: '1px solid var(--color-border)',
    backgroundColor: '#FFFFFF',
    zIndex: 10
  },
  searchRow: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center'
  },
  searchContainer: {
    flex: 1,
    position: 'relative'
  },
  searchIcon: {
    position: 'absolute',
    left: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: 'var(--color-text-secondary)'
  },
  searchInput: {
    paddingLeft: '34px',
    fontSize: '0.78rem',
    minHeight: '38px',
    backgroundColor: 'var(--color-background)',
    border: '1.5px solid var(--color-border)'
  },
  filterBtn: {
    width: '38px',
    height: '38px',
    borderRadius: '12px',
    border: '1.5px solid var(--color-border)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer'
  },
  viewToggleBtn: {
    minHeight: '38px',
    padding: '0 12px',
    borderRadius: '12px',
    border: '1px solid var(--color-border)',
    fontSize: '0.75rem',
    fontWeight: 600,
    color: 'var(--color-text-primary)',
    cursor: 'pointer',
    backgroundColor: '#FFFFFF'
  },
  filterPanel: {
    marginTop: '12px',
    padding: '12px'
  },
  grid2: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '12px'
  },
  filterLabel: {
    fontSize: '0.65rem',
    color: 'var(--color-text-secondary)',
    fontWeight: 600,
    marginBottom: '4px',
    display: 'block'
  },
  filterInput: {
    fontSize: '0.78rem',
    minHeight: '34px'
  },
  contentArea: {
    flex: 1,
    position: 'relative',
    width: '100%',
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
    marginBottom: '8px'
  },
  sheetSchool: {
    fontSize: '0.9rem',
    fontWeight: 700,
    color: 'var(--color-text-primary)',
    margin: 0
  },
  sheetCloseBtn: {
    background: 'none',
    border: 'none',
    fontSize: '1.4rem',
    color: 'var(--color-text-secondary)',
    cursor: 'pointer',
    padding: 0
  },
  sheetBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    flex: 1
  },
  sheetMeta: {
    display: 'flex',
    gap: '16px',
    fontSize: '0.75rem',
    color: 'var(--color-text-secondary)'
  },
  sheetReason: {
    fontSize: '0.75rem',
    color: 'var(--color-text-primary)',
    margin: '4px 0 0 0'
  },
  sheetReserveBtn: {
    width: '100%',
    marginTop: 'auto'
  },
  scrollArea: {
    padding: '16px',
    overflowY: 'auto',
    height: '100%',
    paddingBottom: '80px'
  },
  emptyContainer: {
    textAlign: 'center',
    padding: '32px 16px',
    color: 'var(--color-text-secondary)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px'
  },
  activeHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: '16px',
    borderBottom: '1px solid var(--color-border)'
  },
  timerBadge: {
    display: 'flex',
    alignItems: 'center',
    padding: '4px 8px',
    borderRadius: '999px',
    fontSize: '0.68rem',
    fontWeight: 700
  },
  simControls: {
    padding: '12px 16px',
    backgroundColor: 'var(--color-background)',
    display: 'flex',
    gap: '12px',
    borderBottomLeftRadius: '18px',
    borderBottomRightRadius: '18px'
  },
  profileRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '0.78rem',
    borderBottom: '1px solid var(--color-border)',
    paddingBottom: '8px'
  },
  profileLabel: {
    color: 'var(--color-text-secondary)'
  },
  profileVal: {
    color: 'var(--color-text-primary)'
  },
  confirmOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 1000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '16px'
  },
  confirmPanel: {
    width: '100%',
    maxWidth: '380px',
    padding: '20px',
    backgroundColor: '#FFFFFF'
  },
  confirmMetaGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '12px',
    backgroundColor: 'var(--color-background)',
    padding: '12px',
    borderRadius: '12px',
    marginBottom: '20px',
    border: '1px solid var(--color-border)'
  },
  confirmMetaItem: {
    display: 'flex',
    flexDirection: 'column',
    fontSize: '0.7rem',
    color: 'var(--color-text-secondary)'
  },
  confirmFooter: {
    display: 'flex',
    gap: '12px'
  },
  nav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '64px',
    backgroundColor: '#FFFFFF',
    borderTop: '1px solid var(--color-border)',
    zIndex: 100,
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
    gap: '4px',
    background: 'none',
    border: 'none',
    minWidth: 'auto',
    minHeight: 'auto',
    cursor: 'pointer',
    transition: 'transform 150ms cubic-bezier(0.4, 0, 0.2, 1)'
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
