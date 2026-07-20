import type { ParsedStream } from './types';

/**
 * Split a (possibly partial) assistant response into a human-readable plan
 * and the fenced HTML code block.
 *
 * The model is instructed to reply as:
 *   <plan text>
 *   ```html
 *   <html document>
 *   ```
 *
 * This parser is tolerant of streaming: it works on partial input and also
 * accepts a plain ``` fence (without the language tag).
 */
export function parseStream(raw: string): ParsedStream {
  const fenceMatch = raw.match(/```(?:html|HTML)?[^\n]*\n?/);

  if (!fenceMatch || fenceMatch.index === undefined) {
    return { plan: raw.trimStart(), code: '', codeStarted: false };
  }

  const plan = raw.slice(0, fenceMatch.index).trim();
  const afterFence = raw.slice(fenceMatch.index + fenceMatch[0].length);

  // Drop the closing fence if it has already streamed in.
  const closingIdx = afterFence.lastIndexOf('```');
  const code = closingIdx >= 0 ? afterFence.slice(0, closingIdx) : afterFence;

  return { plan, code: code.replace(/\s+$/, ''), codeStarted: true };
}

/** Derive a short project title from the user's prompt. */
export function deriveTitle(prompt: string): string {
  const clean = prompt.replace(/\s+/g, ' ').trim();
  if (clean.length <= 18) return clean;
  return clean.slice(0, 18) + '…';
}

/**
 * Make sure whatever the model produced is a full HTML document that an
 * iframe can render. If the model returned only a fragment, wrap it.
 */
export function normalizeHtml(code: string): string {
  const trimmed = code.trim();
  if (!trimmed) return '';
  if (/<html[\s>]/i.test(trimmed) || /<!doctype/i.test(trimmed)) {
    return trimmed;
  }
  return `<!doctype html>
<html lang="zh-CN">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body>
${trimmed}
</body>
</html>`;
}
