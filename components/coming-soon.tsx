import { ButtonLink } from "@/components/button-link";
import { Container } from "@/components/container";

type ComingSoonProps = {
  title: React.ReactNode;
  children: React.ReactNode;
};

// Shared layout for destinations that are linked from the site but not built yet.
export function ComingSoon({ title, children }: ComingSoonProps) {
  return (
    <Container className="py-20 md:py-32">
      <div className="max-w-2xl">
        <p className="text-xs uppercase tracking-[0.22em] text-stone">
          Coming soon
        </p>
        <h1 className="mt-5 font-display text-5xl leading-[1.05] md:text-7xl">
          {title}
        </h1>
        <p className="mt-6 text-lg leading-8 text-stone">{children}</p>
        <ButtonLink href="/" variant="secondary" className="mt-10">
          Back to the homepage
        </ButtonLink>
      </div>
    </Container>
  );
}
