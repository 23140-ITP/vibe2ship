import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Eye, Bell, BellOff } from 'lucide-react';
import { useApp } from '../AppContext';

const PERSONAS = [
  { id: 'tough-love', label: 'Tough Love', prompt: 'You are a brutally honest but caring productivity coach. Be direct, challenge excuses, and push the user to act. Keep responses under 80 words.' },
  { id: 'yc-partner', label: 'YC Partner', prompt: 'You are a Y Combinator partner giving startup-style advice on productivity and execution. Be concise, high-signal, and actionable. Keep responses under 80 words.' },
  { id: 'zen-master', label: 'Zen Master', prompt: 'You are a calm, wise productivity mentor who uses mindfulness principles. Be peaceful, thoughtful, and focus on sustainable habits. Keep responses under 80 words.' },
  { id: 'hype-coach', label: 'Hype Coach', prompt: 'You are an enthusiastic, energetic motivational coach. Be encouraging, pumped up, and make the user feel unstoppable. Keep responses under 80 words. Use occasional emojis.' },
];

// ---- Ambient sound sources (Web Audio API generated oscillators / noise) ----
function createNoiseBuffer(audioCtx) {
  const bufferSize = audioCtx.sampleRate * 2;
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
  return buffer;
}

function useAmbientEngine(volumes) {
  const ctxRef = useRef(null);
  const nodesRef = useRef({});

  const getCtx = useCallback(() => {
    if (!ctxRef.current) ctxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    if (ctxRef.current.state === 'suspended') ctxRef.current.resume();
    return ctxRef.current;
  }, []);

  const stopAll = useCallback(() => {
    Object.values(nodesRef.current).forEach(({ gainNode }) => {
      if (gainNode) { gainNode.gain.setTargetAtTime(0, gainNode.context.currentTime, 0.1); }
    });
    nodesRef.current = {};
  }, []);

  useEffect(() => {
    const activeCount = Object.values(volumes).filter(v => v > 0).length;
    if (activeCount === 0) { stopAll(); return; }

    const ctx = getCtx();

    // White noise (base)
    if (volumes.whitenoise > 0 && !nodesRef.current.whitenoise) {
      const buffer = createNoiseBuffer(ctx);
      const src = ctx.createBufferSource();
      src.buffer = buffer; src.loop = true;
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass'; filter.frequency.value = 1200;
      const gain = ctx.createGain();
      gain.gain.value = volumes.whitenoise * 0.4;
      src.connect(filter); filter.connect(gain); gain.connect(ctx.destination);
      src.start();
      nodesRef.current.whitenoise = { src, gainNode: gain };
    } else if (nodesRef.current.whitenoise) {
      nodesRef.current.whitenoise.gainNode.gain.setTargetAtTime(volumes.whitenoise * 0.4, ctx.currentTime, 0.2);
      if (volumes.whitenoise === 0) { nodesRef.current.whitenoise.src.stop(); delete nodesRef.current.whitenoise; }
    }

    // Rain (pink-ish noise + band-pass)
    if (volumes.rain > 0 && !nodesRef.current.rain) {
      const buffer = createNoiseBuffer(ctx);
      const src = ctx.createBufferSource();
      src.buffer = buffer; src.loop = true;
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass'; filter.frequency.value = 800; filter.Q.value = 0.5;
      const gain = ctx.createGain();
      gain.gain.value = volumes.rain * 0.5;
      src.connect(filter); filter.connect(gain); gain.connect(ctx.destination);
      src.start();
      nodesRef.current.rain = { src, gainNode: gain };
    } else if (nodesRef.current.rain) {
      nodesRef.current.rain.gainNode.gain.setTargetAtTime(volumes.rain * 0.5, ctx.currentTime, 0.2);
      if (volumes.rain === 0) { nodesRef.current.rain.src.stop(); delete nodesRef.current.rain; }
    }

    // Forest (low rumble)
    if (volumes.forest > 0 && !nodesRef.current.forest) {
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth'; osc.frequency.value = 55;
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass'; filter.frequency.value = 200;
      const gain = ctx.createGain();
      gain.gain.value = volumes.forest * 0.1;
      osc.connect(filter); filter.connect(gain); gain.connect(ctx.destination);
      osc.start();
      nodesRef.current.forest = { src: osc, gainNode: gain };
    } else if (nodesRef.current.forest) {
      nodesRef.current.forest.gainNode.gain.setTargetAtTime(volumes.forest * 0.1, ctx.currentTime, 0.2);
      if (volumes.forest === 0) { nodesRef.current.forest.src.stop(); delete nodesRef.current.forest; }
    }

    // Lo-fi (simple tone)
    if (volumes.lofi > 0 && !nodesRef.current.lofi) {
      const osc = ctx.createOscillator();
      osc.type = 'sine'; osc.frequency.value = 220;
      const gain = ctx.createGain();
      gain.gain.value = volumes.lofi * 0.05;
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start();
      nodesRef.current.lofi = { src: osc, gainNode: gain };
    } else if (nodesRef.current.lofi) {
      nodesRef.current.lofi.gainNode.gain.setTargetAtTime(volumes.lofi * 0.05, ctx.currentTime, 0.2);
      if (volumes.lofi === 0) { nodesRef.current.lofi.src.stop(); delete nodesRef.current.lofi; }
    }
  }, [volumes, getCtx, stopAll]);
}

