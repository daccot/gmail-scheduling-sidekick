import type { Settings, LogEntry, ThreadStatusRecord } from "./types";

export const DEFAULT_SETTINGS: Settings = {
  enabled: true,
  autoOpenSidePanelOnGmail: true,
  language: "auto",
  calendarUrl: "https://calendar.google.com/calendar/u/0/r",
  defaultDurationMinutes: 30,
  candidateCount: 5,
  skipWeekends: true,
  defaultTone: "polite",
  includeOnlineMeetingLine: false,
  onlineMeetingTextJa: "オンライン会議URLは別途お送りします。",
  onlineMeetingTextEn: "I will send the online meeting link separately.",
  defaultHoldTitleJa: "仮：日程調整中",
  defaultHoldTitleEn: "Tentative: Scheduling in progress",
  defaultHoldDetailsJa: "Gmail Scheduling Sidekickで作成した仮押さえです。確定後、不要な仮押さえは削除してください。",
  defaultHoldDetailsEn: "Tentative hold created by Gmail Scheduling Sidekick. Please delete unnecessary holds after the schedule is confirmed.",
  defaultHoldBusy: true,
  includeThreadMemoInTemplate: true,
  confirmedEventTitleJa: "確定：日程調整",
  confirmedEventTitleEn: "Confirmed: Scheduled meeting"
};

const THREAD_MEMO_KEY = "threadMemos";
const THREAD_STATUS_KEY = "threadStatusRecords";

export async function getThreadStatus(threadId: string): Promise<ThreadStatusRecord | null> {
  const data = await chrome.storage.local.get([THREAD_STATUS_KEY]);
  const map = data[THREAD_STATUS_KEY] || {};
  return map[threadId] || null;
}

export async function saveThreadStatus(record: ThreadStatusRecord): Promise<void> {
  const data = await chrome.storage.local.get([THREAD_STATUS_KEY]);
  const map = data[THREAD_STATUS_KEY] || {};
  map[record.threadId] = record;
  await chrome.storage.local.set({ [THREAD_STATUS_KEY]: map });
}

export async function getSettings(): Promise<Settings> {
  const data = await chrome.storage.sync.get(["settings"]);
  return { ...DEFAULT_SETTINGS, ...(data.settings || {}) };
}

export async function saveSettings(settings: Partial<Settings>): Promise<Settings> {
  const merged = { ...DEFAULT_SETTINGS, ...settings };
  await chrome.storage.sync.set({ settings: merged });
  return merged;
}

export async function getMemo(): Promise<string> {
  const data = await chrome.storage.local.get(["sidekickMemo"]);
  return typeof data.sidekickMemo === "string" ? data.sidekickMemo : "";
}

export async function saveMemo(memo: string): Promise<void> {
  await chrome.storage.local.set({ sidekickMemo: memo });
}

export async function getThreadMemo(threadId: string): Promise<string> {
  const data = await chrome.storage.local.get([THREAD_MEMO_KEY]);
  const memos = data[THREAD_MEMO_KEY] || {};
  const item = memos[threadId];
  return typeof item?.memo === "string" ? item.memo : "";
}

export async function saveThreadMemo(threadId: string, memo: string): Promise<void> {
  const data = await chrome.storage.local.get([THREAD_MEMO_KEY]);
  const memos = data[THREAD_MEMO_KEY] || {};
  memos[threadId] = {
    threadId,
    memo,
    updatedAt: new Date().toISOString()
  };
  await chrome.storage.local.set({ [THREAD_MEMO_KEY]: memos });
}

export async function getLogs(): Promise<LogEntry[]> {
  const data = await chrome.storage.local.get(["diagnosticLogs"]);
  return Array.isArray(data.diagnosticLogs) ? data.diagnosticLogs : [];
}

export async function clearLogs(): Promise<void> {
  await chrome.storage.local.set({ diagnosticLogs: [] });
}

export async function addLog(entry: Omit<LogEntry, "time">): Promise<void> {
  const full: LogEntry = {
    time: new Date().toISOString(),
    ...entry
  };

  console.log(`[GmailSchedulingSidekick][${full.level}][${full.time}][${full.scope}] ${full.message}`);

  try {
    const logs = await getLogs();
    logs.unshift(full);
    await chrome.storage.local.set({ diagnosticLogs: logs.slice(0, 500) });
  } catch {}
}