"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

// Fired on every Home or logo click so temporary menus elsewhere in the header can close.
export const HOME_EVENT = "veyoraq:home";

type HomeLinkProps = Omit<React.ComponentProps<typeof Link>, "href"> & { href?: string };

/*
  The way back to the start. Every click brings the visitor to the top of the homepage:
  - From another page it is an ordinary navigation (Back and Forward keep working).
  - When already on the homepage, a plain link does nothing, which is why a second click
    used to be needed after jumping to a section. Here it clears any #section or query
    from the address, scrolls to the top, and asks Next.js to refresh the page data (no
    full reload, and nobody is signed out).
  Nothing the person has saved is touched: the audience choice, saved looks, Wishlist,
  colour reports and sign-in all live elsewhere.
*/
export function HomeLink({ href = "/", onClick, children, ...rest }: HomeLinkProps) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <Link
      {...rest}
      href={href}
      onClick={(event) => {
        onClick?.(event);
        if (event.defaultPrevented) return;
        // Let the browser handle "open in a new tab" style clicks.
        if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

        window.dispatchEvent(new Event(HOME_EVENT));
        if (pathname === "/") {
          event.preventDefault();
          if (window.location.hash || window.location.search) {
            window.history.replaceState(null, "", "/");
          }
          window.scrollTo({ top: 0, left: 0, behavior: "auto" });
          router.refresh();
        }
      }}
    >
      {children}
    </Link>
  );
}
