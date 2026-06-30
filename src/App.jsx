import React, { useState, useEffect, Suspense, lazy } from 'react';
import { AppProvider, useApp } from './AppContext';
import Navigation from './components/Navigation';
import Settings from './components/Settings';

const FocusedWorkspace = lazy(() => import('./components/FocusedWorkspace'));
const EisenhowerMatrix = lazy(() => import('./components/EisenhowerMatrix'));
const SmartScheduler   = lazy(() => import('./components/SmartScheduler'));
const AICoach          = lazy(() => import('./components/AICoach'));
const AutoDraftingDesk = lazy(() => import('./components/AutoDraftingDesk'));

const TABS = [
  {
    id: 'focus',
    name: 'Focus',
    subtitle: 'Lock in. One task, one session — no distractions.',
    Component: FocusedWorkspace,
  },
  {
    id: 'matrix',
    name: 'Eisenhower',
    subtitle: 'Sort the urgent from the important. Do the right thing first.',
    Component: EisenhowerMatrix,
  },
  {
    id: 'scheduler',
    name: 'Scheduler',
    subtitle: 'Map your week. High-focus work in your peak hours.',
    Component: SmartScheduler,
  },
  {
    id: 'coach',
    name: 'AI Coach',
    subtitle: 'Your personal strategist. Talk through what\'s blocking you.',
    Component: AICoach,
  },
  {
    id: 'drafts',
    name: 'Drafts',
    subtitle: 'Skip the blank page. AI writes the first draft instantly.',
    Component: AutoDraftingDesk,
  },
];

function AppShell() {
  const { state } = useApp();
  const [activeTab, setActiveTab] = useState('focus');
  const [showSettings, setShowSettings] = useState(false);
  const { settings } = state;

  // Sync reduce-motion preference to html element
  useEffect(() => {
    if (settings.reduceMotion) {
      document.documentElement.classList.add('reduce-motion');
    } else {
      document.documentElement.classList.remove('reduce-motion');
    }
  }, [settings.reduceMotion]);

  const currentTab = TABS.find(t => t.id === activeTab) || TABS[0];
  const ActiveComponent = currentTab.Component;

  return (
    <div className={`app-container${settings.reduceMotion ? ' reduce-motion' : ''}`}>
      {/* Atmospheric gradient orbs */}
      <div className="gradient-orbs-container" aria-hidden="true">
        <div className="orb orb-mint" />
        <div className="orb orb-peach" />
        <div className="orb orb-lavender" />
        <div className="orb orb-sky" />
      </div>

      <Navigation
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        openSettings={() => setShowSettings(true)}
        tabs={TABS}
      />

      <main
        style={{
          maxWidth: 1280,
          margin: '0 auto',
          padding: '32px 24px 80px',
          position: 'relative',
          zIndex: 10,
        }}
      >
        {/* Page header with tab title + subtitle descriptor */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: '2rem', marginBottom: 4 }}>{currentTab.name}</h1>
          <p className="page-subtitle">{currentTab.subtitle}</p>
          <div style={{ width: 40, height: 2, background: 'var(--color-primary)', borderRadius: 2, marginTop: 12 }} />
        </div>

        <Suspense fallback={
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
            <div style={{
              width: 32, height: 32,
              border: '3px solid var(--color-hairline)',
              borderTopColor: 'var(--color-primary)',
              borderRadius: '50%',
              animation: 'spin 0.7s linear infinite',
            }} />
          </div>
        }>
          <ActiveComponent />
        </Suspense>
      </main>

      {showSettings && <Settings onClose={() => setShowSettings(false)} />}
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}
