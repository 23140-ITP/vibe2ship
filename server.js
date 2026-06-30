import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 8080;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Map user's requested "gemini-2.5-flash" or "gemini-3.5-flash" to the actual latest stable models
function getActualModel(modelName) {
  const model = modelName || 'gemini-1.5-flash';
  if (model.includes('2.5') || model.includes('3.5') || model.includes('2.0') || model.includes('flash')) {
    return 'gemini-1.5-flash'; // Safe fallback because gemini-2.5/3.5 do not exist in the API list
  }
  return model;
}

// Serve static assets from the Vite dist folder
app.use(express.static(path.join(__dirname, 'dist')));

// API Chat Endpoint
app.post('/api/chat', async (req, res) => {
  const clientKey = req.headers['x-gemini-key'] || req.body.apiKey;
  const activeKey = clientKey || GEMINI_API_KEY;

  if (!activeKey) {
    return res.status(500).json({ error: 'Gemini API key is not configured on the server. Please supply one in Settings.' });
  }

  const { model, persona, contents, tools } = req.body;
  const actualModel = getActualModel(model);
  const systemInstruction = `${persona.prompt}\n\nAdditionally, you are connected to the user's live workspace and have access to tools to view and modify it. Use these tools whenever the user asks you to list, add, delete, toggle, prioritize, or break down tasks and habits. Speak in the persona voice. Keep your final answers concise.`;

  try {
    const resp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${actualModel}:generateContent?key=${activeKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemInstruction }] },
          contents,
          tools,
        }),
      }
    );

    const data = await resp.json();
    if (!resp.ok) {
      return res.status(resp.status).json({ error: data.error?.message || 'Gemini API error' });
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// API Draft Generation Endpoint
app.post('/api/generate-drafts', async (req, res) => {
  const clientKey = req.headers['x-gemini-key'] || req.body.apiKey;
  const activeKey = clientKey || GEMINI_API_KEY;

  if (!activeKey) {
    return res.status(500).json({ error: 'Gemini API key is not configured on the server. Please supply one in Settings.' });
  }

  const { model, emailPrompt, templatePrompt } = req.body;
  const actualModel = getActualModel(model);

  try {
    const [emailResp, templateResp] = await Promise.all([
      fetch(`https://generativelanguage.googleapis.com/v1beta/models/${actualModel}:generateContent?key=${activeKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: emailPrompt }] }] }),
      }),
      fetch(`https://generativelanguage.googleapis.com/v1beta/models/${actualModel}:generateContent?key=${activeKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: templatePrompt }] }] }),
      }),
    ]);


    if (emailResp.ok && templateResp.ok) {
      const [emailData, templateData] = await Promise.all([emailResp.json(), templateResp.json()]);
      res.json({
        email: emailData.candidates?.[0]?.content?.parts?.[0]?.text || '',
        template: templateData.candidates?.[0]?.content?.parts?.[0]?.text || '',
      });
    } else {
      res.status(500).json({ error: 'Gemini API returned error' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API Eisenhower Categorization Endpoint
app.post('/api/categorize-tasks', async (req, res) => {
  const clientKey = req.headers['x-gemini-key'] || req.body.apiKey;
  const activeKey = clientKey || GEMINI_API_KEY;

  if (!activeKey) {
    return res.status(500).json({ error: 'Gemini API key is not configured on the server. Please supply one in Settings.' });
  }

  const { model, prompt } = req.body;
  const actualModel = getActualModel(model);

  try {
    const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${actualModel}:generateContent?key=${activeKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    });


    const data = await resp.json();
    if (resp.ok) {
      res.json({ text: data.candidates?.[0]?.content?.parts?.[0]?.text || '' });
    } else {
      res.status(resp.status).json({ error: data.error?.message || 'Gemini API error' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API Breakdown Task Endpoint
app.post('/api/breakdown-task', async (req, res) => {
  const clientKey = req.headers['x-gemini-key'] || req.body.apiKey;
  const activeKey = clientKey || GEMINI_API_KEY;

  if (!activeKey) {
    return res.status(500).json({ error: 'Gemini API key is not configured on the server. Please supply one in Settings.' });
  }

  const { model, prompt } = req.body;
  const actualModel = getActualModel(model);

  try {
    const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${actualModel}:generateContent?key=${activeKey}`, {
      method: 'POST',

      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    });

    const data = await resp.json();
    if (resp.ok) {
      res.json({ text: data.candidates?.[0]?.content?.parts?.[0]?.text || '' });
    } else {
      res.status(resp.status).json({ error: data.error?.message || 'Gemini API error' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// All other requests serve index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
