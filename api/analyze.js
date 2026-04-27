export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.status(204).end(); return; }
  if (req.method !== 'POST') {
    res.status(405).json({ error: { message: 'Method not allowed' } });
    return;
  }

  const API_KEY = process.env.ANTHROPIC_API_KEY;
  if (!API_KEY) {
    res.status(500).json({ error: { message: 'Brak klucza ANTHROPIC_API_KEY' } });
    return;
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(req.body)
    });

    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch(e) {
      res.status(502).json({ error: { message: 'Błąd odpowiedzi Anthropic: ' + text.slice(0, 200) } });
      return;
    }
    res.status(response.status).json(data);

  } catch (err) {
    res.status(502).json({ error: { message: 'Błąd: ' + err.message } });
  }
}
