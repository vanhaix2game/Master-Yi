const json = (body, status = 200) => new Response(JSON.stringify(body), {status, headers: {'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store'}});
const publicJson = (body, status = 200) => new Response(JSON.stringify(body), {status, headers: {'content-type': 'application/json; charset=utf-8', 'cache-control': 'public, max-age=30', 'access-control-allow-origin': '*'}});
const b64url = bytes => btoa(String.fromCharCode(...new Uint8Array(bytes))).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
const sha256 = async text => [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)))].map(value => value.toString(16).padStart(2, '0')).join('');
const normalizeKey = value => String(value || '').trim().toUpperCase();
const now = () => Math.floor(Date.now() / 1000);
const isAdmin = (request, env) => request.headers.get('authorization') === `Bearer ${env.ADMIN_TOKEN}`;
const cleanTelemetryValue = (value, fallback = 'unknown') => {
  const cleaned = String(value || '').trim().slice(0, 64);
  return /^[A-Za-z0-9._ -]+$/.test(cleaned) ? cleaned : fallback;
};
const portableSegment = value => String(value || '').trim().replace(/[/\\]/g, '_').replace(/[:"<>|?*]/g, '_') || '未命名';
function portableOutputPath(value, factoryName = '', stepTitle = '') {
  const raw = String(value || '').trim().replace(/\\/g, '/');
  if (!raw) return '';
  const absolute = /^([A-Za-z]:\/|\/|~\/)/.test(raw);
  if (!absolute && !raw.split('/').includes('..')) {
    const parts = raw.split('/').filter(part => part && part !== '.' && part !== '..');
    if (parts.length) return parts.join('/');
  }
  return `${portableSegment(factoryName)}/${portableSegment(stepTitle)}`;
}
function sanitizeStoreFactory(factory) {
  if (!factory || typeof factory !== 'object') return factory;
  const name = String(factory.name || '').trim();
  const steps = Array.isArray(factory.steps) ? factory.steps : [];
  return {...factory, steps: steps.map(step => {
    if (!step || typeof step !== 'object') return step;
    const title = String(step.title || step.id || '').trim();
    const outputPath = portableOutputPath(step.outputPath || '', name, title);
    const outputs = Array.isArray(step.outputs) ? step.outputs.map(output => {
      if (!output || typeof output !== 'object' || output.path === undefined) return output;
      return {...output, path: portableOutputPath(output.path || '', name, title)};
    }) : step.outputs;
    return {...step, outputPath, outputs};
  })};
}

async function signingKey(env) {
  return crypto.subtle.importKey('jwk', JSON.parse(env.SIGNING_PRIVATE_JWK), {name: 'ECDSA', namedCurve: 'P-256'}, false, ['sign']);
}

async function signedEnvelope(payload, env) {
  const payloadBytes = new TextEncoder().encode(JSON.stringify(payload));
  const signature = await crypto.subtle.sign({name: 'ECDSA', hash: 'SHA-256'}, await signingKey(env), payloadBytes);
  return {payload: b64url(payloadBytes), signature: b64url(signature)};
}

async function activate(request, env) {
  const body = await request.json();
  const licenseKey = normalizeKey(body.license_key), deviceId = String(body.device_id || '').trim();
  if (!licenseKey || !deviceId || deviceId.length > 128) return json({error: '授權碼或裝置資訊不完整'}, 400);
  let license = await env.DB.prepare('SELECT id, plan, expires_at, duration_days, activated_at, active, max_devices FROM licenses WHERE code_hash = ?').bind(await sha256(licenseKey)).first();
  if (!license || !license.active) return json({error: '授權碼不存在或已停用'}, 403);
  const current = now();
  if (license.plan === 'monthly' && !license.expires_at) {
    const durationDays = Math.max(1, Number(license.duration_days || 31));
    await env.DB.prepare('UPDATE licenses SET activated_at = ?, expires_at = ? WHERE id = ? AND expires_at IS NULL').bind(current, current + durationDays * 86400, license.id).run();
    license = await env.DB.prepare('SELECT id, plan, expires_at, duration_days, activated_at, active, max_devices FROM licenses WHERE id = ?').bind(license.id).first();
  }
  if (license.plan === 'monthly' && (!license.expires_at || current > license.expires_at)) return json({error: '月費授權已到期'}, 403);
  const existing = await env.DB.prepare('SELECT 1 AS found FROM activations WHERE license_id = ? AND device_id = ?').bind(license.id, deviceId).first();
  if (!existing) {
    const count = await env.DB.prepare('SELECT COUNT(*) AS total FROM activations WHERE license_id = ?').bind(license.id).first();
    if (Number(count.total) >= Number(license.max_devices)) return json({error: '此授權碼已達裝置數量上限'}, 403);
    await env.DB.prepare('INSERT INTO activations (license_id, device_id, first_seen_at, last_seen_at) VALUES (?, ?, ?, ?)').bind(license.id, deviceId, current, current).run();
  } else {
    await env.DB.prepare('UPDATE activations SET last_seen_at = ? WHERE license_id = ? AND device_id = ?').bind(current, license.id, deviceId).run();
  }
  const offlineUntil = license.plan === 'lifetime' ? null : Math.min(Number(license.expires_at), current + 7 * 86400);
  return json(await signedEnvelope({schema_version: 1, active: true, plan: license.plan, expires_at: license.expires_at || null, offline_until: offlineUntil, device_id: deviceId, issued_at: current}, env));
}

function randomLicenseKey() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', bytes = crypto.getRandomValues(new Uint8Array(16));
  const value = [...bytes].map(byte => alphabet[byte % alphabet.length]).join('');
  return `FLOW-${value.slice(0,4)}-${value.slice(4,8)}-${value.slice(8,12)}-${value.slice(12)}`;
}

async function createLicense(request, env) {
  if (!isAdmin(request, env)) return json({error: '未授權'}, 401);
  const body = await request.json(), plan = String(body.plan || '');
  if (!['monthly', 'lifetime'].includes(plan)) return json({error: 'plan 必須是 monthly 或 lifetime'}, 400);
  const count = Math.max(1, Math.min(100, Number(body.count || 1))), current = now();
  const legacyMonths = body.expires_at ? Math.max(1, Math.round((Number(body.expires_at) - current) / (31 * 86400))) : 1;
  const durationMonths = plan === 'monthly' ? Math.max(1, Math.min(120, Number(body.duration_months || legacyMonths))) : null;
  const durationDays = durationMonths ? durationMonths * 31 : null;
  const maxDevices = Math.max(1, Math.min(20, Number(body.max_devices || 3)));
  const keys = Array.from({length: count}, () => randomLicenseKey());
  const statements = await Promise.all(keys.map(async key => env.DB.prepare('INSERT INTO licenses (code_hash, code_suffix, plan, expires_at, duration_days, activated_at, active, max_devices, created_at) VALUES (?, ?, ?, NULL, ?, NULL, 1, ?, ?)').bind(await sha256(key), key.slice(-4), plan, durationDays, maxDevices, current)));
  const inserted = await env.DB.batch(statements);
  const licenses = keys.map((key, index) => ({id: inserted[index].meta.last_row_id, license_key: key, plan, duration_months: durationMonths, expires_at: null, activated_at: null, max_devices: maxDevices}));
  return json(body.count === undefined ? licenses[0] : {licenses}, 201);
}

async function listLicenses(request, env) {
  if (!isAdmin(request, env)) return json({error: '未授權'}, 401);
  const url = new URL(request.url);
  const page = Math.max(1, Number.parseInt(url.searchParams.get('page') || '1', 10));
  const pageSize = Math.max(1, Math.min(100, Number.parseInt(url.searchParams.get('page_size') || '10', 10)));
  const sortColumns = {
    id: 'l.id', plan: 'l.plan', active: 'l.active', activated_at: 'l.activated_at',
    expires_at: 'l.expires_at', device_count: 'device_count', created_at: 'l.created_at'
  };
  const sort = sortColumns[url.searchParams.get('sort')] || sortColumns.id;
  const direction = url.searchParams.get('direction') === 'asc' ? 'ASC' : 'DESC';
  const offset = (page - 1) * pageSize;
  const summary = await env.DB.prepare(`SELECT
    COUNT(*) AS total,
    SUM(CASE WHEN active = 1 THEN 1 ELSE 0 END) AS active,
    (SELECT COUNT(*) FROM activations) AS devices
    FROM licenses`).first();
  const result = await env.DB.prepare(`SELECT l.id, l.code_suffix, l.plan, l.expires_at, l.duration_days, l.activated_at, l.active, l.max_devices, l.created_at,
    COUNT(a.device_id) AS device_count, MAX(a.last_seen_at) AS last_seen_at
    FROM licenses l LEFT JOIN activations a ON a.license_id = l.id
    GROUP BY l.id ORDER BY ${sort} ${direction}, l.id DESC LIMIT ? OFFSET ?`).bind(pageSize, offset).all();
  return json({
    licenses: result.results || [],
    summary: {total: Number(summary.total || 0), active: Number(summary.active || 0), devices: Number(summary.devices || 0)},
    pagination: {page, page_size: pageSize, total: Number(summary.total || 0)}
  });
}

async function updateLicense(request, env, id) {
  if (!isAdmin(request, env)) return json({error: '未授權'}, 401);
  const current = await env.DB.prepare('SELECT * FROM licenses WHERE id = ?').bind(id).first();
  if (!current) return json({error: '找不到授權記錄'}, 404);
  const body = await request.json();
  const plan = ['monthly', 'lifetime'].includes(body.plan) ? body.plan : current.plan;
  const active = body.active === undefined ? current.active : (body.active ? 1 : 0);
  const maxDevices = body.max_devices === undefined ? current.max_devices : Math.max(1, Math.min(20, Number(body.max_devices)));
  let expiresAt = body.expires_at === undefined ? current.expires_at : (body.expires_at === null ? null : Number(body.expires_at));
  let activatedAt = current.activated_at, durationDays = current.duration_days;
  if (plan === 'lifetime') { expiresAt = null; activatedAt = null; durationDays = null; }
  else {
    const durationMonths = body.duration_months === undefined ? Math.max(1, Math.round(Number(durationDays || 31) / 31)) : Math.max(1, Math.min(120, Number(body.duration_months)));
    durationDays = durationMonths * 31;
    if (current.plan === 'lifetime') { expiresAt = null; activatedAt = null; }
    if (activatedAt && !expiresAt) expiresAt = Number(activatedAt) + durationDays * 86400;
  }
  await env.DB.prepare('UPDATE licenses SET plan = ?, expires_at = ?, duration_days = ?, activated_at = ?, active = ?, max_devices = ? WHERE id = ?').bind(plan, expiresAt, durationDays, activatedAt, active, maxDevices, id).run();
  return json({ok: true});
}

async function resetActivations(request, env, id) {
  if (!isAdmin(request, env)) return json({error: '未授權'}, 401);
  await env.DB.prepare('DELETE FROM activations WHERE license_id = ?').bind(id).run();
  return json({ok: true});
}

async function recordInstallTelemetry(request, env) {
  const body = await request.json();
  const eventType = String(body.event || '');
  const installationId = String(body.installation_id || '').trim();
  const eventId = String(body.event_id || '').trim();
  const version = cleanTelemetryValue(body.version, '');
  const platform = cleanTelemetryValue(body.platform);
  const architecture = cleanTelemetryValue(body.architecture);
  if (!['install', 'update'].includes(eventType) || installationId.length < 16 || installationId.length > 128 ||
      eventId.length < 16 || eventId.length > 128 || !/^\d+\.\d+\.\d+$/.test(version)) {
    return json({error: '安装统计资料格式不正确'}, 400);
  }
  const current = now(), deviceHash = await sha256(installationId), eventHash = await sha256(eventId);
  const inserted = await env.DB.prepare(`INSERT OR IGNORE INTO installation_events
    (event_id_hash, device_hash, event_type, version, platform, architecture, occurred_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)`).bind(eventHash, deviceHash, eventType, version, platform, architecture, current).run();
  if (!Number(inserted.meta.changes || 0)) return json({ok: true, deduplicated: true}, 202);
  const installIncrement = eventType === 'install' ? 1 : 0;
  const updateIncrement = eventType === 'update' ? 1 : 0;
  await env.DB.prepare(`INSERT INTO installations
    (device_hash, platform, architecture, current_version, first_installed_at, last_seen_at, install_count, update_count)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(device_hash) DO UPDATE SET
      platform = excluded.platform,
      architecture = excluded.architecture,
      current_version = excluded.current_version,
      last_seen_at = excluded.last_seen_at,
      install_count = install_count + excluded.install_count,
      update_count = update_count + excluded.update_count`)
    .bind(deviceHash, platform, architecture, version, current, current, installIncrement, updateIncrement).run();
  return json({ok: true}, 202);
}

async function installStats(request, env) {
  if (!isAdmin(request, env)) return json({error: '未授权'}, 401);
  const current = now();
  const dayStart = current - ((current + 8 * 3600) % 86400);
  const monthDate = new Date((current + 8 * 3600) * 1000);
  const monthStart = Math.floor(Date.UTC(monthDate.getUTCFullYear(), monthDate.getUTCMonth(), 1) / 1000) - 8 * 3600;
  const summary = await env.DB.prepare(`SELECT
    (SELECT COUNT(*) FROM installations) AS unique_devices,
    (SELECT COUNT(*) FROM installation_events WHERE event_type = 'install') AS install_events,
    (SELECT COUNT(*) FROM installation_events WHERE event_type = 'update') AS update_events,
    (SELECT COUNT(DISTINCT device_hash) FROM installation_events WHERE event_type = 'install' AND occurred_at >= ?) AS installs_today,
    (SELECT COUNT(DISTINCT device_hash) FROM installation_events WHERE event_type = 'install' AND occurred_at >= ?) AS installs_month`)
    .bind(dayStart, monthStart).first();
  const versions = await env.DB.prepare(`SELECT current_version AS version, COUNT(*) AS devices
    FROM installations GROUP BY current_version ORDER BY devices DESC, current_version DESC LIMIT 20`).all();
  const platforms = await env.DB.prepare(`SELECT platform, architecture, COUNT(*) AS devices
    FROM installations GROUP BY platform, architecture ORDER BY devices DESC LIMIT 20`).all();
  return json({
    summary,
    versions: versions.results || [],
    platforms: platforms.results || [],
    timezone: 'Asia/Shanghai'
  });
}

async function installEvents(request, env) {
  if (!isAdmin(request, env)) return json({error: '未授权'}, 401);
  const url = new URL(request.url);
  const page = Math.max(1, Number.parseInt(url.searchParams.get('page') || '1', 10));
  const pageSize = Math.max(1, Math.min(100, Number.parseInt(url.searchParams.get('page_size') || '10', 10)));
  const offset = (page - 1) * pageSize;
  const count = await env.DB.prepare('SELECT COUNT(*) AS total FROM installation_events').first();
  const recent = await env.DB.prepare(`SELECT substr(device_hash, 1, 10) AS device, event_type, version, platform, architecture, occurred_at
    FROM installation_events ORDER BY occurred_at DESC, id DESC LIMIT ? OFFSET ?`).bind(pageSize, offset).all();
  return json({
    events: recent.results || [],
    pagination: {page, page_size: pageSize, total: Number(count.total || 0)},
    timezone: 'Asia/Shanghai'
  });
}

async function authorizeStore(body, env) {
  const licenseKey = normalizeKey(body.license_key), deviceId = String(body.device_id || '').trim();
  if (!licenseKey || !deviceId) throw Object.assign(new Error('此操作需要有效授權碼'), {status: 401});
  const license = await env.DB.prepare('SELECT id, plan, expires_at, active FROM licenses WHERE code_hash = ?').bind(await sha256(licenseKey)).first();
  const current = now();
  if (!license || !license.active || (license.plan === 'monthly' && (!license.expires_at || current > Number(license.expires_at)))) {
    throw Object.assign(new Error('授權碼已失效或到期'), {status: 403});
  }
  const activation = await env.DB.prepare('SELECT 1 AS found FROM activations WHERE license_id = ? AND device_id = ?').bind(license.id, deviceId).first();
  if (!activation) throw Object.assign(new Error('此裝置尚未通過授權驗證'), {status: 403});
  return {license, deviceId};
}

async function listStoreFactories(request, env) {
  const url = new URL(request.url), query = String(url.searchParams.get('q') || '').trim().slice(0, 80);
  const pattern = `%${query}%`;
  const result = query
    ? await env.DB.prepare(`SELECT id, name, description, factory_json FROM store_factories
        WHERE status = 'published' AND (name LIKE ? OR description LIKE ?)
        ORDER BY updated_at DESC, id DESC LIMIT 100`).bind(pattern, pattern).all()
    : await env.DB.prepare(`SELECT id, name, description, factory_json FROM store_factories
        WHERE status = 'published' ORDER BY updated_at DESC, id DESC LIMIT 100`).all();
  const factories = (result.results || []).map(row => {
    let factory = {};
    try { factory = JSON.parse(row.factory_json); } catch {}
    return {id: row.id, name: row.name, description: row.description, employee_icon: String(factory.employee_icon || 'assistant_a')};
  });
  return publicJson({factories});
}

async function storeFactoryDetail(env, id) {
  const row = await env.DB.prepare(`SELECT id, name, description, factory_json
    FROM store_factories WHERE id = ? AND status = 'published'`).bind(id).first();
  if (!row) return publicJson({error: '找不到商店工廠'}, 404);
  const factory = JSON.parse(row.factory_json);
  return publicJson({factory: {id: row.id, name: row.name, description: row.description, resume: String(factory.resume || ''), employee_icon: String(factory.employee_icon || 'assistant_a'), steps: (factory.steps || []).map(step => ({title: step.title || step.id}))}});
}

async function publishStoreFactory(request, env) {
  const body = await request.json(), auth = await authorizeStore(body, env), factory = sanitizeStoreFactory(body.factory);
  if (!factory || typeof factory !== 'object' || !Array.isArray(factory.steps)) return json({error: '工廠配置格式不正確'}, 400);
  const sourceId = String(factory.id || '').trim().slice(0, 160);
  const name = String(factory.name || '').trim().slice(0, 80), description = String(factory.description || '').trim().slice(0, 300);
  const serialized = JSON.stringify(factory);
  if (!sourceId || !name || !description) return json({error: '上傳前必須填寫員工 ID、名稱與簡介'}, 400);
  if (serialized.length > 512 * 1024) return json({error: '工廠配置不可超過 512 KB'}, 413);
  const sensitive = /(authorization\s*:|bearer\s+[a-z0-9._-]{12,}|api[_-]?key\s*[:=]|token\s*[:=]\s*['"][^'"]{8,})/i;
  if (sensitive.test(serialized)) return json({error: '配置疑似包含 Token 或密鑰，請移除後再上傳'}, 400);
  const current = now();
  const existing = await env.DB.prepare(`SELECT id FROM store_factories
    WHERE owner_license_id = ? AND json_extract(factory_json, '$.id') = ?
    ORDER BY id DESC LIMIT 1`).bind(auth.license.id, sourceId).first();
  if (existing) {
    await env.DB.batch([
      env.DB.prepare(`UPDATE store_factories
        SET name = ?, description = ?, factory_json = ?, schema_version = 1,
            status = 'pending', review_note = NULL, reviewed_at = NULL, reviewed_by = NULL, updated_at = ?
        WHERE id = ? AND owner_license_id = ?`).bind(name, description, serialized, current, existing.id, auth.license.id),
      env.DB.prepare(`UPDATE store_factories SET status = 'withdrawn', updated_at = ?
        WHERE owner_license_id = ? AND id != ? AND json_extract(factory_json, '$.id') = ?`).bind(current, auth.license.id, existing.id, sourceId)
    ]);
    return json({factory: {id: existing.id, name, description, status: 'pending'}, updated: true, message: '員工更新已送交管理員審核；通過後將覆蓋原市場內容'});
  }
  const inserted = await env.DB.prepare(`INSERT INTO store_factories
    (owner_license_id, name, description, factory_json, schema_version, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, 1, 'pending', ?, ?)`).bind(auth.license.id, name, description, serialized, current, current).run();
  return json({factory: {id: inserted.meta.last_row_id, name, description, status: 'pending'}, message: '已送交管理員審核'}, 201);
}

async function downloadStoreFactory(request, env, id) {
  const body = await request.json(), auth = await authorizeStore(body, env);
  const row = await env.DB.prepare(`SELECT factory_json FROM store_factories
    WHERE id = ? AND status = 'published'`).bind(id).first();
  if (!row) return json({error: '找不到商店工廠'}, 404);
  const current = now(), deviceHash = await sha256(auth.deviceId);
  await env.DB.batch([
    env.DB.prepare('UPDATE store_factories SET download_count = download_count + 1 WHERE id = ?').bind(id),
    env.DB.prepare('INSERT INTO store_downloads (factory_id, license_id, device_hash, downloaded_at) VALUES (?, ?, ?, ?)').bind(id, auth.license.id, deviceHash, current)
  ]);
  return json({factory: sanitizeStoreFactory(JSON.parse(row.factory_json))});
}

async function listOwnStoreFactories(request, env) {
  const body = await request.json(), auth = await authorizeStore(body, env);
  const result = await env.DB.prepare(`SELECT id, name, description, status, review_note, created_at, updated_at, factory_json
    FROM store_factories WHERE owner_license_id = ? ORDER BY updated_at DESC, id DESC`).bind(auth.license.id).all();
  const factories = (result.results || []).map(row => {
    let factory = {};
    try { factory = JSON.parse(row.factory_json); } catch {}
    const {factory_json, ...summary} = row;
    return {...summary, employee_icon: String(factory.employee_icon || 'assistant_a')};
  });
  return json({factories});
}

async function withdrawOwnStoreFactory(request, env, id) {
  const body = await request.json(), auth = await authorizeStore(body, env);
  const current = await env.DB.prepare('SELECT owner_license_id FROM store_factories WHERE id = ?').bind(id).first();
  if (!current) return json({error: '找不到商店工廠'}, 404);
  if (Number(current.owner_license_id) !== Number(auth.license.id)) return json({error: '只有原上傳者可以下架'}, 403);
  await env.DB.prepare(`UPDATE store_factories SET status = 'withdrawn', updated_at = ? WHERE id = ?`).bind(now(), id).run();
  return json({ok: true, status: 'withdrawn'});
}

async function listAdminStoreFactories(request, env) {
  if (!isAdmin(request, env)) return json({error: '未授權'}, 401);
  const url = new URL(request.url), status = String(url.searchParams.get('status') || 'all');
  const allowed = ['pending', 'published', 'rejected', 'withdrawn'];
  const summary = await env.DB.prepare(`SELECT
    COUNT(*) AS total,
    SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending,
    SUM(CASE WHEN status = 'published' THEN 1 ELSE 0 END) AS published,
    SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) AS rejected,
    SUM(CASE WHEN status = 'withdrawn' THEN 1 ELSE 0 END) AS withdrawn
    FROM store_factories`).first();
  const result = allowed.includes(status)
    ? await env.DB.prepare(`SELECT sf.id, sf.name, sf.description, sf.status, sf.review_note, sf.created_at, sf.updated_at,
        sf.download_count, l.code_suffix AS owner_suffix FROM store_factories sf
        LEFT JOIN licenses l ON l.id = sf.owner_license_id WHERE sf.status = ? ORDER BY sf.updated_at DESC`).bind(status).all()
    : await env.DB.prepare(`SELECT sf.id, sf.name, sf.description, sf.status, sf.review_note, sf.created_at, sf.updated_at,
        sf.download_count, l.code_suffix AS owner_suffix FROM store_factories sf
        LEFT JOIN licenses l ON l.id = sf.owner_license_id ORDER BY sf.updated_at DESC`).all();
  return json({factories: result.results || [], summary});
}

async function reviewStoreFactory(request, env, id) {
  if (!isAdmin(request, env)) return json({error: '未授權'}, 401);
  const body = await request.json(), action = String(body.action || ''), note = String(body.note || '').trim().slice(0, 500);
  const statuses = {approve: 'published', reject: 'rejected', unpublish: 'withdrawn'};
  const status = statuses[action];
  if (!status) return json({error: '不支援的審核操作'}, 400);
  const existing = await env.DB.prepare('SELECT id FROM store_factories WHERE id = ?').bind(id).first();
  if (!existing) return json({error: '找不到商店工廠'}, 404);
  await env.DB.prepare(`UPDATE store_factories SET status = ?, review_note = ?, reviewed_at = ?, reviewed_by = 'admin', updated_at = ? WHERE id = ?`)
    .bind(status, note || null, now(), now(), id).run();
  return json({ok: true, status});
}

export default {
  async fetch(request, env) {
    try {
      const url = new URL(request.url);
      if (request.method === 'GET' && url.pathname === '/health') return json({ok: true, service: 'flowfactory-license'});
      if (request.method === 'POST' && url.pathname === '/v1/activate') return activate(request, env);
      if (request.method === 'POST' && url.pathname === '/v1/telemetry/install') return recordInstallTelemetry(request, env);
      if (request.method === 'GET' && url.pathname === '/v1/store/factories') return listStoreFactories(request, env);
      const storeDetailMatch = url.pathname.match(/^\/v1\/store\/factories\/(\d+)$/);
      if (request.method === 'GET' && storeDetailMatch) return storeFactoryDetail(env, Number(storeDetailMatch[1]));
      if (request.method === 'POST' && url.pathname === '/v1/store/factories') return publishStoreFactory(request, env);
      if (request.method === 'POST' && url.pathname === '/v1/store/mine') return listOwnStoreFactories(request, env);
      const storeDownloadMatch = url.pathname.match(/^\/v1\/store\/factories\/(\d+)\/download$/);
      if (request.method === 'POST' && storeDownloadMatch) return downloadStoreFactory(request, env, Number(storeDownloadMatch[1]));
      const storeWithdrawMatch = url.pathname.match(/^\/v1\/store\/factories\/(\d+)\/withdraw$/);
      if (request.method === 'POST' && storeWithdrawMatch) return withdrawOwnStoreFactory(request, env, Number(storeWithdrawMatch[1]));
      if (request.method === 'POST' && url.pathname === '/v1/admin/licenses') return createLicense(request, env);
      if (request.method === 'GET' && url.pathname === '/v1/admin/licenses') return listLicenses(request, env);
      if (request.method === 'GET' && url.pathname === '/v1/admin/install-stats') return installStats(request, env);
      if (request.method === 'GET' && url.pathname === '/v1/admin/install-events') return installEvents(request, env);
      if (request.method === 'GET' && url.pathname === '/v1/admin/store') return listAdminStoreFactories(request, env);
      const storeReviewMatch = url.pathname.match(/^\/v1\/admin\/store\/(\d+)$/);
      if (request.method === 'PATCH' && storeReviewMatch) return reviewStoreFactory(request, env, Number(storeReviewMatch[1]));
      const updateMatch = url.pathname.match(/^\/v1\/admin\/licenses\/(\d+)$/);
      if (request.method === 'PATCH' && updateMatch) return updateLicense(request, env, Number(updateMatch[1]));
      const resetMatch = url.pathname.match(/^\/v1\/admin\/licenses\/(\d+)\/reset-activations$/);
      if (request.method === 'POST' && resetMatch) return resetActivations(request, env, Number(resetMatch[1]));
      return json({error: '找不到 API'}, 404);
    } catch (error) {
      return json({error: error instanceof Error ? error.message : '伺服器錯誤'}, Number(error?.status || 500));
    }
  }
};
