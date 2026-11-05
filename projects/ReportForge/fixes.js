/* ReportForge fixes — load AFTER script.js */

/* 1. Search boxes keep focus while typing */
(function () {
  const map = { renderReports: "reportSearch", renderFindings: "findingSearch", renderClients: "clientSearch" };
  Object.keys(map).forEach((name) => {
    const orig = window[name];
    window[name] = function (filter = "") {
      const active = document.activeElement;
      const hadFocus = active && active.id === map[name];
      orig(filter);
      if (hadFocus) {
        const el = document.getElementById(map[name]);
        if (el) { el.focus(); el.setSelectionRange(el.value.length, el.value.length); }
      }
    };
  });
})();

/* 5a. Storage: never throw, tell the user when it fails */
window.saveData = function (data) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(data));
    return true;
  } catch (e) {
    showToast("Storage full — export JSON and remove some evidence images");
    return false;
  }
};

/* 4. Correct table of contents (page numbers match the real layout) */
(function () {
  const orig = window.openReportPreview;
  window.openReportPreview = function (id) {
    orig(id);
    const items = document.querySelectorAll("#reportPreviewDoc .doc-toc-item");
    const pages = ["02", "02", "03", "04"];
    items.forEach((el, i) => {
      if (i >= pages.length) { el.remove(); return; } // drops non-existent "Disclaimer"
      el.lastElementChild.textContent = pages[i];
    });
  };
})();

/* 5b + extras: finding picker with image downscaling, scroll preservation,
   and no crash if a finding is unticked while an image is loading */
function downscaleImage(file, maxSize = 1280, quality = 0.8) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * scale);
      c.height = Math.round(img.height * scale);
      c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("bad image")); };
    img.src = url;
  });
}

window.renderFindingPicker = function renderFindingPicker(itemsState) {
  const picker = document.getElementById("findingPicker");
  if (!picker) return;
  const prevScroll = picker.scrollTop;

  if (!DATA.findings.length) {
    picker.innerHTML = `<p style="color:var(--text-light); font-size:13px;">No findings in your library yet — add some in Findings Library first.</p>`;
    return;
  }

  const updateLabel = () => {
    const label = document.getElementById("findingPickerLabel");
    if (label) label.textContent = `Findings included (${Object.keys(itemsState).length} selected)`;
  };

  const sorted = [...DATA.findings].sort((a, b) => SEV_ORDER[a.severity] - SEV_ORDER[b.severity]);
  picker.innerHTML = sorted.map((f) => {
    const selected = Object.prototype.hasOwnProperty.call(itemsState, f.id);
    const evidence = selected ? itemsState[f.id].evidence : [];
    return `
      <div class="finding-picker-item ${selected ? "selected" : ""}" data-finding-id="${f.id}">
        <div style="display:flex; align-items:center; gap:12px; cursor:pointer;" data-toggle-finding="${f.id}" role="button" tabindex="0">
          <span class="badge badge-${f.severity}">${f.severity}</span>
          <span class="fp-title">${escapeHtml(f.title)}</span>
        </div>
        ${selected ? `
          <div style="margin-top:12px; padding-top:12px; border-top:1px solid var(--glass-border);">
            <label class="file-drop" style="display:block;">
              📎 Add evidence image(s)
              <input type="file" accept="image/*" multiple data-evidence-input="${f.id}" style="display:none;">
            </label>
            <div class="evidence-thumbs">
              ${evidence.map((src, i) => `
                <div class="evidence-thumb">
                  <img src="${src}" alt="Evidence ${i + 1} for ${escapeHtml(f.title)}">
                  <button class="evidence-thumb-remove" data-remove-evidence="${f.id}" data-evidence-index="${i}" type="button" aria-label="Remove image">✕</button>
                </div>`).join("")}
            </div>
          </div>` : ""}
      </div>`;
  }).join("");
  picker.scrollTop = prevScroll;

  picker.querySelectorAll("[data-toggle-finding]").forEach((el) => {
    const toggle = () => {
      const id = el.dataset.toggleFinding;
      if (Object.prototype.hasOwnProperty.call(itemsState, id)) delete itemsState[id];
      else itemsState[id] = { evidence: [] };
      renderFindingPicker(itemsState);
      updateLabel();
    };
    el.addEventListener("click", toggle);
    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); }
    });
  });

  picker.querySelectorAll("[data-evidence-input]").forEach((input) => {
    input.addEventListener("click", (e) => e.stopPropagation());
    input.addEventListener("change", async (e) => {
      const fid = input.dataset.evidenceInput;
      const files = Array.from(e.target.files || []);
      if (!files.length) return;
      for (const file of files) {
        try {
          const data = await downscaleImage(file);
          if (itemsState[fid]) itemsState[fid].evidence.push(data); // finding may have been unticked
        } catch (err) {
          showToast("Couldn't read one of the images");
        }
      }
      renderFindingPicker(itemsState);
    });
  });

  picker.querySelectorAll("[data-remove-evidence]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const fid = btn.dataset.removeEvidence;
      const idx = parseInt(btn.dataset.evidenceIndex, 10);
      if (itemsState[fid]) itemsState[fid].evidence.splice(idx, 1);
      renderFindingPicker(itemsState);
    });
  });
};

