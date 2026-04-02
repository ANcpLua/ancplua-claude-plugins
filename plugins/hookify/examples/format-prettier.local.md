---
name: format-on-save-prettier
enabled: false
event: file
action: execute
command: npx prettier --write ${file_path}
conditions:
  - field: file_path
    operator: regex_match
    pattern: \.(ts|tsx|js|jsx|json|css|md)$
---
Auto-formatted file with Prettier.
