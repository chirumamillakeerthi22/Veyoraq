import { SiteFooter } from "@/components/site-footer";

// Focused tool: only a slim footer below the page.
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="flex-1">{children}</div>
      <SiteFooter variant="compact" />
    </>
  );
}
