const form = document.getElementById("search-form");
const queryEl = document.getElementById("query");
const asOfEl = document.getElementById("as_of");
const resultsEl = document.getElementById("results");
const pipelineEl = document.getElementById("pipeline-info");
const jevPanelEl = document.getElementById("jev-panel");
const jevChipsEl = document.getElementById("jev-chips");
const jevNormsEl = document.getElementById("jev-norms");

asOfEl.valueAsDate = new Date();

document.querySelectorAll(".chip").forEach((chip) => {
  chip.addEventListener("click", () => {
    queryEl.value = chip.dataset.query;
    asOfEl.value = chip.dataset.asof || new Date().toISOString().slice(0, 10);
    runSearch();
  });
});

form.addEventListener("submit", (e) => {
  e.preventDefault();
  runSearch();
});

const STATUS_LABEL = {
  vergangen: "vergangen",
  aktuell: "aktuell gültig",
  zukuenftig: "tritt erst künftig in Kraft",
};

async function runSearch() {
  const query = queryEl.value.trim();
  if (!query) return;
  const asOf = asOfEl.value;

  resultsEl.innerHTML = '<div class="empty">Suche läuft …</div>';
  pipelineEl.classList.add("hidden");
  jevPanelEl?.classList.add("hidden");

  const params = new URLSearchParams({ query, as_of: asOf });
  const res = await fetch(`/api/search?${params.toString()}`);
  const data = await res.json();

  if (data.error) {
    resultsEl.innerHTML = `<div class="empty">${data.error}</div>`;
    return;
  }

  renderJevPanel(data.law_classification, data.jev_error, data.norm_classification, data.norm_jev_error);

  let pipelineText =
    `Stichtag ${data.as_of} · ${data.vector_candidates} Kandidaten (Vektor) / ` +
    `${data.text_candidates} (Volltext) → ${data.fused_candidates} nach RRF-Fusion → ` +
    `${data.results.length} nach Reranking`;
  if (data.matched_definitions && data.matched_definitions.length > 0) {
    const terms = data.matched_definitions.map((d) => d.term).join(", ");
    pipelineText =
      `Begriff erkannt: "${terms}" → Suche auf ${data.allowed_norm_count} verknüpfte Norm(en) eingeschränkt · ` +
      pipelineText;
  }
  pipelineEl.textContent = pipelineText;
  pipelineEl.classList.remove("hidden");

  if (data.results.length === 0) {
    resultsEl.innerHTML = '<div class="empty">Keine an diesem Stichtag gültigen Treffer.</div>';
    return;
  }

  resultsEl.innerHTML = data.results
    .map((r, i) => {
      const validTo = r.valid_to || "offen";
      return `
        <article class="card">
          <div class="card-head">
            <div class="card-title">${i + 1}. ${escapeHtml(r.law_short)} ${escapeHtml(r.norm_ref)} – ${escapeHtml(r.title)}</div>
            <div class="card-score">Score ${r.score.toFixed(3)}</div>
          </div>
          <div class="card-subtitle">gültig: ${r.valid_from} bis ${validTo}</div>
          <span class="badge ${r.status}">${STATUS_LABEL[r.status] || r.status}</span>
          <div class="card-body">${escapeHtml(r.body)}</div>
          <div class="card-footer"><a href="/norm/${r.id}">Quelle</a></div>
        </article>
      `;
    })
    .join("");
}

function renderJevPanel(laws, error, norms, normError) {
  if (!jevPanelEl) return;
  if (error) {
    jevChipsEl.innerHTML = `<div class="empty">Jev-Klassifikation nicht verfügbar: ${escapeHtml(error)}</div>`;
    jevNormsEl.innerHTML = "";
    jevPanelEl.classList.remove("hidden");
    return;
  }
  if (!laws || laws.length === 0) return;

  jevChipsEl.innerHTML = laws
    .map((l) => {
      const pct = Math.round(l.probability * 100);
      return `
        <span class="jev-chip ${l.relevant ? "relevant" : ""}">
          ${escapeHtml(l.law)} <span class="prob">${pct}%</span>
        </span>
      `;
    })
    .join("");

  if (normError) {
    jevNormsEl.innerHTML = `<div class="empty">Normen-Klassifikation nicht verfügbar: ${escapeHtml(normError)}</div>`;
  } else if (norms && norms.length > 0) {
    const byLaw = new Map();
    norms.forEach((n) => {
      if (!byLaw.has(n.law_short)) byLaw.set(n.law_short, []);
      byLaw.get(n.law_short).push(n);
    });
    jevNormsEl.innerHTML = Array.from(byLaw.entries())
      .map(([lawShort, list]) => {
        const chips = list
          .map((n) => {
            const pct = Math.round(n.probability * 100);
            return `
              <span class="jev-chip ${n.relevant ? "relevant" : ""}">
                ${escapeHtml(n.norm_ref)} <span class="prob">${pct}%</span>
              </span>
            `;
          })
          .join("");
        return `
          <div class="jev-norm-group">
            <span class="jev-norm-law">${escapeHtml(lawShort)} – einzelne Normen:</span>
            <div class="jev-panel">${chips}</div>
          </div>
        `;
      })
      .join("");
  } else {
    jevNormsEl.innerHTML = "";
  }

  jevPanelEl.classList.remove("hidden");
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}

