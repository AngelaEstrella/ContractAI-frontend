import type { ReactNode } from "react";

type MarkdownRendererProps = {
  content: string;
};

// ---------------------------------------------------------------------------
// Inline parser – bold, italic, inline-code, 'highlighted' spans
// ---------------------------------------------------------------------------
function parseInline(text: string): ReactNode[] {
  const elements: ReactNode[] = [];
  const regex = /(\*\*(.+?)\*\*)|(\*(.+?)\*)|(`(.+?)`)|('(.+?)')/g;
  let lastIndex = 0;
  let key = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      elements.push(text.slice(lastIndex, match.index));
    }
    if (match[1]) {
      elements.push(<strong key={key++} className="font-semibold">{match[2]}</strong>);
    } else if (match[3]) {
      elements.push(<em key={key++} className="italic">{match[4]}</em>);
    } else if (match[5]) {
      elements.push(
        <code key={key++} className="rounded bg-blue-50 px-1.5 py-0.5 font-mono text-sm text-blue-700">
          {match[6]}
        </code>,
      );
    } else if (match[7]) {
      elements.push(<span key={key++} className="font-semibold text-[#1152D4]">{match[8]}</span>);
    }
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) elements.push(text.slice(lastIndex));
  return elements.length > 0 ? elements : [text];
}

// ---------------------------------------------------------------------------
// Pipe-list helpers
// ---------------------------------------------------------------------------

/**
 * Parsed representation of a single pipe-list item.
 * e.g. "Google Drive | Contratos: 8 | Valor total: 411600 USD"
 *   → { name: "Google Drive", fields: { "Contratos": "8", "Valor total": "411600 USD" } }
 */
type PipeRow = { name: string; fields: Record<string, string> };

function parsePipeItem(item: string): PipeRow {
  const parts = item.split("|").map((s) => s.trim());
  const name = parts[0];
  const fields: Record<string, string> = {};

  for (const part of parts.slice(1)) {
    const colonIdx = part.indexOf(":");
    if (colonIdx > 0) {
      const key = part.slice(0, colonIdx).trim();
      const value = part.slice(colonIdx + 1).trim();
      fields[key] = value;
    } else if (part) {
      // No colon — use the whole segment as both key and value
      fields[part] = part;
    }
  }

  return { name, fields };
}

/** Returns true when ≥ 80 % of list items contain at least one pipe. */
function isPipeList(items: string[]): boolean {
  if (items.length === 0) return false;
  const piped = items.filter((item) => item.includes("|")).length;
  return piped / items.length >= 0.8;
}

/**
 * Renders a field value with special styling for known semantic patterns:
 * - "sí" / "si" / "no" for boolean flags (Vigente hoy)
 * - Document states (ACTIVE, PENDING, EXPIRED)
 * - Amounts with currencies
 */
