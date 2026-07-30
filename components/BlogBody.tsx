import type { ReactNode } from "react";
import Link from "next/link";
import { withBase } from "@/lib/base-path";
import { slugifyHeading } from "@/lib/blog";

/* Blog body renderer — shared by the public article page and the admin
   editor's live preview so what you type is what you get. Backward-compatible:
   the older format (blank-line paragraphs + ##/### headings) renders exactly
   as before; the editor toolbar can now also emit **bold**, *italic*, links,
   "- " bullet lists and ![alt](url) images, which this understands too. */

const INLINE = /(\*\*[^*]+\*\*|\*[^*\n]+\*|\[[^\]]+\]\([^)]+\))/g;
const IMAGE_LINE = /^!\[([^\]]*)\]\(([^)]+)\)$/;

function renderInline(text: string): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  let k = 0;
  let m: RegExpExecArray | null;
  INLINE.lastIndex = 0;
  while ((m = INLINE.exec(text)) !== null) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const tok = m[0];
    if (tok.startsWith("**")) {
      out.push(<strong key={k++}>{tok.slice(2, -2)}</strong>);
    } else if (tok.startsWith("*")) {
      out.push(<em key={k++}>{tok.slice(1, -1)}</em>);
    } else {
      const lm = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(tok);
      if (lm) {
        const [, label, href] = lm;
        const external = /^https?:\/\//.test(href);
        out.push(
          external ? (
            <a key={k++} href={href} target="_blank" rel="noopener noreferrer" className="font-medium text-orange-700 underline decoration-orange-300 underline-offset-2 hover:text-orange-800">
              {label}
            </a>
          ) : (
            <Link key={k++} href={href} className="font-medium text-orange-700 underline decoration-orange-300 underline-offset-2 hover:text-orange-800">
              {label}
            </Link>
          ),
        );
      } else {
        out.push(tok);
      }
    }
    last = m.index + tok.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

function Block({ block, index }: { block: string; index: number }) {
  if (block.startsWith("### ")) {
    return (
      <h3 className="font-display mt-8 text-lg font-bold text-stone-900">
        {renderInline(block.slice(4))}
      </h3>
    );
  }
  if (block.startsWith("## ")) {
    const text = block.slice(3);
    return (
      <h2 id={slugifyHeading(text)} className="font-display mt-10 scroll-mt-40 text-2xl font-extrabold tracking-tight text-stone-900">
        {text}
      </h2>
    );
  }

  const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);

  // A block made entirely of image lines → figures.
  if (lines.length > 0 && lines.every((l) => IMAGE_LINE.test(l))) {
    return (
      <>
        {lines.map((l, i) => {
          const [, alt, src] = IMAGE_LINE.exec(l)!;
          const url = /^https?:\/\//.test(src) ? src : withBase(src);
          return (
            <figure key={i} className="mt-6">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt={alt} loading="lazy" className="w-full rounded-2xl border border-stone-200" />
              {alt && <figcaption className="mt-2 text-center text-xs text-stone-400">{alt}</figcaption>}
            </figure>
          );
        })}
      </>
    );
  }

  // A block where every line is a "- " item → bullet list.
  if (lines.length > 0 && lines.every((l) => l.startsWith("- "))) {
    return (
      <ul className="mt-5 list-disc space-y-1.5 pl-5 text-base leading-relaxed text-stone-600 marker:text-orange-400">
        {lines.map((l, i) => (
          <li key={i}>{renderInline(l.slice(2))}</li>
        ))}
      </ul>
    );
  }

  return (
    <p className="mt-5 text-base leading-relaxed text-stone-600" key={index}>
      {renderInline(block)}
    </p>
  );
}

export default function BlogBody({ body }: { body: string }) {
  const blocks = body
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .filter(Boolean);
  return (
    <>
      {blocks.map((block, i) => (
        <Block key={i} block={block} index={i} />
      ))}
    </>
  );
}
