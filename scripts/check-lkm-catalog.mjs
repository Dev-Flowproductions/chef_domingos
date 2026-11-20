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

if (!BASE || !TOKEN_APP || !HMAC || !STORE) {
  console.error('Missing LKM env in .env.local');
  process.exit(1);
}

function md5Hex(s) {
  return createHash('md5').update(s, 'utf8').digest('hex');
}

function signature(body = '') {
  const ts = Math.floor(Date.now() / 1000).toString();
  const nonce = randomBytes(16).toString('hex');
  const message = nonce + ts + md5Hex(body);
  const hmac = createHmac('sha256', HMAC).update(message).digest('hex');
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

async function getAppToken() {
  const res = await fetch(`${BASE}/api/auth/applicationtoken`, {
    headers: {
      TokenApp: TOKEN_APP,
      StoreExternalId: STORE,
      'X-Signature': signature(),
    },
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`app token ${res.status}: ${text.slice(0, 300)}`);
  const token = parseTok(text);
  if (!token) throw new Error('empty app token');
  return token;
}

async function getClientToken(appJwt, accessToken) {
  const res = await fetch(`${BASE}/api/auth/clienttoken`, {
    headers: {
      TokenApp: TOKEN_APP,
      AccessToken: accessToken,
      StoreExternalId: STORE,
      Authorization: `Bearer ${appJwt}`,
      'X-Signature': signature(),
    },
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`client token ${res.status}: ${text.slice(0, 300)}`);
  const token = parseTok(text);
  if (!token) throw new Error('empty client token');
  return token;
}

async function getCatalog(jwt, label) {
  const res = await fetch(`${BASE}/v2/Vouchers/GetCatalog`, {
    headers: {
      Authorization: `Bearer ${jwt}`,
      'X-Signature': signature(),
      'Content-Type': 'application/json',
    },
  });
  const text = await res.text();
  console.log(`${label}_status`, res.status);
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    console.log(`${label}_raw`, text.slice(0, 500));
    return;
  }
  const items = Array.isArray(data)
    ? data
    : data.Data || data.data || data.Catalog || data.catalog || [];
  if (!Array.isArray(items)) {
    console.log(`${label}_keys`, Object.keys(data || {}));
    console.log(`${label}_preview`, JSON.stringify(data).slice(0, 1000));
    return;
  }
  console.log(`${label}_count`, items.length);
  for (const it of items.slice(0, 100)) {
    console.log(
      JSON.stringify({
        CodCatalog: it.CodCatalog ?? it.codCatalog,
        Descricao: it.Descricao ?? it.descricao ?? it.Nome ?? it.Title,
        Pontos: it.Pontos ?? it.pontos,
        CodLoja: it.CodLoja ?? it.codLoja,
        NomeLoja: it.NomeLoja ?? it.nomeLoja,
        DataValidade: it.DataValidade ?? it.dataValidade,
      }),
    );
  }
}

const appJwt = await getAppToken();
console.log('app_token_ok');
await getCatalog(appJwt, 'app');

if (ACCESS) {
  const clientJwt = await getClientToken(appJwt, ACCESS);
  console.log('client_token_ok');
  await getCatalog(clientJwt, 'client');

  async function hit(path) {
    const res = await fetch(`${BASE}${path}`, {
      headers: {
        Authorization: `Bearer ${clientJwt}`,
        'X-Signature': signature(),
        'Content-Type': 'application/json',
      },
    });
    const text = await res.text();
    console.log('HIT', path, res.status, text.slice(0, 500).replace(/\s+/g, ' '));
  }

  await hit(`/v2/Vouchers/GetCatalog?cod_loja=${STORE}`);
  await hit('/v2/Vouchers/ClientList?ValeStateEnum=Ativo&perPage=20&page=1');

  for (const path of [`/v2/Prizes/List?codLoja=${STORE}&perPage=50&page=1`, '/v2/Prizes/ListAll']) {
    const res = await fetch(`${BASE}${path}`, {
      headers: {
        Authorization: `Bearer ${clientJwt}`,
        'X-Signature': signature(),
        'Content-Type': 'application/json',
      },
    });
    const text = await res.text();
    console.log('PRIZES', path, res.status);
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      console.log(text.slice(0, 300));
      continue;
    }
    const items = Array.isArray(data) ? data : data.Items || data.Data || [];
    console.log('PRIZES_COUNT', items.length);
    for (const it of items) {
      console.log(
        JSON.stringify({
          Code: it.Code,
          Name: it.Name,
          Descricao: it.Descricao,
          Points: it.Points,
          DiscountValue: it.DiscountValue,
          DiscountType: it.DiscountType,
          Reference: it.Reference,
          Stock: it.Stock,
          Date_Start: it.Date_Start,
          Date_End: it.Date_End,
        }),
      );
    }
  }
} else {
  console.log('no_access_token_skip_client');
}
