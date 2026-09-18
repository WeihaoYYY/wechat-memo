import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { captureMemo, memoRequestId } from "../src/memo/client.js";

test("uploads local attachments to the Memo General capture API with a stable request id", async (t) => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "wemo-memo-client-"));
  t.after(() => fs.rmSync(tmpDir, { recursive: true, force: true }));
  const filePath = path.join(tmpDir, "quote.png");
  fs.writeFileSync(filePath, Buffer.from([0x89, 0x50, 0x4e, 0x47]));
  let requestUrl = "";
  let requestForm: FormData | undefined;

  const result = await captureMemo({
    apiBase: "http://127.0.0.1:3000/",
    provider: "codex",
    messageId: "wechat-message-42",
    text: "客户报价",
    files: [{ path: filePath, name: "quote.png" }],
    fetch: async (url, options) => {
      requestUrl = String(url);
      requestForm = options?.body as FormData;
      return Response.json({ data: { id: "capture-1", status: "ready", memoId: "memo-1" } }, { status: 201 });
    }
  });

  assert.equal(requestUrl, "http://127.0.0.1:3000/api/general/captures");
  assert.equal(requestForm?.get("text"), "客户报价");
  assert.equal(requestForm?.get("provider"), "codex");
  assert.equal(requestForm?.get("requestId"), memoRequestId("wechat-message-42"));
  assert.equal((requestForm?.get("files") as File).name, "quote.png");
  assert.equal(result.memoId, "memo-1");
  assert.equal(memoRequestId("wechat-message-42"), memoRequestId("wechat-message-42"));
});

test("refuses to upload private attachments to a non-local Memo endpoint", async () => {
  await assert.rejects(
    captureMemo({
      apiBase: "https://example.com",
      provider: "codex",
      messageId: "message-1",
      text: "",
      files: []
    }),
    /must use a local/i
  );
});
