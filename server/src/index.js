import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const configPath = path.join(rootDir, 'config', 'api.config.json');
const envPath = path.join(rootDir, '.env');

await loadEnvFile(envPath);

const config = JSON.parse(await fs.readFile(configPath, 'utf8'));

const port = Number(process.env.NETAR_SERVER_PORT ?? process.env.PORT ?? 33031);
const upstreamBaseUrl = normalizeRequiredBaseUrl(
  process.env.NETAR_UPSTREAM_BASE_URL ?? config.upstreamBaseUrl,
  'NETAR_UPSTREAM_BASE_URL',
);
const requestTimeoutMs = Number(process.env.NETAR_REQUEST_TIMEOUT_MS ?? config.requestTimeoutMs ?? 20000);
const cookieName = process.env.NETAR_SESSION_COOKIE ?? config.sessionCookieName ?? 'netar.sid';
const sessions = new Map();

async function loadEnvFile(filePath) {
  try {
    const text = await fs.readFile(filePath, 'utf8');
    for (const line of text.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;

      const separatorIndex = trimmed.indexOf('=');
      if (separatorIndex === -1) continue;

      const key = trimmed.slice(0, separatorIndex).trim();
      const rawValue = trimmed.slice(separatorIndex + 1).trim();
      const value = rawValue.replace(/^(['"])(.*)\1$/, '$2');
      if (key && process.env[key] === undefined) {
        process.env[key] = value;
      }
    }
  } catch (error) {
    if (error?.code !== 'ENOENT') {
      throw error;
    }
  }
}

function normalizeBaseUrl(value) {
  return String(value).trim().replace(/\/$/, '');
}

function normalizeRequiredBaseUrl(value, envName) {
  const normalized = normalizeBaseUrl(value ?? '');
  if (!normalized) {
    throw new Error(`${envName} must be configured in server/.env or the process environment`);
  }
  return normalized;
}

function sendJson(res, status, payload, headers = {}) {
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    ...headers,
  });
  res.end(JSON.stringify(payload));
}

function sendText(res, status, text, headers = {}) {
  res.writeHead(status, {
    'content-type': 'text/plain; charset=utf-8',
    ...headers,
  });
  res.end(text);
}

function corsHeaders(req) {
  const origin = req.headers.origin;
  if (!origin) return {};
  return {
    'access-control-allow-origin': origin,
    'access-control-allow-credentials': 'true',
    'access-control-allow-headers': 'content-type, authorization',
    'access-control-allow-methods': 'GET,POST,PUT,DELETE,OPTIONS',
    vary: 'Origin',
  };
}

function parseCookies(req) {
  const raw = req.headers.cookie ?? '';
  return Object.fromEntries(raw.split(';').map((entry) => {
    const [key, ...value] = entry.trim().split('=');
    return [key, decodeURIComponent(value.join('='))];
  }).filter(([key]) => key));
}

function sessionCookie(id, maxAge = 60 * 60 * 8) {
  return `${cookieName}=${encodeURIComponent(id)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}`;
}

function clearSessionCookie() {
  return `${cookieName}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

function currentSession(req) {
  const id = parseCookies(req)[cookieName];
  if (!id) return null;
  const session = sessions.get(id);
  return session ? { id, ...session } : null;
}

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  const text = Buffer.concat(chunks).toString('utf8');
  if (!text) return undefined;
  const contentType = req.headers['content-type'] ?? '';
  if (!contentType.includes('application/json')) return text;
  return JSON.parse(text);
}

async function upstreamRequest({ method, targetPath, query, token, body }) {
  const url = new URL(`${upstreamBaseUrl}/${targetPath.replace(/^\//, '')}`);
  for (const [key, value] of query.entries()) {
    url.searchParams.append(key, value);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), requestTimeoutMs);
  const headers = { accept: 'application/json' };
  const init = { method, headers, signal: controller.signal };

  if (token) {
    headers.authorization = `Bearer ${token}`;
  }

  if (body !== undefined && method !== 'GET') {
    headers['content-type'] = 'application/json';
    init.body = typeof body === 'string' ? body : JSON.stringify(body);
  }

  try {
    const response = await fetch(url, init);
    const contentType = response.headers.get('content-type') ?? 'application/json';
    const text = await response.text();
    return {
      status: response.status,
      contentType,
      text,
    };
  } finally {
    clearTimeout(timeout);
  }
}

function parseEnvelope(text, contentType) {
  if (!text) return {};
  if (!contentType.includes('application/json')) return { data: text };
  return JSON.parse(text);
}

function sessionPayload(session) {
  return {
    username: session.username,
    baseUrl: 'Server managed',
  };
}

async function handleLogin(req, res, headers) {
  const body = await readBody(req);
  const upstream = await upstreamRequest({
    method: 'POST',
    targetPath: '/login',
    query: new URLSearchParams(),
    body,
  });
  const envelope = parseEnvelope(upstream.text, upstream.contentType);
  const token = envelope?.data?.access_token ?? envelope?.data?.token ?? envelope?.access_token ?? envelope?.token;

  if (upstream.status >= 400 || envelope.code === 0 || !token) {
    sendJson(res, upstream.status || 401, envelope, headers);
    return;
  }

  const id = crypto.randomUUID();
  const username = typeof body?.username === 'string' ? body.username : 'operator';
  sessions.set(id, {
    token,
    username,
    createdAt: Date.now(),
  });

  sendJson(res, 200, {
    code: 1,
    msg: envelope.msg ?? 'success',
    data: sessionPayload({ username }),
  }, {
    ...headers,
    'set-cookie': sessionCookie(id),
  });
}

async function handleLogout(req, res, headers) {
  const session = currentSession(req);
  if (session) {
    await upstreamRequest({
      method: 'POST',
      targetPath: '/logout',
      query: new URLSearchParams(),
      token: session.token,
    }).catch(() => undefined);
    sessions.delete(session.id);
  }
  sendJson(res, 200, { code: 1, msg: 'success' }, {
    ...headers,
    'set-cookie': clearSessionCookie(),
  });
}

async function handleLiveProxy(req, res, headers, url) {
  const session = currentSession(req);
  if (!session) {
    sendJson(res, 401, { code: 401, msg: 'Session expired' }, headers);
    return;
  }

  const targetPath = url.pathname === '/api/live' ? '/' : url.pathname.replace(/^\/api\/live/, '') || '/';
  const body = ['GET', 'HEAD'].includes(req.method ?? 'GET') ? undefined : await readBody(req);
  const upstream = await upstreamRequest({
    method: req.method ?? 'GET',
    targetPath,
    query: url.searchParams,
    token: session.token,
    body,
  });

  const responseStatus = upstream.status >= 400 && upstream.status !== 401 ? 200 : upstream.status;
  res.writeHead(responseStatus, {
    'content-type': upstream.contentType,
    ...headers,
  });
  res.end(upstream.text);
}

function handleSession(req, res, headers) {
  const session = currentSession(req);
  if (!session) {
    sendJson(res, 200, { code: 0, msg: 'Session expired' }, headers);
    return;
  }
  sendJson(res, 200, {
    code: 1,
    msg: 'success',
    data: sessionPayload(session),
  }, headers);
}

function handleHealth(_req, res, headers) {
  sendJson(res, 200, {
    code: 1,
    msg: 'success',
    data: {
      upstream: upstreamBaseUrl,
      mutationsEnabled: Boolean(config.mutationsEnabled),
      activeSessions: sessions.size,
    },
  }, headers);
}

const server = http.createServer(async (req, res) => {
  const headers = corsHeaders(req);
  if (req.method === 'OPTIONS') {
    res.writeHead(204, headers);
    res.end();
    return;
  }

  try {
    const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`);

    if (url.pathname === '/api/health' && req.method === 'GET') {
      handleHealth(req, res, headers);
      return;
    }

    if (url.pathname === '/api/session' && req.method === 'GET') {
      handleSession(req, res, headers);
      return;
    }

    if (url.pathname === '/api/login' && req.method === 'POST') {
      await handleLogin(req, res, headers);
      return;
    }

    if (url.pathname === '/api/logout' && req.method === 'POST') {
      await handleLogout(req, res, headers);
      return;
    }

    if (url.pathname === '/api/live' || url.pathname.startsWith('/api/live/')) {
      await handleLiveProxy(req, res, headers, url);
      return;
    }

    sendText(res, 404, 'Not found', headers);
  } catch (error) {
    sendJson(res, 500, {
      code: 500,
      msg: error instanceof Error ? error.message : 'Server error',
    }, headers);
  }
});

server.listen(port, '127.0.0.1', () => {
  console.log(`Netar EMS server listening on http://127.0.0.1:${port}`);
});
