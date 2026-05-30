// Ported from openai/plugins plugin-eval (MIT). See ../../THIRD_PARTY_NOTICES.md.

function countIndent(line) {
  return line.length - line.trimStart().length;
}

function parseScalar(rawValue) {
  const value = rawValue.trim();
  if (!value) {
    return "";
  }
  if (
    (value.startsWith("\"") && value.endsWith("\"")) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }
  if (value === "true") {
    return true;
  }
  if (value === "false") {
    return false;
  }
  if (value === "null") {
    return null;
  }
  if (/^-?\d+(\.\d+)?$/.test(value)) {
    return Number(value);
  }
  if (value.startsWith("[") && value.endsWith("]")) {
    return value
      .slice(1, -1)
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
      .map(parseScalar);
  }
  return value;
}

function nextMeaningfulIndex(lines, startIndex) {
  for (let index = startIndex; index < lines.length; index += 1) {
    const trimmed = lines[index].trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }
    return index;
  }
  return -1;
}

function parseBlockScalarHeader(rawValue) {
  const value = rawValue.trim();
  if (!value) {
    return null;
  }
  if (!value.startsWith(">") && !value.startsWith("|")) {
    return null;
  }
  return {
    style: value[0],
  };
}

function foldBlockScalarLines(lines) {
  let result = "";
  for (let index = 0; index < lines.length; index += 1) {
    const current = lines[index];
    const next = lines[index + 1];

    result += current;
    if (next === undefined) {
      continue;
    }
    if (current === "" || next === "") {
      result += "\n";
    } else {
      result += " ";
    }
  }
  return result;
}

function parseBlockScalar(lines, startIndex, parentIndent, style) {
  const blockLines = [];
  let index = startIndex;

  while (index < lines.length) {
    const line = lines[index];
    const trimmed = line.trim();
    const currentIndent = countIndent(line);

    if (trimmed && currentIndent <= parentIndent) {
      break;
    }

    blockLines.push(line);
    index += 1;
  }

  const contentIndent = blockLines.reduce((minimumIndent, line) => {
    const trimmed = line.trim();
    if (!trimmed) {
      return minimumIndent;
    }
    const currentIndent = countIndent(line);
    if (currentIndent <= parentIndent) {
      return minimumIndent;
    }
    return minimumIndent === null ? currentIndent : Math.min(minimumIndent, currentIndent);
  }, null);

  const normalizedLines = blockLines.map((line) => {
    if (!line.trim()) {
      return "";
    }
    if (contentIndent === null) {
      return line.trim();
    }
    return line.slice(contentIndent);
  });

  return {
    value: style === "|" ? normalizedLines.join("\n") : foldBlockScalarLines(normalizedLines),
    nextIndex: index,
  };
}

