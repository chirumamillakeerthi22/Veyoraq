/*
  Original illustrations used in place of photography.
  They are not product images: swap them for properly licensed photos when available.
*/

const colors = {
  softWhite: "#fffefc",
  espresso: "#29231f",
  taupe: "#a89a8b",
  rose: "#c69b98",
  olive: "#7a8068",
  sand: "#e8e0d7",
};

export type ArtVariant = "coat" | "shirt" | "trousers" | "dress";

type EditorialArtProps = {
  variant: ArtVariant;
  alt: string;
  className?: string;
};

const outline = {
  stroke: colors.espresso,
  strokeWidth: 1.5,
  strokeLinejoin: "round",
  strokeLinecap: "round",
  vectorEffect: "non-scaling-stroke",
} as const;

function Hanger() {
  return (
    <path
      d="M200 148V137q0-8 8-12a12 12 0 1 0-18-11M140 173l60-25 60 25"
      fill="none"
      {...outline}
    />
  );
}

const scenes: Record<ArtVariant, React.ReactNode> = {
  coat: (
    <>
      <path d="M70 500V230a130 130 0 0 1 260 0v270z" fill={colors.softWhite} />
      <circle cx="326" cy="92" r="24" fill={colors.rose} />
      <Hanger />
      <path
        d="M150 166l50-16 50 16 42 30 14 134-30 6-6-86v202H130V250l-6 86-30-6 14-134z"
        fill={colors.taupe}
        {...outline}
      />
      <path d="M176 158l24 72 24-72M200 230v222" fill="none" {...outline} />
    </>
  ),
  shirt: (
    <>
      <circle cx="200" cy="280" r="150" fill={colors.rose} opacity="0.45" />
      <Hanger />
      <path
        d="M152 168q48 24 96 0l56 32-18 52-28-12v160H142V240l-28 12-18-52z"
        fill={colors.softWhite}
        {...outline}
      />
    </>
  ),
  trousers: (
    <>
      <rect x="90" y="70" width="220" height="430" fill={colors.olive} opacity="0.28" />
      <path
        d="M146 130h108l8 40 8 290h-56l-14-216-14 216h-56l8-290z"
        fill={colors.espresso}
        {...outline}
      />
      <path d="M139 168h122" fill="none" stroke={colors.taupe} strokeWidth="1.5" />
    </>
  ),
  dress: (
    <>
      <path
        d="M70 500V230a130 130 0 0 1 260 0v270z"
        fill={colors.rose}
        opacity="0.4"
      />
      <Hanger />
      <path
        d="M168 172h8q24 32 48 0h8l6 78 58 206H104l58-206z"
        fill={colors.olive}
        {...outline}
      />
      <path d="M162 250h76" fill="none" {...outline} />
    </>
  ),
};

export function EditorialArt({ variant, alt, className = "" }: EditorialArtProps) {
  return (
    <svg
      role="img"
      aria-label={alt}
      viewBox="0 0 400 500"
      preserveAspectRatio="xMidYMid slice"
      className={`block h-full w-full ${className}`}
    >
      <rect width="400" height="500" fill={colors.sand} />
      {scenes[variant]}
    </svg>
  );
}
