import { NextResponse } from "next/server";
import { z } from "zod";
import { audit } from "@/lib/audit";
import { requirePermission } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { clientIp } from "@/lib/rate-limit";

/**
 * The three proof entities share identical CRUD semantics, so the route
 * handlers are generated from one factory instead of six near-identical
 * files. Each entity supplies its zod schema and its Prisma delegate.
 */

export const TestimonialSchema = z.object({
  quote: z.string().trim().min(10).max(600),
  name: z.string().trim().min(2).max(90),
  role: z.string().trim().max(120).optional(),
  rating: z.coerce.number().int().min(1).max(5).optional(),
  visible: z.boolean().optional(),
});

export const ClientLogoSchema = z.object({
  name: z.string().trim().min(1).max(90),
  imageUrl: z.string().trim().max(600).nullable().optional(),
  websiteUrl: z.string().trim().max(600).nullable().optional(),
  visible: z.boolean().optional(),
});

export const CaseStudySchema = z.object({
  slug: z
    .string()
    .trim()
    .min(2)
    .max(90)
    .regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers and hyphens only."),
  client: z.string().trim().min(1).max(90),
  title: z.string().trim().min(3).max(140),
  industry: z.string().trim().max(90).optional(),
  category: z.enum(["Web", "Marketing", "AI"]).optional(),
  services: z.array(z.string().trim().min(1).max(60)).max(10).optional(),
  challenge: z.string().trim().max(600).optional(),
  solution: z.string().trim().max(600).optional(),
  result: z.string().trim().max(600).optional(),
  metrics: z
    .array(
      z.object({
        value: z.string().trim().min(1).max(20),
        label: z.string().trim().min(1).max(60),
      }),
    )
    .max(4)
    .optional(),
  timeframe: z.string().trim().max(40).optional(),
  image: z.string().trim().max(600).nullable().optional(),
  visible: z.boolean().optional(),
});

export type ProofKind = "testimonial" | "client" | "case";

const CONFIG = {
  testimonial: { schema: TestimonialSchema, label: "testimonial" },
  client: { schema: ClientLogoSchema, label: "client logo" },
  case: { schema: CaseStudySchema, label: "case study" },
} as const;

/* Prisma delegates have distinct generated types, so each operation
   switches rather than being held in a shared variable. */
function count(kind: ProofKind) {
  if (kind === "testimonial") return db.testimonial.count();
  if (kind === "client") return db.clientLogo.count();
  return db.caseStudy.count();
}

function lastOrder(kind: ProofKind) {
  const args = { orderBy: { order: "desc" as const }, select: { order: true } };
  if (kind === "testimonial") return db.testimonial.findFirst(args);
  if (kind === "client") return db.clientLogo.findFirst(args);
  return db.caseStudy.findFirst(args);
}

function list(kind: ProofKind) {
  const args = { orderBy: { order: "asc" as const } };
  if (kind === "testimonial") return db.testimonial.findMany(args);
  if (kind === "client") return db.clientLogo.findMany(args);
  return db.caseStudy.findMany(args);
}

function create(kind: ProofKind, data: Record<string, unknown>, order: number) {
  const payload = { ...data, order };
  if (kind === "testimonial") {
    return db.testimonial.create({
      data: payload as unknown as Parameters<typeof db.testimonial.create>[0]["data"],
    });
  }
  if (kind === "client") {
    return db.clientLogo.create({
      data: payload as unknown as Parameters<typeof db.clientLogo.create>[0]["data"],
    });
  }
  return db.caseStudy.create({
    data: payload as unknown as Parameters<typeof db.caseStudy.create>[0]["data"],
  });
}

function update(kind: ProofKind, id: string, data: Record<string, unknown>) {
  if (kind === "testimonial") {
    return db.testimonial.update({
      where: { id },
      data: data as unknown as Parameters<typeof db.testimonial.update>[0]["data"],
    });
  }
  if (kind === "client") {
    return db.clientLogo.update({
      where: { id },
      data: data as unknown as Parameters<typeof db.clientLogo.update>[0]["data"],
    });
  }
  return db.caseStudy.update({
    where: { id },
    data: data as unknown as Parameters<typeof db.caseStudy.update>[0]["data"],
  });
}

