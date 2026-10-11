import type { Outfit } from "./schema";

/*
  Turns an outfit's pieces into a simple illustrated "outfit board".

  The picture is drawn from the recommendation itself (each piece's category and
  colour), so it always matches the text. It is an illustration of a concept, not a
  photo and not a product. Shapes are deliberately generic.
*/

type Piece = Outfit["pieces"][number];

export const BOARD = { width: 300, height: 375, artHeight: 350 } as const;

export type ShapeKey =
  | "top"
  | "coat"
  | "trousers"
  | "skirt"
  | "shorts"
  | "dress"
  | "jumpsuit"
  | "shoe"
  | "boot"
  | "bag"
  | "scarf"
  | "necklace";

// solid: filled with the piece's colour; line: detail stroke only;
// cord: a coloured line with a dark edge (used for the necklace).
export type ShapePart = {
  d: string;
  kind: "solid" | "line" | "cord";
  mirror?: boolean;
};

export type Shape = { width: number; height: number; parts: ShapePart[] };

export const shapes: Record<ShapeKey, Shape> = {
  top: {
    width: 120,
    height: 110,
    parts: [
      {
        d: "M40 6 Q60 24 80 6 L116 26 L104 52 L88 44 V104 H32 V44 L16 52 L4 26 Z",
        kind: "solid",
      },
    ],
  },
  coat: {
    width: 130,
    height: 170,
    parts: [
      {
        // Long sleeves hanging almost to the hem, so it reads as a coat or blazer.
        d: "M45 8 L65 0 L85 8 L120 28 L128 150 L108 154 L106 76 V166 H24 V76 L22 154 L2 150 L10 28 Z",
        kind: "solid",
      },
      { d: "M65 2 V166", kind: "line" },
      { d: "M45 8 L65 52 L85 8", kind: "line" },
      { d: "M106 76 L108 154", kind: "line" },
      { d: "M24 76 L22 154", kind: "line" },
    ],
  },
  trousers: {
    width: 100,
    height: 150,
    parts: [
      { d: "M14 2 H86 L92 144 H60 L50 52 L40 144 H8 Z", kind: "solid" },
      { d: "M14 14 H86", kind: "line" },
    ],
  },
  skirt: {
    width: 110,
    height: 110,
    parts: [
      { d: "M30 4 H80 L106 104 H4 Z", kind: "solid" },
      { d: "M30 16 H80", kind: "line" },
    ],
  },
  shorts: {
    width: 100,
    height: 80,
    parts: [{ d: "M10 4 H90 L96 76 H58 L50 36 L42 76 H4 Z", kind: "solid" }],
  },
  dress: {
    width: 100,
    height: 230,
    parts: [
      { d: "M36 4 H44 Q50 22 56 4 H64 L68 70 L98 226 H2 L32 70 Z", kind: "solid" },
      { d: "M32 70 H68", kind: "line" },
    ],
  },
  jumpsuit: {
    width: 100,
    height: 230,
    parts: [
      {
        d: "M34 4 H42 Q50 20 58 4 H66 L70 70 L86 226 H56 L50 120 L44 226 H14 L30 70 Z",
        kind: "solid",
      },
      { d: "M30 70 H70", kind: "line" },
    ],
  },
  shoe: {
    width: 100,
    height: 40,
    parts: [
      { d: "M2 12 H18 Q24 20 38 22 Q48 24 48 30 V35 H2 Z", kind: "solid" },
      { d: "M2 12 H18 Q24 20 38 22 Q48 24 48 30 V35 H2 Z", kind: "solid", mirror: true },
      { d: "M2 31 H48", kind: "line" },
      { d: "M2 31 H48", kind: "line", mirror: true },
    ],
  },
  boot: {
    width: 100,
    height: 80,
    parts: [
      { d: "M4 2 H26 V42 L44 54 V76 H4 Z", kind: "solid" },
      { d: "M4 2 H26 V42 L44 54 V76 H4 Z", kind: "solid", mirror: true },
    ],
  },
  bag: {
    width: 90,
    height: 80,
    parts: [
      { d: "M8 30 H82 L88 76 H2 Z", kind: "solid" },
      { d: "M28 30 V20 Q28 4 45 4 Q62 4 62 20 V30", kind: "line" },
    ],
  },
  scarf: {
    width: 80,
    height: 80,
    parts: [
      { d: "M18 6 Q40 -2 62 6 L58 30 Q40 38 22 30 Z", kind: "solid" },
      { d: "M28 32 L22 76 H42 L44 34 Z", kind: "solid" },
    ],
  },
  necklace: {
    width: 80,
    height: 80,
    parts: [
      { d: "M10 8 Q40 84 70 8", kind: "cord" },
      { d: "M40 50 m-9 0 a9 9 0 1 0 18 0 a9 9 0 1 0 -18 0", kind: "solid" },
    ],
  },
};

