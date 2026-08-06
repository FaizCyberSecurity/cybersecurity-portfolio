/* =========================================================
   REPORTFORGE — APP LOGIC
========================================================= */

const STORE_KEY = "reportforge_data_v1";

/* ---------- Utilities ---------- */
function uid(prefix) {
  return prefix + "_" + Math.random().toString(36).slice(2, 9);
}
function escapeHtml(str) {
  if (str === undefined || str === null) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}
const SEVERITIES = ["critical", "high", "medium", "low", "info"];
const SEV_ORDER = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };

/* ---------- Storage ---------- */
function loadData() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) { /* fall through to empty */ }
  const empty = emptyData();
  saveData(empty);
  return empty;
}
function saveData(data) {
  localStorage.setItem(STORE_KEY, JSON.stringify(data));
}
let DATA = loadData();
function persist() { saveData(DATA); }

function emptyData() {
  return {
    clients: [],
    findings: [],
    reports: [],
    settings: { companyName: "Your Security Firm", analystName: "", footerText: "Confidential — prepared exclusively for the named client. Unauthorized distribution is prohibited." },
  };
}

function seedData() {
  const c1 = uid("client"), c2 = uid("client");
  const f = Array.from({ length: 8 }, () => uid("finding"));
  const findings = [
    { id: f[0], title: "SQL Injection in Login Form", severity: "critical", cvss: "9.8", description: "The login endpoint fails to sanitize the `username` parameter, allowing attacker-controlled SQL to be executed against the backend database.", impact: "Full compromise of the user database, including password hashes and personal data.", recommendation: "Use parameterized queries / prepared statements for all database access, and apply strict input validation." },
    { id: f[1], title: "Broken Access Control on Admin Panel", severity: "high", cvss: "8.1", description: "Direct object references to admin-only endpoints are accessible by low-privilege authenticated users.", impact: "Privilege escalation to full administrative access.", recommendation: "Enforce server-side role checks on every privileged endpoint, not just client-side UI hiding." },
    { id: f[2], title: "Reflected Cross-Site Scripting (XSS)", severity: "high", cvss: "7.4", description: "The search parameter is reflected into the page without encoding, allowing arbitrary script execution.", impact: "Session hijacking, credential theft, and defacement in victims' browsers.", recommendation: "Encode all user-controlled output and adopt a strict Content-Security-Policy." },
    { id: f[3], title: "Missing Rate Limiting on Auth Endpoints", severity: "medium", cvss: "5.9", description: "The login and password-reset endpoints accept unlimited attempts from a single source.", impact: "Enables credential stuffing and brute-force attacks.", recommendation: "Implement per-account and per-IP rate limiting, with progressive backoff and CAPTCHA." },
    { id: f[4], title: "Outdated TLS Configuration", severity: "medium", cvss: "5.3", description: "The server still accepts TLS 1.0/1.1 and several weak cipher suites.", impact: "Susceptible to downgrade and man-in-the-middle attacks on network traffic.", recommendation: "Disable TLS < 1.2, remove weak ciphers, and enable HSTS." },
    { id: f[5], title: "Verbose Error Messages", severity: "low", cvss: "3.1", description: "Unhandled exceptions return full stack traces, including file paths and framework versions.", impact: "Aids attacker reconnaissance of the underlying stack.", recommendation: "Return generic error messages to clients and log details server-side only." },
    { id: f[6], title: "Directory Listing Enabled", severity: "low", cvss: "2.7", description: "The `/uploads/` directory returns a browsable file index instead of a 403.", impact: "Minor information disclosure of uploaded file names.", recommendation: "Disable directory indexing at the web server configuration level." },
    { id: f[7], title: "Missing Security Headers", severity: "info", cvss: "0.0", description: "Response headers omit X-Content-Type-Options, X-Frame-Options, and Referrer-Policy.", impact: "Reduces defense-in-depth against clickjacking and MIME-sniffing attacks.", recommendation: "Add standard security headers at the reverse proxy or application layer." },
  ].map((x) => ({ ...x, createdAt: new Date().toISOString() }));

  const reports = [
    {
      id: uid("report"),
      title: "External Web Application Assessment",
      clientId: c1,
      status: "final",
      createdAt: new Date(Date.now() - 12 * 86400000).toISOString(),
      executiveSummary: "Between engagement dates, our team performed an external penetration test of the client's primary web application. We identified 4 findings ranging from critical to low severity, most notably an unauthenticated SQL injection vulnerability in the login form. Remediation guidance is provided for each finding in the sections below.",
      scope: "Testing was scoped to the production web application and its public-facing API, excluding third-party integrations and mobile clients.",
      items: [
        { findingId: f[0], evidence: [] },
        { findingId: f[1], evidence: [] },
        { findingId: f[3], evidence: [] },
        { findingId: f[5], evidence: [] },
      ],
    },
    {
      id: uid("report"),
      title: "Internal Network Penetration Test",
      clientId: c2,
      status: "draft",
      createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
      executiveSummary: "This report summarizes findings from an internal network assessment simulating an attacker with initial foothold access. Draft pending final QA review.",
      scope: "Internal corporate VLAN, excluding OT/ICS segments.",
      items: [
        { findingId: f[2], evidence: [] },
        { findingId: f[4], evidence: [] },
        { findingId: f[6], evidence: [] },
        { findingId: f[7], evidence: [] },
      ],
    },
  ];

  return {
    clients: [
      { id: c1, name: "Priya Nair", company: "Acme Retail Corp", email: "priya.nair@acmeretail.com", notes: "Primary security contact.", createdAt: new Date().toISOString() },
      { id: c2, name: "Daniel Cho", company: "Nimbus Health Systems", email: "d.cho@nimbushealth.io", notes: "", createdAt: new Date().toISOString() },
    ],
    findings,
    reports,
    settings: { companyName: "Your Security Firm", analystName: "Mohd Faiz", footerText: "Confidential — prepared exclusively for the named client. Unauthorized distribution is prohibited." },
  };
}

