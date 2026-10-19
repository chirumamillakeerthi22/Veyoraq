import { SiteFooter } from "@/components/site-footer";

// About, Contact, Privacy and Terms: plain reading pages with the slim footer.
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="flex-1">{children}</div>
      <SiteFooter variant="compact" />
    </>
  );
}
