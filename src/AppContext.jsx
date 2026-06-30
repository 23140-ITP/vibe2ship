import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AppContext = createContext(null);

const STORAGE_KEY = 'lastMinuteState';

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveToStorage(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch { /* quota exceeded – silent fail */ }
}

const defaultState = {
  settings: {
    geminiApiKey: '',
    voiceAccent: 'us',
    voiceEnabled: false,
    voiceSpeed: 1,
    notificationsEnabled: false,
    notificationPermission: 'default',
    reduceMotion: false,
    coachPersona: 'tough-love',
  },
  tasks: [],
  events: [],
  habits: [],
  draftContent: '',
  draftContext: '',
  pomodoro: {
    duration: 25,
    breakDuration: 5,
    startTimestamp: null,
    phase: 'idle', // idle | focus | break
    totalSeconds: 25 * 60,
  },
  ambientVolumes: { rain: 0.4, forest: 0, whitenoise: 0, lofi: 0 },
  chatHistory: [],
};

export function AppProvider({ children }) {
  const [state, setState] = useState(() => {
    const saved = loadFromStorage();
    if (!saved) return defaultState;
    // Deep merge saved over defaults so new keys always exist
    return {
      ...defaultState,
      ...saved,
      settings: { ...defaultState.settings, ...(saved.settings || {}) },
      pomodoro: { ...defaultState.pomodoro, ...(saved.pomodoro || {}), phase: 'idle', startTimestamp: null },
      ambientVolumes: { ...defaultState.ambientVolumes, ...(saved.ambientVolumes || {}) },
    };
  });

  // Persist on every state change
  useEffect(() => {
    saveToStorage(state);
  }, [state]);

  const update = useCallback((path, value) => {
    setState(prev => {
      if (typeof path === 'function') return path(prev);
      const keys = path.split('.');
      if (keys.length === 1) return { ...prev, [keys[0]]: value };
      if (keys.length === 2) return { ...prev, [keys[0]]: { ...prev[keys[0]], [keys[1]]: value } };
      return prev;
    });
  }, []);

  // ---- Tasks ----
  const addTask = useCallback((task) => {
    const title = (task.title || '').trim();
    if (!title) {
      throw new Error("Error: Task Title cannot be empty.");
    }
    if (title.length > 80) {
      throw new Error("Error: Task Title exceeds 80 characters limit.");
    }
    setState(prev => ({
      ...prev,
      tasks: [...prev.tasks, { id: Date.now(), ...task, title, subtasks: task.subtasks || [], completed: false, createdAt: new Date().toISOString() }],
    }));
  }, []);

  const updateTask = useCallback((id, changes) => {
    setState(prev => ({ ...prev, tasks: prev.tasks.map(t => t.id === id ? { ...t, ...changes } : t) }));
  }, []);

  const deleteTask = useCallback((id) => {
    setState(prev => ({ ...prev, tasks: prev.tasks.filter(t => t.id !== id) }));
  }, []);

  const toggleSubtask = useCallback((taskId, subtaskIdx) => {
    setState(prev => ({
      ...prev,
      tasks: prev.tasks.map(t => {
        if (t.id !== taskId) return t;
        const subtasks = t.subtasks.map((s, i) => i === subtaskIdx ? { ...s, done: !s.done } : s);
        const allDone = subtasks.length > 0 && subtasks.every(s => s.done);
        return { ...t, subtasks, completed: allDone };
      }),
    }));
  }, []);

  // ---- Habits ----
  const todayKey = new Date().toLocaleDateString('en-CA');
  
  const calculateStreak = (logs) => {
    if (!logs || !Array.isArray(logs) || logs.length === 0) return 0;
    const uniqueLogs = new Set(logs);
    const today = new Date();
    const todayStr = today.toLocaleDateString('en-CA');
    
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    const yesterdayStr = yesterday.toLocaleDateString('en-CA');
    
    let startStr = null;
    if (uniqueLogs.has(todayStr)) {
      startStr = todayStr;
    } else if (uniqueLogs.has(yesterdayStr)) {
      startStr = yesterdayStr;
    } else {
      return 0;
    }
    
    let streak = 0;
    let checkDate = startStr === todayStr ? today : yesterday;
    
    while (true) {
      const checkStr = checkDate.toLocaleDateString('en-CA');
      if (uniqueLogs.has(checkStr)) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
    return streak;
  };

  const addHabit = useCallback((name) => {
    const trimmed = (name || '').trim();
    if (!trimmed) {
      throw new Error("Error: Habit title cannot be empty.");
    }
    if (trimmed.length > 50) {
      throw new Error("Error: Habit title cannot exceed 50 characters.");
    }
    setState(prev => ({
      ...prev,
      habits: [...prev.habits, { id: Date.now(), name: trimmed, logs: [], streak: 0 }],
    }));
  }, []);

  const toggleHabit = useCallback((id) => {
    setState(prev => {
      const todayStr = new Date().toLocaleDateString('en-CA');
      return {
        ...prev,
        habits: prev.habits.map(h => {
          if (h.id !== id) return h;
          let logs = Array.isArray(h.logs) ? h.logs : [];
          if (logs.includes(todayStr)) {
            logs = logs.filter(d => d !== todayStr);
          } else {
            logs = [...logs, todayStr];
          }
          const streak = calculateStreak(logs);
          return { ...h, logs, streak };
        }),
      };
    });
  }, []);

  const deleteHabit = useCallback((id) => {
    setState(prev => ({ ...prev, habits: prev.habits.filter(h => h.id !== id) }));
  }, []);

  // ---- Backup / Restore ----
  const exportData = useCallback(() => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `life_saver_backup.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [state]);

  const importData = useCallback((file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          setState(prev => ({
            ...defaultState,
            ...data,
            settings: { ...defaultState.settings, ...(data.settings || {}) },
            pomodoro: { ...defaultState.pomodoro, phase: 'idle', startTimestamp: null },
          }));
          resolve();
        } catch {
          reject(new Error('Invalid JSON backup file'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }, []);

  // ---- Chat ----
  const addChatMessage = useCallback((msg) => {
    setState(prev => ({ ...prev, chatHistory: [...prev.chatHistory, { ...msg, id: Date.now() }] }));
  }, []);

  const clearChat = useCallback(() => {
    setState(prev => ({ ...prev, chatHistory: [] }));
  }, []);

  const value = {
    state,
    update,
    addTask, updateTask, deleteTask, toggleSubtask,
    addHabit, toggleHabit, deleteHabit, todayKey,
    exportData, importData,
    addChatMessage, clearChat,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