/* ---------- Router ---------- */
const PAGE_TITLES = { dashboard: "Dashboard", reports: "Reports", findings: "Findings Library", clients: "Clients", settings: "Settings" };

function currentPage() {
  const hash = location.hash.replace("#", "");
  return PAGE_TITLES[hash] ? hash : "dashboard";
}

function navigate() {
  const page = currentPage();
  document.getElementById("topbarTitle").textContent = PAGE_TITLES[page];
  document.querySelectorAll(".nav-item").forEach((el) => {
    el.classList.toggle("active", el.dataset.page === page);
  });
  const renderers = {
    dashboard: renderDashboard,
    reports: renderReports,
    findings: renderFindings,
    clients: renderClients,
    settings: renderSettings,
  };
  renderers[page]();
  document.getElementById("sidebar").classList.remove("mobile-open");
}

window.addEventListener("hashchange", navigate);

/* =========================================================
   DASHBOARD
========================================================= */
function renderDashboard() {
  const totalReports = DATA.reports.length;
  const totalFindings = DATA.findings.length;
  const totalClients = DATA.clients.length;
  const finalReports = DATA.reports.filter((r) => r.status === "final").length;

  const sevCounts = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
  DATA.findings.forEach((f) => { if (sevCounts[f.severity] !== undefined) sevCounts[f.severity]++; });
  const maxSev = Math.max(1, ...Object.values(sevCounts));

  const recentReports = [...DATA.reports].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);

  document.getElementById("mainContent").innerHTML = `
    <div class="page">
      <div class="stat-grid">
        <div class="glass-card stat-card">
          <span class="stat-label">Total Reports</span>
          <span class="stat-value" data-count="${totalReports}">0</span>
        </div>
        <div class="glass-card stat-card">
          <span class="stat-label">Findings in Library</span>
          <span class="stat-value" data-count="${totalFindings}">0</span>
        </div>
        <div class="glass-card stat-card">
          <span class="stat-label">Clients</span>
          <span class="stat-value" data-count="${totalClients}">0</span>
        </div>
        <div class="glass-card stat-card">
          <span class="stat-label">Finalized Reports</span>
          <span class="stat-value" data-count="${finalReports}">0</span>
        </div>
      </div>

      <div class="dashboard-grid">
        <div class="glass-card panel">
          <h3 class="panel-title">Recent Reports</h3>
          <div class="recent-list">
            ${recentReports.length ? recentReports.map((r) => {
              const client = DATA.clients.find((c) => c.id === r.clientId);
              return `
              <a class="recent-item" href="#reports" data-open-report="${r.id}">
                <div>
                  <div class="recent-item-name">${escapeHtml(r.title)}</div>
                  <div class="recent-item-sub">${escapeHtml(client ? client.company : "No client")} • ${formatDate(r.createdAt)}</div>
                </div>
                <span class="badge badge-${r.status}">${r.status}</span>
              </a>`;
            }).join("") : `<div class="empty-state"><div class="empty-state-icon">▤</div>No reports yet.</div>`}
          </div>
        </div>

        <div class="glass-card panel">
          <h3 class="panel-title">Findings by Severity</h3>
          ${SEVERITIES.map((s) => `
            <div class="sev-bar-row">
              <span class="sev-bar-label badge badge-${s}">${s}</span>
              <div class="sev-bar-track"><div class="sev-bar-fill" data-width="${(sevCounts[s] / maxSev) * 100}" style="background: var(--sev-${s})"></div></div>
              <span class="sev-bar-count">${sevCounts[s]}</span>
            </div>
          `).join("")}
        </div>
      </div>
    </div>
  `;

  // Animate counters
  document.querySelectorAll(".stat-value").forEach((el) => animateCount(el, parseInt(el.dataset.count, 10)));
  // Animate severity bars
  requestAnimationFrame(() => {
    document.querySelectorAll(".sev-bar-fill").forEach((el) => {
      el.style.width = el.dataset.width + "%";
    });
  });

  document.querySelectorAll("[data-open-report]").forEach((el) => {
    el.addEventListener("click", (e) => {
      e.preventDefault();
      location.hash = "#reports";
      setTimeout(() => openReportPreview(el.dataset.openReport), 50);
    });
  });
}

