// /api/push.cjs  (CommonJS)
const SHEETS_ENDPOINT = process.env.SHEETS_ENDPOINT;
const SHARED_SECRET   = process.env.SHARED_SECRET; // optional

function withCORS(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key');
  return res;
}

module.exports = async function handler(req, res) {
  // CORS / preflight
  if (req.method === 'OPTIONS') return withCORS(res).status(200).end();
  if (req.method !== 'POST')    return withCORS(res).status(405).json({ ok:false, error:'Method not allowed' });

  if (SHARED_SECRET && req.headers['x-api-key'] !== SHARED_SECRET) {
    return withCORS(res).status(401).json({ ok:false, error:'Unauthorized' });
  }

  if (!SHEETS_ENDPOINT) {
    return withCORS(res).status(500).json({ ok:false, error:'Missing SHEETS_ENDPOINT env var' });
  }

  try {
    const payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

    const r = await fetch(SHEETS_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const txt = await r.text();
    let data; try { data = JSON.parse(txt); } catch { data = { raw: txt }; }

    return withCORS(res).status(r.status).json(data);
  } catch (err) {
    return withCORS(res).status(500).json({ ok:false, error: String(err) });
  }
};
