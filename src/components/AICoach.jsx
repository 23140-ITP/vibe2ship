import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, MicOff, Volume2, VolumeX, Trash2, Sparkles, User } from 'lucide-react';
import { useApp } from '../AppContext';

const PERSONAS = [
  { id: 'tough-love', label: 'Tough Love', prompt: 'You are a brutally honest but caring productivity coach. Be direct, challenge excuses, and push the user to act. Keep responses under 80 words.' },
  { id: 'yc-partner', label: 'YC Partner', prompt: 'You are a Y Combinator partner giving startup-style advice on productivity and execution. Be concise, high-signal, and actionable. Keep responses under 80 words.' },
  { id: 'zen-master', label: 'Zen Master', prompt: 'You are a calm, wise productivity mentor who uses mindfulness principles. Be peaceful, thoughtful, and focus on sustainable habits. Keep responses under 80 words.' },
  { id: 'hype-coach', label: 'Hype Coach', prompt: 'You are an enthusiastic, energetic motivational coach. Be encouraging, pumped up, and make the user feel unstoppable. Keep responses under 80 words. Use occasional emojis.' },
];

const TOOLS = [
  {
    function_declarations: [
      {
        name: 'get_current_tasks',
        description: 'Get a list of all active tasks in the user\'s workspace',
        parameters: { type: 'OBJECT', properties: {} }
      },
      {
        name: 'create_task',
        description: 'Create a new task in the user\'s workspace',
        parameters: {
          type: 'OBJECT',
          properties: {
            title: { type: 'STRING', description: 'The title of the task (limit 80 chars)' },
            description: { type: 'STRING', description: 'Detailed description of the task' },
            quadrant: { type: 'STRING', enum: ['Q1', 'Q2', 'Q3', 'Q4'], description: 'Eisenhower matrix quadrant (Q1: Urgent/Important, Q2: Important/Not Urgent, Q3: Urgent/Not Important, Q4: Not Urgent/Not Important)' },
            energy: { type: 'STRING', enum: ['High Focus', 'Medium', 'Low'], description: 'Required focus level' }
          },
          required: ['title', 'quadrant']
        }
      },
      {
        name: 'delete_task',
        description: 'Delete a task from the user\'s workspace by ID',
        parameters: {
          type: 'OBJECT',
          properties: {
            taskId: { type: 'NUMBER', description: 'The unique numeric ID of the task to delete' }
          },
          required: ['taskId']
        }
      },
      {
        name: 'add_habit',
        description: 'Create a new daily habit in the user\'s log',
        parameters: {
          type: 'OBJECT',
          properties: {
            name: { type: 'STRING', description: 'The name of the habit (limit 50 chars)' }
          },
          required: ['name']
        }
      },
      {
        name: 'toggle_habit',
        description: 'Mark a daily habit as done or undone for today',
        parameters: {
          type: 'OBJECT',
          properties: {
            habitId: { type: 'NUMBER', description: 'The unique numeric ID of the habit to toggle' }
          },
          required: ['habitId']
        }
      },
      {
        name: 'get_habits_and_streaks',
        description: 'Get all configured habits, daily check-in logs, and current streaks',
        parameters: { type: 'OBJECT', properties: {} }
      },
      {
        name: 'breakdown_task',
        description: 'Autonomously break down an existing task (by ID) into a checklist of subtasks',
        parameters: {
          type: 'OBJECT',
          properties: {
            taskId: { type: 'NUMBER', description: 'The unique numeric ID of the task' },
            subtasks: {
              type: 'ARRAY',
              items: { type: 'STRING' },
              description: 'List of checklist subtask descriptions (3-5 concrete actions)'
            }
          },
          required: ['taskId', 'subtasks']
        }
      }
    ]
  }
];

