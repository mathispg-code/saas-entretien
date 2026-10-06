import Link from "next/link";
import { consentPlainText } from "../lib/consent";
import type { Block, CgvDocument, Inline, MarkKind } from "../lib/cgv/types";

const CONTACT_EMAIL = "contact@candiview.fr";

// Marqueur visible pour tout passage encore a completer ou a faire valider
// par un juriste avant l'ouverture au public (voir TODO.md).
function Mark({ kind, label }: { kind: MarkKind; label: string }) {
  return (
    <mark className="rounded bg-amber-100 px-1 font-semibold text-amber-800">
      [{kind} : {label}]
    </mark>
  );
}

function MailLink() {
  return (
    <a
      href={`mailto:${CONTACT_EMAIL}`}
      className="font-medium text-emerald-600 underline hover:text-emerald-700"
    >
      {CONTACT_EMAIL}
    </a>
  );
}

function InlineView({ inline }: { inline: Inline }) {
  if (typeof inline === "string") return <>{inline}</>;
  switch (inline.t) {
    case "b":
      return <strong>{inline.text}</strong>;
    case "mail":
      return <MailLink />;
    case "link":
      return (
        <Link
          href={inline.href}
          className="font-medium text-emerald-600 underline hover:text-emerald-700"
        >
          {inline.text}
        </Link>
      );
    case "mark":
      return <Mark kind={inline.kind} label={inline.label} />;
    case "br":
      return <br />;
    case "consent":
      return <>{consentPlainText(inline.id)}</>;
  }
}

export function CgvInlines({ items }: { items: Inline[] }) {
  return (
    <>
      {items.map((inline, i) => (
        <InlineView key={i} inline={inline} />
      ))}
    </>
  );
}

function BlockView({ block, previous }: { block: Block; previous: Block | undefined }) {
  switch (block.t) {
    case "h3":
      return <h3 className="mt-4 font-semibold text-navy-800">{block.text}</h3>;
    case "ul":
      return (
        <ul className="mt-2 list-disc space-y-1 pl-5">
          {block.items.map((item, i) => (
            <li key={i}>
              <CgvInlines items={item} />
            </li>
          ))}
        </ul>
      );
    case "p":
      // Premier paragraphe d'une section, ou juste apres un sous-titre : marge courte.
      return (
        <p className={!previous || previous.t === "h3" ? "mt-2" : "mt-3"}>
          <CgvInlines items={block.c} />
        </p>
      );
  }
}

/** Corps des CGV (sections dans la carte blanche), pour une version donnee. */
export function CgvDocumentView({ document }: { document: CgvDocument }) {
  return (
    <div className="mt-8 space-y-8 rounded-2xl border border-slate-200 bg-white p-6 text-sm leading-relaxed text-slate-700 shadow-sm sm:p-8">
      {document.sections.map((section) => (
        <section key={section.title}>
          <h2 className="text-base font-semibold text-navy-800">{section.title}</h2>
          {section.blocks.map((block, i) => (
            <BlockView key={i} block={block} previous={section.blocks[i - 1]} />
          ))}
        </section>
      ))}
    </div>
  );
}