function animateCount(el, target) {
  const duration = 800;
  const start = performance.now();
  function tick(now) {
    const progress = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(eased * target);
    if (progress < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

/* =========================================================
   REPORTS
========================================================= */
function renderReports(filter = "") {
  const list = DATA.reports
    .filter((r) => r.title.toLowerCase().includes(filter.toLowerCase()))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  document.getElementById("mainContent").innerHTML = `
    <div class="page">
      <div class="page-toolbar">
        <input type="text" class="search-input" id="reportSearch" placeholder="Search reports..." value="${escapeHtml(filter)}">
        <button class="btn btn-primary" id="newReportBtn">+ New Report</button>
      </div>
      <div class="card-grid" id="reportGrid">
        ${list.length ? list.map(reportCardHtml).join("") : emptyState("▤", "No reports yet. Create your first one.")}
      </div>
    </div>
  `;

  document.getElementById("reportSearch").addEventListener("input", (e) => renderReports(e.target.value));
  document.getElementById("newReportBtn").addEventListener("click", () => openReportForm());
  bindRippleButtons();

  document.querySelectorAll("[data-preview-report]").forEach((el) =>
    el.addEventListener("click", (e) => { e.stopPropagation(); openReportPreview(el.dataset.previewReport); })
  );
  document.querySelectorAll("[data-edit-report]").forEach((el) =>
    el.addEventListener("click", (e) => { e.stopPropagation(); openReportForm(el.dataset.editReport); })
  );
  document.querySelectorAll("[data-delete-report]").forEach((el) =>
    el.addEventListener("click", (e) => {
      e.stopPropagation();
      if (confirm("Delete this report? This can't be undone.")) {
        DATA.reports = DATA.reports.filter((r) => r.id !== el.dataset.deleteReport);
        persist();
        renderReports(filter);
        showToast("Report deleted");
      }
    })
  );
}

function reportCardHtml(r) {
  const client = DATA.clients.find((c) => c.id === r.clientId);
  const sevs = r.items.map((it) => DATA.findings.find((f) => f.id === it.findingId)).filter(Boolean);
  return `
    <div class="glass-card item-card" data-preview-report="${r.id}">
      <div class="item-card-top">
        <div>
          <div class="item-card-title">${escapeHtml(r.title)}</div>
          <div class="item-card-sub">${escapeHtml(client ? client.company : "No client assigned")}</div>
        </div>
        <span class="badge badge-${r.status}">${r.status}</span>
      </div>
      <div class="item-card-sub">${formatDate(r.createdAt)} • ${r.items.length} finding${r.items.length === 1 ? "" : "s"}</div>
      <div class="item-card-meta">
        ${sevs.slice(0, 4).map((f) => `<span class="badge badge-${f.severity}">${f.severity}</span>`).join("")}
      </div>
      <div class="item-card-actions">
        <button class="btn btn-secondary btn-sm" data-preview-report="${r.id}">Preview</button>
        <button class="btn btn-ghost btn-sm" data-edit-report="${r.id}">Edit</button>
        <button class="btn btn-ghost btn-sm" data-delete-report="${r.id}" style="color: var(--danger);">Delete</button>
      </div>
    </div>
  `;
}

function openReportForm(reportId) {
  const editing = reportId ? DATA.reports.find((r) => r.id === reportId) : null;

  // Local working state for this form session: findingId -> { evidence: [...base64] }
  const itemsState = {};
  if (editing) {
    editing.items.forEach((it) => { itemsState[it.findingId] = { evidence: [...(it.evidence || [])] }; });
  }

  const html = `
    <h2 class="modal-title">${editing ? "Edit Report" : "New Report"}</h2>
    <div class="form-group">
      <label class="form-label">Report Title</label>
      <input type="text" class="form-input" id="fReportTitle" value="${escapeHtml(editing ? editing.title : "")}" placeholder="e.g. External Web Application Assessment">
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Client</label>
        <select class="form-select" id="fReportClient">
          <option value="">— No client —</option>
          ${DATA.clients.map((c) => `<option value="${c.id}" ${editing && editing.clientId === c.id ? "selected" : ""}>${escapeHtml(c.company)} (${escapeHtml(c.name)})</option>`).join("")}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Status</label>
        <select class="form-select" id="fReportStatus">
          <option value="draft" ${editing && editing.status === "draft" ? "selected" : ""}>Draft</option>
          <option value="final" ${editing && editing.status === "final" ? "selected" : ""}>Final</option>
        </select>
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Scope</label>
      <textarea class="form-textarea" id="fReportScope" placeholder="What was in scope for this engagement?">${escapeHtml(editing ? editing.scope : "")}</textarea>
    </div>
    <div class="form-group">
      <label class="form-label">Executive Summary</label>
      <textarea class="form-textarea" id="fReportSummary" placeholder="High-level summary for stakeholders...">${escapeHtml(editing ? editing.executiveSummary : "")}</textarea>
    </div>
    <div class="form-group">
      <label class="form-label" id="findingPickerLabel">Findings included (${Object.keys(itemsState).length} selected)</label>
      <div class="finding-picker" id="findingPicker"></div>
    </div>
    <div class="form-actions">
      <button class="btn btn-ghost" id="cancelReportForm">Cancel</button>
      <button class="btn btn-primary" id="saveReportForm">${editing ? "Save Changes" : "Create Report"}</button>
    </div>
  `;
  openModal(html);
  renderFindingPicker(itemsState);

  document.getElementById("cancelReportForm").addEventListener("click", closeModal);
  document.getElementById("saveReportForm").addEventListener("click", () => {
    const title = document.getElementById("fReportTitle").value.trim();
    if (!title) { showToast("Please give the report a title"); return; }
    const items = Object.keys(itemsState).map((fid) => ({ findingId: fid, evidence: itemsState[fid].evidence }));

    if (editing) {
      Object.assign(editing, {
        title,
        clientId: document.getElementById("fReportClient").value,
        status: document.getElementById("fReportStatus").value,
        scope: document.getElementById("fReportScope").value,
        executiveSummary: document.getElementById("fReportSummary").value,
        items,
      });
    } else {
      DATA.reports.push({
        id: uid("report"),
        title,
        clientId: document.getElementById("fReportClient").value,
        status: document.getElementById("fReportStatus").value,
        scope: document.getElementById("fReportScope").value,
        executiveSummary: document.getElementById("fReportSummary").value,
        items,
        createdAt: new Date().toISOString(),
      });
    }
    persist();
    closeModal();
    renderReports();
    showToast(editing ? "Report updated" : "Report created");
  });
}

function renderFindingPicker(itemsState) {
  const picker = document.getElementById("findingPicker");
  if (!picker) return;

  if (!DATA.findings.length) {
    picker.innerHTML = `<p style="color:var(--text-light); font-size:13px;">No findings in your library yet — add some in Findings Library first.</p>`;
    return;
  }

  const sorted = [...DATA.findings].sort((a, b) => SEV_ORDER[a.severity] - SEV_ORDER[b.severity]);
  picker.innerHTML = sorted.map((f) => {
    const selected = itemsState.hasOwnProperty(f.id);
    const evidence = selected ? itemsState[f.id].evidence : [];
    return `
      <div class="finding-picker-item ${selected ? "selected" : ""}" data-finding-id="${f.id}">
        <div style="display:flex; align-items:center; gap:12px; cursor:pointer;" data-toggle-finding="${f.id}">
          <span class="badge badge-${f.severity}">${f.severity}</span>
          <span class="fp-title">${escapeHtml(f.title)}</span>
        </div>
        ${selected ? `
          <div style="margin-top:12px; padding-top:12px; border-top:1px solid var(--glass-border);">
            <label class="file-drop" style="display:block;">
              📎 Add evidence image(s)
              <input type="file" accept="image/*" multiple data-evidence-input="${f.id}" style="display:none;">
            </label>
            <div class="evidence-thumbs" data-evidence-thumbs="${f.id}">
              ${evidence.map((src, i) => `
                <div class="evidence-thumb">
                  <img src="${src}">
                  <button class="evidence-thumb-remove" data-remove-evidence="${f.id}" data-evidence-index="${i}" type="button">✕</button>
                </div>
              `).join("")}
            </div>
          </div>
        ` : ""}
      </div>
    `;
  }).join("");

  // Toggle finding selection
  picker.querySelectorAll("[data-toggle-finding]").forEach((el) => {
    el.addEventListener("click", () => {
      const id = el.dataset.toggleFinding;
      if (itemsState.hasOwnProperty(id)) delete itemsState[id];
      else itemsState[id] = { evidence: [] };
      renderFindingPicker(itemsState);
      const label = document.getElementById("findingPickerLabel");
      if (label) label.textContent = `Findings included (${Object.keys(itemsState).length} selected)`;
    });
  });

  // Evidence upload
  picker.querySelectorAll("[data-evidence-input]").forEach((input) => {
    input.addEventListener("click", (e) => e.stopPropagation());
    input.addEventListener("change", (e) => {
      const fid = input.dataset.evidenceInput;
      const files = Array.from(e.target.files || []);
      let remaining = files.length;
      if (!remaining) return;
      files.forEach((file) => {
        const reader = new FileReader();
        reader.onload = () => {
          itemsState[fid].evidence.push(reader.result);
          remaining--;
          if (remaining === 0) renderFindingPicker(itemsState);
        };
        reader.readAsDataURL(file);
      });
    });
  });

  // Evidence remove
  picker.querySelectorAll("[data-remove-evidence]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const fid = btn.dataset.removeEvidence;
      const idx = parseInt(btn.dataset.evidenceIndex, 10);
      itemsState[fid].evidence.splice(idx, 1);
      renderFindingPicker(itemsState);
    });
  });
}

