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

function toPositiveInt(value, fallback, min, max) {
  const parsed = Number.parseInt(String(value ?? ''), 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

function sqlString(value) {
  return `'${String(value).replace(/'/g, "''")}'`;
}

function mapAlarmStatus(value) {
  const normalized = String(value ?? 'Active').trim().toLowerCase();
  if (normalized === 'active' || normalized === '1') return '1';
  if (normalized === 'clear' || normalized === 'cleared' || normalized === '0') return '0';
  throw new Error('Invalid alarmStatus filter');
}

function readEnumFilter(query, name, allowedValues) {
  const value = query.get(name);
  if (!value) return null;
  const match = allowedValues.find((allowed) => allowed.toLowerCase() === value.toLowerCase());
  if (!match) {
    throw new Error(`Invalid ${name} filter`);
  }
  return match;
}

function readCodeFilter(query, name) {
  const value = query.get(name);
  if (!value) return null;
  if (!/^[a-zA-Z0-9_-]{1,64}$/.test(value)) {
    throw new Error(`Invalid ${name} filter`);
  }
  return value;
}

const severityFilterValues = new Map([
  ['critical', ['Critical', 'dictData.active_alarm_severity.critical']],
  ['major', ['Major', 'dictData.active_alarm_severity.major']],
  ['minor', ['Minor', 'dictData.active_alarm_severity.minor']],
  ['warning', ['Warning', 'dictData.active_alarm_severity.warning']],
  ['event', ['Event', 'dictData.active_alarm_severity.event']],
]);

const alarmTypeFilterValues = new Map([
  ['communicationalarm', ['CommunicationAlarm', 'dictData.active_alarm_type.communication']],
  ['communication', ['CommunicationAlarm', 'dictData.active_alarm_type.communication']],
  ['equipmentalarm', ['EquipmentAlarm', 'dictData.active_alarm_type.equipment']],
  ['equipment', ['EquipmentAlarm', 'dictData.active_alarm_type.equipment']],
  ['processingfailure', ['ProcessingFailure', 'dictData.active_alarm_type.processingFailure', 'dictData.active_alarm_type.processing_failure']],
  ['environmentalalarm', ['EnvironmentalAlarm', 'dictData.active_alarm_type.environmental']],
  ['environmental', ['EnvironmentalAlarm', 'dictData.active_alarm_type.environmental']],
  ['qualityofservicealarm', ['QualityOfServiceAlarm', 'dictData.active_alarm_type.qualityOfService', 'dictData.active_alarm_type.quality_of_service']],
  ['qualityofservice', ['QualityOfServiceAlarm', 'dictData.active_alarm_type.qualityOfService', 'dictData.active_alarm_type.quality_of_service']],
]);

function enumLookupKey(value) {
  return String(value ?? '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
}

function readMappedFilter(query, name, allowedValues) {
  const value = query.get(name);
  if (!value) return null;
  const mapped = allowedValues.get(enumLookupKey(value));
  if (!mapped) {
    throw new Error(`Invalid ${name} filter`);
  }
  return mapped;
}

function sqlIn(column, values) {
  const uniqueValues = Array.from(new Set(values));
  return uniqueValues.length === 1
    ? `${column}=${sqlString(uniqueValues[0])}`
    : `${column} in (${uniqueValues.map(sqlString).join(',')})`;
}

function buildAlarmWhere(query) {
  const conditions = [`alarm_status=${sqlString(mapAlarmStatus(query.get('alarmStatus')) )}`];
  const neType = readCodeFilter(query, 'neType');
  const alarmCode = readCodeFilter(query, 'alarmCode');
  const severity = readMappedFilter(query, 'origSeverity', severityFilterValues);
  const alarmType = readMappedFilter(query, 'alarmType', alarmTypeFilterValues);

  if (neType) conditions.push(`ne_type=${sqlString(neType)}`);
  if (alarmCode) conditions.push(`alarm_code=${sqlString(alarmCode)}`);
  if (severity) conditions.push(sqlIn('orig_severity', severity));
  if (alarmType) conditions.push(sqlIn('alarm_type', alarmType));

  return conditions.join(' and ');
}

function unwrapDatabaseRows(envelope, tableName = 'alarm') {
  const dataItems = Array.isArray(envelope?.data) ? envelope.data : [];
  return dataItems
    .map((item) => item?.[tableName])
    .filter(Array.isArray);
}

function firstNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

async function upstreamJson({ method = 'GET', targetPath, query, token, body }) {
  const upstream = await upstreamRequest({
    method,
    targetPath,
    query,
    token,
    body,
  });
  return {
    status: upstream.status,
    envelope: parseEnvelope(upstream.text, upstream.contentType),
  };
}

async function selectAlarmDatabase(token, sql, rowsSql) {
  const query = new URLSearchParams({ SQL: sql });
  if (rowsSql) {
    query.set('rowsSQL', rowsSql);
  }

  const response = await upstreamJson({
    targetPath: '/api/rest/databaseManagement/v1/select/omc_db/alarm',
    query,
    token,
  });

  if (response.status >= 400) {
    throw new Error(response.envelope?.msg ?? `Upstream alarm database request failed with HTTP ${response.status}`);
  }

  return response.envelope;
}

async function fetchAlarmDictionary(token, dictType) {
  const response = await upstreamJson({
    targetPath: `/system/dict/data/type/${dictType}`,
    query: new URLSearchParams(),
    token,
  });

  const rows = Array.isArray(response.envelope?.data) ? response.envelope.data : [];
  return new Map(rows.map((row) => [String(row.dictValue), String(row.dictLabel)]));
}

async function fetchAlarmDictionaries(token) {
  const [alarmType, clearType, ackState, severity] = await Promise.all([
    fetchAlarmDictionary(token, 'active_alarm_type'),
    fetchAlarmDictionary(token, 'active_clear_type'),
    fetchAlarmDictionary(token, 'active_ack_state'),
    fetchAlarmDictionary(token, 'active_alarm_severity'),
  ]);

  return {
    alarmType,
    clearType,
    ackState,
    severity,
  };
}

function dictLabel(dictionary, value) {
  const key = String(value ?? '').trim();
  if (!key) return '';
  const direct = dictionary.get(key);
  return direct && !isRawDictKey(direct) ? direct : key;
}

function isRawDictKey(value) {
  return String(value ?? '').trim().toLowerCase().startsWith('dictdata.');
}

function alarmStatusLabel(value) {
  const key = String(value ?? '');
  if (key === '1') return 'Active';
  if (key === '0') return 'Clear';
  return key;
}

const severityLabelFallbacks = new Map([
  ['critical', 'Critical'],
  ['major', 'Major'],
  ['minor', 'Minor'],
  ['warning', 'Warning'],
  ['event', 'Event'],
]);

const alarmTypeLabelFallbacks = new Map([
  ['communication', 'Communication Alarm'],
  ['communicationalarm', 'Communication Alarm'],
  ['equipment', 'Equipment Alarm'],
  ['equipmentalarm', 'Equipment Alarm'],
  ['processingfailure', 'Processing Failure Alarm'],
  ['environmental', 'Environmental Alarm'],
  ['environmentalalarm', 'Environmental Alarm'],
  ['qualityofservice', 'Quality of Service Alarm'],
  ['qualityofservicealarm', 'Quality of Service Alarm'],
]);

function dictTail(value) {
  const key = String(value ?? '').trim();
  return enumLookupKey(key.split('.').pop() ?? key);
}

function dictLabelWithFallback(dictionary, fallbacks, value) {
  const key = String(value ?? '').trim();
  if (!key) return '';
  const direct = dictionary.get(key);
  return (direct && !isRawDictKey(direct) ? direct : undefined)
    ?? fallbacks.get(enumLookupKey(key))
    ?? fallbacks.get(dictTail(key))
    ?? key;
}

function normalizeAlarmRow(row, dictionaries) {
  const alarmTypeCode = String(row.alarm_type ?? '');
  const severityCode = String(row.orig_severity ?? row.perceived_severity ?? '');
  const clearTypeCode = String(row.clear_type ?? '');
  const ackStateCode = String(row.ack_state ?? '');

  return {
    id: row.id,
    alarmId: row.alarm_id,
    alarmSeq: row.alarm_seq,
    alarmCode: row.alarm_code,
    alarmTitle: row.alarm_title || row.specific_problem,
    alarmType: dictLabelWithFallback(dictionaries.alarmType, alarmTypeLabelFallbacks, alarmTypeCode),
    alarmTypeCode,
    alarmStatus: alarmStatusLabel(row.alarm_status),
    alarmStatusCode: row.alarm_status,
    origSeverity: dictLabelWithFallback(dictionaries.severity, severityLabelFallbacks, severityCode),
    origSeverityCode: severityCode,
    perceivedSeverity: row.perceived_severity,
    neType: row.ne_type,
    neId: row.ne_id,
    neName: row.ne_name,
    objectName: row.object_name,
    objectType: row.object_type,
    objectUid: row.object_uid,
    eventTime: row.event_time,
    latestEventTime: row.latest_event_time,
    clearTime: row.clear_time,
    clearType: dictLabel(dictionaries.clearType, clearTypeCode),
    clearTypeCode,
    clearUser: row.clear_user,
    ackState: dictLabel(dictionaries.ackState, ackStateCode),
    ackStateCode,
    ackTime: row.ack_time,
    ackUser: row.ack_user,
    counter: row.counter,
    addInfo: row.add_info,
    locationInfo: row.location_info,
    specificProblem: row.specific_problem,
    specificProblemId: row.specific_problem_id,
    timestamp: row.timestamp,
  };
}

async function handleInternalAlarmList(req, res, headers, url) {
  if (req.method !== 'GET') {
    sendJson(res, 405, { code: 405, msg: 'Method not allowed' }, headers);
    return;
  }

  const session = currentSession(req);
  if (!session) {
    sendJson(res, 401, { code: 401, msg: 'Session expired' }, headers);
    return;
  }

  try {
    const pageNum = toPositiveInt(url.searchParams.get('pageNum'), 1, 1, 100000);
    const pageSize = toPositiveInt(url.searchParams.get('pageSize'), 50, 1, 200);
    const offset = (pageNum - 1) * pageSize;
    const where = buildAlarmWhere(url.searchParams);
    const countSql = `select count(*) as total from alarm where ${where}`;
    const rowsSql = `select * from alarm where ${where} order by event_time desc limit ${offset},${pageSize}`;
    const [databaseEnvelope, dictionaries] = await Promise.all([
      selectAlarmDatabase(session.token, countSql, rowsSql),
      fetchAlarmDictionaries(session.token),
    ]);
    const collections = unwrapDatabaseRows(databaseEnvelope);
    const total = firstNumber(collections[0]?.[0]?.total);
    const rows = (collections[1] ?? []).map((row) => normalizeAlarmRow(row, dictionaries));

    sendJson(res, 200, {
      code: 1,
      msg: 'success',
      data: {
        rows,
        total,
      },
    }, headers);
  } catch (error) {
    sendJson(res, 400, {
      code: 400,
      msg: error instanceof Error ? error.message : 'Alarm adapter failed',
    }, headers);
  }
}

async function handleInternalAlarmCount(req, res, headers, url, group) {
  if (req.method !== 'GET') {
    sendJson(res, 405, { code: 405, msg: 'Method not allowed' }, headers);
    return;
  }

  const session = currentSession(req);
  if (!session) {
    sendJson(res, 401, { code: 401, msg: 'Session expired' }, headers);
    return;
  }

  try {
    const where = buildAlarmWhere(url.searchParams);
    const top = toPositiveInt(url.searchParams.get('top'), 8, 1, 50);
    const dictionaries = await fetchAlarmDictionaries(session.token);
    let sql;
    let rows;

    if (group === 'severity') {
      sql = `select orig_severity, count(*) as total from alarm where ${where} group by orig_severity`;
      rows = unwrapDatabaseRows(await selectAlarmDatabase(session.token, sql))[0] ?? [];
      rows = rows.map((row) => ({
        severity: dictLabelWithFallback(dictionaries.severity, severityLabelFallbacks, row.orig_severity),
        origSeverity: dictLabelWithFallback(dictionaries.severity, severityLabelFallbacks, row.orig_severity),
        origSeverityCode: row.orig_severity,
        total: firstNumber(row.total),
      }));
    } else if (group === 'type') {
      sql = `select alarm_type, count(*) as total from alarm where ${where} group by alarm_type`;
      rows = unwrapDatabaseRows(await selectAlarmDatabase(session.token, sql))[0] ?? [];
      rows = rows.map((row) => ({
        alarmType: dictLabelWithFallback(dictionaries.alarmType, alarmTypeLabelFallbacks, row.alarm_type),
        alarmTypeCode: row.alarm_type,
        total: firstNumber(row.total),
      }));
    } else {
      sql = `select ne_type, ne_id, ne_name, count(*) as total from alarm where ${where} group by ne_type, ne_id, ne_name order by total desc limit 0,${top}`;
      rows = unwrapDatabaseRows(await selectAlarmDatabase(session.token, sql))[0] ?? [];
      rows = rows.map((row) => ({
        neType: row.ne_type,
        neId: row.ne_id,
        neName: row.ne_name,
        total: firstNumber(row.total),
      }));
    }

    sendJson(res, 200, { code: 1, msg: 'success', data: rows }, headers);
  } catch (error) {
    sendJson(res, 400, {
      code: 400,
      msg: error instanceof Error ? error.message : 'Alarm count adapter failed',
    }, headers);
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

    if (url.pathname === '/api/internal/alarm/list') {
      await handleInternalAlarmList(req, res, headers, url);
      return;
    }

    if (url.pathname === '/api/internal/alarm/count/severity') {
      await handleInternalAlarmCount(req, res, headers, url, 'severity');
      return;
    }

    if (url.pathname === '/api/internal/alarm/count/type') {
      await handleInternalAlarmCount(req, res, headers, url, 'type');
      return;
    }

    if (url.pathname === '/api/internal/alarm/count/ne') {
      await handleInternalAlarmCount(req, res, headers, url, 'ne');
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
