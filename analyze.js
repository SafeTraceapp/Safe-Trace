export const config = { api: { bodyParser: false } };

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => data += chunk);
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.status(204).end(); return; }
  if (req.method !== 'POST') {
    res.status(405).json({ error: { message: 'Method not allowed' } }); return;
  }

  const API_KEY = process.env.ANTHROPIC_API_KEY;
  if (!API_KEY) {
    res.status(500).json({ error: { message: 'Brak zmiennej ANTHROPIC_API_KEY w ustawieniach Vercel' } }); return;
  }

  let payload;
  try {
    const raw = await readBody(req);
    payload = JSON.parse(raw);
  } catch(e) {
    res.status(400).json({ error: { message: 'Błąd odczytu żądania: ' + e.message } }); return;
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(payload)
    });

    const text = await response.text();
    if (!text) {
      res.status(502).json({ error: { message: 'Pusta odpowiedź z Anthropic (HTTP ' + response.status + ')' } }); return;
    }

    let data;
    try { data = JSON.parse(text); }
    catch(e) { res.status(502).json({ error: { message: 'Nieprawidłowa odpowiedź API: ' + text.slice(0, 300) } }); return; }

    res.status(response.status).json(data);
  } catch (err) {
    res.status(502).json({ error: { message: 'Błąd połączenia: ' + err.message } });
  }
}
