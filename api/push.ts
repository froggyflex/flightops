// /api/push.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';

const SHEETS_ENDPOINT = process.env.SHEETS_ENDPOINT!;
const SHARED_SECRET   = process.env.SHARED_SECRET; // optional simple auth

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS + preflight
  if (req.method === 'OPTIONS') return withCORS(res).status(200).end();
  if (req.method !== 'POST')    return withCORS(res).status(405).json({ ok:false, error:'Method not allowed' });

  // Optional simple auth (add x-api-key from the frontend)
  if (SHARED_SECRET && req.headers['x-api-key'] !== SHARED_SECRET) {
    return withCORS(res).status(401).json({ ok:false, error:'Unauthorized' });
  }

  try {
    const r = await fetch(SHEETS_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
    });
    const text = await r.text();
    let data: any; try { data = JSON.parse(text); } catch { data = { raw: text }; }
    return withCORS(res).status(r.status).json(data);
  } catch (err: any) {
    return withCORS(res).status(500).json({ ok:false, error:String(err) });
  }
}

function withCORS(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key');
  return res;
}
