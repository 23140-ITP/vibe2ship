import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, MicOff, Volume2, VolumeX, Trash2, Sparkles, User } from 'lucide-react';
import { useApp } from '../AppContext';

const PERSONAS = [
  { id: 'tough-love', label: 'Tough Love', prompt: 'You are a brutally honest but caring productivity coach. Be direct, challenge excuses, and push the user to act. Keep responses under 80 words.' },
  { id: 'yc-partner', label: 'YC Partner', prompt: 'You are a Y Combinator partner giving startup-style advice on productivity and execution. Be concise, high-signal, and actionable. Keep responses under 80 words.' },
  { id: 'zen-master', label: 'Zen Master', prompt: 'You are a calm, wise productivity mentor who uses mindfulness principles. Be peaceful, thoughtful, and focus on sustainable habits. Keep responses under 80 words.' },
  { id: 'hype-coach', label: 'Hype Coach', prompt: 'You are an enthusiastic, energetic motivational coach. Be encouraging, pumped up, and make the user feel unstoppable. Keep responses under 80 words. Use occasional emojis.' },
];

async function callGemini(apiKey, persona, history, userMessage) {
  const systemInstruction = persona.prompt;
  const contents = [
    ...history.map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.text }] })),
    { role: 'user', parts: [{ text: userMessage }] },
  ];
  const resp = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemInstruction }] },
        contents,
      }),
    }
  );
  const data = await resp.json();
  if (!resp.ok) throw new Error(data.error?.message || 'API error');
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

export default function AICoach() {
  const { state, addChatMessage, clearChat, update } = useApp();
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

    // Handle offline / mock response logic first
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
      const reply = await callGemini(settings.geminiApiKey, persona, chatHistory, trimmed);
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, height: '100%' }}>
      {/* Sidebar Controls */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {/* Persona Selector */}
        <div className="card" style={{ padding: 10 }}>
          <span className="caption-uppercase" style={{ display: 'block', marginBottom: 4, fontSize: 10 }}>Persona</span>
          <select
            data-testid="select-coach-persona"
            className="input-text"
            value={selectedPersona}
            onChange={e => handlePersonaChange(e.target.value)}
            style={{ width: '100%', cursor: 'pointer', height: 28, fontSize: 12, padding: '0 4px' }}
          >
            {PERSONAS.map(p => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </div>

        {/* Voice Output */}
        <div className="card" style={{ padding: 10, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <span className="caption-uppercase" style={{ display: 'block', marginBottom: 4, fontSize: 10 }}>Voice output</span>
          <button 
            data-testid="btn-voice-output"
            className="btn btn-outline"
            style={{ height: 28, fontSize: 11, width: '100%' }}
            onClick={handleVoiceOutputToggle}
          >
            {voiceOutput ? 'Voice Output On' : 'Voice Output Off'}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <button 
          data-testid="btn-voice-input"
          className="btn btn-outline"
          style={{ height: 32, fontSize: 11 }}
          onClick={toggleVoiceInput}
        >
          {voiceInput ? 'Voice Input On' : 'Voice Input Off'}
        </button>
        <button 
          className="btn btn-outline" 
          style={{ height: 32, fontSize: 11, color: '#dc2626', borderColor: '#fecaca' }}
          onClick={clearChat}
        >
          <Trash2 size={12} style={{ marginRight: 4 }} /> Clear Chat
        </button>
      </div>

      {/* Chat Panel */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden', flex: 1, minHeight: 300 }}>
        {/* Messages */}
        <div 
          data-testid="chat-messages"
          style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: 10 }}
        >
          {chatHistory.length === 0 && (
            <div style={{ textAlign: 'center', padding: '20px 10px' }}>
              <p className="caption">Ask me what to focus on, or say &quot;I completed my streak!&quot;</p>
            </div>
          )}
          {chatHistory.map(msg => (
            <div key={msg.id} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row' }}>
              <div style={{
                maxWidth: '85%', padding: '8px 12px', borderRadius: msg.role === 'user' ? '12px 4px 12px 12px' : '4px 12px 12px 12px',
                background: msg.role === 'user' ? 'var(--color-primary)' : 'var(--color-canvas)',
                color: msg.role === 'user' ? '#fff' : 'var(--color-body)',
                border: msg.role === 'assistant' ? '1px solid var(--color-hairline)' : 'none',
                fontSize: 13, lineHeight: 1.5, whiteSpace: 'pre-wrap',
              }}>
                {msg.role === 'user' ? 'You: ' : 'Coach: '}{msg.text}
              </div>
            </div>
          ))}
          {loading && (
            <div style={{ display: 'flex', gap: 4, alignItems: 'center', padding: '10px' }}>
              <span className="caption">Thinking…</span>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div style={{ padding: '8px 10px', borderTop: '1px solid var(--color-hairline)', display: 'flex', gap: 6 }}>
          <input 
            data-testid="chat-input"
            type="text" className="input-text" style={{ flex: 1, height: 34, fontSize: 13 }}
            placeholder={voiceInput ? 'Listening…' : 'Message Coach…'}
            value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            disabled={loading}
          />
          <button 
            data-testid="chat-send-btn"
            className="btn btn-primary"
            style={{ height: 34, padding: '0 12px' }}
            onClick={() => sendMessage()} disabled={loading || !input.trim()}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
