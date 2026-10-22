import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { spawn, execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { createServer } from "node:net";

// Start real Express and Next.js servers against a disposable PostgreSQL schema.
const frontendDirectory = process.cwd();
const backendDirectory = path.resolve(process.env.BACKEND_DIR || path.join("..", "Project Sub & Review Dashboard-Server"));
const backendRequire = createRequire(path.join(backendDirectory, "package.json"));
const { parse } = backendRequire("dotenv");
const { Client } = backendRequire("pg");
const backendEnv = parse(fs.readFileSync(path.join(backendDirectory, ".env"), "utf8"));
const databaseUrl = process.env.TEST_DATABASE_URL || backendEnv.DATABASE_URL;
if (!databaseUrl) throw new Error("Configure TEST_DATABASE_URL or the backend DATABASE_URL.");
const schema = "frontend_e2e_" + randomUUID().replaceAll("-", "");
const url = new URL(databaseUrl);
if (url.hostname.endsWith(".neon.tech")) url.hostname = url.hostname.replace("-pooler.", ".");
url.searchParams.set("schema", schema);
const testEnv = {
  ...process.env, ...backendEnv, DATABASE_URL: url.toString(),
  ACCESS_TOKEN_SECRET: "frontend-e2e-secret-only-at-least-32-characters",
  ACCESS_TOKEN_EXPIRES_IN: "1h", NODE_ENV: "test", PORT: "5010",
  FRONTEND_URL: "http://localhost:3010",
  ADMIN_EMAIL: "startup-admin@handin.test", ADMIN_PASSWORD: "HandinTest123!",
};
delete testEnv.TRUST_PROXY_HOPS;
const adminEmail = "samir@handin.test";
const mentorEmail = "mentor@handin.test";
const superEmail = "super@handin.test";
const studentEmail = "mina@handin.test";
const password = "HandinTest123!";
const children = [];
const client = new Client({ connectionString: url.toString(), connectionTimeoutMillis: 10000 });

const waitForServer = async (address, child) => {
  for (let attempt = 0; attempt < 90; attempt++) {
    if (child.exitCode !== null) throw new Error("A test server exited before it was ready.");
    try { const result = await fetch(address, { signal: AbortSignal.timeout(3000) }); if (result.ok) return; } catch {}
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  throw new Error("Test server startup timed out.");
};

function startServer(args, cwd, env) {
  const child = spawn(process.execPath, args, { cwd, env, stdio: ["ignore", "pipe", "pipe"], windowsHide: true });
  let logs = "";
  child.stdout.on("data", chunk => { logs = (logs + chunk.toString()).slice(-12000); });
  child.stderr.on("data", chunk => { logs = (logs + chunk.toString()).slice(-12000); });
  child.getLogs = () => logs;
  children.push(child);
  return child;
}

let exitCode = 1;
try {
  for (const port of [3010, 5010]) {
    await new Promise((resolve, reject) => {
      const probe = createServer();
      probe.once("error", () => reject(new Error("Test port " + port + " is already in use.")));
      probe.listen(port, () => probe.close(resolve));
    });
  }
  await client.connect();
  console.log("Applying migrations in an isolated test schema…");
  execFileSync(process.execPath, ["node_modules/prisma/build/index.js", "migrate", "deploy"], {
    cwd: backendDirectory, env: { ...testEnv, PRISMA_SCHEMA_DISABLE_ADVISORY_LOCK: "1" }, stdio: "pipe", timeout: 60000,
  });
  // The lock bypass above is scoped to a new, randomly named test schema only.
  execFileSync(process.execPath, ["node_modules/typescript/bin/tsc"], { cwd: backendDirectory, env: testEnv, stdio: "inherit" });
  const backend = startServer(["dist/server.js"], backendDirectory, testEnv);
  await waitForServer("http://localhost:5010", backend);
  const register = async (name, email) => {
    const response = await fetch("http://localhost:5010/api/v1/auth/register", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error("Could not create test account: " + result.message);
    return result.data.user;
  };
  const student = await register("Mina Rahman", studentEmail);
  const admin = await register("Samir Ahmed", adminEmail);
  const mentor = await register("Mentor Rahman", mentorEmail);
  const superAdmin = await register("Super Admin", superEmail);
  await client.query('SET search_path TO "' + schema + '"');
  await client.query('UPDATE "user" SET role = $1 WHERE id = $2', ["ADMIN", admin.id]);
  await client.query('UPDATE "user" SET role = $1 WHERE id = $2', ["MENTOR", mentor.id]);
  await client.query('UPDATE "user" SET role = $1 WHERE id = $2', ["SUPER_ADMIN", superAdmin.id]);
  const samples = [
    ["Field Notes", "field-notes", "PENDING", null],
    ["Readymade", "readymade", "APPROVED", "A clear idea, thoughtfully built. Nice work on the details."],
    ["Little Weather", "little-weather", "REJECTED", "The layout is lovely. Please improve the error state when a city is not found."],
    ["Focus Room", "focus-room", "PENDING", null],
    ["Recipe Book", "recipe-book", "APPROVED", "Good structure and a useful README. Keep going."],
    ["Pocket Library", "pocket-library", "PENDING", null],
  ];
  for (let index = 0; index < samples.length; index++) {
    const [name, slug, status, comment] = samples[index];
    const date = new Date(Date.now() - index * 86400000);
    await client.query(
      'INSERT INTO projects (id,name,"repoUrl","liveLink",description,status,"studentId","createdAt","updatedAt","reviewComment","reviewedAt","reviewedById") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$8,$9,$10,$11)',
      [randomUUID(), name, "https://github.com/minarahman/" + slug, "https://" + slug + ".example.com",
        "A considered little project exploring useful interfaces, clear interactions, and a more thoughtful experience.", status,
        student.id, date, comment, status === "PENDING" ? null : date, status === "PENDING" ? null : admin.id],
    );
  }
  const frontend = startServer(["node_modules/next/dist/bin/next", "dev", "-p", "3010"], frontendDirectory, {
    ...process.env, NODE_ENV: "development", NEXT_TEST_DIST_DIR: ".next-e2e",
    NEXT_PUBLIC_API_BASE_URL: "http://localhost:5010/api/v1", API_BASE_URL: "http://localhost:5010/api/v1",
  });
  await waitForServer("http://localhost:3010/login", frontend);
  // Compile the route handler before timed browser assertions begin.
  await fetch("http://localhost:3010/api/workspace/projects", { signal: AbortSignal.timeout(90000) });
  fs.mkdirSync("artifacts", { recursive: true });
  console.log("Running browser tests against the real API…");
  const testProcess = spawn(process.execPath, ["node_modules/@playwright/test/cli.js", "test"], {
    cwd: frontendDirectory, windowsHide: true, stdio: "inherit",
    env: { ...process.env, E2E_STUDENT_EMAIL: studentEmail, E2E_ADMIN_EMAIL: adminEmail, E2E_MENTOR_EMAIL: mentorEmail, E2E_SUPER_EMAIL: superEmail, E2E_PASSWORD: password },
  });
  exitCode = await new Promise(resolve => testProcess.once("exit", code => resolve(code ?? 1)));
  if (exitCode) {
    console.error("Frontend test server log:", frontend.getLogs());
    console.error("Backend test server log:", backend.getLogs());
  }
} catch (error) {
  console.error(error);
  for (const child of children) console.error(child.getLogs());
} finally {
  for (const child of children.reverse()) {
    if (child.exitCode !== null) continue;
    if (process.platform === "win32") {
      try { execFileSync("taskkill", ["/PID", String(child.pid), "/T", "/F"], { stdio: "ignore", windowsHide: true }); } catch {}
    } else child.kill("SIGTERM");
  }
  if (!/^frontend_e2e_[a-f0-9]{32}$/.test(schema)) throw new Error("Unexpected schema name.");
  try { await client.query('DROP SCHEMA IF EXISTS "' + schema + '" CASCADE'); }
  finally { await client.end(); }
  console.log("Temporary test schema cleaned up.");
}
process.exitCode = exitCode;
