"""Template rendering for agent prompts.

Templates are bundled with the plugin under ``templates/`` and use simple
``{placeholder}`` substitution.
"""
from __future__ import annotations

from typing import Dict

from paths import TEMPLATE_DIR


class TemplateRenderer:
    def render(self, name: str, context: Dict[str, str]) -> str:
        template_path = TEMPLATE_DIR / f"{name}.md"
        if not template_path.exists():
            raise SystemExit(f"Missing template: {template_path}")
        text = template_path.read_text(encoding="utf-8")
        for key, value in context.items():
            text = text.replace("{" + key + "}", value)
        return text
