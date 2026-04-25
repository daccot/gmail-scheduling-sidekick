export type LanguageSetting = "auto" | "ja" | "en";
export type ResolvedLanguage = "ja" | "en";
export type Tone = "polite" | "casual" | "formal";
export type CandidateMode = "distributed" | "continuous" | "manual";
export type TimeBand = "all" | "morning" | "afternoon" | "custom";
export type SlotPattern = "balanced" | "early" | "late";
export type SchedulingStatus = "unknown" | "drafting" | "waiting_their_reply" | "waiting_my_reply" | "confirmed" | "calendar_ready" | "needs_review";

export type Settings = {
  enabled: boolean;
  autoOpenSidePanelOnGmail: boolean;
  language: LanguageSetting;
  calendarUrl: string;
  defaultDurationMinutes: number;
  candidateCount: number;
  skipWeekends: boolean;
  defaultTone: Tone;
  includeOnlineMeetingLine: boolean;
  onlineMeetingTextJa: string;
  onlineMeetingTextEn: string;
  defaultHoldTitleJa: string;
  defaultHoldTitleEn: string;
  defaultHoldDetailsJa: string;
  defaultHoldDetailsEn: string;
  defaultHoldBusy: boolean;
  includeThreadMemoInTemplate: boolean;
  confirmedEventTitleJa: string;
  confirmedEventTitleEn: string;
};

export type Candidate = {
  id: string;
  startIso: string;
  endIso: string;
};

export type DetectedTime = {
  id: string;
  text: string;
  startIso: string;
  endIso: string;
  confidence: "medium" | "low";
};

export type ThreadStatusRecord = {
  threadId: string;
  status: SchedulingStatus;
  statusLabel: string;
  nextAction: string;
  risks: string[];
  detectedAt: string;
  updatedAt: string;
  source: "auto" | "manual";
};

export type LogEntry = {
  time: string;
  level: "DEBUG" | "INFO" | "WARN" | "ERROR";
  scope: string;
  message: string;
};

export type GmailContext = {
  url: string;
  title: string;
  composeOpen: boolean;
  subject: string;
  threadId: string | null;
  visibleText: string;
  timestamp: string;
};

export type RuntimeMessage =
  | { type: "GET_VERSION" }
  | { type: "GET_SETTINGS" }
  | { type: "SAVE_SETTINGS"; settings: Partial<Settings> }
  | { type: "GET_LOGS" }
  | { type: "CLEAR_LOGS" }
  | { type: "OPEN_CALENDAR" }
  | { type: "OPEN_URLS"; urls: string[] }
  | { type: "INSERT_TEXT_TO_GMAIL"; text: string }
  | { type: "GET_GMAIL_CONTEXT" }
  | { type: "GET_THREAD_MEMO"; threadId: string }
  | { type: "SAVE_THREAD_MEMO"; threadId: string; memo: string }
  | { type: "GET_THREAD_STATUS"; threadId: string }
  | { type: "SAVE_THREAD_STATUS"; record: ThreadStatusRecord }
  | { type: "GSS_INSERT_TEXT"; text: string }
  | { type: "GSS_GET_CONTEXT" };