/* ─── DOM references ─── */
const apiDot       = document.querySelector("#api-dot");
const apiText      = document.querySelector("#api-text");
const sseDot       = document.querySelector("#sse-dot");
const sseText      = document.querySelector("#sse-text");
const refreshTimeEl = document.querySelector("#last-refresh-time");

const latestBlockEl  = document.querySelector("#latest-block");
const latestTxEl     = document.querySelector("#latest-tx");
const eventsCountEl  = document.querySelector("#events-count");
const eventsListEl   = document.querySelector("#events-list");
const classCountEl   = document.querySelector("#classifications-count");
const classListEl    = document.querySelector("#classifications-list");
const analyticsRowEl = document.querySelector("#analytics-row");

const livePillEl     = document.querySelector("#live-pill");
const liveDotEl      = document.querySelector("#live-dot");
const liveTextEl     = document.querySelector("#live-text");
const liveCountersEl = document.querySelector("#live-counters");
const lastEventBoxEl = document.querySelector("#last-event-box");

const eventTypeSelect  = document.querySelector("#event-type");
const eventLimitInput  = document.querySelector("#events-limit");
const eventOffsetInput = document.querySelector("#events-offset");
const classKindSelect  = document.querySelector("#classification-kind");
const classLimitInput  = document.querySelector("#classifications-limit");
const classOffsetInput = document.querySelector("#classifications-offset");

/* ─── state ─── */
let streamSource = null;
let liveStats    = { total: 0, rawtx: 0, rawblock: 0 };
let refreshTimer = null;

/* ─── helpers ─── */
function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function truncHash(s, keep = 12) {
  const str = String(s ?? "");
  return str.length > keep * 2 + 3 ? `${str.slice(0, keep)}…${str.slice(-6)}` : str;
}

function fmtTime(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleTimeString("pt-BR");
  } catch {
    return iso;
  }
}

/* ─── badge builders ─── */
function eventBadge(evt) {
  if (evt === "zmq_rawtx")    return `<span class="badge badge-rawtx">rawtx</span>`;
  if (evt === "zmq_rawblock") return `<span class="badge badge-rawblock">rawblock</span>`;
  if (evt)                    return `<span class="badge badge-default">${esc(evt)}</span>`;
  return "";
}

function kindBadge(kind) {
  if (kind === "coinbase_like")       return `<span class="badge badge-coinbase">coinbase</span>`;
  if (kind === "simple_payment_like") return `<span class="badge badge-payment">payment</span>`;
  if (kind === "block_event")         return `<span class="badge badge-block">block</span>`;
  return `<span class="badge badge-unknown">${esc(kind) || "unknown"}</span>`;
}

function confidenceBadge(conf) {
  if (conf === "high")   return `<span class="badge badge-high">high</span>`;
  if (conf === "medium") return `<span class="badge badge-medium">medium</span>`;
  if (conf === "low")    return `<span class="badge badge-low">low</span>`;
  return conf ? `<span class="badge badge-default">${esc(conf)}</span>` : "";
}

/* ─── KPI helpers ─── */
function updateKpi(id, value) {
  const card = document.querySelector(`#${id}`);
  if (!card) return;
  card.classList.remove("skeleton");
  card.querySelector(".kpi-value").textContent = value ?? "—";
}

/* ─── summary → KPIs + analytics ─── */
function applySummary(summary) {
  const classified = Math.max(
    0,
    (summary.total_events ?? 0) -
    (summary.ignored_lines ?? 0) -
    (summary.skipped_events ?? 0),
  );
  updateKpi("kpi-total",     summary.total_events);
  updateKpi("kpi-rawtx",     summary.rawtx_count);
  updateKpi("kpi-rawblock",  summary.rawblock_count);
  updateKpi("kpi-coinbase",  summary.coinbase_input_present_count ?? "—");
  updateKpi("kpi-opreturn",  summary.op_return_count ?? "—");
  updateKpi("kpi-classified", classified);

  const scriptChips = Object.entries(summary.script_type_counts ?? {})
    .map(
      ([k, v]) =>
        `<span class="a-chip">` +
        `<span class="a-chip-key">script</span>` +
        `<span class="a-chip-val">${esc(k)}</span>` +
        `<span class="a-chip-count">${v}</span>` +
        `</span>`,
    )
    .join("");

  const baseChips =
    `<span class="a-chip"><span class="a-chip-key">fonte</span>` +
    `<span class="a-chip-val">${esc(summary.source?.split("/").pop() ?? "—")}</span></span>` +
    `<span class="a-chip"><span class="a-chip-key">ignoradas</span>` +
    `<span class="a-chip-val">${summary.ignored_lines ?? 0}</span></span>` +
    `<span class="a-chip"><span class="a-chip-key">skipped</span>` +
    `<span class="a-chip-val">${summary.skipped_events ?? 0}</span></span>`;

  analyticsRowEl.innerHTML = scriptChips
    ? `${baseChips}<span class="analytics-sep"></span>${scriptChips}`
    : `${baseChips}<span class="empty-msg" style="padding:0 4px">sem script_types registrados</span>`;
}

