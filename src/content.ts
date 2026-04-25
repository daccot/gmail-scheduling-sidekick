(() => {
  const mark = "__GSS_CONTENT_LOADED__";
  if ((window as any)[mark]) return;
  (window as any)[mark] = true;

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    try {
      if (message.type === "GSS_INSERT_TEXT") {
        sendResponse(insertText(message.text || ""));
        return true;
      }

      if (message.type === "GSS_GET_CONTEXT") {
        sendResponse({ ok: true, result: getContext() });
        return true;
      }

      sendResponse({ ok: false, error: "Unknown message." });
    } catch (error) {
      sendResponse({ ok: false, error: stringifyError(error) });
    }

    return true;
  });

  function insertText(text: string) {
    const editable = findEditable();
    if (!editable) {
      return { ok: false, error: "Gmail compose/reply body was not found. Open compose or reply first." };
    }

    editable.focus();
    const html = escapeHtml(text).replace(/\r\n/g, "\n").replace(/\n/g, "<br>");
    let ok = false;

    try { ok = document.execCommand("insertHTML", false, html); }
    catch { ok = false; }

    if (!ok) editable.innerHTML += (editable.innerHTML ? "<br>" : "") + html;

    editable.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText" }));
    editable.dispatchEvent(new Event("change", { bubbles: true }));

    return { ok: true, method: ok ? "insertHTML" : "append" };
  }

  function findEditable(): HTMLElement | null {
    const nodes = [...document.querySelectorAll<HTMLElement>('[contenteditable="true"]')].filter(isVisible);
    const focused = nodes.find((n) => n === document.activeElement || n.contains(document.activeElement));
    if (focused) return focused;

    return nodes.find((n) => {
      const role = (n.getAttribute("role") || "").toLowerCase();
      const aria = (n.getAttribute("aria-label") || "").toLowerCase();
      return role === "textbox" || aria.includes("message body") || aria.includes("本文") || n.getAttribute("g_editable") === "true";
    }) || nodes[nodes.length - 1] || null;
  }

  function getContext() {
    return {
      url: location.href,
      title: document.title,
      composeOpen: Boolean(findEditable()),
      subject: (document.querySelector('input[name="subjectbox"]') as HTMLInputElement | null)?.value || "",
      threadId: getThreadId(),
      visibleText: getVisibleThreadText(),
      timestamp: new Date().toISOString()
    };
  }

  function getThreadId(): string | null {
    const hash = location.hash || "";
    const hashMatch = hash.match(/(?:inbox|sent|all|category\/[^/]+|label\/[^/]+)\/([A-Za-z0-9_-]+)/);
    if (hashMatch?.[1]) return hashMatch[1];

    const legacy = document.querySelector<HTMLElement>("[data-legacy-thread-id]");
    if (legacy?.dataset.legacyThreadId) return legacy.dataset.legacyThreadId;

    const subject = document.title || location.href;
    return subject ? stableHash(subject) : null;
  }

  function getVisibleThreadText(): string {
    const candidates = [
      ...document.querySelectorAll<HTMLElement>("[role='main']"),
      ...document.querySelectorAll<HTMLElement>(".ii.gt"),
      ...document.querySelectorAll<HTMLElement>(".a3s")
    ];

    const text = candidates
      .filter(isVisible)
      .map((el) => el.innerText || el.textContent || "")
      .join("\n")
      .replace(/\s+/g, " ")
      .trim();

    return text.slice(0, 12000);
  }

  function stableHash(value: string): string {
    let hash = 0;
    for (let i = 0; i < value.length; i++) hash = ((hash << 5) - hash + value.charCodeAt(i)) | 0;
    return `fallback-${Math.abs(hash)}`;
  }

  function isVisible(el: HTMLElement): boolean {
    const r = el.getBoundingClientRect();
    const s = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && s.display !== "none" && s.visibility !== "hidden";
  }

  function escapeHtml(value: string): string {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function stringifyError(error: unknown): string {
    if (!error) return "(unknown error)";
    if (typeof error === "string") return error;
    if (error instanceof Error) return error.message;
    return String(error);
  }
})();