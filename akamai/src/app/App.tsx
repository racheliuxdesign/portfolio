import Frame94 from "@/imports/Frame427320261-1/index";
import NewMitigationTab from "@/imports/DetailesPaneMitigationStepsTab1/index";
import { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import fiveSecondSummaryImg from "@/assets/case-study/5-second-summary.png";

// ── Recommended-mitigation action definitions (card order) ────────────────────
type MitigationAction = {
  title: string;
  text: string;
  bullets: string[];
  callout?: string; // green "reversible" note — omitted when not applicable
  confirmLabel: string;
};

const MITIGATION_ACTIONS: MitigationAction[] = [
  {
    title: "Suspend Sarah Chen's account?",
    text: "This immediately disables Single Sign-On and terminates every authenticated session across all connected apps. Sarah will be signed out everywhere and unable to log in until an admin restores access.",
    bullets: ["Blocks all SSO & app access instantly", "Terminates 3 active sessions", "Notifies IT Identity team"],
    callout: "Reversible — access can be restored by an IAM admin.",
    confirmLabel: "Suspend Account",
  },
  {
    title: "Block DESKTOP-7F3K2L9?",
    text: "This adds the device to the corporate blocklist and revokes its trust certificate, preventing it from connecting to any corporate resource. Any active connection from this device is dropped immediately.",
    bullets: ["Blocklists device DESKTOP-7F3K2L9", "Revokes the device trust certificate", "Drops current connections instantly"],
    callout: "Reversible — the device can be re-trusted by an endpoint admin.",
    confirmLabel: "Block Device",
  },
  {
    title: "Update the segmentation rule?",
    text: "This tightens the micro-segmentation policy between the Finance and HR segments so unmanaged endpoints can no longer reach sensitive file servers. The change applies to all matching traffic going forward.",
    bullets: ["Blocks unmanaged endpoints from Finance/HR", "Applies to all future connections", "Notifies the network policy owner"],
    callout: "Reversible — the rule can be rolled back from policy history.",
    confirmLabel: "Apply Rule",
  },
  {
    title: "Revoke Sarah Chen's active sessions?",
    text: "This invalidates every OAuth token and session cookie for Sarah Chen across all connected cloud applications. She will need to re-authenticate on her next sign-in, but her account stays enabled.",
    bullets: ["Invalidates all OAuth tokens & cookies", "Signs out 3 active sessions", "Account remains enabled"],
    callout: "Reversible — Sarah can sign in again to obtain new sessions.",
    confirmLabel: "Revoke Sessions",
  },
  {
    title: "Quarantine the 11 downloaded files?",
    text: "This restricts access to the 11 files exfiltrated in this incident and moves them to a quarantine hold pending security review. Existing share links stop working until the files are cleared.",
    bullets: ["Restricts the 11 exfiltrated files", "Disables existing share links", "Holds files pending review"],
    callout: "Reversible — files can be released by a security reviewer.",
    confirmLabel: "Quarantine Files",
  },
  {
    title: "Escalate to Incident Response?",
    text: "This opens a Priority 1 incident case and pages the on-call Incident Response lead. The IR team takes ownership and coordinates the response from here on.",
    bullets: ["Opens a P1 incident case", "Pages the on-call IR lead", "Hands off ownership to the IR team"],
    confirmLabel: "Escalate Now",
  },
];

// Builds the in-card expansion panel (same description + bullets as the modal).
function buildActionExpansion(def: MitigationAction): HTMLDivElement {
  const panel = document.createElement("div");
  panel.setAttribute("data-action-expansion", "");
  panel.style.cssText = "width:100%;box-sizing:border-box;padding:2px 19px 14px 19px;";

  const divider = document.createElement("div");
  divider.style.cssText = "height:1px;background:rgba(148,163,199,0.18);margin-bottom:12px;";
  panel.appendChild(divider);

  const desc = document.createElement("p");
  desc.textContent = def.text;
  desc.style.cssText = "font-family:'Heebo:Regular',sans-serif;font-size:12.5px;color:#41425a;line-height:1.6;margin:0 0 12px 0;";
  panel.appendChild(desc);

  const list = document.createElement("div");
  list.style.cssText = "display:flex;flex-direction:column;gap:8px;";
  def.bullets.forEach((b) => {
    const row = document.createElement("div");
    row.style.cssText = "display:flex;align-items:flex-start;gap:9px;";
    const dot = document.createElement("span");
    dot.style.cssText = "width:5px;height:5px;border-radius:999px;background:#0035e4;margin-top:6px;flex-shrink:0;";
    const txt = document.createElement("span");
    txt.textContent = b;
    txt.style.cssText = "font-family:'Heebo:Regular',sans-serif;font-size:12px;color:#51607a;line-height:1.5;";
    row.appendChild(dot);
    row.appendChild(txt);
    list.appendChild(row);
  });
  panel.appendChild(list);
  return panel;
}

// ── Submitted state UI — matches Frame154 exactly ─────────────────────────────
function SubmittedState({ onRevert }: { onRevert: () => void }) {
  return (
    <div className="content-stretch flex gap-[7px] items-center relative size-full">
      {/* Paragraph: checkmark + "False positive" */}
      <div className="h-[15px] relative shrink-0 w-[94px]">
        <div className="absolute content-stretch flex gap-[5px] items-center left-0 top-0">
          <div className="relative shrink-0 size-[12px]">
            <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12 12">
              <path d="M1.5 6.5L4.5 9.5L10.5 2.5" stroke="#16A34A" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
            </svg>
          </div>
          <p className="[word-break:break-word] font-['Heebo:Bold',sans-serif] font-bold leading-[normal] relative shrink-0 text-[#16a34a] text-[12.5px] text-center whitespace-nowrap">
            False positive
          </p>
        </div>
      </div>
      {/* Revert */}
      <button
        onClick={onRevert}
        style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}
        className="content-stretch flex flex-col items-center justify-center pt-[3px] relative shrink-0"
      >
        <p className="[text-underline-position:from-font] [word-break:break-word] decoration-from-font decoration-solid font-['Heebo:SemiBold',sans-serif] font-semibold leading-[17.25px] relative shrink-0 text-[#607aff] text-[11.5px] text-center underline whitespace-nowrap">
          Revert
        </p>
      </button>
    </div>
  );
}

