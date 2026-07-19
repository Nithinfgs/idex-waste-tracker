import React, { createContext, useState, useEffect } from 'react';
import { INITIAL_SCHOOLS, getComparableSchools } from '../state/schools';
import { INITIAL_WASTE_POSTS, calculateWeight, getDistance, sortWastePosts } from '../state/waste';
import { INITIAL_COLLECTORS, filterWastePosts } from '../state/collectors';
import { INITIAL_HISTORY, createActivityLogEntry } from '../state/history';
import { INITIAL_NOTIFICATIONS, groupNotifications } from '../state/notifications';
import { 
  computeStatistics, 
  generateSchoolInsights,
  generateFoodAuditReport,
  getMenuPerformance,
  getAttendanceWasteCorrelation
} from '../state/dashboard';
import { predictServings } from '../state/prediction';
import { TRANSLATIONS } from '../state/localization';

export const INITIAL_BUYERS = [
  { id: 'buy-1', name: 'Coimbatore Agri-Gov Agency', agencyName: 'Coimbatore Agriculture Department', contact: '0422 230 1122', latitude: 11.0250, longitude: 76.9620, vehicle: 'Agriculture Dept Truck', radius: 25, budget: '₹50,000/mo', rating: 'A+', entryCode: "1", password: "12345" },
  { id: 'buy-2', name: 'GreenSoil Organics Agency', agencyName: 'GreenSoil Fertilizers & Compost Corp', contact: '0422 244 5566', latitude: 10.9850, longitude: 76.9420, vehicle: 'Mini Flatbed Dump Truck', radius: 15, budget: '₹80,000/mo', rating: 'A', entryCode: "2", password: "12345" }
];

