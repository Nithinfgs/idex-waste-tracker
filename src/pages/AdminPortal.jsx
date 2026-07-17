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
  Star
} from 'lucide-react';

export default function AdminPortal({ activeTab, setActiveTab }) {
  const {
    schools,
    wastePosts,
    history,
    notifications,
    collectors,
    getDistrictStatistics
  } = useContext(StateContext);

  const [mapMode, setMapMode] = useState('heat'); // 'heat' | 'list'
  const stats = getDistrictStatistics();

  // Sort schools for rank (simply mock score/performance or calculate based on waste history)
  const rankedSchools = [...schools].map(school => {
    const schoolHistory = history.filter(h => h.schoolId === school.id);
    const totalDiverted = schoolHistory.reduce((sum, h) => sum + h.estimatedWeight, 0);
    // Score starts at 80, gets +1 for each diverted kg, capped at 100
    const score = Math.min(100, Math.round(80 + totalDiverted * 0.2));
    return {
      ...school,
      score,
      totalDiverted: parseFloat(totalDiverted.toFixed(1))
    };
  }).sort((a, b) => b.score - a.score);

  // Heat map colors depending on waste volume (more waste -> darker green)
  const getCircleColor = (weight) => {
    if (weight > 40) return '#1b5e20'; // Darkest Green
    if (weight > 25) return '#2E7D32'; // Medium Dark Green
    if (weight > 15) return '#4CAF50'; // Green
    return '#81C784'; // Light Green
  };

  return (
    <div style={styles.container}>
      {/* 1. DISTRICT ANALYTICS TAB */}
      {activeTab === 'dashboard' && (
        <div style={styles.scrollable}>
          <h3 style={styles.sectionTitle}>District Analytics Overview</h3>

          {/* Stats Grid */}
          <div style={styles.grid2}>
            <div className="card" style={styles.statBox}>
              <div style={styles.statHeader}>
                <Building2 size={16} color="var(--color-primary)" />
                <span style={styles.statLabel}>Schools Onboarded</span>
              </div>
              <span style={styles.statNumber}>{schools.length}</span>
              <span style={styles.statSub}>100% active coverage</span>
            </div>

            <div className="card" style={styles.statBox}>
              <div style={styles.statHeader}>
                <Trash2 size={16} color="var(--color-error)" />
                <span style={styles.statLabel}>Total Waste Generated</span>
              </div>
              <span style={styles.statNumber}>{stats.totalGenerated} kg</span>
              <span style={styles.statSub}>Includes active postings</span>
            </div>
          </div>

          <div style={styles.grid2}>
            <div className="card" style={styles.statBox}>
              <div style={styles.statHeader}>
                <TrendingUp size={16} color="var(--color-primary)" />
                <span style={styles.statLabel}>Diverted from Landfill</span>
              </div>
              <span style={styles.statNumber}>{stats.totalCollected} kg</span>
              <span style={styles.statSub}>{stats.successRate}% collection rate</span>
            </div>

            <div className="card" style={styles.statBox}>
              <div style={styles.statHeader}>
                <Coins size={16} color="var(--color-accent)" />
                <span style={styles.statLabel}>District Savings</span>
              </div>
              <span style={styles.statNumber}>₹{stats.moneySaved}</span>
              <span style={styles.statSub}>Equivalent feed value</span>
            </div>
          </div>

          {/* Map view mode header toggle */}
          <div style={styles.mapToggleHeader}>
            <h4 style={{ fontSize: '0.9rem' }}>District Organic Waste Map</h4>
            <div style={styles.btnToggleGroup}>
              <button 
                onClick={() => setMapMode('heat')} 
                style={{
                  ...styles.toggleBtn,
                  backgroundColor: mapMode === 'heat' ? 'var(--color-primary)' : '#FFFFFF',
                  color: mapMode === 'heat' ? '#FFFFFF' : 'var(--color-text-primary)'
                }}
              >
                Heat Map
              </button>
              <button 
                onClick={() => setMapMode('list')} 
                style={{
                  ...styles.toggleBtn,
                  backgroundColor: mapMode === 'list' ? 'var(--color-primary)' : '#FFFFFF',
                  color: mapMode === 'list' ? '#FFFFFF' : 'var(--color-text-primary)'
                }}
              >
                Active Listings
              </button>
            </div>
          </div>

          {/* Interactive Heat Map */}
          {mapMode === 'heat' ? (
            <div className="card" style={styles.mapCard}>
              <div style={styles.mapWrapper}>
                <MapContainer 
                  center={[12.9716, 77.5946]} 
                  zoom={13} 
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  />
                  {/* Heat map circles showing school waste volume */}
                  {schools.map(school => {
                    const activePost = wastePosts.find(p => p.schoolId === school.id);
                    const weight = activePost ? activePost.estimatedWeight : 5; // Default minor dot for zero waste
                    
                    return (
                      <Circle
                        key={school.id}
                        center={[school.latitude, school.longitude]}
                        pathOptions={{
                          color: getCircleColor(weight),
                          fillColor: getCircleColor(weight),
                          fillOpacity: 0.6,
                          weight: 1
                        }}
                        radius={50 + weight * 5} // Radius scales with waste weight
                      />
                    );
                  })}
                </MapContainer>
              </div>
              <div style={styles.heatLegend}>
                <span style={styles.legendTitle}>Waste Volume Indicator:</span>
                <div style={styles.legendScale}>
                  <div style={styles.scaleItem}><span style={{ ...styles.scaleColor, backgroundColor: '#81C784' }}></span> Low</div>
                  <div style={styles.scaleItem}><span style={{ ...styles.scaleColor, backgroundColor: '#4CAF50' }}></span> Medium</div>
                  <div style={styles.scaleItem}><span style={{ ...styles.scaleColor, backgroundColor: '#2E7D32' }}></span> Heavy</div>
                  <div style={styles.scaleItem}><span style={{ ...styles.scaleColor, backgroundColor: '#1b5e20' }}></span> Urgent</div>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
              {wastePosts.map(post => {
                return (
                  <div key={post.id} className="card" style={styles.listingRow}>
                    <div>
                      <h5 style={{ fontSize: '0.85rem' }}>{post.schoolName}</h5>
                      <span style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)' }}>
                        Status: <strong style={{ color: 'var(--color-primary)' }}>{post.status}</strong> | Reason: {post.reason}
                      </span>
                    </div>
                    <span style={{ fontSize: '0.9rem', fontWeight: 700 }}>{post.estimatedWeight} kg</span>
                  </div>
                );
              })}
              {wastePosts.length === 0 && (
                <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--color-text-secondary)', padding: '16px' }}>
                  No active waste postings in the district today.
                </p>
              )}
            </div>
          )}

          {/* Export section (Future expansion) */}
          <div className="card" style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h5 style={{ fontSize: '0.85rem' }}>Monthly District Report</h5>
              <p style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)' }}>Export consolidated charts and audits.</p>
            </div>
            <button 
              onClick={() => alert('PDF report export is scheduled as a future municipal enhancement.')}
              className="btn-secondary" 
              style={styles.exportBtn}
            >
              <Download size={14} style={{ marginRight: '6px' }} />
              Export PDF
            </button>
          </div>
        </div>
      )}

      {/* 2. ONBOARDED SCHOOLS DATABASE TAB */}
      {activeTab === 'schools' && (
        <div style={styles.scrollable}>
          <h3 style={styles.sectionTitle}>Onboarded Schools Registry ({schools.length})</h3>
          <p style={styles.subText}>List of active mid-day meal programs monitored under district jurisdiction.</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {schools.map(sch => {
              const schoolHistory = history.filter(h => h.schoolId === sch.id);
              const totalDiverted = schoolHistory.reduce((sum, h) => sum + h.estimatedWeight, 0);
              const currentActive = wastePosts.find(p => p.schoolId === sch.id);

              return (
                <div key={sch.id} className="card" style={{ padding: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <h4 style={{ fontSize: '0.9rem', lineHeight: '1.2', flex: 1 }}>{sch.name}</h4>
                    <span className="badge badge-collected" style={{ fontSize: '0.65rem' }}>
                      {currentActive ? `ACTIVE LOG: ${currentActive.estimatedWeight}kg` : 'NO POSTINGS'}
                    </span>
                  </div>
                  <div style={styles.registryDetails}>
                    <div style={styles.registryRow}><span style={styles.registryLabel}>Strength:</span> <span>{sch.studentStrength} students</span></div>
                    <div style={styles.registryRow}><span style={styles.registryLabel}>Drum Capacity:</span> <span>{sch.drumCapacity} kg</span></div>
                    <div style={styles.registryRow}><span style={styles.registryLabel}>Total Diverted:</span> <span><strong>{totalDiverted.toFixed(1)} kg</strong></span></div>
                    <div style={styles.registryRow}><span style={styles.registryLabel}>Address:</span> <span style={{ color: 'var(--color-text-secondary)' }}>{sch.address}</span></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. REGISTERED COLLECTORS DATABASE TAB (New Tab!) */}
      {activeTab === 'active' && (
        <div style={styles.scrollable}>
          <h3 style={styles.sectionTitle}>Registered Collectors ({collectors.length})</h3>
          <p style={styles.subText}>Active logistics partners recycling organic feedstock mass.</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {collectors.map(col => {
              const colHistory = history.filter(h => h.collectorId === col.id);
              const colDiverted = colHistory.reduce((sum, h) => sum + h.estimatedWeight, 0);
              const activeReservation = wastePosts.find(p => p.collectorId === col.id);

              return (
                <div key={col.id} className="card" style={{ padding: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <h4 style={{ fontSize: '0.9rem' }}>{col.name}</h4>
                    <span className="badge badge-reserved" style={{ fontSize: '0.65rem', backgroundColor: activeReservation ? 'rgba(33, 150, 243, 0.15)' : 'rgba(97, 97, 97, 0.15)', color: activeReservation ? '#2196F3' : '#616161' }}>
                      {activeReservation ? 'ON ROUTE' : 'IDLE / AVAIL'}
                    </span>
                  </div>

                  <div style={styles.registryDetails}>
                    <div style={styles.registryRow}><span style={styles.registryLabel}>Category:</span> <span>{col.collectorType}</span></div>
                    <div style={styles.registryRow}><span style={styles.registryLabel}>Vehicle:</span> <span>{col.vehicle}</span></div>
                    <div style={styles.registryRow}><span style={styles.registryLabel}>Radius Limit:</span> <span>{col.radius} km</span></div>
                    <div style={styles.registryRow}><span style={styles.registryLabel}>Diverted Weight:</span> <span><strong>{colDiverted.toFixed(1)} kg</strong></span></div>
                    
                    <div style={{ ...styles.registryRow, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={styles.registryLabel}>User Rating:</span> 
                      <div style={{ display: 'flex', alignItems: 'center', gap: '2px', color: 'var(--color-accent)' }}>
                        <Star size={12} fill="var(--color-accent)" /> 
                        <span>{col.rating}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. ALERTS / NOTIFICATIONS TAB */}
      {activeTab === 'notifications' && (
        <div style={styles.scrollable}>
          <h3 style={styles.sectionTitle}>System Alerts Log</h3>
          {notifications.map(notif => (
            <div key={notif.id} className="card" style={{ ...styles.notifCard, borderLeft: '4px solid #1A237E' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
                  Target: {notif.role} ({notif.targetId})
                </span>
                <span style={{ fontSize: '0.6rem', color: 'var(--color-text-secondary)' }}>
                  {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{notif.title}</span>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{notif.message}</p>
            </div>
          ))}
          {notifications.length === 0 && (
            <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--color-text-secondary)', padding: '24px' }}>
              No system alerts logged.
            </p>
          )}
        </div>
      )}

      {/* 5. SETTINGS / PROFILE TAB */}
      {activeTab === 'profile' && (
        <div style={styles.scrollable}>
          <h3 style={styles.sectionTitle}>District Configurations</h3>
          
          <div className="card">
            <h4 style={{ fontSize: '0.9rem', marginBottom: '12px' }}>Government Settings</h4>
            
            <div className="form-group">
              <label className="form-label">Active District Jurisdiction</label>
              <input type="text" className="form-input" value="North District Municipal" disabled style={{ backgroundColor: 'var(--color-background)' }} />
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

            <div style={{ marginTop: '16px', display: 'flex', gap: '8px', padding: '10px', backgroundColor: '#e8eaf6', borderRadius: '8px', border: '1px solid #c5cae9' }}>
              <AlertCircle size={18} color="#1a237e" style={{ flexShrink: 0 }} />
              <p style={{ fontSize: '0.7rem', color: '#1a237e', lineHeight: '1.3' }}>
                Official municipal control board setup. Settings lock under authorization.
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
    paddingBottom: 'var(--spacing-lg)'
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
  statBox: {
    flex: 1,
    padding: 'var(--spacing-md)',
    display: 'flex',
    flexDirection: 'column'
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
    fontSize: '1.35rem',
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
    border: 'none'
  },
  mapCard: {
    padding: '10px',
    border: '1px solid var(--color-border)',
    boxShadow: 'var(--shadow-subtle)',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  mapWrapper: {
    height: '200px',
    width: '100%',
    borderRadius: '12px',
    overflow: 'hidden'
  },
  heatLegend: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '4px var(--spacing-xs)',
    borderTop: '1px solid var(--color-border)',
    paddingTop: '8px'
  },
  legendTitle: {
    fontSize: '0.65rem',
    fontWeight: 600,
    color: 'var(--color-text-secondary)'
  },
  legendScale: {
    display: 'flex',
    gap: '12px'
  },
  scaleItem: {
    fontSize: '0.65rem',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontWeight: 500,
    color: 'var(--color-text-secondary)'
  },
  scaleColor: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    display: 'inline-block'
  },
  listingRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px'
  },
  exportBtn: {
    minHeight: '36px',
    padding: '0 var(--spacing-md)',
    fontSize: '0.75rem',
    minWidth: 'auto'
  },
  subText: {
    fontSize: '0.75rem',
    color: 'var(--color-text-secondary)',
    marginBottom: '16px'
  },
  notifCard: {
    marginBottom: '8px',
    padding: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '2px'
  },
  registryDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    marginTop: '6px',
    borderTop: '1px dashed var(--color-border)',
    paddingTop: '6px'
  },
  registryRow: {
    display: 'flex',
    fontSize: '0.75rem',
    justifyContent: 'space-between'
  },
  registryLabel: {
    color: 'var(--color-text-secondary)',
    fontWeight: 500
  }
};
