import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

export type MemoCaptureFile = {
  path: string;
  name: string;
};

export type MemoCaptureResult = {
  id: string;
  status: "pending" | "ready" | "needs_configuration" | "failed";
  memoId?: string | null;
  suggestedTitle?: string | null;
  question?: string | null;
  errorMessage?: string | null;
  assets?: Array<{ name?: string }>;
};

export type CaptureMemoInput = {
  apiBase: string;
  provider: "codex" | "openai" | "deepseek";
  messageId: string;
  text: string;
  files: MemoCaptureFile[];
  fetch?: typeof fetch;
};

export async function captureMemo(input: CaptureMemoInput): Promise<MemoCaptureResult> {
  const apiBase = normalizeLocalMemoApiBase(input.apiBase);
  const form = new FormData();
  form.set("text", input.text.trim());
  form.set("provider", input.provider);
  form.set("requestId", memoRequestId(input.messageId));
  for (const file of input.files) {
    const bytes = await fs.readFile(file.path);
    form.append("files", new Blob([new Uint8Array(bytes)]), safeFileName(file.name));
  }
  const response = await (input.fetch ?? fetch)(`${apiBase}/api/general/captures`, {
    method: "POST",
    body: form,
    signal: AbortSignal.timeout(180_000)
  });
  const payload = await readJson(response);
  if (!response.ok) {
    throw new Error(memoError(payload, response.status));
  }
  const result = payload.data;
  if (!result || typeof result !== "object" || typeof result.id !== "string" || typeof result.status !== "string") {
    throw new Error("Memo API returned an invalid capture response");
  }
  return result as MemoCaptureResult;
}

export function memoRequestId(messageId: string): string {
  const bytes = createHash("sha256").update(`wemo:${messageId}`).digest().subarray(0, 16);
  bytes[6] = (bytes[6] & 0x0f) | 0x50;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function normalizeLocalMemoApiBase(value: string): string {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error("Memo API address is invalid");
  }
  if (url.protocol !== "http:" || !["127.0.0.1", "localhost", "[::1]"].includes(url.hostname)) {
    throw new Error("Memo API must use a local http://127.0.0.1 or localhost address");
  }
  return url.toString().replace(/\/$/, "");
}

function safeFileName(value: string): string {
  return path.basename(value).replace(/[\u0000-\u001f\u007f]/g, "").slice(0, 180) || "attachment";
}

async function readJson(response: Response): Promise<Record<string, any>> {
  try {
    return await response.json() as Record<string, any>;
  } catch {
    throw new Error(`Memo API returned non-JSON content (${response.status})`);
  }
}

function memoError(payload: Record<string, any>, status: number): string {
  const message = payload.error?.message ?? payload.error;
  return typeof message === "string" && message.trim()
    ? message.trim()
    : `Memo API request failed (${status})`;
}
