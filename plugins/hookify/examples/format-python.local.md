---
name: format-on-save-python
enabled: false
event: file
action: execute
command: python3 -m black ${file_path}
conditions:
  - field: file_path
    operator: regex_match
    pattern: \.py$
---
Auto-formatted Python file with Black.
