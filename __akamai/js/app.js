/* =============================================================================
   APIdrift — application logic (vanilla JS, no build step)
   Renders the Overview, Triage queue and Issue detail drawer from window.APP.
   ============================================================================= */
(function () {
  "use strict";
  const { AREAS, TYPES, ACTIONS, ISSUES, RUN, NOW } = window.APP;

  /* ----------------------------- state ---------------------------------- */
  const state = {
    view: "overview",
    group: "priority",       // priority | area | action
    sort: "score",           // score | traffic | recent
    search: "",
    filters: { area: new Set(), type: new Set(), severity: new Set(), action: new Set(), tag: new Set() },
    current: null
  };

  /* --------------------------- formatting ------------------------------- */
  const nf = new Intl.NumberFormat("en-US");
  const cf = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  function relTime(iso) {
    if (!iso) return null;
    const ms = NOW - new Date(iso);
    const m = Math.round(ms / 60000);
    if (m < 60) return m <= 1 ? "just now" : m + "m ago";
    const h = Math.round(m / 60); if (h < 24) return h + "h ago";
    const d = Math.round(h / 24); if (d < 7) return d + "d ago";
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  function sparkSVG(data, color, w = 72, h = 22) {
    const max = Math.max(1, ...data);
    const stepX = w / (data.length - 1);
    const pts = data.map((v, i) => `${(i * stepX).toFixed(1)},${(h - 2 - (v / max) * (h - 4)).toFixed(1)}`);
    const area = `0,${h} ${pts.join(" ")} ${w},${h}`;
    const allZero = data.every((v) => v === 0);
    if (allZero) return `<svg class="spark" width="${w}" height="${h}"><line x1="0" y1="${h - 3}" x2="${w}" y2="${h - 3}" stroke="var(--line)" stroke-width="2" stroke-dasharray="3 3"/></svg>`;
    return `<svg class="spark" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">
      <polygon points="${area}" fill="${color}" opacity="0.12"/>
      <polyline points="${pts.join(" ")}" fill="none" stroke="${color}" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"/>
      <circle cx="${pts[pts.length - 1].split(",")[0]}" cy="${pts[pts.length - 1].split(",")[1]}" r="2.2" fill="${color}"/>
    </svg>`;
  }

  const sevColor = { critical: "var(--crit)", high: "var(--high)", medium: "var(--med)", low: "#aab4c4" };
  const isOpen = (i) => i.status !== "resolved" && i.status !== "dismissed";
  const statusLabel = { new: "New", open: "Open", in_progress: "In progress", resolved: "Resolved", dismissed: "Dismissed" };

  /* ===================================================================== */
  /*  OVERVIEW                                                             */
  /* ===================================================================== */
  function renderOverview() {
    const open = ISSUES.filter(isOpen);
    const crit = open.filter((i) => i.severity === "critical").length;
    const high = open.filter((i) => i.severity === "high").length;
    const shadow = open.filter((i) => i.type === "shadow_api");
    const shadowSensitive = shadow.filter((i) => i.area === "Payments" || i.area === "Users").length;
    const sensitive = open.filter((i) => i.area === "Payments" || i.area === "Users");
    const sensitiveUnauth = sensitive.filter((i) => i.authObserved === "none").length;
    const fresh = open.filter((i) => i.tags.includes("New"));
    const freshHi = fresh.filter((i) => i.tags.includes("High traffic")).length;

    const kpis = [
      { accent: "brand", ic: "brand", glyph: "▤", label: "Open issues", val: open.length,
        foot: `<b>${crit}</b> critical · <b>${high}</b> high`, filter: {} },
      { accent: "crit", ic: "crit", glyph: "▲", label: "Shadow APIs", val: shadow.length,
        foot: `<b>${shadowSensitive}</b> in Payments / Users`, filter: { type: ["shadow_api"] } },
      { accent: "high", ic: "high", glyph: "⬢", label: "Sensitive-area issues", val: sensitive.length,
        foot: `<b>${sensitiveUnauth}</b> unauthenticated`, filter: { area: ["Payments", "Users"] } },
      { accent: "teal", ic: "teal", glyph: "✦", label: "New this week", val: fresh.length,
        foot: `<b>${freshHi}</b> on high-traffic routes`, filter: { tag: ["New"] } }
    ];
    $("#kpis").innerHTML = kpis.map((k) => `
      <div class="kpi accent-${k.accent}" data-filter='${JSON.stringify(k.filter)}'>
        <div class="k-top">
          <div class="k-label">${k.label}</div>
          <div class="k-ic ${k.ic}">${k.glyph}</div>
        </div>
        <div class="k-val">${k.val}</div>
        <div class="k-foot">${k.foot}</div>
      </div>`).join("");

    // by area (sorted by sensitivity), stacked severity
    const areaOrder = Object.keys(AREAS).sort((a, b) => AREAS[b].sensitivity - AREAS[a].sensitivity);
    const areaStats = areaOrder.map((a) => {
      const items = ISSUES.filter((i) => i.area === a);
      const by = (s) => items.filter((i) => i.severity === s).length;
      return { a, total: items.length, critical: by("critical"), high: by("high"), medium: by("medium"), low: by("low") };
    });
    const maxArea = Math.max(...areaStats.map((s) => s.total), 1);
    $("#dist-area").innerHTML = areaStats.map((s) => {
      const seg = (k) => s[k] ? `<span class="seg-${k}" style="width:${(s[k] / s.total) * 100}%"></span>` : "";
      return `<div class="dist-row" data-area="${s.a}" title="Open ${s.a} in triage">
        <div class="d-name">${s.a}</div>
        <div class="dist-track"><div style="display:flex;height:100%;width:${(s.total / maxArea) * 100}%;border-radius:6px;overflow:hidden">
          ${seg("critical")}${seg("high")}${seg("medium")}${seg("low")}
        </div></div>
        <div class="d-val">${s.total}</div>
      </div>`;
    }).join("") + `<div class="legend">
        <span><i style="background:var(--crit)"></i>Critical</span>
        <span><i style="background:var(--high)"></i>High</span>
        <span><i style="background:var(--med)"></i>Medium</span>
        <span><i style="background:#aab4c4"></i>Low</span>
      </div>`;

    // by type
    const typeOrder = Object.keys(TYPES).sort((a, b) => TYPES[b].w - TYPES[a].w);
    const typeStats = typeOrder.map((t) => ({ t, n: ISSUES.filter((i) => i.type === t).length }));
    const maxType = Math.max(...typeStats.map((s) => s.n), 1);
    $("#dist-type").innerHTML = typeStats.map((s) => `
      <div class="dist-row" data-type="${s.t}" style="grid-template-columns:140px 1fr 28px" title="Filter ${TYPES[s.t].label}">
        <div class="d-name">${TYPES[s.t].glyph} ${TYPES[s.t].label}</div>
        <div class="dist-track"><div class="dist-fill" style="width:${(s.n / maxType) * 100}%;background:linear-gradient(90deg,var(--brand),var(--teal))"></div></div>
        <div class="d-val">${s.n}</div>
      </div>`).join("");

    // top priorities
    const top = ISSUES.filter(isOpen).sort((a, b) => b.score - a.score).slice(0, 6);
    $("#top-prios").innerHTML = top.map((i, idx) => `
      <div class="prio-item" data-id="${i.id}">
        <div class="prio-rank">${idx + 1}</div>
        <div class="prio-main">
          <div class="p-title">
            <span class="method ${i.method}">${i.method}</span>
            <span class="mono" style="font-weight:600">${esc(i.path)}</span>
            <span class="sev ${i.severity}">${i.severity}</span>
          </div>
          <div class="p-sub">${TYPES[i.type].glyph} ${TYPES[i.type].label} · <span class="area-tag area-${i.area}" style="padding:0 6px">${i.area}</span> · ${i.requests7d ? nf.format(i.requests7d) + " reqs" : "no traffic"}${i.lastSeen ? " · " + relTime(i.lastSeen) : ""}</div>
        </div>
        <div><span class="action-tag ${ACTIONS[i.action].tone}">${ACTIONS[i.action].label}</span></div>
      </div>`).join("");

    // recommended steps summary
    const actOrder = ["investigate", "developer", "spec_update", "no_action"];
    $("#action-summary").innerHTML = actOrder.map((a) => {
      const items = ISSUES.filter((i) => i.action === a && isOpen(i));
      return `<div class="prio-item" data-action="${a}" style="grid-template-columns:1fr auto">
        <div>
          <div class="p-title"><span class="action-tag ${ACTIONS[a].tone}">${ACTIONS[a].label}</span></div>
          <div class="p-sub">${ACTIONS[a].hint}</div>
        </div>
        <div style="font-weight:750;font-size:18px;color:var(--ink-2)">${items.length}</div>
      </div>`;
    }).join("");
  }

  /* ===================================================================== */
  /*  TRIAGE QUEUE                                                          */
  /* ===================================================================== */
  function passesFilters(i) {
    const f = state.filters;
    if (f.area.size && !f.area.has(i.area)) return false;
    if (f.type.size && !f.type.has(i.type)) return false;
    if (f.severity.size && !f.severity.has(i.severity)) return false;
    if (f.action.size && !f.action.has(i.action)) return false;
    if (f.tag.size && !i.tags.some((t) => f.tag.has(t))) return false;
    if (state.search) {
      const q = state.search.toLowerCase();
      const hay = `${i.path} ${i.id} ${i.method} ${i.area} ${TYPES[i.type].label} ${(i.detail && i.detail.paramName) || ""} ${i.summary}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  }

  function sortIssues(list) {
    const s = state.sort;
    return list.slice().sort((a, b) => {
      if (s === "traffic") return b.requests7d - a.requests7d || b.score - a.score;
      if (s === "recent") return (new Date(b.lastSeen || 0)) - (new Date(a.lastSeen || 0)) || b.score - a.score;
      return b.score - a.score;
    });
  }

  function rowHTML(i) {
    const traffic = i.requests7d
      ? `<div class="row center" style="gap:9px"><span style="font-weight:650">${nf.format(i.requests7d)}</span>${sparkSVG(i.trendData, sevColor[i.severity])}</div>`
      : `<span class="muted">No traffic</span>`;
    const last = relTime(i.lastSeen) || `<span class="muted">—</span>`;
    const tagChips = i.tags.slice(0, 3).map((t) => {
      const cls = t === "New" ? "new" : (t === "Unauthenticated") ? "crit" : (t === "Card data" || t === "Credentials") ? "crit" : (t === "PII") ? "pii" : "outline";
      return `<span class="chip ${cls}">${t}</span>`;
    }).join("");
    return `<tr data-id="${i.id}">
      <td>
        <div class="score ${i.severity}">
          <span class="num">${i.score}</span>
          <span class="meter"><i style="width:${i.score}%"></i></span>
        </div>
        <div style="margin-top:5px"><span class="sev ${i.severity}">${i.severity}</span></div>
      </td>
      <td>
        <div class="ep"><span class="method ${i.method}">${i.method}</span><span class="path">${esc(i.path)}</span></div>
        <div class="ep-sub">
          <span class="chip outline">${TYPES[i.type].glyph} ${TYPES[i.type].short}</span>
          <span class="mono" style="font-size:11px">${i.id}</span>
          ${tagChips}
        </div>
      </td>
      <td><span class="area-tag area-${i.area}">${i.area}</span></td>
      <td>${traffic}</td>
      <td class="nowrap">${last}</td>
      <td><span class="action-tag ${ACTIONS[i.action].tone}">${ACTIONS[i.action].label}</span></td>
    </tr>`;
  }

  function renderTriage() {
    const filtered = ISSUES.filter(passesFilters);
    const tbody = $("#triage-tbody");

    let html = "";
    if (!filtered.length) {
      html = `<tr><td colspan="6"><div class="empty">No issues match these filters.<br><button class="btn sm" id="empty-clear" style="margin-top:10px">Clear filters</button></div></td></tr>`;
    } else if (state.group === "priority") {
      html = sortIssues(filtered).map(rowHTML).join("");
    } else {
      const key = state.group === "area" ? "area" : "action";
      let groups;
      if (key === "area") groups = Object.keys(AREAS).sort((a, b) => AREAS[b].sensitivity - AREAS[a].sensitivity);
      else groups = ["investigate", "developer", "spec_update", "no_action"];
      html = groups.map((g) => {
        const items = sortIssues(filtered.filter((i) => i[key] === g));
        if (!items.length) return "";
        const title = key === "area" ? `${g} <span class="muted" style="font-weight:500;text-transform:none">· ${AREAS[g].blurb}</span>` : ACTIONS[g].label;
        return `<tr class="group-row"><td colspan="6">${title}<span class="g-count">${items.length}</span></td></tr>` + items.map(rowHTML).join("");
      }).join("");
    }
    tbody.innerHTML = html;

    // counts + active filters
    $("#result-count").innerHTML = `<b>${filtered.length}</b> of ${ISSUES.length} issues`;
    const active = ["area", "type", "severity", "action", "tag"].reduce((n, k) => n + state.filters[k].size, 0) + (state.search ? 1 : 0);
    $("#clear-filters").style.display = active ? "" : "none";
    $("#active-filters").textContent = active ? `${active} filter${active > 1 ? "s" : ""} active` : "";
    $("#nav-open-count").textContent = ISSUES.filter(isOpen).length;
  }

  function renderFilters() {
    const count = (pred) => ISSUES.filter(pred).length;
    const groups = [
      { key: "area", title: "Area", opts: Object.keys(AREAS).sort((a, b) => AREAS[b].sensitivity - AREAS[a].sensitivity).map((a) => ({ v: a, label: a, n: count((i) => i.area === a) })) },
      { key: "severity", title: "Severity", opts: ["critical", "high", "medium", "low"].map((s) => ({ v: s, label: s[0].toUpperCase() + s.slice(1), n: count((i) => i.severity === s) })) },
      { key: "type", title: "Issue type", opts: Object.keys(TYPES).sort((a, b) => TYPES[b].w - TYPES[a].w).map((t) => ({ v: t, label: TYPES[t].label, n: count((i) => i.type === t) })) },
      { key: "action", title: "Recommended action", opts: ["investigate", "developer", "spec_update", "no_action"].map((a) => ({ v: a, label: ACTIONS[a].label, n: count((i) => i.action === a) })) },
      { key: "tag", title: "Flags", opts: ["New", "Unauthenticated", "Card data", "Credentials", "PII", "High traffic"].map((t) => ({ v: t, label: t, n: count((i) => i.tags.includes(t)) })) }
    ];
    $("#filters").innerHTML = groups.map((g) => `
      <div class="filter-group">
        <h4>${g.title}</h4>
        ${g.opts.map((o) => `
          <label class="facet">
            <input type="checkbox" data-fkey="${g.key}" data-fval="${o.v}" ${state.filters[g.key].has(o.v) ? "checked" : ""}/>
            <span>${o.label}</span>
            <span class="f-count">${o.n}</span>
          </label>`).join("")}
      </div>`).join("");
  }

  /* ===================================================================== */
  /*  ISSUE DETAIL DRAWER                                                   */
  /* ===================================================================== */
  function buildDiff(i) {
    const d = i.detail || {};
    let spec = [], obs = [];
    const line = (text, t = "") => ({ text, t });
    if (i.type === "shadow_api") {
      spec.push(line("✕ No matching operation in the spec.", "muted"));
      spec.push(line(""));
      spec.push(line("This path is undocumented.", "muted"));
      obs.push(line(`${i.method} ${i.path}`, "add"));
      (d.observedParams || []).forEach((p) => obs.push(line(`  ${p.name} (${p.in}): ${p.type}${p.sample ? "  e.g. " + p.sample : ""}`, "add")));
      obs.push(line(`  auth observed: ${i.authObserved}`, i.authObserved === "none" ? "add" : ""));
    } else if (i.type === "zombie_endpoint") {
      spec.push(line(`${i.method} ${i.path}`));
      spec.push(line(`  documented · expects auth: ${i.authExpected || "n/a"}`));
      obs.push(line("○ Not seen in 7 days of traffic.", "muted"));
      obs.push(line(""));
      obs.push(line("0 requests observed.", "muted"));
    } else if (i.type === "undocumented_param") {
      spec.push(line(`${i.method} ${i.path}`));
      spec.push(line(`  (parameter ‘${d.paramName}’ is not documented)`, "muted"));
      obs.push(line(`${i.method} ${i.path}`));
      obs.push(line(`  ${d.paramName} (${d.in}): ${d.observedType}`, "add"));
      if (d.observedValues) obs.push(line(`     e.g. ${d.observedValues.join(", ")}`, "add"));
    } else if (i.type === "unused_param") {
      spec.push(line(`${i.method} ${i.path}`));
      spec.push(line(`  ${d.paramName} (${d.in}): ${d.specType}`));
      obs.push(line(`${i.method} ${i.path}`));
      obs.push(line(`  · ‘${d.paramName}’ never sent by any client`, "muted"));
    } else if (i.type === "param_mismatch") {
      spec.push(line(`${i.method} ${i.path}`));
      spec.push(line(`  ${d.paramName} (${d.in}): ${d.specType}${d.specRequired ? " (required)" : ""}`, "rem"));
      obs.push(line(`${i.method} ${i.path}`));
      obs.push(line(`  ${d.paramName} (${d.in}): ${d.observedType}`, "add"));
      if (d.observedValues) obs.push(line(`     e.g. ${d.observedValues.join(", ")}`, "add"));
    }
    const render = (arr) => arr.map((l) => l.t ? `<span class="${l.t === "muted" ? "muted-line" : l.t}">${esc(l.text)}</span>` : esc(l.text || " ")).join("\n");
    return { spec: render(spec), obs: render(obs) };
  }

  function scoreBreakdownHTML(i) {
    const p = i.scoreParts;
    const rows = [
      ["Issue type", p.typeW, 30, TYPES[i.type].label],
      ["Area sensitivity", p.areaPts, 20, i.area],
      ["Traffic volume", p.trafficPts, 25, i.requests7d ? nf.format(i.requests7d) + " reqs" : "—"],
      ["Recency", p.recencyPts, 10, relTime(i.lastSeen) || "—"],
      ["Exposure", p.expo, 15, (i.sensitiveData && i.sensitiveData.length) ? i.sensitiveData.join(", ") : (i.authObserved === "none" ? "unauthenticated" : "—")]
    ];
    return `<div class="score-break">
      ${rows.map(([k, v, max, ctx]) => `
        <div class="sb-row" title="${esc(ctx)}">
          <div class="sb-k">${k}</div>
          <div class="sb-track"><i style="width:${(v / max) * 100}%"></i></div>
          <div class="sb-v">+${v}</div>
        </div>`).join("")}
      <div class="sb-total"><span>Priority score</span><span class="sev ${i.severity}" style="font-size:13px">${i.score} · ${i.severity}</span></div>
    </div>`;
  }

  function renderDrawer(i) {
    state.current = i;
    const diff = buildDiff(i);
    const facts = [];
    facts.push({ k: "Area", v: `${i.area}`, alarm: i.area === "Payments" || i.area === "Users", sub: `sensitivity ${AREAS[i.area].sensitivity.toFixed(2)}` });
    facts.push({ k: "Traffic (7 days)", v: i.requests7d ? nf.format(i.requests7d) : "None", sub: i.requests7d ? "requests observed" : "not seen in traffic" });
    facts.push({ k: "Auth observed", v: i.authObserved === "none" ? "None 🔓" : i.authObserved, alarm: i.authObserved === "none", sub: i.authExpected ? `spec expects ${i.authExpected}` : "no spec contract" });
    facts.push({ k: "Sensitive data", v: (i.sensitiveData && i.sensitiveData.length) ? i.sensitiveData.join(", ") : "None detected", alarm: (i.sensitiveData || []).some((s) => s === "PAN" || s === "credentials") });
    facts.push({ k: "First seen", v: i.firstSeen ? relTime(i.firstSeen) : "—", sub: i.firstSeen && (NOW - new Date(i.firstSeen) <= 7 * 864e5) ? "new this week" : "" });
    facts.push({ k: "Last seen", v: relTime(i.lastSeen) || "—" });

    const tone = ACTIONS[i.action].tone;
    const altActions = ["investigate", "developer", "spec_update", "no_action"].filter((a) => a !== i.action);

    const samplesHTML = (i.samples && i.samples.length) ? `
      <div class="d-section">
        <h4>Evidence · sampled requests</h4>
        <div class="samples">
          ${i.samples.map((s) => `<div class="samp">
            <span class="s-code ${s.status < 400 ? "ok" : ""}">${s.status}</span>
            <span class="s-line" title="${esc(s.line)}">${esc(s.line)}</span>
            <span class="s-meta">${esc(s.ip)} · ${s.auth} · ${relTime(s.ts)}</span>
          </div>`).join("")}
        </div>
      </div>` : "";

    $("#drawer").innerHTML = `
      <div class="drawer-head">
        <div class="row between">
          <span class="d-id">${i.id} · run ${RUN.runId}</span>
          <button class="iconbtn" id="drawer-close" title="Close">✕</button>
        </div>
        <div class="d-title">
          <span class="method ${i.method}">${i.method}</span>
          <span class="path">${esc(i.path)}</span>
        </div>
        <div class="row center wrap" style="gap:8px">
          <span class="sev ${i.severity}">${i.severity} · ${i.score}</span>
          <span class="chip outline">${TYPES[i.type].glyph} ${TYPES[i.type].label}</span>
          <span class="area-tag area-${i.area}">${i.area}</span>
          <span class="chip ${i.status === "resolved" ? "new" : i.status === "dismissed" ? "outline" : "warn"}">${statusLabel[i.status] || i.status}</span>
        </div>
      </div>
      <div class="drawer-body">
        <div class="d-section">
          <h4>Why it matters</h4>
          <div class="why">
            <p>${esc(i.summary)}</p>
            <div class="why-grid">
              ${facts.map((f) => `<div class="fact ${f.alarm ? "alarm" : ""}">
                <div class="f-k">${f.k}</div>
                <div class="f-v">${f.v}</div>
                ${f.sub ? `<div class="f-k" style="margin-top:2px">${f.sub}</div>` : ""}
              </div>`).join("")}
            </div>
            ${i.detail && i.detail.note ? `<p style="margin:13px 0 0;font-size:12.5px;color:var(--ink-3)">⚐ ${esc(i.detail.note)}</p>` : ""}
          </div>
        </div>

        <div class="d-section">
          <h4>Why this priority</h4>
          ${scoreBreakdownHTML(i)}
        </div>

        <div class="d-section">
          <h4>Spec vs. production traffic</h4>
          <div class="diff">
            <div class="d-col"><h5>📘 In the spec</h5><pre>${diff.spec}</pre></div>
            <div class="d-col"><h5>📡 In production traffic</h5><pre>${diff.obs}</pre></div>
          </div>
        </div>

        ${samplesHTML}

        <div class="d-section">
          <h4>Recommended next step</h4>
          <div class="rec ${tone}">
            <div class="r-top">
              <span class="action-tag ${tone}" style="font-size:13px">${ACTIONS[i.action].label}</span>
            </div>
            <div class="r-why">${ACTIONS[i.action].hint}</div>
            <div class="alt-actions">
              <button class="btn primary act-btn" data-act="${i.action}">${primaryVerb(i.action)}</button>
              ${altActions.map((a) => `<button class="btn sm act-btn" data-act="${a}">${ACTIONS[a].label}</button>`).join("")}
            </div>
          </div>
        </div>

        <div class="d-section">
          <h4>Activity</h4>
          <div class="timeline">
            ${i.activity.slice().reverse().map((a) => `<div class="tl-item">
              <div class="tl-text">${esc(a.text)}</div>
              <div class="tl-meta">${a.who} · ${relTime(a.ts) || "just now"}</div>
            </div>`).join("")}
          </div>
        </div>
      </div>
      <div class="drawer-foot">
        <button class="btn primary act-btn" data-act="${i.action}">${primaryVerb(i.action)}</button>
        <button class="btn act-btn" data-act="assign">${i.assignee === "Sam Arden" ? "✓ Assigned to me" : "Assign to me"}</button>
        <div class="grow"></div>
        <button class="btn ghost act-btn" data-act="no_action">Dismiss</button>
      </div>`;

    openDrawer();
  }

  function primaryVerb(a) {
    return { investigate: "Open investigation", developer: "File developer ticket", spec_update: "Open spec update PR", no_action: "Acknowledge · no action" }[a];
  }

  function applyAction(i, act) {
    if (act === "assign") {
      i.assignee = i.assignee === "Sam Arden" ? null : "Sam Arden";
      i.activity.push({ ts: NOW.toISOString(), who: "Sam Arden", text: i.assignee ? "Assigned to Sam Arden." : "Unassigned." });
      toast(i.assignee ? `${i.id} assigned to you` : `${i.id} unassigned`);
    } else {
      const map = {
        investigate: { st: "in_progress", msg: `Investigation opened for ${i.id}`, log: "Investigation opened — escalated to security on-call." },
        developer: { st: "in_progress", msg: `Developer ticket SF-${1200 + (i.id.charCodeAt(4) % 700)} created`, log: "Developer ticket filed with the owning team." },
        spec_update: { st: "resolved", msg: `Spec update PR opened for ${i.id}`, log: "Spec update PR opened to reconcile the difference." },
        no_action: { st: "dismissed", msg: `${i.id} acknowledged — no action`, log: "Acknowledged as low risk — no action needed." }
      }[act];
      i.status = map.st;
      i.activity.push({ ts: NOW.toISOString(), who: "Sam Arden", text: map.log });
      toast(map.msg);
    }
    renderDrawer(i);
    renderTriage();
    renderOverview();
  }

  /* drawer open/close */
  function openDrawer() { $("#scrim").classList.add("show"); $("#drawer").classList.add("show"); $("#drawer").setAttribute("aria-hidden", "false"); }
  function closeDrawer() { $("#scrim").classList.remove("show"); $("#drawer").classList.remove("show"); $("#drawer").setAttribute("aria-hidden", "true"); state.current = null; }

  /* toast */
  let toastT;
  function toast(msg) {
    const t = $("#toast"); $("#toast-msg").textContent = msg; t.classList.add("show");
    clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove("show"), 2600);
  }

  /* ===================================================================== */
  /*  NAVIGATION + EVENTS                                                   */
  /* ===================================================================== */
  function switchView(v) {
    state.view = v;
    $$(".nav-item[data-view]").forEach((b) => b.classList.toggle("active", b.dataset.view === v));
    ["overview", "triage", "approach"].forEach((name) => $("#view-" + name).classList.toggle("hidden", name !== v));
    try { window.scrollTo({ top: 0 }); } catch (e) {}
  }

  function applyKpiFilter(filterObj) {
    ["area", "type", "severity", "action", "tag"].forEach((k) => state.filters[k].clear());
    Object.entries(filterObj || {}).forEach(([k, vals]) => vals.forEach((v) => state.filters[k].add(v)));
    state.search = ""; $("#search").value = "";
    renderFilters(); renderTriage(); switchView("triage");
  }

  function bind() {
    // nav
    $$(".nav-item[data-view]").forEach((b) => b.addEventListener("click", () => switchView(b.dataset.view)));
    document.body.addEventListener("click", (e) => {
      const goto = e.target.closest("[data-goto]");
      if (goto) { switchView(goto.dataset.goto); return; }
    });

    // KPI + overview interactions
    $("#kpis").addEventListener("click", (e) => {
      const k = e.target.closest(".kpi"); if (!k) return;
      applyKpiFilter(JSON.parse(k.dataset.filter || "{}"));
    });
    $("#dist-area").addEventListener("click", (e) => {
      const r = e.target.closest("[data-area]"); if (!r) return;
      applyKpiFilter({ area: [r.dataset.area] });
    });
    $("#dist-type").addEventListener("click", (e) => {
      const r = e.target.closest("[data-type]"); if (!r) return;
      applyKpiFilter({ type: [r.dataset.type] });
    });
    $("#top-prios").addEventListener("click", (e) => {
      const r = e.target.closest("[data-id]"); if (!r) return;
      renderDrawer(ISSUES.find((x) => x.id === r.dataset.id));
    });
    $("#action-summary").addEventListener("click", (e) => {
      const r = e.target.closest("[data-action]"); if (!r) return;
      applyKpiFilter({ action: [r.dataset.action] });
    });

    // triage: row click -> drawer
    $("#triage-tbody").addEventListener("click", (e) => {
      if (e.target.id === "empty-clear") { clearAllFilters(); return; }
      const tr = e.target.closest("tr[data-id]"); if (!tr) return;
      renderDrawer(ISSUES.find((x) => x.id === tr.dataset.id));
    });

    // filters
    $("#filters").addEventListener("change", (e) => {
      const cb = e.target; if (!cb.dataset.fkey) return;
      const set = state.filters[cb.dataset.fkey];
      cb.checked ? set.add(cb.dataset.fval) : set.delete(cb.dataset.fval);
      renderTriage();
    });
    $("#clear-filters").addEventListener("click", clearAllFilters);

    // search
    $("#search").addEventListener("input", (e) => { state.search = e.target.value.trim(); renderTriage(); });

    // grouping + sort
    $("#group-ctl").addEventListener("click", (e) => {
      const b = e.target.closest("button[data-group]"); if (!b) return;
      state.group = b.dataset.group;
      $$("#group-ctl button").forEach((x) => x.classList.toggle("on", x === b));
      renderTriage();
    });
    $("#sort-sel").addEventListener("change", (e) => { state.sort = e.target.value; renderTriage(); });
    $$(".tbl thead th[data-sort]").forEach((th) => th.addEventListener("click", () => {
      state.sort = th.dataset.sort; $("#sort-sel").value = "score"; renderTriage();
    }));

    // drawer
    $("#scrim").addEventListener("click", closeDrawer);
    $("#drawer").addEventListener("click", (e) => {
      if (e.target.id === "drawer-close") return closeDrawer();
      const a = e.target.closest(".act-btn"); if (a && state.current) applyAction(state.current, a.dataset.act);
    });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeDrawer(); });

    // theme
    $("#theme-btn").addEventListener("click", () => {
      const cur = document.documentElement.getAttribute("data-theme");
      const next = cur === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      try { localStorage.setItem("apidrift-theme", next); } catch (e) {}
    });

    // rerun (cosmetic)
    $("#rerun-btn").addEventListener("click", () => toast("Comparison run complete — no new issues since " + RUN.windowDates.split("–")[1]));
  }

  function clearAllFilters() {
    ["area", "type", "severity", "action", "tag"].forEach((k) => state.filters[k].clear());
    state.search = ""; $("#search").value = "";
    renderFilters(); renderTriage();
  }

  /* ----------------------------- init ----------------------------------- */
  function init() {
    try { const t = localStorage.getItem("apidrift-theme"); if (t) document.documentElement.setAttribute("data-theme", t); } catch (e) {}
    $("#tb-spec").textContent = `${RUN.specName} ${RUN.specVersion}`;
    $("#tb-run").textContent = `Comparison run ${RUN.runId}`;
    $("#tb-window").textContent = `${RUN.window} · ${RUN.windowDates}`;
    renderOverview();
    renderFilters();
    renderTriage();
    bind();
  }
  document.addEventListener("DOMContentLoaded", init);
})();
