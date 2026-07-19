/* ==========================================================================
   Sensor Deployment Flow — client-side state & interactions
   Vanilla ES6+. No frameworks, no build step.
   Path prototyped end-to-end: AWS -> Kubernetes (K8s) -> Helm.
   ========================================================================== */
'use strict';

/* --------------------------------------------------------------------------
   Tiny helpers
   -------------------------------------------------------------------------- */
const $  = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const el = (tag, attrs = {}, ...kids) => {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === 'class') node.className = v;
    else if (k === 'html') node.innerHTML = v;
    else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2), v);
    else node.setAttribute(k, v === true ? '' : v);
  }
  for (const kid of kids.flat()) {
    if (kid == null) continue;
    node.append(kid.nodeType ? kid : document.createTextNode(kid));
  }
  return node;
};

/* Inline SVG icon registry (currentColor for theming) */
const ICONS = {
  check:   '<svg viewBox="0 0 16 16" fill="none"><path d="M3.5 8.5 6.5 11.5 12.5 4.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  close:   '<svg viewBox="0 0 16 16" fill="none"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
  copy:    '<svg viewBox="0 0 16 16" fill="none"><rect x="5.5" y="5.5" width="8" height="8" rx="1.5" stroke="currentColor" stroke-width="1.3"/><path d="M10.5 5.5V4a1.5 1.5 0 0 0-1.5-1.5H4A1.5 1.5 0 0 0 2.5 4v5A1.5 1.5 0 0 0 4 10.5h1.5" stroke="currentColor" stroke-width="1.3"/></svg>',
  eye:     '<svg viewBox="0 0 16 16" fill="none"><path d="M1.5 8S4 3.5 8 3.5 14.5 8 14.5 8 12 12.5 8 12.5 1.5 8 1.5 8Z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/><circle cx="8" cy="8" r="2" stroke="currentColor" stroke-width="1.3"/></svg>',
  eyeoff:  '<svg viewBox="0 0 16 16" fill="none"><path d="M6.2 6.2A2 2 0 0 0 8 10a2 2 0 0 0 1.8-1.1M3 3l10 10M4.6 4.7C2.8 5.8 1.5 8 1.5 8s2.5 4.5 6.5 4.5c1 0 1.9-.3 2.7-.7M9.5 3.7A6.6 6.6 0 0 0 8 3.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  key:     '<svg viewBox="0 0 16 16" fill="none"><circle cx="5.5" cy="10.5" r="2.8" stroke="currentColor" stroke-width="1.3"/><path d="M7.5 8.5 13 3M11 5l1.5 1.5M9.5 6.5 11 8" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  shield:  '<svg viewBox="0 0 16 16" fill="none"><path d="M8 14.7S13.3 12 13.3 8V3.3L8 1.3 2.7 3.3V8C2.7 12 8 14.7 8 14.7Z" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  file:    '<svg viewBox="0 0 16 16" fill="none"><path d="M9 1.5H4.5A1.5 1.5 0 0 0 3 3v10a1.5 1.5 0 0 0 1.5 1.5h7A1.5 1.5 0 0 0 13 13V5.5L9 1.5Z" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/><path d="M9 1.5V5.5H13" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/></svg>',
  info:    '<svg viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.3" stroke="currentColor" stroke-width="1.3"/><path d="M8 7.3v3.4M8 5.2h.01" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>',
  warn:    '<svg viewBox="0 0 16 16" fill="none"><path d="M8 2.2 14.5 13.5H1.5L8 2.2Z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/><path d="M8 6.5v3M8 11.4h.01" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>',
  refresh: '<svg viewBox="0 0 16 16" fill="none"><path d="M13 8a5 5 0 1 1-1.5-3.5M13 2v3h-3" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  cloud:   '<svg viewBox="0 0 16 16" fill="none"><path d="M12 6.7h-.8A3.7 3.7 0 1 0 5 11.3h6.9a2.3 2.3 0 0 0 0-4.6Z" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  server:  '<svg viewBox="0 0 16 16" fill="none"><rect x="2" y="2.5" width="12" height="4.5" rx="1" stroke="currentColor" stroke-width="1.3"/><rect x="2" y="9" width="12" height="4.5" rx="1" stroke="currentColor" stroke-width="1.3"/><path d="M4.5 4.75h.01M4.5 11.25h.01" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
  k8s:     '<svg viewBox="0 0 16 16" fill="none"><path d="M8 1.6 2.4 4.3v5.4L8 12.4l5.6-2.7V4.3L8 1.6Z" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/><path d="M8 5.2v2.6l2 1.4M8 7.8 6 9.2" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>',
  helm:    '<svg viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.3" stroke="currentColor" stroke-width="1.3"/><path d="M8 4v8M4 8h8" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>',
  external:'<svg viewBox="0 0 16 16" fill="none"><path d="M6 3h7v7M13 3 6.5 9.5M11 9v3.5H3.5V5H7" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  chevron: '<svg viewBox="0 0 16 16" fill="none"><path d="M4 6l4 4 4-4" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  plus:    '<svg viewBox="0 0 16 16" fill="none"><path d="M8 3.3v9.4M3.3 8h9.4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
  settings:'<svg viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="2.2" stroke="currentColor" stroke-width="1.4"/><path d="M8 1.6v1.6M8 12.8v1.6M14.4 8h-1.6M3.2 8H1.6M12.5 3.5l-1.1 1.1M4.6 11.4l-1.1 1.1M12.5 12.5l-1.1-1.1M4.6 4.6 3.5 3.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>',
  caretUp: '<svg viewBox="0 0 16 16" fill="none"><path d="M4 10l4-4 4 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  caretDown:'<svg viewBox="0 0 16 16" fill="none"><path d="M4 6l4 4 4-4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  sort:    '<svg viewBox="0 0 16 16" fill="none"><path d="M5 6.5 8 3.5l3 3M5 9.5l3 3 3-3" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>',
};
const icon = (name) => { const s = el('span'); s.innerHTML = ICONS[name] || ''; return s.firstChild; };

/* --------------------------------------------------------------------------
   Toasts
   -------------------------------------------------------------------------- */
function toast(msg, kind = 'success') {
  const host = $('#toast-host');
  const t = el('div', { class: `sds-toast sds-toast--${kind}` },
    el('span', { class: 'sds-toast__icon', html: kind === 'error' ? ICONS.warn : ICONS.check }),
    el('span', { class: 'sds-toast__msg' }, msg),
    el('button', { class: 'sds-toast__close', 'aria-label': 'Dismiss', html: ICONS.close, onclick: () => t.remove() })
  );
  host.append(t);
  setTimeout(() => t.remove(), 3200);
}

/* Clipboard with graceful fallback */
async function copyText(text, btn) {
  try {
    if (navigator.clipboard && window.isSecureContext) await navigator.clipboard.writeText(text);
    else {
      const ta = el('textarea', { style: 'position:fixed;opacity:0' }); ta.value = text;
      document.body.append(ta); ta.select(); document.execCommand('copy'); ta.remove();
    }
    toast('Copied to clipboard');
    if (btn) {
      const original = btn.dataset.label || btn.textContent.trim();
      btn.dataset.label = original;
      btn.classList.add('is-copied');
      btn.innerHTML = ICONS.check + '<span>Copied</span>';
      setTimeout(() => { btn.classList.remove('is-copied'); btn.innerHTML = ICONS.copy + `<span>${original}</span>`; }, 1600);
    }
  } catch (e) { toast('Copy failed — select the text manually', 'error'); }
}

/* --------------------------------------------------------------------------
   Filters — base attributes always shown; extra ones added on demand.
   Default chip shows just the attribute name + chevron (no value until picked).
   -------------------------------------------------------------------------- */
const FILTERS_BASE = [
  { id: 'health',   label: 'Health',              options: ['Healthy', 'Warning', 'Offline', 'Critical'] },
  { id: 'provider', label: 'Provider',            options: ['AWS', 'GCP', 'Azure', 'On-prem'] },
  { id: 'type',     label: 'Type',                options: ['K8s', 'VM'] },
  { id: 'method',   label: 'Installation method', options: ['Helm', 'Terraform', 'Pulumi', 'systemd'] },
];
const FILTERS_EXTRA = [
  { id: 'version',     label: 'Version',        options: ['v4.8.1', 'v4.7.0', 'v4.6.2'] },
  { id: 'heartbeat',   label: 'Last heartbeat', options: ['< 5 min', '< 1 hour', '< 24 hours', 'Over 24 hours', 'Never'] },
  { id: 'environment', label: 'Environment',    options: ['us-east-1', 'us-west-2', 'eu-west-1', 'us-central1', 'westeurope', 'dc-fra'] },
  { id: 'coverage',    label: 'Coverage rate',  options: ['Under 50%', '50–80%', '80–95%', 'Over 95%'] },
];
const FILTER_BY_ID = Object.fromEntries([...FILTERS_BASE, ...FILTERS_EXTRA].map(f => [f.id, f]));

const filterState = { values: {}, added: [], open: null };

function providerLabel(env) {
  const c = cloudOf(env);
  return c === 'aws' ? 'AWS' : c === 'gcp' ? 'GCP' : c === 'azure' ? 'Azure' : 'On-prem';
}
function heartbeatBucket(hb) {
  if (/never|awaiting/i.test(hb)) return 'Never';
  if (/just now|s ago/i.test(hb)) return '< 5 min';
  const m = hb.match(/(\d+)\s*m ago/i); if (m) return +m[1] < 60 ? '< 1 hour' : '< 24 hours';
  const h = hb.match(/(\d+)\s*h ago/i); if (h) return +h[1] < 24 ? '< 24 hours' : 'Over 24 hours';
  return 'Over 24 hours';
}
/* Bucket a per-sensor coverage percentage into the filter's ranges.
   Returns null when coverage is unavailable (sensor not connected). */
function coverageBucket(pct) {
  if (typeof pct !== 'number') return null;
  if (pct < 50) return 'Under 50%';
  if (pct < 80) return '50–80%';
  if (pct < 95) return '80–95%';
  return 'Over 95%';
}
/* Applies the active filters. */
function sensorMatches(s) {
  const v = filterState.values;
  const t = splitType(s.type);
  if (v.health && HEALTH_LABEL[s.health] !== v.health) return false;
  if (v.provider && providerLabel(s.env) !== v.provider) return false;
  if (v.type && t.type !== v.type) return false;
  if (v.method && t.method !== v.method) return false;
  if (v.version && s.version !== v.version) return false;
  if (v.environment && !s.env.includes(v.environment)) return false;
  if (v.heartbeat && heartbeatBucket(s.heartbeat) !== v.heartbeat) return false;
  if (v.coverage && coverageBucket(s.coverage) !== v.coverage) return false;
  return true;
}

function menuItem(label, selected, onClick, kind) {
  return el('button', {
    class: `filter-menu__item ${selected ? 'is-selected' : ''} ${kind === 'remove' ? 'filter-menu__item--remove' : ''}`,
    onclick: (e) => { e.stopPropagation(); onClick(); },
  },
    el('span', { class: 'filter-menu__check', html: selected ? ICONS.check : '' }),
    el('span', {}, label));
}

function optionsMenu(f) {
  const val = filterState.values[f.id];
  const menu = el('div', { class: 'filter-menu' });
  menu.append(menuItem('Any', !val, () => setFilterValue(f.id, null)));
  f.options.forEach(o => menu.append(menuItem(o, val === o, () => setFilterValue(f.id, o))));
  if (filterState.added.includes(f.id)) {
    menu.append(el('div', { class: 'filter-menu__sep' }));
    menu.append(menuItem('Remove filter', false, () => removeFilter(f.id), 'remove'));
  }
  return menu;
}

