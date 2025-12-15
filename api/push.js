// /api/push.js  (CommonJS on Vercel)
const SHEETS_ENDPOINT = process.env.SHEETS_ENDPOINT;
const SHARED_SECRET   = process.env.SHARED_SECRET || ''; // optional

function withCORS(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key');
  return res;
}

module.exports = async function handler(req, res) {
  withCORS(res);

  // CORS preflight
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST')    return res.status(405).json({ ok:false, error:'Method not allowed' });

  // Optional shared secret (good to enable in production)
  if (SHARED_SECRET && req.headers['x-api-key'] !== SHARED_SECRET) {
    return res.status(401).json({ ok:false, error:'Unauthorized' });
  }

  if (!SHEETS_ENDPOINT) {
    return res.status(500).json({ ok:false, error:'Missing SHEETS_ENDPOINT env var' });
  }

  try {
    // Vercel already parses JSON by default. Keep a fallback just in case.
    const payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

    const r = await fetch(SHEETS_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const txt = await r.text();
    let j; try { j = JSON.parse(txt); } catch { j = { ok:false, raw: txt }; }

    
    const normalized = {
      ok: !!j.ok,
      logRow: j.opRow ?? j.logRow ?? j.writtenAt ?? null,
      infoRow: j.infoRow ?? null,
      closure: j.closure ?? null,
      closureError: j.closureError ?? null,
      error: j.error ?? null,
    };

    return res.status(r.ok ? 200 : 500).json(normalized);
  } catch (err) {
    return res.status(500).json({ ok:false, error: String(err) });
  }
};
