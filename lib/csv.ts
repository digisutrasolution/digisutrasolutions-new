/* Minimal, dependency-free CSV parser (client-safe). Handles quoted fields,
   escaped quotes ("") and CRLF/LF line endings. Good enough for lead imports;
   not a full RFC-4180 streaming parser. */

export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let cur: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      cur.push(field); field = "";
    } else if (c === "\n") {
      cur.push(field); rows.push(cur); cur = []; field = "";
    } else if (c !== "\r") {
      field += c;
    }
  }
  if (field.length || cur.length) { cur.push(field); rows.push(cur); }
  // Drop fully-empty trailing rows.
  return rows.filter((r) => r.some((f) => f.trim() !== ""));
}

/** The lead fields an import column can map to. */
export const IMPORT_FIELDS = [
  { key: "name", label: "Name", required: true },
  { key: "whatsapp", label: "WhatsApp / phone", required: true },
  { key: "email", label: "Email" },
  { key: "company", label: "Company" },
  { key: "city", label: "City" },
  { key: "country", label: "Country" },
  { key: "budget", label: "Budget" },
  { key: "services", label: "Services" },
  { key: "message", label: "Message / notes" },
] as const;

export type ImportField = (typeof IMPORT_FIELDS)[number]["key"];

/** Best-effort auto-map a CSV header to a lead field. */
export function guessField(header: string): ImportField | "" {
  const h = header.trim().toLowerCase().replace(/[^a-z]/g, "");
  const map: Record<string, ImportField> = {
    name: "name", fullname: "name", leadname: "name", contactname: "name",
    whatsapp: "whatsapp", phone: "whatsapp", mobile: "whatsapp", number: "whatsapp", contact: "whatsapp",
    email: "email", emailaddress: "email", mail: "email",
    company: "company", organisation: "company", organization: "company", business: "company",
    city: "city", town: "city",
    country: "country",
    budget: "budget",
    services: "services", service: "services", interestedin: "services",
    message: "message", notes: "message", note: "message", remark: "message", remarks: "message",
  };
  return map[h] ?? "";
}
