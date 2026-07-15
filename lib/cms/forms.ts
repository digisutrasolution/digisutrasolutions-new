import { z } from "zod";

export const FormFieldSchema = z.object({
  key: z
    .string()
    .trim()
    .min(1)
    .max(40)
    .regex(/^[a-z][a-z0-9_]*$/, "Field keys are lowercase snake_case."),
  label: z.string().trim().min(1).max(100),
  type: z.enum(["text", "email", "tel", "textarea", "select"]),
  required: z.boolean().default(false),
  options: z.array(z.string().trim().min(1).max(100)).max(20).default([]),
});

export const FormFieldsSchema = z.array(FormFieldSchema).min(1).max(20);

export type FormField = z.infer<typeof FormFieldSchema>;

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
    clean[field.key] = value;
  }
  return { ok: true, clean };
}
