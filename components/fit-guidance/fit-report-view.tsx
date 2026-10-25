import type { FitReport } from "@/lib/fit-guidance/report";

/*
  The Fit Guidance report itself: what was shared, the limits of the advice, and the
  suggestions with the reason for each. Used both on the results screen and when a
  saved report is reopened, so both always read the same.
*/
export function FitReportView({ report, headingId = "fit-report" }: { report: FitReport; headingId?: string }) {
  return (
    <div className="space-y-10">
      <section aria-labelledby={`${headingId}-profile`}>
        <h2 id={`${headingId}-profile`} className="font-display text-3xl leading-tight">
          Your fit profile
        </h2>
        <p className="mt-3 max-w-2xl text-lg leading-8">{report.intro}</p>
        <dl className="mt-5 grid gap-px border border-sand bg-sand sm:grid-cols-2">
          {report.profile.map((row) => (
            <div key={row.label} className="bg-soft-white p-4">
              <dt className="text-xs uppercase tracking-[0.16em] text-stone">{row.label}</dt>
              <dd className="mt-1 leading-6">{row.value}</dd>
            </div>
          ))}
        </dl>
        <div role="note" className="mt-5 max-w-2xl border border-dashed border-espresso/40 p-4">
          <p className="text-xs uppercase tracking-[0.18em]">Good to know</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-stone">
            {report.limitations.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
      </section>

      {report.sections.map((section) => (
        <section key={section.id} aria-labelledby={`${headingId}-${section.id}`}>
          <h2 id={`${headingId}-${section.id}`} className="font-display text-3xl leading-tight">
            {section.title}
          </h2>
          <ul className="mt-4 grid gap-3 md:grid-cols-2">
            {section.tips.map((tip) => (
              <li key={tip.title} className="border border-sand bg-soft-white p-4">
                <p className="font-display text-xl leading-6">{tip.title}</p>
                <p className="mt-1 text-sm leading-6 text-stone">
                  <span className="font-medium text-espresso">Why it can help: </span>
                  {tip.why}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ))}

      {report.notes.map((note) => (
        <section key={note.title} aria-label={note.title}>
          <h2 className="font-display text-3xl leading-tight">{note.title}</h2>
          <ul className="mt-3 max-w-2xl list-disc space-y-2 pl-5 leading-7 text-stone">
            {note.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