const STATUS_COLOR = {
  vergangen: "#9ca3af",
  aktuell: "#16a34a",
  zukuenftig: "#2563eb",
};

async function loadTimeline() {
  const container = document.getElementById("timeline");
  try {
    const res = await fetch("/api/norms");
    const data = await res.json();
    renderTimeline(data.norms, data.today);
  } catch (err) {
    container.innerHTML = '<div class="empty">Zeitstrahl konnte nicht geladen werden.</div>';
  }
}

function renderTimeline(norms, todayStr) {
  const container = document.getElementById("timeline");
  if (!norms || norms.length === 0) {
    container.innerHTML = '<div class="empty">Keine Normen in der Datenbank.</div>';
    return;
  }

  const groups = new Map();
  norms.forEach((n) => {
    const key = `${n.law_short} ${n.norm_ref}`;
    if (!groups.has(key)) groups.set(key, { label: key, items: [] });
    groups.get(key).items.push(n);
  });
  const groupList = Array.from(groups.values()).sort((a, b) => a.label.localeCompare(b.label, "de"));

  const today = new Date(todayStr);
  const openEndedFallback = new Date(today.getFullYear() + 2, 0, 1);
  const allDates = [today];
  norms.forEach((n) => {
    allDates.push(new Date(n.valid_from));
    allDates.push(n.valid_to ? new Date(n.valid_to) : openEndedFallback);
  });
  const minDate = new Date(Math.min(...allDates));
  const maxDate = new Date(Math.max(...allDates));

  const marginLeft = 230;
  const marginRight = 24;
  const marginTop = 26;
  const marginBottom = 20;
  const rowHeight = 32;
  const chartWidth = 640;
  const width = marginLeft + chartWidth + marginRight;
  const height = marginTop + groupList.length * rowHeight + marginBottom;

  const xScale = (d) => marginLeft + ((d - minDate) / (maxDate - minDate)) * chartWidth;

  let svg = `<svg viewBox="0 0 ${width} ${height}" width="100%" height="${height}" xmlns="http://www.w3.org/2000/svg">`;

  const startYear = minDate.getFullYear();
  const endYear = maxDate.getFullYear();
  for (let y = startYear; y <= endYear; y++) {
    const x = xScale(new Date(y, 0, 1));
    svg += `<line x1="${x}" y1="${marginTop - 8}" x2="${x}" y2="${height - marginBottom + 4}" stroke="#e2e4e9" stroke-width="1" />`;
    svg += `<text x="${x}" y="${marginTop - 12}" font-size="10" fill="#6b7280" text-anchor="middle">${y}</text>`;
  }

  groupList.forEach((g, i) => {
    const y = marginTop + i * rowHeight;
    svg += `<text x="0" y="${y + rowHeight / 2 + 4}" font-size="12" fill="#1a1d23">${escapeHtml(g.label)}</text>`;
    g.items.forEach((item) => {
      const x1 = xScale(new Date(item.valid_from));
      const x2 = xScale(item.valid_to ? new Date(item.valid_to) : maxDate);
      const barWidth = Math.max(x2 - x1, 4);
      const color = STATUS_COLOR[item.status] || "#999";
      const validTo = item.valid_to || "offen";
      svg += `<a href="/norm/${item.id}">`;
      svg += `<rect x="${x1}" y="${y + 7}" width="${barWidth}" height="${rowHeight - 15}" rx="4" fill="${color}">`;
      svg += `<title>${escapeHtml(item.title)}\n${item.valid_from} bis ${validTo}</title>`;
      svg += `</rect>`;
      svg += `</a>`;
    });
  });

  const xToday = xScale(today);
  svg += `<line x1="${xToday}" y1="${marginTop - 8}" x2="${xToday}" y2="${height - marginBottom + 4}" stroke="#111827" stroke-width="1.5" stroke-dasharray="4 3" />`;
  svg += `<text x="${xToday}" y="${height - 4}" font-size="10" fill="#111827" text-anchor="middle">heute</text>`;

  svg += `</svg>`;
  container.innerHTML = svg;
}

loadTimeline();
