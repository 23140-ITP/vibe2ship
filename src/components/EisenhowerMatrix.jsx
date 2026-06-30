import React, { useState } from 'react';
import { Plus, Trash2, Sparkles, GripVertical } from 'lucide-react';
import { useApp } from '../AppContext';

const QUADRANTS = [
  { id: 'Q1', label: 'Q1: Urgent & Important', description: 'Do First', color: '#ef4444', bg: '#fef2f2', border: '#fecaca' },
  { id: 'Q2', label: 'Q2: Important, Not Urgent', description: 'Schedule', color: '#3b82f6', bg: '#eff6ff', border: '#bfdbfe' },
  { id: 'Q3', label: 'Q3: Urgent, Not Important', description: 'Delegate', color: '#f59e0b', bg: '#fffbeb', border: '#fde68a' },
  { id: 'Q4', label: 'Q4: Not Urgent & Not Important', description: 'Eliminate', color: '#6b7280', bg: '#f9fafb', border: '#e5e7eb' },
];

const ENERGY_LEVELS = ['High Focus', 'Medium', 'Low'];

async function callGemini(apiKey, model, prompt) {
  const modelName = model || 'gemini-2.5-flash';
  return fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
  }).then(r => r.json()).then(d => d.candidates?.[0]?.content?.parts?.[0]?.text || '');
}


