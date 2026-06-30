import React, { useState } from 'react';
import { useApp } from '../AppContext';
import { CheckSquare, Trash2, Award } from 'lucide-react';

export default function HabitTracker() {
  const { state, addHabit, toggleHabit, deleteHabit, todayKey } = useApp();
  const { habits } = state;
  const [newTitle, setNewTitle] = useState('');
  const [error, setError] = useState('');

  const handleAdd = (e) => {
    e.preventDefault();
    setError('');

    const title = newTitle.trim();
    if (!title) {
      setError('Error: Habit title cannot be empty.');
      return;
    }
    if (title.length > 50) {
      setError('Error: Habit title cannot exceed 50 characters.');
      return;
    }

    addHabit(title);
    setNewTitle('');
  };

  const getStreak = (habit) => {
    if (habit.streak !== undefined) return habit.streak;
    
    const logs = habit.logs || [];
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Add Habit Form */}
      <div className="card">
        <span className="badge" style={{ marginBottom: 12, display: 'inline-block' }}>Track New Habit</span>
        <form onSubmit={handleAdd} style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <label htmlFor="new-habit-title" className="sr-only">New Habit Title</label>
            <input 
              id="new-habit-title"
              name="habitTitle"
              type="text" 
              data-testid="input-habit-title" 
              className="input-text" 
              style={{ width: '100%' }}
              placeholder="e.g. Drink 3L water daily..." 
              value={newTitle} 
              onChange={e => setNewTitle(e.target.value)} 
            />
          </div>
          <button 
            type="submit" 
            data-testid="btn-add-habit" 
            className="btn btn-primary"
          >
            Add Habit
          </button>
        </form>
        {error && (
          <p data-testid="habit-error" style={{ color: 'var(--color-error)', fontSize: 13, fontWeight: 500, marginTop: 8 }}>
            {error}
          </p>
        )}
      </div>

      {/* Habits List */}
      <div className="card" data-testid="habits-list">
        <span className="badge" style={{ marginBottom: 16, display: 'inline-block' }}>My Daily Habits</span>
        
        {habits.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '24px 0', color: 'var(--color-muted)' }}>
            No habits tracked yet.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {habits.map((habit) => {
              const isChecked = (habit.logs || []).includes(todayKey);
              const streakCount = getStreak(habit);
              return (
                <div 
                  key={habit.id} 
                  data-testid={`habit-item-${habit.id}`}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between', 
                    padding: '12px 16px', 
                    background: 'var(--color-canvas)', 
                    borderRadius: 10,
                    border: '1px solid var(--color-hairline)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <form onSubmit={(e) => e.preventDefault()} style={{ display: 'flex', alignItems: 'center' }}>
                      <label htmlFor={`checkbox-habit-${habit.id}`} className="sr-only">Toggle completion for {habit.title || habit.name}</label>
                      <input 
                        id={`checkbox-habit-${habit.id}`}
                        name="habitDone"
                        type="checkbox" 
                        data-testid={`checkbox-habit-${habit.id}`} 
                        checked={isChecked}
                        onChange={() => toggleHabit(habit.id)}
                        style={{ width: 18, height: 18, cursor: 'pointer', accentColor: 'var(--color-primary)' }}
                      />
                    </form>
                    <span style={{ 
                      fontSize: 15, 
                      fontWeight: 500, 
                      color: isChecked ? 'var(--color-muted)' : 'var(--color-ink)',
                      textDecoration: isChecked ? 'line-through' : 'none'
                    }}>
                      {habit.title || habit.name}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#fff', padding: '4px 10px', borderRadius: 999, border: '1px solid var(--color-hairline-strong)', fontSize: 12, fontWeight: 600 }}>
                      <Award size={13} color="var(--color-muted)" />
                      <span data-testid={`habit-streak-${habit.id}`}>{streakCount} days</span>
                    </div>
                    <button 
                      className="btn btn-outline" 
                      style={{ height: 30, padding: '0 10px', fontSize: 12, borderColor: '#fecaca', color: '#dc2626' }}
                      onClick={() => deleteHabit(habit.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