function filterChip(f) {
  const val = filterState.values[f.id];
  const wrap = el('div', { class: 'filter' });
  wrap.append(el('button', {
    class: `sds-filter filter-chip ${val ? 'sds-filter--active' : ''}`,
    'aria-expanded': filterState.open === f.id ? 'true' : 'false',
    onclick: (e) => { e.stopPropagation(); toggleFilterMenu(f.id); },
  },
    el('span', {}, val ? `${f.label}: ${val}` : f.label),
    el('span', { class: 'sds-filter__chevron', html: ICONS.chevron })));
  if (filterState.open === f.id) wrap.append(optionsMenu(f));
  return wrap;
}

function addFiltersButton() {
  const remaining = FILTERS_EXTRA.filter(f => !filterState.added.includes(f.id));
  const disabled = remaining.length === 0;
  const wrap = el('div', { class: 'filter' });
  wrap.append(el('button', {
    class: 'filter-add',
    disabled: disabled,
    'aria-expanded': filterState.open === 'add' ? 'true' : 'false',
    onclick: disabled ? null : (e) => { e.stopPropagation(); toggleFilterMenu('add'); },
  },
    el('span', { class: 'filter-add__icon', html: ICONS.plus }), el('span', {}, 'Add filters')));
  if (!disabled && filterState.open === 'add') {
    const menu = el('div', { class: 'filter-menu' });
    remaining.forEach(f => menu.append(menuItem(f.label, false, () => addFilter(f.id))));
    wrap.append(menu);
  }
  return wrap;
}

/* Reset filters — enabled when a non-default filter is added or any value is selected */
function hasActiveFilters() {
  return filterState.added.length > 0 || Object.values(filterState.values).some(Boolean);
}
function resetFiltersButton() {
  const enabled = hasActiveFilters();
  const wrap = el('div', { class: 'filter' });
  wrap.append(el('button', {
    class: 'filter-add filter-reset',
    disabled: !enabled,
    onclick: enabled ? (e) => { e.stopPropagation(); resetFilters(); } : null,
  },
    el('span', { class: 'filter-add__icon', html: ICONS.refresh }), el('span', {}, 'Reset filters')));
  return wrap;
}

function renderFilters() {
  const host = $('#filters');
  if (!host) return;
  const chips = [...FILTERS_BASE, ...filterState.added.map(id => FILTER_BY_ID[id])].map(filterChip);
  host.replaceChildren(...chips, addFiltersButton(), resetFiltersButton());
}

function toggleFilterMenu(id) { filterState.open = filterState.open === id ? null : id; renderFilters(); }
function setFilterValue(id, val) { filterState.values[id] = val; filterState.open = null; pageState.page = 1; renderFilters(); renderSensorRows(); }
function addFilter(id) { if (!filterState.added.includes(id)) filterState.added.push(id); filterState.open = id; renderFilters(); }
function removeFilter(id) {
  filterState.added = filterState.added.filter(x => x !== id);
  delete filterState.values[id];
  filterState.open = null;
  pageState.page = 1;
  renderFilters(); renderSensorRows();
}
function resetFilters() {
  filterState.values = {};
  filterState.added = [];
  filterState.open = null;
  pageState.page = 1;
  renderFilters(); renderSensorRows();
}

/* --------------------------------------------------------------------------
   Sensors overview table
   -------------------------------------------------------------------------- */
const SENSORS = [
  { name: 'prod-eks-payments', env: 'AWS · us-east-1', provider: 'cloud', type: 'K8s (Helm)', health: 'healthy',      version: 'v4.8.1', latest: true,  heartbeat: '30s ago', coverage: 98 },
  { name: 'prod-eks-checkout', env: 'AWS · us-east-1', provider: 'cloud', type: 'K8s (Helm)', health: 'healthy',      version: 'v4.8.1', latest: true,  heartbeat: '1m ago', coverage: 96 },
  { name: 'staging-gke-core',  env: 'GCP · us-central1', provider: 'cloud', type: 'K8s (Helm)', health: 'critical',   version: 'v4.7.0', latest: false, heartbeat: '2m ago', coverage: 85 },
  { name: 'edge-vm-fleet-01',  env: 'Azure · westeurope', provider: 'cloud', type: 'VM (systemd)', health: 'disconnected', version: 'v4.6.2', latest: true, heartbeat: '5h ago', coverage: null },
  { name: 'prod-eks-ledger',   env: 'AWS · eu-west-1', provider: 'cloud', type: 'K8s (Helm)', health: 'pending',      version: 'v4.8.1', latest: true,  heartbeat: 'Awaiting first telemetry', coverage: null },
  { name: 'prod-eks-orders',     env: 'AWS · us-east-1',    provider: 'cloud',  type: 'K8s (Helm)',   health: 'healthy', version: 'v4.8.1', latest: true,  heartbeat: '15s ago', coverage: 99 },
  { name: 'prod-eks-inventory',  env: 'AWS · us-west-2',    provider: 'cloud',  type: 'K8s (Helm)',   health: 'healthy', version: 'v4.8.1', latest: true,  heartbeat: '45s ago', coverage: 95 },
  { name: 'prod-eks-search',     env: 'AWS · eu-central-1', provider: 'cloud',  type: 'K8s (Helm)',   health: 'healthy', version: 'v4.8.1', latest: true,  heartbeat: '1m ago', coverage: 92 },
  { name: 'prod-gke-billing',    env: 'GCP · us-central1',  provider: 'cloud',  type: 'K8s (Helm)',   health: 'healthy', version: 'v4.8.1', latest: true,  heartbeat: '20s ago', coverage: 97 },
  { name: 'prod-gke-auth',       env: 'GCP · europe-west1', provider: 'cloud',  type: 'K8s (Helm)',   health: 'healthy', version: 'v4.8.1', latest: true,  heartbeat: '35s ago', coverage: 94 },
  { name: 'prod-aks-gateway',    env: 'Azure · eastus',     provider: 'cloud',  type: 'K8s (Helm)',   health: 'healthy', version: 'v4.8.1', latest: true,  heartbeat: '50s ago', coverage: 90 },
  { name: 'prod-aks-notifications', env: 'Azure · westus2', provider: 'cloud',  type: 'K8s (Helm)',   health: 'healthy', version: 'v4.8.1', latest: true,  heartbeat: '1m ago', coverage: 93 },
  { name: 'staging-eks-web',     env: 'AWS · us-east-2',    provider: 'cloud',  type: 'K8s (Helm)',   health: 'healthy', version: 'v4.8.1', latest: true,  heartbeat: '2m ago', coverage: 88 },
  { name: 'staging-eks-api',     env: 'AWS · us-east-2',    provider: 'cloud',  type: 'K8s (Helm)',   health: 'healthy', version: 'v4.8.1', latest: true,  heartbeat: '2m ago', coverage: 85 },
  { name: 'prod-vm-egress-01',   env: 'AWS · us-east-1',    provider: 'cloud',  type: 'VM (systemd)', health: 'healthy', version: 'v4.8.1', latest: true,  heartbeat: '40s ago', coverage: 91 },
  { name: 'prod-vm-egress-02',   env: 'AWS · us-west-2',    provider: 'cloud',  type: 'VM (systemd)', health: 'healthy', version: 'v4.8.1', latest: true,  heartbeat: '55s ago', coverage: 89 },
  { name: 'onprem-k8s-analytics', env: 'On-prem · dc-nyc',  provider: 'onprem', type: 'K8s (Helm)',   health: 'updating', version: 'v4.7.0', latest: false, heartbeat: '1m ago', coverage: 44 },
  { name: 'staging-aks-jobs',    env: 'Azure · northeurope', provider: 'cloud', type: 'K8s (Helm)',   health: 'updating', version: 'v4.7.0', latest: false, heartbeat: '3m ago', coverage: 68 },
  { name: 'edge-vm-fleet-02',    env: 'Azure · uksouth',    provider: 'cloud',  type: 'VM (systemd)', health: 'disconnected', version: 'v4.6.2', latest: true, heartbeat: '2h ago', coverage: null },
];

const HEALTH_LABEL = {
  healthy: 'Healthy', disconnected: 'Offline', updating: 'Warning',
  pending: 'N/A', critical: 'Critical', never: 'Critical',
};

/* Which cards are expanded (keyed by sensor name) */
const expandedCards = new Set();
/* The currently selected sensor row (e.g. right after a deployment) */
let selectedSensor = null;

/* Derive the cloud brand from the environment string ("AWS · us-east-1") */
function cloudOf(env) {
  const p = (env.split(' ')[0] || '').toLowerCase();
  if (p === 'aws') return 'aws';
  if (p === 'gcp') return 'gcp';
  if (p === 'azure') return 'azure';
  return 'onprem';
}

/* Split "K8s (Helm)" -> { type: 'K8s', method: 'Helm' } */
function splitType(t) {
  const m = t.match(/^(.*?)\s*\((.*)\)\s*$/);
  return m ? { type: m[1], method: m[2] } : { type: t, method: '—' };
}

/* Provider logo: cloud brands use their SVG asset (natural aspect ratio kept);
   on-prem falls back to a generic glyph */
const BRAND_LOGOS = { aws: 'AWS', gcp: 'GCP', azure: 'Azure' };
function providerLogo(env) {
  const cloud = cloudOf(env);
  const span = el('span', { class: 'scard__logo', title: cloud.toUpperCase() });
  if (BRAND_LOGOS[cloud]) span.append(el('img', { src: `assets/logos/${cloud}.svg`, alt: BRAND_LOGOS[cloud] }));
  else span.innerHTML = ICONS.server;
  return span;
}

