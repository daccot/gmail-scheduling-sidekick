import { applyStaticI18n, resolveLanguage, tr } from "./i18n";
import { getMemo, getSettings, saveMemo } from "./storage";
import type { Candidate, CandidateMode, Settings, SlotPattern, TimeBand, Tone, ResolvedLanguage, GmailContext, DetectedTime } from "./types";

const state: {
  settings: Settings | null;
  language: ResolvedLanguage;
  candidates: Candidate[];
  templateText: string;
  currentThreadId: string | null;
  detectedTimes: DetectedTime[];
} = {
  settings: null,
  language: "en",
  candidates: [],
  templateText: "",
  currentThreadId: null,
  detectedTimes: []
};

document.addEventListener("DOMContentLoaded", async () => {
  state.settings = await getSettings();
  state.language = resolveLanguage(state.settings.language);
  applyStaticI18n(state.language);

  bindEvents();
  setDefaults();
  await initThreadMemo();
  await setVersion();
  renderCandidates();
});

function bindEvents(): void {
  byId("generateBtn").addEventListener("click", generateCandidates);
  byId("addManualBtn").addEventListener("click", addManualCandidate);
  byId("clearCandidatesBtn").addEventListener("click", () => {
    state.candidates = [];
    renderCandidates();
  });

  byId("copyCandidatesBtn").addEventListener("click", () => copyText(formatCandidates()));
  byId("insertCandidatesBtn").addEventListener("click", () => insertToGmail(formatCandidates()));

  document.querySelectorAll<HTMLButtonElement>(".templateBtn").forEach((button) => {
    button.addEventListener("click", () => generateTemplate(button.dataset.template || "meeting"));
  });

  byId("copyTemplateBtn").addEventListener("click", () => copyText(state.templateText));
  byId("insertTemplateBtn").addEventListener("click", () => insertToGmail(state.templateText));
  byId("openAllHoldsBtn").addEventListener("click", openAllHoldUrls);
  byId("copyHoldLinksBtn").addEventListener("click", () => copyText(buildHoldUrls().join("\n")));
  byId("saveMemoBtn").addEventListener("click", saveMemoFromUi);
  byId("clearMemoBtn").addEventListener("click", clearMemo);
  byId("openCalendarBtn").addEventListener("click", openCalendar);
  byId("getContextBtn").addEventListener("click", getGmailContext);
  byId("detectConfirmedTimeBtn").addEventListener("click", detectConfirmedTimes);
  byId("optionsBtn").addEventListener("click", () => chrome.runtime.openOptionsPage());
}

function setDefaults(): void {
  const settings = requireSettings();

  setSelectValue("duration", String(settings.defaultDurationMinutes));
  setSelectValue("candidateCount", String(settings.candidateCount));
  setSelectValue("tone", settings.defaultTone);

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  setInputValue("startDate", toDateInput(tomorrow));
  setInputValue("manualDate", toDateInput(tomorrow));

  setInputValue("holdTitle", state.language === "ja" ? settings.defaultHoldTitleJa : settings.defaultHoldTitleEn);
  setInputValue("holdDetails", state.language === "ja" ? settings.defaultHoldDetailsJa : settings.defaultHoldDetailsEn);
  (byId("holdBusy") as HTMLInputElement).checked = settings.defaultHoldBusy !== false;

  const localeEl = byId("locale");
  localeEl.textContent = state.language;
  (byId("memo") as HTMLTextAreaElement).placeholder = tr(state.language, "memoPlaceholder");
}

async function setVersion(): Promise<void> {
  const response = await sendMessage({ type: "GET_VERSION" });
  byId("version").textContent = response.ok ? `v${response.version}` : "v?";
}

