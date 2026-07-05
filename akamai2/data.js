/* ============================================================================
 *  Akamai • AI Behavioral Engine — Entity Investigation Side-Panel
 *  data.js  —  Realistic, self-contained mock intelligence (no backend)
 *
 *  All content below simulates the response of the AI Behavioral Engine for a
 *  single high-severity incident. It is intentionally rich so the prototype
 *  looks fully operational on first launch. Exposed as a single global `MOCK`.
 * ========================================================================== */

const MOCK = {
  /* ----- The incident / alert ------------------------------------------- */
  alert: {
    id: "ALT-2026-0714",
    title: "Suspicious Data Download",
    category: "Data Exfiltration",
    severity: "critical",
    riskScore: 95,
    baselineRisk: 12,
    status: "open", // open -> contained -> resolved (mutated by actions)
    detectedAt: "02:48 AM PST",
    detectedAgo: "12 minutes ago",
    mitre: [
      { id: "TA0010", label: "Exfiltration" },
      { id: "T1567", label: "Exfiltration Over Web Service" },
    ],
    engine: "Akamai AI Behavioral Engine",
    engineVersion: "v4.2 · Adaptive Baseline Model",
  },

  /* ----- The entity under investigation (the user) ---------------------- */
  entity: {
    name: "Sarah Chen",
    initials: "SC",
    title: "Senior Financial Analyst",
    department: "Finance",
    email: "sarah.chen@akamai-corp.example",
    manager: "David Rodriguez",
    location: "San Francisco, CA",
    tenure: "Employee since Mar 2021",
    workingHours: "08:00 – 18:00 PST",
    avgDailyDownload: "~200 MB / day",
    historicalRisk: 12,
    peerGroup: "Finance · Analysts (24 people)",
    privileged: false,
  },

  /* ----- AI natural-language summary (streamed on open) ------------------ */
  aiSummary: {
    confidence: 96,
    generatedIn: "1.2s",
    text:
      "At 02:03 AM PST, Sarah Chen (Senior Financial Analyst, Finance) downloaded " +
      "50 GB of sensitive customer financial data — roughly 250× her typical daily " +
      "volume — from the corporate Cloud Drive. The transfer originated from an " +
      "unmanaged Windows 11 device seen for the first time tonight, connecting from a " +
      "residential network outside the corporate perimeter. This is a sharp deviation " +
      "from Sarah's 18-month baseline and aligns with known data-exfiltration patterns " +
      "(MITRE T1567). Given the volume, data sensitivity, and off-hours timing, this " +
      "incident warrants immediate containment.",
  },

  /* ----- Fast-scan key facts (the 5-second glance) ---------------------- */
  keyFacts: [
    { icon: "database", label: "Volume", value: "50 GB", tone: "critical" },
    { icon: "clock", label: "Time", value: "02:03 AM", tone: "warn" },
    { icon: "files", label: "Files", value: "11 files", tone: "neutral" },
    { icon: "monitor-smartphone", label: "Device", value: "Unrecognized", tone: "warn" },
    { icon: "shield-alert", label: "Data class", value: "Customer PII", tone: "critical" },
  ],

  /* ----- Explainable AI: why the score is 95 (contributions sum to 95) --- */
  riskFactors: [
    {
      id: "volume",
      icon: "database",
      title: "Data Volume Anomaly",
      contribution: 32,
      severity: "critical",
      observed: "50 GB in 44 min",
      baseline: "~200 MB / day",
      multiplier: "250× baseline",
      barPct: 100, // 50GB vs 200MB visualised (capped)
      basePct: 4,
      detail:
        "The transferred volume is 250× Sarah's rolling 90-day average and 40× larger " +
        "than the highest single-day download by any Finance peer. Bulk transfers of " +
        "this magnitude are a primary exfiltration indicator.",
    },
    {
      id: "time",
      icon: "moon",
      title: "Off-Hours Access",
      contribution: 24,
      severity: "high",
      observed: "02:03 AM PST",
      baseline: "08:00 – 18:00 PST",
      multiplier: "Outside 100% of activity",
      barPct: 92,
      basePct: 10,
      detail:
        "Sarah has never authenticated between 22:00 and 06:00 in 18 months of history. " +
        "This session falls entirely outside her established active-hours pattern.",
    },
    {
      id: "device",
      icon: "monitor-x",
      title: "Unrecognized Device",
      contribution: 21,
      severity: "high",
      observed: "Unmanaged Windows 11",
      baseline: "Corp-managed MacBook",
      multiplier: "First seen tonight",
      barPct: 88,
      basePct: 6,
      detail:
        "The host DESKTOP-7F3K2L9 is not enrolled in Intune MDM, has no reporting EDR " +
        "agent, and was fingerprinted for the first time at 02:01 AM. Device trust score: 8/100.",
    },
    {
      id: "sensitivity",
      icon: "shield-alert",
      title: "Sensitive Data Classification",
      contribution: 13,
      severity: "high",
      observed: "Restricted · PII · PCI",
      baseline: "Internal docs",
      multiplier: "~2.4M records",
      barPct: 80,
      basePct: 18,
      detail:
        "9 of 11 files are labelled Confidential or Restricted and include customer PII and " +
        "payment-card data. Exfiltration could trigger GDPR / CCPA breach obligations.",
    },
    {
      id: "location",
      icon: "map-pin",
      title: "Anomalous Network Location",
      contribution: 5,
      severity: "medium",
      observed: "Residential ISP · Oakland",
      baseline: "Corp VPN · SF office",
      multiplier: "Off-network",
      barPct: 60,
      basePct: 20,
      detail:
        "Source IP 73.140.22.18 geolocates to a Comcast residential range in Oakland, CA. " +
        "No corporate VPN tunnel was present during the transfer.",
    },
  ],

  /* ----- AI-recommended response actions (with guardrails) -------------- */
  actions: [
    {
      id: "suspend",
      icon: "user-x",
      title: "Suspend User Account",
      subtitle: "Disable SSO & block all sessions for Sarah Chen",
      impact: "high",
      confidence: 94,
      recommended: true,
      reversible: true,
      confirm: {
        heading: "Suspend Sarah Chen's account?",
        body:
          "This immediately disables Single Sign-On and terminates every authenticated " +
          "session across all connected apps. Sarah will be signed out everywhere and " +
          "unable to log in until an admin restores access.",
        impacts: [
          "Blocks all SSO & app access instantly",
          "Terminates 3 active sessions",
          "Notifies IT Identity team",
        ],
        reversibleNote: "Reversible — access can be restored by an IAM admin.",
        confirmLabel: "Suspend Account",
        typeToConfirm: false,
      },
      successToast: "Account suspended — Sarah Chen signed out everywhere.",
    },
    {
      id: "block-device",
      icon: "shield-ban",
      title: "Block Unrecognized Device",
      subtitle: "Blocklist DESKTOP-7F3K2L9 & revoke device trust",
      impact: "high",
      confidence: 92,
      recommended: true,
      reversible: true,
      confirm: {
        heading: "Block device DESKTOP-7F3K2L9?",
        body:
          "The device will be added to the network blocklist and its trust revoked. Any " +
          "in-flight transfer from this host is severed immediately.",
        impacts: [
          "Cuts active network connection",
          "Revokes device certificate & trust",
          "Adds host to global blocklist",
        ],
        reversibleNote: "Reversible — device can be re-approved after review.",
        confirmLabel: "Block Device",
        typeToConfirm: false,
      },
      successToast: "Device DESKTOP-7F3K2L9 blocked and quarantined.",
    },
    {
      id: "revoke-sessions",
      icon: "log-out",
      title: "Revoke Active Sessions",
      subtitle: "Terminate all tokens across cloud apps",
      impact: "medium",
      confidence: 89,
      recommended: false,
      reversible: true,
      confirm: {
        heading: "Revoke all active sessions?",
        body:
          "All OAuth tokens and active sessions for this identity will be invalidated across " +
          "connected SaaS applications.",
        impacts: ["Invalidates 3 active tokens", "Forces re-authentication"],
        reversibleNote: "Reversible — user simply re-authenticates.",
        confirmLabel: "Revoke Sessions",
        typeToConfirm: false,
      },
      successToast: "All active sessions revoked.",
    },
    {
      id: "quarantine-files",
      icon: "folder-lock",
      title: "Quarantine Downloaded Files",
      subtitle: "Restrict the 11 exfiltrated files pending review",
      impact: "medium",
      confidence: 86,
      recommended: false,
      reversible: true,
      confirm: {
        heading: "Quarantine the 11 downloaded files?",
        body:
          "Access to the affected files will be restricted org-wide and a legal-hold tag " +
          "applied until the investigation is closed.",
        impacts: ["Restricts 11 files (50 GB)", "Applies legal-hold tag"],
        reversibleNote: "Reversible — restriction lifts when the case is closed.",
        confirmLabel: "Quarantine Files",
        typeToConfirm: false,
      },
      successToast: "11 files quarantined and placed on legal hold.",
    },
    {
      id: "escalate",
      icon: "siren",
      title: "Escalate to Incident Response",
      subtitle: "Open a P1 case & page the on-call IR lead",
      impact: "low",
      confidence: 90,
      recommended: false,
      reversible: true,
      confirm: {
        heading: "Escalate to the IR team?",
        body:
          "A P1 incident case will be created and the on-call Incident Response lead paged " +
          "with the full context of this alert.",
        impacts: ["Creates P1 case", "Pages on-call IR lead", "Attaches investigation timeline"],
        reversibleNote: "The case can be downgraded or closed later.",
        confirmLabel: "Escalate Now",
        typeToConfirm: false,
      },
      successToast: "Escalated — P1 case opened and IR lead paged.",
    },
  ],

  /* ----- Pivot / drill-down destinations -------------------------------- */
  pivots: [
    { id: "files", icon: "files", title: "Downloaded Files", meta: "11 files · 50 GB" },
    { id: "device", icon: "monitor-smartphone", title: "Device Details", meta: "DESKTOP-7F3K2L9" },
    { id: "timeline", icon: "activity", title: "Event Timeline", meta: "7 events · 47 min" },
    { id: "baseline", icon: "user-round", title: "User Baseline", meta: "18-month history" },
  ],

  /* ----- Drill-down: the 11 downloaded files (sum = 50.0 GB) ------------- */
  files: [
    { name: "Payment_Card_Records_2024.db", type: "db", size: "12.1 GB", class: "restricted", records: "912K records" },
    { name: "Customer_PII_Master.csv", type: "csv", size: "8.7 GB", class: "restricted", records: "1.4M records" },
    { name: "Tax_Records_Archive.zip", type: "zip", size: "6.8 GB", class: "confidential", records: "220K docs" },
    { name: "Banking_Details_Export.csv", type: "csv", size: "5.4 GB", class: "confidential", records: "310K records" },
    { name: "Credit_Risk_Models.zip", type: "zip", size: "4.0 GB", class: "internal", records: "48 models" },
    { name: "Contracts_Signed_2024.pdf", type: "pdf", size: "3.2 GB", class: "confidential", records: "1,204 files" },
    { name: "Vendor_Bank_Accounts.csv", type: "csv", size: "2.9 GB", class: "confidential", records: "6,800 records" },
    { name: "Insurance_Claims_Full.csv", type: "csv", size: "2.4 GB", class: "confidential", records: "74K records" },
    { name: "Q4_Customer_Financials.xlsx", type: "xlsx", size: "2.3 GB", class: "confidential", records: "38 sheets" },
    { name: "Salary_Compensation_Data.xlsx", type: "xlsx", size: "1.1 GB", class: "restricted", records: "2,140 records" },
    { name: "Audit_Financials_Backup.bak", type: "bak", size: "1.1 GB", class: "confidential", records: "1 archive" },
  ],
  fileSummary: { total: "50.0 GB", restricted: 3, confidential: 7, internal: 1 },

  /* ----- Drill-down: the unrecognized device ---------------------------- */
  device: {
    hostname: "DESKTOP-7F3K2L9",
    trustScore: 8,
    os: "Windows 11 Pro · 23H2",
    managed: false,
    edr: "Not reporting",
    firstSeen: "02:01 AM PST (tonight)",
    ip: "73.140.22.18",
    isp: "Comcast Residential",
    geo: "Oakland, CA · United States",
    network: "Off-corp · No VPN tunnel",
    browser: "Chrome 121.0",
    mfa: "Passed · push approved 02:01 AM",
    flags: [
      { label: "Not enrolled in Intune MDM", tone: "critical" },
      { label: "No EDR / antivirus agent", tone: "critical" },
      { label: "First-seen device fingerprint", tone: "high" },
      { label: "Residential IP, outside corp network", tone: "high" },
    ],
  },

  /* ----- Drill-down: event timeline ------------------------------------- */
  timeline: [
    { time: "02:01:14", tone: "info", title: "New device authenticated via SSO", detail: "MFA push approved from DESKTOP-7F3K2L9" },
    { time: "02:01:52", tone: "warn", title: "Device fingerprint unrecognized", detail: "Trust score 8/100 · unmanaged host flagged" },
    { time: "02:03:07", tone: "warn", title: "Bulk download initiated", detail: "Cloud Drive · Finance › Customer Data folder" },
    { time: "02:03–02:47", tone: "critical", title: "50 GB transferred across 11 files", detail: "Sustained 19 MB/s outbound to residential IP" },
    { time: "02:47:41", tone: "warn", title: "Download completed", detail: "All 11 files fully transferred" },
    { time: "02:48:03", tone: "critical", title: "AI Behavioral Engine detected exfiltration", detail: "Pattern match: MITRE T1567 · confidence 96%" },
    { time: "02:48:05", tone: "critical", title: "Alert ALT-2026-0714 created", detail: "Risk score 95/100 · routed to SOC queue" },
  ],

  /* ----- Drill-down: user baseline vs tonight --------------------------- */
  baseline: [
    { label: "Daily download volume", normal: "~200 MB", tonight: "50 GB", tone: "critical" },
    { label: "Active hours", normal: "08:00 – 18:00", tonight: "02:03 AM", tone: "high" },
    { label: "Device", normal: "Corp MacBook (managed)", tonight: "Unmanaged Windows 11", tone: "high" },
    { label: "Location", normal: "SF office / Corp VPN", tonight: "Oakland residential ISP", tone: "medium" },
    { label: "Largest ever single download", normal: "480 MB", tonight: "50 GB", tone: "critical" },
    { label: "18-month risk score", normal: "12 / 100 (Low)", tonight: "95 / 100 (Critical)", tone: "critical" },
  ],

  /* ----- Ask-the-AI canned Q&A (AI-native follow-up) -------------------- */
  askAI: {
    suggestions: [
      "Has Sarah done this before?",
      "Could this be a legitimate backup?",
      "What's the potential blast radius?",
    ],
    answers: {
      "has sarah done this before?":
        "No. Over the past 18 months Sarah's largest single-day download was 480 MB. Tonight's " +
        "50 GB is unprecedented for her and roughly 40× higher than any Finance peer's daily maximum.",
      "could this be a legitimate backup?":
        "Unlikely. Sanctioned corporate backups run under the IT-managed Bak-Service account to " +
        "on-prem storage at 01:00 AM — never from a personal, unmanaged endpoint to a residential network.",
      "what's the potential blast radius?":
        "High. The 11 files hold ~2.4M customer records including PII and payment-card data. If " +
        "exfiltrated, this likely triggers GDPR / CCPA breach-notification obligations within 72 hours.",
      _default:
        "Based on the current signals, the strongest indicators are the 250× volume spike and the " +
        "unrecognized off-network device. I'd recommend suspending the account and blocking the device " +
        "while you confirm intent with Sarah's manager, David Rodriguez.",
    },
  },

  /* ----- SOC background context (dimmed, not the focus) ----------------- */
  soc: {
    kpis: [
      { label: "Open alerts", value: "47", icon: "inbox" },
      { label: "Critical", value: "3", icon: "flame", tone: "critical" },
      { label: "Mean time to respond", value: "6m 12s", icon: "timer" },
      { label: "Analysts online", value: "5", icon: "users" },
    ],
    queue: [
      { id: "ALT-2026-0714", title: "Suspicious Data Download", entity: "Sarah Chen", severity: "critical", score: 95, time: "02:48", primary: true },
      { id: "ALT-2026-0713", title: "Impossible Travel", entity: "Marcus Webb", severity: "high", score: 78, time: "01:22" },
      { id: "ALT-2026-0711", title: "Multiple Failed MFA", entity: "J. Alvarez", severity: "medium", score: 54, time: "00:47" },
      { id: "ALT-2026-0709", title: "Phishing URL Click", entity: "T. Nguyen", severity: "medium", score: 41, time: "23:58" },
      { id: "ALT-2026-0705", title: "Anomalous PowerShell", entity: "svc-deploy", severity: "low", score: 22, time: "22:31" },
    ],
    analyst: { name: "Daniel Meyer", role: "SOC Analyst · Tier 2", initials: "DM" },
  },
};

// Expose globally (no modules, so this works on file://)
window.MOCK = MOCK;