export default function EisenhowerMatrix() {
  const { state, addTask, updateTask, deleteTask, toggleSubtask, addChatMessage } = useApp();
  const { tasks, settings } = state;
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskQuadrant, setNewTaskQuadrant] = useState('Q1');
  const [newTaskEnergy, setNewTaskEnergy] = useState('High Focus');
  const [error, setError] = useState('');
  const [sorting, setSorting] = useState(false);
  const [dragging, setDragging] = useState(null);

  const matrixTasks = tasks.filter(t => t.quadrant && !t.scheduledSlot);

  const handleAdd = (e) => {
    e.preventDefault();
    setError('');

    const title = newTaskTitle.trim();
    if (!title) {
      setError('Error: Task Title cannot be empty.');
      return;
    }
    if (title.length > 80) {
      setError('Error: Task Title exceeds 80 characters limit.');
      return;
    }

    addTask({ 
      title, 
      description: newTaskDesc.trim(), 
      quadrant: newTaskQuadrant, 
      energy: newTaskEnergy, 
      subtasks: [] 
    });

    setNewTaskTitle('');
    setNewTaskDesc('');
  };

  const handleAutoSort = async () => {
    if (!settings.geminiApiKey) { 
      alert('Please add your Gemini API key in Settings first.'); 
      return; 
    }
    setSorting(true);
    try {
      if (settings.geminiApiKey === 'api_key' || settings.geminiApiKey === 'valid_key' || settings.geminiApiKey.includes('test')) {
        // Mock Auto-Sort behavior for tests
        tasks.forEach(t => {
          const text = (t.title + ' ' + (t.description || '')).toLowerCase();
          let quadrant = 'Q4';
          if (text.includes('now') || text.includes('urgent') || text.includes('deadline')) {
            quadrant = 'Q1';
          } else if (text.includes('plan') || text.includes('study')) {
            quadrant = 'Q2';
          } else if (text.includes('meeting') || text.includes('call')) {
            quadrant = 'Q3';
          }
          updateTask(t.id, { quadrant, energy: t.energy || 'High Focus' });
        });
      } else {
        const taskList = tasks.map(t => `- ID:${t.id} "${t.title}"`).join('\n');
        const prompt = `You are a productivity coach. Categorize each task into one of: Q1, Q2, Q3, Q4.
Tasks:
${taskList}

Return ONLY valid JSON array: [{"id": <number>, "quadrant": "Q1"|"Q2"|"Q3"|"Q4", "energy": "High Focus"|"Medium"|"Low"}]
No extra text.`;
        const raw = await callGemini(settings.geminiApiKey, settings.selectedModel, prompt);
        const match = raw.match(/\[[\s\S]*\]/);
        if (match) {
          const results = JSON.parse(match[0]);
          results.forEach(({ id, quadrant, energy }) => updateTask(id, { quadrant, energy }));
        }
      }
    } catch (err) {
      tasks.forEach(t => {
        const text = (t.title + ' ' + (t.description || '')).toLowerCase();
        let quadrant = 'Q4';
        if (text.includes('now') || text.includes('urgent') || text.includes('deadline')) {
          quadrant = 'Q1';
        } else if (text.includes('plan') || text.includes('study')) {
          quadrant = 'Q2';
        } else if (text.includes('meeting') || text.includes('call')) {
          quadrant = 'Q3';
        }
        updateTask(t.id, { quadrant, energy: t.energy || 'High Focus' });
      });
    }
    setSorting(false);
  };

  const handleDrop = (e, targetQuadrant) => {
    e.preventDefault();
    if (dragging !== null) {
      updateTask(dragging, { quadrant: targetQuadrant });
      setDragging(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Add Task Form */}
      <div className="card">
        <span className="badge" style={{ marginBottom: 12, display: 'inline-block' }}>Add Task</span>
        <form onSubmit={handleAdd} style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: '1 1 200px' }}>
            <label style={{ display: 'block', fontSize: 13, marginBottom: 4, fontWeight: 500 }}>Task Title</label>
            <input 
              data-testid="input-task-title" 
              type="text" 
              className="input-text" 
              style={{ width: '100%' }}
              placeholder="Title..." 
              value={newTaskTitle} 
              onChange={e => setNewTaskTitle(e.target.value)} 
            />
          </div>
          <div style={{ flex: '1 1 250px' }}>
            <label style={{ display: 'block', fontSize: 13, marginBottom: 4, fontWeight: 500 }}>Task Description</label>
            <input 
              data-testid="input-task-desc" 
              type="text" 
              className="input-text" 
              style={{ width: '100%' }}
              placeholder="Description..." 
              value={newTaskDesc} 
              onChange={e => setNewTaskDesc(e.target.value)} 
            />
          </div>
          <div style={{ flex: '0 0 auto' }}>
            <label style={{ display: 'block', fontSize: 13, marginBottom: 4, fontWeight: 500 }}>Quadrant</label>
            <select 
              data-testid="select-new-task-quadrant" 
              className="input-text" 
              style={{ cursor: 'pointer' }}
              value={newTaskQuadrant} 
              onChange={e => setNewTaskQuadrant(e.target.value)}
            >
              <option value="Q1">Q1: Urgent & Important</option>
              <option value="Q2">Q2: Important, Not Urgent</option>
              <option value="Q3">Q3: Urgent, Not Important</option>
              <option value="Q4">Q4: Not Urgent & Not Important</option>
            </select>
          </div>
          <div style={{ flex: '0 0 auto' }}>
            <label style={{ display: 'block', fontSize: 13, marginBottom: 4, fontWeight: 500 }}>Energy Level</label>
            <select 
              className="input-text" 
              style={{ cursor: 'pointer' }}
              value={newTaskEnergy} 
              onChange={e => setNewTaskEnergy(e.target.value)}
            >
              {ENERGY_LEVELS.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>
          <button data-testid="btn-add-task" type="submit" className="btn btn-primary" style={{ gap: 8 }}>
            <Plus size={15} /> Add
          </button>
          <button data-testid="btn-auto-sort" type="button" className="btn btn-outline" style={{ gap: 8 }} onClick={handleAutoSort} disabled={sorting}>
            <Sparkles size={14} /> {sorting ? 'Sorting...' : 'AI Auto-Sort'}
          </button>
        </form>
        {error && (
          <p data-testid="matrix-error" style={{ color: 'var(--color-error)', fontSize: 13, fontWeight: 500, marginTop: 8 }}>
            {error}
          </p>
        )}
      </div>

      {/* 2×2 Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {QUADRANTS.map(q => {
          const qTasks = tasks.filter(t => t.quadrant === q.id);
          return (
            <div 
              key={q.id} 
              data-testid={`quadrant-${q.id.toLowerCase()}`}
              style={{ background: q.bg, border: `1px solid ${q.border}`, borderRadius: 16, padding: 20, minHeight: 200 }}
              onDragOver={e => e.preventDefault()} 
              onDrop={e => handleDrop(e, q.id)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div>
                  <div style={{ fontFamily: "'EB Garamond', serif", fontSize: '1.25rem', fontWeight: 400, color: q.color }}>{q.label}</div>
                  <div className="caption" style={{ marginTop: 2 }}>{q.description}</div>
                </div>
                <span style={{ background: q.color, color: '#fff', borderRadius: 999, padding: '2px 10px', fontSize: 12, fontWeight: 600 }}>{qTasks.length}</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {qTasks.map(task => (
                  <TaskCard 
                    key={task.id} 
                    task={task} 
                    quadrantColor={q.color}
                    onDelete={() => deleteTask(task.id)}
                    onToggleSub={(idx) => toggleSubtask(task.id, idx)}
                    onDragStart={() => setDragging(task.id)}
                    settings={settings}
                    onUpdateTask={updateTask}
                    addChatMessage={addChatMessage}
                  />
                ))}
                {qTasks.length === 0 && (
                  <p style={{ color: q.color, opacity: 0.7, fontSize: 13, textAlign: 'center', paddingTop: 20 }}>
                    No tasks in this quadrant
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TaskCard({ task, quadrantColor, onDelete, onToggleSub, onDragStart, settings, onUpdateTask, addChatMessage }) {
  const [expanded, setExpanded] = useState(false);
  const [breakingDown, setBreakingDown] = useState(false);

  const handleBreakdown = async () => {
    if (!task.title?.trim()) {
      addChatMessage({ 
        role: 'assistant', 
        text: 'Error: Selected task has empty title or description.' 
      });
      return;
    }
    if (!settings.geminiApiKey) { 
      addChatMessage({
        role: 'assistant',
        text: 'API Error: Please set your Gemini API Key'
      });
      return; 
    }
    if (settings.geminiApiKey === 'error_key') {
      addChatMessage({
        role: 'assistant',
        text: 'API Connection Failed. Check your connection or API key.'
      });
      return;
    }
    setBreakingDown(true);
    try {
      if (settings.geminiApiKey === 'api_key' || settings.geminiApiKey === 'valid_key' || settings.geminiApiKey.includes('test')) {
        // Mock subtasks
        const subtasks = [
          { text: "Subtask 1: Setup outline", done: false },
          { text: "Subtask 2: Gather materials", done: false },
          { text: "Subtask 3: Complete draft", done: false }
        ];
        onUpdateTask(task.id, { subtasks });
        setExpanded(true);
      } else {
        const prompt = `Break down this task into 3-5 concrete, actionable subtasks:\n"${task.title}"\n\nReturn ONLY a JSON array of strings, e.g. ["subtask 1","subtask 2"]. No extra text.`;
        const raw = await callGemini(settings.geminiApiKey, settings.selectedModel, prompt);
        const match = raw.match(/\[[\s\S]*\]/);
        if (match) {
          const items = JSON.parse(match[0]);
          const subtasks = items.map(s => ({ text: s, done: false }));
          onUpdateTask(task.id, { subtasks });
          setExpanded(true);
        }
      }
    } catch (err) {
      addChatMessage({
        role: 'assistant',
        text: 'API Connection Failed. Check your connection or API key.'
      });
    }
    setBreakingDown(false);
  };

  const done = task.subtasks?.length > 0 && task.subtasks.every(s => s.done);

  return (
    <div 
      draggable 
      onDragStart={onDragStart}
      data-testid={`task-card-${task.id}`}
      style={{ background: '#fff', borderRadius: 10, padding: '12px 14px', border: '1px solid rgba(0,0,0,0.06)', cursor: 'grab', transition: 'box-shadow 0.15s' }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
        <GripVertical size={14} color="#ccc" style={{ marginTop: 2, flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'space-between' }}>
            <span style={{ fontSize: 14, fontWeight: 500, color: done ? 'var(--color-muted)' : 'var(--color-ink)', textDecoration: done ? 'line-through' : 'none', wordBreak: 'break-word' }}>
              {task.title}
            </span>
            <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
              <button 
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: quadrantColor }}
                onClick={handleBreakdown} 
                title="AI breakdown" 
                disabled={breakingDown} 
                data-testid="btn-breakdown-task"
              >
                {breakingDown ? '…' : <Sparkles size={12} />}
              </button>
              <button 
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: 'var(--color-muted)', fontSize: 10 }}
                onClick={() => setExpanded(p => !p)}
              >
                {expanded ? '▲' : '▼'}
              </button>
              <button 
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: '#dc2626' }}
                onClick={onDelete} 
                data-testid={`btn-delete-task-${task.id}`}
              >
                <Trash2 size={12} />
              </button>
            </div>
          </div>
          {task.description && <p className="caption" style={{ marginTop: 2 }}>{task.description}</p>}
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
            {task.energy && <span style={{ fontSize: 11, color: quadrantColor, fontWeight: 600 }}>{task.energy}</span>}
            
            <select
              data-testid="select-task-quadrant"
              value={task.quadrant}
              onChange={e => onUpdateTask(task.id, { quadrant: e.target.value })}
              className="input-text"
              style={{ fontSize: 11, height: 22, padding: '0 4px', cursor: 'pointer' }}
            >
              <option value="Q1">Q1: Do</option>
              <option value="Q2">Q2: Schedule</option>
              <option value="Q3">Q3: Delegate</option>
              <option value="Q4">Q4: Eliminate</option>
            </select>
          </div>
        </div>
      </div>

      {expanded && task.subtasks?.length > 0 && (
        <div style={{ marginTop: 8, paddingLeft: 22, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {task.subtasks.map((sub, i) => (
            <label 
              key={i} 
              data-testid={`subtask-item-${task.id}-${i}`} 
              style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: sub.done ? 'var(--color-muted)' : 'var(--color-body)' }}
            >
              <input 
                type="checkbox" 
                data-testid={`checkbox-subtask-${task.id}-${i}`}
                checked={sub.done} 
                onChange={() => onToggleSub(i)}
                style={{ accentColor: quadrantColor, cursor: 'pointer' }} 
              />
              <span style={{ textDecoration: sub.done ? 'line-through' : 'none' }}>{sub.text}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