/* Accessibility basics */
(function () {
  const toast = document.getElementById("toast");
  if (toast) { toast.setAttribute("role", "status"); toast.setAttribute("aria-live", "polite"); }
  const card = document.getElementById("modalCard");
  if (card) { card.setAttribute("role", "dialog"); card.setAttribute("aria-modal", "true"); }
})();

/* ---- Printing: self-contained print window (no dependency on style.css) ---- */
const PRINT_CSS = `
@page { size: A4; margin: 14mm; }
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: Inter, Arial, sans-serif; color: #1a1a2e; background: #fff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
.doc-page { break-after: page; page-break-after: always; }
.doc-page:last-child { break-after: auto; page-break-after: auto; }
.doc-cover { min-height: 250mm; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; }
.doc-tag { font-family: "JetBrains Mono", monospace; color: #0891b2; letter-spacing: .1em; text-transform: uppercase; font-size: 13px; margin-bottom: 24px; }
.doc-cover h1 { font-family: "Space Grotesk", Arial, sans-serif; font-size: 40px; margin-bottom: 16px; }
.doc-client { font-size: 18px; color: #555; margin-bottom: 60px; }
.doc-meta { font-size: 13px; color: #888; line-height: 1.7; }
.doc-h2 { font-family: "Space Grotesk", Arial, sans-serif; font-size: 26px; margin: 0 0 22px; border-bottom: 3px solid #22d3ee; padding-bottom: 12px; }
.doc-h3 { font-family: "Space Grotesk", Arial, sans-serif; font-size: 17px; margin: 20px 0 8px; }
.doc-p { font-size: 14.5px; line-height: 1.8; color: #333; margin-bottom: 14px; white-space: pre-wrap; }
.doc-toc-item { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px dotted #ccc; font-size: 14.5px; }
.doc-table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 13.5px; }
.doc-table th { text-align: left; background: #f4f6fa; padding: 10px 14px; font-family: "JetBrains Mono", monospace; font-size: 11px; text-transform: uppercase; color: #555; }
.doc-table td { padding: 12px 14px; border-bottom: 1px solid #eee; }
.doc-finding { margin-bottom: 30px; padding-bottom: 24px; border-bottom: 1px solid #eee; break-inside: avoid; page-break-inside: avoid; }
.doc-finding-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; gap: 12px; }
.doc-finding-title { font-family: "Space Grotesk", Arial, sans-serif; font-size: 19px; font-weight: 600; }
.doc-evidence-grid { display: flex; gap: 12px; flex-wrap: wrap; margin: 14px 0; }
.doc-evidence-grid img { width: 160px; height: 110px; object-fit: cover; border-radius: 6px; border: 1px solid #eee; }
.doc-footer { display: flex; justify-content: space-between; font-size: 11px; color: #999; border-top: 1px solid #eee; padding-top: 10px; margin-top: 30px; }
.badge { display: inline-block; padding: 4px 12px; border-radius: 50px; font-size: 12px; font-weight: 700; font-family: "JetBrains Mono", monospace; text-transform: uppercase; border: 1px solid; }
.badge-critical { color: #b91c1c; background: #fee2e2; border-color: #f3a5a5; }
.badge-high { color: #b45309; background: #ffedd5; border-color: #f5c08a; }
.badge-medium { color: #92600a; background: #fef3c7; border-color: #f5d57a; }
.badge-low { color: #0b6a96; background: #e0f2fe; border-color: #9fd3f0; }
.badge-info { color: #475569; background: #e2e8f0; border-color: #b6c2d1; }
`;

function printReport() {
  const docHtml = document.getElementById("reportPreviewDoc").innerHTML;
  const title = (document.querySelector("#reportPreviewDoc h1") || {}).textContent || "Report";
  const w = window.open("", "_blank");
  if (!w) { showToast("Allow pop-ups for this page to print"); return; }
  w.document.write(
    '<!DOCTYPE html><html><head><meta charset="utf-8"><title></title>' +
    '<link rel="preconnect" href="https://fonts.googleapis.com">' +
    '<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400..700&family=Inter:wght@100..900&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">' +
    "<style>" + PRINT_CSS + "</style></head><body>" + docHtml + "</body></html>"
  );
  w.document.close();
  w.document.title = title;
  w.addEventListener("load", () => { w.focus(); setTimeout(() => w.print(), 500); });
}

// Intercept the click before script.js's own window.print() handler can run.
// (script.js attaches that handler later, on DOMContentLoaded, so replacing the
// button here would not remove it. A capture-phase listener beats it every time.)
document.addEventListener("click", (e) => {
  const btn = e.target.closest && e.target.closest("#printReportBtn");
  if (!btn) return;
  e.stopImmediatePropagation();
  e.preventDefault();
  printReport();
}, true);

console.log("[ReportForge] fixes.js loaded");
