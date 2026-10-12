import { AudienceBar } from "@/components/audience-selector";
import { SiteFooter } from "@/components/site-footer";

// Focused tool: the audience selector on top and only a slim footer below.
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AudienceBar />
      <div className="flex-1">{children}</div>
      <SiteFooter variant="compact" />
    </>
  );
}
