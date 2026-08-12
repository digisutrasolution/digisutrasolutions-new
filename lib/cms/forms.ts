import { z } from "zod";

export const FIELD_TYPES = [
  "text",
  "email",
  "tel",
  "textarea",
  "select",
  /* Searchable, pick-many version of `select`. Added as its own type rather
     than a flag on `select`, because it changes the stored value from one
     option to a comma-joined list — flipping that under existing forms would
     silently change what their past submissions mean. */
  "multiselect",
  "checkbox",
  "number",
  "date",
] as const;

export const FormFieldSchema = z.object({
  key: z
    .string()
    .trim()
    .min(1)
    .max(40)
    .regex(/^[a-z][a-z0-9_]*$/, "Field keys are lowercase snake_case."),
  label: z.string().trim().min(1).max(100),
  type: z.enum(FIELD_TYPES),
  required: z.boolean().default(false),
  options: z.array(z.string().trim().min(1).max(100)).max(20).default([]),
});

export const FormFieldsSchema = z.array(FormFieldSchema).min(1).max(20);

export type FormField = z.infer<typeof FormFieldSchema>;

/* Where a form's submissions go. "submission" stores only; "lead" also
   creates a Lead so admin-built forms feed the leads pipeline. */
export const FORM_DESTINATIONS = ["submission", "lead"] as const;
export type FormDestination = (typeof FORM_DESTINATIONS)[number];
export const FormDestinationSchema = z
  .enum(FORM_DESTINATIONS)
  .default("submission");

export function parseFormFields(value: unknown): FormField[] {
  const parsed = FormFieldsSchema.safeParse(value);
  return parsed.success ? parsed.data : [];
}

/** Validate a public submission against the form definition. */
export function validateSubmission(
  fields: FormField[],
  data: Record<string, unknown>,
): { ok: true; clean: Record<string, string> } | { ok: false; error: string } {
  const clean: Record<string, string> = {};
  for (const field of fields) {
    const raw = data[field.key];
    const value = typeof raw === "string" ? raw.trim().slice(0, 5000) : "";
    if (field.required && !value) {
      return { ok: false, error: `${field.label} is required.` };
    }
    if (value && field.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return { ok: false, error: `${field.label} must be a valid email.` };
    }
    if (value && field.type === "select" && !field.options.includes(value)) {
      return { ok: false, error: `${field.label} has an invalid option.` };
    }
    if (value && field.type === "number" && !/^-?\d+(\.\d+)?$/.test(value)) {
      return { ok: false, error: `${field.label} must be a number.` };
    }
    if (value && field.type === "date" && Number.isNaN(Date.parse(value))) {
      return { ok: false, error: `${field.label} must be a valid date.` };
    }
    clean[field.key] = value;
  }
  return { ok: true, clean };
}

/* Best-effort map of a generic submission onto Lead fields, by matching field
   keys against common aliases. Used when a form's destination is "lead" so an
   admin-built form can create a real Lead without a fixed field contract. */
export function leadFromSubmission(clean: Record<string, string>): {
  name: string;
  whatsapp: string;
  email: string;
  message: string;
  budget: string;
  timeline: string;
  heardFrom: string;
  services: string[];
} {
  const find = (aliases: string[]): string => {
    for (const key of Object.keys(clean)) {
      const norm = key.replace(/_/g, "");
      if (clean[key] && aliases.some((a) => norm.includes(a))) return clean[key];
    }
    return "";
  };
  return {
    name: find(["name", "fullname"]) || "Website form enquiry",
    whatsapp: find(["whatsapp", "phone", "mobile", "tel", "contactnumber", "number"]),
    email: find(["email"]),
    message: find(["message", "comment", "detail", "enquiry", "requirement", "query", "note"]),
    budget: find(["budget"]),
    timeline: find(["timeline", "deadline"]),
    heardFrom: find(["heardfrom", "howdidyou", "referral", "source"]),
    /* Split back into the array Lead.services expects. A multiselect stores a
       comma-joined list, and a plain select stores one value — both land here
       correctly, because splitting a single value yields a one-item array.
       Until now nothing mapped this at all, so what someone picked stayed
       buried in the raw submission and never reached the lead record. */
    services: find(["service", "interested", "looking"])
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  };
}
