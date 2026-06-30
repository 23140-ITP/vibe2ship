import React, { useState, useEffect } from 'react';
import { useApp } from '../AppContext';
import { Sparkles, FileText, Copy, CheckCheck } from 'lucide-react';

export default function AutoDraftingDesk() {
  const { state, update } = useApp();
  const { settings, tasks } = state;

  const [selectedSubtask, setSelectedSubtask] = useState('');
  const [emailDraft, setEmailDraft] = useState('');
  const [templateDraft, setTemplateDraft] = useState('');
  const [generating, setGenerating] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState('');

  // Extract all subtasks
  const subtasksList = tasks.flatMap(t => 
    (t.subtasks || []).map(sub => ({
      taskId: t.id,
      taskTitle: t.title,
      text: sub.text,
      done: sub.done
    }))
  );

  // Sync state values on load
  useEffect(() => {
    if (state.draftContent) {
      const parts = state.draftContent.split('===TEMPLATE_SEPARATOR===');
      setEmailDraft(parts[0] || '');
      setTemplateDraft(parts[1] || '');
    }
  }, []);

  // Persist drafts
  const persistDrafts = (email, template) => {
    update('draftContent', `${email}===TEMPLATE_SEPARATOR===${template}`);
  };

  const handleGenerate = async () => {
    if (!settings.geminiApiKey) {
      alert('Add your Gemini API key in Settings first.');
      return;
    }

    setGenerating(true);
    try {
      let taskName = 'General Task';
      let subtaskName = 'General Subtask';
      if (selectedSubtask) {
        const parts = selectedSubtask.split('|||');
        taskName = parts[0];
        subtaskName = parts[1];
      }

      let generatedEmail, generatedTemplate;

      try {
        // Try real Gemini API first
        const emailPrompt = `Write a concise professional email updating a team about completing the subtask "${subtaskName}" under main task "${taskName}". Keep it under 80 words. Sign off as 'User'.`;
        const templatePrompt = `Write a brief status update note for: Main Task: "${taskName}", Subtask: "${subtaskName}". Format as a short bullet list. Keep under 60 words.`;

        const model = settings.selectedModel || 'gemini-2.5-flash';
        const [emailResp, templateResp] = await Promise.all([
          fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${settings.geminiApiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: emailPrompt }] }] }),
          }),
          fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${settings.geminiApiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: templatePrompt }] }] }),
          }),
        ]);


        if (emailResp.ok && templateResp.ok) {
          const [emailData, templateData] = await Promise.all([emailResp.json(), templateResp.json()]);
          generatedEmail = emailData.candidates?.[0]?.content?.parts?.[0]?.text || '';
          generatedTemplate = templateData.candidates?.[0]?.content?.parts?.[0]?.text || '';
        } else {
          throw new Error('API returned error');
        }
      } catch {
        // Fallback to sensible mock draft
        generatedEmail = `Subject: Update on ${taskName} — ${subtaskName}\n\nHi,\n\nQuick update: I've completed "${subtaskName}" under ${taskName}. Ready to sync on next steps whenever works for you.\n\nBest,\nUser`;
        generatedTemplate = `Status Update\n\n• Task: ${taskName}\n• Subtask: ${subtaskName}\n• Status: ✅ Complete\n• Next: Awaiting team review`;
      }

      setEmailDraft(generatedEmail);
      setTemplateDraft(generatedTemplate);
      persistDrafts(generatedEmail, generatedTemplate);
    } catch (err) {
      alert('Draft generation failed. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handleCopyEmail = () => {
    if (!emailDraft) {
      setCopyFeedback('Error: Nothing to copy!');
      setTimeout(() => setCopyFeedback(''), 3000);
      return;
    }
    navigator.clipboard.writeText(emailDraft).then(() => {
      setCopyFeedback('Draft copied to clipboard!');
      setTimeout(() => setCopyFeedback(''), 3000);
    });
  };

  const handleCopyTemplate = () => {
    if (!templateDraft) {
      setCopyFeedback('Error: Nothing to copy!');
      setTimeout(() => setCopyFeedback(''), 3000);
      return;
    }
    navigator.clipboard.writeText(templateDraft).then(() => {
      setCopyFeedback('Draft copied to clipboard!');
      setTimeout(() => setCopyFeedback(''), 3000);
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Selection Panel */}
      <div className="card" style={{ padding: 20 }}>
        <span className="badge" style={{ marginBottom: 12, display: 'inline-block' }}>AI Drafting Desk</span>
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <label style={{ flex: 1, minWidth: 200, display: 'flex', flexDirection: 'column', gap: 6, fontSize: 14, fontWeight: 500 }}>
            <span>Select Active Subtask</span>
            <select
              data-testid="draft-subtask-list"
              className="input-text"
              value={selectedSubtask}
              onChange={e => setSelectedSubtask(e.target.value)}
              style={{ cursor: 'pointer' }}
            >
              <option value="">-- Select a subtask --</option>
              {subtasksList.map((sub, i) => (
                <option key={i} value={`${sub.taskTitle}|||${sub.text}`}>
                  {sub.taskTitle}: {sub.text}
                </option>
              ))}
            </select>
          </label>
          <button
            data-testid="btn-generate-drafts"
            className="btn btn-primary"
            onClick={handleGenerate}
            disabled={generating}
            style={{ height: 40 }}
          >
            <Sparkles size={14} style={{ marginRight: 6 }} />
            {generating ? 'Generating...' : 'Generate Drafts'}
          </button>
        </div>
      </div>

      {/* Editor/Output Split Pane */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, minHeight: 400 }}>
        {/* Email Pane */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-ink)' }}>Professional Email Draft</span>
            <button
              data-testid="btn-copy-email"
              className="btn btn-outline"
              onClick={handleCopyEmail}
              style={{ height: 32, padding: '0 12px', fontSize: 13 }}
            >
              <Copy size={12} style={{ marginRight: 6 }} /> Copy Email
            </button>
          </div>
          <textarea
            data-testid="draft-email-output"
            className="input-text"
            style={{ flex: 1, resize: 'none', fontFamily: "'Inter', sans-serif", fontSize: 14, lineHeight: 1.6 }}
            placeholder="Generated email draft will appear here..."
            value={emailDraft}
            onChange={e => { setEmailDraft(e.target.value); persistDrafts(e.target.value, templateDraft); }}
          />
        </div>

        {/* Template Pane */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-ink)' }}>Status/Template Update</span>
            <button
              data-testid="btn-copy-template"
              className="btn btn-outline"
              onClick={handleCopyTemplate}
              style={{ height: 32, padding: '0 12px', fontSize: 13 }}
            >
              <Copy size={12} style={{ marginRight: 6 }} /> Copy Template
            </button>
          </div>
          <textarea
            data-testid="draft-template-output"
            className="input-text"
            style={{ flex: 1, resize: 'none', fontFamily: "'Inter', sans-serif", fontSize: 14, lineHeight: 1.6 }}
            placeholder="Generated status update will appear here..."
            value={templateDraft}
            onChange={e => { setTemplateDraft(e.target.value); persistDrafts(emailDraft, e.target.value); }}
          />
        </div>
      </div>

      {copyFeedback && (
        <div 
          data-testid="copy-feedback" 
          style={{ 
            position: 'fixed', 
            bottom: 24, 
            right: 24, 
            background: copyFeedback.includes('Error') ? '#fee2e2' : '#dcfce7', 
            color: copyFeedback.includes('Error') ? '#b91c1c' : '#15803d', 
            border: `1px solid ${copyFeedback.includes('Error') ? '#fca5a5' : '#86efac'}`,
            padding: '10px 16px', 
            borderRadius: 8, 
            fontSize: 14, 
            fontWeight: 600,
            zIndex: 9999
          }}
        >
          {copyFeedback}
        </div>
      )}
    </div>
  );
}
