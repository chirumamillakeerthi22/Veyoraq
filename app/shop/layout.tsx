import { SiteFooter } from "@/components/site-footer";

// Public discovery page: the full footer.
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="flex-1">{children}</div>
      <SiteFooter />
    </>
  );
}