function generateCandidates(): void {
  const mode = getSelectValue("mode") as CandidateMode;
  if (mode === "manual") {
    showStatus(tr(state.language, "modeManual"), false);
    return;
  }

  const start = parseDate(getInputValue("startDate")) || new Date();
  const count = Number(getSelectValue("candidateCount"));
  const duration = Number(getSelectValue("duration"));
  const span = Number(getSelectValue("daySpan"));
  const slots = buildSlots(getSelectValue("timeBand") as TimeBand, getSelectValue("slotPattern") as SlotPattern);
  const pool: Array<{ start: Date; end: Date }> = [];
  const settings = requireSettings();

  for (let i = 0; i < span; i++) {
    const day = new Date(start);
    day.setDate(start.getDate() + i);

    if (settings.skipWeekends && [0, 6].includes(day.getDay())) continue;

    for (const time of slots) {
      const [hour, minute] = time.split(":").map(Number);
      const candidateStart = new Date(day);
      candidateStart.setHours(hour, minute, 0, 0);
      const candidateEnd = new Date(candidateStart.getTime() + duration * 60_000);
      pool.push({ start: candidateStart, end: candidateEnd });
    }
  }

  let selected: Array<{ start: Date; end: Date }> = [];

  if (mode === "continuous") {
    selected = pool.filter((_, index) => index % slots.length === 0).slice(0, count);
  } else {
    const step = Math.max(1, Math.floor(pool.length / count));
    for (let i = 0; i < pool.length && selected.length < count; i += step) selected.push(pool[i]);
    if (selected.length < count) selected = pool.slice(0, count);
  }

  state.candidates = selected.map((item) => ({
    id: crypto.randomUUID(),
    startIso: item.start.toISOString(),
    endIso: item.end.toISOString()
  }));

  renderCandidates();
}

function buildSlots(band: TimeBand, pattern: SlotPattern): string[] {
  let slots: string[];

  if (band === "morning") slots = ["09:30", "10:00", "10:30", "11:00"];
  else if (band === "afternoon") slots = ["13:30", "14:00", "15:00", "16:00"];
  else if (band === "custom") slots = ["10:00", "14:00", "16:00"];
  else slots = ["10:00", "11:00", "13:30", "15:00", "16:00"];

  if (pattern === "early") return [...slots].sort();
  if (pattern === "late") return [...slots].sort().reverse();
  return slots;
}

function addManualCandidate(): void {
  const date = parseDate(getInputValue("manualDate"));
  if (!date) {
    showStatus(tr(state.language, "manualDate"), true);
    return;
  }

  const [hour, minute] = getInputValue("manualTime").split(":").map(Number);
  const start = new Date(date);
  start.setHours(hour, minute, 0, 0);
  const end = new Date(start.getTime() + Number(getSelectValue("duration")) * 60_000);

  state.candidates.push({
    id: crypto.randomUUID(),
    startIso: start.toISOString(),
    endIso: end.toISOString()
  });

  renderCandidates();
}

function renderCandidates(): void {
  const container = byId("candidateList");

  if (state.candidates.length === 0) {
    container.innerHTML = `<div class="result">${escapeHtml(tr(state.language, "noCandidates"))}</div>`;
    return;
  }

  container.innerHTML = state.candidates.map((candidate, index) => `
    <div class="candidate">
      <div class="candidateTop">
        <div class="candidateTitle">${index + 1}. ${escapeHtml(formatCandidate(candidate))}</div>
        <div class="candidateActions">
          <button class="light" data-action="copy" data-id="${candidate.id}">${escapeHtml(tr(state.language, "copy"))}</button>
          <button class="light" data-action="hold" data-id="${candidate.id}">${escapeHtml(tr(state.language, "hold"))}</button>
          <button class="danger" data-action="delete" data-id="${candidate.id}">${escapeHtml(tr(state.language, "delete"))}</button>
        </div>
      </div>
    </div>
  `).join("");

  container.querySelectorAll<HTMLButtonElement>("button").forEach((button) => {
    button.addEventListener("click", () => {
      const action = button.dataset.action || "";
      const id = button.dataset.id || "";
      candidateAction(action, id);
    });
  });
}

function candidateAction(action: string, id: string): void {
  const candidate = state.candidates.find((item) => item.id === id);
  if (!candidate) return;

  if (action === "copy") copyText(formatCandidate(candidate));
  if (action === "hold") {
    openUrls([buildHoldUrl(candidate)]).then(() => showStatus(tr(state.language, "holdOpened"), false));
  }
  if (action === "delete") {
    state.candidates = state.candidates.filter((item) => item.id !== id);
    renderCandidates();
  }
}

function formatCandidates(): string {
  return state.candidates.map((candidate, index) => `${index + 1}. ${formatCandidate(candidate)}`).join("\n");
}