/* ---------- Report Preview / Print ---------- */
function openReportPreview(reportId) {
  const r = DATA.reports.find((x) => x.id === reportId);
  if (!r) return;
  const client = DATA.clients.find((c) => c.id === r.clientId);
  const items = r.items.map((it) => ({ ...it, finding: DATA.findings.find((f) => f.id === it.findingId) })).filter((x) => x.finding);
  const sevCounts = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
  items.forEach((it) => sevCounts[it.finding.severity]++);
  const settings = DATA.settings;

  const doc = `
    <div class="doc-page doc-cover">
      <p class="doc-tag">Confidential Security Assessment</p>
      <h1>${escapeHtml(r.title)}</h1>
      <p class="doc-client">Prepared for ${escapeHtml(client ? client.company : "—")}</p>
      <p class="doc-meta">Prepared by ${escapeHtml(settings.analystName)} · ${escapeHtml(settings.companyName)}<br>${formatDate(r.createdAt)}</p>
    </div>

    <div class="doc-page">
      <h2 class="doc-h2">Table of Contents</h2>
      <div class="doc-toc-item"><span>1. Executive Summary</span><span>03</span></div>
      <div class="doc-toc-item"><span>2. Scope</span><span>03</span></div>
      <div class="doc-toc-item"><span>3. Findings Summary</span><span>04</span></div>
      <div class="doc-toc-item"><span>4. Detailed Findings</span><span>05</span></div>
      <div class="doc-toc-item"><span>5. Disclaimer</span><span>—</span></div>
      <h2 class="doc-h2" style="margin-top:50px;">1. Executive Summary</h2>
      <p class="doc-p">${escapeHtml(r.executiveSummary) || "—"}</p>
      <h2 class="doc-h2">2. Scope</h2>
      <p class="doc-p">${escapeHtml(r.scope) || "—"}</p>
    </div>

    <div class="doc-page">
      <h2 class="doc-h2">3. Findings Summary</h2>
      <table class="doc-table">
        <thead><tr><th>Finding</th><th>Severity</th><th>CVSS</th></tr></thead>
        <tbody>
          ${items.map((it) => `<tr><td>${escapeHtml(it.finding.title)}</td><td><span class="badge badge-${it.finding.severity}">${it.finding.severity}</span></td><td>${escapeHtml(it.finding.cvss || "—")}</td></tr>`).join("")}
        </tbody>
      </table>
      <div style="display:flex; gap:10px; margin-top:24px; flex-wrap:wrap;">
        ${SEVERITIES.map((s) => `<span class="badge badge-${s}">${s}: ${sevCounts[s]}</span>`).join("")}
      </div>
    </div>

    <div class="doc-page">
      <h2 class="doc-h2">4. Detailed Findings</h2>
      ${items.map((it) => `
        <div class="doc-finding">
          <div class="doc-finding-head">
            <span class="doc-finding-title">${escapeHtml(it.finding.title)}</span>
            <span class="badge badge-${it.finding.severity}">${it.finding.severity} ${it.finding.cvss ? "· CVSS " + escapeHtml(it.finding.cvss) : ""}</span>
          </div>
          <h3 class="doc-h3">Description</h3>
          <p class="doc-p">${escapeHtml(it.finding.description)}</p>
          <h3 class="doc-h3">Impact</h3>
          <p class="doc-p">${escapeHtml(it.finding.impact)}</p>
          <h3 class="doc-h3">Recommendation</h3>
          <p class="doc-p">${escapeHtml(it.finding.recommendation)}</p>
          ${it.evidence && it.evidence.length ? `<h3 class="doc-h3">Evidence</h3><div class="doc-evidence-grid">${it.evidence.map((src) => `<img src="${src}">`).join("")}</div>` : ""}
        </div>
      `).join("")}
      <div class="doc-footer"><span>${escapeHtml(settings.footerText)}</span><span>${escapeHtml(settings.companyName)}</span></div>
    </div>
  `;

  document.getElementById("reportPreviewDoc").innerHTML = doc;
  document.getElementById("reportPreviewOverlay").classList.add("open");
}

