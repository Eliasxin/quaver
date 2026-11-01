"use strict";
// QUAVER / QUATRE MAINS website starter.
// Displays ONLY records with published === true, status === "已發布" (or "已發佈")
// and non-empty title/content. Unpublished writing never renders.
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const ACTS = ["初識", "樂理", "磨合", "經典曲目", "終曲"];
let chapters = [];
let current = null;
let filterAct = "all";
let filterRating = "all";
let ageVerified = false;
let pending = null;
const reader = $("#readerDialog");
const ageDialog = $("#ageDialog");
const list = $("#storyList");
const ageState = () => {
  if (ageVerified) return true;
  try { return sessionStorage.getItem("quaver-age-confirmed") === "yes"; }
  catch { return false; }
};
function confirmAge() {
  ageVerified = true;
  try { sessionStorage.setItem("quaver-age-confirmed", "yes"); } catch { /* private mode */ }
}
function safeText(tag, className, value) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  el.textContent = String(value ?? "");
  return el;
}
function normalized(value) {
  return String(value ?? "").normalize("NFKC").trim().replace(/\s+/g, " ").toLocaleLowerCase();
}
function publicChapter(row) {
  if (!row || typeof row !== "object") return null;
  if (row.published !== true || !["已發布", "已發佈"].includes(row.status)) return null;
  if (!String(row.title || "").trim() || !String(row.content || "").trim()) return null;
  const order = Number(row.order);
  const act = Number(row.act || (Number.isFinite(order) ? Math.floor((order-1)/8)+1 : 0));
  if (!Number.isInteger(order) || order < 1 || order > 40 || act < 1 || act > 5) return null;
  return {
    id: String(row.id ?? order), order, act,
    title: String(row.title), content: String(row.content),
    rating: row.rating === "18+" ? "18+" : "一般",
    cp: Array.isArray(row.cp) ? row.cp.map(String).filter(Boolean) : [],
    composer: String(row.composer ?? ""), work: String(row.work ?? ""),
  };
}
function visibleChapters() {
  return chapters.filter(item =>
    (filterAct === "all" || item.act === Number(filterAct)) &&
    (filterRating === "all" || item.rating === filterRating)
  );
}
function updateFilters() {
  $$("[data-filter-act]").forEach(button => {
    const active = button.dataset.filterAct === filterAct;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });
  $("#ratingFilter").value = filterRating;
  render();
}
function render() {
  const visible = visibleChapters();
  list.replaceChildren();
  $("#catalogCount").textContent = visible.length ? `SHOWING ${visible.length} PUBLISHED ${visible.length === 1 ? "PIECE" : "PIECES"}` : "";
  $("#emptyStory").hidden = visible.length > 0;
  for (const chapter of visible) {
    const row = safeText("div", "story-row", "");
    row.append(safeText("span", "story-no", String(chapter.order).padStart(2, "0")));
    const textBox = document.createElement("div");
    textBox.append(safeText("h3", "", chapter.title));
    const meta = [ACTS[chapter.act-1], chapter.composer].filter(Boolean).join(" · ");
    textBox.append(safeText("p", "", meta));
    row.append(textBox);
    const tags = document.createElement("div");
    tags.className = "story-tags";
    tags.append(safeText("span", chapter.rating === "18+" ? "tag adult" : "tag", chapter.rating));
    chapter.cp.forEach(value => tags.append(safeText("span", "tag", value)));
    row.append(tags);
    const button = safeText("button", "story-read", "閱讀 ↗");
    button.type = "button";
    button.setAttribute("aria-label", `閱讀 ${chapter.title}`);
    button.addEventListener("click", () => openChapter(chapter));
    row.append(button);
    list.append(row);
  }
}
function routeRequest() {
  const match = /^#\/?read\/(.+)$/i.exec(location.hash);
  const params = new URLSearchParams(location.search);
  if (match) {
    let id = "";
    try { id = decodeURIComponent(match[1]); } catch { id = ""; }
    return {id, title: params.get("title") || ""};
  }
  if (!location.hash || location.hash === "#") return {id: params.get("chapter") || "", title: params.get("title") || ""};
  return null;
}
function findChapter(request) {
  if (!request) return null;
  const id = normalized(request.id);
  const title = normalized(request.title);
  return (id && chapters.find(ch => normalized(ch.id) === id || String(ch.order) === id)) ||
    (title && chapters.find(ch => normalized(ch.title) === title)) || null;
}
function resetHash() {
  if (location.hash !== "#stories") location.hash = "#stories";
  else route();
}
function openChapter(chapter) {
  const next = `#/read/${encodeURIComponent(chapter.id)}`;
  if (location.hash === next) route();
  else location.hash = next;
}
function showChapter(chapter) {
  current = chapter;
  $("#readerMovement").textContent = `MOVEMENT ${["I","II","III","IV","V"][chapter.act-1]} · ${ACTS[chapter.act-1]}`;
  $("#readerNumber").textContent = `PIECE NO. ${String(chapter.order).padStart(2,"0")}`;
  $("#readerTitle").textContent = chapter.title;
  $("#readerContent").textContent = chapter.content;
  const tags = $("#readerTags");
  tags.replaceChildren();
  tags.append(safeText("span", "tag", chapter.rating));
  chapter.cp.forEach(value => tags.append(safeText("span", "tag", value)));
  if (chapter.work) tags.append(safeText("span", "tag", chapter.work));
  const index = chapters.indexOf(chapter);
  $("#prevChapter").disabled = index <= 0;
  $("#nextChapter").disabled = index >= chapters.length - 1;
  if (!reader.open) reader.showModal();
  reader.querySelector(".reader-inner").scrollTop = 0;
}
function route() {
  const request = routeRequest();
  if (!request || (!request.id && !request.title)) {
    pending = null;
    if (ageDialog.open) ageDialog.close();
    if (reader.open) reader.close();
    return;
  }
  const chapter = findChapter(request);
  if (!chapter) {
    // Never open unpublished or nonexistent content, including by direct URL.
    resetHash();
    return;
  }
  if (chapter.rating === "18+" && !ageState()) {
    pending = chapter;
    if (!ageDialog.open) ageDialog.showModal();
    return;
  }
  pending = null;
  if (ageDialog.open) ageDialog.close();
  showChapter(chapter);
}
$$("[data-filter-act]").forEach(button => button.addEventListener("click", () => {
  filterAct = button.dataset.filterAct;
  updateFilters();
}));
$$(".movement-card").forEach(card => card.addEventListener("click", () => {
  filterAct = card.dataset.act;
  filterRating = "all";
  updateFilters();
}));
$("#ratingFilter").addEventListener("change", e => {filterRating = e.target.value; updateFilters();});
$("#closeReader").addEventListener("click", resetHash);
$("#backToCatalog").addEventListener("click", resetHash);
$("#prevChapter").addEventListener("click", () => {
  const pos = chapters.indexOf(current);
  if (pos > 0) openChapter(chapters[pos - 1]);
});
$("#nextChapter").addEventListener("click", () => {
  const pos = chapters.indexOf(current);
  if (pos < chapters.length - 1) openChapter(chapters[pos + 1]);
});
$("#declineAge").addEventListener("click", resetHash);
$("#confirmAge").addEventListener("click", () => { confirmAge(); ageDialog.close(); route(); });
reader.addEventListener("close", () => { if (routeRequest() && (routeRequest().id || routeRequest().title)) resetHash(); });
ageDialog.addEventListener("cancel", event => {event.preventDefault(); resetHash();});
window.addEventListener("hashchange", route);
window.addEventListener("popstate", route);
fetch("./data/chapters.json", {cache:"no-store"})
  .then(response => {if (!response.ok) throw new Error("章節資料目前無法讀取"); return response.json();})
  .then(json => {
    const rows = Array.isArray(json) ? json : (Array.isArray(json.chapters) ? json.chapters : []);
    chapters = rows.map(publicChapter).filter(Boolean).sort((a,b) => a.order-b.order);
    render();
    route();
  })
  .catch(err => { console.error("Quaver public catalog:", err); render(); });
