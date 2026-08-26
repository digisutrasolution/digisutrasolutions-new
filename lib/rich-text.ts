import "server-only";
import sanitizeHtml from "sanitize-html";

/**
 * Sanitising rich-text HTML before it is stored.
 *
 * Body copy used to be plain text rendered through React, which is XSS-safe by
 * construction — nothing was ever passed to dangerouslySetInnerHTML. Storing
 * editor HTML gives that up, so this is the boundary that replaces it.
 *
 * Sanitising happens on WRITE, not on render: the database then only ever holds
 * clean markup, every reader gets it for free, and there is no per-request cost
 * on the public site. The trade-off is that a rule change here does not
 * retroactively clean old rows — scripts/resanitize-bodies.mjs exists for that.
 *
 * The allowlist is deliberately the set the design system actually styles.
 * Anything else is dropped rather than escaped, so a paste from Word or a
 * competitor's site arrives as clean copy instead of foreign markup.
 */

/** Tags the blog and page renderers have styles for. */
const ALLOWED_TAGS = [
  "p", "br", "hr",
  "h2", "h3", "h4",
  "strong", "b", "em", "i", "u", "s", "mark",
  "a",
  "ul", "ol", "li",
  "blockquote",
  "code", "pre",
  "img",
  "figure", "figcaption",
  "table", "thead", "tbody", "tr", "th", "td",
];

/* h1 is absent on purpose: the page supplies the single h1 (the article title),
   and a second one in the body would fight it for the document outline. The
   editor only offers H2/H3/H4 for the same reason. */

export const RICH_TEXT_SANITIZE: sanitizeHtml.IOptions = {
  allowedTags: ALLOWED_TAGS,
  allowedAttributes: {
    a: ["href", "title", "target", "rel"],
    img: ["src", "alt", "title", "width", "height"],
    // Colspan/rowspan are the only table attributes worth keeping; anything
    // else (style, bgcolor, class) is pasted formatting we do not want.
    td: ["colspan", "rowspan"],
    th: ["colspan", "rowspan"],
  },
  // No protocol-relative URLs, and no javascript:/data: hrefs.
  allowedSchemes: ["http", "https", "mailto", "tel"],
  allowedSchemesByTag: { img: ["http", "https"] },
  allowProtocolRelative: false,
  // Drop the CONTENTS of these too, not just the tags — an unwrapped <script>
  // body would otherwise be left behind as visible text.
  nonTextTags: ["script", "style", "textarea", "option", "noscript", "iframe", "object", "embed"],
  disallowedTagsMode: "discard",
  transformTags: {
    /* Every external link opens in a new tab and carries rel="noopener
       noreferrer" — set here rather than in the renderer so the stored markup
       is already correct wherever it is read. */
    a: (tagName, attribs) => {
      const href = attribs.href ?? "";
      const external = /^https?:\/\//i.test(href);
      return {
        tagName: "a",
        attribs: external
          ? { ...attribs, target: "_blank", rel: "noopener noreferrer" }
          : { ...attribs },
      };
    },
    // The editor offers only H2–H4, but pasted content routinely carries h1
    // and h5/h6. Fold them into the nearest level we style rather than
    // discarding the text.
    h1: "h2",
    h5: "h4",
    h6: "h4",
  },
};

/** Clean a rich-text field. Always call this before persisting editor HTML. */
export function sanitizeRichText(html: string): string {
  if (!html) return "";
  const clean = sanitizeHtml(html, RICH_TEXT_SANITIZE);
  // TipTap emits "<p></p>" for an empty document; store "" so "is this field
  // filled in?" checks elsewhere stay honest.
  return clean.trim() === "<p></p>" ? "" : clean.trim();
}

/* The "is this already HTML?" test lives in lib/blog as isHtmlBody, not here:
   BlogBody and the editor both need it and both run in the browser, which this
   server-only module cannot reach. */

/**
 * Sanitise the rich-text fields inside a page's section array.
 *
 * Only `richText.body` is touched. Every other section field is plain text
 * rendered through React and must stay that way — running the sanitiser over
 * them would quietly eat a legitimate "a < b" in a heading, and would imply an
 * HTML contract those fields do not have.
 *
 * Called from PATCH /api/pages/[id], the one route where a human authors this
 * content. Clone, version-restore and the starter templates all copy markup
 * that was either already sanitised or written in code.
 */
export function sanitizeSections<T>(sections: T): T {
  if (!Array.isArray(sections)) return sections;
  return sections.map((s) => {
    if (
      s &&
      typeof s === "object" &&
      (s as { type?: unknown }).type === "richText" &&
      typeof (s as { body?: unknown }).body === "string"
    ) {
      return { ...s, body: sanitizeRichText((s as { body: string }).body) };
    }
    return s;
  }) as unknown as T;
}