// Chooses a generic shape from the category, refined by words in the description.
export function shapeFor(piece: Pick<Piece, "category" | "description">): ShapeKey {
  const text = piece.description.toLowerCase();
  switch (piece.category) {
    case "top":
      return "top";
    case "outerwear":
      return "coat";
    case "dress":
      return "dress";
    case "jumpsuit":
      return "jumpsuit";
    case "bottom":
      if (/skirt|kilt/.test(text)) return "skirt";
      if (/shorts?\b/.test(text)) return "shorts";
      return "trousers";
    case "footwear":
      return /boot/.test(text) ? "boot" : "shoe";
    case "bag":
      return "bag";
    case "accessory":
      return "scarf";
    case "jewellery":
      return "necklace";
  }
}

export type Placement = {
  shape: ShapeKey;
  hex: string;
  label: string;
  x: number;
  y: number;
  scale: number;
};

type Slot = { x: number; y: number; w: number; h: number };

const SLOTS = {
  mainAlone: { x: 90, y: 20, w: 120, h: 270 },
  mainLayered: { x: 130, y: 36, w: 110, h: 250 },
  outerBehind: { x: 15, y: 30, w: 150, h: 200 },
  upperAlone: { x: 80, y: 15, w: 140, h: 140 },
  upperLeft: { x: 15, y: 20, w: 140, h: 150 },
  upperRight: { x: 150, y: 36, w: 130, h: 120 },
  lower: { x: 90, y: 160, w: 120, h: 140 },
  shoes: { x: 80, y: 300, w: 140, h: 46 },
  bag: { x: 215, y: 185, w: 72, h: 72 },
  small: [
    { x: 15, y: 190, w: 60, h: 60 },
    { x: 222, y: 272, w: 62, h: 62 },
  ],
} satisfies Record<string, Slot | Slot[]>;

function place(piece: Piece, slot: Slot): Placement {
  const shape = shapeFor(piece);
  const size = shapes[shape];
  const scale = Math.min(slot.w / size.width, slot.h / size.height);
  return {
    shape,
    hex: piece.hex,
    label: `${piece.colour} ${piece.description}`,
    x: round(slot.x + (slot.w - size.width * scale) / 2),
    y: round(slot.y + (slot.h - size.height * scale) / 2),
    scale: round(scale),
  };
}

const round = (value: number) => Math.round(value * 10) / 10;

/*
  Arranges at most one piece per role, back to front. A dress or jumpsuit replaces
  the separate top and bottom. Extra pieces of the same role are left out.
*/
export function layoutBoard(pieces: readonly Piece[]): Placement[] {
  const first = (...categories: Piece["category"][]) =>
    pieces.find((piece) => categories.includes(piece.category));

  const main = first("dress", "jumpsuit");
  const outer = first("outerwear");
  const top = main ? undefined : first("top");
  const bottom = main ? undefined : first("bottom");
  const shoes = first("footwear");
  const bag = first("bag");
  const small = pieces
    .filter((piece) => piece.category === "accessory" || piece.category === "jewellery")
    .slice(0, SLOTS.small.length);

  const out: Placement[] = [];

  if (main) {
    if (outer) out.push(place(outer, SLOTS.outerBehind));
    out.push(place(main, outer ? SLOTS.mainLayered : SLOTS.mainAlone));
  } else {
    if (outer && top) {
      out.push(place(outer, SLOTS.upperLeft), place(top, SLOTS.upperRight));
    } else if (outer || top) {
      out.push(place((outer ?? top) as Piece, SLOTS.upperAlone));
    }
    if (bottom) out.push(place(bottom, SLOTS.lower));
  }

  if (shoes) out.push(place(shoes, SLOTS.shoes));
  if (bag) out.push(place(bag, SLOTS.bag));
  small.forEach((piece, index) => out.push(place(piece, SLOTS.small[index])));

  return out;
}
