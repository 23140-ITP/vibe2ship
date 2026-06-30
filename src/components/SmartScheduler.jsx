import React, { useState } from 'react';
import { Sparkles, Download, Calendar } from 'lucide-react';
import { useApp } from '../AppContext';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const HOURS = ['09:00', '11:00', '14:00', '16:00'];
const HOUR_LABELS = {
  '09:00': '09:00 AM',
  '11:00': '11:00 AM',
  '14:00': '02:00 PM',
  '16:00': '04:00 PM',
};

function generateICS(tasks, eventsState) {
  const now = new Date();
  
  // Collect all events to export
  const items = [];
  tasks.forEach(t => {
    if (t.scheduledDay && t.scheduledHour) {
      items.push({ title: t.title, day: t.scheduledDay, hour: t.scheduledHour });
    }
  });

  eventsState?.forEach(e => {
    if (e.date && e.startTime) {
      items.push({ title: e.title, day: e.date, hour: e.startTime });
    }
  });

  if (items.length === 0) return '';

  const events = items.map(item => {
    const d = new Date(now);
    const dayOffset = (DAYS.indexOf(item.day) - now.getDay() + 1 + 7) % 7;
    d.setDate(d.getDate() + dayOffset);
    const hr = parseInt(item.hour.replace(':', '').slice(0, 2), 10);
    d.setHours(hr, 0, 0, 0);
    const end = new Date(d.getTime() + 60 * 60 * 1000);
    const fmt = (dt) => dt.toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z';
    return `BEGIN:VEVENT\nDTSTART:${fmt(d)}\nDTEND:${fmt(end)}\nSUMMARY:${item.title}\nEND:VEVENT`;
  }).join('\n');

  return `BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//LMLS//EN\n${events}\nEND:VCALENDAR`;
}

