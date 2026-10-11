import type { NavIcon } from "@/lib/navigation";

// Fine single-line icons, all drawn on the same 24px grid.
const paths: Record<NavIcon, React.ReactNode> = {
  home: <path d="M4 11l8-6.500 8 6.500M6 9.500V20h12V9.500M10 20v-5.500h4V20" />,
  discover: (
    <>
      <path d="M11 4l1.7 4.8L17.5 10.5l-4.8 1.7L11 17l-1.7-4.8L4.5 10.5l4.8-1.7z" />
      <path d="M18 15.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z" />
    </>
  ),
  fix: (
    <path d="M12 8.5a2.25 2.25 0 1 0-2.25-2.25M12 8.5v1.5l7.6 5.2a1 1 0 0 1-.6 1.8H5a1 1 0 0 1-.6-1.8L12 10" />
  ),
  hair: (
    <path d="M7 4c2.5 2.7-2.5 5.3 0 8s-2.5 5.3 0 8M12 4c2.5 2.7-2.5 5.3 0 8s-2.5 5.3 0 8M17 4c2.5 2.7-2.5 5.3 0 8s-2.5 5.3 0 8" />
  ),
  journal: (
    <path d="M5.5 5.5A1.5 1.5 0 0 1 7 4h12v15H7a1.5 1.5 0 0 0-1.5 1.5zM5.5 20.5v-15M9.5 8h6" />
  ),
  shop: <path d="M6 8.5h12l-1 11.5H7zM9 8.5V7.500a3 3 0 0 1 6 0v1" />,
  saved: <path d="M7 4h10v16l-5-3.5L7 20z" />,
  wishlist: (
    <path d="M12 19.5s-7-4.3-7-9.500A3.800 3.800 0 0 1 12 8a3.800 3.800 0 0 1 7 2c0 5.200-7 9.500-7 9.500z" />
  ),
};

export function NavIconGlyph({ name, className = "h-5 w-5" }: { name: NavIcon; className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name]}
    </svg>
  );
}

// A four-point star, used for the small glimmers.
export function StarGlyph({ className = "h-3 w-3" }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M12 1.500c.6 5.500 3 8.900 10.500 10.500-7.500 1.600-9.900 5-10.500 10.500C11.400 17 9 13.600 1.500 12 9 10.400 11.400 7 12 1.500z" />
    </svg>
  );
}
