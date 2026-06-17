/* ============================================================================
   AEGIS — Device Intelligence Console — application logic (vanilla JS).
   Fully client-side. No network. Renders the shell + all views from MOCK.
   ========================================================================== */
(function () {
  "use strict";
  var M = window.MOCK, C = window.CHARTS, P = M.PLATFORMS;

  /* ----------------------------------------------------------- icon set --- */
  var ICONS = {
    shield: '<path d="M12 2 4 5v6c0 5 3.4 8.6 8 10 4.6-1.4 8-5 8-10V5l-8-3Z" fill="currentColor" opacity=".25"/><path d="M12 2 4 5v6c0 5 3.4 8.6 8 10 4.6-1.4 8-5 8-10V5l-8-3Z" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="m9 12 2 2 4-4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>',
    devices: '<rect x="3" y="4" width="14" height="11" rx="2"/><path d="M3 18h14"/><rect x="18" y="8" width="4" height="11" rx="1.3"/>',
    target: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3.4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>',
    ops: '<path d="M4 7h16M4 12h16M4 17h10"/><circle cx="18.5" cy="17" r="1.6"/>',
    alert: '<path d="M12 4 3 19h18L12 4Z"/><path d="M12 10v4M12 17h.01"/>',
    report: '<path d="M7 3h7l4 4v14H7z" /><path d="M14 3v4h4"/><path d="M10 13h5M10 16h5"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.2-3.2"/>',
    bell: '<path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z"/><path d="M10 20a2 2 0 0 0 4 0"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    chevron: '<path d="m9 6 6 6-6 6"/>',
    chevronL: '<path d="m15 6-6 6 6 6"/>',
    chat: '<path d="M4 5h16v11H8l-4 4z"/>',
    image: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9.5" r="1.6"/><path d="m4 18 5-5 4 3 3-2 4 4"/>',
    phone: '<path d="M5 4h4l1.5 5-2 1.5a12 12 0 0 0 5 5l1.5-2 5 1.5v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z"/>',
    users: '<circle cx="9" cy="8" r="3.2"/><path d="M3.5 19a5.5 5.5 0 0 1 11 0"/><path d="M16 5.5a3 3 0 0 1 0 5.6M16.5 19a5.5 5.5 0 0 0-2-4.3"/>',
    pin: '<path d="M12 21s7-6 7-11a7 7 0 0 0-14 0c0 5 7 11 7 11Z"/><circle cx="12" cy="10" r="2.6"/>',
    grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
    sms: '<path d="M4 5h16v10H9l-4 3v-3H4z"/><path d="M8 10h.01M12 10h.01M16 10h.01"/>',
    pinBadge: '<path d="M12 2 4 5v6c0 5 3.4 8.6 8 10 4.6-1.4 8-5 8-10V5l-8-3Z"/>',
    whatsapp: '<path d="M12 3a9 9 0 0 0-7.7 13.6L3 21l4.5-1.2A9 9 0 1 0 12 3Z"/><path d="M8.5 8.2c.2-.5.4-.5.6-.5h.5c.2 0 .4 0 .6.5l.7 1.6c.1.2 0 .4-.1.5l-.5.6c-.1.1-.2.3 0 .6.3.5.8 1.1 1.4 1.5.6.4.9.5 1.1.4l.6-.5c.2-.1.4-.1.6 0l1.5.8c.2.1.3.3.3.5 0 .8-.6 1.5-1.3 1.6-.6.1-1.3.2-3.1-.7-2.2-1.1-3.6-3.4-3.7-3.6-.1-.2-.9-1.2-.9-2.3 0-1.1.6-1.6.8-1.8Z" fill="#0a0f18" stroke="none"/>',
    telegram: '<circle cx="12" cy="12" r="9"/><path d="m7 12 9-3.5-1.4 7.5-2.2-2-1.8 1.6-.4-2.8 4-3.4-5 2.7Z" fill="#0a0f18" stroke="none"/>',
    signal: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4" fill="#0a0f18" stroke="none"/>',
    check: '<path d="m5 12 4.5 4.5L19 7"/>',
    checkBold: '<path d="m5 12 4.5 4.5L19 7" stroke-width="2.4"/>',
    x: '<path d="M6 6l12 12M18 6 6 18"/>',
    arrowIn: '<path d="M7 7v10h10"/><path d="M17 7 7 17" stroke-dasharray="0"/>',
    arrowOut: '<path d="M17 17V7H7"/><path d="M7 17 17 7"/>',
    arrowMissed: '<path d="M17 7 7 17"/><path d="M17 13V7h-6"/>',
    flag: '<path d="M5 21V4M5 4l9 2-1.5 4L14 14l-9-2"/>',
    play: '<path d="m8 5 11 7-11 7z" fill="currentColor" stroke="none"/>',
    doc: '<path d="M7 3h7l4 4v14H7z"/><path d="M14 3v4h4"/>',
    audio: '<path d="M4 10v4M8 6v12M12 9v6M16 4v16M20 10v4"/>',
    video: '<rect x="3" y="6" width="13" height="12" rx="2"/><path d="m16 10 5-3v10l-5-3z"/>',
    photo: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9.5" r="1.6"/><path d="m4 18 5-5 4 3 3-2 4 4"/>',
    live: '<circle cx="12" cy="12" r="3" fill="currentColor" stroke="none"/><path d="M6 6a8.5 8.5 0 0 0 0 12M18 6a8.5 8.5 0 0 1 0 12"/>',
    battery: '<rect x="2" y="7" width="18" height="10" rx="2"/><path d="M22 11v2"/>',
    sim: '<path d="M5 3h9l5 5v13H5z"/><rect x="8" y="12" width="8" height="6" rx="1"/>',
    map: '<path d="m9 4 6 2 6-2v14l-6 2-6-2-6 2V6z"/><path d="M9 4v14M15 6v14"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    home: '<path d="M4 11 12 4l8 7"/><path d="M6 10v9h12v-9"/>',
    briefcase: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5h8v2"/>',
    download: '<path d="M12 4v10M8 11l4 4 4-4"/><path d="M5 19h14"/>',
    eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
    filter: '<path d="M3 5h18l-7 8v5l-4 2v-7z"/>',
    sparkles: '<path d="M12 3v6M9 6h6M6 12l1.5 4L12 17l-4.5 1L6 22l-1.5-4L0 17l4.5-1z" transform="scale(.8)"/>',
    refresh: '<path d="M4 12a8 8 0 0 1 14-5l2 2M20 12a8 8 0 0 1-14 5l-2-2"/><path d="M20 4v5h-5M4 20v-5h5"/>',
    lock: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
    money: '<rect x="3" y="6" width="18" height="12" rx="2"/><circle cx="12" cy="12" r="2.6"/>',
    waveform: '<path d="M4 10v4M8 6v12M12 9v6M16 4v16M20 10v4"/>'
  };
  function icon(name, cls) {
    var p = ICONS[name] || ICONS.target;
    return '<svg class="ic ' + (cls || "") + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + p + "</svg>";
  }
  function platGlyph(key) {
    var g = { whatsapp: "whatsapp", telegram: "telegram", signal: "signal", email: "mail", sms: "sms", browser: "globe", maps: "pin", calls: "phone" };
    return g[key] || "chat";
  }
  function platColor(key) { return P[key] ? P[key].color : "#8A93A6"; }
  function platName(key) { return P[key] ? P[key].name : key; }

  /* ----------------------------------------------------------- helpers ---- */
  function h(html) { var t = document.createElement("template"); t.innerHTML = html.trim(); return t.content.firstElementChild; }
  function num(n) { return n.toLocaleString("en-US"); }
  function av(name, hue, size) {
    var a = M.util.avatar(name, hue);
    return '<div class="avatar ' + (size || "") + '" style="--h:' + hue + '">' + a.initials + "</div>";
  }
  function glyphBadge(key, size) {
    var col = platColor(key);
    return '<span class="glyph-badge" style="background:' + hexA(col, .14) + ';color:' + col + '">' + icon(platGlyph(key)) + "</span>";
  }
  function hexA(hex, a) {
    var c = hex.replace("#", "");
    var r = parseInt(c.substr(0, 2), 16), g = parseInt(c.substr(2, 2), 16), b = parseInt(c.substr(4, 2), 16);
    return "rgba(" + r + "," + g + "," + b + "," + a + ")";
  }

  /* --------------------------------------------------------- app state ---- */
  var state = {
    route: "devices",
    deviceId: null,
    tab: "overview",
    activeAccount: "whatsapp:Personal",
    activeConv: "c1",
    mediaFilter: "all",
    callFilter: "all",
    contactSort: "interactions",
    deviceSearch: "",
    convSearch: ""
  };

  var app = document.getElementById("app");

  /* ============================================================ RAIL ====== */
  function renderRail() {
    var items = [
      { key: "devices", icon: "devices", label: "Devices" },
      { key: "operations", icon: "ops", label: "Operations" },
      { key: "alerts", icon: "alert", label: "Alerts", dot: true },
      { key: "reports", icon: "report", label: "Reports" },
      { key: "settings", icon: "settings", label: "Settings" }
    ];
    var active = (state.route === "device") ? "devices" : state.route;
    var btns = items.map(function (it) {
      return '<button class="rail-btn ' + (active === it.key ? "active" : "") + '" data-nav="' + it.key + '">'
        + icon(it.icon)
        + (it.dot ? '<span class="dot" style="position:absolute;top:9px;right:10px;width:7px;height:7px;border-radius:50%;background:var(--bad)"></span>' : "")
        + '<span class="rail-tip">' + it.label + "</span></button>";
    }).join("");
    return '<aside class="rail">'
      + '<div class="logo">' + icon("shield") + "</div>"
      + btns
      + '<div class="rail-sp"></div>'
      + '<button class="rail-btn" data-nav="settings"><span class="avatar sm" style="--h:210">' + M.analyst.initials + "</span></button>"
      + "</aside>";
  }

  /* ============================================================ TOPBAR ==== */
  function renderTopbar() {
    var crumbs = '<span class="crumb">AEGIS</span><span class="sep">' + icon("chevron") + "</span>";
    if (state.route === "device") {
      var d = currentDevice();
      crumbs += '<span class="crumb" data-nav="devices" style="cursor:pointer">Devices</span><span class="sep">' + icon("chevron") + '</span><span class="crumb active">' + d.alias + "</span>";
    } else {
      var labels = { devices: "Devices", operations: "Operations", alerts: "Alerts", reports: "Reports", settings: "Settings" };
      crumbs += '<span class="crumb active">' + (labels[state.route] || "Devices") + "</span>";
    }
    return '<header class="topbar">'
      + '<div class="crumbs">' + crumbs + "</div>"
      + '<label class="global-search">' + icon("search")
      + '<input id="globalSearch" placeholder="Search targets, contacts, keywords, locations…" />'
      + "<kbd>Ctrl K</kbd></label>"
      + '<div class="topbar-spacer"></div>'
      + '<div class="top-actions">'
      + '<button class="icon-btn" title="Live feed">' + icon("live") + "</button>"
      + '<button class="icon-btn" data-nav="alerts" title="Alerts">' + icon("bell") + '<span class="dot"></span></button>'
      + '<div class="who"><div class="meta" style="text-align:right"><b>' + M.analyst.name + "</b><span>" + M.analyst.unit + " · " + M.analyst.clearance + "</span></div>"
      + av(M.analyst.name, 210) + "</div>"
      + "</div></header>";
  }

  /* ============================================================ ROUTER ==== */
  function currentDevice() {
    return M.devices.filter(function (d) { return d.id === state.deviceId; })[0] || M.devices[0];
  }
  function render() {
    app.innerHTML = renderRail() + renderTopbar() + '<main class="main" id="main"></main>';
    var main = document.getElementById("main");
    var view;
    switch (state.route) {
      case "device": view = deviceView(); break;
      case "operations": view = operationsView(); break;
      case "alerts": view = alertsView(); break;
      case "reports": view = reportsView(); break;
      case "settings": view = settingsView(); break;
      default: view = devicesView();
    }
    main.appendChild(view);
    wireGlobal();
    if (state.route === "device") afterDeviceMount();
  }

  function go(route, deviceId) {
    state.route = route;
    if (deviceId) state.deviceId = deviceId;
    if (route === "device") state.tab = "overview";
    render();
    var v = document.querySelector(".view"); if (v) v.scrollTop = 0;
  }

  /* ============================================================ DEVICES === */
  function statusChip(d) {
    if (d.status === "live") return '<span class="chip live"><span class="pulse"></span>Live</span>';
    if (d.status === "syncing") return '<span class="chip syncing">' + icon("refresh") + d.lastSync + "</span>";
    return '<span class="chip offline">Offline · ' + d.lastSync + "</span>";
  }
  function deviceCard(d) {
    var spark = C.spark(d.spark, { w: 300, h: 36, color: "currentColor" });
    var stats = [
      ["messages", "Msgs"], ["media", "Media"], ["calls", "Calls"], ["contacts", "Contacts"]
    ].map(function (s) {
      return '<div class="dc-stat"><b>' + num(d.counts[s[0]]) + "</b><span>" + s[1] + "</span></div>";
    }).join("");
    return '<div class="card device-card" style="--h:' + d.hue + '" data-device="' + d.id + '">'
      + '<div class="dc-top">' + av(d.alias, d.hue, "lg")
      + '<div style="flex:1;min-width:0"><div class="dc-id">' + d.id + " · " + d.codename + "</div>"
      + '<div class="dc-name">' + d.alias + "</div>"
      + '<div class="dc-sub">' + d.flag + " " + d.city + ", " + d.country + " · " + d.model + "</div></div>"
      + statusChip(d) + "</div>"
      + '<div class="dc-spark">' + spark + "</div>"
      + '<div class="dc-stats">' + stats + "</div>"
      + '<div class="dc-foot"><span><span class="risk-dot risk-' + d.risk + '"></span> ' + d.risk.charAt(0).toUpperCase() + d.risk.slice(1) + ' risk · OP ' + d.operation + "</span><span>" + d.volume + "</span></div>"
      + "</div>";
  }
  function devicesView() {
    var v = h('<div class="view fade"></div>');
    var live = M.devices.filter(function (d) { return d.status === "live"; }).length;
    var q = state.deviceSearch.toLowerCase();
    var list = M.devices.filter(function (d) {
      return !q || (d.alias + " " + d.id + " " + d.city + " " + d.operation + " " + d.codename + " " + d.phone).toLowerCase().indexOf(q) >= 0;
    });
    var head = '<div class="view-head"><div><div class="eyebrow">Account · ' + M.analyst.unit + '</div>'
      + '<div class="title">Monitored Devices</div>'
      + '<div class="subtitle">' + M.devices.length + " targets across " + M.operations.length + " active operations · " + live + " live now</div></div>"
      + '<div style="display:flex;gap:10px;align-items:center">'
      + '<label class="input" style="width:230px"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">' + ICONS.search + '</svg><input id="deviceSearch" placeholder="Filter devices…" value="' + state.deviceSearch + '"></label>'
      + '<button class="btn primary" id="addDeviceBtn">' + icon("plus") + "Add device</button></div></div>";

    var opsStrip = '<div class="grid" style="grid-template-columns:repeat(' + M.operations.length + ',1fr);margin-bottom:18px">'
      + M.operations.map(function (op) {
        return '<div class="card pad"><div style="display:flex;justify-content:space-between;align-items:center"><div class="eyebrow">Operation</div><span class="tag classif">' + op.classification + '</span></div>'
          + '<div style="font-size:17px;font-weight:650;margin-top:6px">OP ' + op.name + "</div>"
          + '<div style="font-size:12px;color:var(--muted);margin-top:3px">' + op.region + " · " + op.devices + " devices · " + op.status + "</div></div>";
      }).join("") + "</div>";

    var grid = '<div class="device-grid">' + list.map(deviceCard).join("")
      + '<div class="card device-card" id="addDeviceTile" style="--h:210;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;border-style:dashed;min-height:240px">'
      + '<div class="logo" style="background:var(--surface-3);box-shadow:none;color:var(--accent)">' + icon("plus") + "</div>"
      + '<div style="font-size:15px;font-weight:600;margin-top:10px">Provision new device</div>'
      + '<div style="font-size:12px;color:var(--muted);margin-top:4px;max-width:200px">Acquire a target by phone number and begin extraction</div></div>'
      + (list.length ? "" : '<div class="empty">No devices match “' + state.deviceSearch + '”.</div>') + "</div>";

    v.innerHTML = '<div class="wrap">' + head + opsStrip + grid + "</div>";
    return v;
  }

  /* ============================================================ DEVICE ==== */
  function deviceView() {
    var d = currentDevice();
    var v = h('<div class="view fade"></div>');
    var header = deviceHeader(d);
    var tabs = deviceTabs();
    var body = '<div id="tabBody"></div>';
    v.innerHTML = '<div class="wrap">' + header + tabs + body + "</div>";
    return v;
  }
  function deviceHeader(d) {
    var pf = M.detail.profile;
    return '<div class="dev-header" style="--h:' + d.hue + '">'
      + '<div class="dev-header-row">' + av(d.alias, d.hue, "xl")
      + '<div style="min-width:0"><div class="dev-id">' + d.id + " · " + d.codename + " · OP " + d.operation + "</div>"
      + '<div class="dev-name">' + d.alias + " " + statusChip(d) + (d.risk === "high" ? '<span class="tag flag">HIGH VALUE</span>' : "") + "</div>"
      + '<div class="dev-meta">'
      + "<span>" + icon("phone") + d.phone + "</span>"
      + "<span>" + icon("devices") + d.model + " · " + d.os + "</span>"
      + "<span>" + icon("pin") + d.flag + " " + d.city + ", " + d.country + "</span>"
      + "<span>" + icon("sim") + pf.carrier + "</span>"
      + "<span>" + icon("battery") + pf.battery + "%</span>"
      + "<span>" + icon("clock") + "Synced " + d.lastSync + "</span>"
      + "</div></div>"
      + '<div class="dev-actions">'
      + '<button class="btn ghost sm">' + icon("download") + "Export</button>"
      + '<button class="btn ghost sm">' + icon("flag") + "Flag</button>"
      + '<button class="btn primary sm">' + icon("live") + "Live view</button>"
      + "</div></div></div>";
  }
  function deviceTabs() {
    var dt = M.detail;
    var tabs = [
      { key: "overview", label: "Overview" },
      { key: "messages", label: "Messages", pill: num(18432) },
      { key: "media", label: "Media", pill: num(dt.media.length * 201) },
      { key: "calls", label: "Calls", pill: num(642) },
      { key: "locations", label: "Locations", pill: num(1890) },
      { key: "contacts", label: "Contacts", pill: num(284) },
      { key: "apps", label: "Apps", pill: "47" }
    ];
    return '<div class="tabs">' + tabs.map(function (t) {
      return '<button class="tab ' + (state.tab === t.key ? "active" : "") + '" data-tab="' + t.key + '">' + t.label
        + (t.pill ? '<span class="pill">' + t.pill + "</span>" : "") + "</button>";
    }).join("") + "</div>";
  }
  function afterDeviceMount() { renderTab(); }
  function renderTab() {
    var body = document.getElementById("tabBody");
    if (!body) return;
    var content;
    switch (state.tab) {
      case "messages": content = tabMessages(); break;
      case "media": content = tabMedia(); break;
      case "calls": content = tabCalls(); break;
      case "locations": content = tabLocations(); break;
      case "contacts": content = tabContacts(); break;
      case "apps": content = tabApps(); break;
      default: content = tabOverview();
    }
    body.innerHTML = "";
    body.appendChild(content);
    wireTab();
  }

  /* ------------------------------------------------------- OVERVIEW tab --- */
  function tabOverview() {
    var dt = M.detail, wrap = h('<div class="fade"></div>');

    var kpis = '<div class="kpis">' + dt.kpis.map(function (k) {
      return '<div class="card kpi"><div class="kpi-ico">' + icon(k.glyph) + "</div>"
        + '<div class="kpi-val">' + num(k.value) + "</div>"
        + '<div class="kpi-lab">' + k.label + "</div>"
        + '<div class="kpi-delta ' + (/today|new|live/.test(k.delta) ? "" : "muted") + '">' + k.delta + "</div></div>";
    }).join("") + "</div>";

    // activity chart
    var keys = ["whatsapp", "telegram", "signal", "sms", "email"];
    var colors = keys.map(platColor);
    var areaChart = C.area(dt.activity, { keys: keys, colors: colors, w: 760, h: 220 });
    var legend = '<div class="legend">' + keys.map(function (k, i) {
      return '<i><span class="sw" style="background:' + colors[i] + '"></span>' + platName(k) + "</i>";
    }).join("") + "</div>";
    var activityCard = '<div class="card pad"><div class="card-head"><h3>Activity — last 30 days</h3><span class="hint">All platforms · 2 operational spikes</span></div>' + areaChart + legend + "</div>";

    // heatmap
    var heat = '<div class="card pad"><div class="card-head"><h3>When the target is active</h3><span class="hint">Local time · darker = busier</span></div>'
      + C.heatmap(dt.heatmap, { color: "76,158,255" }) + "</div>";

    // platforms breakdown (donut + accounts note)
    var platItems = dt.platforms.map(function (p) {
      return { label: platName(p.key), value: p.messages, color: platColor(p.key), sub: p.accounts.length > 1 ? p.accounts.length + " accounts" : "" };
    });
    var donutParts = dt.platforms.map(function (p) { return { value: p.messages, color: platColor(p.key) }; });
    var totalMsg = dt.platforms.reduce(function (s, p) { return s + p.messages; }, 0);
    var platCard = '<div class="card pad"><div class="card-head"><h3>Communication platforms</h3><span class="hint">multi-account aware</span></div>'
      + '<div style="display:flex;gap:18px;align-items:center;margin-bottom:16px"><div style="flex:0 0 auto">' + C.donut(donutParts, { size: 150, stroke: 15, centerTop: (totalMsg / 1000).toFixed(1) + "k", centerSub: "messages" }) + "</div>"
      + '<div style="flex:1">' + C.bars(platItems) + "</div></div>"
      + '<div style="font-size:11.5px;color:var(--faint);border-top:1px solid var(--line);padding-top:12px">'
      + icon("users") + ' WhatsApp resolves to <b style="color:var(--text)">2 accounts</b> — Personal &amp; Business (Rey Logistics).</div></div>';

    // top contacts
    var contacts = '<div class="card pad"><div class="card-head"><h3>Top contacts</h3><span class="hint">by interaction volume</span></div>'
      + dt.topContacts.map(function (c) {
        return '<div class="row-item">' + av(c.name, c.hue) + glyphBadgeMini(c.platform)
          + '<div class="row-main"><b>' + c.name + (c.flagged ? ' <span class="tag flag" style="vertical-align:middle">FLAG</span>' : "") + "</b><span>" + c.role + " · " + c.handle + "</span></div>"
          + '<div class="row-end"><b style="color:var(--text);font-size:13px">' + num(c.messages) + '</b><br><span style="font-size:10.5px">' + c.last + "</span></div></div>";
      }).join("") + "</div>";

    // recent activity feed
    var feed = '<div class="card pad"><div class="card-head"><h3>Live activity feed</h3><span class="chip live"><span class="pulse"></span>streaming</span></div>'
      + '<div class="feed">' + dt.feed.map(function (f) {
        return '<div class="feed-item">' + glyphBadge(f.platform)
          + '<div class="fi-body"><div class="fi-top"><span class="fi-who">' + f.who + "</span>"
          + (f.flagged ? '<span class="tag flag">FLAG</span>' : "")
          + '<span class="fi-time">' + f.time + "</span></div>"
          + '<div class="fi-text">' + f.text + "</div></div></div>";
      }).join("") + "</div></div>";

    // alerts / keyword hits
    var alerts = '<div class="card pad"><div class="card-head"><h3>Keyword &amp; alert hits</h3><span class="hint">watchlist matches</span></div>'
      + dt.alerts.map(function (a) {
        var sev = a.severity === "high" ? "bad" : "warn";
        return '<div class="row-item"><span class="glyph-badge" style="background:' + hexA(platColor(a.platform), .14) + ';color:' + platColor(a.platform) + '">' + icon(platGlyph(a.platform)) + "</span>"
          + '<div class="row-main"><b>“' + a.keyword + '”</b><span>' + platName(a.platform) + " · last " + a.last + "</span></div>"
          + '<div class="row-end"><span class="chip ' + sev + '">' + a.count + " hits</span></div></div>";
      }).join("") + "</div>";

    // location snapshot mini
    var locMini = '<div class="card pad"><div class="card-head"><h3>Location snapshot</h3><button class="btn ghost sm" data-tab="locations">' + icon("map") + "Open map</button></div>"
      + miniMap() + "</div>";

    wrap.innerHTML = kpis
      + '<div class="col-2"><div class="stack">' + activityCard + heat + feed + "</div>"
      + '<div class="stack">' + platCard + contacts + alerts + locMini + "</div></div>";
    return wrap;
  }
  function glyphBadgeMini(key) {
    var col = platColor(key);
    return '<span class="plat-mini" style="background:' + hexA(col, .16) + ";color:" + col + ';flex:0 0 auto">' + icon(platGlyph(key)) + "</span>";
  }
  function miniMap() {
    var dt = M.detail;
    var pins = dt.locations.slice(0, 6).map(function (l) {
      return '<div class="map-pin ' + l.type + '" style="left:' + l.x + "%;top:" + l.y + '%"><div class="pin-dot"><i></i></div></div>';
    }).join("");
    return '<div class="map" style="min-height:220px"><div class="map-grid"></div>' + routeSvg() + pins
      + '<div class="map-badge"><span class="chip live"><span class="pulse"></span>' + dt.profile.lastLocation + "</span></div></div>";
  }
  function routeSvg() {
    var pts = M.detail.route.map(function (p) { return p.x + "% " + p.y + "%"; });
    var d = M.detail.route.map(function (p, i) { return (i ? "L" : "M") + p.x + " " + p.y; }).join(" ");
    return '<svg viewBox="0 0 100 100" preserveAspectRatio="none"><path d="' + d + '" fill="none" stroke="rgba(76,158,255,.5)" stroke-width="0.5" stroke-dasharray="1.4 1.4"/></svg>';
  }

  /* ------------------------------------------------------- MESSAGES tab --- */
  function accountKey(platKey, label) { return platKey + ":" + label; }
  function tabMessages() {
    var dt = M.detail, wrap = h('<div class="fade"></div>');
    // account sidebar grouped by platform
    var accountsHtml = dt.platforms.map(function (p) {
      var items = p.accounts.map(function (a) {
        var key = accountKey(p.key, a.label);
        return '<div class="acct-item ' + (state.activeAccount === key ? "active" : "") + '" data-account="' + key + '">'
          + '<span class="acct-dot" style="background:' + platColor(p.key) + '"></span>'
          + '<div><div class="ai-label">' + a.label + "</div><div class=\"ai-handle\">" + a.handle + "</div></div>"
          + '<span class="ai-count">' + num(a.messages) + "</span></div>";
      }).join("");
      var multi = p.accounts.length > 1 ? ' <span class="multi-badge">×' + p.accounts.length + "</span>" : "";
      return '<div class="acct-group"><div class="acct-plat">' + icon(platGlyph(p.key)) + platName(p.key) + multi + "</div>" + items + "</div>";
    }).join("");

    // conversations for active account
    var parts = state.activeAccount.split(":");
    var q = state.convSearch.toLowerCase();
    var convs = dt.conversations.filter(function (c) {
      return accountKey(c.platform, c.account) === state.activeAccount;
    });
    var allForSearch = q ? dt.conversations : convs;
    var shown = allForSearch.filter(function (c) {
      return !q || (c.contact + " " + c.last + " " + c.messages.map(function (m) { return m.text; }).join(" ")).toLowerCase().indexOf(q) >= 0;
    });
    if (!shown.some(function (c) { return c.id === state.activeConv; })) {
      if (shown[0]) state.activeConv = shown[0].id;
    }
    var convList = shown.length ? shown.map(function (c) {
      return '<div class="conv ' + (state.activeConv === c.id ? "active" : "") + '" data-conv="' + c.id + '">' + av(c.contact, c.hue)
        + '<div class="c-body"><div class="c-top"><span class="c-name">' + c.contact + "</span>"
        + (c.flagged ? glyphFlag() : "") + '<span class="c-time">' + c.time + "</span></div>"
        + '<div class="c-last">' + (c.last) + "</div></div>"
        + (c.unread ? '<span class="c-unread">' + c.unread + "</span>" : "") + "</div>";
    }).join("") : '<div class="empty">No conversations match.</div>';

    var thread = threadHtml(shown);

    wrap.innerHTML = '<div class="msg-layout">'
      + '<div class="msg-accounts"><div style="padding:6px 8px 12px;font-size:11px;color:var(--faint);text-transform:uppercase;letter-spacing:.08em;font-weight:700">Platforms &amp; accounts</div>' + accountsHtml + "</div>"
      + '<div class="msg-list"><div class="msg-list-search"><label class="input">' + icon("search") + '<input id="convSearch" placeholder="Search messages…" value="' + state.convSearch + '"></label></div><div class="convs">' + convList + "</div></div>"
      + '<div class="thread">' + thread + "</div></div>";
    return wrap;
  }
  function glyphFlag() { return '<span style="color:var(--bad);display:inline-flex">' + icon("flag") + "</span>"; }
  function threadHtml(list) {
    var c = list.filter(function (x) { return x.id === state.activeConv; })[0] || list[0];
    if (!c) return '<div class="empty" style="margin:auto">Select a conversation</div>';
    var msgs = c.messages.map(function (m) {
      var cls = "bubble " + (m.from === "target" ? "target" : "them") + (m.flagged ? " flagged" : "") + (m.deleted ? " deleted" : "");
      var body;
      if (m.type === "image" || m.type === "doc" || m.type === "voice") {
        var mi = m.type === "image" ? "photo" : (m.type === "voice" ? "audio" : "doc");
        body = '<div class="b-media">' + icon(mi) + "<span>" + m.text + "</span></div>";
      } else { body = escapeHtml(m.text).replace(/\n/g, "<br>"); }
      return '<div class="' + cls + '">' + (m.flagged ? '<span class="b-flag">' + glyphFlag() + "</span>" : "")
        + body + '<span class="b-time">' + m.time + "</span></div>";
    }).join("");
    return '<div class="thread-head">' + av(c.contact, c.hue)
      + '<div><div class="th-name">' + c.contact + "</div><div class=\"th-sub\">" + platName(c.platform) + " · " + c.account + " account</div></div>"
      + '<div class="th-actions"><button class="btn ghost sm">' + icon("flag") + "Flag</button><button class=\"btn ghost sm\">" + icon("download") + "</button></div></div>"
      + '<div class="thread-body"><div class="day-sep">Today</div>' + msgs + "</div>";
  }
  function escapeHtml(s) { return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }

  /* ---------------------------------------------------------- MEDIA tab --- */
  function tabMedia() {
    var dt = M.detail, wrap = h('<div class="fade"></div>');
    var counts = { all: dt.media.length };
    ["photo", "video", "audio", "doc"].forEach(function (k) { counts[k] = dt.media.filter(function (m) { return m.type === k; }).length; });
    var seg = '<div class="seg">' + [["all", "All"], ["photo", "Photos"], ["video", "Videos"], ["audio", "Audio"], ["doc", "Docs"]].map(function (s) {
      return '<button class="' + (state.mediaFilter === s[0] ? "active" : "") + '" data-media-filter="' + s[0] + '">' + s[1] + " · " + counts[s[0]] + "</button>";
    }).join("") + "</div>";
    var list = dt.media.filter(function (m) { return state.mediaFilter === "all" || m.type === state.mediaFilter; });
    var kindIcon = { photo: "photo", video: "video", audio: "audio", doc: "doc" };
    var grid = '<div class="media-grid">' + list.map(function (m) {
      return '<div class="media-tile" style="--h:' + m.hue + '" data-media="' + m.id + '"><div class="media-thumb">' + icon(kindIcon[m.type]) + "</div>"
        + '<div class="mt-top"><span class="mt-kind">' + m.type + "</span>" + (m.flagged ? '<span class="tag flag">FLAG</span>' : "") + "</div>"
        + '<div class="mt-over"><div class="mt-label">' + m.label + '</div><div class="mt-meta">' + glyphDotMini(m.source) + '<span class="mt-when">' + m.date + (m.place !== "—" ? " · " + m.place : "") + '</span>' + (m.duration ? '<span class="mt-dur">' + m.duration + "</span>" : "") + "</div></div></div>";
    }).join("") + "</div>";
    var head = filterHead("Media library", num(3217) + " files extracted · photos, video, voice notes & documents", seg);
    wrap.innerHTML = head + grid;
    return wrap;
  }
  function glyphDotMini(key) { return '<span style="width:8px;height:8px;border-radius:2px;background:' + platColor(key) + ';display:inline-block"></span>'; }
  function filterHead(title, sub, controls) {
    return '<div class="view-head" style="margin-bottom:14px"><div><div class="title" style="font-size:19px">' + title + '</div><div class="subtitle">' + sub + "</div></div></div>"
      + '<div class="filter-bar">' + controls + '<div class="topbar-spacer" style="flex:1"></div><button class="btn ghost sm">' + icon("filter") + "Filters</button><button class=\"btn ghost sm\">" + icon("download") + "Export</button></div>";
  }

  /* ---------------------------------------------------------- CALLS tab --- */
  function tabCalls() {
    var dt = M.detail, wrap = h('<div class="fade"></div>');
    var seg = '<div class="seg">' + [["all", "All"], ["in", "Incoming"], ["out", "Outgoing"], ["missed", "Missed"]].map(function (s) {
      return '<button class="' + (state.callFilter === s[0] ? "active" : "") + '" data-call-filter="' + s[0] + '">' + s[1] + "</button>";
    }).join("") + "</div>";
    var list = dt.calls.filter(function (c) { return state.callFilter === "all" || c.direction === state.callFilter; });
    var dirIcon = { in: "arrowIn", out: "arrowOut", missed: "arrowMissed" };
    var rows = list.map(function (c) {
      return "<tr>"
        + '<td><div style="display:flex;align-items:center;gap:10px">' + av(c.contact, c.hue, "sm") + "<div><b>" + c.contact + (c.flagged ? ' <span class="tag flag">FLAG</span>' : "") + '</b></div></div></td>'
        + '<td><span class="call-dir dir-' + c.direction + '">' + icon(dirIcon[c.direction]) + c.direction.charAt(0).toUpperCase() + c.direction.slice(1) + "</span></td>"
        + '<td>' + glyphBadgeMini(c.platform) + " " + platName(c.platform) + "</td>"
        + '<td class="dur">' + c.dur + "</td>"
        + "<td>" + c.date + "</td>"
        + "<td>" + (c.recorded ? '<button class="btn ghost sm">' + icon("play") + "Recording</button>" : '<span style="color:var(--faint)">—</span>') + "</td>"
        + "</tr>";
    }).join("");
    // call frequency mini chart
    var byDay = M.detail.activity.slice(-14).map(function (d) { return Math.round((d.whatsapp + d.signal) / 60); });
    var freq = '<div class="card pad" style="margin-bottom:16px"><div class="card-head"><h3>Call frequency — 14 days</h3><span class="hint">cellular + VoIP</span></div><div style="height:60px;color:var(--accent)">' + C.spark(byDay, { w: 760, h: 60 }) + "</div></div>";
    var table = '<div class="card pad"><table class="table"><thead><tr><th>Contact</th><th>Direction</th><th>Platform</th><th>Duration</th><th>When</th><th>Audio</th></tr></thead><tbody>' + rows + "</tbody></table></div>";
    wrap.innerHTML = filterHead("Call log", num(642) + " calls · 38% recorded", seg) + freq + table;
    return wrap;
  }

  /* ------------------------------------------------------- LOCATIONS tab -- */
  function tabLocations() {
    var dt = M.detail, wrap = h('<div class="fade"></div>');
    var pins = dt.locations.map(function (l, i) {
      return '<div class="map-pin ' + l.type + '" style="left:' + l.x + "%;top:" + l.y + '%" data-loc="' + i + '"><div class="pin-dot"><i></i></div><span class="pin-label">' + l.label + "</span></div>";
    }).join("");
    var legend = '<div class="map-legend">'
      + '<i><span class="sw" style="background:var(--live)"></span>Home</i>'
      + '<i><span class="sw" style="background:var(--accent)"></span>Work</i>'
      + '<i><span class="sw" style="background:var(--accent-2)"></span>Frequent</i>'
      + '<i><span class="sw" style="background:var(--warn)"></span>Visit</i></div>';
    var map = '<div class="map"><div class="map-grid"></div>' + routeSvg() + pins
      + '<div class="map-badge"><span class="chip live"><span class="pulse"></span>Live · ' + dt.profile.lastLocation + "</span></div>" + legend + "</div>";

    var typeIcon = { home: "home", work: "briefcase", frequent: "pin", visit: "map" };
    var typeColor = { home: "var(--live)", work: "var(--accent)", frequent: "var(--accent-2)", visit: "var(--warn)" };
    var sideItems = dt.locations.map(function (l) {
      return '<div class="loc-item"><span class="loc-ico" style="background:' + "rgba(255,255,255,.05);color:" + typeColor[l.type] + '">' + icon(typeIcon[l.type]) + "</span>"
        + '<div style="flex:1;min-width:0"><b style="font-size:13px">' + l.label + (l.flagged ? ' <span class="tag flag">FLAG</span>' : "") + "</b>"
        + '<div style="font-size:11.5px;color:var(--muted)">' + l.time + " · " + l.dwell + "</div></div>"
        + '<div style="text-align:right;font-size:11px;color:var(--faint)"><b style="color:var(--text);font-size:13px">' + l.count + "</b><br>visits</div></div>";
    }).join("");
    var side = '<div class="card pad"><div class="card-head"><h3>Frequented places</h3><span class="hint">inferred</span></div>' + sideItems + "</div>";

    wrap.innerHTML = '<div class="view-head" style="margin-bottom:14px"><div><div class="title" style="font-size:19px">Movement &amp; locations</div><div class="subtitle">' + num(1890) + ' GPS pings · home/work inferred · 3 geofence alerts</div></div><button class="btn ghost sm">' + icon("download") + "Export GPX</button></div>"
      + '<div class="loc-layout">' + map + side + "</div>";
    return wrap;
  }

  /* -------------------------------------------------------- CONTACTS tab -- */
  function tabContacts() {
    var dt = M.detail, wrap = h('<div class="fade"></div>');
    var sorted = dt.contacts.slice().sort(function (a, b) {
      if (state.contactSort === "interactions") return b.interactions - a.interactions;
      if (state.contactSort === "recent") return 0;
      if (state.contactSort === "flagged") return (b.flagged ? 1 : 0) - (a.flagged ? 1 : 0);
      return a.name.localeCompare(b.name);
    });
    var seg = '<div class="seg">' + [["interactions", "Most active"], ["flagged", "Flagged"], ["name", "A–Z"]].map(function (s) {
      return '<button class="' + (state.contactSort === s[0] ? "active" : "") + '" data-contact-sort="' + s[0] + '">' + s[1] + "</button>";
    }).join("") + "</div>";
    var grid = '<div class="contacts-grid">' + sorted.map(function (c) {
      var plats = c.platforms.map(function (p) {
        return '<span class="plat-mini" style="background:' + hexA(platColor(p), .16) + ";color:" + platColor(p) + '">' + icon(platGlyph(p)) + "</span>";
      }).join("");
      return '<div class="card contact-card" style="--h:' + c.hue + '"><div class="cc-top">' + av(c.name, c.hue, "lg")
        + '<div style="flex:1;min-width:0"><div class="cc-name">' + c.name + (c.flagged ? ' <span style="color:var(--bad);display:inline-flex">' + icon("flag") + "</span>" : "") + "</div>"
        + '<div class="cc-num">' + c.number + "</div></div></div>"
        + '<div class="cc-plats">' + plats + '<span style="font-size:11px;color:var(--faint);align-self:center;margin-left:4px">' + c.org + "</span></div>"
        + '<div class="cc-foot"><span><b>' + num(c.interactions) + "</b> interactions</span><span>last " + c.last + "</span></div></div>";
    }).join("") + "</div>";
    wrap.innerHTML = filterHead("Contact network", num(284) + " resolved contacts · cross-platform identity matched", seg) + grid;
    return wrap;
  }

  /* ------------------------------------------------------------ APPS tab -- */
  function tabApps() {
    var dt = M.detail, wrap = h('<div class="fade"></div>');
    var catIcon = { Messaging: "chat", Email: "mail", Browser: "globe", Navigation: "pin", Finance: "money", Media: "image", Productivity: "doc", Network: "lock" };
    var grid = '<div class="apps-grid">' + dt.apps.map(function (a) {
      var multi = a.accounts.length > 1;
      var accts = a.accounts.map(function (ac) {
        return '<div class="app-acct"><b>' + ac.label + "</b> <span>" + ac.handle + "</span></div>";
      }).join("");
      return '<div class="card app-card" style="--h:' + a.hue + '"><div class="ap-top"><div class="app-icon">' + icon(catIcon[a.category] || "grid") + "</div>"
        + '<div style="flex:1"><div class="ap-name">' + a.name + (a.flagged ? ' <span style="color:var(--bad);display:inline-flex;vertical-align:middle">' + icon("flag") + "</span>" : "") + "</div><div class=\"ap-cat\">" + a.category + "</div></div>"
        + (multi ? '<span class="multi-badge">' + a.accounts.length + " accounts</span>" : (a.monitored ? '<span class="chip live" style="height:22px"><span class="pulse"></span></span>' : "")) + "</div>"
        + '<div class="app-accts">' + accts + "</div>"
        + '<div class="ap-foot"><span>' + a.size + "</span><span>used " + a.last + "</span></div></div>";
    }).join("") + "</div>";
    var note = '<div class="card pad" style="margin-bottom:16px;display:flex;align-items:center;gap:12px"><span class="glyph-badge" style="background:rgba(164,114,255,.14);color:var(--accent-2);width:34px;height:34px">' + icon("users") + "</span>"
      + '<div style="font-size:12.5px;color:var(--muted)"><b style="color:var(--text)">Multi-account detection</b> — WhatsApp (Personal + Business) is monitored as two separate data streams, so the analyst never conflates the target\u2019s family chatter with the Rey Logistics front company.</div></div>';
    wrap.innerHTML = filterHead("Installed apps", "47 apps · 12 flagged · multi-account streams resolved", "<span></span>") + note + grid;
    return wrap;
  }

  /* ====================================================== OTHER ROUTES ==== */
  function simpleView(title, sub, body) {
    var v = h('<div class="view fade"></div>');
    v.innerHTML = '<div class="wrap"><div class="view-head"><div><div class="eyebrow">AEGIS</div><div class="title">' + title + '</div><div class="subtitle">' + sub + "</div></div></div>" + body + "</div>";
    return v;
  }
  function operationsView() {
    var body = '<div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(320px,1fr))">' + M.operations.map(function (op) {
      var devs = M.devices.filter(function (d) { return d.operation === op.name; });
      return '<div class="card pad"><div style="display:flex;justify-content:space-between;align-items:center"><div class="eyebrow">Operation</div><span class="tag classif">' + op.classification + "</span></div>"
        + '<div style="font-size:19px;font-weight:650;margin:8px 0 4px">OP ' + op.name + '</div><div style="font-size:12.5px;color:var(--muted)">' + op.region + " · " + op.status + "</div>"
        + '<div style="margin-top:14px;display:flex;flex-direction:column;gap:8px">' + devs.map(function (d) {
          return '<div class="row-item" data-device="' + d.id + '" style="cursor:pointer">' + av(d.alias, d.hue) + '<div class="row-main"><b>' + d.alias + "</b><span>" + d.id + " · " + d.city + "</span></div>" + statusChip(d) + "</div>";
        }).join("") + "</div></div>";
    }).join("") + "</div>";
    return simpleView("Operations", M.operations.length + " active operations across " + M.devices.length + " devices", body);
  }
  function alertsView() {
    var dt = M.detail;
    var body = '<div class="card pad">' + dt.feed.concat(dt.feed).filter(function (f) { return f.flagged; }).map(function (f) {
      return '<div class="feed-item">' + glyphBadge(f.platform) + '<div class="fi-body"><div class="fi-top"><span class="fi-who">' + f.who + '</span><span class="tag flag">FLAG</span><span class="fi-time">' + f.time + "</span></div><div class=\"fi-text\">" + f.text + "</div></div></div>";
    }).join("") + "</div>";
    return simpleView("Alerts & watchlist hits", "Real-time keyword and behavioural alerts across all monitored devices", body);
  }
  function reportsView() {
    var body = '<div class="empty">Report builder — compile findings, message exports and location timelines into a briefing packet. (Prototype placeholder)</div>';
    return simpleView("Reports", "Generate intelligence briefings and evidence exports", '<div class="card pad">' + body + "</div>");
  }
  function settingsView() {
    var body = '<div class="card pad"><div class="kv">'
      + '<div><div class="k">Analyst</div><div class="v">' + M.analyst.name + "</div></div>"
      + '<div><div class="k">Unit</div><div class="v">' + M.analyst.unit + "</div></div>"
      + '<div><div class="k">Clearance</div><div class="v">' + M.analyst.clearance + "</div></div>"
      + '<div><div class="k">Role</div><div class="v">' + M.analyst.role + "</div></div>"
      + "</div></div>";
    return simpleView("Settings", "Account, retention policy and audit configuration", body);
  }

  /* ====================================================== ADD-DEVICE WIZARD */
  var wiz = { step: 1, scope: { whatsapp: true, telegram: true, signal: true, email: true, sms: true, browser: true, maps: true, calls: true }, live: true, full: true, timer: null };
  var scopeDefs = [
    { key: "whatsapp", name: "WhatsApp", sub: "Personal + Business" },
    { key: "telegram", name: "Telegram", sub: "Chats, channels, media" },
    { key: "signal", name: "Signal", sub: "E2E — relay extraction" },
    { key: "email", name: "Email", sub: "Gmail, Proton, IMAP" },
    { key: "sms", name: "SMS / iMessage", sub: "Texts & OTP" },
    { key: "calls", name: "Calls", sub: "Log + recordings" },
    { key: "browser", name: "Browser", sub: "History & downloads" },
    { key: "maps", name: "Location", sub: "Live GPS + history" }
  ];

  function openWizard() {
    wiz.step = 1;
    var ov = document.getElementById("overlay");
    ov.innerHTML = wizardHtml();
    requestAnimationFrame(function () { ov.classList.add("open"); });
    wireWizard();
  }
  function closeWizard() {
    var ov = document.getElementById("overlay");
    ov.classList.remove("open");
    if (wiz.timer) { clearInterval(wiz.timer); wiz.timer = null; }
    setTimeout(function () { ov.innerHTML = ""; }, 220);
  }
  function wizardHtml() {
    var stepLabels = ["Identify target", "Acquisition scope", "Deploy", "Done"];
    var steps = stepLabels.map(function (l, i) {
      var n = i + 1, cls = wiz.step === n ? "active" : (wiz.step > n ? "done" : "");
      return '<div class="step ' + cls + '"><span class="s-num">' + (wiz.step > n ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">' + ICONS.check + "</svg>" : n) + '</span><span class="s-lab">' + l + "</span></div>";
    }).join("");
    return '<div class="modal" role="dialog" aria-modal="true">'
      + '<div class="modal-head"><div class="mh-ico">' + icon("target") + "</div>"
      + "<div><h2>Provision new device</h2><p>Acquire a target handset and begin lawful collection</p></div>"
      + '<button class="icon-btn x" id="wizClose">' + icon("x") + "</button></div>"
      + '<div class="steps">' + steps + "</div>"
      + '<div class="modal-body" id="wizBody">' + wizardStep() + "</div>"
      + '<div class="modal-foot" id="wizFoot">' + wizardFoot() + "</div></div>";
  }
  function wizardStep() {
    if (wiz.step === 1) {
      return '<div class="field"><label>Target phone number (MSISDN)</label><div class="ctl"><span class="prefix">+</span><input id="wizPhone" placeholder="39 351 442 8890" value="39 351 442 8890"></div><div class="hint">' + icon("lock") + " Silent acquisition — no notification is delivered to the device.</div></div>"
        + '<div class="field-2"><div class="field"><label>Target alias / designation</label><div class="ctl"><input id="wizAlias" placeholder="e.g. Marcus Rey" value="Marcus Rey"></div></div>'
        + '<div class="field"><label>Codename</label><div class="ctl"><input value="NIGHTJAR-03" placeholder="Auto"></div></div></div>'
        + '<div class="field-2"><div class="field"><label>Assign to operation</label><div class="ctl"><select><option>OP NIGHTJAR — Southern EU</option><option>OP TIDEWATER — Mediterranean</option><option>OP IRONWOOD — West Africa</option></select></div></div>'
        + '<div class="field"><label>Priority</label><div class="ctl"><select><option>High value</option><option>Standard</option><option>Watch only</option></select></div></div></div>'
        + '<div class="field"><label>Lawful authorisation reference</label><div class="ctl"><span class="prefix">WRT</span><input value="2026/0884-NJ" placeholder="Warrant / court order ref"></div><div class="hint">Required for audit. This prototype uses placeholder authorisation data.</div></div>';
    }
    if (wiz.step === 2) {
      var grid = scopeDefs.map(function (s) {
        var on = wiz.scope[s.key];
        return '<div class="scope ' + (on ? "on" : "") + '" data-scope="' + s.key + '"><span class="sc-ico" style="background:' + hexA(platColor(s.key), .16) + ";color:" + platColor(s.key) + '">' + icon(platGlyph(s.key)) + "</span>"
          + '<div><div class="sc-name">' + s.name + '</div><div class="sc-sub">' + s.sub + '</div></div><span class="sc-check"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">' + ICONS.check + "</svg></span></div>";
      }).join("");
      return '<div style="font-size:12.5px;color:var(--muted);margin-bottom:14px">Select the data sources to extract. Multi-account apps are detected and split automatically.</div>'
        + '<div class="scope-grid">' + grid + "</div>"
        + '<div style="height:16px"></div>'
        + '<div class="switch-row"><div><div class="sr-name">Full historical extraction</div><div class="sr-sub">Pull all available history, not just new data going forward</div></div><div class="switch ' + (wiz.full ? "on" : "") + '" id="wizFull"></div></div>'
        + '<div class="switch-row"><div><div class="sr-name">Live monitoring</div><div class="sr-sub">Stream new activity in real time after initial extraction</div></div><div class="switch ' + (wiz.live ? "on" : "") + '" id="wizLive"></div></div>';
    }
    if (wiz.step === 3) {
      var selected = scopeDefs.filter(function (s) { return wiz.scope[s.key]; });
      var rows = selected.map(function (s) {
        return '<div class="deploy-item" data-dep="' + s.key + '"><span class="di-ico" style="background:' + hexA(platColor(s.key), .16) + ";color:" + platColor(s.key) + '">' + icon(platGlyph(s.key)) + "</span>"
          + '<div class="di-body"><div class="di-top"><b>' + s.name + '</b><span class="di-pct">0%</span></div><div class="prog"><i></i></div></div></div>';
      }).join("");
      return '<div style="text-align:center;margin-bottom:18px"><div class="eyebrow" style="color:var(--accent)">Establishing relay link…</div><div style="font-size:15px;font-weight:600;margin-top:6px">Provisioning collection for ' + (selected.length) + " data sources</div></div>"
        + '<div class="deploy-list">' + rows + "</div>";
    }
    // step 4
    var sel = scopeDefs.filter(function (s) { return wiz.scope[s.key]; }).length;
    return '<div class="deploy-success"><div class="ds-ring"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">' + ICONS.check + "</svg></div>"
      + "<h2>Device acquired</h2><p>NIGHTJAR-03 is now live. Initial extraction is complete and real-time monitoring has started across " + sel + " data sources.</p>"
      + '<div class="summary-row"><div class="sr"><b>18.4k</b><span>messages</span></div><div class="sr"><b>3.2k</b><span>media</span></div><div class="sr"><b>284</b><span>contacts</span></div><div class="sr"><b>' + sel + "</b><span>sources</span></div></div></div>";
  }
  function wizardFoot() {
    if (wiz.step === 1) return '<span class="mf-note">' + icon("lock") + " End-to-end encrypted · audit-logged</span><div class=\"mf-spacer\"></div><button class=\"btn ghost\" id=\"wizCancel\">Cancel</button><button class=\"btn primary\" id=\"wizNext\">Continue" + icon("chevron") + "</button>";
    if (wiz.step === 2) return '<span class="mf-note" id="wizScopeNote"></span><div class="mf-spacer"></div><button class="btn ghost" id="wizBack">' + icon("chevronL") + 'Back</button><button class="btn primary" id="wizNext">Begin deployment' + icon("chevron") + "</button>";
    if (wiz.step === 3) return '<span class="mf-note">' + icon("refresh") + ' Do not close — extraction in progress…</span><div class="mf-spacer"></div><button class="btn ghost" id="wizCancel">Abort</button>';
    return '<div class="mf-spacer"></div><button class="btn ghost" id="wizCancel">Close</button><button class="btn primary" id="wizGoto">' + icon("eye") + "Open device dashboard</button>";
  }
  function updateWizScopeNote() {
    var el = document.getElementById("wizScopeNote");
    if (!el) return;
    var n = scopeDefs.filter(function (s) { return wiz.scope[s.key]; }).length;
    el.innerHTML = n + " of " + scopeDefs.length + " sources selected";
  }
  function refreshWizard() {
    document.getElementById("wizBody").innerHTML = wizardStep();
    document.getElementById("wizFoot").innerHTML = wizardFoot();
    // refresh steps header
    var modal = document.querySelector(".modal");
    var temp = h(wizardHtml());
    modal.querySelector(".steps").innerHTML = temp.querySelector(".steps").innerHTML;
    wireWizard();
    if (wiz.step === 2) updateWizScopeNote();
    if (wiz.step === 3) runDeploy();
  }
  function runDeploy() {
    var items = Array.prototype.slice.call(document.querySelectorAll(".deploy-item"));
    var prog = items.map(function () { return 0; });
    var speeds = items.map(function () { return 3.4 + Math.random() * 4.2; });
    wiz.timer = setInterval(function () {
      var allDone = true;
      items.forEach(function (it, i) {
        if (prog[i] < 100) { prog[i] = Math.min(100, prog[i] + speeds[i]); allDone = false; }
        var pct = Math.round(prog[i]);
        it.querySelector(".prog i").style.width = pct + "%";
        var pctEl = it.querySelector(".di-pct");
        if (pct >= 100) { pctEl.innerHTML = '<svg class="deploy-done-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">' + ICONS.check + "</svg>"; }
        else pctEl.textContent = pct + "%";
      });
      if (allDone) {
        clearInterval(wiz.timer); wiz.timer = null;
        setTimeout(function () { wiz.step = 4; refreshWizard(); }, 550);
      }
    }, 120);
  }
  function wireWizard() {
    bind("#wizClose", "click", closeWizard);
    bind("#wizCancel", "click", closeWizard);
    bind("#wizBack", "click", function () { wiz.step = Math.max(1, wiz.step - 1); refreshWizard(); });
    bind("#wizNext", "click", function () { wiz.step++; refreshWizard(); });
    bind("#wizGoto", "click", function () { closeWizard(); go("device", "TGT-0427"); });
    bind("#wizFull", "click", function () { wiz.full = !wiz.full; this.classList.toggle("on"); });
    bind("#wizLive", "click", function () { wiz.live = !wiz.live; this.classList.toggle("on"); });
    document.querySelectorAll("[data-scope]").forEach(function (el) {
      el.addEventListener("click", function () {
        var k = el.getAttribute("data-scope");
        wiz.scope[k] = !wiz.scope[k];
        el.classList.toggle("on", wiz.scope[k]);
        updateWizScopeNote();
      });
    });
    updateWizScopeNote();
  }

  /* ============================================================ LIGHTBOX == */
  function openLightbox(id) {
    var m = M.detail.media.filter(function (x) { return x.id === id; })[0];
    if (!m) return;
    var lb = document.getElementById("lightbox");
    var ki = { photo: "photo", video: "video", audio: "audio", doc: "doc" }[m.type];
    lb.innerHTML = '<div class="lb-frame"><div class="lb-img" style="background:linear-gradient(140deg,hsl(' + m.hue + ' 55% 26%),hsl(' + (m.hue + 30) + ' 50% 14%))">' + icon(ki) + "</div>"
      + '<div class="lb-info">' + glyphBadge(m.source) + '<div style="flex:1"><b style="font-size:14px">' + m.label + "</b><div style=\"font-size:12px;color:var(--muted)\">" + platName(m.source) + " · " + m.date + (m.place !== "—" ? " · " + m.place : "") + "</div></div>"
      + (m.flagged ? '<span class="tag flag">FLAGGED</span>' : "") + '<button class="btn ghost sm">' + icon("download") + "</button></div></div>";
    requestAnimationFrame(function () { lb.classList.add("open"); });
    lb.onclick = function (e) { if (e.target === lb) closeLightbox(); };
  }
  function closeLightbox() { var lb = document.getElementById("lightbox"); lb.classList.remove("open"); setTimeout(function () { lb.innerHTML = ""; }, 200); }

  /* ============================================================ WIRING ==== */
  function bind(sel, ev, fn) { var el = typeof sel === "string" ? document.querySelector(sel) : sel; if (el) el.addEventListener(ev, fn); }
  function wireGlobal() {
    document.querySelectorAll("[data-nav]").forEach(function (el) {
      el.addEventListener("click", function () { go(el.getAttribute("data-nav")); });
    });
    document.querySelectorAll("[data-device]").forEach(function (el) {
      el.addEventListener("click", function () { go("device", el.getAttribute("data-device")); });
    });
    bind("#addDeviceBtn", "click", openWizard);
    bind("#addDeviceTile", "click", openWizard);
    var ds = document.getElementById("deviceSearch");
    if (ds) ds.addEventListener("input", function () {
      state.deviceSearch = this.value;
      var grid = document.querySelector(".device-grid");
      // re-render just the grid for snappiness
      var v = devicesView();
      document.querySelector(".main").firstChild.replaceWith(v);
      wireGlobal();
      var ds2 = document.getElementById("deviceSearch"); if (ds2) { ds2.focus(); ds2.setSelectionRange(ds2.value.length, ds2.value.length); }
    });
    // device tabs
    document.querySelectorAll("[data-tab]").forEach(function (el) {
      el.addEventListener("click", function () { state.tab = el.getAttribute("data-tab"); updateTabsActive(); renderTab(); });
    });
    var gs = document.getElementById("globalSearch");
    if (gs) gs.addEventListener("input", function () { /* visual only in prototype */ });
  }
  function updateTabsActive() {
    document.querySelectorAll(".tab").forEach(function (t) {
      t.classList.toggle("active", t.getAttribute("data-tab") === state.tab);
    });
  }
  function wireTab() {
    // messages
    document.querySelectorAll("[data-account]").forEach(function (el) {
      el.addEventListener("click", function () {
        state.activeAccount = el.getAttribute("data-account");
        var convs = M.detail.conversations.filter(function (c) { return accountKey(c.platform, c.account) === state.activeAccount; });
        if (convs[0]) state.activeConv = convs[0].id;
        renderTab();
      });
    });
    document.querySelectorAll("[data-conv]").forEach(function (el) {
      el.addEventListener("click", function () { state.activeConv = el.getAttribute("data-conv"); renderTab(); });
    });
    var cs = document.getElementById("convSearch");
    if (cs) cs.addEventListener("input", function () {
      state.convSearch = this.value; renderTab();
      var c2 = document.getElementById("convSearch"); if (c2) { c2.focus(); c2.setSelectionRange(c2.value.length, c2.value.length); }
    });
    // media
    document.querySelectorAll("[data-media-filter]").forEach(function (el) {
      el.addEventListener("click", function () { state.mediaFilter = el.getAttribute("data-media-filter"); renderTab(); });
    });
    document.querySelectorAll("[data-media]").forEach(function (el) {
      el.addEventListener("click", function () { openLightbox(el.getAttribute("data-media")); });
    });
    // calls
    document.querySelectorAll("[data-call-filter]").forEach(function (el) {
      el.addEventListener("click", function () { state.callFilter = el.getAttribute("data-call-filter"); renderTab(); });
    });
    // contacts
    document.querySelectorAll("[data-contact-sort]").forEach(function (el) {
      el.addEventListener("click", function () { state.contactSort = el.getAttribute("data-contact-sort"); renderTab(); });
    });
    // overview -> open locations tab buttons
    document.querySelectorAll('#tabBody [data-tab]').forEach(function (el) {
      el.addEventListener("click", function () { state.tab = el.getAttribute("data-tab"); updateTabsActive(); renderTab(); });
    });
  }

  // keyboard: Ctrl/Cmd+K focuses search, Esc closes overlays
  document.addEventListener("keydown", function (e) {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); var s = document.getElementById("globalSearch"); if (s) s.focus(); }
    if (e.key === "Escape") {
      if (document.getElementById("lightbox").classList.contains("open")) closeLightbox();
      else if (document.getElementById("overlay").classList.contains("open")) closeWizard();
    }
  });

  /* ============================================================ INIT ====== */
  render();
})();