/* Per-state content for the expanded detail panel */
function sensorDetail(s) {
  switch (s.health) {
    case 'healthy':
      return {
        sev: 'success', badgeIcon: 'check', badge: 'Healthy', title: 'Sensor healthy',
        body: `<p>This sensor is streaming telemetry normally — last heartbeat ${s.heartbeat}, running the latest version (${s.version}).</p><p>No action needed. Coverage for this environment is active.</p>`,
      };
    case 'updating':
      return s.coverage < 60 ? {
        sev: 'warning', badgeIcon: 'warn', badge: 'Warning', title: 'Low coverage',
        body: `<p>This sensor is protecting only ${s.coverage}% of the workloads in this environment. The remaining ${100 - s.coverage}% are running without telemetry, leaving blind spots where malicious activity could go undetected.</p><p>Recommended action:</p><ul><li>Check for nodes or namespaces where the sensor isn't scheduled — node taints, tolerations, or resource limits are the most common causes.</li><li>Confirm the DaemonSet is running on every eligible node and that no pods are stuck pending.</li><li>Re-check coverage once the sensor has rolled out to the remaining nodes.</li></ul>`,
        actions: [{ label: 'View uncovered workloads', primary: true, onClick: () => toast('Opening coverage breakdown…') }],
      } : {
        sev: 'warning', badgeIcon: 'warn', badge: 'Warning', title: 'Sensor upgrade required',
        body: `<p>This sensor is running version ${s.version}, which is no longer the latest supported release. Until it is upgraded, the sensor may not report full telemetry or receive the latest protections.</p><p>Recommended action:</p><ul><li>Upgrade the sensor to the latest supported version.</li><li>If you manage clusters centrally, roll out the updated Helm chart through your delivery pipeline (such as Argo CD, Flux, or CI).</li><li>After the upgrade, confirm the status is Healthy and that a recent heartbeat has been received.</li></ul>`,
        actions: [{ label: 'Upgrade sensor', primary: true, onClick: () => toast('Opening upgrade instructions…') }, { label: 'Release notes', external: true }],
      };
    case 'critical':
      return {
        sev: 'critical', badgeIcon: 'warn', badge: 'Critical', title: 'Low storage remaining',
        body: `<p>The node pool backing this sensor is critically low on available disk — telemetry buffering is at risk and data loss may occur if storage is exhausted.</p><p>Recommended action:</p><ul><li>Free up disk on the affected nodes or expand the node pool's disk size.</li><li>Check for large log or image caches that can be pruned.</li><li>Re-check status once storage returns to a healthy threshold.</li></ul>`,
        actions: [{ label: 'View nodes', primary: true, onClick: () => toast('Opening node storage details…') }],
      };
    case 'disconnected':
      return {
        sev: 'critical', badgeIcon: 'warn', badge: 'Critical', title: 'Sensor disconnected',
        body: platformOf(s) === 'vm'
          ? `<p>This sensor was healthy but has stopped reporting — last heartbeat ${s.heartbeat}. The host may still be running while outbound traffic to Sweet is being blocked.</p><p>Recommended action:</p><ul><li>Confirm egress on TCP 443 to *.sweet.security is allowed from the machine.</li><li>Check that any HTTP(S) proxy is configured and trusts our certificate.</li><li>Verify the host can resolve api.sweet.security.</li></ul>`
          : `<p>This sensor was healthy but has stopped reporting — last heartbeat ${s.heartbeat}. The pods may still be running while outbound traffic to Sweet is being blocked.</p><p>Recommended action:</p><ul><li>Confirm egress on TCP 443 to *.sweet.security is allowed from the cluster.</li><li>Check that any HTTP(S) proxy is configured and trusts our certificate.</li><li>Verify the cluster can resolve api.sweet.security.</li></ul>`,
        actions: [{ label: 'Troubleshoot', primary: true, onClick: () => toast('Opening troubleshooting guide…', 'error') }, { label: 'View guide', external: true }],
      };
    case 'pending':
      return {
        sev: 'info', badgeIcon: 'info', badge: 'Deploying', title: 'Awaiting first telemetry',
        body: `<p>The Helm release was detected and the sensor is registering. First telemetry typically arrives within 2–5 minutes.</p><p>No action needed — this view updates automatically once data starts flowing.</p>`,
      };
    case 'never':
    default:
      return {
        sev: 'critical', badgeIcon: 'warn', badge: 'Never connected', title: 'Sensor never connected',
        body: `<p>The sensor was installed but has never registered with Sweet, so it is not protecting anything yet.</p><p>Recommended action:</p><ul><li>Check the activation token / API key used at install is valid and not expired.</li><li>Confirm outbound HTTPS (443) to api.sweet.security is permitted.</li><li>Re-run the deployment command if the token was rotated.</li></ul>`,
        actions: [{ label: 'Troubleshoot', primary: true, onClick: () => toast('Opening troubleshooting guide…', 'error') }, { label: 'View guide', external: true }],
      };
  }
}

function detailPanel(s) {
  const d = sensorDetail(s);
  const panel = el('div', { class: 'scard__detail' },
    el('div', { class: 'scard__detail-head' },
      el('span', { class: 'scard__detail-title' }, d.title),
      el('span', { class: `sev-badge sev-badge--${d.sev}` }, icon(d.badgeIcon), el('span', {}, d.badge))),
    el('div', { class: 'scard__detail-body', html: d.body }));
  if (d.actions && d.actions.length) {
    panel.append(el('div', { class: 'scard__detail-actions' },
      d.actions.map(a => el('button', {
        class: `sds-btn ${a.primary ? 'sds-btn--primary' : 'sds-btn--outline'} sds-btn--sm`,
        onclick: (e) => { e.stopPropagation(); (a.onClick || (() => {}))(); },
      }, a.label, a.external ? icon('external') : null))));
  }
  return panel;
}

function versionCell(s) {
  const wrap = el('span', { class: 'scard__version' }, el('span', { class: 'cell-mono' }, s.version));
  if (!s.latest && s.version !== '—' && !(s.health === 'updating' && s.coverage < 60)) wrap.append(el('span', { class: 'upgrade-pill' }, 'upgrade'));
  return el('div', { class: 'scard__cell' }, wrap);
}

/* Coverage → severity level: >=80 low (green), 60–79 medium (amber), <60 critical (red) */
function coverageSeverity(pct) {
  if (pct >= 80) return 'low';
  if (pct >= 40) return 'medium';
  return 'critical';
}
function coverageCell(s) {
  if (typeof s.coverage !== 'number') {
    return el('div', { class: 'scard__cell' },
      el('span', { class: 'sds-badge coverage-na', title: 'Coverage is unavailable while the sensor is not connected' }, 'N/A'));
  }
  const pct = s.coverage;
  return el('div', { class: 'scard__cell' },
    el('span', { class: `sds-badge cov-badge cov-badge--${coverageSeverity(pct)}` }, `${pct}%`));
}

function sensorCard(s) {
  const { type, method } = splitType(s.type);
  const attention = s.health === 'updating' || s.health === 'critical' || s.health === 'disconnected' || s.health === 'never';

  // Every row opens the detail side panel; attention rows get a "Review issue" affordance.
  const actionCell = attention
    ? el('div', { class: 'scard__cell' }, el('span', { class: 'scard__action scard__action--attention' },
        el('span', {}, 'Review issue')))
    : el('div', { class: 'scard__cell' }, el('span', { class: 'scard__open-hint' }, 'View details', el('span', { class: 'scard__chevron', html: ICONS.chevron })));

  const open = () => openSensorPanel(s.name);
  const rowAttrs = {
    class: 'scard__row', role: 'button', tabindex: '0',
    onclick: open,
    onkeydown: (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } },
  };

  const row = el('div', rowAttrs,
    el('div', { class: 'scard__cell scard__name' }, providerLogo(s.env), el('span', { class: 'scard__title' }, s.name)),
    coverageCell(s),
    el('div', { class: 'scard__cell scard__cell--muted' }, s.env),
    el('div', { class: 'scard__cell scard__cell--muted' }, type),
    el('div', { class: 'scard__cell scard__cell--muted' }, method),
    el('div', { class: 'scard__cell' },
      el('span', { class: `health health--${s.health}` }, el('span', { class: 'health__dot' }), HEALTH_LABEL[s.health])),
    versionCell(s),
    el('div', { class: 'scard__cell scard__cell--muted' }, s.heartbeat),
    actionCell);

  return el('div', { class: `scard ${selectedSensor === s.name ? 'is-selected' : ''}`, 'data-sensor': s.name }, row);
}

function toggleCard(name) {
  if (expandedCards.has(name)) expandedCards.delete(name);
  else expandedCards.add(name);
  renderSensorRows();
}

/* --------------------------------------------------------------------------
   Sorting — clickable column headers. Default: Issues (attention first).
   -------------------------------------------------------------------------- */
/* Higher weight = more attention needed; used for State + Issues columns */
function severityWeight(health) {
  return { critical: 5, never: 4, disconnected: 3, updating: 2, pending: 1, healthy: 0 }[health] ?? 0;
}
/* Normalize a heartbeat string to minutes-ago for chronological sorting */
function heartbeatMinutes(hb) {
  if (/never/i.test(hb)) return Number.POSITIVE_INFINITY;
  if (/awaiting/i.test(hb)) return 1e9;
  if (/just now/i.test(hb)) return 0;
  const s = hb.match(/(\d+)\s*s ago/i); if (s) return +s[1] / 60;
  const m = hb.match(/(\d+)\s*m ago/i); if (m) return +m[1];
  const h = hb.match(/(\d+)\s*h ago/i); if (h) return +h[1] * 60;
  const d = hb.match(/(\d+)\s*d ago/i); if (d) return +d[1] * 1440;
  return 1e6;
}
const COLUMNS = [
  { id: 'name',      label: 'Sensor',         cmp: (a, b) => a.name.localeCompare(b.name) },
  { id: 'coverage',  label: 'Coverage',       cmp: (a, b) => (a.coverage ?? 0) - (b.coverage ?? 0) },
  { id: 'env',       label: 'Environment',    cmp: (a, b) => a.env.localeCompare(b.env) },
  { id: 'type',      label: 'Type',           cmp: (a, b) => splitType(a.type).type.localeCompare(splitType(b.type).type) },
  { id: 'method',    label: 'Method',         cmp: (a, b) => splitType(a.type).method.localeCompare(splitType(b.type).method) },
  { id: 'state',     label: 'Health state',   cmp: (a, b) => severityWeight(a.health) - severityWeight(b.health) },
  { id: 'version',   label: 'Version',        cmp: (a, b) => a.version.localeCompare(b.version, undefined, { numeric: true }) },
  { id: 'heartbeat', label: 'Last heartbeat', cmp: (a, b) => heartbeatMinutes(a.heartbeat) - heartbeatMinutes(b.heartbeat) },
  { id: 'issues',    label: 'Issues',         cmp: (a, b) => severityWeight(a.health) - severityWeight(b.health) },
];
const COLUMN_BY_ID = Object.fromEntries(COLUMNS.map(c => [c.id, c]));
/* Columns where "descending" (highest first) is the natural default */
const DESC_FIRST = new Set(['state', 'issues']);
const sortState = { col: 'issues', dir: 'desc' };
const pageState = { size: 20, page: 1 };
let sortMenuOpen = false;

function toggleSort(id) {
  if (sortState.col === id) sortState.dir = sortState.dir === 'asc' ? 'desc' : 'asc';
  else { sortState.col = id; sortState.dir = DESC_FIRST.has(id) ? 'desc' : 'asc'; }
  pageState.page = 1;
  renderHead();
  renderSortControl();
  renderSensorRows();
}

function sortSensors(rows) {
  const col = COLUMN_BY_ID[sortState.col];
  if (!col) return rows;
  const mul = sortState.dir === 'asc' ? 1 : -1;
  return [...rows].sort((a, b) => (col.cmp(a, b) * mul) || a.name.localeCompare(b.name));
}

/* Toolbar sort dropdown (sits next to "Deploy sensor") */
function renderSortControl() {
  const host = $('#sort-control');
  if (!host) return;
  const active = COLUMN_BY_ID[sortState.col];
  const dirIcon = sortState.dir === 'asc' ? 'caretUp' : 'caretDown';
  const sortLabel = (c) => (c.id === 'name' ? 'A–Z' : c.label);
  const wrap = el('div', { class: 'sort-control__wrap' });
  wrap.append(el('button', {
    class: `sds-btn sds-btn--outline sds-btn--md sort-btn ${sortMenuOpen ? 'is-open' : ''}`,
    'aria-expanded': sortMenuOpen ? 'true' : 'false',
    onclick: (e) => { e.stopPropagation(); sortMenuOpen = !sortMenuOpen; renderSortControl(); },
  },
    el('span', { class: 'sds-btn__icon', html: ICONS.sort }),
    el('span', {}, `Sort: ${sortLabel(active)}`),
    el('span', { class: 'sort-btn__dir', html: ICONS[dirIcon] })));
  if (sortMenuOpen) {
    const menu = el('div', { class: 'filter-menu filter-menu--center' });
    // Reset row — restores the default sort (Issues, attention first)
    menu.append(el('button', {
      class: 'filter-menu__item filter-menu__reset',
      onclick: (e) => { e.stopPropagation(); resetSort(); },
    },
      el('span', { class: 'filter-menu__check', html: ICONS.refresh }),
      el('span', {}, 'Reset')));
    menu.append(el('div', { class: 'filter-menu__sep' }));
    COLUMNS.forEach(c => {
      const isActive = sortState.col === c.id;
      menu.append(el('button', {
        class: `filter-menu__item ${isActive ? 'is-selected' : ''}`,
        onclick: (e) => { e.stopPropagation(); toggleSort(c.id); },
      },
        el('span', { class: 'filter-menu__check', html: isActive ? ICONS.check : '' }),
        el('span', {}, sortLabel(c))));
    });
    wrap.append(menu);
  }
  host.replaceChildren(wrap);
}

