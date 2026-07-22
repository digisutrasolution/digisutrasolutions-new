/**
 * Safe payload for a JSON-LD <script> tag.
 *
 * JSON.stringify does not escape "<", so any interpolated value containing
 * "</script>" closes the tag early and everything after it is parsed as
 * HTML — a stored-XSS vector, since page titles, FAQ answers, service
 * names and case-study fields all come from the CMS. Escaping the three
 * HTML-significant characters as \u sequences keeps the JSON byte-for-byte
 * valid to parsers while making tag breakout impossible.
 */
export function jsonLdScript(data: unknown): { __html: string } {
  return {
    __html: JSON.stringify(data)
      .replace(/</g, "\\u003c")
      .replace(/>/g, "\\u003e")
      .replace(/&/g, "\\u0026"),
  };
}
