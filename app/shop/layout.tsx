import { SiteFooter } from "@/components/site-footer";

// A slim footer only. The full footer (with its large guide links) is on the homepage.
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="flex-1">{children}</div>
      <SiteFooter variant="compact" />
    </>
  );
}
