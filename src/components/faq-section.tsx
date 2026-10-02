export type FaqItem = {
  question: string;
  answer: string;
};

type FaqSectionProps = {
  eyebrow: string;
  title: string;
  items: FaqItem[];
};

export default function FaqSection({ eyebrow, title, items }: FaqSectionProps) {
  return (
    <section className="bg-[var(--cream)] py-20 sm:py-24">
      <div className="container-xl grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
        <div>
          <p className="text-xs font-semibold tracking-[0.22em] text-[var(--gold)]">{eyebrow}</p>
          <h2 className="mt-4 font-display text-4xl leading-tight text-[var(--viridian-950)] sm:text-5xl">{title}</h2>
        </div>
        <div className="border-t border-[var(--viridian-950)]/15">
          {items.map((item) => (
            <details key={item.question} className="group border-b border-[var(--viridian-950)]/15 py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-base font-semibold text-[var(--viridian-950)] marker:hidden focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--gold)]">
                {item.question}
                <span aria-hidden="true" className="text-xl font-normal text-[var(--gold)] transition-transform duration-300 group-open:rotate-45">+</span>
              </summary>
              <p className="max-w-2xl pt-3 text-sm leading-6 text-[var(--muted)]">{item.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
