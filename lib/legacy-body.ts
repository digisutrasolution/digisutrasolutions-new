/**
 * Convert the legacy body format to editor HTML.
 *
 * The old format was blank-line-separated blocks with `## `/`### ` headings,
 * `**bold**`, `*italic*`, `[text](url)`, `- ` bullets and `![alt](url)` images.
 * These rules mirror components/BlogBody.tsx exactly, so a converted body
 * renders identically to how it rendered before.
 *
 * Used in two places that must agree:
 *   · the editor, converting on load — without it TipTap would treat "## Foo"
 *     as literal text, flatten the structure, and save the damage;
 *   · scripts/migrate-bodies-to-html.mjs, converting in bulk.
 *
 * One implementation, because two would drift and the drift would only show up
 * as quietly corrupted articles.
 *
 * Client-safe: no server-only imports, since the editor runs in the browser.
 */

const IMAGE_LINE = /^!\[([^\]]*)\]\(([^)]+)\)$/;
const INLINE = /(\*\*[^*]+\*\*|\*[^*\n]+\*|\[[^\]]+\]\([^)]+\))/g;

/** The source is plain text, so anything that looks like markup is literal. */
function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function inline(text: string): string {
  let out = "";
  let last = 0;
  let m: RegExpExecArray | null;
  INLINE.lastIndex = 0;
  while ((m = INLINE.exec(text)) !== null) {
    if (m.index > last) out += esc(text.slice(last, m.index));
    const tok = m[0];
    if (tok.startsWith("**")) {
      out += `<strong>${esc(tok.slice(2, -2))}</strong>`;
    } else if (tok.startsWith("*")) {
      out += `<em>${esc(tok.slice(1, -1))}</em>`;
    } else {
      const lm = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(tok);
      if (lm) {
        const [, label, href] = lm;
        const external = /^https?:\/\//.test(href);
        const rel = external ? ' target="_blank" rel="noopener noreferrer"' : "";
        out += `<a href="${esc(href)}"${rel}>${esc(label)}</a>`;
      } else {
        out += esc(tok);
      }
    }
    last = m.index + tok.length;
  }
  if (last < text.length) out += esc(text.slice(last));
  return out;
}

export function legacyToHtml(body: string): string {
  const blocks = body
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .filter(Boolean);

  const html: string[] = [];

  for (const block of blocks) {
    if (block.startsWith("### ")) {
      html.push(`<h3>${inline(block.slice(4))}</h3>`);
      continue;
    }
    if (block.startsWith("## ")) {
      // BlogBody rendered h2 text WITHOUT inline parsing; keep that, so a
      // heading containing an asterisk converts to the same characters.
      html.push(`<h2>${esc(block.slice(3))}</h2>`);
      continue;
    }

    const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);

    if (lines.length > 0 && lines.every((l) => IMAGE_LINE.test(l))) {
      for (const l of lines) {
        const [, alt, src] = IMAGE_LINE.exec(l)!;
        html.push(
          alt
            ? `<figure><img src="${esc(src)}" alt="${esc(alt)}"><figcaption>${esc(alt)}</figcaption></figure>`
            : `<img src="${esc(src)}" alt="">`,
        );
      }
      continue;
    }

    if (lines.length > 0 && lines.every((l) => l.startsWith("- "))) {
      html.push(`<ul>${lines.map((l) => `<li>${inline(l.slice(2))}</li>`).join("")}</ul>`);
      continue;
    }

    /* A single newline inside a paragraph was a soft break in the old format —
       BlogBody passed the block through as one <p> with the newline intact,
       which the browser collapsed to a space. <br> preserves the author's
       intent better and round-trips through the editor. */
    html.push(`<p>${inline(block).replace(/\n/g, "<br>")}</p>`);
  }

  return html.join("\n");
}
