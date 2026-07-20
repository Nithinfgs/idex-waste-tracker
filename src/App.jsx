import React, { useState, useEffect, useContext, useRef } from 'react';
import { StateProvider, StateContext } from './context/StateContext';
import Navbar from './components/Navbar';
import SchoolPortal from './pages/SchoolPortal';
import CollectorPortal from './pages/CollectorPortal';
import AdminPortal from './pages/AdminPortal';
import LoginPortal from './pages/LoginPortal';
import BuyerPortal from './pages/BuyerPortal';
import { App as CapApp } from '@capacitor/app';

function MainApp() {
  const { currentRole, isLoggedIn, setIsLoggedIn } = useContext(StateContext);
  
  // Tab routing
  const [activeTab, setActiveTab] = useState('home');
  const historyRef = useRef(['home']);

  // Custom tab change wrapper to record navigation history
  const handleTabChange = (newTab) => {
    if (newTab !== activeTab) {
      historyRef.current.push(newTab);
      setActiveTab(newTab);
      try {
        window.history.pushState({ tab: newTab }, '', `#${newTab}`);
      } catch (e) {
        // Ignore iframe state restriction if any
      }
    }
  };

  // Listen for hardware back button on Android devices & web back button
  useEffect(() => {
    if (!isLoggedIn) return;

    const defaultHomeTab = currentRole === 'admin' ? 'dashboard' : 'home';

    const handleBackNavigation = () => {
      if (historyRef.current.length > 1) {
        historyRef.current.pop();
        const prevTab = historyRef.current[historyRef.current.length - 1];
        setActiveTab(prevTab || defaultHomeTab);
      } else if (activeTab !== defaultHomeTab) {
        historyRef.current = [defaultHomeTab];
        setActiveTab(defaultHomeTab);
      } else {
        // Minimize app if already on home screen
        CapApp.minimizeApp().catch(() => {});
      }
    };

    // Capacitor Native Android Back Button
    const backListener = CapApp.addListener('backButton', () => {
      handleBackNavigation();
    });

    // Web popstate back navigation
    const handlePopState = (e) => {
      if (e.state && e.state.tab) {
        setActiveTab(e.state.tab);
      } else {
        handleBackNavigation();
      }
    };
    window.addEventListener('popstate', handlePopState);

    return () => {
      backListener.then(h => h.remove()).catch(() => {});
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isLoggedIn, activeTab, currentRole]);

  if (!isLoggedIn) {
    return <LoginPortal onLoginSuccess={(role) => {
      setIsLoggedIn(true);
      const homeTab = role === 'admin' ? 'dashboard' : 'home';
      historyRef.current = [homeTab];
      setActiveTab(homeTab);
    }} />;
  }

  return (
    <>
      {/* Dynamic View Router */}
      <main style={styles.main}>
        {currentRole === 'school' && (
          <SchoolPortal activeTab={activeTab} setActiveTab={handleTabChange} />
        )}
        {currentRole === 'collector' && (
          <CollectorPortal activeTab={activeTab} setActiveTab={handleTabChange} />
        )}
        {currentRole === 'buyer' && (
          <BuyerPortal activeTab={activeTab} setActiveTab={handleTabChange} />
        )}
        {currentRole === 'admin' && (
          <AdminPortal activeTab={activeTab} setActiveTab={handleTabChange} />
        )}
      </main>

      {/* Global Navigation & Role Switcher */}
      <Navbar activeTab={activeTab} setActiveTab={handleTabChange} />
    </>
  );
}

export default function App() {
  return (
    <StateProvider>
      <MainApp />
    </StateProvider>
  );
}

const styles = {
  main: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
  }
};