function parseBlock(lines, startIndex, indent) {
  const firstIndex = nextMeaningfulIndex(lines, startIndex);
  if (firstIndex === -1) {
    return { value: {}, nextIndex: lines.length };
  }

  const firstLine = lines[firstIndex];
  const firstTrimmed = firstLine.trim();
  // A block sequence item is "- value" OR a bare "-" with the item's value nested on the
  // following lines. Detect both so a sequence whose first item uses the bare-dash form
  // is still parsed as an array rather than mis-parsed as a mapping.
  const isArray = firstTrimmed === "-" || firstTrimmed.startsWith("- ");
  const container = isArray ? [] : {};
  let index = firstIndex;

  while (index < lines.length) {
    const line = lines[index];
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      index += 1;
      continue;
    }

    const currentIndent = countIndent(line);
    if (currentIndent < indent) {
      break;
    }
    if (currentIndent > indent) {
      throw new Error(`Unexpected indentation at line ${index + 1}`);
    }

    if (isArray) {
      if (trimmed !== "-" && !trimmed.startsWith("- ")) {
        break;
      }
      const payload = trimmed === "-" ? "" : trimmed.slice(2).trim();
      const contentIndent = currentIndent + 2;
      if (!payload) {
        // "-" alone: the item's value is a nested block on the following lines, which must be
        // indented DEEPER than the dash. If the next meaningful line is at or below the dash
        // indent, this is an empty item (YAML null) — do not consume a lower-indent sibling
        // key (e.g. a `model:` after a bare `-` under `tools:`) as the item's value.
        index += 1;
        const childIndex = nextMeaningfulIndex(lines, index);
        if (childIndex === -1 || countIndent(lines[childIndex]) <= currentIndent) {
          container.push(null);
        } else {
          const nested = parseBlock(lines, index, countIndent(lines[childIndex]));
          container.push(nested.value);
          index = nested.nextIndex;
        }
      } else if (/^[A-Za-z0-9_-]+:(\s|$)/.test(payload)) {
        // "- key: value" begins a mapping item. Rewrite the dash to spaces so the
        // inline key and any deeper sibling keys (e.g. a nested `hooks:` block) parse
        // as one mapping at the content indent. This is a YAML block sequence of
        // mappings — the shape skill/agent `hooks:` frontmatter uses.
        lines[index] = " ".repeat(contentIndent) + payload;
        const nested = parseBlock(lines, index, contentIndent);
        container.push(nested.value);
        index = nested.nextIndex;
      } else {
        index += 1;
        container.push(parseScalar(payload));
      }
      continue;
    }

    const match = /^([A-Za-z0-9_-]+):(.*)$/.exec(trimmed);
    if (!match) {
      throw new Error(`Invalid key/value pair at line ${index + 1}`);
    }

    const [, key, remainder] = match;
    if (remainder.trim()) {
      const blockScalar = parseBlockScalarHeader(remainder);
      if (blockScalar) {
        const parsed = parseBlockScalar(lines, index + 1, indent, blockScalar.style);
        container[key] = parsed.value;
        index = parsed.nextIndex;
        continue;
      }

      container[key] = parseScalar(remainder.trim());
      index += 1;
      continue;
    }

    const nestedIndex = nextMeaningfulIndex(lines, index + 1);
    if (nestedIndex === -1 || countIndent(lines[nestedIndex]) <= indent) {
      container[key] = "";
      index += 1;
      continue;
    }

    // Recurse at the child's ACTUAL indent, not a hardcoded indent + 2. YAML permits any
    // consistent deeper indentation (a 4-space `tools:` list is as valid as a 2-space one),
    // and assuming exactly +2 made the parser throw on legal frontmatter.
    const nested = parseBlock(lines, index + 1, countIndent(lines[nestedIndex]));
    container[key] = nested.value;
    index = nested.nextIndex;
  }

  return { value: container, nextIndex: index };
}

export function extractFrontmatter(markdown) {
  const normalized = markdown.replace(/\r\n/g, "\n");
  const lines = normalized.split("\n");
  if (lines[0] !== "---") {
    return {
      frontmatterText: "",
      body: normalized,
      errors: ["No YAML frontmatter found."],
    };
  }

  const closingIndex = lines.indexOf("---", 1);
  if (closingIndex === -1) {
    return {
      frontmatterText: "",
      body: normalized,
      errors: ["Frontmatter opening delimiter is missing a closing delimiter."],
    };
  }

  return {
    frontmatterText: lines.slice(1, closingIndex).join("\n"),
    body: lines.slice(closingIndex + 1).join("\n"),
    errors: [],
  };
}

export function parseFrontmatter(markdown) {
  const extracted = extractFrontmatter(markdown);
  if (extracted.errors.length > 0) {
    return {
      data: null,
      body: extracted.body,
      errors: extracted.errors,
    };
  }

  try {
    const parsed = parseBlock(extracted.frontmatterText.split("\n"), 0, 0).value;
    return {
      data: parsed,
      body: extracted.body,
      errors: [],
    };
  } catch (error) {
    return {
      data: null,
      body: extracted.body,
      errors: [error instanceof Error ? error.message : String(error)],
    };
  }
}
