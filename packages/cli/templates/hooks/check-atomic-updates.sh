#!/usr/bin/env bash
# SessionStart hook — sincroniza skills Atomic contra GitHub automáticamente.
# Si hay versión nueva, sobreescribe el SKILL.md local sin tocar CLAUDE.md ni settings.json.

RAW_BASE="https://raw.githubusercontent.com/antony-hernandez/atomic/main/packages/cli/templates/skills"
updated=""

for skill in task spec; do
  local_path=".claude/skills/${skill}/SKILL.md"
  [ -f "$local_path" ] || continue

  local_v=$(grep -m1 "^version:" "$local_path" | awk '{print $2}')
  [ -n "$local_v" ] || continue

  remote_content=$(curl -sf --max-time 3 -H "User-Agent: atomic-updater" "${RAW_BASE}/${skill}/SKILL.md") || continue
  remote_v=$(echo "$remote_content" | grep -m1 "^version:" | awk '{print $2}')

  if [ -n "$remote_v" ] && [ "$remote_v" != "$local_v" ]; then
    echo "$remote_content" > "$local_path"
    entry="/${skill} ${local_v} → ${remote_v}"
    updated="${updated:+$updated, }$entry"
  fi
done

if [ -n "$updated" ]; then
  printf '{"systemMessage": "⚡ Atomic — auto-actualizado: %s"}\n' "$updated"
fi
exit 0