export default function SmartScheduler() {
  const { state, updateTask } = useApp();
  const { tasks, settings } = state;
  const [energyLevel, setEnergyLevel] = useState('high'); // default energy setting is 'high'
  const [autoScheduling, setAutoScheduling] = useState(false);

  // Helper to count occupied slots and check what task is in which slot
  const getSlotTask = (day, hour) => {
    const hourKey = hour.replace(':', '');
    
    // Check direct task schedule
    const directTask = tasks.find(t => t.scheduledDay === day && (t.scheduledHour || '').replace(':', '') === hourKey);
    if (directTask) return directTask;

    // Check events schedule
    const event = state.events?.find(e => e.date === day && (e.startTime || '').replace(':', '') === hourKey);
    if (event) {
      const task = tasks.find(t => t.id === event.taskId || t.id === Number(event.taskId) || String(t.id) === String(event.taskId));
      if (task) return task;
      return { id: event.taskId, title: event.title || 'Event' };
    }

    return null;
  };

  const getOccupiedSlots = () => {
    const occupied = new Set();
    
    tasks.forEach(t => {
      if (t.scheduledDay && t.scheduledHour) {
        occupied.add(`${t.scheduledDay}-${t.scheduledHour.replace(':', '')}`);
      }
    });

    state.events?.forEach(e => {
      if (e.date && e.startTime) {
        occupied.add(`${e.date}-${e.startTime.replace(':', '')}`);
      }
    });

    return occupied;
  };

  const handleAutoSchedule = () => {
    if (!settings.geminiApiKey) {
      alert('Add your Gemini API key in Settings first.');
      return;
    }

    const occupied = getOccupiedSlots();
    if (occupied.size >= 28) {
      alert('Scheduler is completely full! Cannot auto-schedule any more tasks.');
      return;
    }

    // Find unscheduled tasks
    const unscheduled = tasks.filter(t => !t.scheduledDay || !t.scheduledHour);
    if (unscheduled.length === 0) {
      alert('All tasks are already scheduled!');
      return;
    }

    setAutoScheduling(true);

    // Map out peak and normal slots
    const peakSlots = [];
    const normalSlots = [];

    DAYS.forEach(day => {
      HOURS.forEach(hour => {
        const hourKey = hour.replace(':', '');
        if (!occupied.has(`${day}-${hourKey}`)) {
          if (hour === '09:00' || hour === '14:00') {
            peakSlots.push({ day, hour: hourKey });
          } else {
            normalSlots.push({ day, hour: hourKey });
          }
        }
      });
    });

    let peakIdx = 0;
    let normalIdx = 0;

    const highFocusTasks = unscheduled.filter(t => t.energy === 'High Focus');
    const otherTasks = unscheduled.filter(t => t.energy !== 'High Focus');

    highFocusTasks.forEach(task => {
      if (peakIdx < peakSlots.length) {
        const slot = peakSlots[peakIdx++];
        updateTask(task.id, { scheduledDay: slot.day, scheduledHour: slot.hour });
        occupied.add(`${slot.day}-${slot.hour}`);
      } else if (normalIdx < normalSlots.length) {
        const slot = normalSlots[normalIdx++];
        updateTask(task.id, { scheduledDay: slot.day, scheduledHour: slot.hour });
        occupied.add(`${slot.day}-${slot.hour}`);
      }
    });

    otherTasks.forEach(task => {
      if (normalIdx < normalSlots.length) {
        const slot = normalSlots[normalIdx++];
        updateTask(task.id, { scheduledDay: slot.day, scheduledHour: slot.hour });
        occupied.add(`${slot.day}-${slot.hour}`);
      } else if (peakIdx < peakSlots.length) {
        const slot = peakSlots[peakIdx++];
        updateTask(task.id, { scheduledDay: slot.day, scheduledHour: slot.hour });
        occupied.add(`${slot.day}-${slot.hour}`);
      }
    });

    setAutoScheduling(false);
  };

  const handleManualAssign = (day, hourKey, taskIdStr) => {
    // Clear previous task in this slot
    tasks.forEach(t => {
      if (t.scheduledDay === day && (t.scheduledHour || '').replace(':', '') === hourKey) {
        updateTask(t.id, { scheduledDay: undefined, scheduledHour: undefined });
      }
    });

    if (taskIdStr) {
      const taskId = Number(taskIdStr);
      updateTask(taskId, { scheduledDay: day, scheduledHour: hourKey });
    }
  };

  const handleExportICS = () => {
    const occupied = getOccupiedSlots();
    if (occupied.size === 0) {
      alert('Error: Cannot export empty schedule.');
      return;
    }
    const ics = generateICS(tasks, state.events);
    const blob = new Blob([ics], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'schedule.ics';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Controls Card */}
      <div className="card" style={{ display: 'flex', gap: 20, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', padding: 20 }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
          <form onSubmit={(e) => e.preventDefault()} style={{ display: 'inline-block' }}>
            <label htmlFor="energy-preference-select" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 500 }}>
              <span>Energy Preference</span>
              <select
                id="energy-preference-select"
                name="energyPreference"
                data-testid="select-energy-level"
                className="input-text"
                value={energyLevel}
                onChange={e => setEnergyLevel(e.target.value)}
                style={{ cursor: 'pointer', height: 36, padding: '0 8px' }}
              >
                <option value="high">high</option>
                <option value="medium">medium</option>
                <option value="low">low</option>
              </select>
            </label>
          </form>
          <button
            data-testid="btn-auto-schedule"
            className="btn btn-primary"
            onClick={handleAutoSchedule}
            disabled={autoScheduling}
            style={{ gap: 8 }}
          >
            <Sparkles size={14} /> Auto-Schedule Tasks
          </button>
        </div>

        <button
          data-testid="btn-export-ics"
          className="btn btn-outline"
          onClick={handleExportICS}
          style={{ gap: 8 }}
        >
          <Download size={14} /> Export .ics
        </button>
      </div>

      {/* Grid Weekly View */}
      <div className="card" style={{ padding: 20, overflowX: 'auto' }}>
        <div style={{ minWidth: 800 }}>
          {/* Header Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '120px repeat(7, 1fr)', borderBottom: '2px solid var(--color-hairline)', paddingBottom: 10, marginBottom: 10, textAlign: 'center', fontWeight: 600 }}>
            <div style={{ textAlign: 'left' }}>Time</div>
            {DAYS.map(day => <div key={day}>{day}</div>)}
          </div>

          {/* Time Rows */}
          {HOURS.map(hour => {
            const hourKey = hour.replace(':', '');
            return (
              <div key={hour} style={{ display: 'grid', gridTemplateColumns: '120px repeat(7, 1fr)', minHeight: 80, borderBottom: '1px solid var(--color-hairline-soft)', alignItems: 'center', padding: '6px 0' }}>
                {/* Hour Label */}
                <div style={{ fontWeight: 500, fontSize: 13, color: 'var(--color-muted)' }}>
                  {HOUR_LABELS[hour]}
                </div>

                {/* Day Columns */}
                {DAYS.map(day => {
                  const slotTask = getSlotTask(day, hour);
                  return (
                    <div
                      key={day}
                      data-testid={`calendar-slot-${day}-${hourKey}`}
                      style={{
                        borderLeft: '1px solid var(--color-hairline-soft)',
                        height: '100%',
                        padding: 4,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: 4
                      }}
                    >
                      {/* Scheduled task display */}
                      {slotTask ? (
                        <div
                          data-testid={`scheduled-task-${slotTask.id}`}
                          style={{
                            background: 'var(--color-surface-strong)',
                            border: '1px solid var(--color-hairline-strong)',
                            borderRadius: 6,
                            padding: '4px 6px',
                            fontSize: 12,
                            fontWeight: 500,
                            color: 'var(--color-ink)',
                            wordBreak: 'break-word',
                            lineHeight: 1.2
                          }}
                        >
                          {slotTask.title}
                        </div>
                      ) : (
                        <div style={{ fontSize: 11, color: 'var(--color-muted-soft)', textAlign: 'center', fontStyle: 'italic' }}>
                          empty
                        </div>
                      )}

                      {/* Manual Assign Select */}
                      <form onSubmit={(e) => e.preventDefault()}>
                        <label htmlFor={`select-reassign-${day}-${hourKey}`} className="sr-only">Assign task to {day} {hourKey}</label>
                        <select
                          id={`select-reassign-${day}-${hourKey}`}
                          name="reassignTask"
                          data-testid={`select-reassign-${day}-${hourKey}`}
                          value={slotTask ? slotTask.id : ''}
                          onChange={e => handleManualAssign(day, hourKey, e.target.value)}
                          className="input-text"
                          style={{ fontSize: 11, height: 22, padding: '0 4px', cursor: 'pointer', width: '100%', border: 'none', background: 'transparent' }}
                        >
                          <option value="">-- Assign --</option>
                          {tasks.map(t => (
                            <option key={t.id} value={t.id}>
                              {t.title}
                            </option>
                          ))}
                        </select>
                      </form>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
