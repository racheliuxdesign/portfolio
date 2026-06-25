/* =============================================================================
   APIdrift — mock dataset + scoring engine
   Domain: e-commerce "ShopFront Commerce API". One OpenAPI spec compared against
   the last 7 days of production traffic. Endpoints grouped by area.
   All times are computed relative to a FIXED "now" so the demo is deterministic.
   ============================================================================= */
(function () {
  "use strict";

  // Deterministic clock for the prototype (matches a "comparison run" timestamp).
  const NOW = new Date("2026-06-25T05:00:00Z");
  const HOUR = 36e5, DAY = 24 * HOUR;
  const ago = (ms) => new Date(NOW.getTime() - ms).toISOString();

  /* ---- Area metadata: sensitivity drives the priority model -------------- */
  const AREAS = {
    Payments: { sensitivity: 1.0, blurb: "Money movement, refunds, card data (PAN)." },
    Users:    { sensitivity: 0.9, blurb: "Accounts, auth, PII, sessions." },
    Orders:   { sensitivity: 0.6, blurb: "Carts, checkout, fulfilment." },
    Catalog:  { sensitivity: 0.35, blurb: "Products, search, inventory (mostly public)." }
  };

  const TYPES = {
    shadow_api:        { label: "Shadow API",            short: "Shadow",     w: 30, glyph: "▲",
      desc: "Endpoint seen in traffic but missing from the spec." },
    undocumented_param:{ label: "Undocumented parameter", short: "Undoc param", w: 20, glyph: "◆",
      desc: "Parameter seen in traffic but missing from the spec." },
    param_mismatch:    { label: "Parameter mismatch",    short: "Mismatch",   w: 16, glyph: "≠",
      desc: "Parameter type / enum / requirement disagrees with the spec." },
    zombie_endpoint:   { label: "Zombie endpoint",       short: "Zombie",     w: 8, glyph: "○",
      desc: "Endpoint in the spec but not seen in any traffic." },
    unused_param:      { label: "Unused parameter",      short: "Unused param", w: 6, glyph: "·",
      desc: "Parameter listed in the spec but never seen in traffic." }
  };

  const ACTIONS = {
    investigate: { label: "Investigate", tone: "crit",
      hint: "Possible exposure or abuse — security should look now." },
    developer:   { label: "Developer follow-up", tone: "warn",
      hint: "Route to the owning team to confirm intent / fix drift." },
    spec_update: { label: "Update spec", tone: "info",
      hint: "Behaviour looks legitimate — bring the spec back in sync." },
    no_action:   { label: "No action needed", tone: "muted",
      hint: "Low-risk noise — acknowledge and move on." }
  };

  /* ---- Helper to build believable traffic sparkline (7 daily buckets) ---- */
  function spark(total, shape) {
    // shape: 'rising' | 'spike' | 'flat' | 'falling' | 'zero'
    if (total === 0 || shape === "zero") return [0, 0, 0, 0, 0, 0, 0];
    const base = {
      rising:  [0.06, 0.08, 0.10, 0.14, 0.16, 0.20, 0.26],
      spike:   [0.05, 0.05, 0.06, 0.07, 0.08, 0.24, 0.45],
      flat:    [0.15, 0.14, 0.15, 0.13, 0.14, 0.15, 0.14],
      falling: [0.26, 0.21, 0.16, 0.13, 0.10, 0.08, 0.06]
    }[shape] || [0.14, 0.14, 0.14, 0.14, 0.14, 0.15, 0.15];
    return base.map((f) => Math.round(total * f));
  }

  /* =========================================================================
     ISSUES — curated raw signals. Score/severity are COMPUTED below so the
     prioritisation is transparent and explainable in the Approach view.
     ========================================================================= */
  const ISSUES = [
    /* ---------------------------- PAYMENTS -------------------------------- */
    {
      id: "DRF-4012", type: "shadow_api", method: "POST", path: "/payments/{id}/refund-raw",
      area: "Payments", requests7d: 4211, trend: "spike",
      firstSeen: ago(2.2 * DAY), lastSeen: ago(2 * HOUR),
      authObserved: "none", authExpected: "oauth", sensitiveData: ["PAN", "PII"],
      status: "new", assignee: null, action: "investigate",
      summary: "Undocumented refund endpoint issues refunds with no auth on 38% of calls and echoes full card numbers.",
      detail: {
        observedParams: [
          { name: "id", in: "path", type: "string" },
          { name: "amount", in: "body", type: "number", sample: "1499.00" },
          { name: "reason", in: "body", type: "string", sample: "\"chargeback\"" }
        ],
        note: "No matching path in spec. Calls originate from 3 internal IPs + 1 unknown ASN."
      },
      samples: [
        { ts: ago(2 * HOUR), ip: "10.4.7.21", auth: "none", status: 200, line: 'POST /payments/8841/refund-raw {"amount":1499.00,"reason":"chargeback"}' },
        { ts: ago(9 * HOUR), ip: "45.61.x.x", auth: "none", status: 200, line: 'POST /payments/9120/refund-raw {"amount":899.00}' },
        { ts: ago(1.4 * DAY), ip: "10.4.7.21", auth: "oauth", status: 200, line: 'POST /payments/7702/refund-raw {"amount":250.00}' }
      ]
    },
    {
      id: "EXP-3318", type: "shadow_api", method: "GET", path: "/payments/export",
      area: "Payments", requests7d: 884, trend: "rising",
      firstSeen: ago(5.1 * DAY), lastSeen: ago(7 * HOUR),
      authObserved: "oauth", authExpected: "oauth", sensitiveData: ["PAN", "PII"],
      status: "new", assignee: null, action: "investigate",
      summary: "Bulk payment export not in spec. Returns up to 5k transactions incl. masked PAN per call.",
      detail: {
        observedParams: [
          { name: "from", in: "query", type: "date", sample: "2026-06-01" },
          { name: "to", in: "query", type: "date", sample: "2026-06-24" },
          { name: "format", in: "query", type: "string", sample: "\"csv\"" }
        ],
        note: "Large response bodies (avg 2.3 MB). Candidate for data-exfiltration monitoring."
      }
    },
    {
      id: "MSM-2207", type: "param_mismatch", method: "POST", path: "/payments",
      area: "Payments", requests7d: 51230, trend: "flat",
      firstSeen: ago(180 * DAY), lastSeen: ago(40 * 60 * 1000),
      authObserved: "oauth", authExpected: "oauth", sensitiveData: [],
      status: "open", assignee: "M. Okafor", action: "investigate",
      summary: "‘amount’ defined as integer minor-units but 12% of traffic sends decimal strings ('19.99').",
      detail: {
        paramName: "amount", in: "body",
        specType: "integer (minor units, e.g. 1999)", specRequired: true,
        observedType: "string / decimal", observedValues: ["\"19.99\"", "\"1499.00\"", "2000"],
        note: "Mixed types risk rounding/parsing bugs and could enable amount manipulation."
      }
    },
    {
      id: "CAP-2231", type: "undocumented_param", method: "POST", path: "/payments/{id}/capture",
      area: "Payments", requests7d: 1820, trend: "rising",
      firstSeen: ago(3.4 * DAY), lastSeen: ago(5 * HOUR),
      authObserved: "oauth", authExpected: "oauth", sensitiveData: ["PAN"],
      status: "new", assignee: null, action: "investigate",
      summary: "‘force=true’ parameter (not in spec) bypasses the pre-auth check on capture.",
      detail: {
        paramName: "force", in: "query", observedType: "boolean", observedValues: ["true", "false"],
        note: "‘force’ appears only from 2 service accounts. Override semantics — confirm authorisation."
      }
    },
    {
      id: "MSM-2240", type: "param_mismatch", method: "GET", path: "/payments/{id}",
      area: "Payments", requests7d: 9900, trend: "flat",
      firstSeen: ago(120 * DAY), lastSeen: ago(3 * HOUR),
      authObserved: "oauth", authExpected: "oauth", sensitiveData: [],
      status: "open", assignee: null, action: "developer",
      summary: "Path ‘id’ typed integer in spec, but 100% of traffic uses UUID strings.",
      detail: {
        paramName: "id", in: "path",
        specType: "integer (int64)", observedType: "string (uuid)",
        observedValues: ["a3f1-...-9c", "b7e2-...-44"],
        note: "Spec drift — IDs were migrated to UUIDs. Low risk, but spec is misleading."
      }
    },
    {
      id: "ZMB-1180", type: "zombie_endpoint", method: "POST", path: "/payments/{id}/void",
      area: "Payments", requests7d: 0, trend: "zero",
      firstSeen: null, lastSeen: null,
      authObserved: "n/a", authExpected: "oauth", sensitiveData: [],
      status: "open", assignee: null, action: "developer",
      summary: "Documented void endpoint with zero traffic in 7 days — confirm it’s still wired up or deprecate.",
      detail: { note: "Sensitive operation that may be dead code or only used in incident response." }
    },
    {
      id: "UNU-0901", type: "unused_param", method: "GET", path: "/payments",
      area: "Payments", requests7d: 22800, trend: "flat",
      firstSeen: null, lastSeen: null,
      authObserved: "oauth", authExpected: "oauth", sensitiveData: [],
      status: "open", assignee: null, action: "no_action",
      summary: "‘currency’ query param documented but never sent — clients rely on account default.",
      detail: { paramName: "currency", in: "query", specType: "string (ISO-4217)", note: "Harmless documentation gap." }
    },

    /* ----------------------------- USERS --------------------------------- */
    {
      id: "DBG-4410", type: "shadow_api", method: "GET", path: "/internal/users/debug",
      area: "Users", requests7d: 1542, trend: "flat",
      firstSeen: ago(6.6 * DAY), lastSeen: ago(40 * 60 * 1000),
      authObserved: "none", authExpected: null, sensitiveData: ["PII", "credentials"],
      status: "new", assignee: null, action: "investigate",
      summary: "Debug endpoint exposed to production traffic with no auth — dumps user records incl. password hashes.",
      detail: {
        observedParams: [{ name: "email", in: "query", type: "string", sample: "user@acme.com" }],
        note: "Reachable from the public edge. Treat as potential data exposure."
      },
      samples: [
        { ts: ago(40 * 60 * 1000), ip: "203.0.113.9", auth: "none", status: 200, line: "GET /internal/users/debug?email=ceo@shopfront.com" },
        { ts: ago(11 * HOUR), ip: "198.51.100.7", auth: "none", status: 200, line: "GET /internal/users/debug?email=admin@shopfront.com" }
      ]
    },
    {
      id: "LGN-4501", type: "undocumented_param", method: "POST", path: "/auth/login",
      area: "Users", requests7d: 73140, trend: "flat",
      firstSeen: ago(4.0 * DAY), lastSeen: ago(1.1 * HOUR),
      authObserved: "none", authExpected: "none", sensitiveData: ["credentials"],
      status: "new", assignee: null, action: "investigate",
      summary: "‘mfa_bypass’ flag observed on login (not in spec). Set true on a small slice of requests.",
      detail: {
        paramName: "mfa_bypass", in: "body", observedType: "boolean", observedValues: ["true", "false"],
        note: "Security-critical override on the auth path. Confirm origin and intent immediately."
      }
    },
    {
      id: "IMP-4205", type: "shadow_api", method: "POST", path: "/users/{id}/impersonate",
      area: "Users", requests7d: 96, trend: "rising",
      firstSeen: ago(1.7 * DAY), lastSeen: ago(6 * HOUR),
      authObserved: "oauth", authExpected: null, sensitiveData: ["PII"],
      status: "new", assignee: null, action: "investigate",
      summary: "Support impersonation endpoint missing from the spec — grants a session as another user.",
      detail: { note: "Used by 4 support accounts. Privileged action with no spec / audit contract." }
    },
    {
      id: "USR-4120", type: "undocumented_param", method: "GET", path: "/users",
      area: "Users", requests7d: 18420, trend: "flat",
      firstSeen: ago(2.9 * DAY), lastSeen: ago(2.5 * HOUR),
      authObserved: "oauth", authExpected: "oauth", sensitiveData: ["PII", "credentials"],
      status: "new", assignee: null, action: "investigate",
      summary: "‘include=ssn,password_hash’ expands the response with sensitive fields not in the spec.",
      detail: {
        paramName: "include", in: "query", observedType: "csv string",
        observedValues: ["\"ssn\"", "\"password_hash\"", "\"addresses\""],
        note: "Field-expansion param leaks PII/credentials. High-value finding."
      }
    },
    {
      id: "MSM-4330", type: "param_mismatch", method: "GET", path: "/users/{id}",
      area: "Users", requests7d: 41200, trend: "flat",
      firstSeen: ago(150 * DAY), lastSeen: ago(1 * HOUR),
      authObserved: "oauth", authExpected: "oauth", sensitiveData: ["PII"],
      status: "open", assignee: null, action: "developer",
      summary: "‘id’ documented as integer; ~30% of traffic resolves users by email address instead.",
      detail: {
        paramName: "id", in: "path", specType: "integer", observedType: "string (email)",
        observedValues: ["jane@acme.com", "44192"], note: "Dual-lookup behaviour undocumented — possible enumeration surface."
      }
    },
    {
      id: "SES-4150", type: "shadow_api", method: "GET", path: "/users/{id}/sessions",
      area: "Users", requests7d: 241, trend: "flat",
      firstSeen: ago(9 * DAY), lastSeen: ago(8 * HOUR),
      authObserved: "oauth", authExpected: null, sensitiveData: ["PII"],
      status: "open", assignee: "R. Vance", action: "developer",
      summary: "Active-sessions listing not in spec. Returns IP + device per session.",
      detail: { note: "Likely a legitimate account-security feature shipped without spec update." }
    },
    {
      id: "ZMB-4060", type: "zombie_endpoint", method: "DELETE", path: "/users/{id}/gdpr",
      area: "Users", requests7d: 0, trend: "zero",
      firstSeen: null, lastSeen: null,
      authObserved: "n/a", authExpected: "oauth", sensitiveData: [],
      status: "open", assignee: null, action: "developer",
      summary: "GDPR erasure endpoint documented but unused in 7 days — confirm the compliance path still works.",
      detail: { note: "Compliance-relevant. Zero traffic could mean broken automation or low volume." }
    },
    {
      id: "UNU-4002", type: "unused_param", method: "GET", path: "/users",
      area: "Users", requests7d: 18420, trend: "flat",
      firstSeen: null, lastSeen: null,
      authObserved: "oauth", authExpected: "oauth", sensitiveData: [],
      status: "open", assignee: null, action: "no_action",
      summary: "‘sort’ param documented but never used by any client.",
      detail: { paramName: "sort", in: "query", specType: "string enum", note: "Documentation tidy-up only." }
    },

    /* ----------------------------- ORDERS -------------------------------- */
    {
      id: "ADJ-5102", type: "shadow_api", method: "POST", path: "/orders/{id}/admin-adjust",
      area: "Orders", requests7d: 612, trend: "rising",
      firstSeen: ago(3.1 * DAY), lastSeen: ago(4 * HOUR),
      authObserved: "mixed", authExpected: null, sensitiveData: ["PII"],
      status: "new", assignee: null, action: "investigate",
      summary: "Undocumented admin order-adjust endpoint can rewrite totals and line items.",
      detail: { note: "Mixed auth (some calls API-key only). Privileged write with no spec contract." }
    },
    {
      id: "ORD-5210", type: "undocumented_param", method: "GET", path: "/orders",
      area: "Orders", requests7d: 64210, trend: "flat",
      firstSeen: ago(2.0 * DAY), lastSeen: ago(50 * 60 * 1000),
      authObserved: "oauth", authExpected: "oauth", sensitiveData: ["PII"],
      status: "new", assignee: null, action: "investigate",
      summary: "‘admin_override=true’ returns other tenants’ orders — not in spec.",
      detail: {
        paramName: "admin_override", in: "query", observedType: "boolean", observedValues: ["true", "false"],
        note: "Potential broken-object-level-authorization (BOLA) surface."
      }
    },
    {
      id: "MSM-5330", type: "param_mismatch", method: "GET", path: "/orders",
      area: "Orders", requests7d: 64210, trend: "flat",
      firstSeen: ago(60 * DAY), lastSeen: ago(2 * HOUR),
      authObserved: "oauth", authExpected: "oauth", sensitiveData: [],
      status: "open", assignee: null, action: "developer",
      summary: "‘status’ enum in spec is [pending,paid,shipped] but traffic includes ‘refunded’ and ‘deleted’.",
      detail: {
        paramName: "status", in: "query", specType: "enum[pending,paid,shipped]",
        observedType: "enum + extras", observedValues: ["refunded", "deleted", "paid"],
        note: "Spec enum is stale; ‘deleted’ may expose soft-deleted records."
      }
    },
    {
      id: "NOT-5140", type: "shadow_api", method: "GET", path: "/orders/{id}/internal-notes",
      area: "Orders", requests7d: 131, trend: "flat",
      firstSeen: ago(12 * DAY), lastSeen: ago(15 * HOUR),
      authObserved: "oauth", authExpected: null, sensitiveData: ["PII"],
      status: "open", assignee: null, action: "developer",
      summary: "Internal CS notes endpoint not in spec; may contain customer PII in free text.",
      detail: { note: "Likely legitimate internal tool — needs spec + access review." }
    },
    {
      id: "ORD-5260", type: "undocumented_param", method: "POST", path: "/orders",
      area: "Orders", requests7d: 38900, trend: "rising",
      firstSeen: ago(4.4 * DAY), lastSeen: ago(3 * HOUR),
      authObserved: "oauth", authExpected: "oauth", sensitiveData: [],
      status: "new", assignee: null, action: "spec_update",
      summary: "‘discount_code’ accepted on order create but absent from the spec.",
      detail: {
        paramName: "discount_code", in: "body", observedType: "string", observedValues: ["\"SUMMER25\""],
        note: "Looks like a legit promo feature shipped ahead of the spec."
      }
    },
    {
      id: "ZMB-5070", type: "zombie_endpoint", method: "GET", path: "/orders/archive",
      area: "Orders", requests7d: 0, trend: "zero",
      firstSeen: null, lastSeen: null,
      authObserved: "n/a", authExpected: "oauth", sensitiveData: [],
      status: "open", assignee: null, action: "spec_update",
      summary: "Archive listing documented but never called — candidate for deprecation.",
      detail: { note: "No traffic; confirm with owning team then remove from spec." }
    },
    {
      id: "MSM-5350", type: "param_mismatch", method: "GET", path: "/orders/{id}",
      area: "Orders", requests7d: 52100, trend: "flat",
      firstSeen: ago(90 * DAY), lastSeen: ago(90 * 60 * 1000),
      authObserved: "oauth", authExpected: "oauth", sensitiveData: [],
      status: "open", assignee: null, action: "spec_update",
      summary: "‘expand’ documented as array, but clients send a comma-separated string.",
      detail: {
        paramName: "expand", in: "query", specType: "array[string]", observedType: "csv string",
        observedValues: ["\"items,payment\""], note: "Serialization style drift — cosmetic."
      }
    },

    /* ----------------------------- CATALOG ------------------------------- */
    {
      id: "EXP-6110", type: "shadow_api", method: "GET", path: "/catalog/products/bulk-export",
      area: "Catalog", requests7d: 3920, trend: "spike",
      firstSeen: ago(2.6 * DAY), lastSeen: ago(3 * HOUR),
      authObserved: "api_key", authExpected: null, sensitiveData: [],
      status: "new", assignee: null, action: "developer",
      summary: "High-traffic bulk product export not in spec — heavy DB load, possible scraping.",
      detail: { note: "Single API key drives 80% of calls. Public data, but volume + cost concern." }
    },
    {
      id: "PRD-6220", type: "undocumented_param", method: "GET", path: "/products",
      area: "Catalog", requests7d: 128400, trend: "flat",
      firstSeen: ago(5.0 * DAY), lastSeen: ago(20 * 60 * 1000),
      authObserved: "none", authExpected: "none", sensitiveData: [],
      status: "open", assignee: null, action: "developer",
      summary: "‘limit’ accepts values up to 100000 (spec max 100) — enables scraping / resource exhaustion.",
      detail: {
        paramName: "limit", in: "query", specType: "integer (max 100)", observedType: "integer",
        observedValues: ["100000", "50000", "100"], note: "Missing upper-bound enforcement."
      }
    },
    {
      id: "SCH-6320", type: "undocumented_param", method: "GET", path: "/search",
      area: "Catalog", requests7d: 99200, trend: "flat",
      firstSeen: ago(6.2 * DAY), lastSeen: ago(4 * HOUR),
      authObserved: "none", authExpected: "none", sensitiveData: [],
      status: "open", assignee: null, action: "developer",
      summary: "‘debug=1’ on search returns stack traces and internal query plans.",
      detail: {
        paramName: "debug", in: "query", observedType: "integer", observedValues: ["1", "0"],
        note: "Information disclosure — verbose errors should never reach production clients."
      }
    },
    {
      id: "INV-6150", type: "shadow_api", method: "GET", path: "/catalog/inventory/raw",
      area: "Catalog", requests7d: 410, trend: "flat",
      firstSeen: ago(14 * DAY), lastSeen: ago(10 * HOUR),
      authObserved: "api_key", authExpected: null, sensitiveData: [],
      status: "open", assignee: null, action: "developer",
      summary: "Raw inventory feed not in spec; exposes supplier cost fields.",
      detail: { note: "Business-sensitive (margins) though not PII. Confirm intended consumers." }
    },
    {
      id: "MSM-6330", type: "param_mismatch", method: "GET", path: "/products",
      area: "Catalog", requests7d: 128400, trend: "flat",
      firstSeen: ago(70 * DAY), lastSeen: ago(1 * HOUR),
      authObserved: "none", authExpected: "none", sensitiveData: [],
      status: "open", assignee: null, action: "spec_update",
      summary: "‘price_max’ documented as number but clients send currency strings ('$50').",
      detail: {
        paramName: "price_max", in: "query", specType: "number", observedType: "string",
        observedValues: ["\"$50\"", "49.99"], note: "Input coercion drift; tighten validation + spec."
      }
    },
    {
      id: "ZMB-6080", type: "zombie_endpoint", method: "GET", path: "/catalog/legacy-search",
      area: "Catalog", requests7d: 0, trend: "zero",
      firstSeen: null, lastSeen: null,
      authObserved: "n/a", authExpected: "none", sensitiveData: [],
      status: "resolved", assignee: "R. Vance", action: "no_action",
      summary: "Legacy search documented but unused — already slated for removal next release.",
      detail: { note: "Confirmed dead by Catalog team. Spec cleanup queued." }
    },
    {
      id: "UNU-6005", type: "unused_param", method: "GET", path: "/products",
      area: "Catalog", requests7d: 128400, trend: "flat",
      firstSeen: null, lastSeen: null,
      authObserved: "none", authExpected: "none", sensitiveData: [],
      status: "open", assignee: null, action: "no_action",
      summary: "‘lang’ param documented but never sent — localisation handled via header.",
      detail: { paramName: "lang", in: "query", specType: "string", note: "Cosmetic documentation gap." }
    },
    {
      id: "MSM-6350", type: "param_mismatch", method: "GET", path: "/categories",
      area: "Catalog", requests7d: 45100, trend: "flat",
      firstSeen: ago(100 * DAY), lastSeen: ago(2 * HOUR),
      authObserved: "none", authExpected: "none", sensitiveData: [],
      status: "open", assignee: null, action: "spec_update",
      summary: "Category ‘id’ typed integer in spec; clients use slug strings ('home-garden').",
      detail: {
        paramName: "id", in: "path", specType: "integer", observedType: "string (slug)",
        observedValues: ["home-garden", "electronics"], note: "Spec drift, low risk." }
    }
  ];

  /* =========================================================================
     SCORING ENGINE — transparent 0–100 model.
        typeWeight (≤30) + areaSensitivity (≤20) + traffic (≤25)
                          + recency (≤10) + exposure (≤15)
     Traffic & recency only count for "live" issue types (the risk is the
     observed behaviour); zombies/unused params score on absence instead.
     Exposure reflects what the ISSUE exposes (unauth + sensitive data),
     which is a sharper risk signal than the area alone.
     ========================================================================= */
  function scoreBreakdown(i) {
    const typeW = TYPES[i.type].w;
    const areaPts = Math.round(AREAS[i.area].sensitivity * 20);

    const liveType = i.type === "shadow_api" || i.type === "undocumented_param" || i.type === "param_mismatch";
    let trafficPts = 0, recencyPts = 0;
    if (liveType && i.requests7d > 0) {
      const r = (Math.log10(i.requests7d) - 1) / (Math.log10(100000) - 1);
      trafficPts = Math.round(Math.max(0, Math.min(1, r)) * 25);
      const hrs = (NOW - new Date(i.lastSeen)) / HOUR;
      recencyPts = hrs <= 6 ? 10 : hrs <= 24 ? 7 : hrs <= 72 ? 5 : hrs <= 168 ? 2 : 1;
    }

    let expo = 0;
    const sd = i.sensitiveData || [];
    if (sd.includes("PAN") || sd.includes("credentials")) expo += 12;
    else if (sd.includes("PII")) expo += 7;
    if (i.authObserved === "none" && (i.area === "Payments" || i.area === "Users") && sd.length) expo += 3;
    expo = Math.min(15, expo);

    const total = Math.min(100, typeW + areaPts + trafficPts + recencyPts + expo);
    return { typeW, areaPts, trafficPts, recencyPts, expo, total };
  }

  function severityOf(score) {
    return score >= 78 ? "critical" : score >= 62 ? "high" : score >= 42 ? "medium" : "low";
  }

  /* ---- Derived tags for quick scanning chips ----------------------------- */
  function tagsOf(i) {
    const t = [];
    const fresh = i.firstSeen && (NOW - new Date(i.firstSeen)) <= 7 * DAY;
    if (fresh) t.push("New");
    if (i.authObserved === "none") t.push("Unauthenticated");
    if ((i.sensitiveData || []).includes("PAN")) t.push("Card data");
    if ((i.sensitiveData || []).includes("credentials")) t.push("Credentials");
    if ((i.sensitiveData || []).includes("PII")) t.push("PII");
    if (i.requests7d >= 25000) t.push("High traffic");
    return t;
  }

  /* ---- Synthesize generic activity log + samples where not curated ------- */
  function enrich(i) {
    const b = scoreBreakdown(i);
    i.score = b.total;
    i.scoreParts = b;
    i.severity = severityOf(b.total);
    i.trendData = spark(i.requests7d, i.trend);
    i.tags = tagsOf(i);
    if (!i.samples) {
      i.samples = i.lastSeen ? [{
        ts: i.lastSeen, ip: "10.2.x.x", auth: i.authObserved,
        status: 200, line: `${i.method} ${i.path}`
      }] : [];
    }
    i.activity = [
      { ts: ago(0), who: "system", text: "Detected by spec/traffic comparison run #4471." }
    ];
    if (i.status === "open" && i.assignee)
      i.activity.push({ ts: ago(1 * DAY), who: i.assignee, text: "Triaged — investigating drift with owning team." });
    if (i.status === "resolved")
      i.activity.push({ ts: ago(2 * DAY), who: i.assignee || "R. Vance", text: "Resolved — confirmed safe / scheduled for cleanup." });
    return i;
  }
  ISSUES.forEach(enrich);

  /* =========================================================================
     RUN METADATA + spec coverage (some derived from issues)
     ========================================================================= */
  const shadowCount = ISSUES.filter((i) => i.type === "shadow_api").length;
  const SPEC_ENDPOINTS = 84;          // documented operations in the spec
  const OBSERVED_ENDPOINTS = 79;      // documented ops actually seen
  const RUN = {
    specName: "ShopFront Commerce API",
    specVersion: "v2.4.1",
    specFormat: "OpenAPI 3.0 · JSON",
    window: "Last 7 days",
    windowDates: "18–24 Jun 2026",
    environment: "Production · EU + US edge",
    generatedAt: ago(35 * 60 * 1000),
    runId: "#4471",
    totalRequests: 4_120_500,
    specEndpoints: SPEC_ENDPOINTS,
    observedDocumented: OBSERVED_ENDPOINTS,
    shadowEndpoints: shadowCount,
    coveragePct: Math.round((OBSERVED_ENDPOINTS / SPEC_ENDPOINTS) * 100)
  };

  /* ---- Expose globally (no build step / module system) ------------------- */
  window.APP = { NOW, AREAS, TYPES, ACTIONS, ISSUES, RUN, scoreBreakdown, severityOf };
})();