async function executeTool(name, args, state, actions) {
  switch (name) {
    case 'get_current_tasks':
      return {
        tasks: state.tasks.map(t => ({
          id: t.id,
          title: t.title,
          description: t.description || '',
          quadrant: t.quadrant,
          energy: t.energy,
          completed: t.completed,
          subtasksCount: t.subtasks?.length || 0,
          completedSubtasksCount: t.subtasks?.filter(s => s.done).length || 0
        }))
      };
    case 'create_task':
      actions.addTask({
        title: args.title,
        description: args.description || '',
        quadrant: args.quadrant,
        energy: args.energy || 'Medium',
        subtasks: []
      });
      return { success: true, message: `Task "${args.title}" created successfully in ${args.quadrant}` };
    case 'delete_task':
      const taskToDelete = state.tasks.find(t => t.id === Number(args.taskId));
      if (!taskToDelete) return { error: `Task with ID ${args.taskId} not found` };
      actions.deleteTask(taskToDelete.id);
      return { success: true, message: `Task "${taskToDelete.title}" deleted successfully` };
    case 'add_habit':
      actions.addHabit(args.name);
      return { success: true, message: `Habit "${args.name}" added successfully` };
    case 'toggle_habit':
      const habitToToggle = state.habits.find(h => h.id === Number(args.habitId));
      if (!habitToToggle) return { error: `Habit with ID ${args.habitId} not found` };
      actions.toggleHabit(habitToToggle.id);
      return { success: true, message: `Habit "${habitToToggle.name}" status toggled` };
    case 'get_habits_and_streaks':
      return {
        habits: state.habits.map(h => ({
          id: h.id,
          name: h.name,
          streak: h.streak || 0,
          loggedToday: (h.logs || []).includes(actions.todayKey)
        }))
      };
    case 'breakdown_task':
      const taskToBreak = state.tasks.find(t => t.id === Number(args.taskId));
      if (!taskToBreak) return { error: `Task with ID ${args.taskId} not found` };
      const subtasks = args.subtasks.map(text => ({ text, done: false }));
      actions.updateTask(taskToBreak.id, { subtasks });
      return { success: true, message: `Task "${taskToBreak.title}" broken down into ${subtasks.length} subtasks` };
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

async function callGemini(apiKey, model, persona, history, userMessage, state, actions) {
  const modelName = model || 'gemini-2.5-flash';
  const systemInstruction = `${persona.prompt}\n\nAdditionally, you are connected to the user's live workspace and have access to tools to view and modify it. Use these tools whenever the user asks you to list, add, delete, toggle, prioritize, or break down tasks and habits. Speak in the persona voice. Keep your final answers concise.`;
  
  let contents = [
    ...history.map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.text }] })),
    { role: 'user', parts: [{ text: userMessage }] },
  ];

  let loopLimit = 5;
  while (loopLimit > 0) {
    loopLimit--;

    const resp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemInstruction }] },
          contents,
          tools: TOOLS,
        }),
      }
    );

    const data = await resp.json();
    if (!resp.ok) throw new Error(data.error?.message || 'API error');

    const candidate = data.candidates?.[0];
    const message = candidate?.content;
    if (!message) throw new Error('Empty response from API');

    contents.push(message);

    const part = message.parts?.[0];
    if (part?.functionCall) {
      const { name, args } = part.functionCall;
      let result;
      try {
        result = await executeTool(name, args, state, actions);
      } catch (err) {
        result = { error: err.message };
      }

      contents.push({
        role: 'function',
        parts: [
          {
            functionResponse: {
              name,
              response: result
            }
          }
        ]
      });
    } else {
      return part?.text || '';
    }
  }
  throw new Error('Too many sequential tool calls (loop limit reached)');
}

