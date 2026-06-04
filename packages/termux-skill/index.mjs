#!/usr/bin/env node

import { readFileSync, existsSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SKILL_SOURCE = join(__dirname, "termux-SKILL.md");
const SKILL_ID = "termux-api";
const SKILL_FILENAME = "SKILL.md";
const PKG = JSON.parse(readFileSync(join(__dirname, "package.json"), "utf-8"));
const VERSION = PKG.version;

const AGENT_PATHS = [
  { name: "OpenCode / Copilot (universal)", path: ".agents/skills" },
  { name: "Claude Code", path: ".claude/skills" },
  { name: "Codex CLI", path: ".agents/skills" },
  { name: "Cursor", path: ".cursor/skills" },
  { name: "Windsurf", path: ".windsurf/skills" },
  { name: "Continue", path: ".continue/skills" },
];

const cwd = process.cwd();
const args = process.argv.slice(2);
const flags = new Set(args.filter(a => a.startsWith("-")));
const help = flags.has("--help") || flags.has("-h");
const uninstall = flags.has("--uninstall");
const update = flags.has("--update") || flags.has("-u");
const force = flags.has("--force") || flags.has("-f");

// ── Help ─────────────────────────────────────────────────────
if (help) {
  console.log("");
  console.log("  \x1b[36mtermux-skill\x1b[0m \x1b[90mv" + VERSION + "\x1b[0m");
  console.log("  \x1b[90mTermux API skill for AI agents\x1b[0m");
  console.log("");
  console.log("  \x1b[37mUsage:\x1b[0m");
  console.log("    npx termux-skill              \x1b[90mInstall/update skill\x1b[0m");
  console.log("    npx termux-skill --update     \x1b[90mForce update skill files\x1b[0m");
  console.log("    npx termux-skill --uninstall  \x1b[90mRemove skill from all agents\x1b[0m");
  console.log("    npx termux-skill --help       \x1b[90mShow this help\x1b[0m");
  console.log("");
  console.log("  \x1b[37mOptions:\x1b[0m");
  console.log("    -u, --update     Reinstall skill (overwrites existing)");
  console.log("    -f, --force      Skip hash check on update");
  console.log("    -h, --help       Show help message");
  console.log("");
  process.exit(0);
}

const skillContent = readFileSync(SKILL_SOURCE, "utf-8");
const bundleHash = createHash("sha256").update(skillContent).digest("hex");

const lockPath = resolve(cwd, "skills-lock.json");
let lock = {};
if (existsSync(lockPath)) {
  try { lock = JSON.parse(readFileSync(lockPath, "utf-8")); } catch {}
}

const existing = lock[SKILL_ID];

// ── Uninstall ────────────────────────────────────────────────
if (uninstall) {
  console.log("");
  console.log("  \x1b[36m╔═══════════════════════════════════════╗\x1b[0m");
  console.log("  \x1b[36m║\x1b[0m  \x1b[33mtermux-skill\x1b[0m  \x1b[90mv" + VERSION + "\x1b[0m         \x1b[36m║\x1b[0m");
  console.log("  \x1b[36m║\x1b[0m  \x1b[90mUninstalling...\x1b[0m                    \x1b[36m║\x1b[0m");
  console.log("  \x1b[36m╚═══════════════════════════════════════╝\x1b[0m");
  console.log("");

  let removed = 0;
  for (const agent of AGENT_PATHS) {
    const targetDir = resolve(cwd, agent.path, SKILL_ID);
    if (existsSync(targetDir)) {
      rmSync(targetDir, { recursive: true, force: true });
      console.log(`  \x1b[32m✔\x1b[0m Removed for \x1b[37m${agent.name}\x1b[0m`);
      removed++;
    }
  }

  // Clean lockfile
  if (existing) {
    delete lock[SKILL_ID];
    writeFileSync(lockPath, JSON.stringify(lock, null, 2) + "\n", "utf-8");
    console.log(`  \x1b[32m✔\x1b[0m Removed from \x1b[90mskills-lock.json\x1b[0m`);
  }

  // Clean CLAUDE.md
  const claudePath = resolve(cwd, "CLAUDE.md");
  if (existsSync(claudePath)) {
    let claude = readFileSync(claudePath, "utf-8");
    const newClaude = claude.replace(/<!-- termux-skill -->[\s\S]*?<!-- \/termux-skill -->\n?/g, "").trim();
    if (newClaude !== claude) {
      writeFileSync(claudePath, newClaude.length === 0 ? "" : newClaude + "\n", "utf-8");
      console.log(`  \x1b[32m✔\x1b[0m Cleaned \x1b[90mCLAUDE.md\x1b[0m`);
    }
  }

  console.log("");
  console.log(`  \x1b[32m✔ Done! Removed from ${removed} agent ${removed === 1 ? "directory" : "directories"}\x1b[0m`);
  console.log("");
  process.exit(0);
}

// ── Banner ──────────────────────────────────────────────────
console.log("");
console.log("  \x1b[36m╔═══════════════════════════════════════╗\x1b[0m");
console.log("  \x1b[36m║\x1b[0m  \x1b[33mtermux-skill\x1b[0m  \x1b[90mv" + VERSION + "\x1b[0m         \x1b[36m║\x1b[0m");
console.log("  \x1b[36m║\x1b[0m  \x1b[90mTermux API skill for AI agents\x1b[0m    \x1b[36m║\x1b[0m");
console.log("  \x1b[36m╚═══════════════════════════════════════╝\x1b[0m");
console.log("");

// ── Hash check for update ───────────────────────────────────
if (existing && !update && !force) {
  if (existing.bundleHash === bundleHash) {
    console.log("  \x1b[32m✔\x1b[0m Skill is up-to-date \x1b[90m(hash match)\x1b[0m");
    console.log("");
    console.log(`  \x1b[90m  Use --update to force reinstall.\x1b[0m`);
    console.log("");
    process.exit(0);
  } else {
    console.log("  \x1b[33m⚠\x1b[0m Skill hash changed \x1b[90m(reinstalling...)\x1b[0m");
    console.log("");
  }
}

// ── Install to agent directories ────────────────────────────
let installed = 0;
const installedPaths = [];

for (const agent of AGENT_PATHS) {
  const targetDir = resolve(cwd, agent.path, SKILL_ID);
  const targetFile = join(targetDir, SKILL_FILENAME);

  try {
    if (!force && !update && existsSync(targetFile)) {
      console.log(`  \x1b[90m○\x1b[0m Already installed for \x1b[37m${agent.name}\x1b[0m \x1b[90m(use --update to reinstall)\x1b[0m`);
      continue;
    }
    mkdirSync(targetDir, { recursive: true });
    writeFileSync(targetFile, skillContent, "utf-8");
    console.log(`  \x1b[32m✔\x1b[0m ${update ? "Updated" : "Installed"} for \x1b[37m${agent.name}\x1b[0m`);
    console.log(`    \x1b[90m${targetFile}\x1b[0m`);
    installed++;
    installedPaths.push(agent.path);
  } catch (err) {
    console.log(`  \x1b[33m⚠\x1b[0m Skipped \x1b[37m${agent.name}\x1b[0m (\x1b[31m${err.message}\x1b[0m)`);
  }
}

// ── Write skills-lock.json ──────────────────────────────────
lock[SKILL_ID] = {
  version: VERSION,
  source: "termux-skill",
  bundleHash,
  installedAt: new Date().toISOString(),
  agents: installedPaths.filter((p, i, a) => a.indexOf(p) === i),
};

writeFileSync(lockPath, JSON.stringify(lock, null, 2) + "\n", "utf-8");
console.log(`  \x1b[32m✔\x1b[0m Lockfile written: \x1b[90m${lockPath}\x1b[0m`);

// ── Clean and update CLAUDE.md ─────────────────────────────
const claudePath = resolve(cwd, "CLAUDE.md");
if (existsSync(claudePath)) {
  let claude = readFileSync(claudePath, "utf-8");
  const sectionRegex = /<!-- termux-skill -->[\s\S]*?<!-- \/termux-skill -->\n?/g;
  const newClaude = claude.replace(sectionRegex, "").trim();
  if (newClaude !== claude && newClaude.length === 0) {
    writeFileSync(claudePath, "", "utf-8");
    console.log(`  \x1b[90m○\x1b[0m Cleaned old section from \x1b[90mCLAUDE.md\x1b[0m \x1b[90m(file empty)\x1b[0m`);
  } else if (newClaude !== claude) {
    writeFileSync(claudePath, newClaude + "\n", "utf-8");
    console.log(`  \x1b[90m○\x1b[0m Cleaned old section from \x1b[90mCLAUDE.md\x1b[0m`);
  }

  if (newClaude.length > 0 || !sectionRegex.test(claude)) {
    const section = `<!-- termux-skill -->\nThe project has termux-api skill installed at .agents/skills/termux-api/SKILL.md.\nIt provides access to 70+ Android Termux API commands (camera, sensors, GPS, SMS, notifications, clipboard, TTS, etc.).\n<!-- /termux-skill -->\n`;
    writeFileSync(claudePath, (newClaude.length > 0 ? newClaude + "\n" : "") + section, "utf-8");
    console.log(`  \x1b[32m✔\x1b[0m Updated \x1b[90mCLAUDE.md\x1b[0m`);
  }
}

console.log("");
console.log(`  \x1b[32m✔ Done! ${update ? "Updated" : "Installed"} in ${installed} agent ${installed === 1 ? "directory" : "directories"}\x1b[0m`);
console.log("");
console.log(`  \x1b[35m  The skill is ready — your AI agent will load it automatically.\x1b[0m`);
console.log("");
