export const config = { api: { bodyParser: true } };

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
    res.status(500).json({ error: { message: 'Brak klucza ANTHROPIC_API_KEY w zmiennych środowiskowych Vercel' } }); return;
  }

  let payload;
  try {
    payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch(e) {
    res.status(400).json({ error: { message: 'Nie można sparsować body: ' + e.message } }); return;
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
      res.status(502).json({ error: { message: 'Anthropic API zwróciło pustą odpowiedź (status: ' + response.status + ')' } }); return;
    }

    let data;
    try { data = JSON.parse(text); }
    catch(e) { res.status(502).json({ error: { message: 'Zła odpowiedź z API: ' + text.slice(0, 200) } }); return; }

    res.status(response.status).json(data);
  } catch (err) {
    res.status(502).json({ error: { message: 'Błąd połączenia z Anthropic: ' + err.message } });
  }
}
