#!/usr/bin/env node
/**
 * Atomic installer — copia skills, CLAUDE.md y configura MCPs
 * Uso: curl -fsSL https://raw.githubusercontent.com/antony-hernandez/atomic/main/packages/cli/src/install.mjs | node
 * o:  npx github:antony-hernandez/atomic
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { resolve, dirname, join } from "path";
import { fileURLToPath } from "url";

const ATOMIC_START = "<!-- ATOMIC:START — no editar esta sección manualmente -->";
const ATOMIC_END = "<!-- ATOMIC:END -->";
const TECH_PLACEHOLDER = "<!-- ATOMIC:TECH_SECTIONS -->";
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const ROOT = process.cwd();
const RAW_BASE = "https://raw.githubusercontent.com/antony-hernandez/atomic/main/packages/cli/templates";

const green  = (s) => `\x1b[32m${s}\x1b[0m`;
const yellow = (s) => `\x1b[33m${s}\x1b[0m`;
const bold   = (s) => `\x1b[1m${s}\x1b[0m`;
const dim    = (s) => `\x1b[2m${s}\x1b[0m`;

console.log(bold("\n⚡ Atomic — Asistente de desarrollo de Atom\n"));

// Detectar si corremos desde stdin (curl | node) o desde un archivo real (npx)
let TEMPLATES = null;
try {
  const __dir = dirname(fileURLToPath(import.meta.url));
  const candidate = resolve(__dir, "../templates");
  if (existsSync(join(candidate, "skills/task/SKILL.md"))) {
    TEMPLATES = candidate;
  }
} catch {
  // import.meta.url no resuelve desde stdin — modo remoto
}

if (!TEMPLATES) {
  console.log("  (descargando templates desde GitHub)\n");
}

async function readTemplate(relativePath) {
  if (TEMPLATES) {
    return readFileSync(join(TEMPLATES, relativePath), "utf8");
  }
  const url = `${RAW_BASE}/${relativePath}`;
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

function extractVersion(content) {
  const match = content.match(/^---[\s\S]*?version:\s*(\S+)[\s\S]*?---/);
  return match ? match[1] : null;
}

async function install() {
  // 1. Crear directorios necesarios
  mkdirSync(join(ROOT, ".claude/skills/task"), { recursive: true });
  mkdirSync(join(ROOT, ".claude/skills/spec"), { recursive: true });

  // 2. Copiar skills
  const skillContent = await readTemplate("skills/task/SKILL.md");
  const skillVersion = extractVersion(skillContent);
  const versionLabel = skillVersion ? dim(` v${skillVersion}`) : "";

  const specContent = await readTemplate("skills/spec/SKILL.md");
  const specVersion = extractVersion(specContent);
  const specVersionLabel = specVersion ? dim(` v${specVersion}`) : "";

  const skills = [
    ["skills/task/SKILL.md",         ".claude/skills/task/SKILL.md",         skillContent],
    ["skills/task/brief-template.md", ".claude/skills/task/brief-template.md", null],
    ["skills/spec/SKILL.md",         ".claude/skills/spec/SKILL.md",         specContent],
  ];
  for (const [src, dest, preloaded] of skills) {
    const content = preloaded ?? await readTemplate(src);
    writeFileSync(join(ROOT, dest), content);
  }
  console.log(green("  ✓ skill /task") + versionLabel + ` → .claude/skills/task/`);
  console.log(green("  ✓ skill /spec") + specVersionLabel + ` → .claude/skills/spec/`);

  // 3. Crear o actualizar CLAUDE.md (con sección Atomic delimitada)
  const claudeMdPath = join(ROOT, "CLAUDE.md");
  const atomicContent = await buildClaudeMd();
  const wrappedSection = `${ATOMIC_START}\n${atomicContent}\n${ATOMIC_END}`;

  if (!existsSync(claudeMdPath)) {
    writeFileSync(claudeMdPath, wrappedSection + "\n");
    console.log(green("  ✓ CLAUDE.md creado"));
  } else {
    const existing = readFileSync(claudeMdPath, "utf8");
    if (existing.includes(ATOMIC_START)) {
      const updated = existing.replace(
        new RegExp(`${escapeRegex(ATOMIC_START)}[\\s\\S]*?${escapeRegex(ATOMIC_END)}`),
        wrappedSection
      );
      writeFileSync(claudeMdPath, updated);
      console.log(green("  ✓ sección Atomic actualizada en CLAUDE.md"));
    } else {
      writeFileSync(claudeMdPath, existing.trimEnd() + "\n\n" + wrappedSection + "\n");
      console.log(green("  ✓ sección Atomic agregada a CLAUDE.md existente"));
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
    console.log(yellow("\n  ⚠️  Requerido — sin esto /task no funciona:\n"));
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

  console.log(bold("\n¡Listo! Atomic instalado.\n"));
  console.log("  Uso:");
  console.log("    /task CV-123          ← carga el brief completo de una tarea");
  console.log("    /spec <URL_FRD>       ← convierte un FRD en spec técnica + backlog\n");
}

install().catch((err) => {
  console.error(`\n  ✗ Error durante la instalación: ${err.message}\n`);
  process.exit(1);
});
