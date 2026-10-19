import { Container } from "@/components/container";

// A readable page shell shared by About, Contact, Privacy and Terms.
export function LegalPage({
  eyebrow,
  title,
  intro,
  children,
}: {
  eyebrow: string;
  title: React.ReactNode;
  intro?: string;
  children: React.ReactNode;
}) {
  return (
    <Container className="py-12 md:py-20">
      <article className="mx-auto max-w-3xl">
        <p className="text-xs uppercase tracking-[0.22em] text-stone">{eyebrow}</p>
        <h1 className="mt-4 font-display text-5xl leading-[1.05] md:text-6xl">{title}</h1>
        {intro && <p className="mt-5 text-lg leading-8 text-stone">{intro}</p>}
        <div className="mt-10 space-y-10">{children}</div>
      </article>
    </Container>
  );
}

export function LegalSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="font-display text-3xl leading-tight">{title}</h2>
      <div className="mt-3 space-y-3 leading-7 text-stone">{children}</div>
    </section>
  );
}

// A clearly labelled notice, used where information is still missing or unreviewed.
export function Notice({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div role="note" className="border border-dashed border-espresso/40 bg-soft-white p-5">
      <p className="text-xs uppercase tracking-[0.18em] text-espresso">{title}</p>
      <div className="mt-2 space-y-2 text-sm leading-6 text-stone">{children}</div>
    </div>
  );
}