/* =========================================================
   FINDINGS LIBRARY
========================================================= */
function renderFindings(filter = "") {
  const list = DATA.findings
    .filter((f) => f.title.toLowerCase().includes(filter.toLowerCase()))
    .sort((a, b) => SEV_ORDER[a.severity] - SEV_ORDER[b.severity]);

  document.getElementById("mainContent").innerHTML = `
    <div class="page">
      <div class="page-toolbar">
        <input type="text" class="search-input" id="findingSearch" placeholder="Search findings..." value="${escapeHtml(filter)}">
        <button class="btn btn-primary" id="newFindingBtn">+ New Finding</button>
      </div>
      <div class="card-grid">
        ${list.length ? list.map(findingCardHtml).join("") : emptyState("▲", "No findings yet. Build your reusable library here.")}
      </div>
    </div>
  `;
  document.getElementById("findingSearch").addEventListener("input", (e) => renderFindings(e.target.value));
  document.getElementById("newFindingBtn").addEventListener("click", () => openFindingForm());

  document.querySelectorAll("[data-edit-finding]").forEach((el) =>
    el.addEventListener("click", () => openFindingForm(el.dataset.editFinding))
  );
  document.querySelectorAll("[data-delete-finding]").forEach((el) =>
    el.addEventListener("click", () => {
      if (confirm("Delete this finding from your library?")) {
        DATA.findings = DATA.findings.filter((f) => f.id !== el.dataset.deleteFinding);
        persist();
        renderFindings(filter);
        showToast("Finding deleted");
      }
    })
  );
}

