// Small line drawings used on the Hair Studio answer cards. They are plain shapes,
// not photographs of anyone, and are hidden from screen readers (the label says it).

const common = {
  "aria-hidden": true as const,
  viewBox: "0 0 48 32",
  className: "mb-2 h-8 w-12 text-espresso/70",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
};

const strandPaths: Record<string, string> = {
  straight: "M10 4v24M24 4v24M38 4v24",
  wavy: "M10 4c4 5-4 9 0 14s-4 9 0 10M24 4c4 5-4 9 0 14s-4 9 0 10M38 4c4 5-4 9 0 14s-4 9 0 10",
  curly: "M10 5a4 4 0 1 1 0 8 4 4 0 1 0 0 8 4 4 0 1 1 0 8M24 5a4 4 0 1 1 0 8 4 4 0 1 0 0 8 4 4 0 1 1 0 8M38 5a4 4 0 1 1 0 8 4 4 0 1 0 0 8 4 4 0 1 1 0 8",
  coily: "M10 6l3 3-6 3 6 3-6 3 6 3-3 3M24 6l3 3-6 3 6 3-6 3 6 3-3 3M38 6l3 3-6 3 6 3-6 3 6 3-3 3",
};

export function StrandGlyph({ kind }: { kind: string }) {
  const d = strandPaths[kind];
  if (!d) return null;
  return (
    <svg {...common}>
      <path d={d} />
    </svg>
  );
}

// Shows how much room the hair takes, as a head with a halo of different sizes.
const volumeRadius: Record<string, number> = {
  sleek: 9,
  natural: 12,
  bouncy: 14,
  full: 17,
  "root-lift": 13,
};

export function VolumeGlyph({ level }: { level: string }) {
  const r = volumeRadius[level];
  if (!r) return null;
  const lift = level === "root-lift";
  return (
    <svg {...common}>
      <ellipse cx="24" cy={lift ? 14 : 18} rx={r + 4} ry={lift ? r + 3 : r} />
      <ellipse cx="24" cy="19" rx="6" ry="8" opacity="0.5" />
    </svg>
  );
}