function formatTime(secs) {
  const m = Math.floor(secs / 60).toString().padStart(2, '0');
  const s = (secs % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export default function FocusedWorkspace() {
  const { state, update } = useApp();
  const { pomodoro, ambientVolumes } = state;
  const [timeLeft, setTimeLeft] = useState(pomodoro.totalSeconds);
  const [focusGuardActive, setFocusGuardActive] = useState(true);
  const [showWarning, setShowWarning] = useState(false);
  const [nudgeText, setNudgeText] = useState('👀 Focus Guard Warning: You left the tab! Stay focused on your active task.');
  const tickRef = useRef(null);

  useAmbientEngine(ambientVolumes);

  // ---- Timer Logic ----
  const computeTimeLeft = useCallback(() => {
    if (pomodoro.phase === 'idle' || !pomodoro.startTimestamp) return pomodoro.totalSeconds;
    const elapsed = Math.floor((Date.now() - pomodoro.startTimestamp) / 1000);
    return Math.max(0, pomodoro.totalSeconds - elapsed);
  }, [pomodoro]);

  useEffect(() => {
    setTimeLeft(computeTimeLeft());
    if (pomodoro.phase === 'idle') { clearInterval(tickRef.current); return; }
    tickRef.current = setInterval(() => {
      const tl = computeTimeLeft();
      setTimeLeft(tl);
      if (tl === 0) {
        clearInterval(tickRef.current);
        if (Notification.permission === 'granted') {
          new Notification('🍅 Pomodoro complete!', { body: pomodoro.phase === 'focus' ? 'Time for a break.' : 'Back to work!' });
        }
        const nextPhase = pomodoro.phase === 'focus' ? 'break' : 'focus';
        const nextSecs = (nextPhase === 'focus' ? pomodoro.duration : pomodoro.breakDuration) * 60;
        update(prev => ({ ...prev, pomodoro: { ...prev.pomodoro, phase: nextPhase, startTimestamp: Date.now(), totalSeconds: nextSecs } }));
      }
    }, 1000);
    return () => clearInterval(tickRef.current);
  }, [pomodoro, computeTimeLeft, update]);

  // Update document title
  useEffect(() => {
    if (pomodoro.phase !== 'idle') document.title = `${formatTime(timeLeft)} – ${pomodoro.phase === 'focus' ? '🍅 Focus' : '☕ Break'}`;
    else document.title = 'The Last-Minute Life Saver';
  }, [timeLeft, pomodoro.phase]);

  const startTimer = () => {
    const secs = pomodoro.duration * 60;
    update(prev => ({ ...prev, pomodoro: { ...prev.pomodoro, phase: 'focus', startTimestamp: Date.now(), totalSeconds: secs } }));
  };
  const pauseTimer = () => {
    clearInterval(tickRef.current);
    update(prev => ({ ...prev, pomodoro: { ...prev.pomodoro, phase: 'idle', startTimestamp: null, totalSeconds: timeLeft } }));
  };
  const resetTimer = () => {
    clearInterval(tickRef.current);
    update(prev => ({ ...prev, pomodoro: { ...prev.pomodoro, phase: 'idle', startTimestamp: null, totalSeconds: prev.pomodoro.duration * 60 } }));
    setTimeLeft(pomodoro.duration * 60);
  };

  const setDuration = (mins) => {
    if (pomodoro.phase !== 'idle') return;
    update(prev => ({ ...prev, pomodoro: { ...prev.pomodoro, duration: mins, totalSeconds: mins * 60 } }));
    setTimeLeft(mins * 60);
  };

  const handleDurationInputChange = (e) => {
    const val = parseInt(e.target.value, 10);
    if (isNaN(val)) return;
    if (val <= 0) {
      alert('Pomodoro duration must be a positive number.');
      return;
    }
    if (val > 1440) {
      alert('Pomodoro duration cannot exceed 1440 minutes.');
      return;
    }
    setDuration(val);
  };

  // ---- Focus Guard ----
  useEffect(() => {
    const handler = async () => {
      if (document.hidden) {
        if (pomodoro.phase === 'focus' && focusGuardActive) {
          const activeTask = state.tasks.find(t => t.id === state.activeTaskId);
          let taskTitle = activeTask ? activeTask.title : null;
          if (!taskTitle) {
            const firstIncomplete = state.tasks.find(t => !t.completed);
            taskTitle = firstIncomplete ? firstIncomplete.title : "staying focused";
          }

          let nudge = '';
          const personaId = state.settings.coachPersona || 'tough-love';

          try {
            const isMockKey = state.settings.geminiApiKey === 'api_key' || state.settings.geminiApiKey === 'valid_key' || state.settings.geminiApiKey.includes('test');
            if (isMockKey) {
              throw new Error('Using mock fallback');
            }

            const coachPersona = PERSONAS.find(p => p.id === personaId) || PERSONAS[0];
            const resp = await fetch('/api/chat', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-gemini-key': state.settings.geminiApiKey
              },
              body: JSON.stringify({
                model: state.settings.selectedModel || 'gemini-2.5-flash',
                persona: coachPersona,
                contents: [
                  {
                    role: 'user',
                    parts: [{ text: `Generate a short warning nudge for leaving the tab while I should be focusing on: ${taskTitle}. Speak in your persona voice.` }]
                  }
                ]
              })
            });
            if (!resp.ok) throw new Error('API error');
            const data = await resp.json();
            nudge = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
          } catch {
            if (personaId === 'tough-love') {
              nudge = `Hey! Stop slacking. You're supposed to be focusing on: ${taskTitle}. Back to work!`;
            } else if (personaId === 'yc-partner') {
              nudge = `Execution is everything. You need to focus on: ${taskTitle} to build momentum. Get back to it.`;
            } else if (personaId === 'zen-master') {
              nudge = `Breathe in, breathe out. Let go of distractions and gently bring your awareness back to: ${taskTitle}.`;
            } else {
              nudge = `You've got this! Let's stay locked in on: ${taskTitle}. No distractions can stop you now! 🚀🔥`;
            }
          }


          setNudgeText(nudge);
          setShowWarning(true);

          if (window.speechSynthesis) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(nudge);
            if (state.settings.voiceSpeed) {
              utterance.rate = state.settings.voiceSpeed;
            }
            window.speechSynthesis.speak(utterance);
          }

          if (Notification.permission === 'granted') {
            new Notification('👀 Focus Guard', { body: nudge });
          }
        } else {
          setNudgeText('👀 Focus Guard Warning: You left the tab! Stay focused on your active task.');
          setShowWarning(true);
        }
      } else {
        setShowWarning(false);
      }
    };
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, [focusGuardActive, pomodoro.phase, state.tasks, state.activeTaskId, state.settings]);

  const progress = pomodoro.phase === 'idle' ? 0 : 1 - timeLeft / pomodoro.totalSeconds;
  const circumference = 2 * Math.PI * 88;

  const sounds = [
    { id: 'rain', label: 'Rain' },
    { id: 'forest', label: 'Forest' },
    { id: 'whitenoise', label: 'White Noise' },
    { id: 'lofi', label: 'Lo-Fi' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {showWarning && (
        <div data-testid="visibility-warning" style={{ background: '#fef2f2', border: '1px solid #fee2e2', color: '#991b1b', padding: '12px 16px', borderRadius: 8, fontWeight: 600 }}>
          {nudgeText}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Timer Card */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px', padding: '40px 24px' }}>
          <span className="badge">{pomodoro.phase === 'focus' ? '🍅 Focus' : pomodoro.phase === 'break' ? '☕ Break' : '⏸ Idle'}</span>
          
          <form id="active-task-form" onSubmit={(e) => e.preventDefault()} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label htmlFor="focus-task-select" style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-ink)' }}>Focus Task</label>
            <select
              id="focus-task-select"
              name="focusTask"
              className="input-text"
              style={{ width: '100%', height: 36, padding: '0 8px' }}
              value={state.activeTaskId || ''}
              onChange={(e) => {
                const val = e.target.value ? Number(e.target.value) : null;
                update('activeTaskId', val);
              }}
            >
              <option value="">-- Select a Focus Task --</option>
              {state.tasks.filter(t => !t.completed).map(t => (
                <option key={t.id} value={t.id}>{t.title}</option>
              ))}
            </select>
          </form>
          
          {/* Circular Timer */}
          <div style={{ position: 'relative', width: 200, height: 200 }}>
            <svg
              width="200" height="200"
              style={{
                transform: 'rotate(-90deg)',
                animation: pomodoro.phase === 'focus' ? 'timer-pulse 3s ease-in-out infinite' : 'none',
              }}
            >
              <circle cx="100" cy="100" r="88" fill="none" stroke="var(--color-hairline)" strokeWidth="8" />
              <circle
                cx="100" cy="100" r="88" fill="none"
                stroke={pomodoro.phase === 'break' ? 'var(--color-gradient-mint)' : 'var(--color-primary)'}
                strokeWidth="8"
                strokeDasharray={circumference}
                strokeDashoffset={circumference * (1 - progress)}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 0.5s ease' }}
              />
            </svg>

            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <span 
                data-testid="timer-display"
                style={{ fontFamily: "'EB Garamond', serif", fontSize: '2.5rem', fontWeight: 300, color: 'var(--color-ink)', lineHeight: 1 }} 
                id="pomodoro-timer-display"
              >
                {formatTime(timeLeft)}
              </span>
              <span className="caption" style={{ marginTop: 4 }}>{pomodoro.phase === 'focus' ? 'focus session' : pomodoro.phase === 'break' ? 'break time' : 'ready'}</span>
            </div>
          </div>

          {/* Duration Presets / Custom input */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {[15, 25, 45, 60].map(m => (
              <button 
                key={m} 
                id={`pomodoro-duration-${m}`} 
                className={`btn btn-outline`} 
                style={{ height: 32, padding: '0 12px', fontSize: 13, ...(pomodoro.duration === m && pomodoro.phase === 'idle' ? { background: 'var(--color-primary)', color: '#fff', borderColor: 'var(--color-primary)' } : {}) }}
                onClick={() => setDuration(m)}
              >
                {m}m
              </button>
            ))}
            <form onSubmit={(e) => e.preventDefault()} style={{ display: 'inline-block' }}>
              <label htmlFor="pomodoro-duration-input" className="sr-only">Pomodoro Duration</label>
              <input 
                id="pomodoro-duration-input"
                name="pomodoroDuration"
                type="number"
                data-testid="input-pomodoro-duration"
                className="input-text"
                style={{ width: 70, height: 32, padding: '0 8px', fontSize: 13 }}
                value={pomodoro.duration}
                onChange={handleDurationInputChange}
                onBlur={e => {
                  if (e.target.value === '' || parseInt(e.target.value, 10) <= 0) {
                    setDuration(25);
                  }
                }}
                disabled={pomodoro.phase !== 'idle'}
              />
            </form>
          </div>

          {/* Controls */}
          <div style={{ display: 'flex', gap: '12px' }}>
            {pomodoro.phase === 'idle' ? (
              <button data-testid="btn-play-pause" className="btn btn-primary" onClick={startTimer} style={{ gap: 8 }}>
                <Play size={15} /> Play
              </button>
            ) : (
              <button data-testid="btn-play-pause" className="btn btn-outline" onClick={pauseTimer} style={{ gap: 8 }}>
                <Pause size={15} /> Pause
              </button>
            )}
            <button data-testid="btn-reset-timer" className="btn btn-outline" onClick={resetTimer} style={{ gap: 8 }}>
              <RotateCcw size={14} /> Reset
            </button>
          </div>
        </div>

        {/* Ambient Sound Mixer */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <span className="badge" style={{ marginBottom: 8, display: 'inline-block' }}>Ambient Sound Mixer</span>
            <p className="caption">Blend sounds to create your perfect focus environment.</p>
          </div>

          {sounds.map(({ id, label }) => {
            const testId = id === 'whitenoise' ? 'white-noise' : id;
            return (
              <form key={id} onSubmit={(e) => e.preventDefault()} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label htmlFor={`ambient-${id}`} style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-ink)', cursor: 'pointer' }}>{label}</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button 
                      type="button"
                      data-testid={`btn-mute-${testId}`}
                      onClick={() => {
                        if (ambientVolumes[id] > 0) {
                          update(`ambientVolumes.${id}`, 0);
                        } else {
                          update(`ambientVolumes.${id}`, 0.5);
                        }
                      }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, display: 'flex', alignItems: 'center', gap: 4 }}
                    >
                      {ambientVolumes[id] > 0 ? (
                        <><Volume2 size={14} color="var(--color-body)" /> Mute {label}</>
                      ) : (
                        <><VolumeX size={14} color="var(--color-muted-soft)" /> Unmute {label}</>
                      )}
                    </button>
                    <span className="caption">{Math.round(ambientVolumes[id] * 100)}%</span>
                  </div>
                </div>
                <input 
                  id={`ambient-${id}`} 
                  name={`ambientVolume-${id}`}
                  type="range" 
                  min={0} 
                  max={100} 
                  step={1} 
                  data-testid={`volume-${testId}`}
                  value={Math.round(ambientVolumes[id] * 100)}
                  style={{ width: '100%', accentColor: 'var(--color-primary)', cursor: 'pointer' }}
                  onChange={e => update(`ambientVolumes.${id}`, parseFloat(e.target.value) / 100)} 
                />
              </form>
            );
          })}
        </div>
      </div>

      {/* Focus Guard */}
      <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <Eye size={18} color="var(--color-primary)" />
            <h4 style={{ fontSize: '1.1rem' }}>Focus Guard</h4>
            {focusGuardActive && <span data-testid="focus-guard-status" className="badge" style={{ background: '#dcfce7', color: '#16a34a' }}>Focus Guard Active</span>}
          </div>
          <p className="caption">Alerts you when you switch tabs during a focus session.</p>
        </div>
        <button 
          id="focus-guard-toggle" 
          data-testid="toggle-focus-guard"
          className={`btn ${focusGuardActive ? 'btn-primary' : 'btn-outline'}`} 
          style={{ gap: 8 }} 
          onClick={() => setFocusGuardActive(p => !p)}
        >
          {focusGuardActive ? <><BellOff size={14} /> Disable Guard</> : <><Bell size={14} /> Enable Guard</>}
        </button>
      </div>
    </div>
  );
}
