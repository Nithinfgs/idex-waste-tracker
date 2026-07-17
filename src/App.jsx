import React, { useState, useContext } from 'react';
import { StateProvider, StateContext } from './context/StateContext';
import Navbar from './components/Navbar';
import SchoolPortal from './pages/SchoolPortal';
import CollectorPortal from './pages/CollectorPortal';
import AdminPortal from './pages/AdminPortal';
import LoginPortal from './pages/LoginPortal';

function MainApp() {
  const { currentRole, isLoggedIn, setIsLoggedIn } = useContext(StateContext);
  
  // Tab routing
  const [activeTab, setActiveTab] = useState('home');

  if (!isLoggedIn) {
    return <LoginPortal onLoginSuccess={() => {
      setIsLoggedIn(true);
      setActiveTab('home');
    }} />;
  }

  return (
    <>
      {/* Dynamic View Router */}
      <main style={styles.main}>
        {currentRole === 'school' && (
          <SchoolPortal activeTab={activeTab} setActiveTab={setActiveTab} />
        )}
        {currentRole === 'collector' && (
          <CollectorPortal activeTab={activeTab} setActiveTab={setActiveTab} />
        )}
        {currentRole === 'admin' && (
          <AdminPortal activeTab={activeTab} setActiveTab={setActiveTab} />
        )}
      </main>

      {/* Global Navigation & Role Switcher */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
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