function findingCardHtml(f) {
  return `
    <div class="glass-card item-card">
      <div class="item-card-top">
        <div class="item-card-title">${escapeHtml(f.title)}</div>
        <span class="badge badge-${f.severity}">${f.severity}</span>
      </div>
      <div class="item-card-sub">${f.cvss ? "CVSS " + escapeHtml(f.cvss) : "No CVSS score"}</div>
      <div class="item-card-sub" style="line-height:1.6;">${escapeHtml((f.description || "").slice(0, 110))}${f.description && f.description.length > 110 ? "…" : ""}</div>
      <div class="item-card-actions">
        <button class="btn btn-secondary btn-sm" data-edit-finding="${f.id}">Edit</button>
        <button class="btn btn-ghost btn-sm" data-delete-finding="${f.id}" style="color: var(--danger);">Delete</button>
      </div>
    </div>
  `;
}

function openFindingForm(findingId) {
  const editing = findingId ? DATA.findings.find((f) => f.id === findingId) : null;
  const html = `
    <h2 class="modal-title">${editing ? "Edit Finding" : "New Finding"}</h2>
    <div class="form-group">
      <label class="form-label">Title</label>
      <input type="text" class="form-input" id="fFindingTitle" value="${escapeHtml(editing ? editing.title : "")}" placeholder="e.g. SQL Injection in Login Form">
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Severity</label>
        <select class="form-select" id="fFindingSeverity">
          ${SEVERITIES.map((s) => `<option value="${s}" ${editing && editing.severity === s ? "selected" : ""}>${s.charAt(0).toUpperCase() + s.slice(1)}</option>`).join("")}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">CVSS Score (optional)</label>
        <input type="text" class="form-input" id="fFindingCvss" value="${escapeHtml(editing ? editing.cvss : "")}" placeholder="e.g. 9.8">
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Description</label>
      <textarea class="form-textarea" id="fFindingDesc" placeholder="What is the vulnerability?">${escapeHtml(editing ? editing.description : "")}</textarea>
    </div>
    <div class="form-group">
      <label class="form-label">Impact</label>
      <textarea class="form-textarea" id="fFindingImpact" placeholder="What could an attacker achieve?">${escapeHtml(editing ? editing.impact : "")}</textarea>
    </div>
    <div class="form-group">
      <label class="form-label">Recommendation</label>
      <textarea class="form-textarea" id="fFindingRec" placeholder="How should this be fixed?">${escapeHtml(editing ? editing.recommendation : "")}</textarea>
    </div>
    <div class="form-actions">
      <button class="btn btn-ghost" id="cancelFindingForm">Cancel</button>
      <button class="btn btn-primary" id="saveFindingForm">${editing ? "Save Changes" : "Add Finding"}</button>
    </div>
  `;
  openModal(html);
  document.getElementById("cancelFindingForm").addEventListener("click", closeModal);
  document.getElementById("saveFindingForm").addEventListener("click", () => {
    const title = document.getElementById("fFindingTitle").value.trim();
    if (!title) { showToast("Please give the finding a title"); return; }
    const payload = {
      title,
      severity: document.getElementById("fFindingSeverity").value,
      cvss: document.getElementById("fFindingCvss").value.trim(),
      description: document.getElementById("fFindingDesc").value.trim(),
      impact: document.getElementById("fFindingImpact").value.trim(),
      recommendation: document.getElementById("fFindingRec").value.trim(),
    };
    if (editing) Object.assign(editing, payload);
    else DATA.findings.push({ id: uid("finding"), ...payload, createdAt: new Date().toISOString() });
    persist();
    closeModal();
    renderFindings();
    showToast(editing ? "Finding updated" : "Finding added to library");
  });
}