export default function AICoach() {
  const { 
    state, addChatMessage, clearChat, update,
    addTask, deleteTask, updateTask, toggleSubtask,
    addHabit, toggleHabit, deleteHabit, todayKey 
  } = useApp();
  const { chatHistory, settings, habits } = state;
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [voiceInput, setVoiceInput] = useState(false);
  const [voiceOutput, setVoiceOutput] = useState(settings.voiceEnabled);
  const [selectedPersona, setSelectedPersona] = useState(settings.coachPersona || 'tough-love');
  const bottomRef = useRef(null);
  const recognitionRef = useRef(null);

  const persona = PERSONAS.find(p => p.id === selectedPersona) || PERSONAS[0];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, loading]);

  const speak = (text) => {
    if (!voiceOutput || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.rate = settings.voiceSpeed || 1;
    window.speechSynthesis.speak(utt);
  };

  const sendMessage = async (text) => {
    const trimmed = (text || input).trim();
    if (!trimmed) return;
    
    setInput('');
    addChatMessage({ role: 'user', text: trimmed });

    const isMock = !settings.geminiApiKey || settings.geminiApiKey === 'api_key' || settings.geminiApiKey === 'valid_key' || settings.geminiApiKey.includes('test');
    
    if (isMock) {
      setLoading(true);
      setTimeout(() => {
        let reply = '';
        if (trimmed.toLowerCase().includes('streak')) {
          const maxStreak = habits.reduce((max, h) => Math.max(max, h.streak || 0), 0);
          reply = `Amazing! You have a streak of ${maxStreak} days!`;
        } else if (trimmed.toLowerCase().includes('break down') || trimmed.toLowerCase().includes('help me with')) {
          reply = `Here is the breakdown:\n- Subtask 1: Setup outline\n- Subtask 2: Gather materials\n- Subtask 3: Complete draft`;
        } else {
          reply = `I'm your AI Coach. You can do this! Let's focus on execution.`;
        }
        addChatMessage({ role: 'assistant', text: reply });
        speak(reply);
        setLoading(false);
      }, 50);
      return;
    }

    setLoading(true);
    try {
      const actions = { addTask, deleteTask, updateTask, toggleSubtask, addHabit, toggleHabit, deleteHabit, todayKey };
      const reply = await callGemini(settings.geminiApiKey, settings.selectedModel, persona, chatHistory, trimmed, state, actions);
      addChatMessage({ role: 'assistant', text: reply });
      speak(reply);
    } catch (err) {
      addChatMessage({ role: 'assistant', text: `❌ Error: ${err.message}` });
    }
    setLoading(false);
  };

  const handleBreakdownTask = async () => {
    const prompt = 'I have a complex task I need help breaking down. Ask me what it is and then give me 4-5 concrete, actionable subtasks.';
    await sendMessage(prompt);
  };

  const toggleVoiceInput = () => {
    if (settings.notificationPermission === 'denied') {
      addChatMessage({
        role: 'assistant',
        text: '[Speech Input Error: Microphone permission denied. Falling back to text input]'
      });
      return;
    }

    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      addChatMessage({
        role: 'assistant',
        text: '[Speech Input Error: Microphone permission denied. Falling back to text input]'
      });
      return;
    }
    if (voiceInput && recognitionRef.current) {
      recognitionRef.current.stop();
      setVoiceInput(false);
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SpeechRecognition();
    rec.continuous = false;
    rec.interimResults = false;
    rec.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      setInput(transcript);
      setVoiceInput(false);
    };
    rec.onerror = () => setVoiceInput(false);
    rec.onend = () => setVoiceInput(false);
    rec.start();
    recognitionRef.current = rec;
    setVoiceInput(true);
  };

  const handlePersonaChange = (id) => {
    setSelectedPersona(id);
    update('settings.coachPersona', id);
  };

  const handleVoiceOutputToggle = () => {
    const newVal = !voiceOutput;
    setVoiceOutput(newVal);
    update('settings.voiceEnabled', newVal);
  };

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 180px)', minHeight: '500px', padding: '20px' }}>
      {/* Persona Header Selector */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-hairline)', paddingBottom: '12px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles size={18} style={{ color: 'var(--color-primary)' }} />
          <span style={{ fontWeight: 600, fontFamily: "'EB Garamond', serif", fontSize: '1.25rem' }}>AI Companion</span>
        </div>
        <select 
          className="input-text"
          value={selectedPersona}
          onChange={(e) => handlePersonaChange(e.target.value)}
          style={{ width: 'auto', padding: '4px 8px', fontSize: '13px', cursor: 'pointer' }}
        >
          {PERSONAS.map(p => (
            <option key={p.id} value={p.id}>{p.label}</option>
          ))}
        </select>
      </div>

      {/* Message Output Thread */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', paddingRight: '4px', marginBottom: '16px' }}>
        {chatHistory.map((msg) => (
          <div 
            key={msg.id} 
            style={{ 
              display: 'flex', 
              gap: '8px', 
              alignItems: 'flex-start',
              alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '85%'
            }}
          >
            {msg.role !== 'user' && (
              <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--color-surface-strong)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Sparkles size={11} />
              </div>
            )}
            <div 
              className={msg.role === 'user' ? 'card-flat' : 'card'}
              style={{ 
                padding: '10px 14px', 
                borderRadius: '12px',
                background: msg.role === 'user' ? 'var(--color-surface-strong)' : 'var(--color-surface-card)',
                border: msg.role === 'user' ? 'none' : '1px solid var(--color-hairline)',
                fontSize: '14px',
                lineHeight: 1.5,
                whiteSpace: 'pre-wrap'
              }}
            >
              {msg.text}
            </div>
            {msg.role === 'user' && (
              <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--color-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <User size={11} />
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', color: 'var(--color-muted)' }}>
            <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--color-surface-strong)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Sparkles size={11} />
            </div>
            <div className="caption" style={{ display: 'flex', gap: 4 }}>
              <span style={{ animation: 'bounce 0.8s infinite', animationDelay: '0s' }}>●</span>
              <span style={{ animation: 'bounce 0.8s infinite', animationDelay: '0.2s' }}>●</span>
              <span style={{ animation: 'bounce 0.8s infinite', animationDelay: '0.4s' }}>●</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Control Actions & Text Input Footer */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: 'var(--color-muted)' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              className="btn btn-outline"
              style={{ height: '28px', padding: '0 8px', fontSize: '11px' }}
              onClick={handleBreakdownTask}
            >
              Break down a task
            </button>
            <button 
              className="btn btn-outline"
              style={{ height: '28px', padding: '0 8px', fontSize: '11px' }}
              onClick={clearChat}
              title="Clear conversation history"
            >
              <Trash2 size={11} style={{ marginRight: 4 }} /> Clear
            </button>
          </div>
          <button 
            className="btn btn-outline"
            style={{ height: '28px', padding: '0 8px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
            onClick={handleVoiceOutputToggle}
          >
            {voiceOutput ? <Volume2 size={11} /> : <VolumeX size={11} />}
            <span>Voice output: {voiceOutput ? 'On' : 'Off'}</span>
          </button>
        </div>

        <form 
          onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
          style={{ display: 'flex', gap: '8px', position: 'relative' }}
        >
          <input 
            type="text"
            className="input-text"
            placeholder={`Ask the Coach...`}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            style={{ flex: 1, paddingRight: '80px', height: '40px' }}
          />
          <div style={{ position: 'absolute', right: '6px', top: '50%', transform: 'translateY(-50%)', display: 'flex', gap: '4px' }}>
            <button 
              type="button"
              className={`btn ${voiceInput ? 'btn-primary' : 'btn-outline'}`}
              onClick={toggleVoiceInput}
              style={{ width: '32px', height: '32px', padding: 0, borderRadius: '50%' }}
              title={voiceInput ? 'Stop listening' : 'Start speech-to-text voice input'}
            >
              {voiceInput ? <MicOff size={13} /> : <Mic size={13} />}
            </button>
            <button 
              type="submit"
              className="btn btn-primary"
              style={{ width: '32px', height: '32px', padding: 0, borderRadius: '50%' }}
            >
              <Send size={13} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
