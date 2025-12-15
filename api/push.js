// /api/push.js
const SHEETS_ENDPOINT = process.env.SHEETS_ENDPOINT;
const SHARED_SECRET   = process.env.SHARED_SECRET || ''; // optional

function withCORS(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key');
  return res;
}

// small helper to time out fetch
async function fetchWithTimeout(url, opts = {}, ms = 8000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), ms);
  try {
    const r = await fetch(url, { ...opts, signal: controller.signal });
    return r;
  } finally {
    clearTimeout(id);
  }
}

module.exports = async function handler(req, res) {
  withCORS(res);

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST')    return res.status(405).json({ ok:false, error:'Method not allowed' });

  if (SHARED_SECRET && req.headers['x-api-key'] !== SHARED_SECRET) {
    return res.status(401).json({ ok:false, error:'Unauthorized' });
  }
  if (!SHEETS_ENDPOINT) {
    return res.status(500).json({ ok:false, error:'Missing SHEETS_ENDPOINT env var' });
  }

  try {
    const payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

    // 8s budget so the function itself won’t exceed Vercel’s limit
    const r = await fetchWithTimeout(SHEETS_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }, 8000);

    const txt = await r.text();
    let j; try { j = JSON.parse(txt); } catch { j = { ok:false, raw: txt }; }

    // normalize shape
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
    // AbortError or network => report a 504 to the UI
    const msg = String(err && err.name === 'AbortError' ? 'Upstream timed out' : err);
    return res.status(504).json({ ok:false, error: msg });
  }
};
