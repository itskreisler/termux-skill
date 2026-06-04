#!/usr/bin/env node

import { readFileSync, existsSync, mkdirSync, writeFileSync, readdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SKILL_SOURCE = join(__dirname, "termux-SKILL.md");
const SKILL_ID = "termux-api";
const SKILL_FILENAME = "SKILL.md";
const VERSION = "1.0.0";

const AGENT_PATHS = [
  { name: "OpenCode / Copilot (universal)", path: ".agents/skills" },
  { name: "Claude Code", path: ".claude/skills" },
  { name: "Codex CLI", path: ".agents/skills" },
  { name: "Cursor", path: ".cursor/skills" },
  { name: "Windsurf", path: ".windsurf/skills" },
  { name: "Continue", path: ".continue/skills" },
];

const cwd = process.cwd();
const skillContent = readFileSync(SKILL_SOURCE, "utf-8");
const bundleHash = createHash("sha256").update(skillContent).digest("hex");

const force = process.argv.includes("--force") || process.argv.includes("-f");

// ── Banner ──────────────────────────────────────────────────
console.log("");
console.log("  \x1b[36m╔═══════════════════════════════════════╗\x1b[0m");
console.log("  \x1b[36m║\x1b[0m  \x1b[33mtermux-skill\x1b[0m  \x1b[90mv" + VERSION + "\x1b[0m         \x1b[36m║\x1b[0m");
console.log("  \x1b[36m║\x1b[0m  \x1b[90mTermux API skill for AI agents\x1b[0m    \x1b[36m║\x1b[0m");
console.log("  \x1b[36m╚═══════════════════════════════════════╝\x1b[0m");
console.log("");

// ── Install to agent directories ────────────────────────────
let installed = 0;
const installedPaths = [];

for (const agent of AGENT_PATHS) {
  const targetDir = resolve(cwd, agent.path, SKILL_ID);
  const targetFile = join(targetDir, SKILL_FILENAME);

  try {
    if (!force && existsSync(targetFile)) {
      console.log(`  \x1b[90m○\x1b[0m Already installed for \x1b[37m${agent.name}\x1b[0m \x1b[90m(use --force to reinstall)\x1b[0m`);
      continue;
    }
    mkdirSync(targetDir, { recursive: true });
    writeFileSync(targetFile, skillContent, "utf-8");
    console.log(`  \x1b[32m✔\x1b[0m Installed for \x1b[37m${agent.name}\x1b[0m`);
    console.log(`    \x1b[90m${targetFile}\x1b[0m`);
    installed++;
    installedPaths.push(agent.path);
  } catch (err) {
    console.log(`  \x1b[33m⚠\x1b[0m Skipped \x1b[37m${agent.name}\x1b[0m (\x1b[31m${err.message}\x1b[0m)`);
  }
}

// ── Write skills-lock.json (step 7) ──────────────────────────
const lockPath = resolve(cwd, "skills-lock.json");
let lock = {};

if (existsSync(lockPath)) {
  try {
    lock = JSON.parse(readFileSync(lockPath, "utf-8"));
  } catch {}
}

lock[SKILL_ID] = {
  version: VERSION,
  source: "termux-skill",
  bundleHash,
  installedAt: new Date().toISOString(),
  agents: installedPaths.filter((p, i, a) => a.indexOf(p) === i),
};

writeFileSync(lockPath, JSON.stringify(lock, null, 2) + "\n", "utf-8");
console.log(`  \x1b[32m✔\x1b[0m Lockfile written: \x1b[90m${lockPath}\x1b[0m`);

// ── Clean CLAUDE.md (step 8) ────────────────────────────────
const claudePath = resolve(cwd, "CLAUDE.md");
if (existsSync(claudePath)) {
  let claude = readFileSync(claudePath, "utf-8");
  const sectionRegex = /<!-- termux-skill -->[\s\S]*?<!-- \/termux-skill -->\n?/g;
  const newClaude = claude.replace(sectionRegex, "").trim();
  if (newClaude !== claude) {
    if (newClaude.length === 0) {
      writeFileSync(claudePath, newClaude, "utf-8");
      console.log(`  \x1b[32m✔\x1b[0m Removed termux-skill section from CLAUDE.md \x1b[90m(file was empty, deleted)\x1b[0m`);
    } else {
      writeFileSync(claudePath, newClaude + "\n", "utf-8");
      console.log(`  \x1b[32m✔\x1b[0m Removed termux-skill section from CLAUDE.md`);
    }
  }

  // Append new section
  const section = `<!-- termux-skill -->
The project has termux-api skill installed at .agents/skills/termux-api/SKILL.md.
It provides access to 70+ Android Termux API commands (camera, sensors, GPS, SMS, notifications, clipboard, TTS, etc.).
<!-- /termux-skill -->\n`;
  writeFileSync(claudePath, newClaude + "\n" + section, "utf-8");
  console.log(`  \x1b[32m✔\x1b[0m Added termux-skill section to CLAUDE.md`);
}

console.log("");
console.log(`  \x1b[32m✔ Done! Installed to ${installed} agent ${installed === 1 ? "directory" : "directories"}\x1b[0m`);
console.log("");
console.log(`  \x1b[35m  The skill is ready — your AI agent will load it automatically.\x1b[0m`);
console.log("");
