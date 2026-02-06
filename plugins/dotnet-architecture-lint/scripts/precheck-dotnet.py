#!/usr/bin/env python3
"""
PreToolUse hook: Validates .NET MSBuild files BEFORE they are written.
Blocks edits that would introduce architecture violations.

Exit codes:
  0 = Allow (not a .NET config file, or content is valid)
  2 = Block (violations found - stderr contains the reason)

Note: RULE_C (symlink integrity) is intentionally excluded - cannot check
symlinks on files that don't exist yet. Use lint-dotnet.sh for post-hoc checks.
"""
import fnmatch
import json
import re
import sys
from pathlib import Path

# File extensions this hook cares about
RELEVANT_EXTENSIONS = {'.props', '.targets', '.csproj'}
RELEVANT_FILENAMES = {'global.json', 'nuget.config', 'Directory.Packages.props'}


def is_relevant_file(file_path: str) -> bool:
    """Check if this file is a .NET config file we should validate."""
    p = Path(file_path)
    return p.suffix.lower() in RELEVANT_EXTENSIONS or p.name in RELEVANT_FILENAMES


def get_proposed_content(tool_name: str, tool_input: dict) -> str | None:
    """
    Extract the proposed content from the tool input.

    For Write: returns the full content being written.
    For Edit: reads actual file, applies the edit virtually, returns result.
    """
    if tool_name == "Write":
        return tool_input.get("content", "")
    elif tool_name == "Edit":
        # Edit only sends old_string/new_string - read file to get full context
        file_path = tool_input.get("file_path", "")
        old_string = tool_input.get("old_string", "")
        new_string = tool_input.get("new_string", "")

        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                current_content = f.read()
            # Apply the edit virtually
            return current_content.replace(old_string, new_string, 1)
        except (FileNotFoundError, IOError):
            # File doesn't exist yet or can't read - validate new_string only
            return new_string
    return None


def check_violations(file_path: str, content: str) -> list[str]:
    """
    Check proposed content for MSBuild architecture violations.
    Returns list of violation messages.
    """
    violations = []
    p = Path(file_path)

    # RULE G: No PackageReference with hardcoded Version in .csproj
    # Unless it's VersionOverride or $(Variable)
    if p.suffix == '.csproj':
        # Skip if project explicitly disables CPM
        if '<ManagePackageVersionsCentrally>false</ManagePackageVersionsCentrally>' not in content:
            # Pattern 1: Attribute syntax - <PackageReference Include="X" Version="1.0.0"/>
            attr_pattern = r'<PackageReference[^>]*Version\s*=\s*"(?!\$\()[^"]*"'
            # Pattern 2: Child element syntax - <PackageReference><Version>1.0.0</Version></PackageReference>
            child_pattern = r'<PackageReference[^>]*>\s*<Version>(?!\$\()[^<]*</Version>'

            if (re.search(attr_pattern, content) or re.search(child_pattern, content)) and 'VersionOverride' not in content:
                # Find attribute-style versions
                matches = re.findall(r'<PackageReference[^>]*Include="([^"]*)"[^>]*Version="([^"]*)"', content)
                # Find child-element-style versions
                matches += re.findall(r'<PackageReference[^>]*Include="([^"]*)"[^>]*>\s*<Version>([^<]*)</Version>', content, re.DOTALL)
                for pkg, ver in matches:
                    if not ver.startswith('$('):
                        violations.append(
                            f"RULE_G: PackageReference '{pkg}' has hardcoded Version=\"{ver}\". "
                            f"Use Central Package Management (remove Version, add to Directory.Packages.props)"
                        )

    # RULE A: No hardcoded versions in Directory.Packages.props
    if p.name == 'Directory.Packages.props':
        # Match Version="X.Y.Z" but not Version="$(Var)"
        pattern = r'<PackageVersion[^>]*Version\s*=\s*"(?!\$\()([^"]*)"'
        matches = re.findall(pattern, content)
        if matches:
            violations.append(
                f"RULE_A: Directory.Packages.props has hardcoded versions. "
                f"Use MSBuild variables from Version.props (e.g., Version=\"$(SomeVersion)\")"
            )

    # RULE B: Only specific files should import Version.props
    if p.suffix == '.props' and 'Import' in content and 'Version.props' in content:
        allowed_names = {'Directory.Packages.props', 'Directory.Build.props', 'Sdk.props'}

        is_allowed = (
            p.name in allowed_names or
            'eng/Directory.Build.props' in file_path or
            'src/common/' in file_path or
            fnmatch.fnmatch(file_path, '*/src/Sdk/*/Sdk.props')
        )

        if not is_allowed:
            violations.append(
                f"RULE_B: File '{p.name}' should not import Version.props directly. "
                f"Only Directory.Packages.props, eng/Directory.Build.props, or src/Sdk/*/Sdk.props may do this."
            )

    return violations


def _hades_permit_active() -> bool:
    """Hades god mode — active permit bypasses all checks."""
    permit = Path('.smart', 'delete-permit.json')
    if not permit.is_file():
        return False
    try:
        import time as _time
        data = json.loads(permit.read_text())
        return data.get('status') == 'active' and _time.time() <= data.get('expires_epoch', 0)
    except Exception:
        return False


def main():
    # Hades god mode — bypass all architecture checks
    if _hades_permit_active():
        sys.exit(0)

    try:
        input_data = json.load(sys.stdin)
    except json.JSONDecodeError as e:
        # Can't parse input, allow to proceed (don't block on hook errors)
        sys.exit(0)

    tool_name = input_data.get("tool_name", "")
    tool_input = input_data.get("tool_input", {})

    # Only process Edit and Write
    if tool_name not in ("Edit", "Write"):
        sys.exit(0)

    file_path = tool_input.get("file_path", "")

    # Skip if not a .NET config file
    if not is_relevant_file(file_path):
        sys.exit(0)

    # Get the proposed content
    content = get_proposed_content(tool_name, tool_input)
    if content is None:
        sys.exit(0)

    # Check for violations
    violations = check_violations(file_path, content)

    if violations:
        # Block the edit - exit 2 with stderr message
        error_msg = f"BLOCKED: MSBuild architecture violations in {Path(file_path).name}:\n"
        for v in violations:
            error_msg += f"  • {v}\n"
        error_msg += "\nFix these issues before proceeding."
        print(error_msg, file=sys.stderr)
        sys.exit(2)

    # All good, allow the edit
    sys.exit(0)


if __name__ == "__main__":
    main()
