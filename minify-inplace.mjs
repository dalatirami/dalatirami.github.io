#!/usr/bin/env node
/**
 * minify-inplace.mjs
 * ------------------
 * Drop this file in your project root and run:   node minify-inplace.mjs
 *
 * - Prints the project path, then asks (y/n) before doing anything.
 * - Scans the folder and all subfolders (skips .git, node_modules, ...).
 * - Aggressively minifies HTML / CSS / JS / JSON and strips all comments.
 * - Inside HTML: also minifies <style>, <script>, style="..." and onclick="..." etc.
 * - Overwrites the original files in place (no .min files are created).
 *
 * Tools: terser (JS) + clean-css (CSS) + html-minifier-terser (HTML).
 * Installed automatically once into ~/.minify-inplace-deps (your project stays clean).
 *
 * WARNING: there is no undo. Commit or back up your project first.
 */

import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import readline from "node:readline";
import { execSync } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

// ------------------------------------------------------------------ //
// Settings
// ------------------------------------------------------------------ //
const EXCLUDED_DIRS = new Set([
  ".git", ".svn", ".hg", "node_modules", "__pycache__", ".idea", ".vscode",
  ".venv", "venv", "env", ".cache", ".next", ".nuxt", ".turbo",
]);
const TARGET_EXTS = new Set([".html", ".htm", ".css", ".js", ".json"]);
const SELF = fileURLToPath(import.meta.url);
const ROOT = path.resolve(process.argv[2] || path.dirname(SELF));

// ------------------------------------------------------------------ //
// Load dependencies (auto-installed outside the project)
// ------------------------------------------------------------------ //
const DEPS_DIR = path.join(os.homedir(), ".minify-inplace-deps");
const DEPS = ["terser", "clean-css", "html-minifier-terser"];

function loadDeps() {
  fs.mkdirSync(DEPS_DIR, { recursive: true });
  const pkg = path.join(DEPS_DIR, "package.json");
  if (!fs.existsSync(pkg)) fs.writeFileSync(pkg, '{"name":"minify-inplace-deps","private":true}');
  const req = createRequire(pkg);
  const load = () => DEPS.map((d) => req(d));
  try {
    return load();
  } catch {
    console.log(`[*] Installing tools (one time only): ${DEPS.join(", ")} ...`);
    execSync(`npm install --prefix "${DEPS_DIR}" ${DEPS.join(" ")} --no-audit --no-fund --silent`, {
      stdio: "inherit",
    });
    return load();
  }
}

// ------------------------------------------------------------------ //
// Minifiers
// ------------------------------------------------------------------ //
const TERSER_OPTS = {
  compress: { passes: 2 },
  mangle: true, // local variable names only; global names are left untouched
  format: { comments: false },
};

function buildMinifiers({ terser, CleanCSS, htmlMinifier }) {
  const cleanCss = new CleanCSS({ level: 2, specialComments: 0 });

  const minifyJS = async (code) => {
    let res;
    try {
      res = await terser.minify(code, TERSER_OPTS);
    } catch (e) {
      // Maybe it's an ES module (import/export)
      res = await terser.minify(code, { ...TERSER_OPTS, module: true }).catch(() => {
        throw e;
      });
    }
    if (res.code === undefined) throw new Error("terser returned no output");
    return res.code;
  };

  const minifyCSS = (code) => {
    const out = cleanCss.minify(code);
    if (out.errors.length) throw new Error(out.errors[0]);
    return out.styles;
  };

  const minifyJSON = (code) => JSON.stringify(JSON.parse(code));

  const minifyHTML = async (code) => {
    // JSON-LD / importmap blocks inside the page
    code = code.replace(
      /(<script\b[^>]*type\s*=\s*["']?(?:application\/ld\+json|application\/json|importmap)["']?[^>]*>)([\s\S]*?)(<\/script\s*>)/gi,
      (m, open, body, close) => {
        try {
          return body.trim() ? open + JSON.stringify(JSON.parse(body)) + close : m;
        } catch {
          return m;
        }
      }
    );
    return htmlMinifier.minify(code, {
      removeComments: true,
      removeCommentsFromCDATA: true,
      removeCDATASectionsFromCDATA: true,
      collapseWhitespace: true,
      collapseBooleanAttributes: true,
      removeAttributeQuotes: true,
      removeRedundantAttributes: true,
      removeEmptyAttributes: true,
      removeScriptTypeAttributes: true,
      removeStyleLinkTypeAttributes: true,
      useShortDoctype: true,
      minifyCSS: { level: 2, specialComments: 0 }, // <style> and style="..."
      minifyJS: TERSER_OPTS,                       // <script> and onclick="..."
      continueOnParseError: true,
      // Leave template syntax alone
      ignoreCustomFragments: [/<%[\s\S]*?%>/, /<\?[\s\S]*?\?>/, /\{\{[\s\S]*?\}\}/, /\{%[\s\S]*?%\}/],
    });
  };

  return {
    ".html": minifyHTML,
    ".htm": minifyHTML,
    ".css": async (c) => minifyCSS(c),
    ".js": minifyJS,
    ".json": async (c) => minifyJSON(c),
  };
}

// ------------------------------------------------------------------ //
// File helpers
// ------------------------------------------------------------------ //
function* walk(dir) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch (e) {
    console.log(`[!] Cannot open folder: ${dir} (${e.code})`);
    return;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!EXCLUDED_DIRS.has(entry.name)) yield* walk(full);
    } else if (entry.isFile()) {
      if (TARGET_EXTS.has(path.extname(entry.name).toLowerCase()) && path.resolve(full) !== SELF) {
        yield full;
      }
    }
  }
}

