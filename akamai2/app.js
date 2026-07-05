/* ============================================================================
 *  Akamai · AI Behavioral Engine — Entity Investigation Side-Panel
 *  app.js — All client-side logic, state & interactions (no backend)
 *
 *  ── DESIGN ASSUMPTIONS (documented, per brief) ──────────────────────────
 *  1. The side-panel opens over a dimmed SOC queue. The queue is context only —
 *     the assignment scope is the panel, so only the Critical alert is wired.
 *  2. The AI "streams" its summary on open (skeleton → thinking → typed text) to
 *     mirror real LLM latency and build the AI-native feel.
 *  3. The 95 risk score is presented as an explainable sum of 5 weighted signals
 *     (glass-box, not black-box) — each with observed-vs-baseline evidence.
 *  4. Every response action is reversible and gated by an explicit confirm +
 *     impact acknowledgement (human-in-the-loop guardrail). Actions & incident
 *     status persist in localStorage so the investigation survives a refresh.
 *  5. Pivots (files / device / timeline / baseline) open an in-panel drill-down
 *     layer with a Back button so the analyst never loses the parent context.
 * ========================================================================== */

(function () {
  "use strict";

  const M = window.MOCK;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const STORE_KEY = "akamai_investigation_v1";
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const icons = () => { try { window.lucide && window.lucide.createIcons(); } catch (e) {} };

  /* ---------------- Persistent state ------------------------------------- */
  const defaultState = () => ({ status: "open", completed: [], audit: [] });
  let state = load();

  function load() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) return Object.assign(defaultState(), JSON.parse(raw));
    } catch (e) {}
    return defaultState();
  }
  function save() { try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) {} }
  function resetState() { state = defaultState(); save(); }

  function nowClock() {
    const d = new Date();
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
  }

  /* ---------------- SOC background (context) ----------------------------- */
  function renderSOC() {
    $("#socKpis").innerHTML = M.soc.kpis.map(k => `
      <div class="kpi ${k.tone === "critical" ? "kpi--critical" : ""}">
        <span class="kpi__icon"><i data-lucide="${k.icon}"></i></span>
        <div><div class="kpi__val">${k.value}</div><div class="kpi__label">${k.label}</div></div>
      </div>`).join("");

    const head = `
      <div class="qrow qrow--head" role="row">
        <span class="qrow__col--id">Alert</span><span>Detection</span>
        <span class="qrow__col--entity">Entity</span><span>Severity</span>
        <span class="qrow__col--score">Risk</span><span></span>
      </div>`;

    const rows = M.soc.queue.map(a => {
      const c = severityColor(a.severity);
      return `
      <div class="qrow ${a.primary ? "qrow--primary" : ""} qrow--clickable" role="row" data-alert="${a.id}" data-primary="${!!a.primary}" tabindex="0">
        <span class="qrow__id qrow__col--id">${a.id}</span>
        <span class="qrow__title">${a.primary ? '<i data-lucide="flame" class="flare"></i>' : ""}${a.title}</span>
        <span class="qrow__entity qrow__col--entity"><span class="avatar avatar--sm" style="width:24px;height:24px;font-size:10px">${initials(a.entity)}</span>${a.entity}</span>
        <span><span class="sev sev--${a.severity}"><span class="sev__dot"></span>${a.severity}</span></span>
        <span class="score-bar qrow__col--score">
          <span class="score-bar__track"><span class="score-bar__fill" style="width:${a.score}%;background:${c}"></span></span>
          <span class="score-bar__num" style="color:${c}">${a.score}</span>
        </span>
        <span class="qrow__cta"><i data-lucide="chevron-right"></i></span>
      </div>`;
    }).join("");

    $("#socQueue").innerHTML = head + rows;

    $$("#socQueue .qrow--clickable").forEach(row => {
      const open = () => {
        if (row.dataset.primary === "true") openPanel();
        else toast("info", "Focused demo", "This prototype focuses on the Critical “Suspicious Data Download” alert. Click that row to investigate.");
      };
      row.addEventListener("click", open);
      row.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); } });
    });
  }

  function severityColor(s) {
    return ({ critical: "var(--crit)", high: "var(--orange)", medium: "var(--amber)", low: "var(--cyan)" })[s] || "var(--cyan)";
  }
  function initials(name) { return name.split(/\s+/).map(w => w[0]).join("").slice(0, 2).toUpperCase(); }

  /* ---------------- Panel: open / close ---------------------------------- */
  let panelBuilt = false;
  let lastFocus = null;

  function openPanel() {
    lastFocus = document.activeElement;
    document.body.classList.add("panel-open");
    const panel = $("#panel"), backdrop = $("#backdrop");
    backdrop.hidden = false; panel.hidden = false;
    requestAnimationFrame(() => { backdrop.classList.add("is-open"); panel.classList.add("is-open"); });

    hydratePanelStatics();
    renderStateDrivenBits();   // actions, audit, status (reflect persisted state)
    animateGauge(M.alert.riskScore);
    streamSummary();
    icons();
    setTimeout(() => $("#btnClose").focus(), 480);
  }

  function closePanel() {
    closeDrill(true);
    const panel = $("#panel"), backdrop = $("#backdrop");
    panel.classList.remove("is-open"); backdrop.classList.remove("is-open");
    document.body.classList.remove("panel-open");
    setTimeout(() => { panel.hidden = true; backdrop.hidden = true; }, 500);
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  /* ---------------- Panel: static hydration (once) ----------------------- */
  function hydratePanelStatics() {
    $("#panelAlertId").textContent = M.alert.id;
    $("#panelAvatar").textContent = M.entity.initials;
    $("#panelEntityName").textContent = M.entity.name;
    $("#panelEntityRole").textContent = `${M.entity.title} · ${M.entity.department}`;
    $("#panelAlertTitle").textContent = M.alert.title;
    $("#panelDetected").textContent = `detected ${M.alert.detectedAt}`;
    $("#panelMitre").innerHTML = M.alert.mitre.map(t =>
      `<span class="mitre-tag"><i data-lucide="crosshair"></i>${t.id} · ${t.label}</span>`).join("");

    if (panelBuilt) return;
    panelBuilt = true;

    renderKeyFacts();
    renderFactors();
    renderPivots();
    renderAskSuggest();
    wirePanelEvents();
  }

  function renderKeyFacts() {
    $("#keyFacts").innerHTML = M.keyFacts.map(f => `
      <div class="kf ${f.tone === "critical" ? "kf--critical" : f.tone === "warn" ? "kf--warn" : ""}">
        <div class="kf__icon"><i data-lucide="${f.icon}"></i></div>
        <div class="kf__val">${f.value}</div>
        <div class="kf__label">${f.label}</div>
      </div>`).join("");
  }

  /* ---------------- AI summary streaming --------------------------------- */
  function segmentText(text, marks) {
    let segs = [{ t: text }];
    marks.forEach(m => {
      const next = [];
      segs.forEach(seg => {
        if (seg.c) { next.push(seg); return; }
        const parts = seg.t.split(m.p);
        for (let i = 0; i < parts.length; i++) {
          if (parts[i]) next.push({ t: parts[i] });
          if (i < parts.length - 1) next.push({ t: m.p, c: m.c });
        }
      });
      segs = next;
    });
    return segs;
  }

  function summaryTokens() {
    const marks = [
      { p: "50 GB", c: "hl-crit" },
      { p: "250× her typical daily volume", c: "hl-crit" },
      { p: "02:03 AM PST", c: "hl" },
      { p: "unmanaged Windows 11 device", c: "hl" },
      { p: "residential network outside the corporate perimeter", c: "hl" },
      { p: "data-exfiltration patterns", c: "hl" },
      { p: "immediate containment", c: "hl-crit" },
    ];
    const segs = segmentText(M.aiSummary.text, marks);
    const tokens = [];
    segs.forEach(s => {
      const words = s.t.match(/\S+\s*|\s+/g) || [s.t];
      words.forEach(w => tokens.push({ t: w, c: s.c }));
    });
    return tokens;
  }

  function streamSummary() {
    const box = $("#aiSummary");
    const foot = $("#aiSummaryFoot");
    const conf = $("#summaryConfidence");
    foot.hidden = true; conf.hidden = true;
    $("#genTime").textContent = "";

    // 1) skeleton
    box.innerHTML = `
      <div class="ai-thinking"><span class="orbits"><span></span><span></span><span></span></span>
        Analysing Sarah's 18-month behavioural baseline…</div>
      <div class="skeleton">
        <div class="skln w-90"></div><div class="skln w-80"></div>
        <div class="skln w-90"></div><div class="skln w-60"></div>
      </div>`;
    icons();

    const tokens = summaryTokens();

    const startType = () => {
      box.innerHTML = "";
      const cursor = document.createElement("span");
      cursor.className = "cursor";
      box.appendChild(cursor);
      let i = 0;
      const step = () => {
        if (i >= tokens.length) {
          cursor.remove();
          conf.querySelector("span").textContent = `${M.aiSummary.confidence}% confidence`;
          conf.hidden = false;
          $("#genTime").textContent = `${tokens.length} tokens · ${M.aiSummary.generatedIn}`;
          foot.hidden = false; icons();
          return;
        }
        const burst = prefersReduced ? tokens.length : 1;
        for (let b = 0; b < burst && i < tokens.length; b++, i++) {
          const sp = document.createElement("span");
          sp.textContent = tokens[i].t;
          if (tokens[i].c) sp.className = tokens[i].c;
          box.insertBefore(sp, cursor);
        }
        setTimeout(step, 22 + Math.random() * 22);
      };
      step();
    };

    setTimeout(startType, prefersReduced ? 0 : 1150);
  }

  /* ---------------- Radial risk gauge ------------------------------------ */
  function animateGauge(score) {
    const fill = $("#gaugeFill");
    const num = $("#gaugeScore");
    const C = 2 * Math.PI * 52;
    fill.style.strokeDasharray = C.toFixed(1);
    fill.style.strokeDashoffset = C.toFixed(1);
    // trigger transition to target
    requestAnimationFrame(() => {
      fill.style.strokeDashoffset = (C * (1 - score / 100)).toFixed(1);
    });
    if (prefersReduced) { num.textContent = score; return; }
    const dur = 1400, t0 = performance.now();
    const tick = (t) => {
      const p = Math.min(1, (t - t0) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      num.textContent = Math.round(eased * score);
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  /* ---------------- Explainable AI: risk factors ------------------------- */
  function renderFactors() {
    const host = $("#riskFactors");
    host.innerHTML = M.riskFactors.map(f => `
      <div class="factor factor--${f.severity}" data-factor="${f.id}">
        <div class="factor__main" role="button" tabindex="0" aria-expanded="false">
          <div class="factor__icon"><i data-lucide="${f.icon}"></i></div>
          <div class="factor__body">
            <div class="factor__row1">
              <span class="factor__title">${f.title}</span>
              <span class="factor__contrib">+${f.contribution}</span>
              <span class="factor__mult">${f.multiplier}</span>
            </div>
            <div class="factor__cmp">
              <span class="factor__obs">${f.observed}</span>
              <span class="factor__vs">vs baseline</span>
              <span class="factor__base">${f.baseline}</span>
            </div>
          </div>
          <i class="factor__chev" data-lucide="chevron-down"></i>
        </div>
        <div class="factor__detail">
          <div class="factor__detail-inner">
            <div class="devbar">
              <div class="devbar__row">
                <span class="devbar__tag">Baseline</span>
                <span class="devbar__track"><span class="devbar__fill devbar__fill--base" data-w="${f.basePct}%"></span></span>
                <span class="devbar__val">${f.baseline}</span>
              </div>
              <div class="devbar__row">
                <span class="devbar__tag">Observed</span>
                <span class="devbar__track"><span class="devbar__fill devbar__fill--obs" data-w="${f.barPct}%"></span></span>
                <span class="devbar__val">${f.observed}</span>
              </div>
            </div>
            <p style="margin-top:12px">${f.detail}</p>
            <span class="conf-mini"><i data-lucide="badge-check"></i>Signal contributes +${f.contribution} to the 95 risk score</span>
          </div>
        </div>
      </div>`).join("") + `
      <div class="factors-total">
        <span class="factors-total__label"><i data-lucide="calculator"></i>Composite behavioural risk</span>
        <span class="factors-total__val">${M.alert.riskScore}<small>/100</small></span>
      </div>`;

    $$("#riskFactors .factor").forEach(fEl => {
      const main = $(".factor__main", fEl);
      const toggle = () => toggleFactor(fEl);
      main.addEventListener("click", toggle);
      main.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); } });
    });
  }

  function toggleFactor(fEl, force) {
    const open = force === undefined ? !fEl.classList.contains("is-open") : force;
    fEl.classList.toggle("is-open", open);
    $(".factor__main", fEl).setAttribute("aria-expanded", String(open));
    if (open) {
      $$(".devbar__fill", fEl).forEach(bar => {
        requestAnimationFrame(() => { bar.style.width = bar.dataset.w; });
      });
    }
  }

  /* ---------------- Recommended actions ---------------------------------- */
  function renderActions() {
    $("#actions").innerHTML = M.actions.map(a => {
      const done = state.completed.includes(a.id);
      return `
      <div class="action ${a.recommended ? "action--recommended" : ""} ${done ? "is-done" : ""}" data-action="${a.id}">
        ${a.recommended ? '<span class="action__rec-flag">AI Recommended</span>' : ""}
        <div class="action__icon"><i data-lucide="${a.icon}"></i></div>
        <div>
          <div class="action__title">${a.title}</div>
          <div class="action__sub">${a.subtitle}</div>
          <div class="action__meta">
            <span class="impact-tag impact-tag--${a.impact}">${a.impact} impact</span>
            <span class="action__conf"><i data-lucide="brain-circuit" style="font-size:13px"></i>AI confidence <b>${a.confidence}%</b></span>
          </div>
        </div>
        <button class="action__cta" data-run="${a.id}">
          ${done ? '<i data-lucide="check"></i>Done' : '<i data-lucide="' + a.icon + '"></i>Take action'}
        </button>
      </div>`;
    }).join("");

    $$("#actions [data-run]").forEach(btn => {
      btn.addEventListener("click", () => {
        const a = M.actions.find(x => x.id === btn.dataset.run);
        if (a && !state.completed.includes(a.id)) openConfirm(a);
      });
    });
  }

  /* ---------------- Pivots / drill-down ---------------------------------- */
  function renderPivots() {
    $("#pivots").innerHTML = M.pivots.map(p => `
      <button class="pivot" data-pivot="${p.id}">
        <span class="pivot__icon"><i data-lucide="${p.icon}"></i></span>
        <span class="pivot__meta"><span class="pivot__title">${p.title}</span><span class="pivot__sub">${p.meta}</span></span>
        <i class="pivot__go" data-lucide="arrow-right"></i>
      </button>`).join("");
    $$("#pivots .pivot").forEach(b => b.addEventListener("click", () => openDrill(b.dataset.pivot)));
  }

  let drillFocus = null;
  function openDrill(id) {
    const p = M.pivots.find(x => x.id === id);
    const builders = { files: buildFiles, device: buildDevice, timeline: buildTimeline, baseline: buildBaseline };
    $("#drillTitle").innerHTML = `<h3><span class="pivot__icon" style="width:32px;height:32px"><i data-lucide="${p.icon}"></i></span>${p.title}</h3><p>${drillSub(id)}</p>`;
    $("#drillBody").innerHTML = (builders[id] || (() => ""))();
    $("#drillCrumb").textContent = `${M.entity.name} · ${M.alert.id}`;
    const drill = $("#drill");
    drill.classList.add("is-open");
    drill.setAttribute("aria-hidden", "false");
    drillFocus = document.activeElement;
    icons();
    setTimeout(() => $("#drillBack").focus(), 300);
  }
  function closeDrill(instant) {
    const drill = $("#drill");
    if (!drill.classList.contains("is-open")) return;
    drill.classList.remove("is-open");
    drill.setAttribute("aria-hidden", "true");
    if (!instant && drillFocus && drillFocus.focus) drillFocus.focus();
  }
  function drillSub(id) {
    return ({
      files: "Exact objects transferred from the corporate Cloud Drive — ranked by size.",
      device: "The endpoint that initiated the transfer — assessed against corporate trust policy.",
      timeline: "Reconstructed sequence of the session, from first auth to detection.",
      baseline: "Tonight's activity measured against Sarah's established 18-month profile.",
    })[id] || "";
  }

  function buildFiles() {
    const s = M.fileSummary;
    const bar = `
      <div class="filebar">
        <span class="filebar__total">${s.total}</span>
        <span class="filebar__label">across ${M.files.length} files</span>
        <span class="filebar__pills">
          <span class="classpill classpill--restricted">${s.restricted} Restricted</span>
          <span class="classpill classpill--confidential">${s.confidential} Confidential</span>
          <span class="classpill classpill--internal">${s.internal} Internal</span>
        </span>
      </div>`;
    const list = M.files.map(f => `
      <div class="fileitem">
        <span class="fileitem__icon ext-${f.type}"><span class="fileitem__ext">${f.type.toUpperCase()}</span></span>
        <div><div class="fileitem__name">${f.name}</div><div class="fileitem__records">${f.records} · <span class="classpill classpill--${f.class}" style="padding:1px 6px">${f.class}</span></div></div>
        <span class="fileitem__size">${f.size}</span>
        <i data-lucide="download" style="color:var(--tx-3)"></i>
      </div>`).join("");
    return bar + `<div class="filelist">${list}</div>`;
  }

  function buildDevice() {
    const d = M.device;
    const cell = (k, v, icon, cls) => `<div class="dcell"><div class="dcell__k"><i data-lucide="${icon}"></i>${k}</div><div class="dcell__v ${cls || ""}">${v}</div></div>`;
    const flags = d.flags.map(f => `<div class="dflag dflag--${f.tone}"><i data-lucide="${f.tone === "critical" ? "shield-x" : "alert-triangle"}"></i>${f.label}</div>`).join("");
    return `
      <div class="device-hero">
        <span class="device-hero__icon"><i data-lucide="monitor-x"></i></span>
        <div><div class="device-hero__name">${d.hostname}</div><div class="device-hero__sub">${d.os} · ${d.browser}</div></div>
        <div class="device-hero__trust"><div class="num">${d.trustScore}</div><div class="lbl">Trust / 100</div></div>
      </div>
      <div class="dgrid">
        ${cell("First seen", d.firstSeen, "clock", "bad")}
        ${cell("MDM managed", "No — unenrolled", "shield-off", "bad")}
        ${cell("EDR / Antivirus", d.edr, "bug", "bad")}
        ${cell("Source IP", d.ip, "globe", "mono")}
        ${cell("ISP", d.isp, "wifi", "")}
        ${cell("Geolocation", d.geo, "map-pin", "")}
        ${cell("Network", d.network, "network", "bad")}
        ${cell("MFA", d.mfa, "key-round", "")}
      </div>
      <div class="dflags">${flags}</div>`;
  }

  function buildTimeline() {
    return `<div class="tl">` + M.timeline.map(t => `
      <div class="tlitem tlitem--${t.tone}">
        <div class="tlitem__node"><i data-lucide="${t.tone === "critical" ? "alert-triangle" : t.tone === "warn" ? "activity" : "log-in"}"></i></div>
        <div><div class="tlitem__time">${t.time}</div><div class="tlitem__title">${t.title}</div><div class="tlitem__detail">${t.detail}</div></div>
      </div>`).join("") + `</div>`;
  }

  function buildBaseline() {
    return `<div class="bl">` + M.baseline.map(b => `
      <div class="blrow">
        <div class="blrow__label">${b.label}</div>
        <div class="blrow__cmp">
          <div class="blcol blcol--normal"><div class="blcol__tag">Normal (18-mo)</div><div class="blcol__val">${b.normal}</div></div>
          <div class="blarrow"><i data-lucide="move-right"></i></div>
          <div class="blcol blcol--tonight"><div class="blcol__tag">Tonight</div><div class="blcol__val">${b.tonight}</div></div>
        </div>
      </div>`).join("") + `</div>`;
  }

  /* ---------------- Confirmation modal (guardrail) ----------------------- */
  let pendingAction = null;
  function openConfirm(a) {
    pendingAction = a;
    const c = a.confirm;
    $("#modalHeading").textContent = c.heading;
    $("#modalBody").textContent = c.body;
    $("#modalImpacts").innerHTML = c.impacts.map(i => `<li>${i}</li>`).join("");
    $("#modalNote").innerHTML = `<i data-lucide="undo-2"></i>${c.reversibleNote}`;
    const btn = $("#modalConfirm");
    btn.textContent = c.confirmLabel;
    const highImpact = a.impact === "high";
    btn.className = "btn " + (highImpact ? "btn--danger" : "btn--warn");
    $("#modalIcon").className = "modal__icon " + (highImpact ? "" : "warn");
    $("#modalIcon").innerHTML = `<i data-lucide="${highImpact ? "alert-octagon" : "alert-triangle"}"></i>`;
    $("#modalAck").checked = false;
    btn.disabled = true;

    const wrap = $("#modalWrap");
    wrap.hidden = false;
    requestAnimationFrame(() => wrap.classList.add("is-open"));
    icons();
    setTimeout(() => $("#modalAck").focus(), 120);
  }
  function closeConfirm() {
    const wrap = $("#modalWrap");
    wrap.classList.remove("is-open");
    setTimeout(() => { wrap.hidden = true; }, 240);
    pendingAction = null;
  }
  function confirmAction() {
    const a = pendingAction;
    if (!a) return;
    closeConfirm();
    executeAction(a);
  }

  function executeAction(a) {
    if (!state.completed.includes(a.id)) state.completed.push(a.id);
    state.audit.unshift({
      tone: "ok",
      text: `<b>${a.title}</b> executed`,
      by: `${M.soc.analyst.name} · via AI recommendation (${a.confidence}% confidence)`,
      time: nowClock(),
    });
    updateStatusFromActions();
    save();
    renderStateDrivenBits();
    toast("success", a.title, a.successToast);
    icons();
  }

  function updateStatusFromActions() {
    const c = state.completed;
    const contained = c.some(id => ["suspend", "block-device", "revoke-sessions", "quarantine-files", "escalate"].includes(id));
    if (c.includes("suspend") && c.includes("block-device")) {
      if (state.status !== "resolved") {
        state.status = "resolved";
        state.audit.unshift({ tone: "ok", text: "Threat <b>contained &amp; resolved</b> — account suspended and device blocked", by: "Akamai AI Behavioral Engine", time: nowClock() });
      }
    } else if (contained) {
      state.status = "contained";
    }
  }

  function renderStateDrivenBits() {
    renderActions();
    renderAudit();
    renderStatusPill();
    icons();
  }

  function renderStatusPill() {
    const pill = $("#panelStatus");
    const map = {
      open: { i: "loader", t: "Open" },
      contained: { i: "shield-check", t: "Contained" },
      resolved: { i: "check-circle-2", t: "Resolved" },
    };
    const s = map[state.status] || map.open;
    pill.dataset.status = state.status;
    pill.innerHTML = `<i data-lucide="${s.i}"></i><span>${s.t}</span>`;
  }

  function renderAudit() {
    const host = $("#audit");
    const resetBtn = $("#resetBtn");
    if (!state.audit.length) {
      host.innerHTML = `<div class="audit__empty"><i data-lucide="history"></i>No response actions taken yet. AI recommendations above are one click away — each is confirmed &amp; reversible.</div>`;
      resetBtn.hidden = true;
      return;
    }
    resetBtn.hidden = false;
    host.innerHTML = state.audit.map(a => `
      <div class="audit__item">
        <span class="audit__dot ${a.tone === "info" ? "audit__dot--info" : ""}"><i data-lucide="${a.tone === "info" ? "info" : "check"}"></i></span>
        <div><div class="audit__txt">${a.text}</div><div class="audit__by">${a.by}</div></div>
        <span class="audit__time">${a.time}</span>
      </div>`).join("");
  }

  /* ---------------- Ask the AI ------------------------------------------- */
  function renderAskSuggest() {
    $("#askSuggest").innerHTML = M.askAI.suggestions.map(s => `<button class="ask__chip" data-q="${s}">${s}</button>`).join("");
    $$("#askSuggest .ask__chip").forEach(c => c.addEventListener("click", () => askQuestion(c.dataset.q)));
  }

  function askQuestion(q) {
    q = (q || "").trim();
    if (!q) return;
    const thread = $("#askThread");
    thread.insertAdjacentHTML("beforeend", `
      <div class="ask__msg ask__msg--user"><span class="ask__ava ask__ava--user">${M.soc.analyst.initials}</span><div class="ask__bubble">${escapeHtml(q)}</div></div>`);
    const typing = document.createElement("div");
    typing.className = "ask__msg ask__msg--ai";
    typing.innerHTML = `<span class="ask__ava ask__ava--ai"><i data-lucide="sparkles"></i></span><div class="ask__bubble"><span class="orbits" style="display:inline-flex;gap:4px"><span style="width:6px;height:6px;border-radius:50%;background:var(--cyan);display:inline-block"></span><span style="width:6px;height:6px;border-radius:50%;background:var(--cyan);display:inline-block"></span><span style="width:6px;height:6px;border-radius:50%;background:var(--cyan);display:inline-block"></span></span></div>`;
    thread.appendChild(typing);
    icons();
    scrollAsk();

    const key = q.toLowerCase().replace(/\s+/g, " ").trim();
    const ans = M.askAI.answers[key] || M.askAI.answers._default;
    setTimeout(() => {
      typing.querySelector(".ask__bubble").textContent = ans;
      scrollAsk();
    }, prefersReduced ? 0 : 750);
  }
  function scrollAsk() {
    const sc = $("#panelScroll");
    setTimeout(() => { $("#askForm").scrollIntoView({ behavior: prefersReduced ? "auto" : "smooth", block: "nearest" }); }, 30);
  }

  /* ---------------- Toasts ----------------------------------------------- */
  function toast(kind, title, msg) {
    const host = $("#toasts");
    const el = document.createElement("div");
    el.className = `toast toast--${kind}`;
    el.innerHTML = `
      <span class="toast__icon"><i data-lucide="${kind === "success" ? "check-circle-2" : "info"}"></i></span>
      <div class="toast__body"><div class="toast__title">${title}</div><div class="toast__msg">${msg}</div></div>
      <button class="toast__x" aria-label="Dismiss"><i data-lucide="x"></i></button>`;
    host.appendChild(el);
    icons();
    const kill = () => { el.classList.add("is-out"); setTimeout(() => el.remove(), 350); };
    el.querySelector(".toast__x").addEventListener("click", kill);
    setTimeout(kill, 5200);
  }

  function escapeHtml(s) { const d = document.createElement("div"); d.textContent = s; return d.innerHTML; }

  /* ---------------- Panel-scoped event wiring ---------------------------- */
  function wirePanelEvents() {
    $("#btnClose").addEventListener("click", closePanel);
    $("#backdrop").addEventListener("click", () => { if (!$("#btnPin").classList.contains("is-active")) closePanel(); });
    $("#btnPin").addEventListener("click", () => {
      const b = $("#btnPin");
      b.classList.toggle("is-active");
      toast("info", b.classList.contains("is-active") ? "Panel pinned" : "Panel unpinned",
        b.classList.contains("is-active") ? "Backdrop clicks won't dismiss the investigation." : "Click outside to dismiss.");
    });

    $("#drillBack").addEventListener("click", () => closeDrill());

    // factor "show details" toggles all
    $("#toggleFactorDetail").addEventListener("click", () => {
      const btn = $("#toggleFactorDetail");
      const anyClosed = $$("#riskFactors .factor").some(f => !f.classList.contains("is-open"));
      $$("#riskFactors .factor").forEach(f => toggleFactor(f, anyClosed));
      btn.innerHTML = anyClosed ? '<i data-lucide="list-collapse"></i><span>Hide details</span>' : '<i data-lucide="list-tree"></i><span>Show details</span>';
      icons();
    });

    // modal
    $("#modalCancel").addEventListener("click", closeConfirm);
    $("#modalConfirm").addEventListener("click", confirmAction);
    $("#modalAck").addEventListener("change", e => { $("#modalConfirm").disabled = !e.target.checked; });
    $("#modalWrap").addEventListener("click", e => { if (e.target === $("#modalWrap")) closeConfirm(); });

    // ask
    $("#askForm").addEventListener("submit", e => {
      e.preventDefault();
      const inp = $("#askInput");
      askQuestion(inp.value);
      inp.value = "";
    });

    // reset
    $("#resetBtn").addEventListener("click", () => {
      resetState();
      $("#btnPin").classList.remove("is-active");
      renderStateDrivenBits();
      icons();
      toast("info", "Demo reset", "Investigation state cleared. All AI actions are available again.");
    });
  }

  /* ---------------- View navigation -------------------------------------- */
  function switchView(name) {
    $$(".navtab").forEach(t => {
      const on = t.dataset.view === name;
      t.classList.toggle("is-active", on);
      t.setAttribute("aria-selected", String(on));
    });
    $$(".view").forEach(v => {
      const on = v.dataset.view === name;
      v.classList.toggle("is-active", on);
      v.hidden = !on;
    });
    if (name === "case" && !document.body.classList.contains("panel-open")) {
      // ensure panel isn't lingering
    }
    if (name !== "demo") closePanel();
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  /* ---------------- Case study ------------------------------------------- */
  function renderCase() {
    $("#caseRoot").innerHTML = caseHTML();
    $$("#caseRoot [data-goto]").forEach(b => b.addEventListener("click", () => {
      switchView("demo");
      if (b.dataset.goto === "panel") setTimeout(openPanel, 260);
    }));
    icons();
  }

  function caseHTML() {
    return `
    <section class="case-hero">
      <span class="case-hero__eyebrow"><i data-lucide="sparkles"></i>Product Design Home Assignment · Akamai</span>
      <h1>Investigating a threat in 5 seconds,<br>then acting with confidence.</h1>
      <p>A deep-dive <strong>Entity Investigation Side-Panel</strong> for the Akamai AI Behavioral Engine — designed for Daniel, a SOC analyst triaging a 95/100 “Suspicious Data Download” alert.</p>
      <div class="case-hero__meta">
        <span><i data-lucide="target" style="vertical-align:-2px"></i> Scope: one slide-out panel, one full flow</span>
        <span><i data-lucide="user" style="vertical-align:-2px"></i> Persona: SOC Analyst, Tier 2</span>
        <span><i data-lucide="git-branch" style="vertical-align:-2px"></i> Interactive, high-fidelity prototype</span>
      </div>
      <div class="case-hero__cta">
        <button class="btn-cta" data-goto="panel"><i data-lucide="radar"></i>Launch the live panel</button>
      </div>
    </section>

    <div class="case">
      <!-- 01 Challenge -->
      <section class="case-sec">
        <div class="case-sec__num">01 / THE BRIEF</div>
        <h2 class="case-sec__title">The challenge</h2>
        <p class="case-sec__intro">The AI Behavioral Engine flags a high-severity incident. My job: design the panel that lets Daniel understand it in seconds and resolve it safely — without designing the whole dashboard. Four UX problems had to be solved in one screen.</p>
        <div class="cgrid cgrid--2">
          <div class="ccard"><span class="ccard__tag">The incident</span>
            <p><strong>Sarah Chen</strong> (Finance) downloaded <strong>50 GB</strong> of sensitive customer files from the corporate Cloud Drive at <strong>2:03 AM</strong>, using an <strong>unrecognized device</strong>. The engine scored it <strong>95/100</strong>.</p>
          </div>
          <div class="ccard"><span class="ccard__tag">The four problems</span>
            <div class="solve-chips">
              <span class="solve-chip"><i data-lucide="layout-list"></i>Information hierarchy &amp; AI summary</span>
              <span class="solve-chip"><i data-lucide="scan-search"></i>Explainable AI &amp; trust</span>
              <span class="solve-chip"><i data-lucide="zap"></i>Recommended actions &amp; guardrails</span>
              <span class="solve-chip"><i data-lucide="git-branch"></i>Drill-down pivots</span>
            </div>
          </div>
        </div>
      </section>

      <!-- 02 Persona -->
      <section class="case-sec">
        <div class="case-sec__num">02 / THE USER</div>
        <h2 class="case-sec__title">Meet Daniel</h2>
        <div class="persona">
          <div class="persona__card">
            <span class="avatar avatar--lg persona__ava">DM</span>
            <div class="persona__name">Daniel Meyer</div>
            <div class="persona__role">SOC Analyst · Tier 2</div>
            <p class="persona__quote">“I look at hundreds of alerts. I need to know in seconds if this is real — and if the AI is right — before I touch someone's account.”</p>
          </div>
          <div class="persona__cols">
            <div class="ccard" style="padding:20px">
              <span class="ccard__tag" style="color:var(--green)">Goals</span>
              <ul class="plist">
                <li><i data-lucide="gauge"></i>Triage an alert in ~5 seconds and move on.</li>
                <li><i data-lucide="brain"></i>Understand context without pivoting to 5 tools.</li>
                <li><i data-lucide="shield-check"></i>Act decisively — contain real threats fast.</li>
              </ul>
            </div>
            <div class="ccard" style="padding:20px">
              <span class="ccard__tag" style="color:var(--orange)">Pains &amp; fears</span>
              <ul class="plist bad">
                <li><i data-lucide="ghost"></i>Wasting time on false positives.</li>
                <li><i data-lucide="box"></i>“Black-box” AI he can't verify or trust.</li>
                <li><i data-lucide="alert-triangle"></i>Suspending the wrong person by mistake.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <!-- 03 Research -->
      <section class="case-sec">
        <div class="case-sec__num">03 / RESEARCH &amp; INSIGHTS</div>
        <h2 class="case-sec__title">What shaped the design</h2>
        <p class="case-sec__intro">I studied how SOC analysts triage, why they distrust automation, and where alert-fatigue creeps in. Four insights became the backbone of every decision.</p>
        <div class="cgrid cgrid--3">
          <div class="ccard"><div class="ccard__icon"><i data-lucide="eye"></i></div><h3>Scan, don't read</h3><p>Analysts scan top-to-bottom in an F-pattern. The verdict (who, what, how bad) must land before any detail — so the summary and risk score sit at the very top.</p></div>
          <div class="ccard"><div class="ccard__icon p"><i data-lucide="box"></i></div><h3>Trust needs evidence</h3><p>Analysts reject AI that just asserts a score. Showing <em>how</em> the 95 was calculated — signal by signal, vs. a baseline — turns a black box into a glass box.</p></div>
          <div class="ccard"><div class="ccard__icon g"><i data-lucide="undo-2"></i></div><h3>Fast but reversible</h3><p>Speed matters, but a wrong “Suspend” hurts real people. Every action is one click, gated by a confirm, and clearly reversible — confidence without recklessness.</p></div>
          <div class="ccard"><div class="ccard__icon a"><i data-lucide="layers"></i></div><h3>Context is fragile</h3><p>Opening files or device info in a new tab loses the thread. Pivots must happen <em>inside</em> the panel, one Back button away from the parent investigation.</p></div>
          <div class="insight-stat"><div class="insight-stat__num">5s</div><div class="insight-stat__txt">Target time-to-understand — the summary + gauge + key facts deliver the verdict at a glance.</div></div>
          <div class="insight-stat"><div class="insight-stat__num">1 panel</div><div class="insight-stat__txt">Zero context-switching — summary, evidence, actions &amp; drill-downs all live in one surface.</div></div>
        </div>
      </section>

      <!-- 04 Principles -->
      <section class="case-sec">
        <div class="case-sec__num">04 / PRINCIPLES</div>
        <h2 class="case-sec__title">Four design principles</h2>
        <div class="principles">
          <div class="principle"><span class="principle__no">01</span><div><h4>Verdict first, detail on demand</h4><p>The 5-second answer is always above the fold; everything else progressively discloses.</p></div></div>
          <div class="principle"><span class="principle__no">02</span><div><h4>Glass-box, not black-box</h4><p>Every AI claim is backed by visible evidence, a confidence score, and a baseline comparison.</p></div></div>
          <div class="principle"><span class="principle__no">03</span><div><h4>Powerful, with guardrails</h4><p>Destructive actions are one click — but never one <em>accidental</em> click. Confirm, acknowledge, reverse.</p></div></div>
          <div class="principle"><span class="principle__no">04</span><div><h4>Never lose the thread</h4><p>Pivots layer over the panel; the parent investigation is always one Back button away.</p></div></div>
        </div>
      </section>

      <!-- 05 Wireframes -->
      <section class="case-sec">
        <div class="case-sec__num">05 / EXPLORATION</div>
        <h2 class="case-sec__title">From wireframes to a decision</h2>
        <p class="case-sec__intro">I explored three containers for the investigation. The side-panel won because it keeps the analyst anchored to the queue while giving room for depth.</p>
        <div class="cgrid cgrid--3">
          <div class="wire">
            <div class="wire__label">Option A · Center modal <span class="wire__badge wire__badge--rejected">Rejected</span></div>
            <div class="wire__canvas">
              <div class="wbox" style="left:8%;top:10%;width:84%;height:12%;opacity:.4"></div>
              <div class="wbox solid" style="left:22%;top:30%;width:56%;height:52%"></div>
            </div>
            <p class="wire__note"><b>Why not:</b> fully blocks the queue &amp; feels like an interruption. Too small for the evidence + actions + pivots this incident needs.</p>
          </div>
          <div class="wire">
            <div class="wire__label">Option B · Full page <span class="wire__badge wire__badge--rejected">Rejected</span></div>
            <div class="wire__canvas">
              <div class="wbox solid" style="left:6%;top:8%;width:88%;height:84%"></div>
              <div class="wbox line" style="left:12%;top:20%;width:70%"></div>
              <div class="wbox line" style="left:12%;top:34%;width:60%"></div>
            </div>
            <p class="wire__note"><b>Why not:</b> a full navigation destroys queue context. Returning means re-orienting — expensive when triaging dozens of alerts.</p>
          </div>
          <div class="wire">
            <div class="wire__label">Option C · Side-panel <span class="wire__badge wire__badge--chosen">Chosen</span></div>
            <div class="wire__canvas">
              <div class="wbox" style="left:4%;top:10%;width:44%;height:14%;opacity:.35"></div>
              <div class="wbox" style="left:4%;top:28%;width:44%;height:14%;opacity:.35"></div>
              <div class="wbox solid" style="left:52%;top:6%;width:44%;height:88%"></div>
            </div>
            <p class="wire__note"><b>Why it wins:</b> the dimmed queue stays visible for context, the panel gives vertical room for depth, and drill-downs can slide within it.</p>
          </div>
        </div>
      </section>

      <!-- 06 Solutions -->
      <section class="case-sec">
        <div class="case-sec__num">06 / THE SOLUTIONS</div>
        <h2 class="case-sec__title">Solving the four challenges</h2>

        <div class="challenge">
          <div class="challenge__no">1</div>
          <div class="challenge__solve">
            <span class="challenge__q">Information hierarchy &amp; AI summary</span>
            <h3>The verdict lands before the details</h3>
            <p>The header answers <strong>who / what / how bad</strong> instantly — entity identity, a radial <strong>95/100</strong> risk gauge, and the alert title. Directly below, a streaming <strong>AI summary</strong> narrates the incident in plain language with a confidence score, followed by five scannable <strong>key-fact chips</strong> (50 GB · 2:03 AM · 11 files · Unrecognized · Customer PII).</p>
            <div class="solve-chips"><span class="solve-chip"><i data-lucide="gauge"></i>Radial risk gauge</span><span class="solve-chip"><i data-lucide="sparkles"></i>Streamed AI summary</span><span class="solve-chip"><i data-lucide="badge-check"></i>Confidence score</span></div>
          </div>
        </div>

        <div class="challenge">
          <div class="challenge__no">2</div>
          <div class="challenge__solve">
            <span class="challenge__q">Explainable AI &amp; trust</span>
            <h3>The score is a glass box</h3>
            <p>“Why the AI flagged this” breaks the 95 into <strong>five weighted signals</strong> (Volume +32, Off-hours +24, Device +21, Sensitivity +13, Location +5). Each expands to reveal an <strong>observed-vs-baseline</strong> bar comparison and a plain-language rationale — so Daniel can audit the AI's reasoning, not just accept it.</p>
            <div class="solve-chips"><span class="solve-chip"><i data-lucide="scan-search"></i>Weighted signal breakdown</span><span class="solve-chip"><i data-lucide="bar-chart-3"></i>Baseline deviation bars</span><span class="solve-chip"><i data-lucide="calculator"></i>Transparent math → 95</span></div>
          </div>
        </div>

        <div class="challenge">
          <div class="challenge__no">3</div>
          <div class="challenge__solve">
            <span class="challenge__q">AI recommendations &amp; actions</span>
            <h3>One click — but never by accident</h3>
            <p>AI-ranked actions (<strong>Suspend User</strong>, <strong>Block Device</strong>, Revoke Sessions…) sit inline with impact labels and confidence. Each opens a <strong>confirmation guardrail</strong>: a plain summary of consequences, an “I understand the impact” checkbox, and a reversibility note. Completed actions log to an <strong>audit trail</strong> and move the incident from Open → Contained → Resolved.</p>
            <div class="solve-chips"><span class="solve-chip"><i data-lucide="user-check"></i>Human-in-the-loop</span><span class="solve-chip"><i data-lucide="shield-alert"></i>Impact confirmation</span><span class="solve-chip"><i data-lucide="scroll-text"></i>Audit trail</span></div>
          </div>
        </div>

        <div class="challenge">
          <div class="challenge__no">4</div>
          <div class="challenge__solve">
            <span class="challenge__q">Drill-down navigation (pivot)</span>
            <h3>Go deep without leaving</h3>
            <p>Pivots into the <strong>11 downloaded files</strong>, the <strong>unrecognized device</strong>, the <strong>event timeline</strong>, or the <strong>user baseline</strong> slide in as a layer <em>over</em> the panel. A single <strong>“Back to investigation”</strong> button and breadcrumb return Daniel to exactly where he was — context preserved.</p>
            <div class="solve-chips"><span class="solve-chip"><i data-lucide="git-branch"></i>In-panel drill-down layer</span><span class="solve-chip"><i data-lucide="arrow-left"></i>One-tap return</span><span class="solve-chip"><i data-lucide="layers"></i>Zero context loss</span></div>
          </div>
        </div>
      </section>

      <!-- 07 AI in workflow -->
      <section class="case-sec">
        <div class="case-sec__num">07 / AI IN MY WORKFLOW</div>
        <h2 class="case-sec__title">How AI helped me build this</h2>
        <p class="case-sec__intro">Per the brief, I leaned on AI throughout — and it's fitting that a tool for an AI product was itself co-designed with AI.</p>
        <div class="cgrid cgrid--2">
          <div class="tool"><span class="tool__icon"><i data-lucide="search"></i></span><div><span class="role">Research &amp; framing</span><h4>LLM (ChatGPT / Claude)</h4><p>Summarised SOC analyst workflows, MITRE ATT&amp;CK exfiltration tactics (T1567), and common “explainable AI” patterns to ground the persona and structure.</p></div></div>
          <div class="tool"><span class="tool__icon"><i data-lucide="pen-line"></i></span><div><span class="role">Copywriting</span><h4>LLM for microcopy</h4><p>Drafted and tightened the AI summary, action rationales, and confirmation copy so it reads like a real security product — concise, confident, non-alarmist.</p></div></div>
          <div class="tool"><span class="tool__icon"><i data-lucide="database"></i></span><div><span class="role">Mock data</span><h4>Synthetic incident data</h4><p>Generated realistic file names, device fingerprints, timeline events and baseline stats — with volumes that add up to exactly 50 GB across 11 files.</p></div></div>
          <div class="tool"><span class="tool__icon"><i data-lucide="code-2"></i></span><div><span class="role">Build</span><h4>AI pair-programming</h4><p>Accelerated the front-end implementation (streaming animation, gauge, drill-downs) so I could spend the time on design decisions, not boilerplate.</p></div></div>
        </div>
      </section>

      <!-- 08 Design system -->
      <section class="case-sec">
        <div class="case-sec__num">08 / DESIGN SYSTEM</div>
        <h2 class="case-sec__title">A cyber-native visual language</h2>
        <p class="case-sec__intro">A high-contrast dark theme (the SOC standard for low-light rooms), a monospace accent for machine data, and a severity-driven colour scale that maps risk to hue.</p>
        <div class="cgrid cgrid--2">
          <div class="ccard">
            <span class="ccard__tag">Colour &amp; severity scale</span>
            <div class="swatches">
              <div class="sw"><div class="sw__chip" style="background:linear-gradient(135deg,var(--cyan),var(--blue))"></div><div class="sw__name">AI / Accent</div><div class="sw__hex">#22d3ee</div></div>
              <div class="sw"><div class="sw__chip" style="background:var(--crit)"></div><div class="sw__name">Critical</div><div class="sw__hex">#ff3b57</div></div>
              <div class="sw"><div class="sw__chip" style="background:var(--orange)"></div><div class="sw__name">High</div><div class="sw__hex">#ff7a45</div></div>
              <div class="sw"><div class="sw__chip" style="background:var(--amber)"></div><div class="sw__name">Medium</div><div class="sw__hex">#f5a623</div></div>
              <div class="sw"><div class="sw__chip" style="background:var(--green)"></div><div class="sw__name">Safe / Done</div><div class="sw__hex">#16d98a</div></div>
              <div class="sw"><div class="sw__chip" style="background:var(--bg-surface)"></div><div class="sw__name">Surface</div><div class="sw__hex">#0d1120</div></div>
            </div>
          </div>
          <div class="ccard">
            <span class="ccard__tag">Typography</span>
            <div class="typescale">
              <div><span class="t-lbl">Inter · 800</span><span style="font-size:24px;font-weight:800;letter-spacing:-.5px">Investigate fast</span></div>
              <div><span class="t-lbl">Inter · 600</span><span style="font-size:16px;font-weight:600">Section &amp; card titles</span></div>
              <div><span class="t-lbl">Inter · 400</span><span style="font-size:13.5px;color:var(--tx-2)">Body &amp; summary copy</span></div>
              <div><span class="t-lbl">JetBrains Mono</span><span style="font-family:var(--ff-mono);font-size:14px">95/100 · ALT-2026-0714</span></div>
            </div>
            <p style="margin-top:16px;color:var(--tx-3);font-size:12.5px">Monospace is reserved for machine-generated data — scores, IDs, IPs, timestamps — reinforcing the “this came from the engine” signal.</p>
          </div>
        </div>
      </section>

      <div class="bigcta">
        <h2>See it in action</h2>
        <p>The prototype is fully interactive: open the panel, expand the AI's reasoning, pivot into the evidence, and run a guarded response action end-to-end.</p>
        <button class="btn-cta" data-goto="panel"><i data-lucide="radar"></i>Open the live investigation</button>
      </div>

      <div class="case-foot">
        Designed &amp; built as a home assignment for <strong>Akamai</strong> · Product Design.<br>
        Runs 100% client-side — no backend, no build step.
      </div>
    </div>`;
  }

  /* ---------------- Global wiring & init --------------------------------- */
  function init() {
    renderSOC();
    renderCase();

    $$(".navtab").forEach(t => t.addEventListener("click", () => switchView(t.dataset.view)));

    document.addEventListener("keydown", e => {
      if (e.key !== "Escape") return;
      if (!$("#modalWrap").hidden) { closeConfirm(); return; }
      if ($("#drill").classList.contains("is-open")) { closeDrill(); return; }
      if (!$("#panel").hidden && $("#panel").classList.contains("is-open")) closePanel();
    });

    icons();

    // Auto-open the deliverable shortly after load so offline reviewers see it,
    // while still glimpsing the queue it slides over.
    setTimeout(() => {
      if ($("#view-demo").classList.contains("is-active") && !document.body.classList.contains("panel-open")) openPanel();
    }, prefersReduced ? 200 : 850);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