/* ─── event row (from /events/recent) ─── */
function renderEventRow(item) {
  const evtType = item.event ?? "";
  const data    = item.data ?? {};
  const txid    = data.txid ?? "";
  const blkHash = data.hash ?? "";
  const height  = data.height ?? "";
  const hash    = txid || blkHash;

  return (
    `<div class="item-row">` +
    `<div class="item-row-top">` +
    eventBadge(evtType) +
    (height ? `<span class="badge badge-default">height ${esc(height)}</span>` : "") +
    (hash ? `<span class="item-row-hash" title="${esc(hash)}">${esc(truncHash(hash))}</span>` : "") +
    `<span class="item-row-time">${esc(fmtTime(item.ts))}</span>` +
    `</div>` +
    `</div>`
  );
}

/* ─── classification row (from /events/classifications) ─── */
function renderClassificationRow(item) {
  const kind   = item.kind ?? "";
  const txid   = item.txid ?? "";
  const hash   = item.hash ?? "";
  const height = item.height ?? "";
  const meta   = item.metadata ?? {};
  const conf   = meta.confidence ?? "";
  const reason = meta.reason ?? "";

  const signals = [];
  if (meta.coinbase_input_present) signals.push("coinbase_input");
  if (meta.has_op_return)          signals.push("op_return");
  if (Array.isArray(meta.script_types)) {
    for (const s of meta.script_types) signals.push(`script:${s}`);
  }

  const identifier = txid || hash;

  return (
    `<div class="item-row">` +
    `<div class="item-row-top">` +
    kindBadge(kind) +
    confidenceBadge(conf) +
    (height ? `<span class="badge badge-default">height ${esc(height)}</span>` : "") +
    (identifier
      ? `<span class="item-row-hash" title="${esc(identifier)}">${esc(truncHash(identifier))}</span>`
      : "") +
    `<span class="item-row-time">${esc(fmtTime(item.ts))}</span>` +
    `</div>` +
    (signals.length > 0
      ? `<div class="item-row-meta">${signals.map((s) => `<span>${esc(s)}</span>`).join("")}</div>`
      : "") +
    (reason ? `<div class="item-row-reason">${esc(reason)}</div>` : "") +
    `</div>`
  );
}

/* ─── block detail (from /blocks/latest) ─── */
function renderBlockDetail(data) {
  if (!data) return `<p class="empty-msg">Sem dados de bloco.</p>`;
  return (
    `<div class="kv-grid">` +
    `<div class="kv-row"><span class="kv-key">height</span><span class="kv-val">${esc(data.height ?? "—")}</span></div>` +
    `<div class="kv-row"><span class="kv-key">kind</span>${kindBadge(data.kind ?? "")}</div>` +
    `<div class="kv-row"><span class="kv-key">ts</span><span class="kv-val">${esc(fmtTime(data.ts))}</span></div>` +
    `<div class="kv-row"><span class="kv-key">hash</span><span class="kv-hash" title="${esc(data.hash ?? "")}">${esc(truncHash(data.hash ?? "—", 12))}</span></div>` +
    `</div>`
  );
}

