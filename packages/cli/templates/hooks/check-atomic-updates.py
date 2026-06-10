#!/usr/bin/env python3
"""
SessionStart hook — sincroniza skills Atomic contra GitHub automáticamente.
Si hay una versión nueva, sobreescribe el SKILL.md local sin tocar CLAUDE.md ni settings.json.
"""
import sys
import json
import re
import os
import urllib.request

RAW_BASE = "https://raw.githubusercontent.com/antony-hernandez/atomic/main/packages/cli/templates/skills"

SKILLS = [
    {"name": "task", "local": ".claude/skills/task/SKILL.md"},
    {"name": "spec", "local": ".claude/skills/spec/SKILL.md"},
]

def parse_version(content):
    match = re.search(r"^version:\s*(\S+)", content, re.MULTILINE)
    return match.group(1) if match else None

def fetch_remote(skill_name):
    url = f"{RAW_BASE}/{skill_name}/SKILL.md"
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "atomic-updater"})
        with urllib.request.urlopen(req, timeout=3) as resp:
            return resp.read().decode("utf-8")
    except Exception:
        return None

def main():
    cwd = os.getcwd()
    updated = []

    for skill in SKILLS:
        local_path = os.path.join(cwd, skill["local"])
        if not os.path.exists(local_path):
            continue

        with open(local_path, "r") as f:
            local_v = parse_version(f.read())
        if not local_v:
            continue

        remote_content = fetch_remote(skill["name"])
        if not remote_content:
            continue

        remote_v = parse_version(remote_content)
        if remote_v and remote_v != local_v:
            with open(local_path, "w") as f:
                f.write(remote_content)
            updated.append(f"/{skill['name']} {local_v} → {remote_v}")

    if updated:
        updates = ", ".join(updated)
        print(json.dumps({
            "systemMessage": f"⚡ Atomic — auto-actualizado: {updates}"
        }))

if __name__ == "__main__":
    main()