function readText(file) {
  const buf = fs.readFileSync(file);
  const bom = buf.length >= 3 && buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf;
  const text = new TextDecoder("utf-8", { fatal: true }).decode(bom ? buf.subarray(3) : buf);
  return { text, bom };
}

// Write to a temp file in the same folder, then swap it in (no leftovers).
function atomicWrite(file, content, bom) {
  const tmp = path.join(path.dirname(file), `.tmp_${process.pid}_${path.basename(file)}`);
  try {
    fs.writeFileSync(tmp, (bom ? "\uFEFF" : "") + content, "utf8");
    try { fs.chmodSync(tmp, fs.statSync(file).mode); } catch {}
    fs.renameSync(tmp, file);
  } catch (e) {
    try { fs.unlinkSync(tmp); } catch {}
    throw e;
  }
}

const bytes = (s) => Buffer.byteLength(s, "utf8");
function human(n) {
  for (const u of ["B", "KB", "MB", "GB"]) {
    if (Math.abs(n) < 1024) return `${n.toFixed(1)} ${u}`;
    n /= 1024;
  }
  return `${n.toFixed(1)} TB`;
}

function ask(question) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    let answered = false;
    rl.question(question, (a) => { answered = true; rl.close(); resolve(a); });
    rl.on("close", () => { if (!answered) resolve(null); });
  });
}

async function confirm() {
  console.log("=".repeat(60));
  console.log("Project path to be minified:");
  console.log(`  ${ROOT}`);
  console.log("Types: HTML, CSS, JS, JSON  |  Files are overwritten in place");
  console.log("WARNING: this cannot be undone");
  console.log("=".repeat(60));
  for (;;) {
    const a = await ask("Start minifying? (y/n): ");
    if (a === null) return false;
    const v = a.trim().toLowerCase();
    if (v === "y" || v === "yes") return true;
    if (v === "n" || v === "no") return false;
    console.log("Please type y or n.");
  }
}

// ------------------------------------------------------------------ //
// Main
// ------------------------------------------------------------------ //
async function main() {
  if (!fs.existsSync(ROOT) || !fs.statSync(ROOT).isDirectory()) {
    console.log(`[!] Path does not exist or is not a folder: ${ROOT}`);
    process.exit(1);
  }
  if (!(await confirm())) {
    console.log("[*] Cancelled. No files were modified.");
    return;
  }

  const [terser, CleanCSS, htmlMod] = loadDeps();
  const minifiers = buildMinifiers({ terser, CleanCSS, htmlMinifier: htmlMod });

  console.log("\n[*] Scanning and minifying...\n");

  let scanned = 0, success = 0, skipped = 0, before = 0, after = 0;
  const failed = [];
  const perType = {};

  for (const file of walk(ROOT)) {
    scanned++;
    const rel = path.relative(ROOT, file);
    const ext = path.extname(file).toLowerCase();

    try {
      // Already-minified files (e.g. vendor libraries) are not reprocessed
      if (/\.min\.(js|css)$/i.test(file)) {
        skipped++;
        console.log(`[=] Already minified (skipped): ${rel}`);
        continue;
      }

      const { text, bom } = readText(file);
      const origSize = bytes(text);

      if (!text.trim()) {
        success++;
        console.log(`[=] Empty (skipped): ${rel}`);
        continue;
      }

      const out = await minifiers[ext](text);
      const newSize = bytes(out);
      let finalSize = origSize;

      // Only overwrite when the result is actually smaller
      if (newSize < origSize) {
        atomicWrite(file, out, bom);
        finalSize = newSize;
      }

      before += origSize;
      after += finalSize;
      perType[ext] ??= [0, 0];
      perType[ext][0]++;
      perType[ext][1] += origSize - finalSize;
      success++;

      const pct = origSize ? (((origSize - finalSize) / origSize) * 100).toFixed(1) : "0.0";
      console.log(`[OK] ${rel}  (${human(origSize)} -> ${human(finalSize)}, -${pct}%)`);
    } catch (e) {
      const msg = String(e?.message || e).split("\n")[0];
      failed.push([rel, `${e?.name || "Error"}: ${msg}`]);
      console.log(`[FAIL] ${rel}  <- ${e?.name || "Error"}`);
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log("FINAL REPORT");
  console.log("=".repeat(60));
  console.log(`Total files scanned        : ${scanned}`);
  console.log(`Minified successfully      : ${success}`);
  console.log(`Skipped (already .min)     : ${skipped}`);
  console.log(`Failed                     : ${failed.length}`);
  if (before) {
    const saved = before - after;
    console.log(`Size before                : ${human(before)}`);
    console.log(`Size after                 : ${human(after)}`);
    console.log(`Space saved                : ${human(saved)} (${((saved / before) * 100).toFixed(1)}%)`);
  }
  const types = Object.entries(perType).sort();
  if (types.length) {
    console.log("\nBy type:");
    for (const [ext, [count, saved]] of types) {
      console.log(`  ${ext.padEnd(6)} ${String(count).padStart(4)} files   saved ${human(saved)}`);
    }
  }
  if (failed.length) {
    console.log("\nFailed files (left untouched):");
    for (const [rel, reason] of failed) console.log(`  - ${rel}  <-  ${reason}`);
  }
  console.log("=".repeat(60));
}

main().catch((e) => {
  console.error("[!] Unexpected error:", e);
  process.exit(1);
});