/* ─── tx detail (from /tx/latest) ─── */
function renderTxDetail(data) {
  if (!data) return `<p class="empty-msg">Sem dados de transação.</p>`;

  const signals = [];
  if (data.coinbase_input_present) signals.push("coinbase_input");
  if (data.has_op_return)          signals.push("op_return");

  const scriptRow =
    Array.isArray(data.script_types) && data.script_types.length > 0
      ? `<div class="kv-row"><span class="kv-key">scripts</span><span class="kv-val">${esc(data.script_types.join(", "))}</span></div>`
      : "";

  const signalRow =
    signals.length > 0
      ? `<div class="kv-row"><span class="kv-key">signals</span><span class="kv-val">` +
        signals
          .map((s) => `<span class="badge badge-default" style="font-size:.64rem">${esc(s)}</span>`)
          .join(" ") +
        `</span></div>`
      : "";

  return (
    `<div class="kv-grid">` +
    `<div class="kv-row"><span class="kv-key">kind</span>${kindBadge(data.kind ?? "")}</div>` +
    `<div class="kv-row"><span class="kv-key">inputs</span><span class="kv-val">${esc(data.inputs ?? "—")}</span></div>` +
    `<div class="kv-row"><span class="kv-key">outputs</span><span class="kv-val">${esc(data.outputs ?? "—")}</span></div>` +
    `<div class="kv-row"><span class="kv-key">total_out</span><span class="kv-val">${esc(data.total_out ?? "—")} BTC</span></div>` +
    signalRow +
    scriptRow +
    `<div class="kv-row"><span class="kv-key">ts</span><span class="kv-val">${esc(fmtTime(data.ts))}</span></div>` +
    `<div class="kv-row"><span class="kv-key">txid</span><span class="kv-hash" title="${esc(data.txid ?? "")}">${esc(truncHash(data.txid ?? "", 12))}</span></div>` +
    `</div>`
  );
}

/* ─── live event box content ─── */
function renderLiveEvent(payload) {
  const evtType = payload?.event?.event ?? "";
  const cls     = payload?.classification ?? {};
  const kind    = cls.kind ?? "";
  const txid    = cls.txid ?? "";
  const hash    = cls.hash ?? "";
  const height  = cls.height ?? "";
  const meta    = cls.metadata ?? {};
  const signals = [];
  if (meta.coinbase_input_present) signals.push("coinbase_input");
  if (meta.has_op_return)          signals.push("op_return");
  const identifier = txid || hash;

  return (
    `<div class="item-row-top" style="margin-bottom:6px">` +
    eventBadge(evtType) +
    (kind ? kindBadge(kind) : "") +
    (height ? `<span class="badge badge-default">height ${esc(height)}</span>` : "") +
    `</div>` +
    (identifier
      ? `<div class="item-row-hash" style="max-width:100%;margin-bottom:6px" title="${esc(identifier)}">${esc(truncHash(identifier, 12))}</div>`
      : "") +
    (signals.length > 0
      ? `<div class="item-row-meta">${signals.map((s) => `<span>${esc(s)}</span>`).join("")}</div>`
      : "")
  );
}

/* ─── live counters ─── */
function renderLiveCounters() {
  liveCountersEl.innerHTML = [
    ["total", liveStats.total],
    ["rawtx", liveStats.rawtx],
    ["rawblock", liveStats.rawblock],
  ]
    .map(
      ([l, v]) => `<span class="live-chip">${esc(l)}&thinsp;<strong>${v}</strong></span>`,
    )
    .join("");
}

/* ─── status setters ─── */
function setApiStatus(ok) {
  apiDot.className    = `dot ${ok ? "dot-ok" : "dot-err"}`;
  apiText.textContent = ok ? "API ok" : "API erro";
}

function setSseStatus(state) {
  const isLive = state === "live" || state === "connected";
  livePillEl.className = `live-pill${isLive ? " active" : ""}`;

  if (isLive) {
    liveDotEl.className = "dot dot-live";
    liveTextEl.textContent = "ao vivo";
    sseDot.className = "dot dot-live";
    sseText.textContent = "SSE ao vivo";
  } else if (state === "reconnecting") {
    liveDotEl.className = "dot dot-warn";
    liveTextEl.textContent = "reconectando";
    sseDot.className = "dot dot-warn";
    sseText.textContent = "SSE reconect.";
  } else if (state === "error") {
    liveDotEl.className = "dot dot-err";
    liveTextEl.textContent = "erro";
    sseDot.className = "dot dot-err";
    sseText.textContent = "SSE erro";
  } else {
    liveDotEl.className = "dot dot-muted";
    liveTextEl.textContent = "conectando";
    sseDot.className = "dot dot-muted";
    sseText.textContent = "SSE";
  }
}

/* ─── select populator ─── */
function populateSelect(select, values, emptyLabel) {
  const current = select.value;
  select.innerHTML = `<option value="">${esc(emptyLabel)}</option>`;
  for (const v of values) {
    const opt = document.createElement("option");
    opt.value = v;
    opt.textContent = v;
    select.append(opt);
  }
  select.value = values.includes(current) ? current : "";
}

