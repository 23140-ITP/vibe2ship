import React, { useState, useEffect } from 'react';
import { useApp } from '../AppContext';
import { X, Shield, Volume2, Bell, RefreshCw, Activity } from 'lucide-react';

export default function Settings({ onClose }) {
  const { state, update, exportData, importData } = useApp();
  const { settings } = state;
  const [apiKey, setApiKey] = useState(settings.geminiApiKey || '');
  const [apiStatus, setApiStatus] = useState('');
  const [apiTesting, setApiTesting] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState('');

  // Sync api key from state (e.g. after import)
  useEffect(() => {
    setApiKey(settings.geminiApiKey || '');
  }, [settings.geminiApiKey]);

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose?.(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleTestApiKey = async () => {
    const trimmed = apiKey.trim();
    if (!trimmed) {
      setApiStatus('Enter an API key first.');
      return;
    }
    setApiTesting(true);
    setApiStatus('Testing…');
    try {
      const model = settings.selectedModel || 'gemini-2.5-flash';
      const resp = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${trimmed}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: 'Say "ok"' }] }] }),
        }
      );
      if (resp.ok) {
        update('settings.geminiApiKey', trimmed);
        setApiStatus('✓ Connection Successful!');
      } else {
        const data = await resp.json().catch(() => ({}));
        setApiStatus(`✗ Failed: ${data.error?.message || resp.statusText}`);
      }
    } catch (err) {
      setApiStatus('✗ Network error — check connection.');
    } finally {
      setApiTesting(false);
    }
  };

  const handleTestVoice = () => {
    const accent = (settings.voiceAccent || 'us').toUpperCase();
    setVoiceStatus(`Testing voice in ${accent} accent…`);
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance('Voice test. Ready to focus!');
      utterance.lang = settings.voiceAccent === 'uk' ? 'en-GB' : settings.voiceAccent === 'in' ? 'en-IN' : 'en-US';
      utterance.rate = settings.voiceSpeed || 1;
      window.speechSynthesis.speak(utterance);
    }
    setTimeout(() => setVoiceStatus(''), 3000);
  };

  const handleReduceMotionChange = (e) => {
    const checked = e.target.checked;
    update('settings.reduceMotion', checked);
  };

  const handleImportFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      await importData(file);
      alert('Backup imported successfully!');
    } catch (err) {
      alert('Import failed: ' + err.message);
    }
    e.target.value = '';
  };

  const isSuccess = apiStatus.startsWith('✓');
  const isError = apiStatus.startsWith('✗');

  return (
    /* Modal overlay — clicking outside closes */
    <div
      data-testid="settings-modal"
      role="dialog"
      aria-modal="true"
      aria-label="Settings"
      onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(12, 10, 9, 0.45)',
        backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div
        style={{
          background: 'var(--color-surface-card)',
          borderRadius: 20,
          border: '1px solid var(--color-hairline)',
          boxShadow: '0 24px 80px rgba(0,0,0,0.18)',
          width: '100%', maxWidth: 640,
          maxHeight: '90vh', overflowY: 'auto',
          display: 'flex', flexDirection: 'column',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '24px 28px 0',
          borderBottom: '1px solid var(--color-hairline)',
          paddingBottom: 16, marginBottom: 0,
        }}>
          <h2 style={{ fontSize: '1.5rem', margin: 0 }}>Settings</h2>
          <button
            data-testid="btn-close-settings"
            onClick={onClose}
            className="btn btn-outline"
            aria-label="Close settings"
            style={{ width: 36, height: 36, padding: 0, borderRadius: '50%' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* API Key */}
          <div className="card">
            <span className="badge" style={{ marginBottom: 12, display: 'inline-block' }}>
              <Shield size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />
              AI Configuration
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 14, fontWeight: 500 }}>
                  <span>Gemini API Key</span>
                  <input
                    type="password"
                    data-testid="input-api-key"
                    className="input-text"
                    style={{ width: '100%' }}
                    placeholder="AIza..."
                    value={apiKey}
                    onChange={e => setApiKey(e.target.value)}
                    onBlur={e => update('settings.geminiApiKey', e.target.value.trim())}
                  />
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 14, fontWeight: 500 }}>
                  <span>Gemini Model Version</span>
                  <select
                    className="input-text"
                    value={settings.selectedModel || 'gemini-2.5-flash'}
                    onChange={e => update('settings.selectedModel', e.target.value)}
                    style={{ cursor: 'pointer' }}
                  >
                    <option value="gemini-2.5-flash">Gemini 2.5 Flash (Latest)</option>
                    <option value="gemini-1.5-flash-latest">Gemini 1.5 Flash</option>
                    <option value="gemini-2.0-flash-exp">Gemini 2.0 Flash</option>
                  </select>
                </label>
              </div>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <button
                  data-testid="btn-test-api"
                  className="btn btn-primary"
                  onClick={handleTestApiKey}
                  disabled={apiTesting}
                >
                  {apiTesting ? 'Testing…' : 'Test Connection'}
                </button>
                {apiStatus && (
                  <span
                    data-testid="api-status"
                    style={{
                      fontSize: 13, fontWeight: 600,
                      color: isSuccess ? 'var(--color-success)' : isError ? 'var(--color-error)' : 'var(--color-muted)',
                    }}
                  >
                    {apiStatus}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Voice & Accent */}
          <div className="card">
            <span className="badge" style={{ marginBottom: 12, display: 'inline-block' }}>
              <Volume2 size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />
              Voice Settings
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 14, fontWeight: 500 }}>
                <span>Accent</span>
                <select
                  data-testid="select-voice"
                  className="input-text"
                  value={settings.voiceAccent || 'us'}
                  onChange={e => update('settings.voiceAccent', e.target.value)}
                >
                  <option value="us">🇺🇸 US English</option>
                  <option value="uk">🇬🇧 UK English</option>
                  <option value="in">🇮🇳 Indian English</option>
                </select>
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 14, fontWeight: 500 }}>
                <span>Speed</span>
                <select
                  className="input-text"
                  value={settings.voiceSpeed || 1}
                  onChange={e => update('settings.voiceSpeed', parseFloat(e.target.value))}
                >
                  <option value={0.75}>Slow (0.75×)</option>
                  <option value={1}>Normal (1×)</option>
                  <option value={1.25}>Fast (1.25×)</option>
                  <option value={1.5}>Faster (1.5×)</option>
                </select>
              </label>
            </div>
            <div style={{ marginTop: 12, display: 'flex', gap: 12, alignItems: 'center' }}>
              <button data-testid="btn-test-voice" className="btn btn-outline" onClick={handleTestVoice}>
                Test Voice
              </button>
              {voiceStatus && (
                <span data-testid="voice-status" style={{ fontSize: 13, color: 'var(--color-muted)' }}>
                  {voiceStatus}
                </span>
              )}
            </div>
          </div>

          {/* Notifications & Motion */}
          <div className="card">
            <span className="badge" style={{ marginBottom: 12, display: 'inline-block' }}>
              <Bell size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />
              Preferences
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>Browser Notifications</div>
                  <div className="caption">Alert when you lose focus during a Pomodoro session</div>
                </div>
                <button
                  data-testid="btn-request-notifications"
                  className="btn btn-outline"
                  style={{ height: 32, fontSize: 13 }}
                  onClick={async () => {
                    if ('Notification' in window) {
                      const perm = await Notification.requestPermission();
                      update('settings.notificationPermission', perm);
                    }
                  }}
                >
                  {settings.notificationPermission === 'granted' ? '✓ Enabled' : 'Enable'}
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>Reduce Motion</div>
                  <div className="caption">Disable floating orb animations and transitions</div>
                </div>
                <input
                  type="checkbox"
                  data-testid="toggle-reduce-motion"
                  checked={settings.reduceMotion || false}
                  onChange={handleReduceMotionChange}
                  style={{ width: 20, height: 20, cursor: 'pointer', accentColor: 'var(--color-primary)' }}
                />
              </div>
            </div>
          </div>

          {/* Backup */}
          <div className="card">
            <span className="badge" style={{ marginBottom: 12, display: 'inline-block' }}>
              <RefreshCw size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />
              Data Backup
            </span>
            <p className="caption" style={{ marginBottom: 12 }}>
              Export all your tasks, habits, and settings to a JSON file. Import to restore.
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <button data-testid="btn-export-backup" className="btn btn-outline" onClick={exportData}>
                Export Backup
              </button>
              <label className="btn btn-outline" style={{ cursor: 'pointer' }}>
                <span>Import Backup</span>
                <input
                  type="file"
                  data-testid="input-import-backup"
                  accept=".json"
                  onChange={handleImportFile}
                  style={{ display: 'none' }}
                />
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
