import React from 'react';
import { Settings as SettingsIcon, Play, Layers, Calendar, MessageCircle, Edit3, Clock } from 'lucide-react';

const TAB_ICONS = {
  focus:     Play,
  matrix:    Layers,
  scheduler: Calendar,
  coach:     MessageCircle,
  drafts:    Edit3,
};

export default function Navigation({ activeTab, setActiveTab, openSettings, tabs = [] }) {
  return (
    <header className="top-nav">
      <div className="nav-container">
        {/* Brand Logo & Wordmark */}
        <div
          className="nav-brand"
          onClick={() => setActiveTab('focus')}
          role="button"
          tabIndex={0}
          onKeyDown={e => e.key === 'Enter' && setActiveTab('focus')}
          style={{ cursor: 'pointer' }}
        >
          <div className="brand-logo">
            <Clock size={18} strokeWidth={2.5} />
          </div>
          <span className="brand-wordmark">The Last-Minute Life Saver</span>
        </div>

        {/* Tab Selection Navigation — driven by TABS from App.jsx */}
        <nav className="nav-menu" aria-label="Main navigation">
          {tabs.map((tab) => {
            const Icon = TAB_ICONS[tab.id] || Play;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                data-testid={`tab-${tab.id}`}
                className={`nav-link${isActive ? ' active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
                aria-current={isActive ? 'page' : undefined}
                title={tab.name}
              >
                <Icon size={15} className="nav-link-icon" aria-hidden="true" />
                <span>{tab.name}</span>
              </button>
            );
          })}
        </nav>

        {/* Settings trigger — opens modal, does NOT change active tab */}
        <div className="nav-actions">
          <button
            className="btn btn-outline btn-settings"
            data-testid="btn-open-settings"
            onClick={openSettings}
            aria-label="Open Settings"
          >
            <SettingsIcon size={15} aria-hidden="true" />
            <span>Settings</span>
          </button>
        </div>
      </div>
    </header>
  );
}