const API_URL = import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.hostname}:5001`;

export const StateContext = createContext();

export const StateProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('idex_language') || 'en';
  });

  useEffect(() => {
    localStorage.setItem('idex_language', language);
  }, [language]);

  const t = (key) => {
    const langDict = TRANSLATIONS[language] || TRANSLATIONS['en'];
    return langDict[key] || TRANSLATIONS['en'][key] || key;
  };

  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'info') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  const triggerConfetti = () => {
    const colors = ['#2E7D32', '#81C784', '#F9A825', '#43A047', '#D32F2F'];
    for (let i = 0; i < 40; i++) {
      const particle = document.createElement('div');
      particle.className = 'confetti-particle';
      particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      particle.style.left = `${Math.random() * 100}vw`;
      particle.style.top = `-10px`;
      particle.style.transform = `scale(${Math.random() * 0.6 + 0.4})`;
      
      const speedX = (Math.random() - 0.5) * 8;
      const speedY = Math.random() * 8 + 4;
      let x = parseFloat(particle.style.left) * window.innerWidth / 100;
      let y = -10;
      
      document.body.appendChild(particle);
      
      let start = null;
      const step = (timestamp) => {
        if (!start) start = timestamp;
        const progress = timestamp - start;
        x += speedX;
        y += speedY;
        particle.style.left = `${x}px`;
        particle.style.top = `${y}px`;
        if (progress < 1200) {
          window.requestAnimationFrame(step);
        } else {
          particle.remove();
        }
      };
      window.requestAnimationFrame(step);
    }
  };

  const [syncPasscode, setSyncPasscode] = useState(() => {
    return localStorage.getItem('idex_sync_passcode') || '';
  });

  useEffect(() => {
    localStorage.setItem('idex_sync_passcode', syncPasscode);
  }, [syncPasscode]);

  // Authentication & Settings states
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('idex_dark_mode') === 'true';
  });

  // Simulated Offline Mode
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [saveStatus, setSaveStatus] = useState('Saved'); // 'Saving...' | 'Saved' | 'Offline'
  const [offlineUploadQueue, setOfflineUploadQueue] = useState(() => {
    const local = localStorage.getItem('idex_offline_queue');
    return local ? JSON.parse(local) : [];
  });

  // Core domain data states
  const [schools, setSchools] = useState(() => {
    const local = localStorage.getItem('idex_schools');
    if (local && (local.includes('Bengaluru') || local.includes('Bangalore'))) {
      localStorage.removeItem('idex_schools');
      localStorage.removeItem('idex_waste_posts');
      localStorage.removeItem('idex_collectors');
      localStorage.removeItem('idex_history');
      localStorage.removeItem('idex_notifications');
      return INITIAL_SCHOOLS;
    }
    return local ? JSON.parse(local) : INITIAL_SCHOOLS;
  });

  const [wastePosts, setWastePosts] = useState(() => {
    const local = localStorage.getItem('idex_schools');
    if (local && (local.includes('Bengaluru') || local.includes('Bangalore'))) {
      return INITIAL_WASTE_POSTS;
    }
    const posts = localStorage.getItem('idex_waste_posts');
    return posts ? JSON.parse(posts) : INITIAL_WASTE_POSTS;
  });

  const [producePosts, setProducePosts] = useState(() => {
    const local = localStorage.getItem('idex_produce_posts');
    return local ? JSON.parse(local) : [];
  });

  const [collectors, setCollectors] = useState(() => {
    const local = localStorage.getItem('idex_schools');
    if (local && (local.includes('Bengaluru') || local.includes('Bangalore'))) {
      return INITIAL_COLLECTORS;
    }
    const cols = localStorage.getItem('idex_collectors');
    return cols ? JSON.parse(cols) : INITIAL_COLLECTORS;
  });

  const [history, setHistory] = useState(() => {
    const local = localStorage.getItem('idex_history');
    return local ? JSON.parse(local) : INITIAL_HISTORY;
  });

  const [notifications, setNotifications] = useState(() => {
    const local = localStorage.getItem('idex_notifications');
    return local ? JSON.parse(local) : INITIAL_NOTIFICATIONS;
  });

  // Current active profiles for role simulation
  const [currentRole, setCurrentRole] = useState(() => {
    return localStorage.getItem('idex_current_role') || 'school';
  });
  const [selectedSchoolId, setSelectedSchoolId] = useState(() => {
    return localStorage.getItem('idex_selected_school') || 'sch-1';
  });
  const [selectedCollectorId, setSelectedCollectorId] = useState(() => {
    return localStorage.getItem('idex_selected_collector') || 'col-1';
  });

  const [buyers, setBuyers] = useState(() => {
    const local = localStorage.getItem('idex_buyers');
    return local ? JSON.parse(local) : INITIAL_BUYERS;
  });

  const [selectedBuyerId, setSelectedBuyerId] = useState(() => {
    return localStorage.getItem('idex_selected_buyer') || 'buy-1';
  });

  // Sync settings/auth on changes
  useEffect(() => {
    localStorage.removeItem('idex_logged_in');
  }, []);

  useEffect(() => {
    localStorage.setItem('idex_current_role', currentRole);
  }, [currentRole]);

  useEffect(() => {
    localStorage.setItem('idex_selected_school', selectedSchoolId);
  }, [selectedSchoolId]);

  useEffect(() => {
    localStorage.setItem('idex_selected_collector', selectedCollectorId);
  }, [selectedCollectorId]);

  useEffect(() => {
    localStorage.setItem('idex_selected_buyer', selectedBuyerId);
  }, [selectedBuyerId]);

  useEffect(() => {
    localStorage.setItem('idex_buyers', JSON.stringify(buyers));
  }, [buyers]);

  useEffect(() => {
    localStorage.setItem('idex_dark_mode', isDarkMode);
    if (isDarkMode) {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
  }, [isDarkMode]);

  useEffect(() => {
    localStorage.setItem('idex_offline_queue', JSON.stringify(offlineUploadQueue));
  }, [offlineUploadQueue]);

  // Fetch initial data from server on mount
  useEffect(() => {
    const loadServerData = async () => {
      try {
        const [resSch, resCol, resPosts, resHist, resNotif, resProduce, resBuy] = await Promise.all([
          fetch(`${API_URL}/api/schools`),
          fetch(`${API_URL}/api/collectors`),
          fetch(`${API_URL}/api/waste-posts`),
          fetch(`${API_URL}/api/history`),
          fetch(`${API_URL}/api/notifications`),
          fetch(`${API_URL}/api/produce-posts`),
          fetch(`${API_URL}/api/buyers`).catch(() => null)
        ]);

        if (resSch.ok) {
          const rawSchools = await resSch.json();
          const mappedSchools = rawSchools.map(s => ({
            id: s.id,
            name: s.name,
            district: s.district,
            latitude: parseFloat(s.latitude || 0),
            longitude: parseFloat(s.longitude || 0),
            studentStrength: parseInt(s.student_strength || s.studentStrength || 0),
            drumCapacity: parseFloat(s.drum_capacity || s.drumCapacity || 0),
            contact: s.contact,
            address: s.address,
            menuMon: s.menu_mon || s.menuMon || '',
            menuTue: s.menu_tue || s.menuTue || '',
            menuWed: s.menu_wed || s.menuWed || '',
            menuThu: s.menu_thu || s.menuThu || '',
            menuFri: s.menu_fri || s.menuFri || '',
            entryCode: s.entry_code || s.entryCode || '',
            password: s.password || '12345'
          }));
          setSchools(mappedSchools);
        }
        if (resCol.ok) {
          const rawCollectors = await resCol.json();
          const mappedCollectors = rawCollectors.map(c => ({
            id: c.id,
            name: c.name,
            collectorType: c.collector_type || c.collectorType,
            vehicle: c.vehicle,
            radius: parseFloat(c.radius || 0),
            latitude: parseFloat(c.latitude || 0),
            longitude: parseFloat(c.longitude || 0),
            entryCode: c.entry_code || c.entryCode || '',
            password: c.password || '12345'
          }));
          setCollectors(mappedCollectors);
        }
        if (resPosts.ok) {
          const rawPosts = await resPosts.json();
          const mappedPosts = rawPosts.map(post => ({
            id: post.id,
            schoolId: post.school_id || post.schoolId,
            status: post.status,
            drumLevel: parseFloat(post.drum_level || post.drumLevel || 0),
            estimatedWeight: parseFloat(post.estimated_weight || post.estimatedWeight || 0),
            reason: post.reason,
            collectorId: post.collector_id || post.collectorId,
            reservedAt: post.reserved_at || post.reservedAt,
            createdAt: post.created_at || post.createdAt || new Date().toISOString(),
            history: post.history || [{ status: post.status, timestamp: new Date().toISOString(), message: 'Status updated' }]
          }));
          const uniquePosts = [];
          const seen = new Set();
          mappedPosts.forEach(post => {
            if (!seen.has(post.id)) {
              seen.add(post.id);
              uniquePosts.push(post);
            }
          });
          setWastePosts(uniquePosts);
        }
        if (resHist.ok) {
          const rawHist = await resHist.json();
          const mappedHist = rawHist.map(h => ({
            id: h.id,
            postId: h.post_id || h.postId,
            schoolId: h.school_id || h.schoolId,
            collectorId: h.collector_id || h.collectorId,
            estimatedWeight: parseFloat(h.estimated_weight || h.estimatedWeight || 0),
            date: h.date,
            reason: h.reason
          }));
          setHistory(mappedHist);
        }
        if (resNotif.ok) {
          const rawNotif = await resNotif.json();
          const mappedNotif = rawNotif.map(n => ({
            id: n.id,
            targetId: n.target_id || n.targetId,
            role: n.role,
            title: n.title,
            message: n.message,
            type: n.type,
            read: n.read,
            createdAt: n.created_at || n.createdAt || n.timestamp,
            timestamp: n.created_at || n.createdAt || n.timestamp || new Date().toISOString()
          }));
          setNotifications(mappedNotif);
        }
        if (resProduce && resProduce.ok) {
          const rawProduce = await resProduce.json();
          const mappedProduce = rawProduce.map(p => ({
            id: p.id,
            collectorId: p.collector_id || p.collectorId,
            title: p.title,
            quantity: parseFloat(p.quantity || 0),
            price: parseFloat(p.price || 0),
            deliveryEstimate: p.delivery_estimate || p.deliveryEstimate,
            imageUrl: p.image_url || p.imageUrl,
            description: p.description,
            status: p.status,
            claimedBySchoolId: p.claimed_by_school_id || p.claimedBySchoolId,
            createdAt: p.created_at || p.createdAt
          }));
          setProducePosts(mappedProduce);
        }
        if (resBuy && resBuy.ok) {
          const rawBuyers = await resBuy.json();
          const mappedBuyers = rawBuyers.map(b => ({
            id: b.id,
            name: b.name,
            agencyName: b.agency_name || b.agencyName,
            contact: b.contact,
            latitude: parseFloat(b.latitude || 0),
            longitude: parseFloat(b.longitude || 0),
            vehicle: b.vehicle,
            radius: parseFloat(b.radius || 25.0),
            budget: b.budget,
            rating: b.rating,
            entryCode: b.entry_code || b.entryCode || '',
            password: b.password || '12345'
          }));
          setBuyers(mappedBuyers);
        }
        console.log('Synchronized database data successfully from Express server!');
      } catch (err) {
        console.warn('API server offline. Using local storage fallback:', err.message);
      }
    };
    loadServerData();
    const interval = setInterval(loadServerData, 4000);
    return () => clearInterval(interval);
  }, []);

  // Save standard domain data
  useEffect(() => {
    localStorage.setItem('idex_schools', JSON.stringify(schools));
  }, [schools]);

  useEffect(() => {
    localStorage.setItem('idex_waste_posts', JSON.stringify(wastePosts));
  }, [wastePosts]);

  useEffect(() => {
    localStorage.setItem('idex_collectors', JSON.stringify(collectors));
  }, [collectors]);

  useEffect(() => {
    localStorage.setItem('idex_history', JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    localStorage.setItem('idex_notifications', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem('idex_produce_posts', JSON.stringify(producePosts));
  }, [producePosts]);

  // Autosave status indicator hook
  useEffect(() => {
    if (isOfflineMode) {
      setSaveStatus('Offline');
      return;
    }
    setSaveStatus('Saving...');
    const timer = setTimeout(() => {
      setSaveStatus('Saved');
    }, 800);
    return () => clearTimeout(timer);
  }, [schools, wastePosts, collectors, history, notifications, producePosts, isOfflineMode]);

  // Network Status Event Listeners (Auto-save/sync online state transition)
  useEffect(() => {
    const handleOnline = () => {
      setIsOfflineMode(false);
      syncOfflineQueue();
      addToast('Network restored. Syncing database...', 'success');
    };
    const handleOffline = () => {
      setIsOfflineMode(true);
      addToast('Network offline. Saving to offline storage.', 'warning');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [offlineUploadQueue, schools, collectors]);

  // Automatic background upload sync when state changes
  useEffect(() => {
    if (syncPasscode.trim()) {
      const timer = setTimeout(() => {
        uploadStateToCloud(syncPasscode);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [schools, wastePosts, collectors, history, notifications, syncPasscode]);

  // Automatic background download sync on app load/mount
  useEffect(() => {
    if (syncPasscode.trim()) {
      downloadStateFromCloud(syncPasscode);
    }
  }, []);

  // Enforce reservation and transit timeout checks periodically (every 5 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      setWastePosts(prevPosts => {
        const TIMEOUT_MS = 2 * 60 * 1000; // 2 minutes demo limit
        let updated = false;
        
        const checked = prevPosts.map(post => {
          // 1. Reservation Countdown
          if (post.status === 'Reserved' && post.reservedAt) {
            const elapsed = Date.now() - new Date(post.reservedAt).getTime();
            if (elapsed > TIMEOUT_MS) {
              updated = true;
              
              addSystemNotification(
                'school',
                post.schoolId,
                'Reservation Expired',
                `Collector failed to pick up your waste in time. Reverted to Available.`,
                'warning'
              );

              addSystemNotification(
                'collector',
                post.collectorId,
                'Reservation Timeout',
                `Your reservation for ${post.schoolName} expired.`,
                'error'
              );

              return {
                ...post,
                status: 'Available',
                collectorId: null,
                reservedAt: null,
                history: [
                  ...post.history,
                  { status: 'Available', timestamp: new Date().toISOString(), message: 'Reservation timed out (2m demo expiry)' }
                ]
              };
            }
          }

          // 2. Transit Countdown (Collector arrives at site)
          if (post.status === 'In Transit' && post.transitStartedAt) {
            const elapsed = Date.now() - new Date(post.transitStartedAt).getTime();
            if (elapsed > TIMEOUT_MS) {
              updated = true;
              
              addSystemNotification(
                'school',
                post.schoolId,
                'Collector Arrived',
                `Collector has arrived at your kitchen. Please confirm the waste weight to complete pickup.`,
                'warning'
              );

              addSystemNotification(
                'collector',
                post.collectorId,
                'Arrived at Site',
                `You have arrived at ${post.schoolName}. Awaiting school confirmation.`,
                'success'
              );

              return {
                ...post,
                status: 'Awaiting School Confirmation',
                history: [
                  ...post.history,
                  { status: 'Awaiting School Confirmation', timestamp: new Date().toISOString(), message: 'Transit completed (arrived at site).' }
                ]
              };
            }
          }

          return post;
        });

        return updated ? checked : prevPosts;
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [schools, collectors]);

  // Helper to add system notification
  const addSystemNotification = (role, targetId, title, message, type) => {
    const newNotif = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      role,
      targetId,
      title,
      message,
      type,
      timestamp: new Date().toISOString(),
      read: false
    };
    setNotifications(prev => [newNotif, ...prev]);

    fetch(`${API_URL}/api/notifications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: newNotif.id,
        targetId: newNotif.targetId,
        role: newNotif.role,
        title: newNotif.title,
        message: newNotif.message,
        type: newNotif.type,
        createdAt: newNotif.timestamp
      })
    }).catch(err => console.warn('Failed to sync notification to backend:', err.message));
  };

  // --- ACTIONS ---

  // School uploads waste
  const uploadWaste = (schoolId, drumLevelFraction, reason, customWeight = null) => {
    const school = schools.find(s => s.id === schoolId);
    if (!school) return;

    // Enforce data validation: weight cannot exceed 150kg
    const estimatedWeight = customWeight !== null 
      ? parseFloat(customWeight)
      : calculateWeight(school.drumCapacity, parseFloat(drumLevelFraction));

    if (estimatedWeight > 150) {
      alert(`Data Validation Error: Waste entered is ${estimatedWeight} kg. "Please check entered value." (Limit 150 kg per post)`);
      addToast('Please check entered value.', 'error');
      return false;
    }

    const timestamp = new Date().toISOString();
    
    const newPost = {
      id: `post-${Date.now()}`,
      schoolId,
      schoolName: school.name,
      drumLevel: parseFloat(drumLevelFraction),
      estimatedWeight,
      reason,
      status: 'Available',
      createdAt: timestamp,
      collectorId: null,
      reservedAt: null,
      history: [
        { status: 'Available', timestamp, message: `Waste uploaded: ${Math.round(drumLevelFraction * 100)}% level (${estimatedWeight} kg)` }
      ]
    };

    // Handle offline queue
    if (isOfflineMode) {
      setOfflineUploadQueue(prev => [...prev, newPost]);
      addSystemNotification(
        'school',
        schoolId,
        'Upload Saved Locally',
        `Internet offline. Log of ${estimatedWeight} kg saved locally and will auto-sync when connection returns.`,
        'warning'
      );
      addToast('Saved locally (Offline Mode)', 'warning');
      return true;
    }

    // Normal online upload: Overwrite existing active post
    const activeIndex = wastePosts.findIndex(p => p.schoolId === schoolId && p.status !== 'Collected');
    if (activeIndex >= 0) {
      setWastePosts(prev => {
        const clone = [...prev];
        clone[activeIndex] = newPost;
        return clone;
      });
    } else {
      setWastePosts(prev => [newPost, ...prev]);
    }

    // Push to backend server
    fetch(`${API_URL}/api/waste-posts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: newPost.id,
        school_id: newPost.schoolId,
        drumLevel: newPost.drumLevel,
        estimatedWeight: newPost.estimatedWeight,
        reason: newPost.reason,
        createdAt: newPost.createdAt
      })
    }).catch(err => console.warn('Failed to sync new waste post to backend:', err.message));

    // Notify nearby collectors and send simulated SMS alerts
    collectors.forEach(col => {
      const dist = getDistance(school.latitude, school.longitude, col.latitude, col.longitude);
      if (dist <= col.radius) {
        addSystemNotification(
          'collector',
          col.id,
          'New Waste Nearby',
          `${school.name} posted ${estimatedWeight} kg of organic waste (${dist} km away).`,
          'info'
        );
        setTimeout(() => {
          addToast(`[SMS Alert] Sent to Farmer ${col.name} (${col.phone || '+91 98765 43220'}): ${school.name} has posted ${estimatedWeight} kg of waste nearby!`, 'success');
        }, 1500);
      }
    });

    // Notify nearby compost buyer agencies
    buyers.forEach(buy => {
      const dist = getDistance(school.latitude, school.longitude, buy.latitude, buy.longitude);
      if (dist <= buy.radius) {
        addSystemNotification(
          'buyer',
          buy.id,
          'New Feedstock Available',
          `${school.name} has ${estimatedWeight} kg of organic feedstock available (${dist} km away).`,
          'info'
        );
        setTimeout(() => {
          addToast(`[Notification] Sent to Buyer Agency ${buy.name}: Feedstock available at ${school.name}!`, 'info');
        }, 2000);
      }
    });

    addSystemNotification(
      'school',
      schoolId,
      'Waste Posted Successfully',
      `Your waste post of ${estimatedWeight} kg is now available.`,
      'success'
    );
    addToast('Waste posted successfully!', 'success');
    return true;
  };

  // Sync offline queue to database
  const syncOfflineQueue = () => {
    if (offlineUploadQueue.length === 0) return;
    
    setWastePosts(prev => {
      let current = [...prev];
      offlineUploadQueue.forEach(newPost => {
        const activeIndex = current.findIndex(p => p.schoolId === newPost.schoolId && p.status !== 'Collected');
        if (activeIndex >= 0) {
          current[activeIndex] = newPost;
        } else {
          current = [newPost, ...current];
        }

        // Notify collectors and send simulated SMS alerts
        const school = schools.find(s => s.id === newPost.schoolId);
        if (school) {
          collectors.forEach(col => {
            const dist = getDistance(school.latitude, school.longitude, col.latitude, col.longitude);
            if (dist <= col.radius) {
              addSystemNotification(
                'collector',
                col.id,
                'New Waste Nearby',
                `${school.name} posted ${newPost.estimatedWeight} kg of organic waste (${dist} km away).`,
                'info'
              );
              setTimeout(() => {
                addToast(`[SMS Alert] Sent to Farmer ${col.name} (${col.phone || '+91 98765 43220'}): ${school.name} has posted ${newPost.estimatedWeight} kg of waste nearby!`, 'success');
              }, 1500);
            }
          });
        }
      });
      return current;
    });

    // Notify schools
    offlineUploadQueue.forEach(post => {
      addSystemNotification(
        'school',
        post.schoolId,
        'Offline Uploads Synced',
        `Auto-synced waste log of ${post.estimatedWeight} kg successfully.`,
        'success'
      );
    });

    setOfflineUploadQueue([]);
  };

  // Trigger sync automatically when offline mode is toggled off
  useEffect(() => {
    if (!isOfflineMode && offlineUploadQueue.length > 0) {
      syncOfflineQueue();
    }
  }, [isOfflineMode]);

  // Collector reserves waste
  const reserveWaste = (postId, collectorId) => {
    const collector = collectors.find(c => c.id === collectorId);
    if (!collector) return;

    const timestamp = new Date().toISOString();
    fetch(`${API_URL}/api/waste-posts/${postId}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'Reserved', collectorId, reservedAt: timestamp })
    }).catch(err => console.warn('Failed to sync reservation status to backend:', err.message));

    setWastePosts(prev => prev.map(post => {
      if (post.id === postId) {
        addSystemNotification(
          'school',
          post.schoolId,
          'Waste Reserved',
          `Collector ${collector.name} has reserved your waste. Expected pickup in 30 minutes.`,
          'success'
        );

        addToast('Waste Reserved successfully!', 'success');

        return {
          ...post,
          status: 'Reserved',
          collectorId,
          reservedAt: timestamp,
          history: [...post.history, { status: 'Reserved', timestamp, message: `Reserved by ${collector.name}` }]
        };
      }
      return post;
    }));
  };

  // Collector starts routing / in-transit
  const startTransit = (postId) => {
    const post = wastePosts.find(p => p.id === postId);
    if (!post) return;
    const collector = collectors.find(c => c.id === post.collectorId);

    fetch(`${API_URL}/api/waste-posts/${postId}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'In Transit' })
    }).catch(err => console.warn('Failed to sync transit status to backend:', err.message));

    setWastePosts(prev => prev.map(p => {
      if (p.id === postId) {
        const timestamp = new Date().toISOString();
        addSystemNotification(
          'school',
          p.schoolId,
          'Collector On The Way',
          `${collector?.name || 'Collector'} has marked the pickup in transit.`,
          'info'
        );

        addToast('Transit started successfully!', 'info');

        return {
          ...p,
          status: 'In Transit',
          history: [...p.history, { status: 'In Transit', timestamp, message: `Collector is on the way (In Transit).` }]
        };
      }
      return p;
    }));
  };

  // Collector marks pickup completed (awaits school confirmation)
  const completePickup = (postId) => {
    const post = wastePosts.find(p => p.id === postId);
    if (!post) return;
    const collector = collectors.find(c => c.id === post.collectorId);

    fetch(`${API_URL}/api/waste-posts/${postId}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'Awaiting School Confirmation' })
    }).catch(err => console.warn('Failed to sync completePickup to backend:', err.message));

    setWastePosts(prev => prev.map(p => {
      if (p.id === postId) {
        const timestamp = new Date().toISOString();
        addSystemNotification(
          'school',
          p.schoolId,
          'Confirm Waste Collection',
          `Collector ${collector?.name || ''} has marked pickup completed. Confirm collection.`,
          'warning'
        );

        addToast('Pickup completed! Awaiting school confirmation.', 'success');

        return {
          ...p,
          status: 'Awaiting School Confirmation',
          history: [...p.history, { status: 'Awaiting School Confirmation', timestamp, message: 'Pickup completed by collector.' }]
        };
      }
      return p;
    }));
  };

  // School confirms collection -> moves post to history list
  const confirmCollection = (postId) => {
    const post = wastePosts.find(p => p.id === postId);
    if (!post) return;

    const collector = collectors.find(c => c.id === post.collectorId);
    const timestamp = new Date().toISOString();

    const finalizedPost = {
      ...post,
      status: 'Collected',
      date: timestamp,
      activityLog: [
        ...post.history.map(h => ({ timestamp: h.timestamp, message: h.message })),
        { timestamp, message: 'Collection confirmed and finalized by School.' }
      ]
    };

    const historyRecord = {
      id: `h-${Date.now()}`,
      postId,
      schoolId: post.schoolId,
      collectorId: post.collectorId,
      estimatedWeight: post.estimatedWeight,
      date: timestamp,
      reason: post.reason
    };

    Promise.all([
      fetch(`${API_URL}/api/waste-posts/${postId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Collected' })
      }),
      fetch(`${API_URL}/api/history`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(historyRecord)
      })
    ]).catch(err => console.warn('Failed to sync collection confirmation to backend:', err.message));

    setWastePosts(prev => prev.filter(p => p.id !== postId));
    setHistory(prev => [finalizedPost, ...prev]);

    // Update collector stats
    setCollectors(prev => prev.map(c => {
      if (c.id === post.collectorId) {
        return {
          ...c,
          totalPickups: c.totalPickups + 1
        };
      }
      return c;
    }));

    addSystemNotification(
      'collector',
      post.collectorId,
      'Collection Confirmed',
      `${post.schoolName} confirmed your pickup of ${post.estimatedWeight} kg.`,
      'success'
    );

    addSystemNotification(
      'school',
      post.schoolId,
      'Collection Completed',
      `Thank you for helping divert ${post.estimatedWeight} kg!`,
      'success'
    );

    addToast('Collection finalized!', 'success');
    triggerConfetti();
  };

  // Cancel reservation
  const cancelReservation = (postId) => {
    const post = wastePosts.find(p => p.id === postId);
    if (!post) return;
    const collector = collectors.find(c => c.id === post.collectorId);

    fetch(`${API_URL}/api/waste-posts/${postId}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'Available', collectorId: null, reservedAt: null })
    }).catch(err => console.warn('Failed to sync cancellation to backend:', err.message));

    setWastePosts(prev => prev.map(p => {
      if (p.id === postId) {
        const timestamp = new Date().toISOString();
        
        addSystemNotification(
          'school',
          p.schoolId,
          'Reservation Canceled',
          `Collector ${collector?.name || ''} canceled their reservation.`,
          'error'
        );

        addToast('Reservation canceled.', 'error');

        return {
          ...p,
          status: 'Available',
          collectorId: null,
          reservedAt: null,
          history: [...p.history, { status: 'Available', timestamp, message: `Reservation canceled by collector.` }]
        };
      }
      return p;
    }));
  };

  // Onboard / Update school configurations
  const updateSchoolOnboarding = (schoolId, studentStrength, drumCapacity, contact, address) => {
    setSchools(prev => prev.map(s => {
      if (s.id === schoolId) {
        return {
          ...s,
          studentStrength: parseInt(studentStrength, 10),
          drumCapacity: parseFloat(drumCapacity),
          contact,
          address
        };
      }
      return s;
    }));
  };

  // Onboard / Update collector configs
  const updateCollectorOnboarding = (collectorId, collectorType, radius, vehicle) => {
    setCollectors(prev => prev.map(c => {
      if (c.id === collectorId) {
        return {
          ...c,
          collectorType,
          radius: parseFloat(radius),
          vehicle
        };
      }
      return c;
    }));
  };

  // Add new school profile (Admin only)
  const addNewSchoolProfile = (schoolData) => {
    const newSchool = {
      id: `sch-${Date.now()}`,
      name: schoolData.name,
      district: schoolData.district || 'Coimbatore District',
      latitude: parseFloat(schoolData.latitude || 11.0180),
      longitude: parseFloat(schoolData.longitude || 76.9680),
      studentStrength: parseInt(schoolData.studentStrength || 400, 10),
      drumCapacity: parseFloat(schoolData.drumCapacity || 40),
      contact: schoolData.contact || '',
      address: schoolData.address || '',
      entryCode: schoolData.entryCode || `sch-${Math.floor(10 + Math.random() * 90)}`,
      password: schoolData.password || '12345'
    };

    fetch(`${API_URL}/api/schools`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newSchool)
    }).catch(err => console.warn('Failed to sync new school profile to backend:', err.message));

    setSchools(prev => [...prev, newSchool]);
    addToast(`School profile ${newSchool.name} added successfully!`, 'success');
  };

  // Add new collector profile (Admin only)
  const addNewCollectorProfile = (collectorData) => {
    const newCollector = {
      id: `col-${Date.now()}`,
      name: collectorData.name,
      phone: collectorData.phone || '',
      collectorType: collectorData.collectorType || 'Farmer',
      vehicle: collectorData.vehicle || 'Tractor',
      radius: parseFloat(collectorData.radius || 15.0),
      latitude: parseFloat(collectorData.latitude || 11.0210),
      longitude: parseFloat(collectorData.longitude || 76.9600),
      entryCode: collectorData.entryCode || `col-${Math.floor(10 + Math.random() * 90)}`,
      password: collectorData.password || '12345',
      totalPickups: 0,
      rating: 5.0
    };

    fetch(`${API_URL}/api/collectors`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newCollector)
    }).catch(err => console.warn('Failed to sync new collector profile to backend:', err.message));

    setCollectors(prev => [...prev, newCollector]);
    addToast(`Collector profile ${newCollector.name} added successfully!`, 'success');
  };

  // Add new buyer profile (Admin only)
  const addNewBuyerProfile = (buyerData) => {
    const newBuyer = {
      id: `buy-${Date.now()}`,
      name: buyerData.name,
      agencyName: buyerData.agencyName || buyerData.name,
      contact: buyerData.contact || '',
      latitude: parseFloat(buyerData.latitude || 11.0250),
      longitude: parseFloat(buyerData.longitude || 76.9620),
      vehicle: buyerData.vehicle || 'Truck',
      radius: parseFloat(buyerData.radius || 25.0),
      budget: buyerData.budget || '₹50,000/mo',
      rating: buyerData.rating || 'A+',
      entryCode: buyerData.entryCode || `buy-${Math.floor(10 + Math.random() * 90)}`,
      password: buyerData.password || '12345'
    };

    fetch(`${API_URL}/api/buyers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newBuyer)
    }).catch(err => console.warn('Failed to sync new buyer profile to backend:', err.message));

    setBuyers(prev => [...prev, newBuyer]);
    addToast(`Buyer profile ${newBuyer.name} added successfully!`, 'success');
  };

  // Farmer lists excess produce
  const uploadProducePost = (collectorId, title, quantity, price, deliveryEstimate, imageUrl, description) => {
    const collector = collectors.find(c => c.id === collectorId);
    if (!collector) return false;

    const timestamp = new Date().toISOString();
    const newPost = {
      id: `prod-${Date.now()}`,
      collectorId,
      title,
      quantity: parseFloat(quantity),
      price: parseFloat(price),
      deliveryEstimate,
      imageUrl,
      description,
      status: 'Available',
      claimedBySchoolId: null,
      createdAt: timestamp
    };

    // Save to server
    fetch(`${API_URL}/api/produce-posts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newPost)
    }).catch(err => console.warn('Failed to sync produce post to backend:', err.message));

    // Update local state
    setProducePosts(prev => [newPost, ...prev]);

    // Send notifications to ALL schools!
    schools.forEach(sch => {
      addSystemNotification(
        'school',
        sch.id,
        'Excess Produce Available',
        `Farmer ${collector.name} listed excess produce: ${quantity} kg of ${title} (Price: ₹${price}, Estimate: ${deliveryEstimate})!`,
        'success'
      );
    });

    addToast('Produce post uploaded successfully!', 'success');
    return true;
  };

  // School claims farmer's excess produce
  const claimProducePost = (postId, schoolId) => {
    const school = schools.find(s => s.id === schoolId);
    if (!school) return false;

    // Save to server
    fetch(`${API_URL}/api/produce-posts/${postId}/claim`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ schoolId })
    }).catch(err => console.warn('Failed to claim produce post on backend:', err.message));

    // Update local state
    setProducePosts(prev => prev.map(post => {
      if (post.id === postId) {
        // Send notification to the listing collector!
        addSystemNotification(
          'collector',
          post.collectorId,
          'Produce Claimed!',
          `${school.name} has claimed your excess ${post.title}!`,
          'success'
        );

        return {
          ...post,
          status: 'Claimed',
          claimedBySchoolId: schoolId
        };
      }
      return post;
    }));

    addToast('Produce claimed successfully!', 'success');
    triggerConfetti();
    return true;
  };

  const forceSimulateTimeout = (postId) => {
    setWastePosts(prev => prev.map(post => {
      if (post.id === postId && post.status === 'Reserved') {
        const collector = collectors.find(c => c.id === post.collectorId);
        
        addSystemNotification(
          'school',
          post.schoolId,
          'Reservation Expired (Simulated)',
          `Collector ${collector?.name || ''} failed to pick up your waste. Reverted to Available.`,
          'warning'
        );

        return {
          ...post,
          status: 'Available',
          collectorId: null,
          reservedAt: null,
          history: [
            ...post.history,
            { status: 'Available', timestamp: new Date().toISOString(), message: 'Reservation reverted (forced simulation)' }
          ]
        };
      }
      return post;
    }));
  };

  const uploadStateToCloud = async (passcode) => {
    if (!passcode.trim()) return false;
    try {
      const payload = {
        schools,
        wastePosts,
        collectors,
        history,
        notifications
      };
      const res = await fetch(`https://kvdb.io/8xV4kFf6c3L2jK5m9PqZ/state_${passcode.toLowerCase().trim()}`, {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: { 'Content-Type': 'application/json' }
      });
      return res.ok;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const downloadStateFromCloud = async (passcode) => {
    if (!passcode.trim()) return false;
    try {
      const res = await fetch(`https://kvdb.io/8xV4kFf6c3L2jK5m9PqZ/state_${passcode.toLowerCase().trim()}`);
      if (res.ok) {
        const data = await res.json();
        if (data.schools && data.wastePosts) {
          setSchools(data.schools);
          setWastePosts(data.wastePosts);
          setCollectors(data.collectors || collectors);
          setHistory(data.history || history);
          setNotifications(data.notifications || notifications);
          return true;
        }
      }
      return false;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  return (
    <StateContext.Provider value={{
      language,
      setLanguage,
      t,
      schools,
      wastePosts,
      producePosts,
      collectors,
      history,
      notifications,
      
      isLoggedIn,
      setIsLoggedIn,
      isDarkMode,
      setIsDarkMode,
      isOfflineMode,
      setIsOfflineMode,
      saveStatus,
      offlineUploadQueue,
      syncPasscode,
      setSyncPasscode,
      uploadStateToCloud,
      downloadStateFromCloud,
      
      currentRole,
      setCurrentRole,
      selectedSchoolId,
      setSelectedSchoolId,
      selectedCollectorId,
      setSelectedCollectorId,
      buyers,
      setBuyers,
      selectedBuyerId,
      setSelectedBuyerId,

      uploadWaste,
      reserveWaste,
      startTransit,
      completePickup,
      confirmCollection,
      cancelReservation,
      updateSchoolOnboarding,
      updateCollectorOnboarding,
      addNewSchoolProfile,
      addNewCollectorProfile,
      addNewBuyerProfile,
      uploadProducePost,
      claimProducePost,
      forceSimulateTimeout,
      addToast,
      triggerConfetti,
      
      getComparableSchools: (schoolId) => {
        const school = schools.find(s => s.id === schoolId);
        return getComparableSchools(school, schools);
      },
      getFilteredWastePosts: (filters, collectorId) => {
        const collector = collectors.find(c => c.id === collectorId);
        const lat = collector ? collector.latitude : null;
        const lon = collector ? collector.longitude : null;
        const filtered = filterWastePosts(wastePosts, filters, lat, lon, schools);
        return sortWastePosts(filtered, lat, lon, schools);
      },
      getSchoolStatistics: (schoolId) => {
        return computeStatistics(wastePosts, history, schoolId);
      },
      getDistrictStatistics: () => {
        return computeStatistics(wastePosts, history, null);
      },
      getSchoolInsights: (schoolId) => {
        const schoolHistory = history.filter(h => h.schoolId === schoolId);
        return generateSchoolInsights(schoolHistory);
      },
      getFoodAuditReport: (schoolId) => {
        const school = schools.find(s => s.id === schoolId);
        return generateFoodAuditReport(history, school);
      },
      getMenuPerformance: (schoolId) => {
        const school = schools.find(s => s.id === schoolId);
        return getMenuPerformance(history, school);
      },
      getAttendanceWasteCorrelation: (schoolId) => {
        const school = schools.find(s => s.id === schoolId);
        return getAttendanceWasteCorrelation(history, school);
      },
      getMealPrediction: (schoolId, attendance, menuName, dayOfWeek) => {
        const schoolHistory = history.filter(h => h.schoolId === schoolId);
        const lastMonthHistory = schoolHistory.filter(h => {
          const elapsed = Date.now() - new Date(h.date).getTime();
          return elapsed <= 30 * 24 * 3600 * 1000;
        });
        const avgWaste = lastMonthHistory.length > 0
          ? lastMonthHistory.reduce((sum, h) => sum + h.estimatedWeight, 0) / lastMonthHistory.length
          : 8.5;
        return predictServings(attendance, menuName, dayOfWeek, avgWaste);
      }
    }}>
      {children}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast toast-${t.type}`}>
            <span>{t.type === 'success' ? '🌱' : t.type === 'error' ? '❌' : 'ℹ️'}</span>
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </StateContext.Provider>
  );
};
