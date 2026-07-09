/* =========================================================================
   BiltOn — Permit to Work (PTW) prototype logic
   Vanilla JS. No dependencies. Persists to localStorage. Runs on file://.
   ========================================================================= */
(function () {
  "use strict";

  /* ----------------------------------------------------------------------
     1. Domain: permit types + the platform's composable JSON form schemas
     The "custom form" is defined by JSON config per permit type. Rendering
     it generically demonstrates the reusable custom-forms system — separate
     from the feature's fixed fields (type, location, time, serial…).
  ---------------------------------------------------------------------- */
  var TYPES = {
    hot: { id:"hot", name:"Hot Work", icon:"🔥", tagline:"Welding · cutting · grinding", color:"var(--hot)", bg:"var(--hot-bg)" },
    confined: { id:"confined", name:"Confined Space", icon:"🕳️", tagline:"Tanks · pits · sumps", color:"var(--conf)", bg:"var(--conf-bg)" },
    electrical: { id:"electrical", name:"Electrical Isolation", icon:"⚡", tagline:"LOTO · live systems", color:"var(--elec)", bg:"var(--elec-bg)" },
    height: { id:"height", name:"Work at Height", icon:"🪜", tagline:"Scaffold · MEWP · rope", color:"var(--height)", bg:"var(--height-bg)" }
  };

  // Each schema: groups -> fields. Field types: text, number, textarea,
  // select, single (choice pills), yesno, checklist.
  var SCHEMAS = {
    hot: [
      { title:"Fire safety", icon:"🔥", fields:[
        { id:"method", label:"Hot work method", type:"single", required:true, options:["Welding","Cutting","Grinding","Brazing"] },
        { id:"fireWatch", label:"Trained fire watch assigned?", type:"yesno", required:true },
        { id:"watchDuration", label:"Fire watch after work stops", type:"select", options:["30 minutes","60 minutes"], hint:"Standard is 60 min for structural steel." },
        { id:"extinguisher", label:"Extinguisher within 8 m of work?", type:"yesno", required:true }
      ]},
      { title:"Area preparation", icon:"🧯", fields:[
        { id:"prep", label:"Confirm precautions in place", type:"checklist", required:true, options:[
          "Combustibles removed or fire-blanketed","Floor & wall openings sealed","Sprinklers / detection operational","Atmosphere gas-tested"] },
        { id:"gasReading", label:"Gas test reading", type:"text", placeholder:"e.g. 0% LEL", hint:"Leave blank if not applicable." },
        { id:"hazards", label:"Adjacent hazards & extra precautions", type:"textarea", placeholder:"e.g. fuel line 4 m east — shielded with fire blanket." }
      ]}
    ],
    confined: [
      { title:"Atmosphere test", icon:"🧪", fields:[
        { id:"o2", label:"Oxygen (O₂)  %", type:"number", required:true, placeholder:"19.5 – 23.5", hint:"Safe range 19.5–23.5%." },
        { id:"lel", label:"Flammable gas  % LEL", type:"number", required:true, placeholder:"0" },
        { id:"h2s", label:"Hydrogen sulphide  ppm", type:"number", placeholder:"0" }
      ]},
      { title:"Entry controls", icon:"🛟", fields:[
        { id:"ventilation", label:"Continuous forced ventilation?", type:"yesno", required:true },
        { id:"attendant", label:"Standby attendant (name)", type:"text", required:true, placeholder:"Full name of hole-watch" },
        { id:"comms", label:"Attendant ↔ entrant comms", type:"single", options:["Two-way radio","Voice","Rope signal"] },
        { id:"rescue", label:"Rescue plan briefed to all?", type:"yesno", required:true }
      ]}
    ],
    electrical: [
      { title:"Isolation", icon:"🔌", fields:[
        { id:"voltage", label:"System voltage", type:"single", required:true, options:["LV  (<1 kV)","HV  (≥1 kV)"] },
        { id:"point", label:"Isolation point / panel ID", type:"text", required:true, placeholder:"e.g. Panel DB-4, breaker 12" },
        { id:"loto", label:"Lock-out / Tag-out applied?", type:"yesno", required:true },
        { id:"padlock", label:"LOTO padlock / tag ID", type:"text", placeholder:"e.g. RED-217" }
      ]},
      { title:"Verification", icon:"✅", fields:[
        { id:"provedDead", label:"Proved dead after isolation?", type:"yesno", required:true },
        { id:"earthing", label:"Earthing / bonding applied?", type:"yesno" },
        { id:"notes", label:"Isolation notes", type:"textarea", placeholder:"Circuits affected, downstream loads…" }
      ]}
    ],
    height: [
      { title:"Access & fall protection", icon:"🪜", fields:[
        { id:"height", label:"Working height (m)", type:"number", required:true, placeholder:"e.g. 24" },
        { id:"access", label:"Access method", type:"single", required:true, options:["Scaffold","MEWP","Ladder","Rope access"] },
        { id:"fall", label:"Fall-protection measures", type:"checklist", required:true, options:[
          "Full-body harness & lanyard","Guardrails / edge protection","Anchor points inspected","Exclusion zone below cordoned"] }
      ]},
      { title:"Conditions", icon:"🌦️", fields:[
        { id:"weather", label:"Weather suitable (wind < 38 km/h)?", type:"yesno", required:true },
        { id:"notes", label:"Site-specific notes", type:"textarea", placeholder:"Overhead lines, public below, drop zones…" }
      ]}
    ]
  };

  var SITE = { code:"NX7", name:"Nexus Tower · Block A" };

  var STATUS = {
    draft:            { label:"Draft",            icon:"✎" },
    pending:          { label:"Pending approval", icon:"⏳" },
    approved:         { label:"Approved",         icon:"✓" },
    changes_required: { label:"Changes required", icon:"↩" },
    rejected:         { label:"Rejected",         icon:"✕" }
  };

  // Site Official sees the same states through a review lens. A submitted permit —
  // and one the foreman is still revising after a return — both read as "Pending"
  // on this side, because the official has no outstanding change to make on either.
  var OFFICIAL_LABELS = {
    draft:            "Draft",
    pending:          "Pending",
    approved:         "Approved",
    changes_required: "Pending",
    rejected:         "Rejected"
  };

  // Default library of quick-insert comment templates (users can add their own).
  var DEFAULT_TEMPLATES = [
    "Approved — maintain the fire watch for 60 minutes after hot work ends.",
    "Please attach the LOTO padlock/tag ID and confirm the circuit was proved dead before re-energising.",
    "Confirm the standby attendant is briefed and gas readings are logged every 30 minutes.",
    "Barricade the drop zone below and post a banksman before any lifting begins.",
    "Extend the permit end time to cover the full shift — the current window is too short.",
    "Add the rescue plan and confirm the tripod/winch is on site for confined-space entry.",
    "This conflicts with the crane lift in the same zone — reschedule outside the lift window.",
    "Approved. Keep the stairwell clear for emergency egress at all times.",
    "Provide the updated method statement / RAMS reference before this can be approved.",
    "Confirm adjacent fuel lines are isolated or shielded with fire blankets."
  ];
  // Canned "transcriptions" used by the hold-to-dictate mic in this prototype.
  var DICTATION_SAMPLES = [
    "Please confirm the isolation point is locked out and add the padlock tag ID before I can approve this.",
    "Approved, but keep a fire watch on site for one hour after the hot work is finished.",
    "Make sure the standby attendant is briefed and the gas readings are recorded every thirty minutes.",
    "Barricade the area below and post a banksman before the lift starts."
  ];
  // AI-generated title suggestions, keyed by permit type — 6 options each.
  var TITLE_SUGGESTIONS = {
    hot: [
      "Welding handrail sections — Level 3 core",
      "Cutting redundant steel beams — East bay",
      "Grinding weld seams — Column C4",
      "Brazing pipework — Mechanical riser",
      "Structural welding — Roof truss connection",
      "Hot cutting bracket removal — Level 2"
    ],
    confined: [
      "Sump inspection — Basement B2",
      "Water tank cleaning — Level 1 store",
      "Pump-pit maintenance — Level -1",
      "Riser-shaft duct inspection",
      "Drainage manhole entry — North yard",
      "Vessel internal repair — Plant room"
    ],
    electrical: [
      "Panel DB-4 shutdown — Level 2",
      "Breaker replacement — Main distribution board",
      "Cable termination — Riser 3",
      "Substation transformer isolation",
      "Lighting-circuit works — Level 5",
      "Busbar maintenance — Electrical room"
    ],
    height: [
      "Facade anchor install — East elevation",
      "Scaffold inspection — North face",
      "MEWP glazing works — Level 8",
      "Rope-access cleaning — South curtain wall",
      "Guardrail installation — Roof perimeter",
      "Signage fixing — Level 10 facade"
    ]
  };

  var USERS = {
    foreman: { name:"Marcus Reid", org:"Steelfix — Structural Crew", initials:"MR" },
    official:{ name:"Dana Osei",   org:"HSE Officer · Site Authority", initials:"DO" }
  };

  // Per-role notification & workflow preferences (Settings screen).
  function defaultSettings(){
    return {
      foreman: {
        voiceRing:true, ringtone:"Chime", vibrate:true, pushDecisions:true,
        autoPingUnapproved:true, quietHours:false
      },
      official: {
        dueSoonAlerts:true, dueSoonLead:"1 hour before", newPermitPush:true,
        escalate:true, escalateAfter:"15 minutes",
        highRiskFirst:true, requireSignature:true,
        voiceRing:true, ringtone:"Spoken voice",
        outOfOffice:false, delegate:"— None —",
        dailyDigest:true, digestTime:"07:30", quietHours:false
      }
    };
  }

  /* ----------------------------------------------------------------------
     2. State + persistence
  ---------------------------------------------------------------------- */
  var LS_KEY = "biltonPTW_v1";
  var state;

  function nowShift(mins) { var d = new Date(Date.now() + mins*60000); return isoLocal(d); }
  function isoLocal(d) {
    var p = function(n){ return (n<10?"0":"")+n; };
    return d.getFullYear()+"-"+p(d.getMonth()+1)+"-"+p(d.getDate())+"T"+p(d.getHours())+":"+p(d.getMinutes());
  }

  function seed() {
    var seq = 138;
    var permits = [];

    permits.push({
      id:"p1", serial:serialFor(138), typeId:"hot", status:"approved",
      title:"Handrail welding — Level 3 core", zone:"Level 3 · Core", detail:"North stair landing, grid B2",
      start:nowShift(-180), end:nowShift(-30), workers:2,
      description:"Weld safety handrail brackets to structural steel around stair void.",
      form:{ method:"Welding", fireWatch:"yes", watchDuration:"60 minutes", extinguisher:"yes",
             prep:["Combustibles removed or fire-blanketed","Floor & wall openings sealed","Sprinklers / detection operational","Atmosphere gas-tested"],
             gasReading:"0% LEL", hazards:"Timber formwork 3 m below — covered with fire blanket." },
      createdBy:"foreman", createdByName:USERS.foreman.name, createdAt:nowShift(-260),
      history:[
        { action:"created", actor:USERS.foreman.name, at:nowShift(-260) },
        { action:"submitted", actor:USERS.foreman.name, at:nowShift(-255) },
        { action:"approved", actor:USERS.official.name, at:nowShift(-250), comment:"Fire watch confirmed. Approved — keep extinguisher staged." }
      ],
      decision:{ action:"approved", by:USERS.official.name, at:nowShift(-250), comment:"Fire watch confirmed. Approved — keep extinguisher staged." }
    });

    permits.push({
      id:"p2", serial:serialFor(139), typeId:"confined", status:"pending",
      title:"Sump inspection — Basement B2", zone:"Basement B2", detail:"Drainage sump, grid C4",
      start:nowShift(75), end:nowShift(225), workers:2,
      description:"Enter drainage sump to inspect pump seals and clear silt.",
      form:{ o2:"20.9", lel:"0", h2s:"3", ventilation:"yes", attendant:"R. Mokoena", comms:"Two-way radio", rescue:"yes" },
      createdBy:"foreman", createdByName:"Luis Ferreira", createdByOrg:"Hydroline — Utilities", createdAt:nowShift(-12),
      history:[
        { action:"created", actor:"Luis Ferreira", at:nowShift(-15) },
        { action:"submitted", actor:"Luis Ferreira", at:nowShift(-12) }
      ],
      decision:null
    });

    permits.push({
      id:"p3", serial:serialFor(140), typeId:"height", status:"pending",
      title:"Facade anchor install — East elevation", zone:"East facade · L8", detail:"Rope-access drops 8–12",
      start:nowShift(38), end:nowShift(280), workers:3,
      description:"Install permanent facade maintenance anchors on east elevation via rope access.",
      form:{ height:"31", access:"Rope access",
             fall:["Full-body harness & lanyard","Anchor points inspected","Exclusion zone below cordoned"],
             weather:"yes", notes:"Public footpath below — spotter and hoarding in place from 09:00." },
      createdBy:"foreman", createdByName:"Priya Nair", createdByOrg:"Apex Access", createdAt:nowShift(-4),
      history:[
        { action:"created", actor:"Priya Nair", at:nowShift(-6) },
        { action:"submitted", actor:"Priya Nair", at:nowShift(-4) }
      ],
      decision:null
    });

    permits.push({
      id:"p4", serial:serialFor(141), typeId:"electrical", status:"changes_required",
      title:"Panel DB-4 shutdown — Level 2", zone:"Level 2 · Riser 3", detail:"Distribution board DB-4",
      start:nowShift(120), end:nowShift(300), workers:1,
      description:"Isolate DB-4 to re-terminate feeder cables for the L2 lighting circuit.",
      form:{ voltage:"LV  (<1 kV)", point:"Panel DB-4", loto:"yes", padlock:"", provedDead:"", earthing:"no",
             notes:"Feeder from main switchboard, circuit 7." },
      createdBy:"foreman", createdByName:USERS.foreman.name, createdAt:nowShift(-90),
      history:[
        { action:"created", actor:USERS.foreman.name, at:nowShift(-95) },
        { action:"submitted", actor:USERS.foreman.name, at:nowShift(-90) },
        { action:"changes_required", actor:USERS.official.name, at:nowShift(-70),
          comment:"Can't approve yet: add the LOTO padlock/tag ID and confirm the circuit was proved dead after isolation. Also apply earthing before re-termination." }
      ],
      decision:{ action:"changes_required", by:USERS.official.name, at:nowShift(-70),
        comment:"Can't approve yet: add the LOTO padlock/tag ID and confirm the circuit was proved dead after isolation. Also apply earthing before re-termination." }
    });

    permits.push({
      id:"p5", serial:serialFor(142), typeId:"hot", status:"pending",
      title:"Ductwork tack-welding — Level 6 plant room", zone:"Level 6 · Plant room", detail:"AHU-2 supply duct, grid D3",
      start:nowShift(55), end:nowShift(180), workers:2,
      description:"Tack-weld supply-duct brackets onto structural steel in the L6 plant room.",
      form:{ method:"Welding", fireWatch:"yes", watchDuration:"60 minutes", extinguisher:"yes",
             prep:["Combustibles removed or fire-blanketed","Sprinklers / detection operational"],
             gasReading:"0% LEL", hazards:"Cable trays nearby — protected with welding blanket." },
      createdBy:"foreman", createdByName:USERS.foreman.name, createdAt:nowShift(-40),
      history:[
        { action:"created", actor:USERS.foreman.name, at:nowShift(-45) },
        { action:"submitted", actor:USERS.foreman.name, at:nowShift(-40) }
      ],
      decision:null
    });

    state = {
      role:"foreman",
      authed:false,
      screen:{ name:"home" },
      seq:143,
      officialSort:"start",
      templates:DEFAULT_TEMPLATES.slice(),
      settings:defaultSettings(),
      hideAiNotice:false,
      permits:permits,
      draft:null,
      createStep:0,
      notif:{
        foreman:[
          { id:"n1", at:nowShift(-70), unread:true, permitId:"p4", kind:"changes_required", text:"Changes required on "+serialFor(141)+" — Dana Osei left a comment." },
          { id:"n2", at:nowShift(-250), unread:false, permitId:"p1", kind:"approved", text:serialFor(138)+" approved by Dana Osei." }
        ],
        official:[
          { id:"n3", at:nowShift(-4),  unread:true, permitId:"p3", kind:"submitted", text:"New permit "+serialFor(140)+" — Work at Height — needs review." },
          { id:"n4", at:nowShift(-12), unread:true, permitId:"p2", kind:"submitted", text:"New permit "+serialFor(139)+" — Confined Space — needs review." }
        ]
      }
    };
    save();
  }

  function serialFor(n) {
    var yy = String(new Date().getFullYear()).slice(2);
    return "PTW-"+SITE.code+"-"+yy+"-"+String(n).padStart(4,"0");
  }

  function save() { try { localStorage.setItem(LS_KEY, JSON.stringify(state)); } catch(e){} }
  function load() {
    try {
      var raw = localStorage.getItem(LS_KEY);
      if (raw) {
        state = JSON.parse(raw);
        if(!state.officialSort) state.officialSort="start";
        if(!state.templates||!state.templates.length) state.templates=DEFAULT_TEMPLATES.slice();
        if(state.hideAiNotice==null) state.hideAiNotice=false;
        // merge in any settings keys added since this device last saved
        var def=defaultSettings();
        if(!state.settings) state.settings=def;
        else { state.settings.foreman=Object.assign({}, def.foreman, state.settings.foreman);
               state.settings.official=Object.assign({}, def.official, state.settings.official); }
        return true;
      }
    } catch(e){}
    return false;
  }
  function resetDemo() { localStorage.removeItem(LS_KEY); seed(); go("home"); toast("Demo data reset","ok"); }

  /* ----------------------------------------------------------------------
     3. Small utilities
  ---------------------------------------------------------------------- */
  var $ = function(sel, root){ return (root||document).querySelector(sel); };
  function el(id){ return document.getElementById(id); }
  function esc(s){ return String(s==null?"":s).replace(/[&<>"']/g, function(c){ return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]; }); }
  function byId(id){ for (var i=0;i<state.permits.length;i++) if (state.permits[i].id===id) return state.permits[i]; return null; }

  var DAYS=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"], MON=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  function pad(n){ return (n<10?"0":"")+n; }
  function fmtDT(s){ if(!s) return "—"; var d=new Date(s); return DAYS[d.getDay()]+" "+d.getDate()+" "+MON[d.getMonth()]+" · "+pad(d.getHours())+":"+pad(d.getMinutes()); }
  function fmtRange(a,b){
    if(!a) return "—";
    var da=new Date(a), db=new Date(b);
    var sameDay = a&&b && da.toDateString()===db.toDateString();
    if (sameDay) return DAYS[da.getDay()]+" "+da.getDate()+" "+MON[da.getMonth()]+" · "+pad(da.getHours())+":"+pad(da.getMinutes())+" – "+pad(db.getHours())+":"+pad(db.getMinutes());
    return fmtDT(a)+" → "+fmtDT(b);
  }
  function rel(s){
    var diff = Date.now()-new Date(s).getTime(), m=Math.round(diff/60000);
    if (m<1) return "just now";
    if (m<60) return m+" min ago";
    var h=Math.round(m/60); if (h<24) return h+" h ago";
    return Math.round(h/24)+" d ago";
  }
  function startsIn(s){
    var diff = new Date(s).getTime()-Date.now(), m=Math.round(diff/60000);
    if (m<0) { var am=Math.abs(m); return am<60? "started "+am+" min ago" : "started "+Math.round(am/60)+" h ago"; }
    if (m<60) return "starts in "+m+" min";
    var h=Math.round(m/60); if (h<24) return "starts in "+h+" h";
    return "starts in "+Math.round(h/24)+" d";
  }
  function isSoon(s){ var diff=new Date(s).getTime()-Date.now(); return diff>0 && diff < 90*60000; }

  /* ----------------------------------------------------------------------
     4. Navigation + render
  ---------------------------------------------------------------------- */
  function go(name, params){ pendingDecision=null; state.screen={ name:name, params:params||{} }; save(); render(); var b=$(".body"); if(b) b.scrollTop=0; }

  var SCREENS = {}; // name -> function(params) => html

  function render() {
    // Auth gate: before sign-in, the login page owns the whole screen and the
    // desktop role-switcher aside is hidden.
    document.body.classList.toggle("pre-auth", !state.authed);
    if (!state.authed) { el("app").innerHTML = loginScreen(); afterRender(); renderNotes(); return; }
    var s = SCREENS[state.screen.name] || SCREENS.home;
    el("app").innerHTML = s(state.screen.params || {});
    updateAsideSelection();
    afterRender();
    renderNotes();
  }

  /* ----------------------------------------------------------------------
     Desktop presenter notes: short "why we designed it this way" copy that
     changes with whatever screen is currently on the phone. Purely a
     presentation aid — no effect on app state.
  ---------------------------------------------------------------------- */
  var NOTES = {
    login: { eyebrow:"Sign-in", items:[
      { h:"SSO, not a new password", p:"The permit app rides on BiltOn's existing company login — one fewer credential for a foreman to remember on site, provisioned centrally by IT." },
      { h:"One door, two roles", p:"Foreman and Site Official sign in through the identical screen; the account itself determines which home screen and permissions they land on next." }
    ]},
    home: {
      foreman: { eyebrow:"My Permits · Foreman", items:[
        { h:"Action-needed rises to the top", p:"Permits returned as “Changes required” are ranked above everything else — a correction sitting unseen is the biggest risk to a job starting late." },
        { h:"View sorted by permit's status", p:"Instead of searching and scrolling to the wanted permit alongside irrelevant permits, the permits are sorted by their status, making it much easier to be found." },
        { h:"A nudge before it's late", p:"If a submitted permit's start time is approaching and it's still pending, a banner lets the foreman proactively ping the official instead of just waiting." },
        { h:"Reachable with a thumb", p:"The floating “+ New permit” button stays in thumb range, because this flow is meant to be filled out standing on site, not at a desk." }
      ]},
      official: { eyebrow:"Approvals · Site Official", items:[
        { h:"Pending means “still my job”", p:"A freshly submitted permit and one the foreman is revising after a return both show as Pending — the official has no outstanding action on either." },
        { h:"Today, at a glance", p:"The mini progress board answers “how am I doing today” in one glance — reviewed vs. still outstanding — before scrolling into the list." },
        { h:"Soonest start sorts first", p:"Default sort is by scheduled start time, so the permit that would block a crew soonest is always the one on top." }
      ]}
    },
    pickType: { eyebrow:"New permit · Step 1", items:[
      { h:"Type decides the form", p:"Choosing the hazard type loads the correct JSON-defined safety checklist — hot work, confined space, electrical, or height — so nobody fills out irrelevant fields." },
      { h:"Four types, not a blank form", p:"Constraining the choice to the site's actual permitted hazard categories keeps every request scoped and quick to review." },
      { h:"Content scalability", p:"This page can hold a handful of types or a lot of them and still look good, thanks to the card-based structure. If the list grows large, a search box is a natural addition." }
    ]},
    create: [
      { eyebrow:"New permit · Step 2 of 3 · Details", items:[
        { h:"Auto-filled fields using AI & GPS", p:"Filling out a form can be tedious, so saving the user time by pre-filling fields is a big help. We can suggest permit titles generated by our AI engine, and auto-fill the job location by matching the user's GPS position to sites already in the system, or by cross-referencing a schedule of where they're assigned to work that day." },
        { h:"Voice-to-text & templates", p:"On a construction site, people work from their phones — typing a long comment or description is hard, especially in bright sun or with dirty, gloved hands. It's much easier to record a comment and let the system transcribe it to text. And when someone repeats the same comment for a specific situation, they can save it as a template and reuse it in a single tap." },
        { h:"Dividing a large form into smaller chunks (wizard)", p:[
          "The goal was to avoid overwhelming users with one long, never-ending form. Instead, the process is broken into smaller, easy-to-digest steps using a wizard — reducing cognitive load and helping users focus on one task at a time.",
          "This matters even more on mobile, where long forms quickly become frustrating and hard to navigate. Presenting only the information relevant to the current step keeps the experience light and manageable.",
          "A progress indicator shows how many steps the wizard contains. Setting clear expectations helps users understand where they are in the process, how much is left, and gives them confidence to continue."
        ] }
      ]},
      { eyebrow:"New permit · Step 2 of 3 · Safety form", items:[
        { h:"The reusable custom-forms system", p:"This step renders BiltOn's existing composable form components from a JSON schema — the same engine other features use — not a one-off form." },
        { h:"Dictation for gloved hands", p:"Hold-to-record turns spoken notes into text for free-text fields, because typing a paragraph one-handed on a ladder isn't realistic." }
      ]},
      { eyebrow:"New permit · Step 3 of 3 · Review", items:[
        { h:"What you see is what they see", p:"The review screen reuses the exact summary component the Site Official will see when deciding — no surprises, no separate “preview” formatting." },
        { h:"Serial number on submit", p:"A site-unique serial is issued only once submitted, so drafts don't consume numbers and the record starts at the moment of accountability." }
      ]}
    ],
    detail: {
      foreman: { eyebrow:"Permit detail · Foreman", items:[
        { h:"The banner explains the “why”", p:"Rather than a bare status chip, the banner always states who decided and, for changes or rejections, exactly what comment they left." },
        { h:"One tap to revise", p:"A returned permit shows a single primary action, Revise & resubmit, which reopens the same 3-step flow pre-filled with the previous answers." }
      ]},
      official: { eyebrow:"Permit detail · Site Official", items:[
        { h:"Time-critical is called out", p:"If a permit's start is close and it's still undecided, a banner flags it above the request details — surfaced by urgency, not just list order." },
        { h:"A full audit trail", p:"Every submission, return and decision is logged with actor, timestamp, comment and signature — the permit trail is the first thing regulators and insurers review." }
      ]}
    },
    settings: {
      foreman: { eyebrow:"Settings · Foreman", items:[
        { h:"Ring loud enough to hear on site", p:"Voice ring lets a decision cut through site noise — spoken aloud, not just a silent push a foreman might not see for an hour." },
        { h:"Auto-chase, not manual nagging", p:"Auto-chasing an unapproved permit near its start time turns a stressful last-minute call into a background nudge the app sends for you." }
      ]},
      official: { eyebrow:"Settings · Site Official", items:[
        { h:"Alerts tuned to the stakes", p:"A configurable lead time before a pending permit's start warns the official early enough to act, not just after a crew is already idle." },
        { h:"Coverage when you're off-site", p:"Delegating to a backup approver directly addresses the paper process's biggest failure mode: approvals stalling when the one signer isn't around." }
      ]}
    },
    confirm: { eyebrow:"Submitted", items:[
      { h:"Preview the other side", p:"“Preview the approver's view” lets a foreman see exactly what the official will see next — useful here, and a good habit for checking your own submission." },
      { h:"A confirmation screen, not just a toast", p:"The serial number gives the foreman something concrete to reference on site, rather than a toast that disappears in three seconds." }
    ]},
    decided: { eyebrow:"Decision recorded", items:[
      { h:"Closing the loop", p:"The official sees the same weight of confirmation the foreman gets on submit — reinforcing that a decision is a real, recorded action, not a quick swipe." }
    ]}
  };

  function currentNotes(){
    if (!state.authed) return NOTES.login;
    var name = state.screen.name;
    if (name==="home") return NOTES.home[state.role];
    if (name==="create") return NOTES.create[state.createStep] || NOTES.create[0];
    if (name==="detail") return NOTES.detail[state.role];
    if (name==="settings") return NOTES.settings[state.role];
    return NOTES[name] || null;
  }
  function renderNotes(){
    var host = el("stageNotes"); if (!host) return;
    var d = currentNotes();
    if (!d) { host.innerHTML=""; return; }
    host.innerHTML = '<div class="sn-eyebrow">'+esc(d.eyebrow)+'</div>'
      + d.items.map(function(it){
          var paras = Array.isArray(it.p) ? it.p : [it.p];
          return '<div class="sn-item"><h4>'+esc(it.h)+'</h4>'
            + paras.map(function(t){ return '<p>'+esc(t)+'</p>'; }).join("")
            + '</div>';
        }).join("");
  }
  function updateAsideSelection() {
    document.querySelectorAll(".role-card").forEach(function(c){
      c.classList.toggle("selected", c.getAttribute("data-role")===state.role);
    });
  }

  /* ----- shared chrome ----- */
  function roleStrip() {
    var u = USERS[state.role];
    return '<div class="rolestrip">'
      + '<div class="avatar">'+u.initials+'</div>'
      + '<div class="who"><b>'+esc(u.name)+'</b><span>'+esc(u.org)+'</span></div>'
      + '<span class="role-tag">'+(state.role==="foreman"?"Foreman":"Site Official")+'</span>'
      + '</div>';
  }
  function bell() {
    var list = state.notif[state.role], unread = list.filter(function(n){return n.unread;}).length;
    return '<button class="iconbtn ghost" data-action="notif" aria-label="Notifications">🔔'+(unread?'<span class="dot">'+unread+'</span>':'')+'</button>';
  }
  function gear() {
    return '<button class="iconbtn ghost" data-action="settings" aria-label="Settings">'
      + '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">'
      +   '<line x1="4" y1="8" x2="20" y2="8"/><circle cx="9" cy="8" r="2.6" fill="var(--surface)"/>'
      +   '<line x1="4" y1="16" x2="20" y2="16"/><circle cx="15" cy="16" r="2.6" fill="var(--surface)"/>'
      + '</svg></button>';
  }
  // Settings + bell, side by side (bell on the right), for the home appbars.
  function homeActions(){ return '<div class="ab-actions">'+gear()+bell()+'</div>'; }

  /* ======================================================================
     SCREEN: Login — SSO gate shown before the app (mockup only)
     Matches the Figma design: assets/bilton-logo.png + assets/login-crane-
     illustration.png, centered copy, single yellow "Log in" button.
  ====================================================================== */
  function loginScreen(){
    return ''
      + '<div class="login">'
      +   '<div class="login-inner">'
      +     '<img class="login-logo-img" src="assets/bilton-logo.png" alt="BiltOn"/>'
      +     '<img class="login-crane-img" src="assets/login-crane-illustration.png" alt=""/>'
      +     '<div class="login-card">'
      +       '<h2>Sign in to your site</h2>'
      +       '<p>Request, review, Approve permits</p>'
      +       '<button class="login-btn" data-action="sso-login">Log in</button>'
      +     '</div>'
      +   '</div>'
      + '</div>';
  }
  function statusLabel(st){ return (state.role==="official" && OFFICIAL_LABELS[st]) ? OFFICIAL_LABELS[st] : STATUS[st].label; }
  function statusChip(st){
    // On the official side a returned permit is shown as plain "Pending", so it carries
    // pending styling too — the "changes required" flag belongs to the foreman's view.
    var cls = (state.role==="official" && st==="changes_required") ? "pending" : st;
    return '<span class="chip '+cls+'"><span class="cdot"></span>'+statusLabel(st)+'</span>';
  }
  function hazBadge(typeId, size){ var t=TYPES[typeId]; return '<div class="hz" style="background:'+t.bg+';color:'+t.color+'">'+t.icon+'</div>'; }

  /* ======================================================================
     SCREEN: Home — adapts to role
  ====================================================================== */
  SCREENS.home = function(){ return state.role==="foreman" ? foremanHome() : officialHome(); };

  function foremanHome() {
    var mine = state.permits.filter(function(p){ return p.createdBy==="foreman" && p.createdByName===USERS.foreman.name; });
    var filter = state.screen.params && state.screen.params.filter || "all";
    var counts = { all:mine.length };
    ["draft","pending","changes_required","approved","rejected"].forEach(function(k){ counts[k]=mine.filter(function(p){return p.status===k;}).length; });
    var shown = filter==="all" ? mine : mine.filter(function(p){return p.status===filter;});
    // order: action-needed first
    var rank = { changes_required:0, draft:1, pending:2, approved:3, rejected:4 };
    shown = shown.slice().sort(function(a,b){ return (rank[a.status]-rank[b.status]) || (new Date(b.createdAt)-new Date(a.createdAt)); });

    var needAction = mine.filter(function(p){return p.status==="changes_required";}).length;

    var chips='';
    [["draft","Draft"],["pending","Waiting for approval"],["changes_required","Change requested"],["rejected","Rejected"],["approved","Approved"]].forEach(function(f){
      if (!counts[f[0]]) return;
      chips += '<button class="seg '+(filter===f[0]?"active":"")+'" data-action="foreman-filter" data-f="'+f[0]+'">'+f[1]+(counts[f[0]]?'<span class="n">'+counts[f[0]]+'</span>':'')+'</button>';
    });

    var cards = shown.map(foremanCard).join("");
    if (!shown.length) cards = '<div class="empty"><div class="ic">📋</div><b>No permits here yet</b><p>Tap <b>New permit</b> to request authorization for hazardous work.</p></div>';

    var actionBanner = needAction ? '<div class="callout rejected" data-action="open" data-id="'+changesId(mine)+'"><span class="ci">↩</span><div><b>'+needAction+' permit needs your changes</b>The site official sent it back — tap to fix and resubmit.</div></div>' : '';

    var soonPending = mine.filter(function(p){
      var diff = new Date(p.start).getTime()-Date.now();
      return p.status==="pending" && diff>0 && diff < 8*3600000;
    }).sort(function(a,b){ return new Date(a.start)-new Date(b.start); })[0];
    if (soonPending && state.pingDismissed===soonPending.id) soonPending = null;
    var pingBanner = soonPending ? '<div class="callout rejected ping-banner">'
      + '<button class="cl-close" data-action="ping-dismiss" data-id="'+soonPending.id+'" aria-label="Dismiss">✕</button>'
      + '<span class="ci">⏱️</span>'
      + '<div><b>'+esc(soonPending.serial)+' '+esc(startsIn(soonPending.start))+' — still not approved</b>'
      + '<div class="cl-txt">Your crew is due on site soon, but '+esc(USERS.official.name)+' hasn’t signed off yet. Send a reminder so you’re cleared to start on time.</div>'
      + '<button class="ping-btn" data-action="ping-official" data-id="'+soonPending.id+'">🔔 Ping the site official</button></div></div>' : '';

    return ''
      + '<div class="appbar brandbar"><div style="flex:1"><div class="ab-title">My Permits</div><div class="ab-sub">'+esc(SITE.name)+'</div></div>'+homeActions()+'</div>'
      + roleStrip()
      + '<div class="body">'
      +   pingBanner
      +   actionBanner
      +   '<div class="segmented">'+chips+'</div>'
      +   cards
      +   '<div class="fineprint">Site serial numbers are issued automatically on submit, unique per site.</div>'
      + '</div>'
      + '<button class="fab" data-action="new-permit"><span class="plus">＋</span> New permit</button>';
  }
  function changesId(list){ var p=list.filter(function(x){return x.status==="changes_required";})[0]; return p?p.id:""; }

  function foremanCard(p){
    var t=TYPES[p.typeId];
    return '<div class="permit-card" data-action="open" data-id="'+p.id+'">'
      + hazBadge(p.typeId)
      + '<div class="pc-main">'
      +   '<div class="pc-top"><span class="serial">'+ (p.status==="draft"?"Draft":esc(p.serial)) +'</span>'+statusChip(p.status)+'</div>'
      +   '<div class="title">'+esc(p.title||t.name)+'</div>'
      +   '<div class="meta">'
      +     '<div class="row">📅 '+esc(fmtRange(p.start,p.end))+'</div>'
      +     '<div class="row">📍 '+esc(p.zone||"Location not set")+'</div>'
      +   '</div>'
      + '</div><div class="chev">›</div></div>';
  }

  function officialHome() {
    // "Pending" holds everything still in the approval loop: freshly submitted (pending)
    // + permits the foreman is revising after a return (changes_required).
    var open = state.permits.filter(function(p){ return p.status==="pending" || p.status==="changes_required"; });
    var rejected = state.permits.filter(function(p){ return p.status==="rejected"; });
    var approved = state.permits.filter(function(p){ return p.status==="approved"; });

    var tab = state.screen.params && state.screen.params.tab || "pending";
    var list = tab==="rejected" ? rejected : tab==="approved" ? approved : open;

    var sortKey = state.officialSort || "start";
    list.sort(sortKey==="oldest"
      ? function(a,b){ return new Date(a.createdAt)-new Date(b.createdAt); }   // oldest request first
      : function(a,b){ return new Date(a.start)-new Date(b.start); });          // soonest start time

    // Under "Soonest start time", time-critical permits (starting within 90 min) always
    // float to the very top — ahead of overdue ones too — since they're the most urgent
    // to act on. Order within each group is preserved from the sort above.
    if (sortKey==="start") {
      var soonFirst = list.filter(function(p){ return p.status==="pending" && isSoon(p.start); });
      var rest = list.filter(function(p){ return !(p.status==="pending" && isSoon(p.start)); });
      list = soonFirst.concat(rest);
    }

    var cards;
    if (!list.length) {
      var em = {
        pending:  { ic:"✅", b:"Nothing to approve", p:"No permits are in the approval loop right now." },
        rejected: { ic:"🚫", b:"Nothing rejected",   p:"Permits you reject will appear here." },
        approved: { ic:"✅", b:"Nothing approved yet",p:"Permits you approve will appear here." }
      }[tab];
      cards = '<div class="empty"><div class="ic">'+em.ic+'</div><b>'+em.b+'</b><p>'+em.p+'</p></div>';
    } else {
      cards = list.map(tab==="pending" ? officialCard : officialDecidedCard).join("");
    }

    var SORTS = [
      { v:"start",  label:"Soonest start time" },
      { v:"oldest", label:"Oldest request first" }
    ];
    var current = SORTS.filter(function(s){ return s.v===sortKey; })[0] || SORTS[0];
    var sortbar = list.length
      ? '<div class="sortbar"><div class="sortdd" data-sortdd>'
        + '<button type="button" class="sortdd-btn" data-action="sort-toggle">'
        +   '<span class="sdd-lbl">Sort by</span>'
        +   '<span class="sdd-val">'+esc(current.label)+'</span>'
        +   '<span class="sdd-caret">▾</span>'
        + '</button>'
        + '<div class="sortdd-menu" role="listbox">'
        +   SORTS.map(function(s){
              return '<button type="button" class="sortdd-opt'+(s.v===sortKey?" selected":"")+'" data-action="sort-pick" data-v="'+s.v+'">'
                + '<span>'+esc(s.label)+'</span><span class="tick">✓</span></button>';
            }).join("")
        + '</div>'
        + '</div></div>'
      : '';

    var seg = function(t,label,count){
      return '<button class="seg '+(tab===t?"active":"")+'" data-action="official-tab" data-t="'+t+'">'+label+(count?'<span class="n">'+count+'</span>':'')+'</button>';
    };

    return ''
      + '<div class="appbar brandbar"><div style="flex:1"><div class="ab-title">Approvals</div><div class="ab-sub">'+esc(SITE.name)+'</div></div>'+homeActions()+'</div>'
      + roleStrip()
      + '<div class="body">'
      +   todayBoard()
      +   '<div class="segmented">'
      +     seg("pending","Pending",open.length)
      +     seg("rejected","Rejected",rejected.length)
      +     seg("approved","Approved",approved.length)
      +   '</div>'
      +   sortbar + cards
      + '</div>';
  }

  // Compact "today at a glance" board shown above the tabs on the official side.
  // Numbers are illustrative for the prototype (approved + returned + not-yet = expected).
  function todayBoard(){
    var d = { expected:20, approved:10, changes:4, pending:6 };
    var done = d.approved + d.changes;                 // permits acted on so far
    var pct = Math.round(done / d.expected * 100);
    var bar = function(cls,n){ return n ? '<span class="tb-fill '+cls+'" style="flex:'+n+'"></span>' : ''; };
    var stat = function(cls,n,label){
      return '<div class="tb-stat"><span class="tb-dot '+cls+'"></span><b>'+n+'</b><span>'+label+'</span></div>';
    };
    return '<div class="todaycard">'
      + '<div class="tb-head">'
      +   '<div class="tb-title">Today’s permits<span>'+d.expected+' expected · '+pct+'% reviewed</span></div>'
      +   '<div class="tb-count">'+done+'<em>/'+d.expected+'</em></div>'
      + '</div>'
      + '<div class="tb-bar">'+bar("approved",d.approved)+bar("changes",d.changes)+bar("pending",d.pending)+'</div>'
      + '<div class="tb-legend">'
      +   stat("approved",d.approved,"Approved")
      +   stat("changes",d.changes,"Sent back")
      +   stat("pending",d.pending,"Not in yet")
      + '</div>'
      + '</div>';
  }


  function officialCard(p){
    var t=TYPES[p.typeId], soon=p.status==="pending" && isSoon(p.start);
    var line2 = p.status==="changes_required"
      ? '🕒 Awaiting foreman revision'
      : (soon?'⏱️ <b style="color:var(--changes)">'+esc(startsIn(p.start))+'</b>':'🕒 '+esc(startsIn(p.start)))+'  ·  📍 '+esc(p.zone);
    return '<div class="permit-card '+(soon?"soon":"")+'" data-action="open" data-id="'+p.id+'">'
      + hazBadge(p.typeId)
      + '<div class="pc-main">'
      +   '<div class="pc-top"><span class="serial">'+esc(p.serial)+'</span></div>'
      +   '<div class="title">'+esc(p.title||t.name)+'</div>'
      +   '<div class="meta">'
      +     '<div class="row">'+t.icon+' '+esc(t.name)+' · 👷 '+esc(p.createdByName)+'</div>'
      +     '<div class="row">'+line2+'</div>'
      +   '</div>'
      + '</div><div class="chev">›</div></div>';
  }
  function officialDecidedCard(p){
    var t=TYPES[p.typeId];
    return '<div class="permit-card" data-action="open" data-id="'+p.id+'">'
      + hazBadge(p.typeId)
      + '<div class="pc-main">'
      +   '<div class="pc-top"><span class="serial">'+esc(p.serial)+'</span></div>'
      +   '<div class="title">'+esc(p.title||t.name)+'</div>'
      +   '<div class="meta"><div class="row">👷 '+esc(p.createdByName)+' · '+(p.decision?esc(rel(p.decision.at)):"")+'</div></div>'
      + '</div><div class="chev">›</div></div>';
  }

  /* ======================================================================
     SCREEN: Settings — role-aware notification & workflow preferences
  ====================================================================== */
  SCREENS.settings = function(){
    return state.role==="foreman" ? foremanSettings() : officialSettings();
  };

  // ---- little builders for a consistent settings list ----
  function setToggle(key, label, desc){
    var on = !!state.settings[state.role][key];
    return '<div class="set-row"><div class="st-txt"><b>'+esc(label)+'</b>'+(desc?'<span>'+esc(desc)+'</span>':'')+'</div>'
      + '<button class="switch '+(on?"on":"")+'" data-action="setting-toggle" data-key="'+key+'" role="switch" aria-checked="'+on+'" aria-label="'+esc(label)+'"><span class="knob"></span></button></div>';
  }
  function setSelect(key, label, opts){
    var v=state.settings[state.role][key];
    return '<div class="set-sub"><label>'+esc(label)+'</label>'
      + '<select class="select" data-setting="'+key+'">'+opts.map(function(o){return '<option '+(v===o?"selected":"")+'>'+esc(o)+'</option>';}).join("")+'</select></div>';
  }
  function ringPreview(){
    return '<div class="set-sub"><button class="btn btn-outline sm ring-btn" data-action="ring-preview">🔊 Preview ring</button></div>';
  }
  function setSection(title, rowsHTML, note){
    return '<div class="set-section"><div class="set-title">'+esc(title)+'</div>'
      + '<div class="card set-card">'+rowsHTML+'</div>'
      + (note?'<div class="set-note">'+esc(note)+'</div>':'')+'</div>';
  }
  function settingsAppbar(){
    return '<div class="appbar"><button class="iconbtn" data-action="go" data-to="home" aria-label="Back">‹</button>'
      + '<div style="flex:1"><div class="ab-title">Settings</div><div class="ab-sub">'+(state.role==="foreman"?"Foreman":"Site Official")+' · '+esc(SITE.name)+'</div></div></div>';
  }

  function foremanSettings(){
    var s=state.settings.foreman;
    return ''
      + settingsAppbar()
      + roleStrip()
      + '<div class="body">'
      + setSection("Alerts",
          setToggle("voiceRing","Voice ring when a permit is ready","Ring or speak the decision aloud the moment approval lands — so you hear it over site noise, gloves on.")
          + (s.voiceRing ? setSelect("ringtone","Ring sound",["Chime","Bell","Siren","Spoken voice"]) + ringPreview() : "")
          + setToggle("vibrate","Vibrate on alerts")
          + setToggle("pushDecisions","Push notifications for decisions","Approved, changes requested, or rejected."),
          "Time-critical safety alerts always come through — even on silent or in quiet hours.")
      + setSection("Reminders",
          setToggle("autoPingUnapproved","Auto-chase approval near start time","If a submitted permit still isn’t approved as its start time nears, nudge the site official for you."))
      + setSection("Quiet hours",
          setToggle("quietHours","Enable quiet hours (22:00 – 06:00)","Mute routine notifications overnight."),
          "Safety-critical alerts still ring during quiet hours.")
      + resetDemoRow()
      + '</div>';
  }

  function officialSettings(){
    var s=state.settings.official;
    return ''
      + settingsAppbar()
      + roleStrip()
      + '<div class="body">'
      + setSection("Approval alerts",
          setToggle("dueSoonAlerts","Alert me when a start time is approaching","Notify me about permits still awaiting my approval as their scheduled start nears — so no crew waits on a sign-off.")
          + (s.dueSoonAlerts ? setSelect("dueSoonLead","Alert me this early",["30 minutes before","1 hour before","90 minutes before","2 hours before"]) : "")
          + setToggle("newPermitPush","Notify me on every new submission")
          + setToggle("escalate","Escalate un-reviewed permits","Re-alert me if a pending permit sits without a decision.")
          + (s.escalate ? setSelect("escalateAfter","Escalate after",["10 minutes","15 minutes","30 minutes"]) : ""),
          "So a job never starts late, and nothing hazardous slips through un-reviewed.")
      + setSection("Prioritisation",
          setToggle("highRiskFirst","Surface high-risk permits first","Hot work, confined space, electrical and height jump to the top of your list.")
          + sortDefaultRow())
      + setSection("Decision defaults",
          setToggle("requireSignature","Require my signature to approve","Legally binds your approval to the record. Recommended on.")
          + setToggle("voiceRing","Voice ring for time-critical approvals","Sound an alert for permits starting very soon.")
          + (s.voiceRing ? setSelect("ringtone","Ring sound",["Chime","Bell","Siren","Spoken voice"]) + ringPreview() : ""))
      + setSection("Coverage",
          setToggle("outOfOffice","I’m off-site — delegate approvals")
          + (s.outOfOffice ? setSelect("delegate","Backup approver",["— None —","Sam Whitfield · Deputy HSE","Ops control room"]) : "")
          + setToggle("dailyDigest","Daily digest of site permit activity")
          + (s.dailyDigest ? setSelect("digestTime","Send digest at",["06:30","07:30","08:00"]) : ""),
          "Approvals stall when the safety officer isn’t on-site — a backup keeps work moving safely.")
      + setSection("Quiet hours",
          setToggle("quietHours","Enable quiet hours (22:00 – 06:00)","Mute routine notifications overnight."),
          "Time-critical approval alerts always break through quiet hours.")
      + resetDemoRow()
      + '</div>';
  }

  // Default sort is shared with the Approvals list's sort control (state.officialSort).
  function sortDefaultRow(){
    var v=state.officialSort||"start";
    return '<div class="set-sub"><label>Default sort order</label><select class="select" data-setting-sort>'
      + '<option value="start" '+(v==="start"?"selected":"")+'>Soonest start time</option>'
      + '<option value="oldest" '+(v==="oldest"?"selected":"")+'>Oldest request first</option></select></div>';
  }
  function resetDemoRow(){
    return '<div class="set-section"><div class="card set-card">'
      + '<div class="set-row">'
      +   '<div class="st-txt"><b>Reset demo data</b><span>Restore the prototype to its starting permits and settings.</span></div>'
      +   '<button class="btn btn-ghost sm" data-action="reset-demo">↺ Reset</button>'
      + '</div>'
      + '<div class="set-row">'
      +   '<div class="st-txt"><b>Sign out</b><span>Return to the login screen.</span></div>'
      +   '<button class="btn btn-ghost sm" data-action="sign-out">↪ Sign out</button>'
      + '</div>'
      + '</div></div>';
  }

  /* ---- "voice ring" preview: synthesised tone or spoken announcement ---- */
  function playRing(kind){
    try {
      if (navigator.vibrate && state.settings[state.role].vibrate!==false) navigator.vibrate(kind==="Siren"?[120,60,120]:60);
      if (kind==="Spoken voice" && window.speechSynthesis){
        var msg = state.role==="official"
          ? "Approval needed. A permit starts in one hour and is still awaiting your sign-off."
          : "Your permit is approved. You are cleared to begin work.";
        var u=new SpeechSynthesisUtterance(msg); u.rate=1; u.pitch=1;
        window.speechSynthesis.cancel(); window.speechSynthesis.speak(u);
        toast("Playing spoken alert","ok"); return;
      }
      var AC=window.AudioContext||window.webkitAudioContext;
      if(!AC){ toast("Audio not supported here","warn"); return; }
      var ctx=new AC();
      var seq = kind==="Siren" ? [[660,0],[880,.2],[660,.4],[880,.6]]
              : kind==="Bell"  ? [[988,0],[740,.16]]
              :                  [[988,0],[1319,.12],[1568,.24]]; // Chime
      var type = kind==="Siren" ? "sawtooth" : "sine";
      seq.forEach(function(n){
        var o=ctx.createOscillator(), g=ctx.createGain();
        o.type=type; o.frequency.value=n[0]; o.connect(g); g.connect(ctx.destination);
        var t0=ctx.currentTime+n[1];
        g.gain.setValueAtTime(0,t0);
        g.gain.linearRampToValueAtTime(.25,t0+.02);
        g.gain.exponentialRampToValueAtTime(.001,t0+.26);
        o.start(t0); o.stop(t0+.28);
      });
      toast("Playing "+kind.toLowerCase(),"ok");
    } catch(e){ toast("Couldn’t play the preview","warn"); }
  }

  /* ======================================================================
     SCREEN: Type picker (foreman)
  ====================================================================== */
  SCREENS.pickType = function(){
    var cards = Object.keys(TYPES).map(function(k){
      var t=TYPES[k];
      return '<button class="type-card" data-action="choose-type" data-type="'+k+'">'
        + '<div class="ic" style="background:'+t.bg+';color:'+t.color+'">'+t.icon+'</div>'
        + '<b>'+t.name+'</b><span>'+t.tagline+'</span></button>';
    }).join("");
    return ''
      + '<div class="appbar"><button class="iconbtn" data-action="go" data-to="home">‹</button><div style="flex:1"><div class="ab-title">New Permit</div><div class="ab-sub">Step 1 · Choose work type</div></div></div>'
      + '<div class="body">'
      +   '<div class="callout info"><span class="ci">💡</span><div><b>What kind of hazardous work?</b>The type you pick loads the right safety form and required checks.</div></div>'
      +   '<div class="type-grid">'+cards+'</div>'
      + '</div>';
  };

  /* ======================================================================
     SCREEN: Create form (3 steps) — fixed feature fields + custom JSON form
  ====================================================================== */
  SCREENS.create = function(){
    var d = state.draft, t = TYPES[d.typeId], step = state.createStep;
    var stepsBar = '<div class="progress-head"><div class="steps">'
      + [0,1,2].map(function(i){ return '<div class="step '+(i<step?"done":i===step?"active":"")+'"></div>'; }).join("")
      + '</div><div class="plabel"><span>'+["Permit details","Safety form","Review & submit"][step]+'</span><span>Step '+(step+1)+' of 3</span></div></div>';

    var content = step===0 ? stepDetails(d,t) : step===1 ? stepForm(d,t) : stepReview(d,t);

    var backTo = step===0 ? "pickType" : "create-prev";
    var editing = d.status==="changes_required" || d.status==="draft";
    var nextBtn = step<2
      ? '<button class="btn btn-primary" data-action="create-next">Continue <span>›</span></button>'
      : (d.revising
          ? '<button class="btn btn-primary" data-action="resubmit">Resubmit for approval</button>'
          : '<button class="btn btn-primary" data-action="submit-permit">Submit for approval</button>');

    return ''
      + '<div class="appbar"><button class="iconbtn" data-action="'+(step===0?"go":"create-prev")+'" data-to="pickType">‹</button>'
      +   '<div style="flex:1"><div class="ab-title">'+ (d.revising?"Revise permit":"New Permit") +'</div><div class="ab-sub">'+t.icon+' '+esc(t.name)+(d.serial?" · "+esc(d.serial):"")+'</div></div>'
      +   '<button class="btn btn-ghost sm" data-action="save-draft">Save draft</button></div>'
      + stepsBar
      + '<div class="body">'+content+'</div>'
      + '<div class="actionbar '+(step>0?"two":"")+'">'
      +   (step>0? '<button class="btn btn-ghost" data-action="create-prev">Back</button>':'')
      +   nextBtn
      + '</div>';
  };

  function stepDetails(d,t){
    return ''
      + '<div class="callout info" style="margin-bottom:16px"><span class="ci">'+t.icon+'</span><div><b>'+esc(t.name)+' permit</b>These core details are the same for every permit type.</div></div>'
      + field("Permit title","text","title",d.title,{ required:true, placeholder:"Short description of the job", aiType:t.id })
      + '<div class="form-group"><div class="fg-head"><span class="fg-ic">📍</span><b>Location</b></div>'
      +   field("Address","text","zone",d.zone,{ required:true, placeholder:"e.g. Nexus Tower · Block A · Level 3 · Core" })
      +   '<button class="btn btn-outline sm loc-btn" data-action="use-location">📡 Use my current location</button>'
      +   field("Specific spot","text","detail",d.detail,{ placeholder:"e.g. North stair landing, grid B2", hint:"Where exactly on site the work happens." })
      + '</div>'
      + '<div class="form-group"><div class="fg-head"><span class="fg-ic">🕒</span><b>When</b></div>'
      +   field("Start","datetime-local","start",d.start,{ required:true })
      +   field("End","datetime-local","end",d.end,{ required:true })
      + '</div>'
      + field("Number of workers","number","workers",d.workers,{ placeholder:"e.g. 2" })
      + field("Scope of work","textarea","description",d.description,{ placeholder:"What will be done, briefly." });
  }

  function stepForm(d,t){
    var schema = SCHEMAS[d.typeId];
    var groups = schema.map(function(g){
      var fields = g.fields.map(function(f){ return customField(f, d.form[f.id]); }).join("");
      return '<div class="form-group"><div class="fg-head"><span class="fg-ic">'+g.icon+'</span><b>'+esc(g.title)+'</b><span class="badge-json">CUSTOM FORM</span></div>'+fields+'</div>';
    }).join("");
    return '<div class="callout info" style="margin-bottom:14px"><span class="ci">🧩</span><div><b>'+esc(t.name)+' safety checks</b>This form is loaded from the permit type\'s JSON config — the platform\'s reusable custom-forms system.</div></div>'+groups;
  }

  // Wraps a free-text <textarea> with the in-field toolbar: Templates + hold-to-dictate mic.
  function taWrap(taHTML){
    return '<div class="ta-wrap">'+taHTML
      + '<div class="ta-tools">'
      +   '<button type="button" class="ta-tool" data-action="ta-templates"><span class="tti">▤</span>Templates</button>'
      +   '<button type="button" class="ta-tool ta-mic" data-ta-mic aria-label="Hold to dictate"><span class="mic-ic">🎤</span></button>'
      + '</div></div>';
  }

  /* generic fixed-field renderer */
  function field(label, type, model, val, opts){
    opts = opts||{};
    var req = opts.required ? '<span class="req">*</span>' : '';
    var hint = opts.hint ? '<div class="hint">'+esc(opts.hint)+'</div>' : '';
    var control;
    if (type==="textarea") control=taWrap('<textarea class="textarea has-tools" data-model="'+model+'" placeholder="'+esc(opts.placeholder||"")+'">'+esc(val||"")+'</textarea>');
    else if (opts.aiType) control='<div class="input-wrap">'
      + '<input class="input has-ai" type="'+type+'" data-model="'+model+'" value="'+esc(val==null?"":val)+'" placeholder="'+esc(opts.placeholder||"")+'"/>'
      + '<button type="button" class="ai-title-btn" data-action="ai-title" data-type="'+esc(opts.aiType)+'" aria-label="Suggest a title"><span class="ai-spark">✨</span></button>'
      + '</div>';
    else control='<input class="input" type="'+type+'" data-model="'+model+'" value="'+esc(val==null?"":val)+'" placeholder="'+esc(opts.placeholder||"")+'"/>';
    return '<div class="field" data-fieldwrap="'+model+'"><label>'+esc(label)+req+'</label>'+hint+control+'<div class="err">Required</div></div>';
  }

  /* custom (JSON-defined) field renderer */
  function customField(f, val){
    var req = f.required ? '<span class="req">*</span>' : '';
    var hint = f.hint ? '<div class="hint">'+esc(f.hint)+'</div>' : '';
    var control='';
    if (f.type==="text"||f.type==="number")
      control='<input class="input" type="'+(f.type==="number"?"number":"text")+'" data-form="'+f.id+'" value="'+esc(val==null?"":val)+'" placeholder="'+esc(f.placeholder||"")+'"/>';
    else if (f.type==="textarea")
      control=taWrap('<textarea class="textarea has-tools" data-form="'+f.id+'" placeholder="'+esc(f.placeholder||"")+'">'+esc(val||"")+'</textarea>');
    else if (f.type==="select")
      control='<select class="select" data-form="'+f.id+'"><option value="">Select…</option>'+f.options.map(function(o){return '<option '+(val===o?"selected":"")+'>'+esc(o)+'</option>';}).join("")+'</select>';
    else if (f.type==="single")
      control='<div class="choices" data-form-choice="'+f.id+'">'+f.options.map(function(o){return '<button type="button" class="choice '+(val===o?"sel":"")+'" data-val="'+esc(o)+'">'+esc(o)+'</button>';}).join("")+'</div>';
    else if (f.type==="yesno")
      control='<div class="choices" data-form-yesno="'+f.id+'">'
        +'<button type="button" class="choice '+(val==="yes"?"sel yes":"")+'" data-val="yes">✓ Yes</button>'
        +'<button type="button" class="choice '+(val==="no"?"sel no":"")+'" data-val="no">✕ No</button></div>';
    else if (f.type==="checklist") {
      var arr = Array.isArray(val)?val:[];
      control='<div class="check-list" data-form-check="'+f.id+'">'+f.options.map(function(o){
        var on=arr.indexOf(o)>=0;
        return '<div class="check-item '+(on?"on":"")+'" data-val="'+esc(o)+'"><div class="box">'+(on?"✓":"")+'</div><div class="lbl">'+esc(o)+'</div></div>';
      }).join("")+'</div>';
    }
    return '<div class="field" data-fieldwrap="form:'+f.id+'"><label>'+esc(f.label)+req+'</label>'+hint+control+'<div class="err">Required</div></div>';
  }

  /* ---- Review step ---- */
  function stepReview(d,t){
    return '<div class="callout info" style="margin-bottom:14px"><span class="ci">👀</span><div><b>Check before you submit</b>The official reviews exactly what you see here. A site serial number is issued on submit.</div></div>'
      + permitSummary(d, true);
  }

  // Full permit summary card used in review + detail
  function permitSummary(p, isDraft){
    var t=TYPES[p.typeId];
    var head = '<div class="sc-head">'+hazBadge(p.typeId)+'<div class="t"><b>'+esc(p.title||t.name)+'</b><span>'+t.icon+' '+esc(t.name)+(isDraft?'':' · '+esc(p.serial))+'</span></div></div>';
    var core = ''
      + kv("Location", esc((p.zone||"—")+(p.detail?" · "+p.detail:"")))
      + kv("When", esc(fmtRange(p.start,p.end)))
      + kv("Workers", esc(p.workers||"—"))
      + (p.description? kv("Scope", esc(p.description)) : "")
      + (isDraft? "" : kv("Requested by", esc(p.createdByName)+(p.createdByOrg?" · "+p.createdByOrg:"")));

    var schema = SCHEMAS[p.typeId], rows="";
    schema.forEach(function(g){
      g.fields.forEach(function(f){
        var v = p.form[f.id];
        rows += kv(f.label.replace(/\s*\(.*?\)/,""), formatVal(f,v), f.type==="yesno"&&v==="yes"?"ok":"");
      });
    });

    return '<div class="card summary-card">'+head
      + '<div class="section-label">Permit details</div>'+core
      + '<div class="section-label">'+esc(t.name)+' safety form</div>'+rows
      + '</div>';
  }
  function kv(k,v,cls){ return '<div class="kv"><div class="k">'+k+'</div><div class="v '+(cls||"")+'">'+(v||"—")+'</div></div>'; }
  function formatVal(f,v){
    if (v==null || v==="" || (Array.isArray(v)&&!v.length)) return '<span class="muted">Not provided</span>';
    if (f.type==="yesno") return v==="yes"?"✓ Yes":"✕ No";
    if (f.type==="checklist") return '<div class="tag-list">'+v.map(function(o){return '<span class="mini-tag">'+esc(o)+'</span>';}).join("")+'</div>';
    return esc(v);
  }

  /* ======================================================================
     SCREEN: Permit detail (both roles adapt)
  ====================================================================== */
  SCREENS.detail = function(params){
    var p = byId(params.id); if(!p) return SCREENS.home();
    return state.role==="official" ? officialDetail(p) : foremanDetail(p);
  };

  function timeline(p){
    var items = (p.history||[]).slice().reverse().map(function(h){
      var map = {
        created:{ic:"✎",bg:"var(--draft)",txt:"Draft created"},
        submitted:{ic:"↑",bg:"var(--brand-500)",txt:"Submitted for approval"},
        resubmitted:{ic:"↑",bg:"var(--brand-500)",txt:"Revised & resubmitted"},
        approved:{ic:"✓",bg:"var(--approved)",txt:"Approved"},
        changes_required:{ic:"↩",bg:"var(--changes)",txt:"Returned — changes required"},
        rejected:{ic:"✕",bg:"var(--rejected)",txt:"Rejected"}
      }[h.action] || {ic:"•",bg:"var(--ink-3)",txt:h.action};
      return '<div class="tl-item"><div class="tl-dot" style="background:'+map.bg+'">'+map.ic+'</div>'
        + '<div class="tl-body"><b>'+map.txt+'</b><div class="tl-time">'+esc(h.actor)+' · '+esc(fmtDT(h.at))+'</div>'
        + (h.comment? '<div class="tl-comment">“'+esc(h.comment)+'”</div>':'')
        + (h.signature? '<div class="tl-comment"><img src="'+h.signature+'" alt="signature" style="max-height:52px"/></div>':'')
        + '</div></div>';
    }).join("");
    return '<div class="card" style="padding:14px"><div class="h-sec" style="margin:0 0 10px">Activity</div><div class="timeline">'+items+'</div></div>';
  }

  function foremanDetail(p){
    var banner="";
    if (p.status==="changes_required") banner='<div class="callout changes"><span class="ci">↩</span><div><b>Changes required by '+esc(p.decision.by)+'</b>'+esc(p.decision.comment)+'</div></div>';
    if (p.status==="approved") banner='<div class="callout approved"><span class="ci">✓</span><div><b>Approved by '+esc(p.decision.by)+'</b>'+(p.decision.comment?esc(p.decision.comment):"You are cleared to begin. Keep the permit accessible on site.")+'</div></div>';
    if (p.status==="rejected") banner='<div class="callout rejected"><span class="ci">✕</span><div><b>Rejected by '+esc(p.decision.by)+'</b>'+(p.decision.comment?esc(p.decision.comment):"This request was denied.")+'</div></div>';
    if (p.status==="pending") banner='<div class="callout info"><span class="ci">⏳</span><div><b>Awaiting approval</b>Submitted '+esc(rel(p.createdAt))+'. You\'ll be notified the moment '+esc(USERS.official.name)+' decides.</div></div>';

    var actions="";
    if (p.status==="changes_required") actions='<div class="actionbar"><button class="btn btn-primary" data-action="revise" data-id="'+p.id+'">Revise & resubmit</button></div>';
    else if (p.status==="draft") actions='<div class="actionbar two"><button class="btn btn-ghost" data-action="delete-draft" data-id="'+p.id+'">Delete</button><button class="btn btn-primary" data-action="revise" data-id="'+p.id+'">Continue editing</button></div>';
    else if (p.status==="approved") actions='<div class="actionbar"><button class="btn btn-outline" data-action="toast-soon">🟢 Start work &amp; open on-site (out of scope)</button></div>';

    return ''
      + '<div class="appbar"><button class="iconbtn" data-action="go" data-to="home">‹</button><div style="flex:1"><div class="ab-title">'+(p.status==="draft"?"Draft":esc(p.serial))+'</div><div class="ab-sub">'+STATUS[p.status].label+'</div></div>'+statusChip(p.status)+'</div>'
      + '<div class="body">'+banner+permitSummary(p,false)+timeline(p)+'</div>'
      + actions;
  }

  function officialDetail(p){
    var decided = p.status==="approved" || p.status==="rejected";
    var banner="";
    if (p.status==="approved") banner='<div class="callout approved"><span class="ci">✓</span><div><b>You approved this permit</b>'+esc(fmtDT(p.decision.at))+(p.decision.comment?' · “'+esc(p.decision.comment)+'”':"")+'</div></div>';
    if (p.status==="changes_required") banner='<div class="callout changes"><span class="ci">↩</span><div><b>You returned this for changes</b>“'+esc(p.decision.comment)+'”</div></div>';
    if (p.status==="rejected") banner='<div class="callout rejected"><span class="ci">✕</span><div><b>You rejected this permit</b>'+(p.decision.comment?'“'+esc(p.decision.comment)+'”':"")+'</div></div>';
    if (!decided && isSoon(p.start)) banner='<div class="callout changes"><span class="ci">⏱️</span><div><b>Time-critical — '+esc(startsIn(p.start))+'</b>The crew is waiting on your decision to begin.</div></div>';

    var reqBar = '<div class="callout info"><span class="ci">👷</span><div><b>'+esc(p.createdByName)+(p.createdByOrg?' · '+esc(p.createdByOrg):"")+'</b>Submitted '+esc(rel(p.createdAt))+' · '+esc(startsIn(p.start))+'</div></div>';

    var actions = decided
      ? ''
      : '<div class="actionbar"><button class="btn btn-primary" data-action="decide-open" data-id="'+p.id+'">Approve permit</button></div>';

    return ''
      + '<div class="appbar"><button class="iconbtn" data-action="go" data-to="home">‹</button><div style="flex:1"><div class="ab-title">'+esc(p.serial)+'</div><div class="ab-sub">'+statusLabel(p.status)+'</div></div>'+statusChip(p.status)+'</div>'
      + '<div class="body">'+banner+reqBar+permitSummary(p,false)+timeline(p)+'</div>'
      + actions;
  }

  /* ======================================================================
     SCREEN: Confirmation
  ====================================================================== */
  SCREENS.confirm = function(params){
    var p = byId(params.id), warn = params.mode==="draft";
    if (warn) {
      return '<div class="body" style="display:flex;flex-direction:column;justify-content:center"><div class="confirm warn"><div class="seal">✎</div>'
        + '<h2>Draft saved</h2><p>Your permit is saved. Pick it back up any time from <b>My Permits</b>.</p>'
        + '<button class="btn btn-primary" data-action="go" data-to="home" style="max-width:240px;margin:0 auto">Back to my permits</button></div></div>';
    }
    var resub = params.mode==="resubmit";
    return '<div class="body" style="display:flex;flex-direction:column;justify-content:center"><div class="confirm"><div class="seal">✓</div>'
      + '<h2>'+(resub?"Resubmitted":"Submitted for approval")+'</h2>'
      + '<p>'+esc(USERS.official.name)+' has been notified and will review your '+esc(TYPES[p.typeId].name)+' permit.</p>'
      + '<div class="serial-badge"><span class="sl">Site permit number</span><span class="sv">'+esc(p.serial)+'</span></div>'
      + '<div style="max-width:250px;margin:0 auto;display:flex;flex-direction:column;gap:9px">'
      +   '<button class="btn btn-outline" data-action="preview-official" data-id="'+p.id+'">👁️ Preview the approver\'s view</button>'
      +   '<button class="btn btn-primary" data-action="go" data-to="home">Back to my permits</button>'
      + '</div>'
      + '<div class="fineprint">You\'ll get a push notification the moment a decision is made.</div>'
      + '</div></div>';
  };

  SCREENS.decided = function(params){
    var p=byId(params.id), m=params.mode;
    var cfg = {
      approved:{ic:"✓",cls:"",h:"Permit approved",t:"Work is authorized. "+esc(p.createdByName)+" has been notified and can begin at the scheduled time."},
      changes_required:{ic:"↩",cls:"warn",h:"Sent back for changes",t:esc(p.createdByName)+" has been notified with your comment and can revise and resubmit."},
      rejected:{ic:"✕",cls:"warn",h:"Permit rejected",t:"The request has been formally denied and "+esc(p.createdByName)+" notified."}
    }[m];
    return '<div class="body" style="display:flex;flex-direction:column;justify-content:center"><div class="confirm '+cfg.cls+'"><div class="seal">'+cfg.ic+'</div>'
      + '<h2>'+cfg.h+'</h2><p>'+cfg.t+'</p>'
      + '<div class="serial-badge"><span class="sl">Permit</span><span class="sv">'+esc(p.serial)+'</span></div>'
      + '<button class="btn btn-primary" data-action="go" data-to="home" style="max-width:240px;margin:0 auto">Back to approvals</button>'
      + '</div></div>';
  };

  /* ======================================================================
     5. Sheets (notifications, decision)
  ====================================================================== */
  function openSheet(html){ el("sheet").innerHTML='<div class="grip"></div>'+html; el("scrim").classList.add("show"); el("sheet").classList.add("show"); }
  function closeSheet(){ el("scrim").classList.remove("show"); el("sheet").classList.remove("show"); }

  function notifSheet(){
    var list = state.notif[state.role];
    var items = list.length ? list.map(function(n){
      var icon={submitted:"📥",approved:"✓",changes_required:"↩",rejected:"✕"}[n.kind]||"🔔";
      var col={submitted:"var(--brand-500)",approved:"var(--approved)",changes_required:"var(--changes)",rejected:"var(--rejected)"}[n.kind];
      return '<div class="check-item" data-action="open-notif" data-id="'+n.permitId+'" data-nid="'+n.id+'" style="cursor:pointer;padding:12px 0">'
        + '<div class="box" style="background:'+col+';border-color:'+col+'">'+icon+'</div>'
        + '<div class="lbl" style="flex:1"><div style="font-weight:'+(n.unread?"700":"500")+'">'+esc(n.text)+'</div><div style="font-size: 12.5px;color:var(--ink-3);margin-top:2px">'+esc(rel(n.at))+(n.unread?' · <b style="color:var(--brand-600)">New</b>':"")+'</div></div></div>';
    }).join("") : '<div class="empty" style="padding:26px"><div class="ic">🔔</div><p>No notifications.</p></div>';
    return '<h3>Notifications</h3><p class="sub">'+(state.role==="foreman"?"Approval decisions on your permits.":"New permits needing your review.")+'</p>'
      + '<div class="check-list">'+items+'</div>'
      + '<div style="margin-top:14px;text-align:center"><button class="btn btn-ghost sm" data-action="reset-demo">↺ Reset demo data</button></div>';
  }

  var sigState = { drawing:false, dirty:false, canvas:null, ctx:null };
  // Tracks an in-progress official decision (Approve/Changes/Reject) so that opening
  // the Templates sub-sheet and picking one can return the user to that same decision
  // sheet — with the comment merged in — instead of just closing the whole modal.
  var pendingDecision = null; // { id, action } | null
  function decisionSheet(p, action, prefillComment){
    var sigReq = state.settings.official.requireSignature;
    var cfg = {
      approved:{title:"Approve permit",sub:"Authorize the work. Your signature is legally attached to this decision.",btn:"Approve & sign",cls:"btn-approve",commentReq:false,sign:true},
      changes_required:{title:"Request changes",sub:"Tell the foreman exactly what to fix so they can resubmit.",btn:"Send back to foreman",cls:"btn-changes",commentReq:true,sign:false},
      rejected:{title:"Reject permit",sub:"Formally deny this request. A reason is recommended.",btn:"Reject permit",cls:"btn-danger",commentReq:false,sign:false}
    }[action];
    var sig = cfg.sign ? '<div class="field"><label>Signature '+(sigReq?'<span class="req">*</span>':'<span class="muted" style="font-weight:500">(optional)</span>')+'</label>'
      + '<div class="sigpad-wrap" id="sigWrap"><canvas class="sigpad" id="sigPad"></canvas><div class="sig-ph">✍️ Sign here</div></div>'
      + '<div class="sig-actions"><span class="muted" style="font-size: 13px">'+esc(USERS.official.name)+' · '+esc(fmtDT(isoLocal(new Date())))+'</span><button class="link" data-action="sig-clear">Clear</button></div></div>' : '';
    return '<h3>'+cfg.title+'</h3><p class="sub">'+cfg.sub+'</p>'
      + '<div class="field"><label>Comment'+(cfg.commentReq?' <span class="req">*</span>':' <span class="muted" style="font-weight:500">(optional)</span>')+'</label>'
      + taWrap('<textarea class="textarea has-tools" id="decisionComment" placeholder="'+(action==="changes_required"?"e.g. Add the LOTO padlock ID and confirm proved-dead reading.":action==="rejected"?"e.g. Work conflicts with crane lift in the same zone.":"e.g. Approved — keep the fire watch on for 60 min after.")+'">'+esc(prefillComment||"")+'</textarea>')
      + '<div class="err" id="commentErr" style="color:var(--danger);font-size: 13px;margin-top:6px;display:none;font-weight:600">Please add a comment so the foreman knows what to change.</div></div>'
      + sig
      + '<button class="btn '+cfg.cls+' btn-block" data-action="confirm-decision" data-id="'+p.id+'" data-decision="'+action+'">'+cfg.btn+'</button>';
  }

  function initSignature(){
    var c = el("sigPad"); if(!c) return;
    var wrap = el("sigWrap");
    var ratio = window.devicePixelRatio||1;
    var rect = c.getBoundingClientRect();
    c.width = rect.width*ratio; c.height = rect.height*ratio;
    var ctx = c.getContext("2d"); ctx.scale(ratio,ratio);
    ctx.lineWidth=2.2; ctx.lineCap="round"; ctx.lineJoin="round"; ctx.strokeStyle="#123a63";
    sigState.canvas=c; sigState.ctx=ctx; sigState.dirty=false;
    var pos=function(e){ var r=c.getBoundingClientRect(); var t=e.touches?e.touches[0]:e; return {x:t.clientX-r.left,y:t.clientY-r.top}; };
    var start=function(e){ e.preventDefault(); sigState.drawing=true; var p=pos(e); ctx.beginPath(); ctx.moveTo(p.x,p.y); };
    var move=function(e){ if(!sigState.drawing)return; e.preventDefault(); var p=pos(e); ctx.lineTo(p.x,p.y); ctx.stroke(); if(!sigState.dirty){sigState.dirty=true;wrap.classList.add("signed");} };
    var end=function(){ sigState.drawing=false; };
    c.addEventListener("mousedown",start); c.addEventListener("mousemove",move); window.addEventListener("mouseup",end);
    c.addEventListener("touchstart",start,{passive:false}); c.addEventListener("touchmove",move,{passive:false}); c.addEventListener("touchend",end);
  }
  function clearSig(){ if(sigState.ctx){ sigState.ctx.clearRect(0,0,sigState.canvas.width,sigState.canvas.height); sigState.dirty=false; el("sigWrap").classList.remove("signed"); } }

  /* ======================================================================
     6. Toast
  ====================================================================== */
  function toast(msg, kind){
    var host=el("toastHost"); var t=document.createElement("div");
    t.className="toast "+(kind||"");
    var ic={ok:"✓",warn:"↩",err:"✕"}[kind]||"🔔";
    t.innerHTML='<div class="ti">'+ic+'</div><div>'+esc(msg)+'</div>';
    host.appendChild(t);
    requestAnimationFrame(function(){ t.classList.add("show"); });
    setTimeout(function(){ t.classList.remove("show"); setTimeout(function(){ host.removeChild(t); },300); }, 3200);
  }

  /* ======================================================================
     7. Actions / event wiring
  ====================================================================== */
  function newDraft(typeId){
    return { id:"p"+Date.now(), serial:null, typeId:typeId, status:"draft",
      title:"", zone:"", detail:"", start:"", end:"", workers:"", description:"",
      form:{}, createdBy:"foreman", createdByName:USERS.foreman.name,
      createdAt:isoLocal(new Date()), history:[], decision:null, revising:false };
  }

  function validateStep(step){
    var d=state.draft, bad=[];
    if (step===0) {
      [["title",d.title],["zone",d.zone],["start",d.start],["end",d.end]].forEach(function(x){ if(!x[1]) bad.push(x[0]); });
      if (d.start && d.end && new Date(d.end)<=new Date(d.start)) { bad.push("end"); toast("End time must be after start time","warn"); }
    } else if (step===1) {
      SCHEMAS[d.typeId].forEach(function(g){ g.fields.forEach(function(f){
        if(!f.required) return;
        var v=d.form[f.id];
        if (v==null || v==="" || (Array.isArray(v)&&!v.length)) bad.push("form:"+f.id);
      });});
    }
    // paint
    document.querySelectorAll(".field.invalid").forEach(function(n){ n.classList.remove("invalid"); });
    bad.forEach(function(m){ var w=document.querySelector('[data-fieldwrap="'+m.replace(/"/g,'')+'"]'); if(w) w.classList.add("invalid"); });
    if (bad.length) { toast("Please complete the required fields","warn"); var first=document.querySelector(".field.invalid"); if(first) first.scrollIntoView({behavior:"smooth",block:"center"}); }
    return bad.length===0;
  }

  function submitPermit(resubmit){
    var d=state.draft;
    if (!d.serial) { d.serial=serialFor(state.seq); state.seq++; }
    d.status="pending";
    d.revising=false;
    var at=isoLocal(new Date());
    if (resubmit) d.history.push({ action:"resubmitted", actor:USERS.foreman.name, at:at });
    else { d.history.push({ action:"created", actor:USERS.foreman.name, at:d.createdAt||at }); d.history.push({ action:"submitted", actor:USERS.foreman.name, at:at }); }
    // upsert into permits
    upsert(d);
    // notify official
    state.notif.official.unshift({ id:"n"+Date.now(), at:at, unread:true, permitId:d.id, kind:"submitted",
      text:"New permit "+d.serial+" — "+TYPES[d.typeId].name+" — needs review." });
    var id=d.id; state.draft=null; save();
    go("confirm",{ id:id, mode:resubmit?"resubmit":"new" });
  }

  function saveDraft(){
    var d=state.draft; d.status="draft"; upsert(d);
    var id=d.id; state.draft=null; save(); go("confirm",{ id:id, mode:"draft" });
  }

  function upsert(p){
    var i=-1; for(var k=0;k<state.permits.length;k++) if(state.permits[k].id===p.id){ i=k; break; }
    if(i>=0) state.permits[i]=p; else state.permits.unshift(p);
  }

  function confirmDecision(id, action){
    var p=byId(id);
    var comment = (el("decisionComment").value||"").trim();
    if (action==="changes_required" && !comment) { el("commentErr").style.display="block"; return; }
    var signature=null;
    if (action==="approved") {
      if (state.settings.official.requireSignature && !sigState.dirty) { toast("Please add your signature to approve","warn"); return; }
      if (sigState.dirty) signature = sigState.canvas.toDataURL("image/png");
    }
    var at=isoLocal(new Date());
    p.status=action;
    p.decision={ action:action, by:USERS.official.name, at:at, comment:comment, signature:signature };
    p.history.push({ action:action, actor:USERS.official.name, at:at, comment:comment, signature:signature });
    // notify foreman
    var txt = action==="approved" ? p.serial+" approved by "+USERS.official.name+"."
            : action==="changes_required" ? "Changes required on "+p.serial+" — "+USERS.official.name+" left a comment."
            : p.serial+" was rejected by "+USERS.official.name+".";
    state.notif.foreman.unshift({ id:"n"+Date.now(), at:at, unread:true, permitId:p.id, kind:action, text:txt });
    // mark related official notif read
    state.notif.official.forEach(function(n){ if(n.permitId===p.id) n.unread=false; });
    pendingDecision = null;
    save(); closeSheet();
    go("decided",{ id:id, mode:action });
  }

  function markNotifRead(nid){ state.notif[state.role].forEach(function(n){ if(n.id===nid) n.unread=false; }); save(); }

  /* ---- delegation ---- */
  document.addEventListener("click", function(e){
    // close the sort dropdown when clicking anywhere outside it
    var openDd = document.querySelector(".sortdd.open");
    if (openDd && !e.target.closest("[data-sortdd]")) openDd.classList.remove("open");
    var t = e.target.closest("[data-action]");
    // choice / checklist toggles handled separately below regardless of data-action
    var choice = e.target.closest("[data-form-choice] .choice, [data-form-yesno] .choice");
    if (choice) { handleChoice(choice); return; }
    var chk = e.target.closest("[data-form-check] .check-item");
    if (chk) { handleCheck(chk); return; }

    if (!t) return;
    var a = t.getAttribute("data-action");

    switch(a){
      case "view-as": {
        var r = t.getAttribute("data-role");
        if (r && r!==state.role) {
          state.role = r;
          toast("Viewing as "+(r==="foreman"?USERS.foreman.name+" (Foreman)":USERS.official.name+" (Site Official)"), "ok");
          go("home");
        }
        break;
      }
      case "sso-login": {
        state.authed = true; state.screen = { name:"home" }; save(); render();
        toast("Signed in — welcome to BiltOn","ok"); break;
      }
      case "sign-out": {
        state.authed = false; save(); render();
        toast("Signed out","ok"); break;
      }
      case "notif": openSheet(notifSheet()); break;
      case "settings": go("settings"); break;
      case "setting-toggle": {
        var sk=t.getAttribute("data-key"); var bag=state.settings[state.role];
        bag[sk]=!bag[sk]; save(); render(); break;
      }
      case "ring-preview": playRing(state.settings[state.role].ringtone); break;
      case "reset-demo": closeSheet(); resetDemo(); break;
      case "open-notif": {
        var nid=t.getAttribute("data-nid"); markNotifRead(nid); closeSheet(); go("detail",{ id:t.getAttribute("data-id") }); break;
      }
      case "open": go("detail",{ id:t.getAttribute("data-id") }); break;
      case "go": go(t.getAttribute("data-to")); break;
      case "foreman-filter": { var nf=t.getAttribute("data-f"); var cur=state.screen.params&&state.screen.params.filter||"all"; go("home",{ filter: cur===nf?"all":nf }); break; }
      case "ping-official": toast("Reminder sent to "+USERS.official.name,"ok"); break;
      case "ping-dismiss": state.pingDismissed=t.getAttribute("data-id"); save(); render(); break;
      case "official-tab": go("home",{ tab:t.getAttribute("data-t") }); break;
      case "sort-toggle": {
        var dd=t.closest("[data-sortdd]"); if(dd) dd.classList.toggle("open"); break;
      }
      case "sort-pick": {
        state.officialSort = t.getAttribute("data-v"); save(); render(); break;
      }
      case "new-permit": go("pickType"); break;
      case "choose-type": state.draft=newDraft(t.getAttribute("data-type")); state.createStep=0; save(); go("create"); break;
      case "create-next": if (validateStep(state.createStep)) { state.createStep=Math.min(2,state.createStep+1); save(); render(); scrollTop(); } break;
      case "create-prev": if (state.createStep===0){ go("pickType"); } else { state.createStep--; save(); render(); scrollTop(); } break;
      case "save-draft": saveDraft(); break;
      case "submit-permit": if (validateStep(0)&&validateStep(1)) submitPermit(false); else { state.createStep=validateStep(0)?1:0; render(); } break;
      case "resubmit": if (validateStep(0)&&validateStep(1)) submitPermit(true); else { state.createStep=validateStep(0)?1:0; render(); } break;
      case "use-location": {
        state.draft.zone = SITE.name + " · Level 8 · East facade";
        save(); render(); toast("Location captured from device GPS","ok"); break;
      }
      case "revise": {
        var pr=byId(t.getAttribute("data-id")); state.draft=Object.assign({},pr); state.draft.form=Object.assign({},pr.form); state.draft.revising=(pr.status==="changes_required"); state.createStep=0; save(); go("create"); break;
      }
      case "delete-draft": {
        var did=t.getAttribute("data-id"); state.permits=state.permits.filter(function(p){return p.id!==did;}); save(); go("home"); toast("Draft deleted","ok"); break;
      }
      case "preview-official": state.role="official"; save(); go("detail",{ id:t.getAttribute("data-id") }); toast("Now viewing as "+USERS.official.name+" (Site Official)","ok"); break;
      case "decide-open": {
        openDecision(t.getAttribute("data-id")); break;
      }
      case "sig-clear": clearSig(); break;
      case "confirm-decision": confirmDecision(t.getAttribute("data-id"), t.getAttribute("data-decision")); break;
      case "toast-soon": toast("Out of scope for this prototype — flagged in the deck.","warn"); break;
      case "ta-templates": openTemplates(t); break;
      case "tpl-pick": insertTemplate(state.templates[+t.getAttribute("data-i")]); break;
      case "tpl-save": saveTemplate(); break;
      case "ai-ok": dismissAiNotice(true); break;
      case "ai-title": openTitleAI(t); break;
      case "ai-title-pick": pickTitle(t.getAttribute("data-txt")); break;
    }
  });

  // Decision entry: show triad first inside a sheet, then the form
  function openDecision(id){
    var p=byId(id);
    var html = '<h3>Your decision</h3><p class="sub">You are legally accountable for approving '+esc(p.serial)+'. Choose an outcome.</p>'
      + '<div class="decision-triad">'
      + '<button class="btn btn-approve" data-action="decision-pick" data-id="'+id+'" data-d="approved"><span class="d-ic">✓</span><span class="d-txt">Approve<small>Authorize the work to begin</small></span></button>'
      + '<button class="btn btn-changes" data-action="decision-pick" data-id="'+id+'" data-d="changes_required"><span class="d-ic">↩</span><span class="d-txt">Request changes<small>Send back with a comment</small></span></button>'
      + '<button class="btn btn-reject" data-action="decision-pick" data-id="'+id+'" data-d="rejected"><span class="d-ic">✕</span><span class="d-txt">Reject<small>Formally deny this request</small></span></button>'
      + '</div>';
    openSheet(html);
  }
  // second-level pick handled here (needs its own listener because sheet re-renders)
  document.addEventListener("click", function(e){
    var t=e.target.closest('[data-action="decision-pick"]'); if(!t) return;
    var id=t.getAttribute("data-id"), d=t.getAttribute("data-d"), p=byId(id);
    pendingDecision = { id:id, action:d };
    openSheet(decisionSheet(p,d));
    if (d==="approved") setTimeout(initSignature,60);
  });

  el("scrim").addEventListener("click", function(){ pendingDecision=null; closeSheet(); });

  /* ======================================================================
     In-field text tools: Templates + hold-to-dictate microphone
  ====================================================================== */
  var activeTA = null;   // the textarea a tool is currently acting on
  var activeTitle = null; // the title input the AI suggester is acting on

  function openTitleAI(btn){
    activeTitle = btn.closest(".input-wrap").querySelector("input");
    var type = btn.getAttribute("data-type");
    var list = (TITLE_SUGGESTIONS[type] || []);
    var t = TYPES[type];
    var items = list.map(function(txt){
      return '<button type="button" class="tpl-item title-sug" data-action="ai-title-pick" data-txt="'+esc(txt)+'">'
        + '<span class="tpl-txt">'+esc(txt)+'</span><span class="sug-use">Use</span></button>';
    }).join("");
    var html = '<h3><span class="ai-spark" style="margin-right:6px">✨</span>Suggested titles</h3>'
      + '<p class="sub">AI ideas for your '+esc(t?t.name:"permit")+' permit — pick one, then edit it if you like.</p>'
      + '<div class="tpl-list">'+items+'</div>';
    openSheet(html);
  }
  function pickTitle(txt){
    if (activeTitle){
      activeTitle.value = txt;                                  // override any existing text
      activeTitle.dispatchEvent(new Event("input", { bubbles:true }));
      var fw = activeTitle.closest(".field"); if(fw) fw.classList.remove("invalid");
      save();
    }
    closeSheet();
    toast("Title added — edit it anytime","ok");
  }

  function openTemplates(btn){
    activeTA = btn.closest(".ta-wrap").querySelector("textarea");
    var items = state.templates.map(function(txt,i){
      return '<button type="button" class="tpl-item" data-action="tpl-pick" data-i="'+i+'">'
        + '<span class="tpl-q">“</span><span class="tpl-txt">'+esc(txt)+'</span></button>';
    }).join("");
    var html = '<h3>Comment templates</h3><p class="sub">Tap one to drop it into your comment.</p>'
      + '<button type="button" class="tpl-save" data-action="tpl-save"><span class="tpl-plus">＋</span>Save my comment as a template</button>'
      + '<div class="tpl-list">'+items+'</div>';
    openSheet(html);
  }
  function insertTemplate(txt){
    var merged = null;
    if (activeTA){
      var cur = activeTA.value.trim();
      merged = cur ? (cur + "\n" + txt) : txt;
      activeTA.value = merged;
      activeTA.dispatchEvent(new Event("input", { bubbles:true }));
      save();
    }
    returnToDecisionOrClose(merged);
    toast("Template added to your comment","ok");
  }
  function saveTemplate(){
    var txt = activeTA ? activeTA.value.trim() : "";
    if (!txt){ toast("Type a comment first, then save it","warn"); return; }
    if (state.templates.indexOf(txt) === -1) state.templates.unshift(txt);
    save();
    returnToDecisionOrClose(txt);
    toast("Saved to your templates","ok");
  }
  // After the Templates sub-sheet is used, either return to the decision sheet it was
  // opened from (comment merged in, so the official can still review before confirming)
  // or, when Templates was opened from a normal form field, just close as before.
  function returnToDecisionOrClose(commentText){
    if (pendingDecision){
      var p = byId(pendingDecision.id);
      openSheet(decisionSheet(p, pendingDecision.action, commentText));
      if (pendingDecision.action==="approved") setTimeout(initSignature,60);
    } else {
      closeSheet();
    }
  }

  /* ---- hold-to-dictate microphone (simulated speech-to-text) ---- */
  var recState = { active:false, ta:null, start:0, timer:null };

  function ensureOverlays(){
    var wrap = el("screenWrap"); if(!wrap || el("recBar")) return;
    var rec = document.createElement("div");
    rec.className = "recbar"; rec.id = "recBar";
    rec.innerHTML = '<span class="rec-dot"></span>'
      + '<span class="rec-time" id="recTime">0:00</span>'
      + '<div class="rec-wave">'+Array(14).join('<i></i>')+'</div>'
      + '<span class="rec-hint">Listening… release to add</span>';
    wrap.appendChild(rec);

    var sc = document.createElement("div");
    sc.className = "aiscrim"; sc.id = "aiScrim"; wrap.appendChild(sc);
    var pop = document.createElement("div");
    pop.className = "aipop"; pop.id = "aiPop";
    pop.innerHTML = '<div class="aip-ic">✨</div>'
      + '<h4>Check the dictation</h4>'
      + '<p>Review the text to make sure our AI writer understood everything.</p>'
      + '<label class="aip-check"><input type="checkbox" id="aiDontShow"/><span>Don’t show this message again</span></label>'
      + '<button type="button" class="btn btn-primary btn-block" data-action="ai-ok">Got it</button>';
    wrap.appendChild(pop);
    sc.addEventListener("click", function(){ dismissAiNotice(false); });
  }

  function fmtSecs(s){ return Math.floor(s/60)+":"+pad(s%60); }
  function startRec(mic){
    recState.active = true;
    recState.ta = mic.closest(".ta-wrap").querySelector("textarea");
    recState.start = Date.now();
    mic.classList.add("recording");
    var bar = el("recBar"); bar.classList.add("show");
    el("recTime").textContent = "0:00";
    recState.timer = setInterval(function(){
      el("recTime").textContent = fmtSecs(Math.round((Date.now()-recState.start)/1000));
    }, 250);
  }
  function stopRec(){
    if (!recState.active) return;
    recState.active = false;
    clearInterval(recState.timer);
    var bar = el("recBar"); if(bar) bar.classList.remove("show");
    document.querySelectorAll(".ta-mic.recording").forEach(function(m){ m.classList.remove("recording"); });
    var held = Date.now() - recState.start;
    var ta = recState.ta; recState.ta = null;
    if (held < 400 || !ta){ toast("Hold the mic to dictate","warn"); return; }
    var text = DICTATION_SAMPLES[Math.floor(Math.random()*DICTATION_SAMPLES.length)];
    var cur = ta.value.trim();
    ta.value = cur ? (cur + " " + text) : text;
    ta.dispatchEvent(new Event("input", { bubbles:true }));
    save();
    if (state.hideAiNotice){ toast("Dictation added","ok"); }
    else { showAiNotice(); }
  }
  document.addEventListener("pointerdown", function(e){
    var mic = e.target.closest("[data-ta-mic]");
    if (!mic) return;
    e.preventDefault(); e.stopPropagation();
    startRec(mic);
  });
  document.addEventListener("pointerup",     function(){ stopRec(); });
  document.addEventListener("pointercancel", function(){ stopRec(); });

  function showAiNotice(){
    var pop=el("aiPop"), sc=el("aiScrim"), cb=el("aiDontShow");
    if(cb) cb.checked=false;
    if(sc) sc.classList.add("show");
    if(pop) pop.classList.add("show");
  }
  function dismissAiNotice(explicit){
    var cb=el("aiDontShow");
    if (explicit && cb && cb.checked){ state.hideAiNotice=true; save(); }
    var pop=el("aiPop"), sc=el("aiScrim");
    if(sc) sc.classList.remove("show");
    if(pop) pop.classList.remove("show");
  }


  document.addEventListener("input", function(e){
    var m=e.target.getAttribute && e.target.getAttribute("data-model");
    var f=e.target.getAttribute && e.target.getAttribute("data-form");
    if (m && state.draft){ state.draft[m]=e.target.value; syncMap(m); }
    else if (f && state.draft){ state.draft.form[f]=e.target.value; }
    var stx=e.target.getAttribute && e.target.getAttribute("data-setting-text");
    if (stx){ state.settings[state.role][stx]=e.target.value; save(); }
    // don't save on every keystroke for perf; save on nav. But cheap enough:
  });
  document.addEventListener("change", function(e){
    var f=e.target.getAttribute && e.target.getAttribute("data-form");
    if (f && state.draft){ state.draft.form[f]=e.target.value; save(); }
    var m=e.target.getAttribute && e.target.getAttribute("data-model");
    if (m && state.draft){ state.draft[m]=e.target.value; save(); }
    // settings selects
    var st=e.target.getAttribute && e.target.getAttribute("data-setting");
    if (st){ state.settings[state.role][st]=e.target.value; save(); }
    if (e.target.hasAttribute && e.target.hasAttribute("data-setting-sort")){ state.officialSort=e.target.value; save(); }
  });
  function syncMap(m){ if(m==="zone"){ var tag=document.querySelector(".map-preview .zone-tag"); if(tag) tag.textContent=state.draft.zone||"Set the zone below"; } }

  function handleChoice(node){
    var wrap = node.closest("[data-form-choice],[data-form-yesno]");
    var id = wrap.getAttribute("data-form-choice") || wrap.getAttribute("data-form-yesno");
    var val = node.getAttribute("data-val");
    state.draft.form[id]=val;
    wrap.querySelectorAll(".choice").forEach(function(c){ c.classList.remove("sel","yes","no"); });
    if (wrap.hasAttribute("data-form-yesno")) node.classList.add("sel", val==="yes"?"yes":"no");
    else node.classList.add("sel");
    var fw=wrap.closest(".field"); if(fw) fw.classList.remove("invalid");
    save();
  }
  function handleCheck(item){
    var wrap=item.closest("[data-form-check]"); var id=wrap.getAttribute("data-form-check"); var val=item.getAttribute("data-val");
    var arr=Array.isArray(state.draft.form[id])?state.draft.form[id]:[];
    var i=arr.indexOf(val);
    if(i>=0){ arr.splice(i,1); item.classList.remove("on"); item.querySelector(".box").textContent=""; }
    else { arr.push(val); item.classList.add("on"); item.querySelector(".box").textContent="✓"; }
    state.draft.form[id]=arr;
    var fw=wrap.closest(".field"); if(fw && arr.length) fw.classList.remove("invalid");
    save();
  }

  function scrollTop(){ var b=$(".body"); if(b) b.scrollTop=0; }

  /* re-init signature on resize to keep canvas crisp (rare) */
  function afterRender(){
    // clock
    var d=new Date(); el("sbClock").textContent=pad(d.getHours())+":"+pad(d.getMinutes());
  }

  /* ======================================================================
     8. Boot
  ====================================================================== */
  if (!load()) seed();
  // safety: ensure notif structure exists
  if (!state.notif) { seed(); }
  // Mockup: always show the "not approved yet" ping banner on every refresh —
  // reset its dismissal and guarantee a soon-starting pending permit exists for the foreman.
  (function ensurePingScenario(){
    state.pingDismissed = null;
    var p = state.permits.filter(function(x){ return x.id==="p5"; })[0];
    if (p) { p.status="pending"; p.decision=null; p.start=nowShift(55); p.end=nowShift(180); }
    else {
      state.permits.push({
        id:"p5", serial:serialFor(142), typeId:"hot", status:"pending",
        title:"Ductwork tack-welding — Level 6 plant room", zone:"Level 6 · Plant room", detail:"AHU-2 supply duct, grid D3",
        start:nowShift(55), end:nowShift(180), workers:2,
        description:"Tack-weld supply-duct brackets onto structural steel in the L6 plant room.",
        form:{ method:"Welding", fireWatch:"yes", watchDuration:"60 minutes", extinguisher:"yes",
               prep:["Combustibles removed or fire-blanketed","Sprinklers / detection operational"],
               gasReading:"0% LEL", hazards:"Cable trays nearby — protected with welding blanket." },
        createdBy:"foreman", createdByName:USERS.foreman.name, createdAt:nowShift(-40),
        history:[
          { action:"created", actor:USERS.foreman.name, at:nowShift(-45) },
          { action:"submitted", actor:USERS.foreman.name, at:nowShift(-40) }
        ],
        decision:null
      });
    }
    save();
  })();
  ensureOverlays();
  render();
  setInterval(function(){ var d=new Date(); var c=el("sbClock"); if(c) c.textContent=pad(d.getHours())+":"+pad(d.getMinutes()); }, 30000);

  // expose for console/debug
  window.PTW = { reset:resetDemo, state:function(){return state;} };
})();
