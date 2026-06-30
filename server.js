import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 8080;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const REGION = process.env.GCP_REGION || 'us-central1';

// Helper to get Google Access Token from Metadata Server (Cloud Run default service account auth)
async function getGcpToken() {
  try {
    const resp = await fetch('http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token', {
      headers: { 'Metadata-Flavor': 'Google' }
    });
    if (!resp.ok) return null;
    const data = await resp.json();
    return data.access_token;
  } catch {
    return null;
  }
}

// Helper to get Google Project ID from Metadata Server
async function getGcpProjectId() {
  try {
    const resp = await fetch('http://metadata.google.internal/computeMetadata/v1/project/project-id', {
      headers: { 'Metadata-Flavor': 'Google' }
    });
    if (!resp.ok) return null;
    return await resp.text();
  } catch {
    return null;
  }
}

// Translate custom model values to standard Vertex AI model IDs
function getActualModel(modelName) {
  const model = modelName || 'gemini-1.5-flash';
  if (model.includes('2.5') || model.includes('3.5') || model.includes('2.0') || model.includes('flash')) {
    return 'gemini-1.5-flash';
  }
  return model;
}

// Perform Gemini call via Vertex AI or Developer API Key
async function executeGeminiCall({ model, systemInstruction, contents, tools, clientKey }) {
  const actualModel = getActualModel(model);
  
  // 1. Try Vertex AI IAM Authentication if running on GCP
  const token = await getGcpToken();
  const projectId = await getGcpProjectId();
  
  if (token && projectId) {
    const url = `https://${REGION}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${REGION}/publishers/google/models/${actualModel}:generateContent`;
    const body = {
      contents,
    };
    if (systemInstruction) {
      body.systemInstruction = { parts: [{ text: systemInstruction }] };
    }
    if (tools) {
      body.tools = tools;
    }

    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(body)
    });

    const data = await resp.json();
    if (resp.ok) return data;
    throw new Error(data.error?.message || 'Vertex AI API error');
  }

  // 2. Fall back to standard Gemini API Key (local/dev mode)
  const activeKey = clientKey || GEMINI_API_KEY;
  if (!activeKey) {
    throw new Error('GCP Service Account token or Gemini API Key not configured on server.');
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${actualModel}:generateContent?key=${activeKey}`;
  const body = {
    contents,
  };
  if (systemInstruction) {
    body.system_instruction = { parts: [{ text: systemInstruction }] };
  }
  if (tools) {
    body.tools = tools;
  }

  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  const data = await resp.json();
  if (resp.ok) return data;
  throw new Error(data.error?.message || 'Gemini API error');
}

// Serve static assets from the Vite dist folder
app.use(express.static(path.join(__dirname, 'dist')));

// API Chat Endpoint
app.post('/api/chat', async (req, res) => {
  const clientKey = req.headers['x-gemini-key'] || req.body.apiKey;
  const { model, persona, contents, tools } = req.body;
  const systemInstruction = `${persona.prompt}\n\nAdditionally, you are connected to the user's live workspace and have access to tools to view and modify it. Use these tools whenever the user asks you to list, add, delete, toggle, prioritize, or break down tasks and habits. Speak in the persona voice. Keep your final answers concise.`;

  try {
    const data = await executeGeminiCall({ model, systemInstruction, contents, tools, clientKey });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API Draft Generation Endpoint
app.post('/api/generate-drafts', async (req, res) => {
  const clientKey = req.headers['x-gemini-key'] || req.body.apiKey;
  const { model, emailPrompt, templatePrompt } = req.body;

  try {
    const [emailData, templateData] = await Promise.all([
      executeGeminiCall({ model, contents: [{ parts: [{ text: emailPrompt }] }], clientKey }),
      executeGeminiCall({ model, contents: [{ parts: [{ text: templatePrompt }] }], clientKey })
    ]);

    res.json({
      email: emailData.candidates?.[0]?.content?.parts?.[0]?.text || '',
      template: templateData.candidates?.[0]?.content?.parts?.[0]?.text || '',
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API Eisenhower Categorization Endpoint
app.post('/api/categorize-tasks', async (req, res) => {
  const clientKey = req.headers['x-gemini-key'] || req.body.apiKey;
  const { model, prompt } = req.body;

  try {
    const data = await executeGeminiCall({ model, contents: [{ parts: [{ text: prompt }] }], clientKey });
    res.json({ text: data.candidates?.[0]?.content?.parts?.[0]?.text || '' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API Breakdown Task Endpoint
app.post('/api/breakdown-task', async (req, res) => {
  const clientKey = req.headers['x-gemini-key'] || req.body.apiKey;
  const { model, prompt } = req.body;

  try {
    const data = await executeGeminiCall({ model, contents: [{ parts: [{ text: prompt }] }], clientKey });
    res.json({ text: data.candidates?.[0]?.content?.parts?.[0]?.text || '' });
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