function formatCandidate(candidate: Candidate): string {
  const start = new Date(candidate.startIso);
  const end = new Date(candidate.endIso);
  return `${formatDate(start)} ${formatTime(start)}〜${formatTime(end)}`;
}

function generateTemplate(type: string): void {
  if (state.candidates.length === 0) generateCandidates();

  const settings = requireSettings();
  const tone = getSelectValue("tone") as Tone;
  const prefix = tone === "formal" ? tr(state.language, "prefixFormal") : tr(state.language, "prefixPolite");
  const close = {
    polite: tr(state.language, "closePolite"),
    casual: tr(state.language, "closeCasual"),
    formal: tr(state.language, "closeFormal")
  }[tone];

  const online = settings.includeOnlineMeetingLine
    ? "\n" + (state.language === "ja" ? settings.onlineMeetingTextJa : settings.onlineMeetingTextEn)
    : "";

  const memo = getTextareaValue("memo").trim();
  const memoBlock = settings.includeThreadMemoInTemplate && memo
    ? `\n\n${tr(state.language, "contextNoteHeader")}:\n${memo}`
    : "";

  const message = {
    interview: tr(state.language, "msgInterview"),
    meeting: tr(state.language, "msgMeeting"),
    reschedule: tr(state.language, "msgReschedule"),
    thanks: tr(state.language, "msgThanks")
  }[type] || tr(state.language, "msgMeeting");

  state.templateText = `${prefix}\n\n${message}\n\n${formatCandidates()}${online}${memoBlock}\n\n${close}`;
  byId("templateResult").textContent = state.templateText;
}

function buildHoldUrls(): string[] {
  return state.candidates.map(buildHoldUrl);
}

function buildHoldUrl(candidate: Candidate): string {
  const title = getInputValue("holdTitle") || "Tentative";
  const details = getInputValue("holdDetails") || "";
  const busy = (byId("holdBusy") as HTMLInputElement).checked;
  const dates = `${toCalendarUtc(new Date(candidate.startIso))}/${toCalendarUtc(new Date(candidate.endIso))}`;

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates,
    details,
    ctz: Intl.DateTimeFormat().resolvedOptions().timeZone
  });

  if (!busy) params.set("trp", "true");

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

async function openAllHoldUrls(): Promise<void> {
  const urls = buildHoldUrls();
  if (urls.length === 0) {
    showStatus(tr(state.language, "holdNoCandidates"), true);
    return;
  }

  await openUrls(urls);
  showStatus(tr(state.language, "holdOpened"), false);
}

async function openUrls(urls: string[]): Promise<void> {
  const response = await sendMessage({ type: "OPEN_URLS", urls });
  if (!response.ok) showStatus(response.error, true);
}

async function insertToGmail(text: string): Promise<void> {
  if (!text.trim()) {
    showStatus(tr(state.language, "emptyCopy"), true);
    return;
  }

  const response = await sendMessage({ type: "INSERT_TEXT_TO_GMAIL", text });
  if (!response.ok || !response.result?.ok) showStatus(tr(state.language, "insertFail"), true);
  else showStatus(tr(state.language, "inserted"), false);
}

async function copyText(text: string): Promise<void> {
  if (!String(text || "").trim()) {
    showStatus(tr(state.language, "emptyCopy"), true);
    return;
  }

  await navigator.clipboard.writeText(text);
  showStatus(tr(state.language, "copied"), false);
}

async function saveMemoFromUi(): Promise<void> {
  const memo = getTextareaValue("memo");

  if (state.currentThreadId) {
    await sendMessage({ type: "SAVE_THREAD_MEMO", threadId: state.currentThreadId, memo });
  } else {
    await saveMemo(memo);
  }

  const saved = byId("memoSaved");
  saved.style.display = "block";
  setTimeout(() => { saved.style.display = "none"; }, 1500);
}

async function initThreadMemo(): Promise<void> {
  const contextResponse = await sendMessage({ type: "GET_GMAIL_CONTEXT" });
  const context: GmailContext | undefined = contextResponse?.result?.result || contextResponse?.result;

  state.currentThreadId = context?.threadId || null;
  renderThreadInfo();

  if (state.currentThreadId) {
    const memoResponse = await sendMessage({ type: "GET_THREAD_MEMO", threadId: state.currentThreadId });
    setTextareaValue("memo", memoResponse.ok ? memoResponse.memo || "" : "");
  } else {
    setTextareaValue("memo", await getMemo());
  }
}

