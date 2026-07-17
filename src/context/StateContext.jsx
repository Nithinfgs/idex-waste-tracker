import React, { createContext, useState, useEffect } from 'react';
import { INITIAL_SCHOOLS, getComparableSchools } from '../state/schools';
import { INITIAL_WASTE_POSTS, calculateWeight, getDistance, sortWastePosts } from '../state/waste';
import { INITIAL_COLLECTORS, filterWastePosts } from '../state/collectors';
import { INITIAL_HISTORY, createActivityLogEntry } from '../state/history';
import { INITIAL_NOTIFICATIONS, groupNotifications } from '../state/notifications';
import { computeStatistics, generateSchoolInsights } from '../state/dashboard';
import { predictServings } from '../state/prediction';

export const StateContext = createContext();

export const StateProvider = ({ children }) => {
  // Authentication & Settings states
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem('idex_logged_in') === 'true';
  });

  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('idex_dark_mode') === 'true';
  });

  // Simulated Offline Mode
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [offlineUploadQueue, setOfflineUploadQueue] = useState(() => {
    const local = localStorage.getItem('idex_offline_queue');
    return local ? JSON.parse(local) : [];
  });

  // Core domain data states
  const [schools, setSchools] = useState(() => {
    const local = localStorage.getItem('idex_schools');
    return local ? JSON.parse(local) : INITIAL_SCHOOLS;
  });

  const [wastePosts, setWastePosts] = useState(() => {
    const local = localStorage.getItem('idex_waste_posts');
    return local ? JSON.parse(local) : INITIAL_WASTE_POSTS;
  });

  const [collectors, setCollectors] = useState(() => {
    const local = localStorage.getItem('idex_collectors');
    return local ? JSON.parse(local) : INITIAL_COLLECTORS;
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

  // Sync settings/auth on changes
  useEffect(() => {
    localStorage.setItem('idex_logged_in', isLoggedIn);
  }, [isLoggedIn]);

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

  // Enforce reservation timeout checks periodically (every 5 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      setWastePosts(prevPosts => {
        const TIMEOUT_MS = 2 * 60 * 1000; // 2 minutes demo limit
        let updated = false;
        
        const checked = prevPosts.map(post => {
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

    // Notify nearby collectors
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
      }
    });

    addSystemNotification(
      'school',
      schoolId,
      'Waste Posted Successfully',
      `Your waste post of ${estimatedWeight} kg is now available.`,
      'success'
    );
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

        // Notify collectors
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

    setWastePosts(prev => prev.map(post => {
      if (post.id === postId) {
        const timestamp = new Date().toISOString();
        
        addSystemNotification(
          'school',
          post.schoolId,
          'Waste Reserved',
          `Collector ${collector.name} has reserved your waste. Expected pickup in 30 minutes.`,
          'success'
        );

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
  };

  // Cancel reservation
  const cancelReservation = (postId) => {
    const post = wastePosts.find(p => p.id === postId);
    if (!post) return;
    const collector = collectors.find(c => c.id === post.collectorId);

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

  return (
    <StateContext.Provider value={{
      schools,
      wastePosts,
      collectors,
      history,
      notifications,
      
      isLoggedIn,
      setIsLoggedIn,
      isDarkMode,
      setIsDarkMode,
      isOfflineMode,
      setIsOfflineMode,
      offlineUploadQueue,
      
      currentRole,
      setCurrentRole,
      selectedSchoolId,
      setSelectedSchoolId,
      selectedCollectorId,
      setSelectedCollectorId,

      uploadWaste,
      reserveWaste,
      startTransit,
      completePickup,
      confirmCollection,
      cancelReservation,
      updateSchoolOnboarding,
      updateCollectorOnboarding,
      forceSimulateTimeout,
      
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
    </StateContext.Provider>
  );
};
