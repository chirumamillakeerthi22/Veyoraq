import { AudienceBar } from "@/components/audience-selector";
import { SiteFooter } from "@/components/site-footer";

// Public discovery page: the audience selector and the full footer.
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AudienceBar />
      <div className="flex-1">{children}</div>
      <SiteFooter />
    </>
  );
}