function renderThreadInfo(): void {
  const el = byId("threadInfo");
  if (state.currentThreadId) {
    el.textContent = `${tr(state.language, "threadMemoActive")}: ${state.currentThreadId}`;
  } else {
    el.textContent = tr(state.language, "threadMemoInactive");
  }
}

async function clearMemo(): Promise<void> {
  setTextareaValue("memo", "");

  if (state.currentThreadId) {
    await sendMessage({ type: "SAVE_THREAD_MEMO", threadId: state.currentThreadId, memo: "" });
  } else {
    await saveMemo("");
  }

  showStatus(tr(state.language, "saved"), false);
}


async function detectConfirmedTimes(): Promise<void> {
  const response = await sendMessage({ type: "GET_GMAIL_CONTEXT" });
  const context: GmailContext | undefined = response?.result?.result || response?.result;

  if (!context?.visibleText) {
    state.detectedTimes = [];
    renderDetectedTimes();
    return;
  }

  state.detectedTimes = detectTimesFromText(context.visibleText);
  renderDetectedTimes();
}

function detectTimesFromText(text: string): DetectedTime[] {
  const results: DetectedTime[] = [];
  const now = new Date();
  const year = now.getFullYear();
  const duration = Number(getSelectValue("duration")) || 30;

  const normalized = text
    .replace(/[０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xFEE0))
    .replace(/午後/g, "PM")
    .replace(/午前/g, "AM");

  const patterns = [
    /(\d{1,2})[\/月](\d{1,2})(?:日)?(?:[（(][日月火水木金土A-Za-z]{1,3}[）)])?.{0,20}?(AM|PM)?\s*(\d{1,2})(?::|時)?(\d{2})?/g,
    /(\d{4})[\/-](\d{1,2})[\/-](\d{1,2}).{0,20}?(AM|PM)?\s*(\d{1,2})(?::|時)?(\d{2})?/g
  ];

  for (const pattern of patterns) {
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(normalized)) !== null && results.length < 10) {
      let y = year;
      let month: number;
      let day: number;
      let ampm: string | undefined;
      let hour: number;
      let minute: number;

      if (match.length === 6) {
        month = Number(match[1]);
        day = Number(match[2]);
        ampm = match[3];
        hour = Number(match[4]);
        minute = Number(match[5] || "0");
      } else {
        y = Number(match[1]);
        month = Number(match[2]);
        day = Number(match[3]);
        ampm = match[4];
        hour = Number(match[5]);
        minute = Number(match[6] || "0");
      }

      if (ampm === "PM" && hour < 12) hour += 12;
      if (ampm === "AM" && hour === 12) hour = 0;

      if (!isValidDateParts(y, month, day, hour, minute)) continue;

      const start = new Date(y, month - 1, day, hour, minute, 0, 0);
      const end = new Date(start.getTime() + duration * 60_000);

      if (start.getTime() < now.getTime() - 86400000) continue;

      const raw = match[0].trim();
      if (results.some((r) => Math.abs(new Date(r.startIso).getTime() - start.getTime()) < 60_000)) continue;

      results.push({
        id: crypto.randomUUID(),
        text: raw.slice(0, 80),
        startIso: start.toISOString(),
        endIso: end.toISOString(),
        confidence: raw.includes("でお願いします") || raw.includes("確定") || raw.toLowerCase().includes("works") ? "medium" : "low"
      });
    }
  }

  return results;
}

function isValidDateParts(year: number, month: number, day: number, hour: number, minute: number): boolean {
  if (year < 2000 || year > 2100) return false;
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;
  if (hour < 0 || hour > 23) return false;
  if (minute < 0 || minute > 59) return false;
  return true;
}

