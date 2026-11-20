import { createHash, createHmac, randomBytes } from 'crypto';
import { readFileSync } from 'fs';

const env = Object.fromEntries(
  readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
    .split(/\r?\n/)
    .filter((l) => l && !l.startsWith('#') && l.includes('='))
    .map((l) => {
      const i = l.indexOf('=');
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    }),
);

const BASE = (env.LKM_BASE_URL || '').replace(/\/$/, '');
const TOKEN_APP = env.LKM_TOKEN_APP || '';
const HMAC = env.LKM_HMAC_SECRET || env.LKM_PARTNER_KEY || '';
const STORE = env.LKM_STORE_EXTERNAL_ID || '';
const ACCESS = process.env.LKM_ACCESS_TOKEN || '';

function md5Hex(s) {
  return createHash('md5').update(s, 'utf8').digest('hex');
}
function signature(body = '') {
  const ts = Math.floor(Date.now() / 1000).toString();
  const nonce = randomBytes(16).toString('hex');
  const hmac = createHmac('sha256', HMAC)
    .update(nonce + ts + md5Hex(body))
    .digest('hex');
  return `${ts}:${nonce}:${hmac}`;
}
function parseTok(text) {
  try {
    const d = JSON.parse(text);
    return (d.Token || d.token || '').trim();
  } catch {
    return String(text).replace(/"/g, '').trim();
  }
}

const r1 = await fetch(`${BASE}/api/auth/applicationtoken`, {
  headers: { TokenApp: TOKEN_APP, StoreExternalId: STORE, 'X-Signature': signature() },
});
const t1 = await r1.text();
if (!r1.ok) throw new Error('app token fail ' + r1.status + ' ' + t1.slice(0, 200));
const appJwt = parseTok(t1);

const r2 = await fetch(`${BASE}/api/auth/clienttoken`, {
  headers: {
    TokenApp: TOKEN_APP,
    AccessToken: ACCESS,
    StoreExternalId: STORE,
    Authorization: `Bearer ${appJwt}`,
    'X-Signature': signature(),
  },
});
const t2 = await r2.text();
if (!r2.ok) throw new Error('client token fail ' + r2.status + ' ' + t2.slice(0, 200));
const clientJwt = parseTok(t2);

async function get(path) {
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      Authorization: `Bearer ${clientJwt}`,
      'X-Signature': signature(),
      'Content-Type': 'application/json',
    },
  });
  const text = await res.text();
  console.log(path, res.status, text.slice(0, 500));
}

console.log('card_check_env_store', STORE, 'base', BASE);
await get('/v2/Points');
await get('/v2/GetConvertedPoints');
await get('/v2/GetPoints');
await get('/v2/Card/CardStatistic');
await get('/v2/Transactions/v2?contaCartao=true&perPage=5&page=1');
