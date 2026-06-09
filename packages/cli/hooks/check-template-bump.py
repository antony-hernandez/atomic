#!/usr/bin/env python3
"""
PostToolUse hook — avisa si un template fue editado sin hacer version bump.
- SKILL.md: compara version: en HEAD vs archivo actual
- Otros templates: compara package.json version en HEAD vs actual
"""
import sys
import json
import subprocess
import re

data = json.load(sys.stdin)
fp = data.get("tool_input", {}).get("file_path", "")

if "packages/cli/templates/" not in fp:
    sys.exit(0)

msg = None

if fp.endswith("SKILL.md"):
    try:
        head = subprocess.run(
            ["git", "show", f"HEAD:{fp}"],
            capture_output=True, text=True
        )
        if head.returncode != 0:
            sys.exit(0)  # archivo nuevo, no hay HEAD — ok
        head_ver = re.search(r"^version:\s*(\S+)", head.stdout, re.M)
        with open(fp) as f:
            curr = f.read()
        curr_ver = re.search(r"^version:\s*(\S+)", curr, re.M)
        if head_ver and curr_ver and head_ver.group(1) == curr_ver.group(1):
            skill_name = fp.split("/")[-2]
            v = curr_ver.group(1)
            msg = f"⚠️  Skill editado sin bump: /{skill_name} sigue en v{v} — hacer version bump + actualizar CHANGELOG antes de commitear."
    except Exception:
        pass
else:
    try:
        head = subprocess.run(
            ["git", "show", "HEAD:package.json"],
            capture_output=True, text=True
        )
        if head.returncode != 0:
            sys.exit(0)
        head_pkg = json.loads(head.stdout)
        with open("package.json") as f:
            curr_pkg = json.load(f)
        if head_pkg.get("version") == curr_pkg.get("version"):
            fname = fp.split("/")[-1]
            v = curr_pkg.get("version", "?")
            msg = f"⚠️  Template editado sin bump: {fname} — package.json sigue en v{v}. Hacer bump + actualizar CHANGELOG antes de commitear."
    except Exception:
        pass

if msg:
    print(json.dumps({"systemMessage": msg}))
