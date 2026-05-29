import type { PrintResult } from "./adapter";

const PRINT_FRAME_ID = "pk-print-frame";

function removeExistingFrame(): void {
  document.getElementById(PRINT_FRAME_ID)?.remove();
}

/** Print HTML via hidden iframe — avoids popup blockers and blank windows. */
export function printHtmlInBrowser(html: string): PrintResult {
  if (typeof document === "undefined") {
    return { ok: false, status: "failed", message: "Not in browser" };
  }

  removeExistingFrame();

  const iframe = document.createElement("iframe");
  iframe.id = PRINT_FRAME_ID;
  iframe.setAttribute("title", "Receipt print");
  Object.assign(iframe.style, {
    position: "fixed",
    right: "0",
    bottom: "0",
    width: "0",
    height: "0",
    border: "none",
    visibility: "hidden",
  });

  document.body.appendChild(iframe);

  const win = iframe.contentWindow;
  if (!win) {
    removeExistingFrame();
    return { ok: false, status: "failed", message: "Could not open print frame" };
  }

  let printed = false;

  const runPrint = () => {
    if (printed) return;
    printed = true;
    try {
      win.focus();
      win.print();
    } catch {
      removeExistingFrame();
      return;
    }
    window.setTimeout(removeExistingFrame, 2000);
  };

  iframe.onload = () => runPrint();

  try {
    iframe.srcdoc = html;
  } catch {
    const doc = iframe.contentDocument;
    if (doc) {
      doc.open();
      doc.write(html);
      doc.close();
      runPrint();
    } else {
      removeExistingFrame();
      return { ok: false, status: "failed", message: "Could not load receipt for printing" };
    }
  }

  window.setTimeout(() => {
    if (!printed && iframe.parentNode) runPrint();
  }, 1000);

  return { ok: true, status: "success", message: "Print dialog opened" };
}