/* =========================================================
   CLIENTS
========================================================= */
function renderClients(filter = "") {
  const list = DATA.clients
    .filter((c) => (c.company + c.name).toLowerCase().includes(filter.toLowerCase()))
    .sort((a, b) => a.company.localeCompare(b.company));

  document.getElementById("mainContent").innerHTML = `
    <div class="page">
      <div class="page-toolbar">
        <input type="text" class="search-input" id="clientSearch" placeholder="Search clients..." value="${escapeHtml(filter)}">
        <button class="btn btn-primary" id="newClientBtn">+ New Client</button>
      </div>
      <div class="card-grid">
        ${list.length ? list.map(clientCardHtml).join("") : emptyState("◈", "No clients yet.")}
      </div>
    </div>
  `;
  document.getElementById("clientSearch").addEventListener("input", (e) => renderClients(e.target.value));
  document.getElementById("newClientBtn").addEventListener("click", () => openClientForm());
  document.querySelectorAll("[data-edit-client]").forEach((el) =>
    el.addEventListener("click", () => openClientForm(el.dataset.editClient))
  );
  document.querySelectorAll("[data-delete-client]").forEach((el) =>
    el.addEventListener("click", () => {
      if (confirm("Delete this client?")) {
        DATA.clients = DATA.clients.filter((c) => c.id !== el.dataset.deleteClient);
        persist();
        renderClients(filter);
        showToast("Client deleted");
      }
    })
  );
}

function clientCardHtml(c) {
  const reportCount = DATA.reports.filter((r) => r.clientId === c.id).length;
  return `
    <div class="glass-card item-card">
      <div class="item-card-title">${escapeHtml(c.company)}</div>
      <div class="item-card-sub">${escapeHtml(c.name)} · ${escapeHtml(c.email)}</div>
      <div class="item-card-sub">${reportCount} report${reportCount === 1 ? "" : "s"}</div>
      <div class="item-card-actions">
        <button class="btn btn-secondary btn-sm" data-edit-client="${c.id}">Edit</button>
        <button class="btn btn-ghost btn-sm" data-delete-client="${c.id}" style="color: var(--danger);">Delete</button>
      </div>
    </div>
  `;
}

function openClientForm(clientId) {
  const editing = clientId ? DATA.clients.find((c) => c.id === clientId) : null;
  const html = `
    <h2 class="modal-title">${editing ? "Edit Client" : "New Client"}</h2>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Company</label>
        <input type="text" class="form-input" id="fClientCompany" value="${escapeHtml(editing ? editing.company : "")}">
      </div>
      <div class="form-group">
        <label class="form-label">Contact Name</label>
        <input type="text" class="form-input" id="fClientName" value="${escapeHtml(editing ? editing.name : "")}">
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Email</label>
      <input type="email" class="form-input" id="fClientEmail" value="${escapeHtml(editing ? editing.email : "")}">
    </div>
    <div class="form-group">
      <label class="form-label">Notes</label>
      <textarea class="form-textarea" id="fClientNotes">${escapeHtml(editing ? editing.notes : "")}</textarea>
    </div>
    <div class="form-actions">
      <button class="btn btn-ghost" id="cancelClientForm">Cancel</button>
      <button class="btn btn-primary" id="saveClientForm">${editing ? "Save Changes" : "Add Client"}</button>
    </div>
  `;
  openModal(html);
  document.getElementById("cancelClientForm").addEventListener("click", closeModal);
  document.getElementById("saveClientForm").addEventListener("click", () => {
    const company = document.getElementById("fClientCompany").value.trim();
    if (!company) { showToast("Please add a company name"); return; }
    const payload = {
      company,
      name: document.getElementById("fClientName").value.trim(),
      email: document.getElementById("fClientEmail").value.trim(),
      notes: document.getElementById("fClientNotes").value.trim(),
    };
    if (editing) Object.assign(editing, payload);
    else DATA.clients.push({ id: uid("client"), ...payload, createdAt: new Date().toISOString() });
    persist();
    closeModal();
    renderClients();
    showToast(editing ? "Client updated" : "Client added");
  });
}

