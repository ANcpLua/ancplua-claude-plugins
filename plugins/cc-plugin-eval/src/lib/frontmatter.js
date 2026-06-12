// Ported from openai/plugins plugin-eval (MIT). See ../../THIRD_PARTY_NOTICES.md.

function countIndent(line) {
  return line.length - line.trimStart().length;
}

// Index of the unescaped closing quote in `text`, scanning from `startIndex`,
// or -1 when the quoted scalar continues on the next line. In double-quoted
// scalars a backslash escapes the following character; in single-quoted
// scalars `''` is the only escape.
function findClosingQuote(text, quote, startIndex) {
  for (let index = startIndex; index < text.length; index += 1) {
    const char = text[index];
    if (quote === "\"" && char === "\\") {
      index += 1;
      continue;
    }
    if (char === quote) {
      if (quote === "'" && text[index + 1] === "'") {
        index += 1;
        continue;
      }
      return index;
    }
  }
  return -1;
}

// YAML 1.2 double-quoted escape processing (ns-esc-char subset that occurs in
// real frontmatter: \\ \" \/ \n \t \r \0, the escaped space, and \uXXXX).
function unescapeDoubleQuoted(content) {
  let result = "";
  for (let index = 0; index < content.length; index += 1) {
    const char = content[index];
    if (char !== "\\") {
      result += char;
      continue;
    }
    const next = content[index + 1];
    index += 1;
    switch (next) {
      case "n":
        result += "\n";
        break;
      case "t":
        result += "\t";
        break;
      case "r":
        result += "\r";
        break;
      case "0":
        result += "\0";
        break;
      case "\\":
      case "\"":
      case "/":
      case " ":
        result += next;
        break;
      case "u": {
        const hex = content.slice(index + 1, index + 5);
        if (/^[0-9a-fA-F]{4}$/.test(hex)) {
          result += String.fromCharCode(parseInt(hex, 16));
          index += 4;
        } else {
          result += "u";
        }
        break;
      }
      default:
        result += next === undefined ? "\\" : next;
    }
  }
  return result;
}

function endsWithEscapedBreak(content) {
  let backslashes = 0;
  for (let index = content.length - 1; index >= 0 && content[index] === "\\"; index -= 1) {
    backslashes += 1;
  }
  return backslashes % 2 === 1;
}

// A quoted scalar whose closing quote is not on the key's line spans multiple
// physical lines (YAML flow folding). Continuation lines are stripped of their
// indentation; an unescaped line break folds to a space, a backslash-escaped
// line break (double-quoted only) joins directly, and an empty line folds to a
// newline.
function parseMultilineQuoted(lines, startIndex, firstRemainder) {
  const quote = firstRemainder[0];
  let content = firstRemainder.slice(1);
  let index = startIndex;

  while (true) {
    if (quote === "\"" && endsWithEscapedBreak(content)) {
      content = content.slice(0, -1);
    } else if (index < lines.length && lines[index].trim() === "") {
      content += "\n";
    } else {
      content += " ";
    }

    if (index >= lines.length) {
      throw new Error("Unterminated quoted scalar in frontmatter");
    }

    const line = lines[index].trim();
    index += 1;
    if (line === "" ) {
      continue;
    }

    const closing = findClosingQuote(line, quote, 0);
    if (closing === -1) {
      content += line;
      continue;
    }

    content += line.slice(0, closing);
    break;
  }

  const value =
    quote === "\"" ? unescapeDoubleQuoted(content) : content.replace(/''/g, "'");
  return { value, nextIndex: index };
}

function parseScalar(rawValue) {
  const value = rawValue.trim();
  if (!value) {
    return "";
  }
  if (value.startsWith("\"") && findClosingQuote(value, "\"", 1) === value.length - 1) {
    return unescapeDoubleQuoted(value.slice(1, -1));
  }
  if (value.startsWith("'") && findClosingQuote(value, "'", 1) === value.length - 1) {
    return value.slice(1, -1).replace(/''/g, "'");
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

      const trimmedValue = remainder.trim();
      if (
        (trimmedValue.startsWith("\"") || trimmedValue.startsWith("'")) &&
        findClosingQuote(trimmedValue, trimmedValue[0], 1) === -1
      ) {
        // Quoted scalar that continues on the following physical lines.
        const parsed = parseMultilineQuoted(lines, index + 1, trimmedValue);
        container[key] = parsed.value;
        index = parsed.nextIndex;
        continue;
      }

      container[key] = parseScalar(trimmedValue);
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
