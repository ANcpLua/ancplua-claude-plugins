---
name: format-on-save-cs
enabled: false
event: file
action: execute
command: dotnet format --include ${file_path}
conditions:
  - field: file_path
    operator: regex_match
    pattern: \.cs$
---
Auto-formatted C# file with dotnet format.
