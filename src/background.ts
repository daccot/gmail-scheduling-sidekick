import { addLog, clearLogs, getLogs, getSettings, saveSettings, getThreadMemo, saveThreadMemo, getThreadStatus, saveThreadStatus } from "./storage";
import type { RuntimeMessage } from "./types";

const VERSION = "0.8.0";

chrome.runtime.onInstalled.addListener(async (details) => {
  await getSettings();
  await chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
  await addLog({ level: "INFO", scope: "onInstalled", message: `Installed/updated. version=${VERSION}, reason=${details.reason}` });
});

chrome.runtime.onStartup.addListener(async () => {
  await getSettings();
  await chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
});

chrome.action.onClicked.addListener(async (tab) => {
  if (tab.id) await chrome.sidePanel.open({ tabId: tab.id });
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  try {
    if (changeInfo.status !== "complete" || !tab.url || !isGmailUrl(tab.url)) return;
    const settings = await getSettings();
    if (!settings.enabled) return;
    await chrome.sidePanel.setOptions({ tabId, path: "sidepanel.html", enabled: true });
    if (settings.autoOpenSidePanelOnGmail) {
      try { await chrome.sidePanel.open({ tabId }); } catch {}
    }
  } catch (error) {
    await addLog({ level: "ERROR", scope: "tabs.onUpdated", message: stringifyError(error) });
  }
});

chrome.runtime.onMessage.addListener((message: RuntimeMessage, sender, sendResponse) => {
  (async () => {
    try {
      switch (message.type) {
        case "GET_VERSION": sendResponse({ ok: true, version: VERSION }); return;
        case "GET_SETTINGS": sendResponse({ ok: true, settings: await getSettings(), version: VERSION }); return;
        case "SAVE_SETTINGS": sendResponse({ ok: true, settings: await saveSettings(message.settings), version: VERSION }); return;
        case "GET_LOGS": sendResponse({ ok: true, logs: await getLogs(), version: VERSION }); return;
        case "CLEAR_LOGS": await clearLogs(); await addLog({ level: "INFO", scope: "CLEAR_LOGS", message: "Diagnostic logs cleared." }); sendResponse({ ok: true, logs: await getLogs(), version: VERSION }); return;
        case "OPEN_CALENDAR": { const settings = await getSettings(); const tab = await chrome.tabs.create({ url: settings.calendarUrl, active: true }); sendResponse({ ok: true, tabId: tab.id, version: VERSION }); return; }
        case "OPEN_URLS": { for (const url of message.urls.slice(0, 10)) await chrome.tabs.create({ url, active: false }); sendResponse({ ok: true, count: message.urls.length, version: VERSION }); return; }
        case "INSERT_TEXT_TO_GMAIL": { const result = await insertTextToActiveGmail(message.text); sendResponse({ ok: true, result, version: VERSION }); return; }
        case "GET_GMAIL_CONTEXT": { const result = await getActiveGmailContext(); sendResponse({ ok: true, result, version: VERSION }); return; }
        case "GET_THREAD_MEMO": { sendResponse({ ok: true, memo: await getThreadMemo(message.threadId), version: VERSION }); return; }
        case "SAVE_THREAD_MEMO": { await saveThreadMemo(message.threadId, message.memo); sendResponse({ ok: true, version: VERSION }); return; }
        case "GET_THREAD_STATUS": { sendResponse({ ok: true, record: await getThreadStatus(message.threadId), version: VERSION }); return; }
        case "SAVE_THREAD_STATUS": { await saveThreadStatus(message.record); sendResponse({ ok: true, version: VERSION }); return; }
        default: sendResponse({ ok: false, error: "Unknown message type.", version: VERSION });
      }
    } catch (error) {
      await addLog({ level: "ERROR", scope: "runtime.onMessage", message: stringifyError(error) });
      sendResponse({ ok: false, error: stringifyError(error), version: VERSION });
    }
  })();
  return true;
});

function isGmailUrl(url: string): boolean { return /^https:\/\/mail\.google\.com\//i.test(url); }

async function findActiveGmailTab(): Promise<chrome.tabs.Tab | null> {
  const [active] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (active?.url && isGmailUrl(active.url)) return active;
  const tabs = await chrome.tabs.query({ url: "https://mail.google.com/*" });
  return tabs[0] || null;
}

async function insertTextToActiveGmail(text: string) {
  if (!text.trim()) throw new Error("Insert text is empty.");
  const tab = await findActiveGmailTab();
  if (!tab?.id) throw new Error("No Gmail tab found.");
  return await chrome.tabs.sendMessage(tab.id, { type: "GSS_INSERT_TEXT", text });
}

async function getActiveGmailContext() {
  const tab = await findActiveGmailTab();
  if (!tab?.id) return { found: false, reason: "No Gmail tab found." };
  try { return await chrome.tabs.sendMessage(tab.id, { type: "GSS_GET_CONTEXT" }); }
  catch (error) { return { found: true, ok: false, error: stringifyError(error) }; }
}

function stringifyError(error: unknown): string {
  if (!error) return "(unknown error)";
  if (typeof error === "string") return error;
  if (error instanceof Error) return `${error.message}${error.stack ? "\n" + error.stack : ""}`;
  return String(error);
}