function remove(kind: ProofKind, id: string) {
  if (kind === "testimonial") return db.testimonial.delete({ where: { id } });
  if (kind === "client") return db.clientLogo.delete({ where: { id } });
  return db.caseStudy.delete({ where: { id } });
}

function getRow(kind: ProofKind, id: string) {
  if (kind === "testimonial") return db.testimonial.findUnique({ where: { id } });
  if (kind === "client") return db.clientLogo.findUnique({ where: { id } });
  return db.caseStudy.findUnique({ where: { id } });
}

/* A [bracket] left in the copy means the draft still holds a fill-in
   placeholder. Publishing it would show that literal text to visitors, so
   making a row visible is blocked until the placeholders are replaced.
   Client logos have no free-text placeholders, so they are exempt. */
const PLACEHOLDER = /\[[^\]]+\]/;
function unfilledPlaceholder(kind: ProofKind, row: Record<string, unknown>): boolean {
  if (kind === "client") return false;
  const fields =
    kind === "testimonial"
      ? ["quote", "name", "role"]
      : ["title", "client", "industry", "challenge", "solution", "result", "timeframe"];
  return fields.some((f) => typeof row[f] === "string" && PLACEHOLDER.test(row[f] as string));
}

const bad = (msg: string, status = 400) =>
  NextResponse.json({ ok: false, error: msg }, { status });

export function collectionHandlers(kind: ProofKind) {
  const { schema, label } = CONFIG[kind];

  return {
    async GET() {
      const { error } = await requirePermission("proof.manage");
      if (error) return error;
      return NextResponse.json({ ok: true, rows: await list(kind) });
    },

    async POST(req: Request) {
      const { user, error } = await requirePermission("proof.manage");
      if (error) return error;

      const parsed = schema.safeParse(await req.json().catch(() => null));
      if (!parsed.success) {
        return bad(parsed.error.issues[0]?.message ?? "Invalid input.");
      }
      const last = await lastOrder(kind);
      const row = await create(kind, parsed.data, (last?.order ?? -1) + 1);

      audit({
        userId: user.id,
        action: `proof.${kind}.create`,
        entity: kind,
        entityId: row.id,
        meta: { label },
        ip: clientIp(req),
      });

      return NextResponse.json({ ok: true, row }, { status: 201 });
    },
  };
}

export function itemHandlers(kind: ProofKind) {
  const { schema } = CONFIG[kind];
  const PatchSchema = schema.partial();

  return {
    async PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
      const { user, error } = await requirePermission("proof.manage");
      if (error) return error;
      const { id } = await ctx.params;

      const parsed = PatchSchema.safeParse(await req.json().catch(() => null));
      if (!parsed.success) {
        return bad(parsed.error.issues[0]?.message ?? "Invalid input.");
      }

      // Guard: never let a draft go visible with [bracket] placeholders
      // still in it. Merge the patch onto the stored row and check.
      if (parsed.data.visible === true) {
        const existing = await getRow(kind, id);
        if (!existing) return bad("Not found.", 404);
        const merged = { ...existing, ...parsed.data } as Record<string, unknown>;
        if (unfilledPlaceholder(kind, merged)) {
          return bad(
            "Fill in the [bracketed] placeholders before making this visible.",
          );
        }
      }

      const row = await update(kind, id, parsed.data).catch(() => null);
      if (!row) return bad("Not found.", 404);

      audit({
        userId: user.id,
        action: `proof.${kind}.update`,
        entity: kind,
        entityId: id,
        meta: { fields: Object.keys(parsed.data) },
        ip: clientIp(req),
      });

      return NextResponse.json({ ok: true, row });
    },

    async DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
      const { user, error } = await requirePermission("proof.manage");
      if (error) return error;
      const { id } = await ctx.params;

      const gone = await remove(kind, id).catch(() => null);
      if (!gone) return bad("Not found.", 404);

      audit({
        userId: user.id,
        action: `proof.${kind}.delete`,
        entity: kind,
        entityId: id,
        ip: clientIp(req),
      });

      return NextResponse.json({ ok: true });
    },
  };
}

export { count as proofCount };
