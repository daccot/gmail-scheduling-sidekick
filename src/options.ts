import { applyStaticI18n, resolveLanguage, tr } from "./i18n";
import { DEFAULT_SETTINGS, clearLogs, getLogs, getSettings, saveSettings } from "./storage";
import type { Settings } from "./types";

let currentLanguage = resolveLanguage("auto");

document.addEventListener("DOMContentLoaded", async () => {
  const settings = await getSettings();
  currentLanguage = resolveLanguage(settings.language);
  applyStaticI18n(currentLanguage);

  bindEvents();
  populateSettings(settings);
  await refreshLogs();
});

function bindEvents(): void {
  byId("saveBtn").addEventListener("click", saveOptions);
  byId("resetBtn").addEventListener("click", resetOptions);
  byId("refreshLogsBtn").addEventListener("click", refreshLogs);
  byId("copyLogsBtn").addEventListener("click", copyLogs);
  byId("clearLogsBtn").addEventListener("click", clearDiagnosticLogs);

  byId("language").addEventListener("change", () => {
    const draft = collectSettings();
    currentLanguage = resolveLanguage(draft.language);
    applyStaticI18n(currentLanguage);
  });
}

function populateSettings(settings: Settings): void {
  setCheckbox("enabled", settings.enabled);
  setCheckbox("autoOpenSidePanelOnGmail", settings.autoOpenSidePanelOnGmail);
  setCheckbox("skipWeekends", settings.skipWeekends);
  setCheckbox("includeOnlineMeetingLine", settings.includeOnlineMeetingLine);
  setCheckbox("defaultHoldBusy", settings.defaultHoldBusy);

  setValue("language", settings.language);
  setValue("calendarUrl", settings.calendarUrl);
  setValue("defaultDurationMinutes", String(settings.defaultDurationMinutes));
  setValue("candidateCount", String(settings.candidateCount));
  setValue("defaultTone", settings.defaultTone);
  setValue("onlineMeetingTextJa", settings.onlineMeetingTextJa);
  setValue("onlineMeetingTextEn", settings.onlineMeetingTextEn);
  setValue("defaultHoldTitleJa", settings.defaultHoldTitleJa);
  setValue("defaultHoldTitleEn", settings.defaultHoldTitleEn);
  setValue("defaultHoldDetailsJa", settings.defaultHoldDetailsJa);
  setValue("defaultHoldDetailsEn", settings.defaultHoldDetailsEn);
}

function collectSettings(): Settings {
  return {
    ...DEFAULT_SETTINGS,
    enabled: getCheckbox("enabled"),
    autoOpenSidePanelOnGmail: getCheckbox("autoOpenSidePanelOnGmail"),
    skipWeekends: getCheckbox("skipWeekends"),
    includeOnlineMeetingLine: getCheckbox("includeOnlineMeetingLine"),
    defaultHoldBusy: getCheckbox("defaultHoldBusy"),
    language: getValue("language") as Settings["language"],
    calendarUrl: getValue("calendarUrl"),
    defaultDurationMinutes: Number(getValue("defaultDurationMinutes")),
    candidateCount: Number(getValue("candidateCount")),
    defaultTone: getValue("defaultTone") as Settings["defaultTone"],
    onlineMeetingTextJa: getValue("onlineMeetingTextJa"),
    onlineMeetingTextEn: getValue("onlineMeetingTextEn"),
    defaultHoldTitleJa: getValue("defaultHoldTitleJa"),
    defaultHoldTitleEn: getValue("defaultHoldTitleEn"),
    defaultHoldDetailsJa: getValue("defaultHoldDetailsJa"),
    defaultHoldDetailsEn: getValue("defaultHoldDetailsEn")
  };
}

async function saveOptions(): Promise<void> {
  const settings = await saveSettings(collectSettings());
  currentLanguage = resolveLanguage(settings.language);
  applyStaticI18n(currentLanguage);
  showStatus(tr(currentLanguage, "savedOptions"), false);
}

async function resetOptions(): Promise<void> {
  const settings = await saveSettings(DEFAULT_SETTINGS);
  currentLanguage = resolveLanguage(settings.language);
  applyStaticI18n(currentLanguage);
  populateSettings(settings);
  showStatus(tr(currentLanguage, "resetOptions"), false);
}

async function refreshLogs(): Promise<void> {
  const logs = await getLogs();
  setValue("logs", logs.map((log) => `[${log.time}] [${log.level}] [${log.scope}] ${log.message}`).join("\n"));
}

async function copyLogs(): Promise<void> {
  await refreshLogs();
  await navigator.clipboard.writeText(getValue("logs"));
  showStatus(tr(currentLanguage, "copied"), false);
}

async function clearDiagnosticLogs(): Promise<void> {
  await clearLogs();
  await refreshLogs();
  showStatus(tr(currentLanguage, "clear"), false);
}

function showStatus(message: string, isError: boolean): void {
  const status = byId("status");
  status.textContent = message;
  status.className = `status ${isError ? "err" : "ok"}`;
}

function byId(id: string): HTMLElement {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Element not found: ${id}`);
  return el;
}

function setValue(id: string, value: string): void {
  (byId(id) as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement).value = value;
}

function getValue(id: string): string {
  return (byId(id) as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement).value;
}

function setCheckbox(id: string, value: boolean): void {
  (byId(id) as HTMLInputElement).checked = value;
}

function getCheckbox(id: string): boolean {
  return (byId(id) as HTMLInputElement).checked;
}