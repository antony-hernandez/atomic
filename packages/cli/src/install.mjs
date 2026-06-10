#!/usr/bin/env node
/**
 * Atom Developer Skills installer — copia skills, CLAUDE.md y configura MCPs
 * Uso: curl -fsSL https://raw.githubusercontent.com/antony-hernandez/atom-developer-skills/main/packages/cli/src/install.mjs | node
 * o:  npx github:antony-hernandez/atom-developer-skills
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { resolve, dirname, join } from "path";
import { fileURLToPath } from "url";

const ADS_START = "<!-- ADS:START — no editar esta sección manualmente -->";
const ADS_END = "<!-- ADS:END -->";
// Backward compat: detectar marcadores viejos también
const LEGACY_START = "<!-- ATOMIC:START — no editar esta sección manualmente -->";
const LEGACY_END = "<!-- ATOMIC:END -->";
const TECH_PLACEHOLDER = "<!-- ATOMIC:TECH_SECTIONS -->";
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const ROOT = process.cwd();
const SKILLS_RAW_BASE = "https://raw.githubusercontent.com/antony-hernandez/atom-developer-skills/main/skills";
const TEMPLATES_RAW_BASE = "https://raw.githubusercontent.com/antony-hernandez/atom-developer-skills/main/packages/cli/templates";

const green  = (s) => `\x1b[32m${s}\x1b[0m`;
const yellow = (s) => `\x1b[33m${s}\x1b[0m`;
const bold   = (s) => `\x1b[1m${s}\x1b[0m`;
const dim    = (s) => `\x1b[2m${s}\x1b[0m`;

console.log(bold("\n⚡ Atom Developer Skills — Asistente de desarrollo de Atom\n"));

// Detectar si corremos desde stdin (curl | node) o desde un archivo real (npx)
let SKILLS_DIR = null;
let TEMPLATES_DIR = null;
try {
  const __dir = dirname(fileURLToPath(import.meta.url));
  const skillsCandidate = resolve(__dir, "../../../skills");
  if (existsSync(join(skillsCandidate, "task/SKILL.md"))) {
    SKILLS_DIR = skillsCandidate;
  }
  const templatesCandidate = resolve(__dir, "../templates");
  if (existsSync(join(templatesCandidate, "CLAUDE-base.md"))) {
    TEMPLATES_DIR = templatesCandidate;
  }
} catch {
  // import.meta.url no resuelve desde stdin — modo remoto
}

if (!SKILLS_DIR || !TEMPLATES_DIR) {
  console.log("  (descargando assets desde GitHub)\n");
}

async function readSkill(relativePath) {
  if (SKILLS_DIR) {
    return readFileSync(join(SKILLS_DIR, relativePath), "utf8");
  }
  const url = `${SKILLS_RAW_BASE}/${relativePath}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Error al descargar ${url}: HTTP ${res.status}`);
  return res.text();
}

async function readTemplate(relativePath) {
  if (TEMPLATES_DIR) {
    return readFileSync(join(TEMPLATES_DIR, relativePath), "utf8");
  }
  const url = `${TEMPLATES_RAW_BASE}/${relativePath}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Error al descargar ${url}: HTTP ${res.status}`);
  return res.text();
}

// Detectar tipo de proyecto desde package.json
function detectProjectTypes(root) {
  const pkgPath = join(root, "package.json");
  if (!existsSync(pkgPath)) return [];
  try {
    const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
    const deps = { ...pkg.dependencies, ...pkg.devDependencies, ...pkg.peerDependencies };
    const types = [];
    if (deps["@angular/core"])                                          types.push("frontend-angular");
    if (deps["firebase-functions"] || deps["@google-cloud/functions-framework"]) types.push("backend-cf");
    if (deps["react-native"] || deps["expo"])                          types.push("mobile-rn");
    return types;
  } catch {
    return [];
  }
}

const SECTION_LABELS = {
  "frontend-angular": "Frontend (Angular)",
  "backend-cf":       "Backend (Cloud Functions)",
  "mobile-rn":        "Mobile (React Native)",
};

async function buildClaudeMd() {
  const base = await readTemplate("CLAUDE-base.md");
  const types = detectProjectTypes(ROOT);

  // Sin detección → instalar todas las secciones (proyecto nuevo o monorepo)
  const toInstall = types.length > 0 ? types : Object.keys(SECTION_LABELS);

  if (types.length > 0) {
    console.log(dim(`  detectado: ${types.map(t => SECTION_LABELS[t]).join(", ")}`));
  } else {
    console.log(dim("  sin package.json — instalando todas las secciones"));
  }

  const sections = await Promise.all(
    toInstall.map(type => readTemplate(`sections/${type}.md`))
  );

  return base.replace(TECH_PLACEHOLDER, sections.join("\n"));
}

async function install() {
  // 1. Crear directorios necesarios
  mkdirSync(join(ROOT, ".claude/skills/task"), { recursive: true });
  mkdirSync(join(ROOT, ".claude/skills/spec"), { recursive: true });

  // 2. Copiar skills
  const skillContent = await readSkill("task/SKILL.md");
  const specContent  = await readSkill("spec/SKILL.md");

  const skills = [
    ["task/SKILL.md",          ".claude/skills/task/SKILL.md",          skillContent],
    ["task/brief-template.md", ".claude/skills/task/brief-template.md", null],
    ["spec/SKILL.md",          ".claude/skills/spec/SKILL.md",          specContent],
  ];
  for (const [src, dest, preloaded] of skills) {
    const content = preloaded ?? await readSkill(src);
    writeFileSync(join(ROOT, dest), content);
  }

  console.log(green("  ✓ skill ads:task") + ` → .claude/skills/task/`);
  console.log(green("  ✓ skill ads:spec") + ` → .claude/skills/spec/`);

  // 3. Crear o actualizar CLAUDE.md (con sección ADS delimitada)
  const claudeMdPath = join(ROOT, "CLAUDE.md");
  const atomicContent = await buildClaudeMd();
  const wrappedSection = `${ADS_START}\n${atomicContent}\n${ADS_END}`;

  if (!existsSync(claudeMdPath)) {
    writeFileSync(claudeMdPath, wrappedSection + "\n");
    console.log(green("  ✓ CLAUDE.md creado"));
  } else {
    const existing = readFileSync(claudeMdPath, "utf8");
    const hasAds    = existing.includes(ADS_START);
    const hasLegacy = existing.includes(LEGACY_START);
    if (hasAds) {
      const updated = existing.replace(
        new RegExp(`${escapeRegex(ADS_START)}[\\s\\S]*?${escapeRegex(ADS_END)}`),
        wrappedSection
      );
      writeFileSync(claudeMdPath, updated);
      console.log(green("  ✓ sección ADS actualizada en CLAUDE.md"));
    } else if (hasLegacy) {
      const updated = existing.replace(
        new RegExp(`${escapeRegex(LEGACY_START)}[\\s\\S]*?${escapeRegex(LEGACY_END)}`),
        wrappedSection
      );
      writeFileSync(claudeMdPath, updated);
      console.log(green("  ✓ sección Atomic migrada a ADS en CLAUDE.md"));
    } else {
      writeFileSync(claudeMdPath, existing.trimEnd() + "\n\n" + wrappedSection + "\n");
      console.log(green("  ✓ sección ADS agregada a CLAUDE.md existente"));
    }
  }

  // 4. Configurar MCPs en .claude/settings.json
  const settingsPath = join(ROOT, ".claude/settings.json");
  let settings = {};
  if (existsSync(settingsPath)) {
    try { settings = JSON.parse(readFileSync(settingsPath, "utf8")); } catch { /* malformado */ }
  }

  settings.mcpServers = settings.mcpServers ?? {};

  if (!settings.mcpServers.codegraph) {
    settings.mcpServers.codegraph = {
      command: "npx",
      args: ["-y", "@colbymchenry/codegraph@latest", "serve"],
      env: {}
    };
    console.log(green("  ✓ MCP CodeGraph configurado"));
  } else {
    console.log(yellow("  ~ MCP CodeGraph ya configurado"));
  }

  const missingMcps = [];
  if (!settings.mcpServers["plugin:atlassian:atlassian"]) missingMcps.push({ name: "Atlassian", required: true });
  if (!settings.mcpServers["plugin:figma:figma"])         missingMcps.push({ name: "Figma",     required: false });
  if (!settings.mcpServers["plugin:context7:context7"])   missingMcps.push({ name: "Context7",  required: false });

  const blocking    = missingMcps.filter(m => m.required);
  const nonBlocking = missingMcps.filter(m => !m.required);

  if (blocking.length > 0) {
    console.log(yellow("\n  ⚠️  Requerido — sin esto ads:task no funciona:\n"));
    console.log("    1. Abrí claude.ai/settings → Integrations");
    blocking.forEach((mcp, i) => {
      console.log(yellow(`    ${i + 2}. Conectá "${mcp.name}" → autenticá con tu cuenta`));
    });
    console.log(`    ${blocking.length + 2}. Reiniciá Claude Code en este proyecto`);
    console.log("");
  }

  if (nonBlocking.length > 0) {
    console.log(dim("  Recomendado (mejora el análisis técnico):"));
    nonBlocking.forEach(mcp => {
      console.log(dim(`    • ${mcp.name} — claude.ai/settings → Integrations`));
    });
    console.log("");
  }

  writeFileSync(settingsPath, JSON.stringify(settings, null, 2));

  console.log(bold("\n¡Listo! Atom Developer Skills instalado.\n"));
  console.log("  Siguiente paso (requerido):");
  console.log(yellow("    npx @colbymchenry/codegraph init -i") + dim("  ← indexar el codebase (necesario para ads:task)"));
  console.log(dim("    Corré esto una vez en la raíz del proyecto. Tarda 1-2 min en repos grandes.\n"));
  console.log("  Uso:");
  console.log("    ads:task CV-123          ← carga el brief completo de una tarea");
  console.log("    ads:spec <URL_FRD>       ← convierte un FRD en spec técnica + backlog\n");
}

install().catch((err) => {
  console.error(`\n  ✗ Error durante la instalación: ${err.message}\n`);
  process.exit(1);
});
