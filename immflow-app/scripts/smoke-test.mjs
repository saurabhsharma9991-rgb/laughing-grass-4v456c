#!/usr/bin/env node
/**
 * Quick smoke test against a running ImmFlow instance.
 * Usage: node scripts/smoke-test.mjs [baseUrl]
 */
const base = (process.argv[2] || process.env.SMOKE_BASE_URL || "http://localhost:3000").replace(
  /\/$/,
  ""
);

const checks = [];

async function get(path) {
  const res = await fetch(`${base}${path}`);
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    // HTML routes
  }
  return { status: res.status, json, text };
}

async function run() {
  console.log(`Smoke testing ${base}\n`);

  const health = await get("/api/health");
  checks.push(["GET /api/health", health.status === 200 && health.json?.status === "ok"]);

  const config = await get("/api/platform/config");
  checks.push(["GET /api/platform/config", config.status === 200 && config.json?.features]);

  const listings = await get("/api/listings?status=open");
  checks.push(["GET /api/listings", listings.status === 200 && Array.isArray(listings.json)]);

  const attorneys = await get("/api/attorneys");
  checks.push(["GET /api/attorneys", attorneys.status === 200 && Array.isArray(attorneys.json)]);

  for (const route of ["/", "/jobs", "/attorneys", "/network", "/matcher", "/dashboard", "/post"]) {
    const page = await get(route);
    checks.push([`GET ${route}`, page.status === 200 && page.text.includes("Imm")]);
  }

  let failed = 0;
  for (const [name, ok] of checks) {
    console.log(ok ? "✓" : "✗", name);
    if (!ok) failed += 1;
  }

  console.log(`\n${checks.length - failed}/${checks.length} passed`);
  process.exit(failed > 0 ? 1 : 0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
