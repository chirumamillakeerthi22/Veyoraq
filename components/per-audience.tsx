import { audienceValues, type Audience } from "@/lib/audience";

/*
  Renders a section once for each audience. The page's CSS (app/globals.css) shows
  only the audience chosen in My Account, and <html data-audience> is set before first
  paint (app/layout.tsx), so there is no flash of the other audience's content and the
  hidden copy is not read out. "contents" keeps the wrapper out of the layout.
*/
export function PerAudience({ children }: { children: (audience: Audience) => React.ReactNode }) {
  return (
    <>
      {audienceValues.map((audience) => (
        <div key={audience} data-for={audience} className="contents">
          {children(audience)}
        </div>
      ))}
    </>
  );
}