/* =========================================================
   SETTINGS
========================================================= */
function renderSettings() {
  const s = DATA.settings;
  document.getElementById("mainContent").innerHTML = `
    <div class="page">
      <div class="glass-card panel" style="max-width:560px;">
        <h3 class="panel-title">Report Defaults</h3>
        <div class="form-group">
          <label class="form-label">Company / Firm Name</label>
          <input type="text" class="form-input" id="sCompanyName" value="${escapeHtml(s.companyName)}">
        </div>
        <div class="form-group">
          <label class="form-label">Analyst / Preparer Name</label>
          <input type="text" class="form-input" id="sAnalystName" value="${escapeHtml(s.analystName)}">
        </div>
        <div class="form-group">
          <label class="form-label">Report Footer / Disclaimer</label>
          <textarea class="form-textarea" id="sFooterText">${escapeHtml(s.footerText)}</textarea>
        </div>
        <div class="form-actions" style="justify-content:flex-start;">
          <button class="btn btn-primary" id="saveSettingsBtn">Save Settings</button>
        </div>
      </div>

      <div class="glass-card panel" style="max-width:560px; margin-top:24px;">
        <h3 class="panel-title">Data</h3>
        <p style="color:var(--text-light); font-size:14px; margin-bottom:18px;">All data is stored locally in this browser via localStorage. Nothing is sent to a server.</p>
        <div style="display:flex; gap:12px; flex-wrap:wrap;">
          <button class="btn btn-secondary" id="settingsExportBtn">Export JSON</button>
          <button class="btn btn-secondary" id="settingsSampleBtn">Load Sample Data</button>
          <button class="btn btn-danger" id="settingsResetBtn">Clear All Data</button>
        </div>
      </div>
    </div>
  `;
  document.getElementById("saveSettingsBtn").addEventListener("click", () => {
    DATA.settings = {
      companyName: document.getElementById("sCompanyName").value.trim() || "Your Security Firm",
      analystName: document.getElementById("sAnalystName").value.trim() || "Analyst",
      footerText: document.getElementById("sFooterText").value.trim(),
    };
    persist();
    showToast("Settings saved");
  });
  document.getElementById("settingsExportBtn").addEventListener("click", exportJson);
  document.getElementById("settingsSampleBtn").addEventListener("click", () => {
    if (confirm("This will add sample clients, findings, and reports so you can explore the app. Continue?")) {
      const sample = seedData();
      DATA.clients = DATA.clients.concat(sample.clients);
      DATA.findings = DATA.findings.concat(sample.findings);
      DATA.reports = DATA.reports.concat(sample.reports);
      persist();
      showToast("Sample data loaded");
      navigate();
    }
  });
  document.getElementById("settingsResetBtn").addEventListener("click", () => {
    if (confirm("This will permanently delete all reports, findings, and clients in this browser. Continue?")) {
      DATA = emptyData();
      persist();
      showToast("All data cleared");
      navigate();
    }
  });
}

/* =========================================================
   SHARED UI HELPERS
========================================================= */
function emptyState(icon, text) {
  return `<div class="empty-state" style="grid-column:1/-1;"><div class="empty-state-icon">${icon}</div>${text}</div>`;
}

function openModal(html) {
  document.getElementById("modalCard").innerHTML = html;
  document.getElementById("modalOverlay").classList.add("open");
}
function closeModal() {
  document.getElementById("modalOverlay").classList.remove("open");
}

let toastTimer;
function showToast(msg) {
  const toast = document.getElementById("toast");
  toast.textContent = msg;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2600);
}

function exportJson() {
  const blob = new Blob([JSON.stringify(DATA, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "reportforge-data.json";
  a.click();
  URL.revokeObjectURL(url);
  showToast("Data exported");
}

function bindRippleButtons() {
  document.querySelectorAll(".btn").forEach((btn) => {
    if (btn.dataset.rippleBound) return;
    btn.dataset.rippleBound = "1";
    btn.addEventListener("click", (e) => {
      const rect = btn.getBoundingClientRect();
      const ripple = document.createElement("span");
      const size = Math.max(rect.width, rect.height);
      ripple.className = "ripple";
      ripple.style.width = ripple.style.height = size + "px";
      ripple.style.left = e.clientX - rect.left - size / 2 + "px";
      ripple.style.top = e.clientY - rect.top - size / 2 + "px";
      btn.appendChild(ripple);
      setTimeout(() => ripple.remove(), 600);
    });
  });
}

/* =========================================================
   GLOBAL EVENT WIRING
========================================================= */
document.addEventListener("DOMContentLoaded", () => {
  // Sidebar collapse (desktop)
  const sidebar = document.getElementById("sidebar");
  const collapseBtn = document.getElementById("sidebarCollapse");
  const savedCollapsed = localStorage.getItem("rf_sidebar_collapsed") === "1";
  if (savedCollapsed) sidebar.classList.add("collapsed");
  collapseBtn.addEventListener("click", () => {
    sidebar.classList.toggle("collapsed");
    localStorage.setItem("rf_sidebar_collapsed", sidebar.classList.contains("collapsed") ? "1" : "0");
  });

  // Mobile nav toggle
  document.getElementById("mobileNavToggle").addEventListener("click", () => {
    sidebar.classList.toggle("mobile-open");
  });

  // Modal close on backdrop click
  document.getElementById("modalOverlay").addEventListener("click", (e) => {
    if (e.target.id === "modalOverlay") closeModal();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeModal();
      document.getElementById("reportPreviewOverlay").classList.remove("open");
    }
  });

  // Report preview close / print
  document.getElementById("closePreviewBtn").addEventListener("click", () => {
    document.getElementById("reportPreviewOverlay").classList.remove("open");
  });
  document.getElementById("printReportBtn").addEventListener("click", () => window.print());

  // Topbar actions
  document.getElementById("exportDataBtn").addEventListener("click", exportJson);
  document.getElementById("topbarNewReport").addEventListener("click", () => {
    location.hash = "#reports";
    setTimeout(() => openReportForm(), 50);
  });

  bindRippleButtons();
  const observer = new MutationObserver(() => bindRippleButtons());
  observer.observe(document.body, { childList: true, subtree: true });

  if (!location.hash) location.hash = "#dashboard";
  navigate();
});