/* Restore the default sort (Issues column, attention-first) */
function resetSort() {
  sortState.col = 'issues';
  sortState.dir = 'desc';
  sortMenuOpen = false;
  pageState.page = 1;
  renderHead();
  renderSortControl();
  renderSensorRows();
}

function renderHead() {
  const host = $('#sensor-head');
  if (!host) return;
  host.replaceChildren(...COLUMNS.map(col => {
    const active = sortState.col === col.id;
    const icon = active
      ? ICONS[sortState.dir === 'asc' ? 'caretUp' : 'caretDown']
      : ICONS.sort;
    return el('button', {
      type: 'button',
      role: 'columnheader',
      class: `colsort ${active ? 'is-sorted' : ''}`,
      'aria-sort': active ? (sortState.dir === 'asc' ? 'ascending' : 'descending') : 'none',
      title: `Sort by ${col.label}`,
      onclick: (e) => { e.stopPropagation(); toggleSort(col.id); },
    },
      el('span', {}, col.label),
      el('span', { class: 'colsort__icon', html: icon }));
  }));
}

function renderSensorRows() {
  const host = $('#sensor-rows');
  const rows = sortSensors(SENSORS.filter(sensorMatches));
  const total = rows.length;
  const pages = Math.max(1, Math.ceil(total / pageState.size));
  if (pageState.page > pages) pageState.page = pages;
  if (pageState.page < 1) pageState.page = 1;
  renderPagination(total, pages);
  if (!total) {
    host.replaceChildren(el('div', { class: 'cardlist__empty' }, 'No sensors match these filters.'));
    return;
  }
  const start = (pageState.page - 1) * pageState.size;
  const pageRows = rows.slice(start, start + pageState.size);
  host.replaceChildren(...pageRows.map(sensorCard));
}

const PAGE_SIZES = [10, 20, 50];
const ARROW = {
  left: '<svg viewBox="0 0 16 16" fill="none"><path d="M10 4 6 8l4 4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  right: '<svg viewBox="0 0 16 16" fill="none"><path d="M6 4l4 4-4 4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
};

function renderPagination(total, pages) {
  const host = $('#sensor-footer');
  if (!host) return;
  const page = pageState.page;
  const start = total === 0 ? 0 : (page - 1) * pageState.size + 1;
  const end = Math.min(page * pageState.size, total);

  const sizeSel = el('select', { class: 'sds-select select-wrap__select pagination__size-select' });
  PAGE_SIZES.forEach(n => sizeSel.append(el('option', { value: String(n), selected: n === pageState.size }, String(n))));
  sizeSel.addEventListener('change', (e) => { pageState.size = +e.target.value; pageState.page = 1; renderSensorRows(); });
  const sizeWrap = el('span', { class: 'select-wrap pagination__size' },
    sizeSel, el('span', { class: 'select-wrap__chevron', html: ICONS.chevron }));

  const prevBtn = el('button', {
    class: 'sds-pagination__btn', type: 'button', 'aria-label': 'Previous page',
    disabled: page <= 1, html: ARROW.left,
    onclick: () => { if (pageState.page > 1) { pageState.page--; renderSensorRows(); } },
  });
  const nextBtn = el('button', {
    class: 'sds-pagination__btn', type: 'button', 'aria-label': 'Next page',
    disabled: page >= pages, html: ARROW.right,
    onclick: () => { if (pageState.page < pages) { pageState.page++; renderSensorRows(); } },
  });

  host.replaceChildren(el('div', { class: 'sds-pagination' },
    el('span', { class: 'pagination__size-group' }, el('span', {}, 'Rows per page'), sizeWrap),
    el('span', { class: 'pagination__count' }, `${start}–${end} of ${total}`),
    el('span', { class: 'sds-pagination__nav' }, prevBtn, nextBtn)));
}

/* Select the given sensor row, make sure it is visible, and scroll to it.
   Clears active filters/empty-state so the row is guaranteed to render. */
function highlightSensor(name) {
  selectedSensor = name;
  showEmpty(false);
  filterState.values = {};
  filterState.open = null;
  renderFilters();
  const rows = sortSensors(SENSORS.filter(sensorMatches));
  const idx = rows.findIndex(s => s.name === name);
  if (idx >= 0) pageState.page = Math.floor(idx / pageState.size) + 1;
  renderSensorRows();
  requestAnimationFrame(() => {
    const esc = (window.CSS && CSS.escape) ? CSS.escape(name) : name;
    const card = document.querySelector(`.scard[data-sensor="${esc}"]`);
    if (!card) return;
    card.scrollIntoView({ behavior: 'smooth', block: 'center' });
    card.classList.add('is-flash');
    setTimeout(() => card.classList.remove('is-flash'), 1600);
  });
}

/* --------------------------------------------------------------------------
   Sensor drill-down side panel (drawer)
   -------------------------------------------------------------------------- */
/* Panel vocabulary per internal health state:
   primary badge · severity · connection status · optional deployment badge */
const PANEL_STATUS = {
  healthy:      { badge: 'Healthy',  sev: 'success',  conn: 'Connected',       deploy: null },
  updating:     { badge: 'Warning',  sev: 'warning',  conn: 'Connected',       deploy: 'Updating' },
  pending:      { badge: 'N/A',      sev: 'info',     conn: 'Connecting',      deploy: 'Deploying' },
  critical:     { badge: 'Critical', sev: 'critical', conn: 'Connected',       deploy: null },
  disconnected: { badge: 'Offline',  sev: 'offline',  conn: null,             deploy: null },
  never:        { badge: 'Critical', sev: 'critical', conn: 'Never Connected', deploy: 'Deployment Failed' },
};
/* Connection-status dot color: connected=green, connecting=yellow, never=solid red */
const CONN_TONE = { 'Connected': 'ok', 'Connecting': 'warn', 'Never Connected': 'bad' };

/* Header chips derived from the sensor so they never contradict the logo/data:
   cloud brand · platform (Kubernetes / VM) · deployment method (Helm / systemd) */
const CLOUD_CHIP = { aws: 'AWS', gcp: 'GCP', azure: 'Azure', onprem: 'On-prem' };
const PLATFORM_CHIP = { 'K8s': 'Kubernetes', 'VM': 'Virtual Machine' };
function drawerChips(s) {
  const { type, method } = splitType(s.type);
  const chips = [CLOUD_CHIP[cloudOf(s.env)] || 'On-prem', PLATFORM_CHIP[type] || type];
  if (method && method !== '—') chips.push(method);
  return chips;
}

/* Findings surfaced in "Security Highlights" (prototype data) */
const SECURITY_HIGHLIGHTS = [
  { count: 2, label: 'Critical CVEs',                sev: 'critical' },
  { count: 1, label: 'Vulnerable Package',           sev: 'high'     },
  { count: 1, label: 'Medium RBAC Misconfiguration', sev: 'medium'   },
  { count: 4, label: 'Runtime Anomalies',            sev: 'high'     },
  { count: 1, label: 'Internet-Exposed Workload',    sev: 'medium'   },
];

/* What the latest scan analyzed (prototype checklist) */
const SCAN_CHECKLIST = [
  '1 Kubernetes Cluster', '12 Worker Nodes', '420 Running Pods', '74 Deployments',
  '398 Container Images', '18 Namespaces', '1,846 Installed Packages',
  '3,214 Vulnerabilities Checked', '112 Kubernetes Security Configurations Reviewed',
  '94 Network Connections Observed', 'Runtime Protection Enabled',
];

/* VM/systemd equivalent checklist (used for non-Kubernetes sensors) */
const SCAN_CHECKLIST_VM = [
  '1 Virtual Machine', '8 vCPUs Monitored', '142 Running Processes', '36 systemd Services',
  '512 Installed Packages', '2,980 Vulnerabilities Checked', '64 Open Network Ports',
  '48 Host Security Configurations Reviewed', '88 Network Connections Observed',
  'File Integrity Monitoring Enabled', 'Runtime Protection Enabled',
];

/* Platform derived from the sensor type ("K8s (Helm)" -> k8s, "VM (systemd)" -> vm) */
function platformOf(s) {
  return splitType(s.type).type === 'K8s' ? 'k8s' : 'vm';
}

/* Completed scan dates (most recent first). "Last Scan" == index 0. */
const SCAN_DATES = ['2026-07-18', '2026-07-11', '2026-07-04', '2026-06-27', '2026-06-20'];

let panelState = null; // { sensor, scan, menuOpen, calendarOpen, calMonth }

