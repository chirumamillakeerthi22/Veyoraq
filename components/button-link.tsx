import Link from "next/link";

type ButtonLinkProps = {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "inverse";
  className?: string;
  onClick?: () => void;
};

const variantClasses = {
  primary: "bg-burgundy text-ivory hover:bg-burgundy-deep",
  secondary:
    "border border-espresso/30 text-espresso hover:border-espresso hover:bg-espresso/5",
  inverse: "bg-ivory text-espresso hover:bg-sand",
};

// A link styled as a button. Every call to action on the site navigates somewhere.
export function ButtonLink({
  href,
  children,
  variant = "primary",
  className = "",
  onClick,
}: ButtonLinkProps) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`inline-flex min-h-12 items-center justify-center px-7 text-center text-[0.8125rem] font-medium uppercase tracking-[0.14em] transition-colors duration-200 ${variantClasses[variant]} ${className}`}
    >
      {children}
    </Link>
  );
}
