(function () {
  "use strict";

  const STORAGE_KEY = "akamai-side-panel-audit-v1";
  const THEME_KEY = "akamai-side-panel-theme-v1";

  const riskFactors = [
    {
      title: "Download volume anomaly",
      description: "50GB downloaded in 43 minutes, 18.6x above Sarah's 30-day after-hours baseline.",
      score: "+34"
    },
    {
      title: "Sensitive customer data concentration",
      description: "87% of files contain billing exports, contract terms, customer IDs, or regulated PII.",
      score: "+24"
    },
    {
      title: "Unrecognized unmanaged device",
      description: "First-seen macOS endpoint has no MDM certificate, no EDR sensor, and a fresh browser profile.",
      score: "+22"
    },
    {
      title: "Rare off-hours access pattern",
      description: "Activity occurred at 2:00 AM, outside Sarah's normal access window and peer cohort behavior.",
      score: "+15"
    }
  ];

  const recommendations = [
    {
      id: "suspendUser",
      title: "Suspend user account",
      description: "Temporarily disable Sarah's identity sessions while the download is investigated.",
      impact: "Sarah Chen will be signed out of all corporate apps and blocked from new sign-ins until an admin re-enables the account.",
      guardrail: "Recommended only after reviewing file sensitivity and device evidence. Generates a SOC audit event and can be reversed by Identity Admin.",
      confirmation: "SUSPEND",
      confidence: "AI confidence 91%",
      severity: "Critical containment",
      cta: "Suspend user"
    },
    {
      id: "blockDevice",
      title: "Block unrecognized device",
      description: "Deny future cloud-drive access from the unmanaged MacBook fingerprint.",
      impact: "The specific device fingerprint mcp-7f91-unknown will be blocked from cloud-drive and identity sessions.",
      guardrail: "Scoped to the device fingerprint only. Does not block Sarah's managed workstation or known mobile device.",
      confirmation: "BLOCK",
      confidence: "AI confidence 94%",
      severity: "Low blast radius",
      cta: "Block device"
    },
    {
      id: "openCase",
      title: "Open insider-risk case",
      description: "Package the AI summary, file list, timeline, and device evidence for escalation.",
      impact: "A simulated case package will be created in the local audit trail with no external transmission.",
      guardrail: "Packages evidence only. No user or device access changes are performed.",
      confirmation: "CASE",
      confidence: "AI confidence 88%",
      severity: "Evidence workflow",
      cta: "Open case"
    }
  ];

  const downloadedFiles = [
    {
      name: "Customer_Billing_Master_Q2_2026.xlsx",
      path: "/Finance/Billing/Exports/",
      label: "Critical",
      size: "4.8GB",
      owner: "Finance Ops",
      note: "Contains customer IDs, invoice history, and payment status."
    },
    {
      name: "Enterprise_Renewals_Private_Contracts.zip",
      path: "/SalesOps/Contracts/Renewals/",
      label: "Critical",
      size: "7.2GB",
      owner: "Revenue Ops",
      note: "Rarely accessed by Sarah; includes strategic contract terms."
    },
    {
      name: "Customer_DPA_Archive_2023-2026.pdf",
      path: "/Legal/Privacy/DPA/",
      label: "Restricted",
      size: "2.1GB",
      owner: "Legal",
      note: "Regulated privacy documents outside normal finance workflow."
    },
    {
      name: "Churn_Risk_Model_Input.csv",
      path: "/Analytics/CustomerHealth/",
      label: "Restricted",
      size: "6.4GB",
      owner: "Data Science",
      note: "Large export from analytics workspace at unusual hour."
    },
    {
      name: "VIP_Customer_Contact_List.xlsx",
      path: "/CustomerSuccess/Executive/",
      label: "Critical",
      size: "1.6GB",
      owner: "Customer Success",
      note: "High-value customer contacts and executive sponsor mappings."
    },
    {
      name: "AR_Aging_By_Account_Confidential.csv",
      path: "/Finance/Receivables/",
      label: "Confidential",
      size: "3.9GB",
      owner: "Finance Ops",
      note: "Expected data domain, but volume exceeds Sarah's baseline."
    },
    {
      name: "Support_Escalation_History.parquet",
      path: "/Support/CustomerData/",
      label: "Restricted",
      size: "8.6GB",
      owner: "Support Ops",
      note: "Cross-functional access not seen in previous 90 days."
    },
    {
      name: "Customer_Tax_ID_Backup.enc",
      path: "/Finance/Tax/Archive/",
      label: "Critical",
      size: "2.7GB",
      owner: "Tax",
      note: "Encrypted archive with regulated identifiers."
    },
    {
      name: "Billing_Adjustments_Audit_2026.csv",
      path: "/Finance/Audit/",
      label: "Confidential",
      size: "912MB",
      owner: "Internal Audit",
      note: "Finance-related but not previously accessed by this user."
    },
    {
      name: "Customer_Entitlements_Export.json",
      path: "/ProductOps/Entitlements/",
      label: "Restricted",
      size: "5.5GB",
      owner: "Product Ops",
      note: "Entitlement metadata could enable targeted fraud."
    }
  ];

  const timelineEvents = [
    {
      time: "01:53",
      title: "New device observed",
      detail: "Unmanaged MacBook fingerprint appears for the first time from residential ISP."
    },
    {
      time: "01:56",
      title: "MFA challenge completed",
      detail: "Valid push approval from Sarah's registered mobile device; AI notes atypical hour and device."
    },
    {
      time: "02:00",
      title: "Bulk download starts",
      detail: "Cloud Drive API begins high-throughput file export across Finance, Legal, and Customer Success folders."
    },
    {
      time: "02:18",
      title: "Sensitive file threshold crossed",
      detail: "Behavioral Engine flags customer PII concentration above policy threshold."
    },
    {
      time: "02:43",
      title: "Download completes",
      detail: "1,843 files and 50GB transferred. No upload to sanctioned corporate destination observed."
    },
    {
      time: "02:44",
      title: "High-severity alert created",
      detail: "Risk score set to 95/100 and response recommendations generated for analyst validation."
    }
  ];

  const actionById = recommendations.reduce(function (map, recommendation) {
    map[recommendation.id] = recommendation;
    return map;
  }, {});

  let currentAction = null;
  let lastFocusedElement = null;
  let auditEntries = [];
  let storageAvailable = true;

  document.addEventListener("DOMContentLoaded", function () {
    loadTheme();
    auditEntries = readAuditEntries();
    bindPresentationNavigation();
    bindPrototypeInteractions();
    renderRiskFactors();
    renderRecommendations();
    renderFiles();
    renderTimeline();
    renderAudit();
  });

  function byId(id) {
    return document.getElementById(id);
  }

  function queryAll(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  function bindPresentationNavigation() {
    queryAll("[data-section]").forEach(function (button) {
      button.addEventListener("click", function () {
        activateSection(button.getAttribute("data-section"));
      });
    });

    queryAll("[data-section-link]").forEach(function (link) {
      link.addEventListener("click", function (event) {
        event.preventDefault();
        activateSection(link.getAttribute("data-section-link"));
      });
    });

    const themeToggle = byId("themeToggle");
    if (themeToggle) {
      themeToggle.addEventListener("click", toggleTheme);
    }
  }

  function activateSection(sectionName) {
    if (!sectionName) {
      return;
    }

    queryAll("[data-section]").forEach(function (button) {
      button.classList.toggle("is-active", button.getAttribute("data-section") === sectionName);
    });

    queryAll("[data-section-panel]").forEach(function (panel) {
      panel.classList.toggle("is-active", panel.getAttribute("data-section-panel") === sectionName);
    });

    const target = byId(sectionName);
    if (target) {
      target.scrollIntoView({ block: "start", behavior: "smooth" });
    }
  }

  function bindPrototypeInteractions() {
    queryAll("[data-tab]").forEach(function (button) {
      button.addEventListener("click", function () {
        activateTab(button.getAttribute("data-tab"));
      });
    });

    const regenerateButton = byId("regenerateSummary");
    if (regenerateButton) {
      regenerateButton.addEventListener("click", regenerateSummary);
    }

    const fileSearch = byId("fileSearch");
    const fileSensitivity = byId("fileSensitivity");
    if (fileSearch) {
      fileSearch.addEventListener("input", renderFiles);
    }
    if (fileSensitivity) {
      fileSensitivity.addEventListener("change", renderFiles);
    }

    queryAll("[data-action]").forEach(function (button) {
      button.addEventListener("click", function () {
        openActionModal(button.getAttribute("data-action"));
      });
    });

    const modalClose = byId("modalClose");
    const modalCancel = byId("modalCancel");
    const actionForm = byId("actionForm");
    const clearAudit = byId("clearAudit");
    const modal = byId("actionModal");

    if (modalClose) {
      modalClose.addEventListener("click", closeActionModal);
    }
    if (modalCancel) {
      modalCancel.addEventListener("click", closeActionModal);
    }
    if (actionForm) {
      actionForm.addEventListener("submit", submitAction);
      actionForm.addEventListener("input", validateActionForm);
      actionForm.addEventListener("change", validateActionForm);
    }
    if (clearAudit) {
      clearAudit.addEventListener("click", clearAuditEntries);
    }
    if (modal) {
      modal.addEventListener("click", function (event) {
        if (event.target === modal) {
          closeActionModal();
        }
      });
    }

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && modal && modal.classList.contains("is-open")) {
        closeActionModal();
      }
    });
  }

  function activateTab(tabName) {
    if (!tabName) {
      return;
    }

    queryAll("[data-tab]").forEach(function (button) {
      const isActive = button.getAttribute("data-tab") === tabName;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-selected", String(isActive));
    });

    queryAll("[data-tab-panel]").forEach(function (panel) {
      panel.classList.toggle("is-active", panel.getAttribute("data-tab-panel") === tabName);
    });
  }

  function renderRiskFactors() {
    const container = byId("riskFactors");
    if (!container) {
      return;
    }

    container.innerHTML = riskFactors.map(function (factor) {
      return [
        '<div class="factor-row">',
        '  <span class="factor-icon" aria-hidden="true"></span>',
        "  <div>",
        "    <strong>" + escapeHtml(factor.title) + "</strong>",
        "    <small>" + escapeHtml(factor.description) + "</small>",
        "  </div>",
        '  <span class="factor-score">' + escapeHtml(factor.score) + "</span>",
        "</div>"
      ].join("");
    }).join("");
  }

  function renderRecommendations() {
    const container = byId("recommendationList");
    if (!container) {
      return;
    }

    container.innerHTML = recommendations.map(function (recommendation) {
      const queued = auditEntries.some(function (entry) {
        return entry.actionId === recommendation.id;
      });
      const actionButton = queued
        ? '<span class="status-pill queued-chip">Queued</span>'
        : '<button class="' + (recommendation.id === "openCase" ? "primary-button" : "danger-button") + '" type="button" data-action="' + escapeHtml(recommendation.id) + '">' + escapeHtml(recommendation.cta) + "</button>";

      return [
        '<article class="recommendation-card">',
        "  <div>",
        "    <h4>" + escapeHtml(recommendation.title) + "</h4>",
        "    <p>" + escapeHtml(recommendation.description) + "</p>",
        '    <div class="recommendation-meta">',
        "      <span>" + escapeHtml(recommendation.confidence) + "</span>",
        "      <span>" + escapeHtml(recommendation.severity) + "</span>",
        "    </div>",
        "  </div>",
        "  <div>" + actionButton + "</div>",
        "</article>"
      ].join("");
    }).join("");

    queryAll("[data-action]", container).forEach(function (button) {
      button.addEventListener("click", function () {
        openActionModal(button.getAttribute("data-action"));
      });
    });
  }

  function renderFiles() {
    const container = byId("fileRows");
    if (!container) {
      return;
    }

    const searchInput = byId("fileSearch");
    const sensitivitySelect = byId("fileSensitivity");
    const search = normalizeSearch(searchInput ? searchInput.value : "");
    const sensitivity = sensitivitySelect ? sensitivitySelect.value : "all";

    const filtered = downloadedFiles.filter(function (file) {
      const matchesSensitivity = sensitivity === "all" || file.label === sensitivity;
      const haystack = normalizeSearch([file.name, file.path, file.label, file.owner, file.note].join(" "));
      return matchesSensitivity && (!search || haystack.indexOf(search) !== -1);
    });

    if (!filtered.length) {
      container.innerHTML = '<div class="empty-state">No downloaded files match the current filters.</div>';
      return;
    }

    container.innerHTML = filtered.map(function (file) {
      const labelClass = file.label === "Critical"
        ? "label-critical"
        : file.label === "Restricted"
          ? "label-restricted"
          : "label-confidential";

      return [
        '<div class="file-row" role="row">',
        '  <div class="file-name" role="cell"><strong>' + escapeHtml(file.name) + "</strong><span>" + escapeHtml(file.path) + "</span></div>",
        '  <div role="cell"><span class="label-chip ' + labelClass + '">' + escapeHtml(file.label) + "</span></div>",
        '  <div role="cell">' + escapeHtml(file.size) + "</div>",
        '  <div role="cell">' + escapeHtml(file.owner) + "</div>",
        '  <div role="cell">' + escapeHtml(file.note) + "</div>",
        "</div>"
      ].join("");
    }).join("");
  }

  function renderTimeline() {
    const container = byId("timeline");
    if (!container) {
      return;
    }

    container.innerHTML = timelineEvents.map(function (event) {
      return [
        '<article class="timeline-item">',
        '  <div class="timeline-dot">' + escapeHtml(event.time) + "</div>",
        '  <div class="timeline-body">',
        "    <strong>" + escapeHtml(event.title) + "</strong>",
        "    <span>" + escapeHtml(event.detail) + "</span>",
        "  </div>",
        "</article>"
      ].join("");
    }).join("");
  }

  function regenerateSummary() {
    const summaryContent = byId("summaryContent");
    const button = byId("regenerateSummary");
    if (!summaryContent || !button) {
      return;
    }

    button.disabled = true;
    button.textContent = "Generating...";
    summaryContent.innerHTML = [
      '<div class="summary-skeleton" aria-label="AI summary is generating">',
      "  <span></span>",
      "  <span></span>",
      "  <span></span>",
      "</div>"
    ].join("");

    window.setTimeout(function () {
      summaryContent.innerHTML = [
        "<p>",
        "AI re-check confirms <strong>high-confidence data exfiltration behavior</strong>: a first-seen unmanaged device downloaded ",
        "<strong>1,843 sensitive files</strong> across Finance, Legal, and Customer Success repositories. ",
        "No approved export ticket or sanctioned destination was found in the simulated evidence graph.",
        "</p>"
      ].join("");
      button.disabled = false;
      button.textContent = "Regenerate";
      showToast("AI summary refreshed", "Streaming state completed with the latest simulated evidence graph.");
    }, 950);
  }

  function openActionModal(actionId) {
    const action = actionById[actionId];
    const modal = byId("actionModal");
    const form = byId("actionForm");
    if (!action || !modal || !form) {
      showToast("Action unavailable", "The selected response action is not configured.");
      return;
    }

    currentAction = action;
    lastFocusedElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;

    setText("modalTitle", action.title);
    setText("modalImpact", action.impact);
    setText("modalGuardrail", action.guardrail);
    setText("confirmationWord", action.confirmation);

    form.reset();
    clearValidation();
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");

    const reason = byId("actionReason");
    if (reason) {
      reason.focus();
    }
  }

  function closeActionModal() {
    const modal = byId("actionModal");
    if (!modal) {
      return;
    }

    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    currentAction = null;

    if (lastFocusedElement) {
      lastFocusedElement.focus();
      lastFocusedElement = null;
    }
  }

  function submitAction(event) {
    event.preventDefault();
    if (!currentAction || !validateActionForm()) {
      return;
    }

    const action = currentAction;
    const reasonInput = byId("actionReason");
    const reason = sanitizeFreeText(reasonInput ? reasonInput.value : "");
    const entry = {
      id: "audit-" + Date.now(),
      actionId: action.id,
      title: action.title,
      reason: reason,
      timestamp: new Date().toISOString(),
      actor: "Daniel SOC Analyst",
      status: "Queued for controlled execution"
    };

    auditEntries.unshift(entry);
    persistAuditEntries(auditEntries);
    renderAudit();
    renderRecommendations();
    closeActionModal();
    showToast("Action queued", action.title + " was added to the local audit trail.");
  }

  function validateActionForm() {
    if (!currentAction) {
      return false;
    }

    const reasonInput = byId("actionReason");
    const confirmationInput = byId("confirmationInput");
    const reviewCheck = byId("reviewCheck");
    const reasonError = byId("reasonError");
    const confirmationError = byId("confirmationError");

    const reason = sanitizeFreeText(reasonInput ? reasonInput.value : "");
    const confirmation = confirmationInput ? confirmationInput.value.trim().toUpperCase() : "";
    const reviewed = Boolean(reviewCheck && reviewCheck.checked);

    let valid = true;

    if (reason.length < 12) {
      setNodeText(reasonError, "Add at least 12 characters explaining the decision.");
      valid = false;
    } else if (reason.length > 320) {
      setNodeText(reasonError, "Keep the note under 320 characters.");
      valid = false;
    } else {
      setNodeText(reasonError, "");
    }

    if (confirmation !== currentAction.confirmation) {
      setNodeText(confirmationError, "Type " + currentAction.confirmation + " exactly.");
      valid = false;
    } else {
      setNodeText(confirmationError, "");
    }

    if (!reviewed) {
      valid = false;
    }

    return valid;
  }

  function renderAudit() {
    const container = byId("auditList");
    if (!container) {
      return;
    }

    if (!auditEntries.length) {
      const storageText = storageAvailable
        ? "No response actions have been queued in this browser yet."
        : "Local storage is unavailable; actions will persist only until refresh.";
      container.innerHTML = '<p class="audit-empty">' + escapeHtml(storageText) + "</p>";
      return;
    }

    container.innerHTML = auditEntries.map(function (entry) {
      const when = formatTimestamp(entry.timestamp);
      return [
        '<article class="audit-item">',
        "  <strong>" + escapeHtml(entry.title) + "</strong>",
        "  <span>" + escapeHtml(entry.status) + " by " + escapeHtml(entry.actor) + " - " + escapeHtml(when) + "</span>",
        "  <span>Note: " + escapeHtml(entry.reason) + "</span>",
        "</article>"
      ].join("");
    }).join("");
  }

  function clearAuditEntries() {
    auditEntries = [];
    persistAuditEntries(auditEntries);
    renderAudit();
    renderRecommendations();
    showToast("Local audit cleared", "Simulated response history was removed from this browser.");
  }

  function readAuditEntries() {
    if (!window.localStorage) {
      storageAvailable = false;
      return [];
    }

    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }

    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        storageAvailable = false;
        showToast("Audit storage reset", "Stored audit data had an invalid shape and was ignored.");
        return [];
      }
      return parsed.filter(isValidAuditEntry).slice(0, 20);
    } catch (error) {
      storageAvailable = false;
      showToast("Audit storage reset", "Stored audit data was unreadable and was ignored.");
      return [];
    }
  }

  function persistAuditEntries(entries) {
    if (!window.localStorage) {
      storageAvailable = false;
      return;
    }

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0, 20)));
      storageAvailable = true;
    } catch (error) {
      storageAvailable = false;
      showToast("Audit persistence unavailable", "The browser blocked localStorage; this action remains in memory only.");
    }
  }

  function isValidAuditEntry(entry) {
    return Boolean(
      entry &&
      typeof entry.id === "string" &&
      typeof entry.actionId === "string" &&
      typeof entry.title === "string" &&
      typeof entry.reason === "string" &&
      typeof entry.timestamp === "string" &&
      typeof entry.actor === "string" &&
      typeof entry.status === "string"
    );
  }

  function toggleTheme() {
    const enabled = !document.body.classList.contains("high-contrast");
    document.body.classList.toggle("high-contrast", enabled);
    const button = byId("themeToggle");
    if (button) {
      button.setAttribute("aria-pressed", String(enabled));
    }
    persistTheme(enabled);
  }

  function loadTheme() {
    if (!window.localStorage) {
      return;
    }

    const enabled = window.localStorage.getItem(THEME_KEY) === "high";
    document.body.classList.toggle("high-contrast", enabled);
    const button = byId("themeToggle");
    if (button) {
      button.setAttribute("aria-pressed", String(enabled));
    }
  }

  function persistTheme(enabled) {
    if (!window.localStorage) {
      return;
    }

    try {
      window.localStorage.setItem(THEME_KEY, enabled ? "high" : "default");
    } catch (error) {
      showToast("Theme preference not saved", "The browser blocked localStorage for this page.");
    }
  }

  function normalizeSearch(value) {
    return String(value || "").trim().toLowerCase();
  }

  function sanitizeFreeText(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function setText(id, text) {
    const node = byId(id);
    setNodeText(node, text);
  }

  function setNodeText(node, text) {
    if (node) {
      node.textContent = text;
    }
  }

  function clearValidation() {
    setText("reasonError", "");
    setText("confirmationError", "");
  }

  function formatTimestamp(isoValue) {
    const date = new Date(isoValue);
    if (Number.isNaN(date.getTime())) {
      return "time unavailable";
    }
    return date.toLocaleString([], {
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  function showToast(title, message) {
    const region = byId("toastRegion");
    if (!region) {
      return;
    }

    const toast = document.createElement("div");
    toast.className = "toast";
    toast.innerHTML = "<strong>" + escapeHtml(title) + "</strong><span>" + escapeHtml(message) + "</span>";
    region.appendChild(toast);

    window.setTimeout(function () {
      toast.remove();
    }, 4200);
  }
})();