function renderFieldValue(key: string, value: string): ReactNode {
  const keyLower = key.toLowerCase();
  const valueLower = value.toLowerCase().trim();

  // Boolean: "Vigente hoy"
  if (keyLower.includes("vigente")) {
    const isYes = ["sí", "si", "yes", "true", "1"].includes(valueLower);
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
          isYes
            ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
            : "bg-red-50 text-red-600 ring-1 ring-red-200"
        }`}
      >
        <span className={`h-1.5 w-1.5 rounded-full ${isYes ? "bg-emerald-500" : "bg-red-400"}`} />
        {value}
      </span>
    );
  }

  // Document state
  if (keyLower === "estado") {
    const stateMap: Record<string, string> = {
      active: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
      activo: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
      pending: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
      pendiente: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
      expired: "bg-slate-100 text-slate-500 ring-1 ring-slate-200",
      expirado: "bg-slate-100 text-slate-500 ring-1 ring-slate-200",
      vencido: "bg-slate-100 text-slate-500 ring-1 ring-slate-200",
    };
    const cls = stateMap[valueLower] ?? "bg-slate-100 text-slate-600 ring-1 ring-slate-200";
    return (
      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>
        {value}
      </span>
    );
  }

  // Monetary value – highlight currency symbol / code
  const currencyMatch = value.match(/^([\d.,\s]+)\s*(USD|PEN|EUR|S\/\.?|\$|€)$/i);
  if (currencyMatch || keyLower.includes("valor") || keyLower.includes("monto")) {
    return <span className="font-medium text-slate-800">{value}</span>;
  }

  return <span>{value}</span>;
}

/** Renders a list of pipe-structured items as a responsive table. */
function renderPipeTable(items: string[], blockIndex: number): ReactNode {
  const rows = items.map(parsePipeItem);

  // Collect all column keys in the order they first appear
  const seen = new Set<string>();
  const allKeys: string[] = [];
  for (const row of rows) {
    for (const key of Object.keys(row.fields)) {
      if (!seen.has(key)) {
        seen.add(key);
        allKeys.push(key);
      }
    }
  }

  // If we couldn't extract any keys, fall back to normal bullet rendering
  if (allKeys.length === 0) return null;

  return (
    <div key={blockIndex} className="my-3 overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-gradient-to-r from-slate-50 to-blue-50/30">
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              #
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
              Nombre
            </th>
            {allKeys.map((key) => (
              <th
                key={key}
                className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600 whitespace-nowrap"
              >
                {key}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row, ri) => (
            <tr
              key={ri}
              className="transition-colors duration-100 hover:bg-blue-50/40"
            >
              <td className="px-4 py-3 text-xs text-slate-400 font-medium">{ri + 1}</td>
              <td className="px-4 py-3 font-medium text-slate-800 whitespace-nowrap">
                {parseInline(row.name)}
              </td>
              {allKeys.map((key) => (
                <td key={key} className="px-4 py-3 text-slate-600 whitespace-nowrap">
                  {row.fields[key] !== undefined
                    ? renderFieldValue(key, row.fields[key])
                    : <span className="text-slate-300">—</span>}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Markdown table parser (standard markdown: header + separator + rows)
// ---------------------------------------------------------------------------
function parseMarkdownTable(lines: string[]): ReactNode | null {
  if (lines.length < 2) return null;

  const headerCells = lines[0].split("|").map((c) => c.trim()).filter(Boolean);
  const isSeparator = /^[\s|:-]+$/.test(lines[1]);
  if (!isSeparator || headerCells.length === 0) return null;

  const rows = lines.slice(2).map((row) => row.split("|").map((c) => c.trim()).filter(Boolean));

  return (
    <div className="my-3 overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-gradient-to-r from-slate-50 to-blue-50/30">
            {headerCells.map((cell, i) => (
              <th key={i} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                {parseInline(cell)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row, ri) => (
            <tr key={ri} className="transition-colors duration-100 hover:bg-blue-50/40">
              {headerCells.map((_, ci) => (
                <td key={ci} className="px-4 py-3 text-slate-600">
                  {parseInline(row[ci] ?? "")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Token usage helpers
// ---------------------------------------------------------------------------
const TOKEN_REGEX = /📊\s*Tokens de entrada:\s*(\d+)\s*\|\s*Tokens de salida:\s*(\d+)/;

function formatTokenCount(n: number): string {
  if (n >= 1000) {
    const k = n / 1000;
    return `${Number.isInteger(k) ? k : k.toFixed(1)}k`;
  }
  return String(n);
}

// ---------------------------------------------------------------------------
// Block types
// ---------------------------------------------------------------------------
type Block =
  | { type: "heading"; level: 1 | 2 | 3; text: string }
  | { type: "paragraph"; lines: string[] }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] }
  | { type: "code"; lang: string; lines: string[] }
  | { type: "blockquote"; lines: string[] }
  | { type: "table"; lines: string[] }
  | { type: "tokenUsage"; input: number; output: number }
  | { type: "hr" };

// ---------------------------------------------------------------------------
// Block parser
// ---------------------------------------------------------------------------
function parseBlocks(rawLines: string[]): Block[] {
  const blocks: Block[] = [];
  let i = 0;

  while (i < rawLines.length) {
    const line = rawLines[i];

    // Fenced code block
    if (/^```/.test(line)) {
      const lang = line.slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < rawLines.length && !/^```/.test(rawLines[i])) {
        codeLines.push(rawLines[i]);
        i++;
      }
      i++;
      blocks.push({ type: "code", lang, lines: codeLines });
      continue;
    }

    // Horizontal rule — check if the next non-empty line is a token usage line,
    // in which case we skip the hr and let the token line be parsed as tokenUsage.
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(line.trim())) {
      const nextLine = rawLines[i + 1]?.trim() ?? "";
      if (TOKEN_REGEX.test(nextLine)) {
        // Skip the hr; the token line will be handled in the next iteration
        i++;
        continue;
      }
      blocks.push({ type: "hr" });
      i++;
      continue;
    }

    // Token usage line (📊 Tokens de entrada: N | Tokens de salida: N)
    {
      const tokenMatch = line.match(TOKEN_REGEX);
      if (tokenMatch) {
        blocks.push({ type: "tokenUsage", input: parseInt(tokenMatch[1], 10), output: parseInt(tokenMatch[2], 10) });
        i++;
        continue;
      }
    }

    // Heading
    const headingMatch = line.match(/^(#{1,3})\s+(.+)/);
    if (headingMatch) {
      const level = Math.min(headingMatch[1].length, 3) as 1 | 2 | 3;
      blocks.push({ type: "heading", level, text: headingMatch[2] });
      i++;
      continue;
    }

    // Blockquote
    if (/^>\s?/.test(line)) {
      const quoteLines: string[] = [];
      while (i < rawLines.length && /^>\s?/.test(rawLines[i])) {
        quoteLines.push(rawLines[i].replace(/^>\s?/, ""));
        i++;
      }
      blocks.push({ type: "blockquote", lines: quoteLines });
      continue;
    }

    // Unordered list
    if (/^[-*+]\s/.test(line)) {
      const items: string[] = [];
      while (i < rawLines.length && /^[-*+]\s/.test(rawLines[i])) {
        items.push(rawLines[i].replace(/^[-*+]\s/, ""));
        i++;
      }
      blocks.push({ type: "ul", items });
      continue;
    }

    // Ordered list
    if (/^\d+\.\s/.test(line)) {
      const items: string[] = [];
      while (i < rawLines.length && /^\d+\.\s/.test(rawLines[i])) {
        items.push(rawLines[i].replace(/^\d+\.\s/, ""));
        i++;
      }
      blocks.push({ type: "ol", items });
      continue;
    }

    // Standard markdown table (header | separator | rows)
    if (line.includes("|") && rawLines[i + 1]?.match(/^[\s|:-]+$/)) {
      const tableLines: string[] = [];
      while (i < rawLines.length && (rawLines[i].includes("|") || /^[\s|:-]+$/.test(rawLines[i]))) {
        tableLines.push(rawLines[i]);
        i++;
      }
      blocks.push({ type: "table", lines: tableLines });
      continue;
    }

    // Empty line
    if (line.trim() === "") {
      i++;
      continue;
    }

    // Paragraph
    const paraLines: string[] = [];
    while (
      i < rawLines.length &&
      rawLines[i].trim() !== "" &&
      !/^(#{1,3}\s|```|>\s?|[-*+]\s|\d+\.\s)/.test(rawLines[i]) &&
      !/^(-{3,}|\*{3,}|_{3,})$/.test(rawLines[i].trim())
    ) {
      paraLines.push(rawLines[i]);
      i++;
    }
    if (paraLines.length > 0) blocks.push({ type: "paragraph", lines: paraLines });
  }

  return blocks;
}

