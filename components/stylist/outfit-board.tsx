import { BOARD, layoutBoard, shapes, type ShapePart } from "@/lib/stylist/board";
import type { Outfit } from "@/lib/stylist/schema";

const INK = "#29231F";
const SAND = "#E8E0D7";

function Part({
  part,
  hex,
  width,
}: {
  part: ShapePart;
  hex: string;
  width: number;
}) {
  const common = {
    d: part.d,
    strokeLinejoin: "round" as const,
    strokeLinecap: "round" as const,
    vectorEffect: "non-scaling-stroke" as const,
  };

  let drawing;
  if (part.kind === "solid") {
    drawing = <path {...common} fill={hex} stroke={INK} strokeWidth={1.5} />;
  } else if (part.kind === "line") {
    drawing = <path {...common} fill="none" stroke={INK} strokeWidth={1.5} />;
  } else {
    drawing = (
      <>
        <path {...common} fill="none" stroke={INK} strokeWidth={5.5} />
        <path {...common} fill="none" stroke={hex} strokeWidth={3} />
      </>
    );
  }

  return part.mirror ? (
    <g transform={`translate(${width} 0) scale(-1 1)`}>{drawing}</g>
  ) : (
    drawing
  );
}

// An illustration of the outfit, drawn from its pieces and colours.
export function OutfitBoard({ outfit }: { outfit: Outfit }) {
  const placements = layoutBoard(outfit.pieces);
  const stripHeight = BOARD.height - BOARD.artHeight;
  const swatchWidth = BOARD.width / outfit.palette.length;
  const description = outfit.pieces
    .map((piece) => `${piece.colour.toLowerCase()} ${piece.description.toLowerCase()}`)
    .join(", ");

  return (
    <svg
      viewBox={`0 0 ${BOARD.width} ${BOARD.height}`}
      role="img"
      aria-label={`Illustration of the outfit ${outfit.name}: ${description}`}
      className="block h-auto w-full"
    >
      <rect width={BOARD.width} height={BOARD.artHeight} fill={SAND} />
      <circle
        cx={BOARD.width / 2}
        cy={170}
        r={125}
        fill={outfit.palette[0].hex}
        opacity={0.28}
      />
      {placements.map((placement, index) => (
        <g
          key={`${placement.shape}-${index}`}
          transform={`translate(${placement.x} ${placement.y}) scale(${placement.scale})`}
        >
          {shapes[placement.shape].parts.map((part, partIndex) => (
            <Part
              key={partIndex}
              part={part}
              hex={placement.hex}
              width={shapes[placement.shape].width}
            />
          ))}
        </g>
      ))}
      {outfit.palette.map((swatch, index) => (
        <rect
          key={`${swatch.hex}-${index}`}
          x={index * swatchWidth}
          y={BOARD.artHeight}
          width={swatchWidth}
          height={stripHeight}
          fill={swatch.hex}
        />
      ))}
    </svg>
  );
}
