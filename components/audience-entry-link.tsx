"use client";

import Link from "next/link";
import type { Audience } from "@/lib/audience";
import { setAudience } from "@/lib/use-audience";

// A normal link that also sets the audience, so an editorial entry point on the
// homepage takes the visitor into the matching Women's or Men's experience.
export function AudienceEntryLink({
  audience,
  href,
  className,
  children,
}: {
  audience: Audience;
  href: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} onClick={() => setAudience(audience)} className={className}>
      {children}
    </Link>
  );
}