function fmtDate(iso) {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function openSensorPanel(name) {
  const s = SENSORS.find(x => x.name === name);
  if (!s) return;
  selectedSensor = name;
  const [y, m] = SCAN_DATES[0].split('-').map(Number);
  panelState = { sensor: name, scan: 'last', menuOpen: false, calendarOpen: false, calMonth: new Date(y, m - 1, 1) };
  renderSensorRows();
  const root = $('#drawer-root');
  root.innerHTML = '';
  root.append(renderDrawer(s));
  document.body.classList.add('is-drawer-open');
  document.addEventListener('keydown', onDrawerKeydown);
  requestAnimationFrame(() => $('.drawer')?.classList.add('is-in'));
}

function closeSensorPanel() {
  panelState = null;
  const root = $('#drawer-root');
  const overlay = $('.drawer', root);
  document.body.classList.remove('is-drawer-open');
  document.removeEventListener('keydown', onDrawerKeydown);
  if (overlay) {
    overlay.classList.remove('is-in');
    setTimeout(() => { root.innerHTML = ''; }, 200);
  } else root.innerHTML = '';
}

function onDrawerKeydown(e) { if (e.key === 'Escape') closeSensorPanel(); }

/* Small building blocks ---------------------------------------------------- */
function kpi(label, value, tone) {
  const long = typeof value === 'string' && value.length > 7;
  return el('div', { class: `panel-kpi ${tone ? 'panel-kpi--' + tone : ''}` },
    el('span', { class: `panel-kpi__value${long ? ' panel-kpi__value--sm' : ''}` }, value),
    el('span', { class: 'panel-kpi__label' }, label));
}

function panelWidget(title, ...body) {
  return el('section', { class: 'panel-widget' },
    el('h3', { class: 'panel-widget__title' }, title),
    ...body);
}

/* Prominent section divider with a subtitle — separates the sensor's issue
   banners from the coverage figures so a green coverage % is never mistaken
   for the sensor's (possibly critical) health status. */
function panelDivider(title) {
  return el('div', { class: 'panel-divider', role: 'separator', 'aria-label': title },
    el('span', { class: 'panel-divider__title' }, title));
}

/* Build a collapsed-by-default issue banner from a generic issue descriptor. */
function issueBanner(issue) {
  const banner = el('div', { class: `panel-banner panel-banner--${issue.sev}` });
  const head = el('button', {
    class: 'panel-banner__head', type: 'button', 'aria-expanded': 'false',
    onclick: (e) => {
      e.stopPropagation();
      const open = banner.classList.toggle('is-open');
      head.setAttribute('aria-expanded', open ? 'true' : 'false');
    },
  },
    el('span', { class: 'panel-banner__icon', html: ICONS[issue.badgeIcon] }),
    el('div', { class: 'panel-banner__titles' },
      el('span', { class: 'panel-banner__title' }, issue.title),
      issue.badge ? el('span', { class: `sev-badge sev-badge--${issue.sev}` }, icon(issue.badgeIcon), el('span', {}, issue.badge)) : null),
    el('span', { class: 'panel-banner__chevron', html: ICONS.chevron }));
  const collapse = el('div', { class: 'panel-banner__collapse' },
    el('div', { class: 'panel-banner__body', html: issue.body }),
    (issue.actions && issue.actions.length)
      ? el('div', { class: 'panel-banner__actions' }, issue.actions.map(a => el('button', {
          class: `sds-btn ${a.primary ? 'sds-btn--primary' : 'sds-btn--outline'} sds-btn--sm`,
          onclick: (e) => { e.stopPropagation(); (a.onClick || (() => {}))(); },
        }, a.label, a.external ? icon('external') : null)))
      : null);
  banner.append(head, collapse);
  return banner;
}

/* Additional per-sensor issues (beyond the health-derived one). */
const EXTRA_ISSUES = {
  'staging-gke-core': [{
    sev: 'warning', badgeIcon: 'warn', badge: 'Warning', title: 'Sensor upgrade required',
    body: `<p>This sensor is running version v4.7.0, which is no longer the latest supported release. Until it is upgraded, the sensor may not report full telemetry or receive the latest protections.</p><p>Recommended action:</p><ul><li>Upgrade the sensor to the latest supported version.</li><li>If you manage clusters centrally, roll out the updated Helm chart through your delivery pipeline (such as Argo CD, Flux, or CI).</li><li>After the upgrade, confirm the status is Healthy and that a recent heartbeat has been received.</li></ul>`,
    actions: [{ label: 'Upgrade sensor', primary: true, onClick: () => toast('Opening upgrade instructions…') }, { label: 'Release notes', external: true }],
  }],
};

/* Issue banners — the health-derived issue plus any extra per-sensor issues. */
function renderPanelIssues(s) {
  const issues = [];
  if (s.health !== 'healthy') {
    const d = sensorDetail(s);
    const st = PANEL_STATUS[s.health];
    issues.push({ sev: st.sev, badgeIcon: d.badgeIcon, badge: s.health === 'pending' ? null : st.badge, title: d.title, body: d.body, actions: d.actions });
  }
  (EXTRA_ISSUES[s.name] || []).forEach(i => issues.push(i));
  return issues.map(issueBanner);
}

/* Widget 1 — Deployment Coverage with progress bar */
const COVERAGE_TOTAL = 5026;
function coverageFigures(s) {
  if (typeof s.coverage !== 'number') return null;
  const pct = s.coverage;
  const protectedN = Math.round(pct / 100 * COVERAGE_TOTAL);
  return { pct, total: COVERAGE_TOTAL, protectedN, unprotected: COVERAGE_TOTAL - protectedN };
}
function renderPanelCoverage(s) {
  const fig = coverageFigures(s);
  if (!fig) {
    return panelWidget('Deployment Coverage',
      el('div', { class: 'panel-cov panel-cov--na' },
        el('div', { class: 'panel-cov__head' },
          el('span', { class: 'panel-cov__pct' }, 'N/A')),
        el('p', { class: 'panel-cov__note' }, 'Coverage is unavailable while the sensor is not connected.')));
  }
  const pct = fig.pct;
  return panelWidget('Deployment Coverage',
    el('div', { class: `panel-cov panel-cov--${coverageSeverity(pct)}` },
      el('div', { class: 'panel-cov__head' },
        el('span', { class: 'panel-cov__pct' }, pct + '%'),
        el('span', { class: 'panel-cov__frac' }, `${fig.protectedN.toLocaleString()} / ${fig.total.toLocaleString()} entities protected`)),
      el('div', { class: 'panel-cov__bar' }, el('span', { class: 'panel-cov__fill', style: `width:${pct}%` })),
      el('p', { class: 'panel-cov__note' }, `${fig.unprotected.toLocaleString()} entities are currently unprotected`)));
}

/* Widget 2 — Security Highlights (clickable cards); empty state when no telemetry */
function renderPanelHighlights(s) {
  if (s && (s.health === 'disconnected' || s.health === 'never' || s.health === 'pending')) {
    return el('section', { class: 'panel-widget' },
      el('h3', { class: 'panel-widget__title' }, 'Top security findings'),
      el('div', { class: 'panel-empty' },
        el('span', { class: 'panel-empty__icon', html: ICONS.shield }),
        el('p', { class: 'panel-empty__title' }, 'No findings available'),
        el('p', { class: 'panel-empty__note' }, 'Security findings will appear once the sensor is connected and sending telemetry.')));
  }
  const grid = el('div', { class: 'panel-highlights' });
  SECURITY_HIGHLIGHTS.forEach(h => {
    grid.append(el('button', {
      class: `panel-hl panel-hl--${h.sev}`,
      onclick: () => toast(`Opening ${h.count} ${h.label}…`),
    },
      el('span', { class: 'panel-hl__count' }, String(h.count)),
      el('span', { class: 'panel-hl__label' }, h.label),
      el('span', { class: 'panel-hl__go', html: ICONS.external })));
  });
  return panelWidget('Top security findings', grid);
}

/* Fact line — last heartbeat + issues counter as text with a pipe divider */
function renderPanelFacts(s) {
  const issuesN = ((s.health !== 'healthy' && s.health !== 'pending') ? 1 : 0) + (EXTRA_ISSUES[s.name] || []).length;
  return el('div', { class: 'panel-facts' },
    el('span', { class: 'panel-fact' },
      el('span', { class: 'panel-fact__label' }, 'Last heartbeat: '),
      el('span', { class: 'panel-fact__value' }, s.heartbeat)),
    el('span', { class: 'panel-fact__sep' }, '|'),
    el('span', { class: `panel-fact ${issuesN ? 'panel-fact--bad' : ''}` },
      el('span', { class: 'panel-fact__label' }, (issuesN === 1 ? 'Issue' : 'Issues') + ': '),
      el('span', { class: 'panel-fact__value' }, String(issuesN))));
}

/* Widget 3 — Scan Summary with a scan-date selector + checklist */
function scanLabel() {
  if (panelState.scan === 'last') return 'Last Scan';
  return fmtDate(panelState.scan);
}

function renderScanSection() {
  const host = $('#panel-scan-selector');
  if (!host) return;
  host.replaceChildren(renderScanSelector());
}

/* The scan-date dropdown selector (dropdown + clear + menu/calendar popovers) */
function renderScanSelector() {
  const selector = el('div', { class: 'panel-scan__selector' });
  const trigger = el('button', {
    class: `panel-scan__trigger ${panelState.menuOpen ? 'is-open' : ''}`,
    onclick: (e) => { e.stopPropagation(); panelState.menuOpen = !panelState.menuOpen; panelState.calendarOpen = false; renderScanSection(); },
  }, el('span', {}, scanLabel()), el('span', { class: 'panel-scan__caret', html: ICONS.caretDown }));
  selector.append(trigger);
  if (panelState.scan !== 'last') {
    selector.append(el('button', {
      class: 'panel-scan__clear', 'aria-label': 'Back to last scan',
      onclick: (e) => { e.stopPropagation(); panelState.scan = 'last'; panelState.menuOpen = false; panelState.calendarOpen = false; renderScanSection(); },
      html: ICONS.close,
    }));
  }

  if (panelState.menuOpen) {
    const menu = el('div', { class: 'panel-scan__menu' });
    const pick = (val) => { panelState.scan = val; panelState.menuOpen = false; panelState.calendarOpen = false; renderScanSection(); };
    menu.append(el('button', { class: `panel-scan__opt ${panelState.scan === 'last' ? 'is-active' : ''}`, onclick: (e) => { e.stopPropagation(); pick('last'); } }, 'Last Scan'));
    SCAN_DATES.slice(1).forEach(d => {
      menu.append(el('button', { class: `panel-scan__opt ${panelState.scan === d ? 'is-active' : ''}`, onclick: (e) => { e.stopPropagation(); pick(d); } }, fmtDate(d)));
    });
    menu.append(el('button', { class: 'panel-scan__opt panel-scan__opt--custom', onclick: (e) => { e.stopPropagation(); panelState.menuOpen = false; panelState.calendarOpen = true; renderScanSection(); } }, 'Custom…'));
    selector.append(menu);
  }

  if (panelState.calendarOpen) selector.append(renderScanCalendar());
  return selector;
}

/* Scan Summary widget — checklist for connected sensors, empty state otherwise */
function renderScanSummary(s) {
  const noData = s.health === 'disconnected' || s.health === 'never' || s.health === 'pending';
  if (noData) {
    return el('section', { class: 'panel-widget' },
      el('h3', { class: 'panel-widget__title' }, 'Scan Summary'),
      el('div', { class: 'panel-empty' },
        el('span', { class: 'panel-empty__icon', html: ICONS.file }),
        el('p', { class: 'panel-empty__title' }, 'No scan data available'),
        el('p', { class: 'panel-empty__note' }, 'This sensor has no completed scans while it is not connected.')));
  }
  return el('section', { class: 'panel-widget' },
    el('div', { class: 'panel-widget__head' },
      el('h3', { class: 'panel-widget__title' }, 'Scan Summary'),
      el('div', { id: 'panel-scan-selector' }, renderScanSelector())),
    renderScanChecklist());
}

/* The scan checklist (static for the selected scan) */
function renderScanChecklist() {
  const list = el('ul', { class: 'panel-checklist' });
  const cur = panelState.sensor && SENSORS.find(x => x.name === panelState.sensor);
  const items = cur && platformOf(cur) === 'vm' ? SCAN_CHECKLIST_VM : SCAN_CHECKLIST;
  items.forEach(item => {
    list.append(el('li', { class: 'panel-checklist__item' },
      el('span', { class: 'panel-checklist__tick', html: ICONS.check }),
      el('span', {}, item)));
  });
  return list;
}

/* Minimal month calendar for "Custom…": only completed-scan dates are green + clickable */
function renderScanCalendar() {
  const month = panelState.calMonth;
  const y = month.getFullYear(), m = month.getMonth();
  const first = new Date(y, m, 1);
  const startDow = first.getDay();
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const scanSet = new Set(SCAN_DATES);
  const iso = (d) => `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

  const cal = el('div', { class: 'panel-cal' });
  const nav = el('div', { class: 'panel-cal__nav' },
    el('button', { class: 'panel-cal__navbtn', 'aria-label': 'Previous month', onclick: (e) => { e.stopPropagation(); panelState.calMonth = new Date(y, m - 1, 1); renderScanSection(); }, html: ICONS.chevron }),
    el('span', { class: 'panel-cal__month' }, month.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })),
    el('button', { class: 'panel-cal__navbtn panel-cal__navbtn--next', 'aria-label': 'Next month', onclick: (e) => { e.stopPropagation(); panelState.calMonth = new Date(y, m + 1, 1); renderScanSection(); }, html: ICONS.chevron }));
  cal.append(nav);

  const grid = el('div', { class: 'panel-cal__grid' });
  ['S', 'M', 'T', 'W', 'T', 'F', 'S'].forEach(d => grid.append(el('span', { class: 'panel-cal__dow' }, d)));
  for (let i = 0; i < startDow; i++) grid.append(el('span', { class: 'panel-cal__cell panel-cal__cell--empty' }));
  for (let d = 1; d <= daysInMonth; d++) {
    const dateIso = iso(d);
    const hasScan = scanSet.has(dateIso);
    grid.append(el('button', {
      class: `panel-cal__cell ${hasScan ? 'has-scan' : ''} ${panelState.scan === dateIso ? 'is-active' : ''}`,
      disabled: !hasScan,
      onclick: hasScan ? (e) => { e.stopPropagation(); panelState.scan = dateIso; panelState.calendarOpen = false; renderScanSection(); } : null,
    }, String(d)));
  }
  cal.append(grid);
  cal.append(el('p', { class: 'panel-cal__hint' }, 'Dates with a completed scan are highlighted.'));
  return cal;
}

/* Assemble the whole drawer */
function renderDrawer(s) {
  const st = PANEL_STATUS[s.health] || PANEL_STATUS.healthy;

  const badges = el('div', { class: 'drawer__badges' },
    el('span', { class: `sev-badge sev-badge--${st.sev}` }, icon(st.sev === 'success' ? 'check' : st.sev === 'info' ? 'info' : 'warn'), el('span', {}, st.badge)));

  const head = el('div', { class: 'drawer__head' },
    el('div', { class: 'drawer__identity' },
      providerLogo(s.env),
      el('div', {},
        el('h2', { class: 'drawer__name' }, s.name),
        el('div', { class: 'drawer__meta' },
          ...drawerChips(s).map(c => el('span', { class: 'drawer__chip' }, c))))),
    el('button', { class: 'drawer__close', 'aria-label': 'Close panel', onclick: closeSensorPanel, html: ICONS.close }));

  const statusRow = el('div', { class: 'drawer__statusrow' },
    badges,
    st.conn ? el('span', { class: `drawer__conn drawer__conn--${CONN_TONE[st.conn] || 'bad'}` },
      el('span', { class: 'drawer__conn-dot' }), st.conn) : null);

  const bodyKids = [
    renderPanelFacts(s),
    ...renderPanelIssues(s),
    panelDivider('Coverage'),
    renderPanelCoverage(s),
    renderPanelHighlights(s),
    renderScanSummary(s)].filter(Boolean);

  const aside = el('aside', { class: 'drawer__panel', role: 'dialog', 'aria-modal': 'true', 'aria-label': `${s.name} details` },
    head,
    el('div', { class: 'drawer__scroll' },
      statusRow,
      ...bodyKids));

  return el('div', {
    class: 'drawer',
    onclick: (e) => {
      if (e.target === e.currentTarget) return closeSensorPanel();
      // close any open scan menu/calendar when clicking elsewhere in the panel
      if (panelState && (panelState.menuOpen || panelState.calendarOpen) && !e.target.closest('.panel-scan__selector')) {
        panelState.menuOpen = false; panelState.calendarOpen = false; renderScanSection();
      }
    },
  }, aside);
}

/* --------------------------------------------------------------------------
   Wizard state machine
   -------------------------------------------------------------------------- */
const STEPS = [
  { id: 'provider', label: 'Cloud provider' },
  { id: 'type',     label: 'Sensor type' },
  { id: 'method',   label: 'Installation method' },
  { id: 'install',  label: 'Install & connect' },
  { id: 'verify',   label: 'Verification' },
];

const state = {
  open: false,
  step: 0,
  provider: null,   // aws | gcp | azure | onprem
  type: null,       // k8s | vm
  method: null,     // helm | terraform | pulumi
  cluster: 'prod-eks-payments',
  region: 'us-east-1',
  namespace: 'sweet-security',
  masked: true,
  verifyState: 'idle', // idle | running | success | failed
  credentials: null,
};

const PROVIDERS = [
  { id: 'aws',    name: 'Amazon Web Services', meta: 'EKS, EC2, Fargate', tag: 'reco', enabled: true },
  { id: 'gcp',    name: 'Google Cloud',        meta: 'GKE, Compute Engine', enabled: false },
  { id: 'azure',  name: 'Microsoft Azure',     meta: 'AKS, Virtual Machines', enabled: false },
  { id: 'onprem', name: 'On-premises',         meta: 'Self-managed K8s / VMs', enabled: false },
];
const SENSOR_TYPES = {
  aws: [
    { id: 'k8s', name: 'Kubernetes sensor', meta: 'Runtime + K8s audit for EKS clusters', tag: 'reco', enabled: true },
    { id: 'vm',  name: 'EC2 / VM sensor',   meta: 'Host runtime for EC2 & self-managed VMs', enabled: false },
  ],
};
const METHODS = {
  k8s: [
    { id: 'helm',      name: 'Helm',      meta: 'Chart install into your cluster', tag: 'reco', enabled: true },
    { id: 'terraform', name: 'Terraform', meta: 'Manage the sensor as IaC', enabled: false },
    { id: 'pulumi',    name: 'Pulumi',    meta: 'Deploy via Pulumi program', enabled: false },
  ],
};

function genCredentials() {
  const rand = (n) => [...crypto.getRandomValues(new Uint8Array(n))].map(b => b.toString(16).padStart(2, '0')).join('');
  return {
    apiKey: `swt_live_${rand(12)}`,
    secret: `sk_${rand(20)}`,
    orgId: 'org_7f3a9c21',
  };
}

/* Build the generated Helm command as an array of lines.
   Each line is an array of tokens: { cls, text }. */
function helmSnippet() {
  const c = state.credentials;
  const secretShown = state.masked ? '•'.repeat(32) : c.secret;
  const T = (cls, text) => ({ cls, text });
  return [
    [T('cmd', 'helm'), T('', ' repo add sweet https://charts.sweet.security')],
    [T('cmd', 'helm'), T('', ' repo update')],
    [T('cmt', '# Installs the sensor DaemonSet into your EKS cluster')],
    [T('cmd', 'helm'), T('', ' upgrade --install sweet-sensor sweet/sensor '), T('flag', '\\')],
    [T('', '  --namespace '), T('flag', state.namespace), T('', ' --create-namespace '), T('flag', '\\')],
    [T('', '  --set '), T('', 'cloud.provider='), T('str', 'aws'), T('', ' '), T('flag', '\\')],
    [T('', '  --set '), T('', 'cloud.region='), T('str', state.region), T('', ' '), T('flag', '\\')],
    [T('', '  --set '), T('', 'sensor.apiKey='), T('str', c.apiKey), T('', ' '), T('flag', '\\')],
    [T('', '  --set '), T('', 'sensor.apiSecret='), T('str', secretShown), T('', ' '), T('flag', '\\')],
    [T('', '  --set '), T('', 'org.id='), T('str', c.orgId)],
  ];
}

/* Plain-text version for the clipboard (always the real secret) */
function helmPlain() {
  const c = state.credentials;
  return [
    'helm repo add sweet https://charts.sweet.security',
    'helm repo update',
    '# Installs the sensor DaemonSet into your EKS cluster',
    'helm upgrade --install sweet-sensor sweet/sensor \\',
    `  --namespace ${state.namespace} --create-namespace \\`,
    '  --set cloud.provider=aws \\',
    `  --set cloud.region=${state.region} \\`,
    `  --set sensor.apiKey=${c.apiKey} \\`,
    `  --set sensor.apiSecret=${c.secret} \\`,
    `  --set org.id=${c.orgId}`,
  ].join('\n');
}

/* --------------------------------------------------------------------------
   Rendering: stepper + step body
   -------------------------------------------------------------------------- */
function stepValue(id) {
  switch (id) {
    case 'provider': return state.provider ? PROVIDERS.find(p => p.id === state.provider).name : '';
    case 'type':     return state.type === 'k8s' ? 'Kubernetes' : state.type === 'vm' ? 'VM' : '';
    case 'method':   return state.method ? state.method[0].toUpperCase() + state.method.slice(1) : '';
    case 'install':  return state.credentials ? `${state.cluster}` : '';
    case 'verify':   return state.verifyState === 'success' ? 'Connected' : state.verifyState === 'failed' ? 'Failed' : '';
    default: return '';
  }
}

function renderStepper() {
  return el('aside', { class: 'stepper' },
    STEPS.map((s, i) => {
      const done = i < state.step || (STEPS[i].id === 'verify' && i === state.step && state.verifyState === 'success');
      const cls = done ? 'is-done' : i === state.step ? 'is-active' : '';
      const val = stepValue(s.id);
      const clickable = i < state.step;
      const attrs = { class: `stepper__item ${cls} ${clickable ? 'is-clickable' : ''}` };
      if (clickable) {
        const go = () => goToStep(i);
        attrs.role = 'button';
        attrs.tabindex = '0';
        attrs['aria-label'] = `Go back to step ${i + 1}: ${s.label}`;
        attrs.onclick = go;
        attrs.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } };
      }
      return el('div', attrs,
        el('span', { class: 'stepper__marker', html: done ? ICONS.check : String(i + 1) }),
        el('span', { class: 'stepper__text' },
          el('span', { class: 'stepper__label' }, s.label),
          val ? el('span', { class: 'stepper__value' }, val) : null));
    }));
}

/* Jump straight to an earlier (completed) step from the left rail */
function goToStep(i) {
  if (i < 0 || i >= STEPS.length || i === state.step) return;
  clearVerifyTimers();
  if (STEPS[state.step].id === 'verify') state.verifyState = 'idle';
  state.step = i;
  rerenderStep();
}

function optionCard(opt, group, selected, onSelect) {
  const logos = { aws: 'cloud', gcp: 'cloud', azure: 'cloud', onprem: 'server', k8s: 'k8s', vm: 'server', helm: 'helm', terraform: 'file', pulumi: 'file' };
  // Option ids that render a brand SVG image instead of a line icon
  const imgLogos = { aws: 'AWS', gcp: 'GCP', azure: 'Azure', k8s: 'Kubernetes', vm: 'Amazon EC2', helm: 'Helm', terraform: 'Terraform', pulumi: 'Pulumi' };
  const imgFiles = { aws: 'aws', gcp: 'gcp', azure: 'azure', k8s: 'kubernetes', vm: 'ec2', helm: 'helm', terraform: 'terraform', pulumi: 'pulumi' };
  const card = el('button', {
    class: `option ${selected ? 'is-selected' : ''} ${opt.enabled ? '' : 'is-disabled'}`,
    type: 'button',
    'aria-pressed': selected ? 'true' : 'false',
    disabled: !opt.enabled,
    onclick: opt.enabled ? () => onSelect(opt.id) : null,
  },
    el('span', { class: 'option__check', html: ICONS.check }),
    imgLogos[opt.id]
      ? el('span', { class: 'option__logo' }, el('img', { src: `assets/logos/${imgFiles[opt.id]}.svg`, alt: imgLogos[opt.id] }))
      : el('span', { class: 'option__logo', html: ICONS[logos[opt.id]] || ICONS.cloud }),
    el('span', { class: 'option__name' }, opt.name),
    el('span', { class: 'option__meta' }, opt.meta),
    opt.tag === 'reco' ? el('span', { class: 'option__tag option__tag--reco' }, 'Recommended')
      : opt.enabled ? null : el('span', { class: 'option__tag option__tag--soon' }, 'Coming soon')
  );
  return card;
}

function stepHead(eyebrow, title, desc) {
  return el('div', { class: 'step__head' },
    el('div', { class: 'step__eyebrow' }, eyebrow),
    el('h2', { class: 'ds-page-title step__title' }, title),
    el('p', { class: 'ds-body step__desc' }, desc));
}

function renderStepBody() {
  const wrap = el('div', { class: 'step' });
  const id = STEPS[state.step].id;

  if (id === 'provider') {
    wrap.append(
      stepHead('1. Cloud provider', 'Where do you want to deploy?', 'Choose the environment hosting the workloads you want Sweet to protect.'),
      el('div', { class: 'option-grid' },
        PROVIDERS.map(p => optionCard(p, 'provider', state.provider === p.id, (v) => { state.provider = v; state.type = null; state.method = null; next(); }))),
      el('div', { class: 'callout callout--info', style: 'margin-top:var(--space-2xl)' },
        el('span', { class: 'callout__icon', html: ICONS.info }),
        el('span', { class: 'callout__body', html: 'This prototype implements the <b>AWS → Kubernetes → Helm</b> path end-to-end. Other providers are shown for context.' })));
  }

  if (id === 'type') {
    wrap.append(
      stepHead('2. Sensor type', 'What should the sensor monitor?', 'Kubernetes sensors run as a DaemonSet and stream cluster audit and runtime telemetry.'),
      el('div', { class: 'option-grid' },
        (SENSOR_TYPES[state.provider] || SENSOR_TYPES.aws).map(t => optionCard(t, 'type', state.type === t.id, (v) => { state.type = v; state.method = null; next(); }))));
  }

  if (id === 'method') {
    wrap.append(
      stepHead('3. Installation method', 'How do you want to install it?', 'Pick the tool that best fits your delivery pipeline.'),
      el('div', { class: 'option-grid' },
        (METHODS[state.type] || METHODS.k8s).map(m => optionCard(m, 'method', state.method === m.id, (v) => { state.method = v; next(); }))));
  }

  if (id === 'install') {
    if (!state.credentials) state.credentials = genCredentials();
    const c = state.credentials;

    const codeEl = el('code', { class: 'codeblock__code' });
    renderCode(codeEl);

    const copyCmdBtn = el('button', { class: 'copy-btn', 'data-label': 'Copy command',
      onclick: (e) => copyText(helmPlain(), e.currentTarget) },
      el('span', { html: ICONS.copy }), el('span', {}, 'Copy command'));

    wrap.append(
      stepHead('4. Install & connect', 'Install the sensor', `Run the generated Helm command from a machine with kubectl access to ${state.cluster} — nothing is applied from this screen.`),

      el('div', { class: 'stack stack--lg' },
        // Context fields
        el('div', { class: 'field-grid' },
          field('Target cluster', selectField(state.cluster, ['prod-eks-payments','prod-eks-checkout','prod-eks-ledger','new-eks-cluster'], (v)=>{ state.cluster=v; refreshInstall(); })),
          field('Region', selectField(state.region, ['us-east-1','us-west-2','eu-west-1','ap-south-1'], (v)=>{ state.region=v; refreshInstall(); })),
          field('Namespace', inputField(state.namespace, (v)=>{ state.namespace = v || 'sweet-security'; refreshInstall(); })),
          field('Sensor group', selectField('production', ['production','staging','sandbox'], ()=>{}))),

        // Credentials
        el('div', {},
          el('div', { class: 'row-inline', style: 'justify-content:space-between;margin-bottom:var(--space-sm)' },
            el('span', { class: 'ds-body-strong' }, 'Deployment credentials'),
            el('button', { class: 'sds-action-link', onclick: () => { state.credentials = genCredentials(); refreshInstall(); toast('New credentials generated'); } }, 'Rotate')),
          el('div', { class: 'cred-grid' },
            credCard('key', 'API key', c.apiKey, false),
            credCard('key', 'API secret', c.secret, true))),

        // Generated command
        el('div', {},
          el('div', { class: 'row-inline', style: 'justify-content:space-between;margin-bottom:var(--space-2xs)' },
            el('span', { class: 'ds-body-strong' }, 'Generated Helm command'),
            maskToggleBtn()),
          el('p', { class: 'ds-caption', style: 'margin:0 0 var(--space-sm);color:var(--color-text-secondary)' },
            'Copy and run this command in a shell that is able to connect to ',
            el('span', { style: 'font-weight:var(--font-weight-medium);color:var(--color-text-primary)' }, state.cluster),
            ' k8s cluster.'),
          el('div', { class: 'codeblock' },
            el('div', { class: 'codeblock__bar' },
              el('span', { class: 'codeblock__file' }, icon('helm'), 'install-sensor.sh'),
              copyCmdBtn),
            el('pre', { class: 'codeblock__pre' }, codeEl))),

        // Prereqs
        el('div', { class: 'callout callout--warn' },
          el('span', { class: 'callout__icon', html: ICONS.warn }),
          el('span', { class: 'callout__body', html: '<b>Before you run this:</b> ensure outbound <b>HTTPS (443)</b> to <b>api.sweet.security</b> is allowed, your IAM role can pull the chart, and Helm ≥ 3.8 is installed. The secret is shown once — store it in your secrets manager.' }))
      ));
  }

  if (id === 'verify') {
    wrap.append(renderVerify());
  }

  return wrap;
}

/* Syntax-highlight the Helm snippet into the given <code> element */
function renderCode(codeEl) {
  codeEl.innerHTML = '';
  const clsMap = { cmd: 'tok-cmd', flag: 'tok-flag', str: 'tok-str', cmt: 'tok-cmt' };
  const lines = helmSnippet();
  lines.forEach((line, i) => {
    line.forEach(tok => codeEl.append(el('span', { class: clsMap[tok.cls] || '' }, tok.text)));
    if (i < lines.length - 1) codeEl.append(document.createTextNode('\n'));
  });
}

/* Field helpers */
function field(label, control, hint) {
  return el('label', { class: 'field' },
    el('span', { class: 'field__label' }, label),
    control,
    hint ? el('span', { class: 'field__hint' }, hint) : null);
}
function inputField(value, onInput) {
  const wrap = el('label', { class: 'sds-input' });
  const input = el('input', { class: 'sds-input__field', type: 'text', value });
  input.addEventListener('input', (e) => onInput(e.target.value));
  wrap.append(input);
  return wrap;
}
function selectField(value, options, onChange) {
  const wrap = el('span', { class: 'select-wrap' });
  const sel = el('select', { class: 'sds-select select-wrap__select' });
  options.forEach(o => sel.append(el('option', { value: o, selected: o === value }, o)));
  sel.addEventListener('change', (e) => onChange(e.target.value));
  wrap.append(sel, el('span', { class: 'select-wrap__chevron', html: ICONS.chevron }));
  return wrap;
}
function credCard(iconName, label, value, sensitive) {
  const card = el('div', { class: `cred ${sensitive && state.masked ? 'is-masked' : ''}` });
  const valEl = el('span', { class: 'cred__value' }, sensitive && state.masked ? mask(value) : value);
  const copyBtn = el('button', { class: 'copy-btn copy-btn--light', 'data-label': 'Copy',
    onclick: (e) => copyText(value, e.currentTarget) }, el('span', { html: ICONS.copy }), el('span', {}, 'Copy'));
  const row = el('div', { class: 'cred__value-row' }, valEl);
  if (sensitive) {
    row.append(el('button', {
      class: 'icon-toggle', 'aria-label': state.masked ? 'Reveal secret' : 'Hide secret',
      html: state.masked ? ICONS.eye : ICONS.eyeoff,
      onclick: () => { state.masked = !state.masked; refreshInstall(); }
    }));
  }
  row.append(copyBtn);
  card.append(
    el('span', { class: 'cred__label' }, icon(iconName), label,
      sensitive ? el('span', { class: 'sds-chip sds-chip--data', style: 'margin-left:auto' }, 'sensitive') : null),
    row);
  return card;
}
function mask(v) { return '•'.repeat(Math.min(v.length, 40)); }
function maskToggleBtn() {
  return el('button', { class: 'sds-action-link',
    onclick: () => { state.masked = !state.masked; refreshInstall(); } },
    state.masked ? 'Show secret in command' : 'Hide secret in command');
}

/* Re-render only the install step in place (keeps scroll position) */
function refreshInstall() {
  if (STEPS[state.step].id !== 'install') return;
  const scroll = $('.wizard__scroll');
  const top = scroll ? scroll.scrollTop : 0;
  $('.wizard__inner').replaceChildren(renderStepBody());
  $('#stepper-host').replaceChildren(renderStepper());
  if (scroll) $('.wizard__scroll').scrollTop = top;
  updateFooter();
}

/* --------------------------------------------------------------------------
   Verification step (simulated live connection)
   -------------------------------------------------------------------------- */
const VERIFY_CHECKS = [
  { id: 'chart',   label: 'Helm release deployed (sweet-sensor)' },
  { id: 'pods',    label: 'Sensor pods scheduled & running' },
  { id: 'auth',    label: 'Sensor authenticated with Sweet' },
  { id: 'reach',   label: 'Outbound connection to api.sweet.security' },
  { id: 'telem',   label: 'First telemetry received' },
];

let verifyTimers = [];
function clearVerifyTimers() { verifyTimers.forEach(clearTimeout); verifyTimers = []; }

function renderVerify() {
  const wrap = el('div', { class: 'step' });
  const s = state.verifyState;

  const heroIcon = el('span', { class: `verify-hero__icon ${s === 'success' ? 'is-success' : s === 'failed' ? 'is-error' : ''}` });
  heroIcon.innerHTML = s === 'success' ? ICONS.check : s === 'failed' ? ICONS.warn : ICONS.shield;

  const heroTitle = s === 'success' ? 'Sensor connected'
    : s === 'failed' ? 'Sensor could not connect'
    : s === 'running' ? 'Verifying deployment…'
    : 'Verify the deployment';
  const heroSub = s === 'success' ? 'Telemetry is flowing. Coverage updated across your dashboards.'
    : s === 'failed' ? 'The sensor installed but never reached Sweet. Follow the guidance below.'
    : s === 'running' ? 'Typically takes 2–5 minutes. You can keep this open or close it — we\'ll keep checking.'
    : 'Once you\'ve run the command, start verification. Sweet checks the deployment for you — no need to guess if it worked.';

  const checklist = el('div', { class: 'checklist' });
  const failIdx = VERIFY_CHECKS.findIndex(c => c.id === 'reach');
  VERIFY_CHECKS.forEach((c, i) => {
    let kind = 'idle';
    if (s === 'success') { kind = 'done'; }
    else if (s === 'failed') {
      if (i < failIdx) { kind = 'done'; }
      else if (i === failIdx) { kind = 'error'; }
    }
    const cls = kind === 'done' ? 'is-done' : kind === 'error' ? 'is-error' : '';
    checklist.append(el('div', { class: `check ${cls}`, id: `check-${c.id}` },
      el('span', { class: 'check__marker' }, checkMarker(kind)),
      el('span', { class: 'check__label' }, c.label)));
  });

  const card = el('div', { class: 'verify-card' },
    el('div', { class: 'verify-hero' },
      heroIcon,
      el('div', {},
        el('h3', { class: 'ds-section verify-hero__title' }, heroTitle),
        el('p', { class: 'ds-body verify-hero__sub' }, heroSub))),
    checklist);

  wrap.append(
    stepHead('5. Verification', 'Connection & health', 'Sweet confirms the sensor end-to-end so you know coverage is real, not just that an install command ran.'),
    card);

  // Success summary + failure diagnostics rendered after mount
  if (s === 'success') wrap.append(successPanel());
  if (s === 'failed')  wrap.append(failurePanel());
  return wrap;
}

function checkMarker(kind) {
  if (kind === 'done')    return htmlSpan(ICONS.check);
  if (kind === 'error')   return htmlSpan(ICONS.close);
  if (kind === 'active')  return el('span', { class: 'spinner' });
  return document.createTextNode('');
}
function htmlSpan(h) { const s = el('span'); s.innerHTML = h; return s.firstChild; }

function setCheck(id, kind) {
  const row = $(`#check-${id}`);
  if (!row) return;
  row.className = `check ${kind === 'done' ? 'is-done' : kind === 'active' ? 'is-active' : kind === 'error' ? 'is-error' : ''}`;
  const marker = row.querySelector('.check__marker');
  marker.replaceChildren(checkMarker(kind === 'done' ? 'done' : kind === 'active' ? 'active' : kind === 'error' ? 'error' : 'idle'));
}

/* Simulate the live verification. Fails at "reach" ~ deterministic for demo control:
   first run succeeds; use the "Simulate failure" affordance to see fallback. */
function startVerify(forceFail = false) {
  clearVerifyTimers();
  state.verifyState = 'running';
  rerenderStep();
  const failAt = forceFail === true ? 'reach' : null;
  // Only run checks up to (and including) the failing one.
  const failIdx = failAt ? VERIFY_CHECKS.findIndex(c => c.id === failAt) : VERIFY_CHECKS.length - 1;
  const seq = VERIFY_CHECKS.slice(0, failIdx + 1).map(c => c.id);

  let delay = 400;
  seq.forEach((id, i) => {
    const isLast = i === seq.length - 1;
    verifyTimers.push(setTimeout(() => setCheck(id, 'active'), delay));
    delay += 900 + Math.random() * 500;
    verifyTimers.push(setTimeout(() => {
      if (failAt && isLast) {
        setCheck(id, 'error');
        state.verifyState = 'failed';
        rerenderStep();
      } else {
        setCheck(id, 'done');
        if (isLast) {
          state.verifyState = 'success';
          rerenderStep();
          applyDeploymentToTable();
        }
      }
    }, delay));
  });
}

function successPanel() {
  return el('div', { class: 'stack stack--md', style: 'margin-top:var(--space-lg)' },
    el('div', { class: 'callout callout--info' },
      el('span', { class: 'callout__icon', html: ICONS.info }),
      el('span', { class: 'callout__body', html: 'A new row for <b>' + state.cluster + '</b> now appears in your Sensors list with live health.' })),
    el('dl', { class: 'summary-list' },
      dt('Provider'), dd('AWS · ' + state.region),
      dt('Sensor'), dd('Kubernetes (Helm)'),
      dt('Namespace'), dd(state.namespace),
      dt('Org ID'), dd(state.credentials.orgId)));
}

function failurePanel() {
  return el('div', { class: 'stack stack--md', style: 'margin-top:var(--space-lg)' },
    el('div', { class: 'diagnostics' },
      el('div', { class: 'diagnostics__title' }, icon('warn'), 'Unable to reach api.sweet.security'),
      el('p', { class: 'ds-body', style: 'color:var(--color-text-primary);margin:0' }, 'The pods are running and authenticated, but outbound traffic is being blocked before it reaches Sweet. This is almost always a network policy, firewall, or proxy issue — not the sensor itself.'),
      el('p', { class: 'ds-body-strong', style: 'margin:var(--space-md) 0 0' }, 'Check, in order:'),
      el('ul', { class: 'diagnostics__list ds-body' },
        el('li', {}, 'Egress firewall / security group allows outbound TCP 443 to *.sweet.security'),
        el('li', {}, 'Any HTTP(S) proxy is passed via --set proxy.url=… and trusts our certificate'),
        el('li', {}, 'Cluster egress NetworkPolicy does not drop traffic from the ' + state.namespace + ' namespace'),
        el('li', {}, 'DNS inside the cluster resolves api.sweet.security'))),
    el('div', { class: 'row-inline' },
      el('button', { class: 'sds-btn sds-btn--primary sds-btn--md', onclick: () => startVerify(false) }, icon('refresh'), 'Retry verification'),
      el('button', { class: 'sds-btn sds-btn--outline sds-btn--md', onclick: () => { state.step = 3; rerenderStep(); } }, 'Back to install'),
      el('a', { class: 'sds-btn sds-btn--ghost sds-btn--md', href: '#', onclick: () => { toast('Opening network troubleshooting guide…'); return false; } }, 'Troubleshooting guide', icon('external'))));
}

function dt(t) { return el('dt', {}, t); }
function dd(t) { return el('dd', {}, t); }

/* When deployment succeeds, reflect it in the overview table */
function applyDeploymentToTable() {
  if (SENSORS.some(s => s.name === state.cluster && s.health === 'healthy')) return;
  const existing = SENSORS.find(s => s.name === state.cluster);
  if (existing) { existing.health = 'healthy'; existing.heartbeat = 'just now'; existing.version = 'v4.8.1'; existing.latest = true; }
  else SENSORS.unshift({ name: state.cluster, env: 'AWS · ' + state.region, provider: 'cloud', type: 'K8s (Helm)', health: 'healthy', version: 'v4.8.1', latest: true, heartbeat: 'just now' });
  renderSensorRows();
}

/* --------------------------------------------------------------------------
   Wizard shell / navigation
   -------------------------------------------------------------------------- */
function canAdvance() {
  const id = STEPS[state.step].id;
  if (id === 'provider') return !!state.provider;
  if (id === 'type')     return !!state.type;
  if (id === 'method')   return !!state.method;
  if (id === 'install')  return true;
  if (id === 'verify')   return state.verifyState === 'success';
  return false;
}

function next() {
  if (state.step < STEPS.length - 1 && canAdvance()) { state.step++; rerenderStep(); }
}
function back() {
  if (state.step > 0) { state.step--; rerenderStep(); }
}

function openWizard() {
  state.open = true; state.step = 0;
  state.provider = null; state.type = null; state.method = null;
  state.credentials = null; state.masked = true; state.verifyState = 'idle';
  const root = $('#wizard-root');
  root.innerHTML = '';
  const shell = el('div', { class: 'wizard', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Deploy a sensor',
    onclick: (e) => { if (e.target === e.currentTarget) closeWizard(); } },
    el('div', { class: 'wizard__card' },
      el('div', { class: 'wizard__head' },
        el('div', { class: 'wizard__title-group' },
          el('span', { class: 'wizard__eyebrow' }, 'Deploy sensor'),
          el('span', { class: 'ds-section wizard__title' }, 'New sensor deployment')),
        el('button', { class: 'sds-btn sds-btn--outline sds-btn--md wizard__close', onclick: closeWizard }, icon('close'), 'Close')),
      el('div', { class: 'wizard__body', id: 'wizard-body' })));
  root.append(shell);
  renderWizardBody();
  document.addEventListener('keydown', onKeydown);
}

/* Stepped flow body */
function renderWizardBody() {
  const body = $('#wizard-body');
  if (!body) return;
  body.replaceChildren(
    el('div', { class: 'wizard__layout' },
      el('div', { id: 'stepper-host' }, renderStepper()),
      el('div', { class: 'wizard__content' },
        el('div', { class: 'wizard__scroll' }, el('div', { class: 'wizard__inner' }, renderStepBody())))),
    el('div', { class: 'wizard__footer', id: 'wizard-footer' }));
  updateFooter();
}

function closeWizard() {
  clearVerifyTimers();
  state.open = false;
  $('#wizard-root').innerHTML = '';
  document.removeEventListener('keydown', onKeydown);
}

function onKeydown(e) { if (e.key === 'Escape') closeWizard(); }

function rerenderStep() {
  $('#stepper-host').replaceChildren(renderStepper());
  $('.wizard__inner').replaceChildren(renderStepBody());
  $('.wizard__scroll').scrollTop = 0;
  updateFooter();
}

function updateFooter() {
  const footer = $('#wizard-footer');
  if (!footer) return;
  footer.innerHTML = '';
  const id = STEPS[state.step].id;

  const actions = el('div', { class: 'wizard__footer-actions' });
  const completed = id === 'verify' && state.verifyState === 'success';
  if (state.step > 0) actions.append(el('button', { class: 'sds-btn sds-btn--outline sds-btn--md', disabled: completed, onclick: back }, 'Back'));

  if (id === 'verify') {
    if (state.verifyState === 'success') {
      actions.append(el('button', { class: 'sds-btn sds-btn--primary sds-btn--md', onclick: () => { const name = state.cluster; closeWizard(); toast('Deployment complete — sensor is live'); highlightSensor(name); } }, icon('check'), 'Finish'));
    } else if (state.verifyState === 'failed') {
      actions.append(el('button', { class: 'sds-btn sds-btn--outline sds-btn--md', onclick: closeWizard }, 'Close'));
    } else {
      // running: verification is already in progress; offer a demo failure trigger
      actions.append(
        el('button', { class: 'sds-btn sds-btn--ghost sds-btn--md', onclick: () => startVerify(true), title: 'Demo the failure fallback UI' }, 'Simulate failure'));
    }
  } else if (id === 'install') {
    actions.append(el('button', { class: 'sds-btn sds-btn--primary sds-btn--md', onclick: () => { state.step = STEPS.findIndex(s => s.id === 'verify'); startVerify(false); } }, 'Verify Deployment', icon('shield')));
  } else {
    actions.append(el('button', {
      class: 'sds-btn sds-btn--primary sds-btn--md' + (canAdvance() ? '' : ' is-disabled'),
      disabled: !canAdvance(), onclick: next
    }, 'Continue'));
  }

  footer.append(actions);
}

/* --------------------------------------------------------------------------
   Overview view toggles + boot
   -------------------------------------------------------------------------- */
function showEmpty(empty) {
  $('#view-populated').classList.toggle('is-hidden', empty);
  $('#view-empty').classList.toggle('is-hidden', !empty);
}

function boot() {
  renderFilters();
  renderHead();
  renderSortControl();
  renderSensorRows();
  // Close any open filter dropdown when clicking outside the filter bar
  document.addEventListener('click', (e) => {
    if (filterState.open && !e.target.closest('#filters')) { filterState.open = null; renderFilters(); }
    if (sortMenuOpen && !e.target.closest('#sort-control')) { sortMenuOpen = false; renderSortControl(); }
  });
  $('#deploy-cta').addEventListener('click', openWizard);
  $$('.deploy-cta').forEach(b => b.addEventListener('click', openWizard));
  $('#demo-empty-toggle').addEventListener('click', () => showEmpty(true));
  $('#demo-populated-toggle').addEventListener('click', () => showEmpty(false));
}

document.addEventListener('DOMContentLoaded', boot);