/* ─── fetch wrapper ─── */
async function fetchJson(path, params = {}) {
  const search = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== "" && v !== null && v !== undefined) search.set(k, String(v));
  }
  const url = search.size > 0 ? `${path}?${search}` : path;
  const res  = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} em ${url}`);
  return res.json();
}

/* ─── refresh functions ─── */
async function refreshSummary() {
  const [health, summary, block, tx] = await Promise.all([
    fetchJson("/health"),
    fetchJson("/summary"),
    fetchJson("/blocks/latest"),
    fetchJson("/tx/latest"),
  ]);

  setApiStatus(health.status === "ok");
  applySummary(summary);
  populateSelect(eventTypeSelect, summary.available_event_types ?? [], "Todos");
  populateSelect(classKindSelect,  summary.available_classification_kinds ?? [], "Todos");

  latestBlockEl.classList.remove("skeleton");
  latestBlockEl.innerHTML = renderBlockDetail(block);

  latestTxEl.classList.remove("skeleton");
  latestTxEl.innerHTML = renderTxDetail(tx);
}

async function refreshEvents() {
  const data = await fetchJson("/events/recent", {
    event_type: eventTypeSelect.value,
    limit:      eventLimitInput.value,
    offset:     eventOffsetInput.value,
  });

  eventsCountEl.textContent = `${data.items?.length ?? 0} / ${data.total_items ?? 0}`;
  eventsListEl.innerHTML =
    data.items?.length
      ? data.items.map(renderEventRow).join("")
      : `<p class="empty-msg">Nenhum evento encontrado.</p>`;
}

async function refreshClassifications() {
  const data = await fetchJson("/events/classifications", {
    kind:   classKindSelect.value,
    limit:  classLimitInput.value,
    offset: classOffsetInput.value,
  });

  classCountEl.textContent = `${data.items?.length ?? 0} / ${data.total_items ?? 0}`;
  classListEl.innerHTML =
    data.items?.length
      ? data.items.map(renderClassificationRow).join("")
      : `<p class="empty-msg">Nenhuma classificação encontrada.</p>`;
}

function scheduleRefresh() {
  if (refreshTimer !== null) return;
  refreshTimer = window.setTimeout(async () => {
    refreshTimer = null;
    await refreshAll();
  }, 250);
}

async function refreshAll() {
  try {
    await refreshSummary();
    await Promise.all([refreshEvents(), refreshClassifications()]);
    refreshTimeEl.textContent = new Date().toLocaleTimeString("pt-BR");
  } catch (err) {
    setApiStatus(false);
    const msg = err instanceof Error ? err.message : String(err);
    eventsListEl.innerHTML = `<p class="empty-msg" style="color:var(--c-err)">${esc(msg)}</p>`;
  }
}

/* ─── SSE connection ─── */
function connectStream() {
  if (streamSource) streamSource.close();
  setSseStatus("connecting");
  renderLiveCounters();
  streamSource = new EventSource("/events/stream");

  streamSource.addEventListener("stream_open", (ev) => {
    setSseStatus("connected");
    const payload = JSON.parse(ev.data);
    const types = (payload.event_types ?? []).join(", ");
    lastEventBoxEl.innerHTML =
      `<p style="color:var(--ink-muted);font-size:.82rem">Canal aberto · monitorando: ${esc(types)}</p>`;
  });

  streamSource.addEventListener("nodescope_event", (ev) => {
    setSseStatus("live");
    const payload = JSON.parse(ev.data);
    const evtName = payload?.event?.event ?? "";
    liveStats.total += 1;
    if (evtName === "zmq_rawtx")    liveStats.rawtx    += 1;
    if (evtName === "zmq_rawblock") liveStats.rawblock += 1;
    renderLiveCounters();
    lastEventBoxEl.innerHTML = renderLiveEvent(payload);
    scheduleRefresh();
  });

  streamSource.addEventListener("ping", () => {
    setSseStatus("live");
  });

  streamSource.onerror = () => {
    setSseStatus("reconnecting");
  };
}

/* ─── wiring ─── */
document.querySelector("#refresh-all").addEventListener("click", refreshAll);
document.querySelector("#refresh-events").addEventListener("click", refreshEvents);
document.querySelector("#refresh-classifications").addEventListener("click", refreshClassifications);

window.addEventListener("DOMContentLoaded", async () => {
  renderLiveCounters();
  await refreshAll();
  connectStream();
});