// ---------------------------------------------------------------------------
// Block renderer
// ---------------------------------------------------------------------------
function renderBlock(block: Block, index: number): ReactNode {
  switch (block.type) {
    case "heading": {
      const classMap: Record<1 | 2 | 3, string> = {
        1: "mt-4 mb-2 text-lg font-bold text-slate-800",
        2: "mt-3 mb-2 text-base font-bold text-slate-800",
        3: "mt-3 mb-1 text-sm font-bold text-slate-700 uppercase tracking-wide",
      };
      return (
        <div key={index} className={classMap[block.level]}>
          {parseInline(block.text)}
        </div>
      );
    }

    case "paragraph":
      return (
        <p key={index} className="mb-2 leading-relaxed text-slate-700">
          {block.lines.map((line, li) => (
            <span key={li}>
              {parseInline(line)}
              {li < block.lines.length - 1 && <br />}
            </span>
          ))}
        </p>
      );

    case "ul": {
      // Detect bot's pipe-structured data and render as table
      if (isPipeList(block.items)) {
        const table = renderPipeTable(block.items, index);
        if (table) return table;
      }

      return (
        <ul key={index} className="mb-2 ml-1 space-y-1.5 list-none">
          {block.items.map((item, ii) => (
            <li key={ii} className="flex items-start gap-2 text-slate-700">
              <span className="mt-[7px] h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-400" />
              <span className="leading-relaxed">{parseInline(item)}</span>
            </li>
          ))}
        </ul>
      );
    }

    case "ol":
      return (
        <ol key={index} className="mb-2 ml-1 space-y-1.5 list-none">
          {block.items.map((item, ii) => (
            <li key={ii} className="flex items-start gap-2 text-slate-700">
              <span className="mt-0.5 min-w-[1.25rem] flex-shrink-0 text-xs font-bold text-blue-500">
                {ii + 1}.
              </span>
              <span className="leading-relaxed">{parseInline(item)}</span>
            </li>
          ))}
        </ol>
      );

    case "code":
      return (
        <div key={index} className="mb-3 overflow-hidden rounded-xl border border-slate-200 shadow-sm">
          {block.lang && (
            <div className="border-b border-slate-200 bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">
              {block.lang}
            </div>
          )}
          <pre className="overflow-x-auto bg-slate-50 p-4 text-sm leading-relaxed text-slate-800">
            <code>{block.lines.join("\n")}</code>
          </pre>
        </div>
      );

    case "blockquote":
      return (
        <blockquote
          key={index}
          className="mb-2 rounded-r-lg border-l-4 border-blue-300 bg-blue-50/50 py-2.5 pl-4 pr-3 text-slate-600 italic"
        >
          {block.lines.map((line, li) => (
            <span key={li}>
              {parseInline(line)}
              {li < block.lines.length - 1 && <br />}
            </span>
          ))}
        </blockquote>
      );

    case "table":
      return <div key={index} className="my-3">{parseMarkdownTable(block.lines)}</div>;

    case "tokenUsage":
      return (
        <div
          key={index}
          className="mt-3 flex items-center gap-3 border-t border-slate-100 pt-2"
        >
          <span className="flex items-center gap-0.5 text-[11px] text-slate-400">
            <span className="text-blue-400">↓</span>
            <span className="ml-0.5">{formatTokenCount(block.input)}</span>
          </span>
          <span className="flex items-center gap-0.5 text-[11px] text-slate-400">
            <span className="text-emerald-500">↑</span>
            <span className="ml-0.5">{formatTokenCount(block.output)}</span>
          </span>
        </div>
      );

    case "hr":
      return <hr key={index} className="my-3 border-slate-200" />;

    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  const lines = content.split("\n");
  const blocks = parseBlocks(lines);
  return <div className="min-w-0">{blocks.map((block, i) => renderBlock(block, i))}</div>;
}