// ── Modal ─────────────────────────────────────────────────────────────────────
function FalsePositiveModal({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: () => void;
}) {
  const MODAL_WIDTH = 520;
  const [reason, setReason] = useState("");
  const isHighSeverity = true;

  const handleSubmit = () => {
    if (!reason.trim()) return;
    onSubmit();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.4)", padding: 20 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="bg-white rounded-[12px] shadow-[0_8px_32px_rgba(0,0,0,0.18)] flex flex-col"
        style={{
          width: MODAL_WIDTH,
          maxWidth: "100%",
          maxHeight: "calc(100vh - 40px)",
          overflowY: "auto",
          fontFamily: "'Heebo', sans-serif",
        }}
      >
        <div className="flex items-center justify-between px-[28px] pt-[24px] pb-[16px]">
          <p style={{ fontSize: 17, fontWeight: 700, color: "#0f172a" }}>
            Mark Incident as False Positive
          </p>
          <button
            onClick={onClose}
            style={{
              width: 28, height: 28, display: "flex", alignItems: "center",
              justifyContent: "center", borderRadius: 6, border: "none",
              background: "transparent", cursor: "pointer", color: "#6c7c9c",
              fontSize: 18, lineHeight: 1,
            }}
          >×</button>
        </div>

        <div style={{ height: 1, backgroundColor: "rgba(148,163,199,0.18)" }} />

        <div className="px-[28px] pt-[20px]">
          {isHighSeverity && (
            <div
              className="mb-[18px] px-[14px] py-[11px] rounded-[8px] flex gap-[10px]"
              style={{ backgroundColor: "rgba(255,59,87,0.07)", border: "1px solid rgba(255,59,87,0.22)" }}
            >
              <span style={{ fontSize: 15, lineHeight: 1.4, flexShrink: 0 }}>⚠️</span>
              <p style={{ fontSize: 12.5, color: "#41425a", lineHeight: 1.6, margin: 0 }}>
                Incidents with a severity score above <strong>85</strong> require administrator
                approval before they can be marked as false positives.
              </p>
            </div>
          )}
          <p style={{ fontSize: 13, color: "#41425a", lineHeight: 1.65, marginBottom: 20 }}>
            Please explain why you believe this incident is a false positive. Your explanation
            is required and will be included in the approval request.
          </p>
          <div className="mb-[6px] flex items-center gap-[4px]">
            <label style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>Reason</label>
            <span style={{ fontSize: 13, color: "#e11d48", fontWeight: 700 }}>*</span>
          </div>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Type your reasoning here..."
            rows={4}
            style={{
              width: "100%", boxSizing: "border-box",
              border: "1px solid rgba(148,163,199,0.35)", borderRadius: 8,
              padding: "10px 13px", fontSize: 13, color: "#0f172a",
              fontFamily: "'Heebo', sans-serif", resize: "vertical",
              outline: "none", backgroundColor: "#fafafa", lineHeight: 1.6,
            }}
          />
          <p style={{ fontSize: 11, color: "#6c7c9c", marginTop: 6, marginBottom: 0 }}>
            * indicates a required field.
          </p>
        </div>

        <div style={{ height: 1, backgroundColor: "rgba(148,163,199,0.18)", marginTop: 20 }} />
        <div className="flex items-center justify-end gap-[10px] px-[28px] py-[18px]">
          <button
            onClick={onClose}
            style={{
              height: 36, padding: "0 18px", border: "1px solid #d1d5db", borderRadius: 6,
              backgroundColor: "white", fontSize: 13, fontWeight: 600, color: "#41425a",
              cursor: "pointer", fontFamily: "'Heebo', sans-serif",
            }}
          >Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={!reason.trim()}
            style={{
              height: 36, padding: "0 18px", border: "none", borderRadius: 6,
              backgroundColor: reason.trim() ? "#0f172a" : "#94a3b8",
              fontSize: 13, fontWeight: 700, color: "white",
              cursor: reason.trim() ? "pointer" : "not-allowed",
              fontFamily: "'Heebo', sans-serif", transition: "background-color 0.15s",
            }}
          >
            {isHighSeverity ? "Submit for Approval" : "Mark as False Positive"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Action confirmation modal (Recommended mitigation steps) ─────────────────
function ActionModal({ action, onClose }: { action: MitigationAction; onClose: () => void }) {
  const [acknowledged, setAcknowledged] = useState(false);

  const handleConfirm = () => {
    if (!acknowledged) return;
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.4)", padding: 20 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="bg-white rounded-[12px] shadow-[0_8px_32px_rgba(0,0,0,0.18)] flex flex-col"
        style={{
          width: 520,
          maxWidth: "100%",
          maxHeight: "calc(100vh - 40px)",
          overflowY: "auto",
          fontFamily: "'Heebo', sans-serif",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-[28px] pt-[24px] pb-[16px]">
          <p style={{ fontSize: 17, fontWeight: 700, color: "#0f172a", margin: 0 }}>{action.title}</p>
          <button
            onClick={onClose}
            style={{
              width: 28, height: 28, display: "flex", alignItems: "center",
              justifyContent: "center", borderRadius: 6, border: "none",
              background: "transparent", cursor: "pointer", color: "#6c7c9c",
              fontSize: 18, lineHeight: 1,
            }}
          >×</button>
        </div>

        <div style={{ height: 1, backgroundColor: "rgba(148,163,199,0.18)" }} />

        <div className="px-[28px] pt-[20px]">
          {/* Description */}
          <p style={{ fontSize: 13, color: "#41425a", lineHeight: 1.65, marginTop: 0, marginBottom: 18 }}>
            {action.text}
          </p>

          {/* Impact bullets */}
          <div style={{ display: "flex", flexDirection: "column", gap: 9, marginBottom: 18 }}>
            {action.bullets.map((b, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                <span style={{ width: 6, height: 6, borderRadius: 999, backgroundColor: "#0035e4", marginTop: 6, flexShrink: 0 }} />
                <span style={{ fontSize: 12.5, color: "#41425a", lineHeight: 1.5 }}>{b}</span>
              </div>
            ))}
          </div>

          {/* Green "reversible" callout (if applicable) */}
          {action.callout && (
            <div
              className="mb-[18px] px-[14px] py-[11px] rounded-[8px] flex gap-[10px]"
              style={{ backgroundColor: "rgba(28,179,118,0.08)", border: "1px solid rgba(28,179,118,0.28)" }}
            >
              <svg width="15" height="15" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
                <path d="M1.5 6.5L4.5 9.5L10.5 2.5" stroke="#16A34A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <p style={{ fontSize: 12.5, color: "#15803d", lineHeight: 1.55, margin: 0 }}>{action.callout}</p>
            </div>
          )}

          {/* Acknowledgement checkbox */}
          <label style={{ display: "flex", alignItems: "center", gap: 9, cursor: "pointer", userSelect: "none" }}>
            <input
              type="checkbox"
              checked={acknowledged}
              onChange={(e) => setAcknowledged(e.target.checked)}
              style={{ width: 15, height: 15, accentColor: "#0035e4", cursor: "pointer" }}
            />
            <span style={{ fontSize: 13, color: "#0f172a", fontWeight: 600 }}>I understand the impact of this action</span>
          </label>
        </div>

        <div style={{ height: 1, backgroundColor: "rgba(148,163,199,0.18)", marginTop: 20 }} />
        <div className="flex items-center justify-end gap-[10px] px-[28px] py-[18px]">
          <button
            onClick={onClose}
            style={{
              height: 36, padding: "0 18px", border: "1px solid #d1d5db", borderRadius: 6,
              backgroundColor: "white", fontSize: 13, fontWeight: 600, color: "#41425a",
              cursor: "pointer", fontFamily: "'Heebo', sans-serif",
            }}
          >Cancel</button>
          <button
            onClick={handleConfirm}
            disabled={!acknowledged}
            style={{
              height: 36, padding: "0 18px", border: "none", borderRadius: 6,
              backgroundColor: acknowledged ? "#0f172a" : "#94a3b8",
              fontSize: 13, fontWeight: 700, color: "white",
              cursor: acknowledged ? "pointer" : "not-allowed",
              fontFamily: "'Heebo', sans-serif", transition: "background-color 0.15s",
            }}
          >{action.confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

// ── App ───────────────────────────────────────────────────────────────────────
function IncidentDetailPane({ onViewFiles, open }: { onViewFiles: () => void; open: boolean }) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [showModal, setShowModal] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [action, setAction] = useState<MitigationAction | null>(null);

  const openModal = () => {
    setShowModal(true);
  };

  // DOM refs — set once, never recreated
  const fpContainerRef = useRef<HTMLElement | null>(null); // Frame86 (w-[156px] parent)
  const overlayRef = useRef<HTMLDivElement | null>(null);  // the injected overlay div
  const isSubmittedRef = useRef(false);
  const frame94RootRef = useRef<HTMLElement | null>(null);
  const sectionsRef = useRef<HTMLElement[]>([]);
  const typeSummaryRef = useRef<(() => void) | null>(null); // AI-summary typewriter (also drives the risk-score count-up)

  useEffect(() => { isSubmittedRef.current = isSubmitted; }, [isSubmitted]);

  // Trigger the AI-summary typewriter each time the panel opens.
  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => {
      typeSummaryRef.current?.();
    }, 250);
    return () => window.clearTimeout(t);
  }, [open]);

  // ── Strip all underlines from the imported design ────────────────────────────
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      [data-fp-pane] * { text-decoration: none !important; }
      [data-fp-pane] .fp-nav-link { cursor: pointer; }
      [data-fp-pane] .fp-nav-link:hover { color: #607aff !important; }
      [data-fp-pane] .fp-nav-link-dark { cursor: pointer; color: #0f172a !important; }
      [data-fp-pane] .fp-nav-link-dark:hover { color: #607aff !important; }
      [data-fp-pane] .fp-nav-link-muted { cursor: pointer; color: #64748b !important; }
      [data-fp-pane] .fp-nav-link-muted:hover { color: #607aff !important; }
      [data-ai-summary] * { color: #191921 !important; }
      [data-ai-summary] .ai-link { color: #0029F8 !important; cursor: pointer; }
      @keyframes fpTypeBlink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
      .fp-type-cursor { display: inline-block; width: 2px; height: 0.95em; background: #191921; margin-left: 1px; vertical-align: text-bottom; animation: fpTypeBlink 0.9s steps(1) infinite; }
    `;
    document.head.appendChild(style);
    return () => style.remove();
  }, []);

  // ── One-time setup ───────────────────────────────────────────────────────────
  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const frame94Root = wrapper.firstElementChild as HTMLElement;
    if (!frame94Root) return;

    frame94RootRef.current = frame94Root;

    // Scroll container
    frame94Root.style.overflowY = "auto";
    frame94Root.style.height = "100vh";

    // Sticky header
    const frame53 = frame94Root.children[0] as HTMLElement;
    if (frame53) {
      frame53.style.position = "sticky";
      frame53.style.top = "0";
      frame53.style.zIndex = "10";
      frame53.style.backgroundColor = "white";
    }

    // Left-align the four summary cards so their icons & titles line up vertically
    // (they ship with justify-center, which offsets each card by its own text width).
    ["Data exfiltration", "Unknown device", "Compromised user", "Behavior anomaly"].forEach((name) => {
      const card = frame94Root.querySelector(`[data-name="${name}"]`) as HTMLElement | null;
      const content = card?.querySelector('[class*="gap-[12px]"]') as HTMLElement | null;
      if (content) content.style.justifyContent = "flex-start";
    });

    // Tab navigation
    const frame95 = frame94Root.children[1] as HTMLElement;
    const sections = frame95 ? (Array.from(frame95.children) as HTMLElement[]) : [];
    sectionsRef.current = sections;
    // Mutable scroll-target array — index 2 gets overwritten after the mitigation replacement mounts
    const scrollTargets: (HTMLElement | undefined)[] = [...sections];
    const tabs = Array.from(frame94Root.querySelectorAll('[data-name="Tab"]')) as HTMLElement[];
    const HEADER_HEIGHT = 349;
    const tabHandlers: Array<() => void> = [];

    // Collect the <p> label inside each tab for font-weight toggling
    const tabLabels = tabs.map(
      (tab) => tab.querySelector("p") as HTMLElement | null
    );

    // Collect the underline bar (second child of each tab)
    const tabUnderlines = tabs.map(
      (tab) => tab.children[1] as HTMLElement | null
    );

    const setActiveTab = (activeIndex: number) => {
      tabLabels.forEach((label, j) => {
        if (!label) return;
        label.style.fontWeight = j === activeIndex ? "700" : "500";
        label.style.fontFamily = "'Heebo', sans-serif";
      });
      tabUnderlines.forEach((bar, j) => {
        if (!bar) return;
        bar.style.backgroundColor = j === activeIndex ? "black" : "transparent";
      });
    };

    // Tab 0 (Overview) starts active
    setActiveTab(0);

    tabs.forEach((tab, i) => {
      tab.style.cursor = "pointer";
      const handler = () => {
        setActiveTab(i);
        if (i === 0) { frame94Root.scrollTo({ top: 0, behavior: "smooth" }); return; }
        const target = scrollTargets[i]; // uses mutable array — picks up replacement div
        if (!target) return;
        const cr = frame94Root.getBoundingClientRect();
        const sr = target.getBoundingClientRect();
        frame94Root.scrollTo({ top: frame94Root.scrollTop + sr.top - cr.top - HEADER_HEIGHT, behavior: "smooth" });
      };
      tabHandlers.push(handler);
      tab.addEventListener("click", handler);
    });

    // Scroll spy — update active tab underline as user scrolls manually
    let lastActiveIdx = 0;
    const onScroll = () => {
      const cr = frame94Root.getBoundingClientRect();
      const threshold = cr.top + HEADER_HEIGHT + 40; // 40px below header = "in view"
      let newIdx = 0;
      scrollTargets.forEach((target, i) => {
        if (!target) return;
        const sr = target.getBoundingClientRect();
        if (sr.top <= threshold) newIdx = i;
      });
      if (newIdx !== lastActiveIdx) {
        lastActiveIdx = newIdx;
        setActiveTab(newIdx);
      }
    };
    frame94Root.addEventListener("scroll", onScroll);

    // Cleanup handles for the wired "Take action" buttons
    const actionCleanups: Array<() => void> = [];
    let actionRaf = 0;

    // Replace entire sections[2] (recommendations tab) with the new design.
    // The new import is a full-panel replacement (includes its own header + content),
    // so we swap at the section level, not the inner <So /> level.
    const mitigationSection = sections[2] as HTMLElement | undefined;
    if (mitigationSection) {
      mitigationSection.style.display = "none";
      const replacement = document.createElement("div");
      replacement.style.cssText = "flex-shrink:0;width:100%;";
      mitigationSection.parentElement?.insertBefore(replacement, mitigationSection.nextSibling);
      createRoot(replacement).render(<NewMitigationTab />);
      scrollTargets[2] = replacement; // tab 2 and scroll-spy now point to the live replacement div

      // Turn each "Take action" element into a real (accessible) button that opens
      // its action modal. The mitigation tab mounts in its own async React root,
      // so poll a few frames until its buttons commit to the DOM.
      const wireActionButtons = (): boolean => {
        const takeActionBtns = (Array.from(replacement.querySelectorAll('[data-name="Button"]')) as HTMLElement[])
          .filter((b) => b.textContent?.trim() === "Take action");
        if (takeActionBtns.length === 0) return false;

        // Neutralize the fixed-height / clipped ancestors so an expanded card can
        // grow and push the cards below it down (block flow) instead of being clipped.
        const so = replacement.querySelector('[data-name="so"]') as HTMLElement | null;
        if (so) { so.style.height = "auto"; so.style.overflow = "visible"; }
        const inner485 = replacement.querySelector('[class*="h-[485px]"]') as HTMLElement | null;
        if (inner485) inner485.style.height = "auto";
        const cardColumn = replacement.querySelector('[class*="w-[931px]"]') as HTMLElement | null;
        if (cardColumn) cardColumn.style.position = "static";

        takeActionBtns.forEach((btn, i) => {
          const def = MITIGATION_ACTIONS[i]; // DOM order matches the card order
          if (!def) return;
          btn.setAttribute("role", "button");
          btn.setAttribute("tabindex", "0");
          btn.style.cursor = "pointer";
          const clickHandler = (e: Event) => { e.stopPropagation(); setAction(def); };
          const keyHandler = (e: KeyboardEvent) => {
            if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setAction(def); }
          };
          btn.addEventListener("click", clickHandler);
          btn.addEventListener("keydown", keyHandler as EventListener);
          actionCleanups.push(() => {
            btn.removeEventListener("click", clickHandler);
            btn.removeEventListener("keydown", keyHandler as EventListener);
          });

          // Make the card's chevron an active expand/collapse control that reveals
          // the same description + bullet points as the action's confirmation modal.
          let card: HTMLElement | null = btn.parentElement;
          while (card && !(typeof card.className === "string" && card.className.includes("h-[84px]"))) {
            card = card.parentElement;
          }
          const chevron = card?.querySelector('[class*="scale-y-100"]') as HTMLElement | null;
          const chevronBtn = chevron?.parentElement as HTMLElement | null;
          if (card && chevron && chevronBtn) {
            chevronBtn.setAttribute("role", "button");
            chevronBtn.setAttribute("tabindex", "0");
            chevronBtn.setAttribute("aria-expanded", "false");
            chevronBtn.style.cursor = "pointer";
            // Caret baseline points down (collapsed); enable the rotate transition on
            // the next frame so it doesn't animate on first mount.
            chevron.style.transform = "rotate(180deg)";
            requestAnimationFrame(() => { chevron.style.transition = "transform 0.3s ease"; });
            const theCard = card;
            const rowWrapper = (Array.from(theCard.children) as HTMLElement[])
              .find((c) => !c.hasAttribute("aria-hidden"));
            let expanded = false;
            let panel: HTMLElement | null = null;
            const setExpanded = (next: boolean) => {
              expanded = next;
              chevronBtn.setAttribute("aria-expanded", String(expanded));
              if (expanded) {
                // Lock the original row to its collapsed height so its text & margins
                // don't shift up when the card grows to fit the expansion panel.
                if (rowWrapper) rowWrapper.style.height = theCard.getBoundingClientRect().height + "px";
                theCard.style.height = "auto";
                chevron.style.transform = "rotate(360deg)"; // rotate up (expanded)
                panel = buildActionExpansion(def);
                theCard.appendChild(panel);
              } else {
                chevron.style.transform = "rotate(180deg)"; // rotate back down (collapsed)
                if (panel) { panel.remove(); panel = null; }
                theCard.style.height = "";
                if (rowWrapper) rowWrapper.style.height = "";
              }
            };
            const chevClick = (e: Event) => { e.stopPropagation(); setExpanded(!expanded); };
            const chevKey = (e: KeyboardEvent) => {
              if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setExpanded(!expanded); }
            };
            chevronBtn.addEventListener("click", chevClick);
            chevronBtn.addEventListener("keydown", chevKey as EventListener);
            actionCleanups.push(() => {
              chevronBtn.removeEventListener("click", chevClick);
              chevronBtn.removeEventListener("keydown", chevKey as EventListener);
              if (panel) panel.remove();
            });
          }
        });
        return true;
      };
      let attempts = 0;
      const tryWire = () => {
        if (wireActionButtons() || attempts++ > 40) return;
        actionRaf = requestAnimationFrame(tryWire);
      };
      actionRaf = requestAnimationFrame(tryWire);
    }

    // "Downloaded files" card → turn the "11 files · 50 GB" pill into a "View files"
    // button (matching style) that slides in the Downloaded Files panel.
    const filesPill = (Array.from(frame94Root.querySelectorAll("p")) as HTMLElement[])
      .find((el) => el.textContent?.trim() === "11 files · 50 GB");
    if (filesPill) {
      filesPill.textContent = "View files";
      filesPill.style.color = "#2f52d8";
      filesPill.style.fontSize = "14px";
      const filesBtn = (filesPill.closest('[data-name="Button"]') as HTMLElement | null) ?? filesPill;
      // Task: remove the open-in-new-tab icon, leaving just the "View files" text
      filesBtn.querySelector('[data-name="cuida:open-in-new-tab-outline"]')?.remove();
      filesBtn.style.cursor = "pointer";
      filesBtn.setAttribute("role", "button");
      filesBtn.setAttribute("tabindex", "0");
      const openFiles = (e: Event) => { e.stopPropagation(); onViewFiles(); };
      const filesKey = (e: KeyboardEvent) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onViewFiles(); }
      };
      filesBtn.addEventListener("click", openFiles);
      filesBtn.addEventListener("keydown", filesKey as EventListener);
      actionCleanups.push(() => {
        filesBtn.removeEventListener("click", openFiles);
        filesBtn.removeEventListener("keydown", filesKey as EventListener);
      });
    }

    // Insert a "User profile" section as the first Supportive Data sub-section
    // (before the Associated devices block).
    const assocHeaderP = (Array.from(frame94Root.querySelectorAll("p")) as HTMLElement[])
      .find((el) => el.textContent?.trim() === "Associated devices");
    const assocBlock = assocHeaderP?.closest('[class*="gap-[24px]"]') as HTMLElement | null;
    if (assocBlock && assocBlock.parentElement && !assocBlock.previousElementSibling?.hasAttribute?.("data-user-profile")) {
      const userDiv = document.createElement("div");
      userDiv.setAttribute("data-user-profile", "");
      userDiv.style.cssText = "width:100%;";
      assocBlock.parentElement.insertBefore(userDiv, assocBlock);
      createRoot(userDiv).render(<UserProfileSection />);
    }

    // Replace the Associated devices table with the restructured 5-column version
    // (Asset Name · Managed device · Is HVA? · Type · Last known location).
    const assetNameHeader = (Array.from(frame94Root.querySelectorAll("p")) as HTMLElement[])
      .find((el) => el.textContent?.trim() === "Asset Name");
    const assocTable = assetNameHeader?.closest('[class*="inline-grid"]') as HTMLElement | null;
    if (assocTable && assocTable.parentElement) {
      assocTable.style.display = "none";
      const tableRepl = document.createElement("div");
      tableRepl.style.cssText = "width:100%;";
      assocTable.parentElement.insertBefore(tableRepl, assocTable.nextSibling);
      createRoot(tableRepl).render(<AssociatedDevicesTable />);
    }

    // Update label pill colors in "Why this severity" (sections[0].children[1]) to match new design
    const whySection = sections[0]?.children[1] as HTMLElement | undefined;
    if (whySection) {
        const pillUpdates: Array<{ text: string; bg?: string; color: string }> = [
        { text: "Outside 100% of activity", bg: "#ffefe8", color: "#ff4900" },
        { text: "First seen tonight",        bg: "#ffefe8", color: "#ff4900" },
        { text: "~2.4M records",             bg: "#ffefe8", color: "#ff4900" },
        { text: "Off-network",               bg: "#fdf6ea", color: "#cb7f00" },
        // text-only color changes (bg unchanged)
        { text: "250× baseline",             color: "#ec0017" },
        { text: "+32",                       color: "#ec0017" },
      ];
      pillUpdates.forEach(({ text, bg, color }) => {
        const p = (Array.from(whySection.querySelectorAll("p")) as HTMLElement[])
          .find((el) => el.textContent?.trim() === text);
        if (!p) return;
        if (bg) (p.parentElement as HTMLElement).style.backgroundColor = bg;
        p.style.color = color;
      });

      // Update banner gradient
      const bannerLabel = (Array.from(whySection.querySelectorAll("p")) as HTMLElement[])
        .find((el) => el.textContent?.trim() === "Overall risk score");
      const banner = bannerLabel?.closest('[style*="linear-gradient"]') as HTMLElement | null;
      if (banner) {
        banner.style.backgroundImage =
          "linear-gradient(93.5415deg, rgb(255, 2, 2) 3.0928%, rgb(204, 0, 0) 10.684%, rgb(0, 0, 0) 100.05%)";
      }
    }

    // Find "Mark as False Positive" button
    const label = (Array.from(frame94Root.querySelectorAll("p")) as HTMLElement[])
      .find((el) => el.textContent?.trim() === "Mark as False Positive");
    const fpButton = label?.closest('[data-name="Button"]') as HTMLElement | null;

    // AI Incident Summary — mark card, color all text #191921, links #0029F8
    // The summary card is the first child of Frame72 (sections[0])
    const aiSummaryCard = sections[0]?.children[0] as HTMLElement | undefined;
    if (aiSummaryCard) {
      // Mark the card so CSS rules apply
      aiSummaryCard.setAttribute("data-ai-summary", "");

      // Tag blue link spans by their Tailwind class name (before CSS overrides computed color)
      (Array.from(aiSummaryCard.querySelectorAll("span")) as HTMLElement[])
        .filter((el) => el.className.includes("607aff"))
        .forEach((el) => {
          el.classList.add("ai-link");
          el.addEventListener("click", (e) => {
            e.stopPropagation();
            const supportiveData = sectionsRef.current[3];
            if (!supportiveData) return;
            const cr = frame94Root.getBoundingClientRect();
            const sr = supportiveData.getBoundingClientRect();
            frame94Root.scrollTo({
              top: frame94Root.scrollTop + sr.top - cr.top - HEADER_HEIGHT,
              behavior: "smooth",
            });
          });
        });

      // Prepare a typewriter reveal for the AI summary body paragraph. We reveal
      // characters across the existing formatted spans (bold/links preserved),
      // with a blinking cursor — like an AI chat streaming its response. The risk
      // score (the "95" ring) is driven off the SAME progress so both finish together.
      const scoreEl = (Array.from(frame94Root.querySelectorAll("p")) as HTMLElement[])
        .find((el) => el.textContent?.trim() === "95" && el.className.includes("JetBrains"));
      const setScore = (fraction: number) => {
        if (scoreEl) scoreEl.textContent = String(Math.round(fraction * 95));
      };

      const summaryP = (Array.from(aiSummaryCard.querySelectorAll("p")) as HTMLElement[])
        .find((el) => el.textContent?.includes("immediate containment"));
      if (summaryP) {
        // Collect all text nodes in order + their full text.
        const walker = document.createTreeWalker(summaryP, NodeFilter.SHOW_TEXT);
        const parts: { node: Text; text: string }[] = [];
        let tn = walker.nextNode();
        while (tn) { parts.push({ node: tn as Text, text: tn.nodeValue ?? "" }); tn = walker.nextNode(); }
        const totalChars = parts.reduce((s, p) => s + p.text.length, 0);

        // Reserve the final height so content below doesn't jump while typing.
        summaryP.style.minHeight = summaryP.offsetHeight + "px";

        const cursor = document.createElement("span");
        cursor.className = "fp-type-cursor";

        let typeTimer: number | undefined;
        const applyShown = (shown: number) => {
          let remaining = shown;
          for (const p of parts) {
            if (remaining <= 0) { p.node.nodeValue = ""; continue; }
            if (remaining >= p.text.length) { p.node.nodeValue = p.text; remaining -= p.text.length; }
            else { p.node.nodeValue = p.text.slice(0, remaining); remaining = 0; }
          }
        };

        typeSummaryRef.current = () => {
          if (typeTimer) window.clearInterval(typeTimer);
          applyShown(0);
          setScore(0);
          if (!cursor.parentNode) summaryP.appendChild(cursor);
          let shown = 0;
          const CHARS_PER_TICK = 4; // ~250 chars/sec — fast but readable
          const TICK_MS = 16;
          typeTimer = window.setInterval(() => {
            shown = Math.min(shown + CHARS_PER_TICK, totalChars);
            applyShown(shown);
            setScore(shown / totalChars); // count the score in lockstep with the text
            summaryP.appendChild(cursor); // keep cursor after the revealed text
            if (shown >= totalChars) {
              window.clearInterval(typeTimer);
              typeTimer = undefined;
              setScore(1);
              window.setTimeout(() => cursor.remove(), 500);
            }
          }, TICK_MS);
        };

        // Start hidden until the panel first opens.
        applyShown(0);
        setScore(0);
      }
    }

    // "Behavior anomaly" → scroll to "Why this severity" section (2nd child of Frame72 = sections[0])
    const behaviorAnomalyLabel = (Array.from(frame94Root.querySelectorAll("p")) as HTMLElement[])
      .find((el) => el.textContent?.trim() === "Behavior anomaly");
    if (behaviorAnomalyLabel) {
      behaviorAnomalyLabel.classList.add("fp-nav-link-dark");

      behaviorAnomalyLabel.addEventListener("click", () => {
        // "Why this severity" is Section2 — the 2nd child of Frame72 (sections[0])
        const frame72 = sectionsRef.current[0];
        const whyThisSeverity = frame72?.children[1] as HTMLElement | undefined;
        const target = whyThisSeverity ?? frame72;
        if (!target) return;
        const cr = frame94Root.getBoundingClientRect();
        const sr = target.getBoundingClientRect();
        frame94Root.scrollTo({
          top: frame94Root.scrollTop + sr.top - cr.top - HEADER_HEIGHT,
          behavior: "smooth",
        });
      });
    }

    // "Sarah Chen" (all instances) → scroll to Supportive Data section (sections[3])
    const scrollToSupportiveData = () => {
      const supportiveData = sectionsRef.current[3];
      if (!supportiveData) return;
      const cr = frame94Root.getBoundingClientRect();
      const sr = supportiveData.getBoundingClientRect();
      frame94Root.scrollTo({
        top: frame94Root.scrollTop + sr.top - cr.top - HEADER_HEIGHT,
        behavior: "smooth",
      });
    };
    (Array.from(frame94Root.querySelectorAll("p, span")) as HTMLElement[])
      .filter((el) => el.textContent?.trim() === "Sarah Chen")
      .forEach((el) => {
        el.classList.add("fp-nav-link-muted");
        el.addEventListener("click", scrollToSupportiveData);
      });

    // "Unknown device" → scroll to the "Associated devices" section
    const unknownDeviceLabel = (Array.from(frame94Root.querySelectorAll("p")) as HTMLElement[])
      .find((el) => el.textContent?.trim() === "Unknown device");
    if (unknownDeviceLabel) {
      unknownDeviceLabel.classList.add("fp-nav-link-dark");

      unknownDeviceLabel.addEventListener("click", () => {
        const assocEl = (Array.from(frame94Root.querySelectorAll("p")) as HTMLElement[])
          .find((el) => el.textContent?.trim() === "Associated devices");
        const target = assocEl ?? sectionsRef.current[3];
        if (!target) return;
        const cr = frame94Root.getBoundingClientRect();
        const sr = target.getBoundingClientRect();
        frame94Root.scrollTo({
          top: frame94Root.scrollTop + sr.top - cr.top - HEADER_HEIGHT,
          behavior: "smooth",
        });
      });
    }

    // "50 GB · customer PII" → open the Downloaded Files side panel
    const downloadLabel = (Array.from(frame94Root.querySelectorAll("p")) as HTMLElement[])
      .find((el) => el.textContent?.trim() === "50 GB · customer PII");
    if (downloadLabel) {
      downloadLabel.classList.add("fp-nav-link-muted");
      const downloadHandler = () => { onViewFiles(); };
      downloadLabel.addEventListener("click", downloadHandler);
    }

    if (fpButton) {
      // Frame86 is the direct parent of the Button
      const frame86 = fpButton.parentElement as HTMLElement;
      fpContainerRef.current = frame86;

      // Hide the original button visually and put an overlay div over it
      // We use position:relative on Frame86 and render our React content as an absolute overlay
      frame86.style.position = "relative";

      fpButton.style.cursor = "pointer";
      const fpClickHandler = (e: Event) => {
        e.stopPropagation();
        if (!isSubmittedRef.current) openModal();
      };
      fpButton.addEventListener("click", fpClickHandler);

      return () => {
        tabs.forEach((tab, i) => tab.removeEventListener("click", tabHandlers[i]));
        frame94Root.removeEventListener("scroll", onScroll);
        fpButton.removeEventListener("click", fpClickHandler);
        actionCleanups.forEach((fn) => fn());
        cancelAnimationFrame(actionRaf);
      };
    }

    return () => {
      tabs.forEach((tab, i) => tab.removeEventListener("click", tabHandlers[i]));
      frame94Root.removeEventListener("scroll", onScroll);
      actionCleanups.forEach((fn) => fn());
      cancelAnimationFrame(actionRaf);
    };
  }, []);

  // ── Swap between original button and submitted state ─────────────────────────
  // We use a single overlay div injected into Frame86.
  // When submitted: hide original Button, show overlay.
  // When reverted: remove overlay, restore original Button.
  useEffect(() => {
    const frame86 = fpContainerRef.current;
    if (!frame86) return;

    const originalButton = frame86.querySelector('[data-name="Button"]') as HTMLElement | null;

    if (isSubmitted) {
      // Hide original button
      if (originalButton) originalButton.style.visibility = "hidden";

      // Create overlay if not already there
      if (!overlayRef.current) {
        const overlay = document.createElement("div");
        overlay.style.cssText =
          "position:absolute;inset:0;display:flex;align-items:center;";
        frame86.appendChild(overlay);
        overlayRef.current = overlay;
      }

      // Render SubmittedState into the overlay using innerHTML + event delegation
      // (avoids nested React roots entirely)
      const overlay = overlayRef.current;
      overlay.innerHTML = `
        <div style="display:flex;gap:7px;align-items:center;width:100%;">
          <div style="height:15px;position:relative;flex-shrink:0;width:94px;">
            <div style="position:absolute;display:flex;gap:5px;align-items:center;left:0;top:0;">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style="flex-shrink:0">
                <path d="M1.5 6.5L4.5 9.5L10.5 2.5" stroke="#16A34A" stroke-width="1.8"
                  stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <span style="font-family:'Heebo',sans-serif;font-weight:700;font-size:12.5px;
                color:#16a34a;white-space:nowrap;">False positive</span>
            </div>
          </div>
          <button id="fp-revert-btn" style="background:none;border:none;padding:3px 0 0 0;
            cursor:pointer;font-family:'Heebo',sans-serif;font-weight:600;font-size:11.5px;
            color:#607aff;text-decoration:underline;white-space:nowrap;flex-shrink:0;">
            Revert
          </button>
        </div>
      `;

      // Wire Revert — use a fresh ref-stable setter via the overlay element's dataset
      const revertBtn = overlay.querySelector("#fp-revert-btn") as HTMLElement;
      if (revertBtn) {
        revertBtn.addEventListener("click", () => setIsSubmitted(false));
      }
    } else {
      // Remove overlay
      if (overlayRef.current) {
        overlayRef.current.remove();
        overlayRef.current = null;
      }
      // Restore original button
      if (originalButton) originalButton.style.visibility = "";
    }
  }, [isSubmitted]);

  return (
    <>
      <div style={{ width: "1050px" }} data-fp-pane ref={wrapperRef}>
        <Frame94 />
      </div>
      {showModal && (
        <FalsePositiveModal
          onClose={() => setShowModal(false)}
          onSubmit={() => setIsSubmitted(true)}
        />
      )}
      {action && (
        <ActionModal action={action} onClose={() => setAction(null)} />
      )}
    </>
  );
}

// ── Alert-queue showcase ─────────────────────────────────────────────────────
const F = {
  extrabold: "'Heebo:ExtraBold', sans-serif",
  bold: "'Heebo:Bold', sans-serif",
  semibold: "'Heebo:SemiBold', sans-serif",
  medium: "'Heebo:Medium', sans-serif",
  regular: "'Heebo:Regular', sans-serif",
};

type QueueAlert = {
  id: string;
  name: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  score: number;
  user: string;
  role: string;
  device: string;
  location: string;
  detected: string;
  status: string;
  tone: "green" | "blue" | "amber" | "gray";
  clickable?: boolean;
};

const QUEUE_ALERTS: QueueAlert[] = [
  { id: "A4471", name: "Suspicious Data Download", severity: "CRITICAL", score: 95, user: "Sarah Chen", role: "Finance", device: "Windows 11", location: "Beijing, CH", detected: "02:48 AM PST", status: "Ring-fencing active", tone: "green", clickable: true },
  { id: "A4468", name: "Impossible Travel Sign-In", severity: "HIGH", score: 82, user: "Marcus Lee", role: "Sales", device: "macOS · MacBook", location: "Lagos, NG", detected: "01:12 AM PST", status: "Investigating", tone: "blue" },
  { id: "A4460", name: "Mass File Encryption Detected", severity: "HIGH", score: 76, user: "svc-backup", role: "Service account", device: "Ubuntu Server", location: "On-prem DC", detected: "12:03 AM PST", status: "Containment pending", tone: "amber" },
  { id: "A4455", name: "Anomalous OAuth Grant", severity: "MEDIUM", score: 58, user: "Priya Nair", role: "Engineering", device: "iOS · iPhone", location: "Mumbai, IN", detected: "11:41 PM PST", status: "Triage", tone: "blue" },
  { id: "A4451", name: "Privilege Escalation Attempt", severity: "MEDIUM", score: 47, user: "dev-jenkins", role: "CI pipeline", device: "Windows Server", location: "Azure WE", detected: "10:58 PM PST", status: "Monitoring", tone: "gray" },
];

const SEV: Record<QueueAlert["severity"], { bg: string; text: string; dot: string }> = {
  CRITICAL: { bg: "#FDECEC", text: "#D92D20", dot: "#E5242A" },
  HIGH: { bg: "#FFF1E6", text: "#EA580C", dot: "#F97316" },
  MEDIUM: { bg: "#FEF7E0", text: "#B7791F", dot: "#F5B301" },
  LOW: { bg: "#EEF1F6", text: "#5B6B86", dot: "#94A3B8" },
};

const TONE: Record<QueueAlert["tone"], { bg: string; text: string }> = {
  green: { bg: "#E7F7F0", text: "#1CB376" },
  blue: { bg: "#EAF0FF", text: "#607AFF" },
  amber: { bg: "#FEF7E0", text: "#B7791F" },
  gray: { bg: "#EEF1F6", text: "#64748B" },
};

const GRID = "150px 1.7fr 1.1fr 1.1fr 130px 178px";

function AlertQueue({ activeId, open, onRowClick }: { activeId: string; open: boolean; onRowClick: (a: QueueAlert) => void }) {
  return (
    <div className="min-h-screen w-full bg-[#f4f6fb] flex justify-center">
      <div className="w-full max-w-[1180px] px-[28px] py-[26px]">
        {/* Header */}
        <div className="flex items-end justify-between mb-[20px]">
          <div>
            <div className="flex items-center gap-[10px]">
              <p style={{ fontFamily: F.extrabold, fontSize: 26, color: "#0f172a" }}>Alert Queue</p>
              <span style={{ fontFamily: F.bold, fontSize: 11, color: "#607aff", background: "#EAF0FF", borderRadius: 999, padding: "3px 9px", letterSpacing: "0.04em" }}>5 OPEN</span>
            </div>
            <p style={{ fontFamily: F.medium, fontSize: 13, color: "#64748b", marginTop: 3 }}>Akamai Guardicore · Security Operations Center</p>
          </div>
          <div className="flex items-center gap-[18px]">
            {["All", "Critical", "High", "Medium"].map((f, i) => (
              <div key={f} className="flex flex-col items-center gap-[6px]">
                <p style={{ fontFamily: i === 0 ? F.bold : F.medium, fontSize: 13, color: i === 0 ? "#0f172a" : "#94a3b8" }}>{f}</p>
                <div style={{ height: 2, width: "100%", background: i === 0 ? "#0f172a" : "transparent" }} />
              </div>
            ))}
          </div>
        </div>

        {/* Table card */}
        <div className="bg-white rounded-[14px] border border-[#eef1f6] overflow-hidden" style={{ boxShadow: "0px 4px 20px 0px rgba(15,23,42,0.05)" }}>
          {/* Column header */}
          <div className="grid items-center px-[22px] py-[13px] border-b border-[#eef1f6] bg-[#fafbfd]" style={{ gridTemplateColumns: GRID }}>
            {["SEVERITY", "ALERT", "USER", "DEVICE", "DETECTED", "STATUS"].map((h) => (
              <p key={h} style={{ fontFamily: F.bold, fontSize: 10.5, letterSpacing: "0.08em", color: "#94a3b8" }}>{h}</p>
            ))}
          </div>

          {/* Rows */}
          {QUEUE_ALERTS.map((a) => {
            const sev = SEV[a.severity];
            const tone = TONE[a.tone];
            const isActive = open && a.id === activeId;
            return (
              <div
                key={a.id}
                onClick={() => a.clickable && onRowClick(a)}
                className="grid items-center px-[22px] py-[15px] border-b border-[#f2f4f8] last:border-b-0"
                style={{
                  gridTemplateColumns: GRID,
                  cursor: a.clickable ? "pointer" : "default",
                  background: isActive ? "#F5F7FF" : "transparent",
                  boxShadow: isActive ? "inset 3px 0 0 0 #607aff" : "none",
                  transition: "background 0.15s ease",
                }}
                onMouseEnter={(e) => { if (!isActive) (e.currentTarget as HTMLDivElement).style.background = "#fafbff"; }}
                onMouseLeave={(e) => { if (!isActive) (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}
              >
                {/* Severity */}
                <div>
                  <span className="inline-flex items-center gap-[7px] rounded-full" style={{ background: sev.bg, padding: "4px 11px 4px 9px" }}>
                    <span style={{ width: 7, height: 7, borderRadius: 999, background: sev.dot }} />
                    <span style={{ fontFamily: F.bold, fontSize: 11, color: sev.text }}>{a.severity}</span>
                    <span style={{ fontFamily: F.extrabold, fontSize: 11, color: sev.text }}>{a.score}</span>
                  </span>
                </div>
                {/* Alert */}
                <div className="pr-[16px] overflow-hidden">
                  <p style={{ fontFamily: F.semibold, fontSize: 14, color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{a.name}</p>
                  <p style={{ fontFamily: F.medium, fontSize: 12, color: "#94a3b8", marginTop: 1 }}>#{a.id}</p>
                </div>
                {/* User */}
                <div className="pr-[12px]">
                  <p style={{ fontFamily: F.semibold, fontSize: 13, color: "#334155", whiteSpace: "nowrap" }}>{a.user}</p>
                  <p style={{ fontFamily: F.medium, fontSize: 12, color: "#94a3b8" }}>{a.role}</p>
                </div>
                {/* Device */}
                <div className="pr-[12px]">
                  <p style={{ fontFamily: F.semibold, fontSize: 13, color: "#334155", whiteSpace: "nowrap" }}>{a.device}</p>
                  <p style={{ fontFamily: F.medium, fontSize: 12, color: "#94a3b8" }}>{a.location}</p>
                </div>
                {/* Detected */}
                <div>
                  <p style={{ fontFamily: F.medium, fontSize: 12.5, color: "#64748b", whiteSpace: "nowrap" }}>{a.detected}</p>
                </div>
                {/* Status */}
                <div className="flex items-center justify-between gap-[8px]">
                  <span style={{ background: tone.bg, color: tone.text, fontFamily: F.bold, fontSize: 11, borderRadius: 999, padding: "4px 10px", whiteSpace: "nowrap" }}>{a.status}</span>
                  <svg width="7" height="12" viewBox="0 0 7 12" fill="none" style={{ opacity: a.clickable ? 0.5 : 0, flexShrink: 0 }}>
                    <path d="M1 1l5 5-5 5" stroke="#94a3b8" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>
            );
          })}
        </div>

        {/* Hint */}
        <p style={{ textAlign: "center", fontFamily: F.medium, fontSize: 12, color: "#b6c0d1", marginTop: 18, opacity: open ? 0 : 1, transition: "opacity 0.3s ease" }}>
          Opening the top incident…
        </p>
      </div>
    </div>
  );
}

// ── User profile section (Supportive data — first block) ─────────────────────
function UserProfileSection() {
  const anomalies = [
    { label: "Last login", value: "02:48 AM PST", note: "Off-hours — outside normal working window" },
    { label: "Last login location", value: "Beijing, China", note: "Outside the corporate network" },
  ];
  const baseline = [
    "Typically signs in from the corporate network",
    "Normal active hours: 8:00 AM – 4:00 PM (PST)",
    "Usual location: San Francisco, CA",
    "Largest single-file interaction on record: 25 MB",
  ];
  return (
    <div style={{ width: "100%", fontFamily: "'Heebo', sans-serif" }}>
      {/* Section header — matches the "Associated devices" heading style */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: "#000", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
            <circle cx="10" cy="6.5" r="3" stroke="#6AE1FF" strokeWidth="1.6" />
            <path d="M4.5 16c0-3 2.5-4.6 5.5-4.6s5.5 1.6 5.5 4.6" stroke="#6AE1FF" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </div>
        <span style={{ fontFamily: F.medium, fontSize: 14, color: "#41425a", letterSpacing: "-0.2px" }}>User profile</span>
      </div>

      {/* Card */}
      <div style={{ border: "1px solid #eef1f6", borderRadius: 14, background: "white", overflow: "hidden", boxShadow: "0 1px 3px rgba(15,23,42,0.03)" }}>
        {/* Identity */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 18px" }}>
          <div style={{ width: 46, height: 46, borderRadius: 999, background: "linear-gradient(135deg,#607aff,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <span style={{ fontFamily: F.extrabold, fontSize: 16, color: "white" }}>SC</span>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                <span style={{ fontFamily: F.bold, fontSize: 16, color: "#0f172a" }}>Sarah Chen</span>
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" style={{ display: "block" }}>
                  <path d="M6 3H3.5A1.5 1.5 0 0 0 2 4.5v8A1.5 1.5 0 0 0 3.5 14h8a1.5 1.5 0 0 0 1.5-1.5V10" stroke="#607aff" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M9.5 2.5H13.5V6.5" stroke="#607aff" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M13 3L7.5 8.5" stroke="#607aff" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <span style={{ fontFamily: F.bold, fontSize: 10.5, color: "#607aff", background: "#EAF0FF", borderRadius: 999, padding: "2px 9px", letterSpacing: "0.04em" }}>FINANCE</span>
            </div>
            <span style={{ fontFamily: F.medium, fontSize: 12.5, color: "#64748b" }}>Senior Financial Analyst · sarah.chen@company.com</span>
          </div>
        </div>

        <div style={{ height: 1, background: "#eef1f6" }} />

        {/* Anomaly facts (red) */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
          {anomalies.map((f, i) => (
            <div key={f.label} style={{ padding: "14px 18px", borderRight: i === 0 ? "1px solid #eef1f6" : "none" }}>
              <div style={{ fontFamily: F.semibold, fontSize: 11, color: "#94a3b8", letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: 5 }}>{f.label}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <span style={{ width: 6, height: 6, borderRadius: 999, background: "#ec2a3f", flexShrink: 0 }} />
                <span style={{ fontFamily: F.bold, fontSize: 14, color: "#ec2a3f" }}>{f.value}</span>
              </div>
              <div style={{ fontFamily: F.medium, fontSize: 11.5, color: "#ec2a3f", opacity: 0.85, marginTop: 3 }}>{f.note}</div>
            </div>
          ))}
        </div>

        <div style={{ height: 1, background: "#eef1f6" }} />

        {/* User baseline (AI summary) */}
        <div style={{ padding: "16px 18px", background: "linear-gradient(180deg, rgba(96,122,255,0.035), rgba(96,122,255,0))" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <span style={{ fontFamily: F.bold, fontSize: 13, color: "#0f172a" }}>User baseline</span>
            <span style={{ fontFamily: F.medium, fontSize: 11, color: "#64748b" }}>AI behavioral summary</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {baseline.map((b) => (
              <div key={b} style={{ display: "flex", alignItems: "flex-start", gap: 9 }}>
                <span style={{ width: 5, height: 5, borderRadius: 999, background: "#607aff", marginTop: 6, flexShrink: 0 }} />
                <span style={{ fontFamily: F.regular, fontSize: 13, color: "#41425a", lineHeight: 1.5 }}>{b}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Associated devices table (Supportive data) — restructured 5-column version ─
type AssocDevice = { name: string; managed: "Yes" | "No"; hva: "Yes" | "No"; type: string; location: string; ip: string; suspicious?: boolean };

const ASSOC_DEVICES: AssocDevice[] = [
  { name: "win11-A7K2", managed: "No", hva: "No", type: "Unknown", location: "Beijing, China", ip: "192.167.1.50", suspicious: true },
  { name: "DESKTOP-A7K2", managed: "Yes", hva: "No", type: "Personal device", location: "SF, CA", ip: "10.20.4.15" },
  { name: "SHAREPOINT", managed: "Yes", hva: "Yes", type: "Server", location: "Corporate", ip: "10.0.0.12" },
];

const ASSOC_GRID = "1.4fr 1.05fr 0.65fr 1.1fr 1.1fr 1fr";

function AssociatedDevicesTable() {
  const cols = ["Asset Name", "Managed device", "Is HVA?", "Type", "Last known location", "Last known IP address"];
  return (
    <div style={{ width: "100%", fontFamily: "'Heebo', sans-serif" }}>
      {/* header row */}
      <div style={{ display: "grid", gridTemplateColumns: ASSOC_GRID, alignItems: "center", padding: "12px 8px", borderBottom: "1px solid #ebeaf1" }}>
        {cols.map((c) => (
          <span key={c} style={{ fontFamily: F.semibold, fontSize: 14, color: "#41425a" }}>{c}</span>
        ))}
      </div>
      {/* data rows */}
      {ASSOC_DEVICES.map((d) => {
        const managed = d.managed === "Yes"
          ? { bg: "#E4F6EE", text: "#0F9D6C" }
          : { bg: "#FDECEC", text: "#D92D20" };
        return (
          <div
            key={d.name}
            title={d.suspicious ? "Suspicious device used to download the files" : undefined}
            style={{
              display: "grid", gridTemplateColumns: ASSOC_GRID, alignItems: "center",
              padding: "17px 8px 17px", borderBottom: "1px solid #ebeaf1",
              background: d.suspicious ? "#FEF4F4" : "transparent",
              boxShadow: d.suspicious ? "inset 3px 0 0 0 #ec2a3f" : "none",
            }}
          >
            <span style={{ fontFamily: F.medium, fontSize: 14, color: "#607aff" }}>{d.name}</span>
            <span>
              <span style={{ background: managed.bg, color: managed.text, fontFamily: F.bold, fontSize: 11.5, borderRadius: 6, padding: "3px 11px", letterSpacing: "0.02em" }}>{d.managed}</span>
            </span>
            <span style={{ fontFamily: F.regular, fontSize: 14, color: "#6b7280" }}>{d.hva}</span>
            <span style={{ fontFamily: F.regular, fontSize: 14, color: "#6b7280" }}>{d.type}</span>
            <span style={{ fontFamily: F.regular, fontSize: 14, color: "#6b7280" }}>{d.location}</span>
            <span style={{ fontFamily: F.regular, fontSize: 13.5, color: d.suspicious ? "#ec2a3f" : "#6b7280" }}>{d.ip}</span>
          </div>
        );
      })}
    </div>
  );
}

// ── Downloaded Files panel (drill-down from the "Downloaded files" card) ──────
type DownloadedFile = {
  name: string;
  type: "DB" | "CSV" | "ZIP" | "PDF" | "XLSX" | "BAK";
  meta: string;
  cls: "RESTRICTED" | "CONFIDENTIAL" | "INTERNAL";
  size: string;
};

const DOWNLOADED_FILES: DownloadedFile[] = [
  { name: "Payment_Card_Records_2024.db", type: "DB", meta: "912K records", cls: "RESTRICTED", size: "12.1 GB" },
  { name: "Customer_PII_Master.csv", type: "CSV", meta: "1.4M records", cls: "RESTRICTED", size: "8.7 GB" },
  { name: "Tax_Records_Archive.zip", type: "ZIP", meta: "220K docs", cls: "CONFIDENTIAL", size: "6.8 GB" },
  { name: "Banking_Details_Export.csv", type: "CSV", meta: "310K records", cls: "CONFIDENTIAL", size: "5.4 GB" },
  { name: "Credit_Risk_Models.zip", type: "ZIP", meta: "48 models", cls: "INTERNAL", size: "4.0 GB" },
  { name: "Contracts_Signed_2024.pdf", type: "PDF", meta: "1,204 files", cls: "CONFIDENTIAL", size: "3.2 GB" },
  { name: "Vendor_Bank_Accounts.csv", type: "CSV", meta: "6,800 records", cls: "CONFIDENTIAL", size: "2.9 GB" },
  { name: "Insurance_Claims_Full.csv", type: "CSV", meta: "74K records", cls: "CONFIDENTIAL", size: "2.4 GB" },
  { name: "Q4_Customer_Financials.xlsx", type: "XLSX", meta: "38 sheets", cls: "CONFIDENTIAL", size: "2.3 GB" },
  { name: "Salary_Compensation_Data.xlsx", type: "XLSX", meta: "2,140 records", cls: "RESTRICTED", size: "1.1 GB" },
  { name: "Audit_Financials_Backup.bak", type: "BAK", meta: "1 archive", cls: "CONFIDENTIAL", size: "1.1 GB" },
];

const FILE_TYPE_STYLE: Record<DownloadedFile["type"], { bg: string; text: string }> = {
  DB: { bg: "#EDE9FE", text: "#7C3AED" },
  CSV: { bg: "#E4F6EE", text: "#0F9D6C" },
  ZIP: { bg: "#FEF3C7", text: "#B7791F" },
  PDF: { bg: "#FDE7EA", text: "#E11D48" },
  XLSX: { bg: "#E4F6EE", text: "#059669" },
  BAK: { bg: "#E3F1FB", text: "#2F72E6" },
};

const CLASS_STYLE: Record<DownloadedFile["cls"], { bg: string; text: string }> = {
  RESTRICTED: { bg: "#FDECEC", text: "#D92D20" },
  CONFIDENTIAL: { bg: "#FCEFDD", text: "#B7791F" },
  INTERNAL: { bg: "#E3F1FB", text: "#2F72E6" },
};

const PER_PAGE_OPTIONS = [5, 8, 10, 25];

function DownloadIcon({ color = "#94a3b8" }: { color?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M8 2.5v7m0 0L5.2 6.7M8 9.5l2.8-2.8" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3 11v1.5A1.5 1.5 0 0 0 4.5 14h7a1.5 1.5 0 0 0 1.5-1.5V11" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function DownloadedFilesPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [perPage, setPerPage] = useState(8);
  const [page, setPage] = useState(0);

  const total = DOWNLOADED_FILES.length;
  const counts = { RESTRICTED: 0, CONFIDENTIAL: 0, INTERNAL: 0 } as Record<DownloadedFile["cls"], number>;
  DOWNLOADED_FILES.forEach((f) => { counts[f.cls] += 1; });

  const pageCount = Math.max(1, Math.ceil(total / perPage));
  const clampedPage = Math.min(page, pageCount - 1);
  const start = clampedPage * perPage;
  const pageFiles = DOWNLOADED_FILES.slice(start, start + perPage);

  const chip = (label: string, n: number, cls: DownloadedFile["cls"]) => (
    <span style={{ background: CLASS_STYLE[cls].bg, color: CLASS_STYLE[cls].text, fontFamily: F.bold, fontSize: 11, letterSpacing: "0.03em", borderRadius: 999, padding: "5px 11px", whiteSpace: "nowrap" }}>
      {n} {label}
    </span>
  );

  return (
    <div
      style={{
        position: "fixed", top: 0, right: 0, height: "100vh", zIndex: 70,
        width: "1050px", maxWidth: "100vw", background: "#f9fafc",
        transform: open ? "translateX(0)" : "translateX(100%)",
        transition: "transform 0.5s cubic-bezier(0.22,1,0.36,1)",
        boxShadow: open ? "-24px 0 70px rgba(15,23,42,0.28)" : "none",
        overflowY: "auto", fontFamily: "'Heebo', sans-serif",
      }}
    >
      {/* Fixed/sticky header: back button, title, mini dashboard, search */}
      <div style={{ position: "sticky", top: 0, zIndex: 2, background: "#f9fafc", borderBottom: "1px solid #eef1f6", boxShadow: "0 6px 16px rgba(15,23,42,0.04)" }}>
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "22px 28px 16px" }}>
          {/* 1. Back button + context */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 26 }}>
          <button
            onClick={onClose}
            style={{
              display: "flex", alignItems: "center", gap: 8, background: "transparent",
              border: "none", padding: "9px 4px",
              cursor: "pointer", fontFamily: F.bold, fontSize: 13.5, color: "#2f52d8",
            }}
          >
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
              <path d="M9.5 3L5 7.5l4.5 4.5" stroke="#2f52d8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back to investigation
          </button>
        </div>

        {/* 2. Title */}
        <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 8 }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
            <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4h3.8a1.5 1.5 0 0 1 1.06.44L11.8 5.6h6.7A1.5 1.5 0 0 1 20 7.1V17a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5.5Z" stroke="#f59e0b" strokeWidth="1.7" strokeLinejoin="round" />
          </svg>
          <p style={{ fontFamily: F.extrabold, fontSize: 25, color: "#0f172a", margin: 0 }}>Downloaded Files</p>
        </div>
        <p style={{ fontFamily: F.regular, fontSize: 14, color: "#64748b", margin: "0 0 20px 2px" }}>
          Exact objects transferred from the corporate Cloud Drive — ranked by size.
        </p>

        {/* 3. Mini dashboard */}
        <div
          style={{
            display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16,
            background: "linear-gradient(96deg, rgba(255,59,87,0.06), rgba(255,145,152,0.04))",
            border: "1px solid #ffc9cf", borderRadius: 12, padding: "16px 20px", marginBottom: 22,
          }}
        >
          <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
            <span style={{ fontFamily: F.extrabold, fontSize: 26, color: "#ec2a3f", letterSpacing: "0.5px" }}>50.0 GB</span>
            <span style={{ fontFamily: F.medium, fontSize: 14, color: "#64748b" }}>across {total} files</span>
          </div>
          <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
            {chip("RESTRICTED", counts.RESTRICTED, "RESTRICTED")}
            {chip("CONFIDENTIAL", counts.CONFIDENTIAL, "CONFIDENTIAL")}
            {chip("INTERNAL", counts.INTERNAL, "INTERNAL")}
          </div>
        </div>

          {/* Search box (showcase only — non-functional) */}
          <div style={{ position: "relative", marginTop: 4 }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
              <circle cx="7" cy="7" r="4.5" stroke="#94a3b8" strokeWidth="1.5" />
              <path d="M11 11l3 3" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <input
              type="text"
              placeholder="Search file name..."
              readOnly
              style={{
                width: "100%", boxSizing: "border-box", height: 40,
                padding: "0 14px 0 38px", borderRadius: 9, border: "1px solid #e2e7f0",
                background: "white", fontFamily: F.medium, fontSize: 13, color: "#0f172a", outline: "none",
              }}
            />
          </div>
        </div>
      </div>

      {/* Scrollable body: file list + pagination */}
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "18px 28px 60px" }}>
        {/* 4. File list */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {pageFiles.map((f) => {
            const ts = FILE_TYPE_STYLE[f.type];
            const cs = CLASS_STYLE[f.cls];
            return (
              <div
                key={f.name}
                style={{
                  display: "flex", alignItems: "center", gap: 15, background: "white",
                  border: "1px solid #eef1f6", borderRadius: 12, padding: "13px 16px",
                  boxShadow: "0 1px 3px rgba(15,23,42,0.03)",
                }}
              >
                {/* type badge */}
                <div style={{ width: 40, height: 40, borderRadius: 10, background: ts.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ fontFamily: F.extrabold, fontSize: 10, letterSpacing: "0.04em", color: ts.text }}>{f.type}</span>
                </div>
                {/* name + meta + classification */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontFamily: F.bold, fontSize: 14, color: "#0f172a", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{f.name}</p>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 3 }}>
                    <span style={{ fontFamily: F.medium, fontSize: 12, color: "#94a3b8" }}>{f.meta}</span>
                    <span style={{ color: "#cbd5e1", fontSize: 11 }}>·</span>
                    <span style={{ background: cs.bg, color: cs.text, fontFamily: F.bold, fontSize: 9.5, letterSpacing: "0.05em", borderRadius: 4, padding: "2px 6px" }}>{f.cls}</span>
                  </div>
                </div>
                {/* size */}
                <span style={{ fontFamily: F.bold, fontSize: 13.5, color: "#334155", whiteSpace: "nowrap", flexShrink: 0 }}>{f.size}</span>
                {/* download */}
                <button
                  title={"Download " + f.name}
                  style={{ width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 8, border: "none", background: "transparent", cursor: "pointer", flexShrink: 0 }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#f1f5f9"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
                >
                  <DownloadIcon />
                </button>
              </div>
            );
          })}
        </div>

        {/* 5. Pagination */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 22, paddingTop: 4 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontFamily: F.medium, fontSize: 12.5, color: "#64748b" }}>Rows per page:</span>
            <select
              value={perPage}
              onChange={(e) => { setPerPage(Number(e.target.value)); setPage(0); }}
              style={{ fontFamily: F.semibold, fontSize: 12.5, color: "#0f172a", border: "1px solid #d8dfec", borderRadius: 7, padding: "5px 8px", background: "white", cursor: "pointer", outline: "none" }}
            >
              {PER_PAGE_OPTIONS.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <span style={{ fontFamily: F.medium, fontSize: 12.5, color: "#64748b" }}>
              {start + 1}–{Math.min(start + perPage, total)} of {total}
            </span>
            {[
              { dir: -1, label: "Previous", disabled: clampedPage === 0, d: "M9 3L5 7.5l4 4.5" },
              { dir: 1, label: "Next", disabled: clampedPage >= pageCount - 1, d: "M6 3l4 4.5L6 12" },
            ].map((b) => (
              <button
                key={b.label}
                aria-label={b.label}
                disabled={b.disabled}
                onClick={() => setPage((p) => Math.min(Math.max(p + b.dir, 0), pageCount - 1))}
                style={{
                  width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center",
                  borderRadius: 8, border: "1px solid #d8dfec", background: "white",
                  cursor: b.disabled ? "not-allowed" : "pointer", opacity: b.disabled ? 0.4 : 1,
                }}
              >
                <svg width="14" height="15" viewBox="0 0 15 15" fill="none">
                  <path d={b.d} stroke="#0f172a" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Live demo (the original app — unchanged) ─────────────────────────────────
function LiveDemo() {
  const [open, setOpen] = useState(false);
  const [showFiles, setShowFiles] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setOpen(true), 3500);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="relative min-h-screen w-full">
      <AlertQueue activeId="A4471" open={open} onRowClick={() => setOpen(true)} />

      {/* Dimmed backdrop */}
      <div
        onClick={() => setOpen(false)}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 40,
          background: "rgba(15,23,42,0.45)",
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          transition: "opacity 0.45s ease",
        }}
      />

      {/* Back-to-queue control */}
      <button
        onClick={() => setOpen(false)}
        style={{
          position: "fixed",
          top: 20,
          left: 20,
          zIndex: 60,
          display: "flex",
          alignItems: "center",
          gap: 7,
          background: "white",
          border: "1px solid #e6e9f0",
          borderRadius: 999,
          padding: "8px 14px",
          cursor: "pointer",
          fontFamily: F.semibold,
          fontSize: 13,
          color: "#0f172a",
          boxShadow: "0 4px 14px rgba(15,23,42,0.12)",
          opacity: open ? 1 : 0,
          transform: open ? "translateX(0)" : "translateX(-8px)",
          pointerEvents: open ? "auto" : "none",
          transition: "opacity 0.3s ease 0.15s, transform 0.3s ease 0.15s",
        }}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M9 2L4 7l5 5" stroke="#0f172a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Back to queue
      </button>

      {/* Right-side detail drawer */}
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          height: "100vh",
          zIndex: 50,
          width: "1050px",
          maxWidth: "100vw",
          background: "white",
          transform: open ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.55s cubic-bezier(0.22,1,0.36,1)",
          boxShadow: open ? "-24px 0 70px rgba(15,23,42,0.28)" : "none",
        }}
      >
        <IncidentDetailPane onViewFiles={() => setShowFiles(true)} open={open} />
      </div>

      {/* Downloaded Files drill-down: dim backdrop + right-side panel (over the incident drawer) */}
      <div
        onClick={() => setShowFiles(false)}
        style={{
          position: "fixed", inset: 0, zIndex: 65,
          background: "rgba(15,23,42,0.4)",
          opacity: showFiles ? 1 : 0,
          pointerEvents: showFiles ? "auto" : "none",
          transition: "opacity 0.4s ease",
        }}
      />
      <DownloadedFilesPanel open={showFiles} onClose={() => setShowFiles(false)} />
    </div>
  );
}

// ── Top navigation ───────────────────────────────────────────────────────────
type TopTab = "demo" | "presentation";

function TopNav({ tab, onTab }: { tab: TopTab; onTab: (t: TopTab) => void }) {
  const tabs: { id: TopTab; label: string }[] = [
    { id: "demo", label: "Live Demo" },
    { id: "presentation", label: "Case Study Presentation" },
  ];
  return (
    <div
      style={{
        height: 60, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 26px", background: "#0f172a", borderBottom: "1px solid rgba(255,255,255,0.06)",
        fontFamily: "'Heebo', sans-serif", zIndex: 10,
      }}
    >
      {/* Brand */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 34, height: 34, borderRadius: 9, background: "linear-gradient(135deg,#607aff,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
            <path d="M12 3l7 3v5c0 4.6-3 8.2-7 10-4-1.8-7-5.4-7-10V6l7-3z" stroke="#fff" strokeWidth="1.7" strokeLinejoin="round" />
            <path d="M9 12l2.2 2.2L15.5 10" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <span style={{ fontFamily: F.bold, fontSize: 16, color: "#fff", letterSpacing: "-0.2px" }}>Racheli's Home Assignment</span>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        {tabs.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => onTab(t.id)}
              style={{
                border: "none", cursor: "pointer",
                background: active ? "#e5242a" : "transparent",
                color: active ? "#fff" : "#94a3b8",
                fontFamily: active ? F.bold : F.semibold, fontSize: 14,
                padding: "9px 18px", borderRadius: 9, transition: "background 0.15s, color 0.15s",
                boxShadow: active ? "0 4px 14px rgba(229,36,42,0.4)" : "none",
              }}
              onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLButtonElement).style.color = "#cbd5e1"; }}
              onMouseLeave={(e) => { if (!active) (e.currentTarget as HTMLButtonElement).style.color = "#94a3b8"; }}
            >
              {t.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Case study presentation (Tab 2) ──────────────────────────────────────────

// Shared editorial building blocks ------------------------------------------------

function CaseH2({ n, title }: { n: string; title: string }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: 18, margin: "56px 0 22px" }}>
      <span style={{ fontFamily: F.extrabold, fontSize: 15, color: "#607aff", letterSpacing: "0.08em", flexShrink: 0 }}>{n}</span>
      <h2 style={{ fontFamily: F.extrabold, fontSize: 27, color: "#0f172a", margin: 0 }}>{title}</h2>
    </div>
  );
}

function CaseH3({ children }: { children: React.ReactNode }) {
  return (
    <h3 style={{ fontFamily: F.bold, fontSize: 17.5, color: "#0f172a", margin: "30px 0 10px" }}>{children}</h3>
  );
}

function CaseH4({ children }: { children: React.ReactNode }) {
  return (
    <h4 style={{ fontFamily: F.bold, fontSize: 14.5, color: "#0f172a", margin: "20px 0 8px", letterSpacing: "0.01em" }}>{children}</h4>
  );
}

function CaseP({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontFamily: F.regular, fontSize: 15, color: "#51607a", lineHeight: 1.75, margin: "0 0 14px" }}>{children}</p>
  );
}

function CaseList({ items }: { items: (string | { lead: string; rest: string })[] }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 11, margin: "8px 0 18px" }}>
      {items.map((item, i) => (
        <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 11 }}>
          <span style={{ width: 6, height: 6, borderRadius: 999, background: "#607aff", marginTop: 8, flexShrink: 0 }} />
          <span style={{ fontFamily: F.regular, fontSize: 14.5, color: "#41425a", lineHeight: 1.65 }}>
            {typeof item === "string" ? item : (
              <>
                <span style={{ fontFamily: F.bold, color: "#0f172a" }}>{item.lead}</span>
                {" — "}{item.rest}
              </>
            )}
          </span>
        </div>
      ))}
    </div>
  );
}

function CaseQuote({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        margin: "18px 0 22px", padding: "18px 22px", borderLeft: "3px solid #607aff",
        background: "#f7f8fc", borderRadius: "0 10px 10px 0",
      }}
    >
      <p style={{ fontFamily: F.semibold, fontSize: 16.5, color: "#0f172a", fontStyle: "italic", margin: 0, lineHeight: 1.5 }}>
        “{children}”
      </p>
    </div>
  );
}

function CasePic({ label, ratio = "16/9", src }: { label: string; ratio?: string; src?: string }) {
  if (src) {
    return (
      <figure style={{ margin: "20px 0 26px" }}>
        <div
          style={{
            width: "100%", borderRadius: 12, border: "1px solid #e9edf5", background: "#fff",
            boxShadow: "0 6px 20px rgba(15,23,42,0.06)", overflow: "hidden",
          }}
        >
          <img src={src} alt={label} style={{ display: "block", width: "100%", height: "auto" }} />
        </div>
        <figcaption style={{ fontFamily: F.medium, fontSize: 12.5, color: "#94a3b8", textAlign: "center", marginTop: 10 }}>
          {label}
        </figcaption>
      </figure>
    );
  }
  return (
    <div
      style={{
        margin: "20px 0 26px", aspectRatio: ratio, width: "100%", borderRadius: 12,
        border: "1.5px dashed #c7d0e0", background: "#f7f8fc",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8,
      }}
    >
      <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
        <rect x="2.5" y="4.5" width="19" height="15" rx="2" stroke="#c7d0e0" strokeWidth="1.6" />
        <circle cx="8" cy="10" r="1.7" stroke="#c7d0e0" strokeWidth="1.6" />
        <path d="M4 16.5l5-5 4 4 3-3 4.5 4.5" stroke="#c7d0e0" strokeWidth="1.6" strokeLinejoin="round" />
      </svg>
      <span style={{ fontFamily: F.semibold, fontSize: 12.5, color: "#94a3b8", textAlign: "center", padding: "0 20px" }}>{label}</span>
    </div>
  );
}

function CaseStudyPresentation({ onViewDemo }: { onViewDemo: () => void }) {
  return (
    <div style={{ position: "absolute", inset: 0, overflowY: "auto", background: "#f7f8fc", fontFamily: "'Heebo', sans-serif" }}>
      {/* Hero */}
      <div
        style={{
          padding: "70px 40px 60px", textAlign: "center",
          background: "radial-gradient(1200px 380px at 50% -80px, rgba(96,122,255,0.14), rgba(96,122,255,0) 70%), #ffffff",
          borderBottom: "1px solid #eef1f6",
        }}
      >
        <span style={{ display: "inline-block", fontFamily: F.bold, fontSize: 11.5, letterSpacing: "0.14em", color: "#607aff", background: "#EAF0FF", borderRadius: 999, padding: "6px 14px", marginBottom: 22 }}>
          CASE STUDY
        </span>
        <h1 style={{ fontFamily: F.extrabold, fontSize: 40, lineHeight: 1.15, color: "#0f172a", margin: "0 auto 18px", maxWidth: 820 }}>
          Designing the Details Pane <span style={{ color: "#607aff" }}>→</span> A verdict in 5 seconds
        </h1>
        <p style={{ fontFamily: F.regular, fontSize: 17, lineHeight: 1.6, color: "#64748b", margin: "0 auto 32px", maxWidth: 680 }}>
          How I designed an incident details pane that lets a security analyst absorb the essential facts,
          trust the system's reasoning, and know the next best action — in five seconds.
        </p>
        <button
          onClick={onViewDemo}
          style={{
            display: "inline-flex", alignItems: "center", gap: 10, border: "none", cursor: "pointer",
            background: "linear-gradient(135deg,#607aff,#4f46e5)", color: "#fff",
            fontFamily: F.bold, fontSize: 16, padding: "15px 34px", borderRadius: 12,
            boxShadow: "0 12px 34px rgba(96,122,255,0.35)",
          }}
        >
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M4 3.2v9.6l8-4.8-8-4.8z" fill="#fff" /></svg>
          View demo
        </button>
      </div>

      {/* Sections */}
      <div style={{ maxWidth: 780, margin: "0 auto", padding: "18px 40px 100px" }}>

        {/* 01 — The Goal ------------------------------------------------------ */}
        <CaseH2 n="01" title="The Goal of the Details Pane" />
        <CaseP>
          The goal of the details pane is to allow the user to make a verdict in 5 seconds. I wanted to achieve that by:
        </CaseP>
        <CaseList
          items={[
            { lead: "Getting the essence across", rest: "surface the most significant information in a very short and focused way." },
            { lead: "Giving the user confidence", rest: "show the reasoning behind the system's conclusions, not just the verdict." },
            { lead: "Removing the need to think about the next step", rest: "recommend the best course of action." },
          ]}
        />

        {/* 02 — The Solution & Work Process ----------------------------------- */}
        <CaseH2 n="02" title="The Solution & Work Process" />

        <CaseH3>Getting the essence of the most significant information — very short and focused</CaseH3>
        <CaseP>
          This part of the details pane was the most challenging. I constantly changed the content and hierarchy
          (see the trade-off examples). I kept asking myself: what are the absolute minimum things the user needs
          to know to make a good decision? I also struggled with how to present everything when the user only has
          about 5 seconds to absorb the information.
        </CaseP>
        <CaseP>Eventually, I decided on this structure.</CaseP>

        <CaseH4>Top section</CaseH4>
        <CaseP>The very top presents the bottom line:</CaseP>
        <CaseList
          items={[
            "The incident title",
            "What mitigation steps have already been taken",
            "A False Positive button that's always visible",
          ]}
        />
        <CaseP>
          I intentionally kept the False Positive action outside of the tabs. If a user scans only the header and
          already knows this is a false positive, they shouldn't have to dig through the interface just to find
          that action.
        </CaseP>

        <CaseH4>The 5-second summary</CaseH4>
        <CaseP>I organized the information by importance:</CaseP>
        <CaseList
          items={[
            { lead: "Bottom line first", rest: "severity and score, with the system confidence shown as secondary information." },
            { lead: "What happened", rest: "in the shortest wording possible (for example, Data Exfiltration)." },
            { lead: "Where it happened", rest: "the affected asset and its location." },
            { lead: "Who is involved", rest: "the compromised user." },
            { lead: "What the system concluded", rest: "for example, Behavior Anomaly." },
          ]}
        />
        <CaseP>
          I felt this combination gives users enough context to quickly decide whether this incident is serious and
          worth investigating further — or whether it's likely a false positive.
        </CaseP>
        <CasePic label="The 5-second summary layout" ratio="16/10" src={fiveSecondSummaryImg} />

        <CaseH4>Trade-offs</CaseH4>
        <CasePic label="Trade-off examples explored for content & hierarchy" ratio="16/10" />

        <CaseH3>Giving users confidence in the system's conclusion through transparency</CaseH3>
        <CaseP>I wanted users to trust the system, not just accept its verdict.</CaseP>
        <CaseP>
          To achieve that, I broke the score into the different signals that contributed to it. By showing the
          weight and severity of each factor, users can understand why the system reached its conclusion instead of
          treating it as a black box.
        </CaseP>
        <CasePic label="Score breakdown by contributing signal" ratio="16/9" />
        <CaseP>Another way to build trust is through the timeline.</CaseP>
        <CaseP>
          Showing chronological evidence — timestamps, who was involved, and what happened at each stage — helps
          users validate the investigation themselves. Once they understand the evidence, they're much more likely
          to trust both the score and the recommended mitigation.
        </CaseP>
        <CasePic label="Chronological timeline of evidence" ratio="16/9" />

        <CaseH4>Info Banner</CaseH4>
        <CaseP>
          The details pane contains many contextual links. Almost every entity in the incident — for example,
          Sarah's name or a device name — is clickable.
        </CaseP>
        <CaseP>
          These links don't take the user to another page. Instead, they jump directly to the relevant section
          within the details pane, providing additional background and supporting evidence. I'll talk more about
          this later in the Supportive Data section.
        </CaseP>

        <CaseH3>The user shouldn't have to think about the next action</CaseH3>
        <CaseP>This section also went through many iterations.</CaseP>
        <CaseList
          items={[
            "At first, I organized recommendations by mitigation order.",
            "Then I grouped them into tactical versus strategic recommendations.",
            "Later I tried separating AI recommendations from system recommendations.",
          ]}
        />
        <CaseP>Eventually, I realized something important: the user doesn't want to analyze different recommendation categories. They simply want to know:</CaseP>
        <CaseQuote>What is the best thing I should do right now?</CaseQuote>
        <CaseP>
          That doesn't mean the other recommendations aren't valuable — they're still important for improving the
          organization's overall security posture. But in the current moment, one action matters more than the
          others.
        </CaseP>
        <CaseP>
          So I separated the top recommendation into its own section called <strong style={{ color: "#0f172a", fontFamily: F.semibold }}>Most Recommended Mitigation Plan</strong>, followed by the rest of the recommendations.
        </CaseP>
        <CasePic label="Most Recommended Mitigation Plan, separated from the rest" ratio="16/9" />

        <CaseH4>Building confidence before taking action</CaseH4>
        <CaseP>
          Next, I designed the guardrails that would appear after clicking Take Action. The original idea was to
          show the list of actions the system would perform, along with the consequences.
        </CaseP>
        <CaseP>Then I realized another UX problem.</CaseP>
        <CaseP>
          Users might never click Take Action because they may assume the action is executed immediately. If they
          don't understand what will happen, they'll avoid using the feature altogether.
        </CaseP>
        <CaseP>Instead, I made each recommendation card expandable. Clicking the card reveals:</CaseP>
        <CaseList
          items={[
            "The actions that will be performed",
            "The expected consequences",
            "Additional context",
          ]}
        />
        <CaseP>
          This allows users to understand exactly what they're approving before committing, giving them the
          confidence to take real action based on knowledge rather than uncertainty.
        </CaseP>
        <CasePic label="Expandable recommendation card, revealing actions & consequences" ratio="16/9" />

        {/* 03 — Supportive Data ------------------------------------------------ */}
        <CaseH2 n="03" title="Supportive Data" />
        <CaseP>This section also required several design decisions. I asked myself:</CaseP>
        <CaseQuote>What information helps users determine whether this incident is true or false, without overwhelming the main summary?</CaseQuote>
        <CaseP>
          This information isn't the star of the page, but it provides the context and evidence needed to support
          the investigation. I decided to include:
        </CaseP>
        <CaseList
          items={[
            "Information about the involved user",
            "The affected devices",
            "The stolen files",
          ]}
        />

        <CaseH4>User</CaseH4>
        <CaseP>
          I chose to present Sarah's information as a card focused on her normal behavior rather than simply
          listing profile details. This makes it much easier to understand why the current activity is considered
          anomalous.
        </CaseP>
        <CasePic label="Sarah Chen's normal-behavior profile card" ratio="16/9" />

        <CaseH4>Devices</CaseH4>
        <CaseP>
          I presented the devices in a table because tables are great for scanning, comparing information, and
          scaling to many items without becoming overwhelming.
        </CaseP>

        <CaseH4>Files</CaseH4>
        <CaseP>
          For the stolen files, I deliberately avoided placing them directly in the main details pane. A long file
          list can consume a lot of valuable screen space, especially for users who don't need it.
        </CaseP>
        <CaseP>Instead, I added a link that opens an in-context side panel (see demo) containing:</CaseP>
        <CaseList
          items={[
            "All file properties",
            "Search capabilities",
            "Download actions",
          ]}
        />
        <CaseP>
          This approach keeps the main panel clean while still providing a much richer experience for users who
          want to investigate the files in depth. They stay on the same page, use the full height of the panel, and
          can comfortably browse a large number of files.
        </CaseP>
        <CasePic label="Downloaded files side panel" ratio="16/9" />

        {/* 04 — Reflection ------------------------------------------------------ */}
        <CaseH2 n="04" title="Reflection" />
        <CaseP>
          This project was especially interesting because it combined UX challenges with technical challenges while
          I was also evolving the way I work with AI.
        </CaseP>
        <CaseP>
          I used Figma (Design + Make), Claude (Chat + Code), and GitHub to create both the prototype and this
          presentation. AI was involved throughout the entire process:
        </CaseP>
        <CaseList
          items={[
            "Learning about Zero Trust",
            "Researching competitors",
            "Brainstorming solutions",
            "Exploring visual directions",
            "Sketching ideas",
            "Writing technical content",
            "QA and iteration",
          ]}
        />
        <CaseP>
          Today, I honestly can't imagine my workflow without AI. It has completely changed the way I design. The
          transition between different AI tools still isn't seamless, but each one brings unique strengths and
          opens new possibilities.
        </CaseP>
        <CaseP>
          Over time, I've built my own workflows and prompting techniques, and I'm constantly refining them. But
          above all, the most important part is still my own judgment — knowing how to combine all these tools into
          one coherent design that truly serves the user's goal.
        </CaseP>
        <CasePic label="Workflow across Figma, Claude, and GitHub" ratio="16/9" />
      </div>
    </div>
  );
}

// ── Root: 2-tab shell wrapping the live demo + the case study ─────────────────
export default function App() {
  const [tab, setTab] = useState<TopTab>("demo");
  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden", background: "#fff" }}>
      <TopNav tab={tab} onTab={setTab} />
      {/* Content area — `transform` makes the demo's fixed panels resolve against
          this box (below the nav) instead of the whole viewport. */}
      <div style={{ flex: 1, minHeight: 0, position: "relative", overflow: "hidden", transform: "translateZ(0)" }}>
        {tab === "demo" ? <LiveDemo /> : <CaseStudyPresentation onViewDemo={() => setTab("demo")} />}
      </div>
    </div>
  );
}
