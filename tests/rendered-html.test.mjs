import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the Aero Decoration Studio home screen", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>Aero Decoration Studio<\/title>/i);
  assert.match(html, /WELCOME TO YOUR CREATIVE SPACE/);
  assert.match(html, /Create Decoration/);
  assert.match(html, /Upload Image/);
  assert.doesNotMatch(html, /Your site is taking shape|Building your site/);
});

test("keeps the Cloudflare Pages static build configured", async () => {
  const [viteConfig, entry, packageJson] = await Promise.all([
    readFile(new URL("../vite.cloudflare.config.ts", import.meta.url), "utf8"),
    readFile(new URL("../github-pages/main.tsx", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);

  assert.match(viteConfig, /root:\s*"github-pages"/);
  assert.match(viteConfig, /base:\s*"\/"/);
  assert.match(viteConfig, /outDir:\s*"\.\.\/cf-dist"/);
  assert.match(entry, /import AeroStudio from "\.\.\/app\/AeroStudio"/);
  assert.match(
    packageJson,
    /"build:cloudflare":\s*"vite build --config vite\.cloudflare\.config\.ts"/,
  );
});
