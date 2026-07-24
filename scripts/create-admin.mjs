/**
 * Create a manually provisioned admin account.
 *
 * Prerequisites:
 *   1. Run scripts/sql/create-admins-table.sql in the Supabase SQL Editor once.
 *   2. Ensure .env.local has NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY
 *      (sb_secret_... from Dashboard → API Keys). SUPABASE_SERVICE_ROLE_KEY also works as env name.
 *
 * Usage (PowerShell) — password is prompted interactively (not stored in shell history):
 *   npm run admin:create
 *   npm run admin:create -- --email you@example.com --name "You"
 *
 * Manual SQL alternative:
 *   node -e "require('bcryptjs').hash('YOUR_PASSWORD', 10).then(console.log)"
 *   Then in SQL Editor:
 *     insert into public.admins (id, email, name, password_hash)
 *     values (gen_random_uuid(), 'you@example.com', 'You', '<paste hash>');
 */

import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import readline from "readline";
import { stdin, stdout } from "process";

function loadEnvLocal() {
  const path = resolve(process.cwd(), ".env.local");
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

function arg(name) {
  const i = process.argv.indexOf(`--${name}`);
  if (i === -1 || i + 1 >= process.argv.length) return null;
  return process.argv[i + 1];
}

function ask(question) {
  const rl = readline.createInterface({ input: stdin, output: stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

/** Prompt without echoing characters (keeps password out of shell history). */
function askHidden(question) {
  return new Promise((resolve, reject) => {
    if (!stdin.isTTY || typeof stdin.setRawMode !== "function") {
      reject(new Error("Interactive password prompt requires a TTY. Run this in a normal terminal."));
      return;
    }

    stdout.write(question);
    stdin.resume();
    stdin.setRawMode(true);

    let value = "";
    const onData = (buf) => {
      const s = buf.toString("utf8");
      for (const char of s) {
        if (char === "\n" || char === "\r" || char === "\u0004") {
          stdin.setRawMode(false);
          stdin.pause();
          stdin.off("data", onData);
          stdout.write("\n");
          resolve(value);
          return;
        }
        if (char === "\u0003") {
          stdin.setRawMode(false);
          stdin.pause();
          stdin.off("data", onData);
          stdout.write("\n");
          process.exit(1);
        }
        // Backspace / Delete
        if (char === "\u007f" || char === "\b") {
          value = value.slice(0, -1);
          continue;
        }
        // Ignore other control chars
        if (char < " ") continue;
        value += char;
      }
    };

    stdin.on("data", onData);
  });
}

loadEnvLocal();

if (arg("password") !== null) {
  console.error("Do not pass --password on the command line (it ends up in shell history).");
  console.error("The script will prompt for the password interactively.");
  process.exit(1);
}

let email = arg("email");
let name = arg("name"); // null if --name omitted

if (!email) email = await ask("Email: ");
if (name === null) name = await ask("Name (optional): ");
name = name ?? "";

if (!email) {
  console.error("Email is required.");
  process.exit(1);
}

const password = await askHidden("Password: ");
if (!password) {
  console.error("Password is required.");
  process.exit(1);
}
const confirm = await askHidden("Confirm password: ");
if (password !== confirm) {
  console.error("Passwords do not match.");
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
// Prefer modern name; keep SERVICE_ROLE_KEY as a fallback if that's what .env.local still uses.
const key = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY (check .env.local).\n" +
      "(SUPABASE_SERVICE_ROLE_KEY is also accepted as a fallback env name.)"
  );
  process.exit(1);
}

if (key.startsWith("sb_publishable_")) {
  console.error(
    "You passed a publishable key. Admins inserts need a secret key (sb_secret_...),\n" +
      "which bypasses RLS. Dashboard → Project Settings → API Keys → Secret key."
  );
  process.exit(1);
}

if (!key.startsWith("sb_secret_")) {
  console.error(
    "Expected a modern secret key starting with sb_secret_.\n" +
      "Dashboard → Project Settings → API Keys → copy the Secret key into\n" +
      "SUPABASE_SECRET_KEY (or SUPABASE_SERVICE_ROLE_KEY) in .env.local."
  );
  process.exit(1);
}

const passwordHash = await bcrypt.hash(password, 10);
const id = randomUUID();
const row = {
  id,
  email: email.toLowerCase().trim(),
  name,
  password_hash: passwordHash,
  created_at: new Date().toISOString(),
};

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const { data, error } = await supabase.from("admins").insert(row).select("id, email, name").single();
if (error) {
  console.error("Failed to create admin:", error.message);
  if (/row-level security/i.test(error.message)) {
    console.error(
      "Hint: RLS blocked the insert — confirm SUPABASE_SECRET_KEY is an sb_secret_ key\n" +
        "(not sb_publishable_). Dashboard → Project Settings → API Keys."
    );
  }
  process.exit(1);
}

console.log("Admin created:", data);
