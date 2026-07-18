import React, { useContext, useState } from 'react';
import { StateContext } from '../context/StateContext';
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
  Award
} from 'lucide-react';

export default function AdminPortal({ activeTab, setActiveTab }) {
  const {
    schools,
    wastePosts,
    history,
    notifications,
    collectors,
    getDistrictStatistics,
    t
  } = useContext(StateContext);

  const [mapMode, setMapMode] = useState('heat'); // 'heat' | 'list'
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

  const adminNotifications = notifications.filter(n => n.role === 'admin');

  return (
    <div style={styles.container}>
      {/* 1. DISTRICT ANALYTICS TAB */}
      {activeTab === 'dashboard' && (
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
              <div style={styles.mapWrapper}>
                <MapContainer 
                  center={[11.0168, 76.9558]} 
                  zoom={12} 
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

      {/* 2. ONBOARDED SCHOOLS DATABASE TAB */}
      {activeTab === 'schools' && (
        <div style={styles.scrollable}>
          <h3 style={styles.sectionTitle}>Onboarded Schools Directory ({schools.length})</h3>
          <p style={styles.subText}>List of active mid-day meal kitchens monitored under district jurisdiction.</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {schools.map(sch => {
              const schoolHistory = history.filter(h => h.schoolId === sch.id);
              const totalDiverted = schoolHistory.reduce((sum, h) => sum + h.estimatedWeight, 0);
              const currentActive = wastePosts.find(p => p.schoolId === sch.id);

              return (
                <div key={sch.id} className="card" style={{ padding: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                    <h4 style={{ fontSize: '0.85rem', fontWeight: 700 }}>{sch.name}</h4>
                    <span className={`badge ${currentActive ? 'badge-available' : 'badge-collected'}`} style={{ fontSize: '0.6rem' }}>
                      {currentActive ? 'Active Post' : 'No Active Logs'}
                    </span>
                  </div>
                  <div style={styles.registryDetails}>
                    <div>Enrollment: <strong>{sch.studentStrength} pupils</strong></div>
                    <div>Drum Limit: <strong>{sch.drumCapacity} kg</strong></div>
                    <div>Diverted Weight: <strong style={{ color: 'var(--color-primary)' }}>{totalDiverted.toFixed(1)} kg</strong></div>
                    <div style={{ gridColumn: 'span 2', fontSize: '0.7rem', color: 'var(--color-text-secondary)' }}>
                      📍 {sch.address}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. REGISTERED COLLECTORS DATABASE TAB (Active Tab on Bottom Nav) */}
      {activeTab === 'active' && (
        <div style={styles.scrollable}>
          <h3 style={styles.sectionTitle}>Collectors Directory ({collectors.length})</h3>
          <p style={styles.subText}>Active logistics recycling partners diverting organic feedstock.</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {collectors.map(col => {
              const colHistory = history.filter(h => h.collectorId === col.id);
              const colDiverted = colHistory.reduce((sum, h) => sum + h.estimatedWeight, 0);
              const activeReservation = wastePosts.find(p => p.collectorId === col.id);

              return (
                <div key={col.id} className="card" style={{ padding: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                    <h4 style={{ fontSize: '0.85rem', fontWeight: 700 }}>{col.name}</h4>
                    <span className="badge badge-collected" style={{ fontSize: '0.6rem', backgroundColor: activeReservation ? 'rgba(249,168,37,0.1)' : 'rgba(67,160,71,0.1)', color: activeReservation ? 'var(--color-accent)' : 'var(--color-success)' }}>
                      {activeReservation ? 'On Route' : 'Idle'}
                    </span>
                  </div>
                  <div style={styles.registryDetails}>
                    <div>Category: <strong>{col.collectorType}</strong></div>
                    <div>Vehicle: <strong>{col.vehicle}</strong></div>
                    <div>Operating Radius: <strong>{col.radius} km</strong></div>
                    <div>Diverted Weight: <strong style={{ color: 'var(--color-primary)' }}>{colDiverted.toFixed(1)} kg</strong></div>
                    <div style={{ gridColumn: 'span 2', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem' }}>
                      <span>User Rating:</span>
                      <strong style={{ color: 'var(--color-accent)', display: 'flex', alignItems: 'center', gap: '2px' }}>
                        ★ {col.rating}
                      </strong>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. NOTIFICATIONS TAB */}
      {activeTab === 'notifications' && (
        <div style={styles.scrollable}>
          <h3 style={styles.sectionTitle}>District Notifications Log</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {adminNotifications.map(notif => (
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
              <input type="text" className="form-input" value="Coimbatore District Municipal Corp" disabled style={{ backgroundColor: 'var(--color-background)' }} />
            </div>

            <div className="form-group">
              <label className="form-label">Min Posting Threshold (kg)</label>
              <input type="number" className="form-input" value={25} disabled style={{ backgroundColor: 'var(--color-background)' }} />
              <span style={{ fontSize: '0.65rem', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                Schools only post when waste exceeds this threshold (prevents inefficient collections).
              </span>
            </div>

            <div className="form-group">
              <label className="form-label">System Reservation Timeout (min)</label>
              <input type="number" className="form-input" value={30} disabled style={{ backgroundColor: 'var(--color-background)' }} />
            </div>

            <div style={{ marginTop: '16px', display: 'flex', gap: '8px', padding: '10px', backgroundColor: 'rgba(46, 125, 50, 0.05)', borderRadius: '8px', border: '1px solid rgba(46, 125, 50, 0.1)' }}>
              <AlertCircle size={18} color="var(--color-primary)" style={{ flexShrink: 0 }} />
              <p style={{ fontSize: '0.7rem', color: 'var(--color-primary)', lineHeight: '1.3' }}>
                Official municipal control board setup. Configuration options lock under authorized staff credentials.
              </p>
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
    overflowY: 'hidden'
  },
  scrollable: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    overflowY: 'auto',
    paddingBottom: '32px'
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
