/* ============================================================================
   AEGIS — Device Intelligence Console
   Mock data layer (fully static, no network). Exposed as window.MOCK.
   Everything here is fictional and used to populate the UI prototype.
   ========================================================================== */
(function () {
  "use strict";

  /* ---- small deterministic helpers so series look organic but stable ---- */
  function seeded(seed) {
    let s = seed % 2147483647;
    if (s <= 0) s += 2147483646;
    return function () {
      s = (s * 16807) % 2147483647;
      return (s - 1) / 2147483646;
    };
  }
  function days(n) {
    const out = [];
    const today = new Date(2026, 5, 17); // 17 Jun 2026
    for (let i = n - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      out.push(d);
    }
    return out;
  }
  function fmtDay(d) {
    return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
  }

  /* ---- platform palette ---- */
  const PLATFORMS = {
    whatsapp: { name: "WhatsApp", color: "#25D366", glyph: "whatsapp" },
    telegram: { name: "Telegram", color: "#2AABEE", glyph: "telegram" },
    signal: { name: "Signal", color: "#3A76F0", glyph: "signal" },
    email: { name: "Email", color: "#F2A33C", glyph: "mail" },
    sms: { name: "SMS", color: "#8A93A6", glyph: "sms" },
    browser: { name: "Browser", color: "#FF7A45", glyph: "globe" },
    maps: { name: "Maps", color: "#34A853", glyph: "pin" },
    calls: { name: "Calls", color: "#B57BFF", glyph: "phone" }
  };

  /* ---- 30-day activity series, split by platform ---- */
  function buildActivity() {
    const rng = seeded(4127);
    return days(30).map(function (d, i) {
      const base = 220 + Math.sin(i / 3) * 90 + rng() * 120;
      const wk = (d.getDay() === 0 || d.getDay() === 6) ? 0.6 : 1;
      const spike = i === 21 || i === 27 ? 1.7 : 1; // operational spikes
      const total = base * wk * spike;
      return {
        date: d,
        label: fmtDay(d),
        whatsapp: Math.round(total * 0.41),
        telegram: Math.round(total * 0.23),
        signal: Math.round(total * 0.12),
        sms: Math.round(total * 0.09),
        email: Math.round(total * 0.15)
      };
    });
  }

  /* ---- hour x weekday heatmap of comms intensity ---- */
  function buildHeatmap() {
    const rng = seeded(9931);
    const grid = [];
    for (let day = 0; day < 7; day++) {
      const row = [];
      for (let h = 0; h < 24; h++) {
        let v = rng() * 0.25;
        if (h >= 8 && h <= 11) v += 0.45 + rng() * 0.3;   // morning ops
        if (h >= 13 && h <= 15) v += 0.3 + rng() * 0.25;
        if (h >= 20 && h <= 23) v += 0.6 + rng() * 0.35;  // night peak
        if (day >= 5) v *= 0.7;                            // quieter weekends
        row.push(Math.min(1, v));
      }
      grid.push(row);
    }
    return grid;
  }

  const HUES = [206, 268, 152, 22, 340, 48, 188, 122, 0, 300];

  /* ===========================  DEVICES  ================================= */
  const devices = [
    {
      id: "TGT-0427", alias: "Marcus Rey", codename: "NIGHTJAR-01",
      phone: "+39 351 442 8890", model: "iPhone 14 Pro", os: "iOS 17.2",
      city: "Naples", country: "Italy", flag: "🇮🇹", status: "live",
      lastSync: "4 min ago", volume: "182.4 GB", risk: "high",
      operation: "NIGHTJAR", hue: 206, primary: true,
      spark: [12, 18, 14, 22, 28, 19, 31, 26, 34, 41, 38, 52],
      counts: { messages: 18432, media: 3217, calls: 642, contacts: 284 }
    },
    {
      id: "TGT-0419", alias: "Lena Brandt", codename: "NIGHTJAR-02",
      phone: "+49 152 9007 4413", model: "Galaxy S24 Ultra", os: "Android 14",
      city: "Hamburg", country: "Germany", flag: "🇩🇪", status: "syncing",
      lastSync: "syncing 63%", volume: "97.1 GB", risk: "high",
      operation: "NIGHTJAR", hue: 268,
      spark: [8, 11, 9, 14, 12, 17, 15, 21, 19, 24, 22, 27],
      counts: { messages: 9120, media: 1684, calls: 311, contacts: 176 }
    },
    {
      id: "TGT-0388", alias: "Omar Haddad", codename: "TIDEWATER-07",
      phone: "+212 661 552 014", model: "iPhone 13", os: "iOS 16.6",
      city: "Casablanca", country: "Morocco", flag: "🇲🇦", status: "live",
      lastSync: "1 min ago", volume: "143.8 GB", risk: "medium",
      operation: "TIDEWATER", hue: 152,
      spark: [20, 17, 23, 19, 25, 22, 28, 24, 30, 27, 33, 29],
      counts: { messages: 14008, media: 2540, calls: 489, contacts: 233 }
    },
    {
      id: "TGT-0356", alias: "Sofia Marchetti", codename: "TIDEWATER-03",
      phone: "+39 340 118 7762", model: "iPhone 15", os: "iOS 17.4",
      city: "Milan", country: "Italy", flag: "🇮🇹", status: "offline",
      lastSync: "6 h ago", volume: "61.2 GB", risk: "low",
      operation: "TIDEWATER", hue: 22,
      spark: [5, 7, 6, 9, 8, 6, 10, 7, 9, 8, 11, 7],
      counts: { messages: 4870, media: 902, calls: 154, contacts: 98 }
    },
    {
      id: "TGT-0341", alias: "Viktor Kozlov", codename: "IRONWOOD-11",
      phone: "+357 96 220 884", model: "Pixel 8 Pro", os: "Android 14",
      city: "Limassol", country: "Cyprus", flag: "🇨🇾", status: "live",
      lastSync: "11 min ago", volume: "118.6 GB", risk: "high",
      operation: "IRONWOOD", hue: 340,
      spark: [14, 19, 16, 22, 26, 24, 29, 31, 28, 35, 33, 40],
      counts: { messages: 11760, media: 1992, calls: 402, contacts: 201 }
    },
    {
      id: "TGT-0309", alias: "Amara Diallo", codename: "IRONWOOD-04",
      phone: "+221 77 884 1209", model: "iPhone 12", os: "iOS 16.3",
      city: "Dakar", country: "Senegal", flag: "🇸🇳", status: "offline",
      lastSync: "2 d ago", volume: "44.9 GB", risk: "medium",
      operation: "IRONWOOD", hue: 188,
      spark: [6, 5, 8, 7, 9, 6, 8, 10, 7, 9, 8, 6],
      counts: { messages: 3611, media: 640, calls: 121, contacts: 87 }
    }
  ];

  /* ===========================  OPERATIONS  ============================= */
  const operations = [
    { id: "op-nightjar", name: "NIGHTJAR", devices: 2, region: "Southern EU", status: "active", classification: "TS//SCI" },
    { id: "op-tidewater", name: "TIDEWATER", devices: 2, region: "Mediterranean", status: "active", classification: "S//NOFORN" },
    { id: "op-ironwood", name: "IRONWOOD", devices: 2, region: "West Africa", status: "monitoring", classification: "TS//SCI" }
  ];

  /* =====================  PRIMARY DEVICE DETAIL  ======================== */
  // Rich content used for the dashboard. Reused for any opened device so the
  // prototype always looks fully populated.

  const platforms = [
    {
      key: "whatsapp", messages: 8124, media: 1486, calls: 214,
      accounts: [
        { label: "Personal", handle: "+39 351 442 8890", messages: 6210, media: 1180 },
        { label: "Business", handle: "Rey Logistics", messages: 1914, media: 306 }
      ]
    },
    {
      key: "telegram", messages: 4633, media: 902, calls: 0,
      accounts: [{ label: "Primary", handle: "@m_rey88", messages: 4633, media: 902 }]
    },
    {
      key: "signal", messages: 2210, media: 188, calls: 96,
      accounts: [{ label: "Primary", handle: "Marcus R.", messages: 2210, media: 188 }]
    },
    {
      key: "email", messages: 1985, media: 412, calls: 0,
      accounts: [
        { label: "Gmail", handle: "m.rey.logistics@gmail.com", messages: 1402, media: 280 },
        { label: "ProtonMail", handle: "nightowl@proton.me", messages: 583, media: 132 }
      ]
    },
    {
      key: "sms", messages: 1480, media: 229, calls: 0,
      accounts: [{ label: "SIM 1", handle: "+39 351 442 8890", messages: 1480, media: 229 }]
    }
  ];

  function avatar(name, hue) {
    const parts = name.split(" ");
    const initials = (parts[0][0] + (parts[1] ? parts[1][0] : "")).toUpperCase();
    return { initials: initials, hue: hue };
  }

  const topContacts = [
    { name: "Karim Adler", handle: "+49 160 220 1187", platform: "signal", messages: 1842, calls: 64, last: "8 min ago", hue: 268, flagged: true, role: "Frequent · Encrypted" },
    { name: "Elena V.", handle: "@elena_v", platform: "telegram", messages: 1610, calls: 0, last: "26 min ago", hue: 340, flagged: true, role: "Coordinator" },
    { name: "Rey Logistics", handle: "Business", platform: "whatsapp", messages: 1914, calls: 41, last: "1 h ago", hue: 152, flagged: false, role: "Front company" },
    { name: "Sami O.", handle: "+39 351 778 2204", platform: "whatsapp", messages: 1120, calls: 88, last: "2 h ago", hue: 22, flagged: false, role: "Family" },
    { name: "Driver — Luca", handle: "+39 333 901 5567", platform: "whatsapp", messages: 884, calls: 132, last: "3 h ago", hue: 48, flagged: false, role: "Logistics" },
    { name: "Unknown (Proton)", handle: "ghost42@proton.me", platform: "email", messages: 312, calls: 0, last: "yesterday", hue: 0, flagged: true, role: "Anonymized" },
    { name: "Nadia K.", handle: "+357 99 114 552", platform: "telegram", messages: 286, calls: 12, last: "yesterday", hue: 188, flagged: false, role: "Associate" }
  ];

  /* ----- conversations keyed by "platform:account" ----- */
  const conversations = [
    {
      id: "c1", platform: "whatsapp", account: "Personal", contact: "Driver — Luca",
      hue: 48, unread: 2, flagged: false, last: "Pickup confirmed at the port, 06:30.", time: "08:14",
      messages: [
        { from: "them", text: "Morning. Truck is loaded and ready.", time: "06:02" },
        { from: "target", text: "Good. Same gate as last time?", time: "06:05" },
        { from: "them", text: "Gate 4. Security shift changes at 6:30 — we go then.", time: "06:06" },
        { from: "target", text: "Send me the manifest when you're through.", time: "06:08" },
        { from: "them", type: "image", text: "📷 manifest_0617.jpg", time: "06:31", flagged: true },
        { from: "them", text: "Pickup confirmed at the port, 06:30.", time: "08:14", flagged: true }
      ]
    },
    {
      id: "c2", platform: "whatsapp", account: "Business", contact: "Rey Logistics",
      hue: 152, unread: 0, flagged: false, last: "Invoice #4471 attached.", time: "Yesterday",
      messages: [
        { from: "them", text: "Container 7 cleared customs.", time: "14:20" },
        { from: "target", text: "Reroute it to the Salerno depot.", time: "14:41" },
        { from: "them", type: "doc", text: "📄 invoice_4471.pdf", time: "15:02" },
        { from: "them", text: "Invoice #4471 attached.", time: "15:02" }
      ]
    },
    {
      id: "c3", platform: "signal", account: "Primary", contact: "Karim Adler",
      hue: 268, unread: 4, flagged: true, last: "Use the new number from now on.", time: "08:06",
      messages: [
        { from: "them", text: "Don't write the address here.", time: "07:41" },
        { from: "target", text: "Understood. Call me on the other line.", time: "07:43" },
        { from: "them", text: "The shipment window moved to Thursday.", time: "07:58", flagged: true },
        { from: "target", text: "That's tight. I'll move the funds tonight.", time: "08:01", flagged: true },
        { from: "them", text: "Use the new number from now on.", time: "08:06", flagged: true }
      ]
    },
    {
      id: "c4", platform: "telegram", account: "Primary", contact: "Elena V.",
      hue: 340, unread: 1, flagged: true, last: "Deleted this message", time: "07:22",
      messages: [
        { from: "them", text: "Did you see the news from Limassol?", time: "07:10" },
        { from: "target", text: "Yes. Keep our people quiet for a few days.", time: "07:14" },
        { from: "them", type: "voice", text: "🎤 Voice message · 0:48", time: "07:18", flagged: true },
        { from: "them", text: "Deleted this message", time: "07:22", deleted: true }
      ]
    },
    {
      id: "c5", platform: "telegram", account: "Primary", contact: "Nadia K.",
      hue: 188, unread: 0, flagged: false, last: "See you at the usual place.", time: "Yesterday",
      messages: [
        { from: "target", text: "Are you in town this week?", time: "11:02" },
        { from: "them", text: "Arriving Wednesday. Same hotel.", time: "11:20" },
        { from: "them", text: "See you at the usual place.", time: "11:21" }
      ]
    },
    {
      id: "c6", platform: "whatsapp", account: "Personal", contact: "Sami O.",
      hue: 22, unread: 0, flagged: false, last: "Tell mama I'll call Sunday.", time: "Yesterday",
      messages: [
        { from: "them", text: "The kids asked about you again.", time: "19:40" },
        { from: "target", text: "I know. It's busy here. Soon.", time: "20:02" },
        { from: "target", text: "Tell mama I'll call Sunday.", time: "20:03" }
      ]
    },
    {
      id: "c7", platform: "email", account: "ProtonMail", contact: "Unknown (Proton)",
      hue: 0, unread: 1, flagged: true, last: "Re: account details", time: "Yesterday",
      messages: [
        { from: "them", text: "Subject: Re: account details\n\nFunds received. Confirm the second wallet.", time: "22:11", flagged: true },
        { from: "target", text: "Confirmed. Delete this thread after.", time: "22:30", flagged: true }
      ]
    },
    {
      id: "c8", platform: "sms", account: "SIM 1", contact: "Bank — Intesa",
      hue: 206, unread: 0, flagged: false, last: "Your OTP code is 884201.", time: "2 d ago",
      messages: [
        { from: "them", text: "A transfer of €18,400 was authorized.", time: "16:01", flagged: true },
        { from: "them", text: "Your OTP code is 884201.", time: "16:02" }
      ]
    }
  ];

  /* ----- media gallery ----- */
  const mediaKinds = ["photo", "video", "audio", "doc"];
  const media = [
    { id: "m1", type: "photo", source: "whatsapp", label: "Port manifest", date: "17 Jun · 06:31", place: "Port of Naples", hue: 206, flagged: true },
    { id: "m2", type: "photo", source: "telegram", label: "Meeting — café", date: "16 Jun · 13:08", place: "Centro Storico", hue: 268 },
    { id: "m3", type: "video", source: "whatsapp", label: "Warehouse walk-through", date: "16 Jun · 09:51", place: "Salerno depot", hue: 152, duration: "1:24" },
    { id: "m4", type: "audio", source: "telegram", label: "Voice note — Elena", date: "16 Jun · 07:18", place: "—", hue: 340, duration: "0:48", flagged: true },
    { id: "m5", type: "doc", source: "email", label: "invoice_4471.pdf", date: "16 Jun · 15:02", place: "—", hue: 22 },
    { id: "m6", type: "photo", source: "whatsapp", label: "Container 7 seal", date: "15 Jun · 18:22", place: "Customs yard", hue: 48 },
    { id: "m7", type: "photo", source: "browser", label: "Screenshot — wallet", date: "15 Jun · 22:31", place: "—", hue: 0, flagged: true },
    { id: "m8", type: "video", source: "signal", label: "Disappearing clip", date: "15 Jun · 20:14", place: "—", hue: 268, duration: "0:12", flagged: true },
    { id: "m9", type: "photo", source: "whatsapp", label: "Family — Sunday", date: "14 Jun · 12:40", place: "Home", hue: 188 },
    { id: "m10", type: "doc", source: "email", label: "shipping_schedule.xlsx", date: "14 Jun · 10:15", place: "—", hue: 152 },
    { id: "m11", type: "photo", source: "telegram", label: "Map fragment", date: "13 Jun · 16:55", place: "Limassol", hue: 340, flagged: true },
    { id: "m12", type: "audio", source: "whatsapp", label: "Voice note — Luca", date: "13 Jun · 08:02", place: "—", hue: 48, duration: "0:31" },
    { id: "m13", type: "photo", source: "whatsapp", label: "Cash count", date: "12 Jun · 23:11", place: "Apartment", hue: 0, flagged: true },
    { id: "m14", type: "video", source: "whatsapp", label: "Truck loading", date: "12 Jun · 06:48", place: "Gate 4", hue: 206, duration: "2:03" },
    { id: "m15", type: "photo", source: "browser", label: "Boarding pass", date: "11 Jun · 19:30", place: "NAP → LCA", hue: 22, flagged: true },
    { id: "m16", type: "doc", source: "email", label: "passport_scan.pdf", date: "10 Jun · 09:12", place: "—", hue: 340, flagged: true }
  ];

  /* ----- call log ----- */
  const calls = [
    { contact: "Driver — Luca", direction: "out", platform: "whatsapp", dur: "12:41", date: "Today · 07:55", recorded: true, hue: 48 },
    { contact: "Karim Adler", direction: "in", platform: "signal", dur: "04:18", date: "Today · 07:40", recorded: true, hue: 268, flagged: true },
    { contact: "Rey Logistics", direction: "out", platform: "whatsapp", dur: "08:02", date: "Today · 06:12", recorded: false, hue: 152 },
    { contact: "Unknown +357", direction: "missed", platform: "calls", dur: "—", date: "Today · 02:31", recorded: false, hue: 0, flagged: true },
    { contact: "Elena V.", direction: "in", platform: "telegram", dur: "21:09", date: "Yesterday · 23:44", recorded: true, hue: 340, flagged: true },
    { contact: "Sami O.", direction: "out", platform: "whatsapp", dur: "33:50", date: "Yesterday · 20:05", recorded: false, hue: 22 },
    { contact: "Nadia K.", direction: "in", platform: "telegram", dur: "06:27", date: "Yesterday · 11:21", recorded: false, hue: 188 },
    { contact: "Driver — Luca", direction: "out", platform: "calls", dur: "02:14", date: "Yesterday · 06:30", recorded: false, hue: 48 },
    { contact: "Unknown +44", direction: "missed", platform: "calls", dur: "—", date: "15 Jun · 22:58", recorded: false, hue: 0, flagged: true },
    { contact: "Karim Adler", direction: "out", platform: "signal", dur: "01:05", date: "15 Jun · 19:12", recorded: true, hue: 268 },
    { contact: "Bank — Intesa", direction: "in", platform: "calls", dur: "03:44", date: "15 Jun · 16:00", recorded: false, hue: 206 },
    { contact: "Rey Logistics", direction: "out", platform: "whatsapp", dur: "15:33", date: "14 Jun · 10:48", recorded: false, hue: 152 },
    { contact: "Elena V.", direction: "out", platform: "telegram", dur: "09:51", date: "14 Jun · 08:20", recorded: true, hue: 340 },
    { contact: "Driver — Luca", direction: "in", platform: "whatsapp", dur: "04:02", date: "13 Jun · 07:10", recorded: false, hue: 48 }
  ];

  /* ----- locations (x/y are % positions on the stylised map canvas) ----- */
  const locations = [
    { label: "Home — Vomero", type: "home", x: 34, y: 58, time: "Nightly · 22:00–07:00", dwell: "9 h avg", count: 41 },
    { label: "Rey Logistics office", type: "work", x: 52, y: 44, time: "Weekdays · 09:00–13:00", dwell: "3.5 h avg", count: 28 },
    { label: "Port of Naples — Gate 4", type: "frequent", x: 63, y: 62, time: "Early mornings", dwell: "45 min avg", count: 17, flagged: true },
    { label: "Salerno depot", type: "frequent", x: 78, y: 71, time: "2–3× weekly", dwell: "1.2 h avg", count: 11 },
    { label: "Café Gambrinus", type: "visit", x: 46, y: 52, time: "Afternoons", dwell: "50 min", count: 9 },
    { label: "Capodichino Airport", type: "visit", x: 70, y: 33, time: "11 Jun · 19:30", dwell: "Departed NAP→LCA", count: 2, flagged: true },
    { label: "Unknown stop — coast road", type: "visit", x: 24, y: 74, time: "15 Jun · 02:10", dwell: "22 min", count: 1, flagged: true },
    { label: "Apartment — Chiaia", type: "frequent", x: 40, y: 64, time: "Late nights", dwell: "varies", count: 7 }
  ];
  // ordered path of recent pings (indexes into a stylised route)
  const route = [
    { x: 34, y: 58 }, { x: 40, y: 64 }, { x: 46, y: 52 }, { x: 52, y: 44 },
    { x: 63, y: 62 }, { x: 78, y: 71 }, { x: 70, y: 33 }
  ];

  /* ----- full contact directory ----- */
  const contacts = [
    { name: "Karim Adler", number: "+49 160 220 1187", platforms: ["signal", "telegram"], interactions: 1906, first: "Mar 2025", last: "8 min ago", flagged: true, hue: 268, org: "—" },
    { name: "Elena V.", number: "@elena_v", platforms: ["telegram"], interactions: 1610, first: "Jan 2025", last: "26 min ago", flagged: true, hue: 340, org: "Coordinator" },
    { name: "Rey Logistics", number: "Business acct", platforms: ["whatsapp", "email"], interactions: 1955, first: "Nov 2024", last: "1 h ago", flagged: false, hue: 152, org: "Front company" },
    { name: "Driver — Luca", number: "+39 333 901 5567", platforms: ["whatsapp", "calls"], interactions: 1016, first: "Feb 2025", last: "3 h ago", flagged: false, hue: 48, org: "Logistics" },
    { name: "Sami O.", number: "+39 351 778 2204", platforms: ["whatsapp", "calls"], interactions: 1208, first: "2019", last: "2 h ago", flagged: false, hue: 22, org: "Family" },
    { name: "Unknown (Proton)", number: "ghost42@proton.me", platforms: ["email"], interactions: 312, first: "Apr 2026", last: "yesterday", flagged: true, hue: 0, org: "Anonymized" },
    { name: "Nadia K.", number: "+357 99 114 552", platforms: ["telegram", "calls"], interactions: 298, first: "Dec 2025", last: "yesterday", flagged: false, hue: 188, org: "Associate" },
    { name: "Bank — Intesa", number: "+39 800 303 305", platforms: ["sms", "calls"], interactions: 142, first: "2021", last: "2 d ago", flagged: false, hue: 206, org: "Financial" },
    { name: "Viktor K.", number: "+357 96 220 884", platforms: ["telegram", "signal"], interactions: 188, first: "May 2026", last: "3 d ago", flagged: true, hue: 122, org: "IRONWOOD link" },
    { name: "Customs — A. Greco", number: "+39 081 552 0931", platforms: ["whatsapp"], interactions: 96, first: "Mar 2026", last: "4 d ago", flagged: true, hue: 300, org: "Insider?" },
    { name: "Maria Rey", number: "+39 351 778 0021", platforms: ["whatsapp", "calls"], interactions: 410, first: "2018", last: "yesterday", flagged: false, hue: 340, org: "Family" },
    { name: "Hotel Aphrodite", number: "+357 25 881 000", platforms: ["sms"], interactions: 14, first: "Jun 2026", last: "5 d ago", flagged: false, hue: 188, org: "Travel" }
  ];

  /* ----- installed apps (note multi-account ones) ----- */
  const apps = [
    { name: "WhatsApp", category: "Messaging", accounts: [{ label: "Personal", handle: "+39 351 442 8890" }, { label: "Business", handle: "Rey Logistics" }], size: "14.2 GB", last: "2 min ago", hue: 152, monitored: true },
    { name: "Telegram", category: "Messaging", accounts: [{ label: "@m_rey88", handle: "Primary" }], size: "9.8 GB", last: "26 min ago", hue: 206, monitored: true },
    { name: "Signal", category: "Messaging", accounts: [{ label: "Marcus R.", handle: "Primary" }], size: "2.1 GB", last: "8 min ago", hue: 268, monitored: true },
    { name: "Gmail", category: "Email", accounts: [{ label: "m.rey.logistics", handle: "@gmail.com" }], size: "3.4 GB", last: "1 h ago", hue: 0, monitored: true },
    { name: "ProtonMail", category: "Email", accounts: [{ label: "nightowl", handle: "@proton.me" }], size: "640 MB", last: "yesterday", hue: 268, monitored: true, flagged: true },
    { name: "Safari", category: "Browser", accounts: [{ label: "iCloud", handle: "synced" }], size: "1.2 GB", last: "40 min ago", hue: 22, monitored: true },
    { name: "Maps", category: "Navigation", accounts: [{ label: "Apple ID", handle: "synced" }], size: "880 MB", last: "3 h ago", hue: 152, monitored: true },
    { name: "Binance", category: "Finance", accounts: [{ label: "m.rey", handle: "verified" }], size: "210 MB", last: "yesterday", hue: 48, monitored: true, flagged: true },
    { name: "Photos", category: "Media", accounts: [{ label: "iCloud", handle: "12,904 items" }], size: "61.0 GB", last: "10 min ago", hue: 188, monitored: true },
    { name: "Notes", category: "Productivity", accounts: [{ label: "iCloud", handle: "synced" }], size: "120 MB", last: "5 h ago", hue: 340, monitored: false },
    { name: "ProtonVPN", category: "Network", accounts: [{ label: "nightowl", handle: "@proton.me" }], size: "90 MB", last: "1 h ago", hue: 300, monitored: true, flagged: true },
    { name: "Wickr", category: "Messaging", accounts: [{ label: "rey_x", handle: "Primary" }], size: "1.6 GB", last: "yesterday", hue: 122, monitored: true, flagged: true }
  ];

  /* ----- keyword / alert hits ----- */
  const alerts = [
    { keyword: "shipment", count: 38, severity: "high", platform: "signal", last: "8 min ago" },
    { keyword: "new number", count: 12, severity: "high", platform: "signal", last: "8 min ago" },
    { keyword: "wallet", count: 21, severity: "high", platform: "email", last: "yesterday" },
    { keyword: "delete this", count: 9, severity: "medium", platform: "telegram", last: "07:22" },
    { keyword: "gate 4", count: 17, severity: "medium", platform: "whatsapp", last: "06:31" },
    { keyword: "customs", count: 14, severity: "medium", platform: "whatsapp", last: "4 d ago" },
    { keyword: "OTP / transfer", count: 6, severity: "high", platform: "sms", last: "2 d ago" }
  ];

  /* ----- cross-platform recent activity feed ----- */
  const feed = [
    { platform: "signal", type: "message", who: "Karim Adler", text: "Use the new number from now on.", time: "08:06", flagged: true },
    { platform: "whatsapp", type: "media", who: "Driver — Luca", text: "Image received · manifest_0617.jpg", time: "06:31", flagged: true },
    { platform: "calls", type: "call", who: "Karim Adler", text: "Incoming Signal call · 4:18", time: "07:40", flagged: true },
    { platform: "telegram", type: "voice", who: "Elena V.", text: "Voice message · 0:48", time: "07:18", flagged: true },
    { platform: "maps", type: "location", who: "Device", text: "Arrived — Port of Naples, Gate 4", time: "06:18" },
    { platform: "email", type: "message", who: "Unknown (Proton)", text: "Re: account details — funds received", time: "Yesterday", flagged: true },
    { platform: "browser", type: "web", who: "Safari", text: "Visited — blockchain explorer", time: "Yesterday", flagged: true },
    { platform: "whatsapp", type: "message", who: "Rey Logistics", text: "Container 7 cleared customs.", time: "Yesterday" },
    { platform: "telegram", type: "message", who: "Nadia K.", text: "Arriving Wednesday. Same hotel.", time: "Yesterday" },
    { platform: "calls", type: "call", who: "Unknown +357", text: "Missed call · 02:31", time: "Yesterday", flagged: true }
  ];

  const profile = {
    imei: "35 982107 446281 1",
    imsi: "222 01 0099431882",
    iccid: "8939 0010 4471 8890 221",
    carrier: "TIM Italia",
    battery: 72,
    storageUsed: "182.4 / 256 GB",
    jailbroken: false,
    lastLocation: "Port of Naples — Gate 4",
    firstSeen: "12 Apr 2026",
    extractionAgent: "AEGIS Relay 7",
    twoFactor: "SMS + Authenticator"
  };

  const kpis = [
    { key: "messages", label: "Messages", value: 18432, delta: "+312 today", glyph: "chat" },
    { key: "media", label: "Media files", value: 3217, delta: "+48 today", glyph: "image" },
    { key: "calls", label: "Calls", value: 642, delta: "+6 today", glyph: "phone" },
    { key: "contacts", label: "Contacts", value: 284, delta: "+2 new", glyph: "users" },
    { key: "locations", label: "Location pings", value: 1890, delta: "live", glyph: "pin" },
    { key: "apps", label: "Monitored apps", value: 47, delta: "12 flagged", glyph: "grid" }
  ];

  window.MOCK = {
    PLATFORMS: PLATFORMS,
    analyst: { name: "Dana Keller", role: "Senior Intelligence Analyst", unit: "SIGINT Cell 4", initials: "DK", clearance: "TS//SCI" },
    operations: operations,
    devices: devices,
    detail: {
      profile: profile,
      kpis: kpis,
      activity: buildActivity(),
      heatmap: buildHeatmap(),
      platforms: platforms,
      topContacts: topContacts,
      conversations: conversations,
      media: media,
      calls: calls,
      locations: locations,
      route: route,
      contacts: contacts,
      apps: apps,
      alerts: alerts,
      feed: feed
    },
    util: { avatar: avatar, fmtDay: fmtDay, HUES: HUES }
  };
})();