function renderDetectedTimes(): void {
  const container = byId("detectedTimeList");

  if (state.detectedTimes.length === 0) {
    container.innerHTML = `<div class="result">${escapeHtml(tr(state.language, "noDetectedTimes"))}</div>`;
    return;
  }

  container.innerHTML = state.detectedTimes.map((item, index) => `
    <div class="candidate">
      <div class="candidateTop">
        <div class="candidateTitle">${index + 1}. ${escapeHtml(formatDetectedTime(item))}</div>
        <div class="small">${escapeHtml(item.text)} / ${escapeHtml(item.confidence)}</div>
        <div class="candidateActions">
          <button class="light" data-action="copy-detected" data-id="${item.id}">${escapeHtml(tr(state.language, "copy"))}</button>
          <button class="light" data-action="calendar-detected" data-id="${item.id}">${escapeHtml(tr(state.language, "createConfirmedEvent"))}</button>
        </div>
      </div>
    </div>
  `).join("");

  container.querySelectorAll<HTMLButtonElement>("button").forEach((button) => {
    button.addEventListener("click", () => {
      const item = state.detectedTimes.find((x) => x.id === button.dataset.id);
      if (!item) return;

      if (button.dataset.action === "copy-detected") copyText(formatDetectedTime(item));
      if (button.dataset.action === "calendar-detected") openUrls([buildConfirmedEventUrl(item)]).then(() => showStatus(tr(state.language, "holdOpened"), false));
    });
  });
}

function formatDetectedTime(item: DetectedTime): string {
  const start = new Date(item.startIso);
  const end = new Date(item.endIso);
  return `${formatDate(start)} ${formatTime(start)}〜${formatTime(end)}`;
}

function buildConfirmedEventUrl(item: DetectedTime): string {
  const settings = requireSettings();
  const title = state.language === "ja" ? settings.confirmedEventTitleJa : settings.confirmedEventTitleEn;
  const details = `Detected from Gmail text: ${item.text}`;
  const dates = `${toCalendarUtc(new Date(item.startIso))}/${toCalendarUtc(new Date(item.endIso))}`;

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates,
    details,
    ctz: Intl.DateTimeFormat().resolvedOptions().timeZone
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}


async function openCalendar(): Promise<void> {
  const response = await sendMessage({ type: "OPEN_CALENDAR" });
  showStatus(response.ok ? tr(state.language, "openCalendar") : response.error, !response.ok);
}

async function getGmailContext(): Promise<void> {
  const response = await sendMessage({ type: "GET_GMAIL_CONTEXT" });
  showStatus(JSON.stringify(response.result || response, null, 2), !response.ok);
}

function showStatus(message: string, isError: boolean): void {
  const status = byId("status");
  status.textContent = message;
  status.className = `status ${isError ? "err" : "ok"}`;
}

function parseDate(value: string): Date | null {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function toDateInput(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function formatDate(date: Date): string {
  if (state.language === "ja") return `${date.getMonth() + 1}/${date.getDate()}（${"日月火水木金土"[date.getDay()]}）`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", weekday: "short" });
}

function formatTime(date: Date): string {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function toCalendarUtc(date: Date): string {
  return `${date.getUTCFullYear()}${String(date.getUTCMonth() + 1).padStart(2, "0")}${String(date.getUTCDate()).padStart(2, "0")}T${String(date.getUTCHours()).padStart(2, "0")}${String(date.getUTCMinutes()).padStart(2, "0")}00Z`;
}

function requireSettings(): Settings {
  if (!state.settings) throw new Error("Settings not loaded.");
  return state.settings;
}

function byId(id: string): HTMLElement {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Element not found: ${id}`);
  return el;
}

function getInputValue(id: string): string {
  return (byId(id) as HTMLInputElement).value;
}

function setInputValue(id: string, value: string): void {
  (byId(id) as HTMLInputElement).value = value;
}

function getTextareaValue(id: string): string {
  return (byId(id) as HTMLTextAreaElement).value;
}

function setTextareaValue(id: string, value: string): void {
  (byId(id) as HTMLTextAreaElement).value = value;
}

function getSelectValue(id: string): string {
  return (byId(id) as HTMLSelectElement).value;
}

function setSelectValue(id: string, value: string): void {
  (byId(id) as HTMLSelectElement).value = value;
}

function escapeHtml(value: string): string {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function sendMessage(message: unknown): Promise<any> {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(message, (response) => {
      if (chrome.runtime.lastError) {
        resolve({ ok: false, error: chrome.runtime.lastError.message });
        return;
      }
      resolve(response || { ok: false, error: "No response." });
    });
  });
}