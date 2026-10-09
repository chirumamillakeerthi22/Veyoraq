import Link from "next/link";
import { Container } from "@/components/container";
import { navLinks, stylistHref } from "@/lib/navigation";

const footerLinks = [...navLinks, { label: "Find My Style", href: stylistHref }];

export function SiteFooter() {
  return (
    <footer className="border-t border-sand bg-ivory">
      <Container className="py-12 md:py-16">
        <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="font-display text-2xl font-medium tracking-[0.28em]">
              VEYORAQ
            </p>
            <p className="mt-2 font-display text-lg italic text-stone">
              Style, decoded.
            </p>
          </div>

          <nav aria-label="Footer">
            <ul className="flex flex-col gap-1 sm:flex-row sm:gap-8">
              {footerLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="flex min-h-11 items-center text-sm tracking-wide text-stone transition-colors duration-200 hover:text-espresso"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <p className="mt-10 border-t border-sand pt-6 text-xs tracking-wide text-stone">
          © 2026 VEYORAQ
        </p>
      </Container>
    </footer>
  );
}
