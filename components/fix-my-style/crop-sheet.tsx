"use client";

import { useRef, useState } from "react";
import type { CropRect } from "@/lib/fix-my-style/image";
import { photoUrl, primaryButton, secondaryButton, Sheet } from "./ui";

type Point = { x: number; y: number };

const clamp = (value: number) => Math.min(1, Math.max(0, value));

/*
  Lets the person draw a box around one garment when a photo shows several. It
  works with a finger or a mouse. The AI is never trusted to separate garments.
*/
export function CropSheet({
  blob,
  open,
  busy,
  onApply,
  onClose,
}: {
  blob: Blob;
  open: boolean;
  busy: boolean;
  onApply: (rect: CropRect) => void;
  onClose: () => void;
}) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [start, setStart] = useState<Point | null>(null);
  const [rect, setRect] = useState<CropRect | null>(null);

  function point(event: React.PointerEvent): Point {
    const box = frameRef.current!.getBoundingClientRect();
    return {
      x: clamp((event.clientX - box.left) / box.width),
      y: clamp((event.clientY - box.top) / box.height),
    };
  }

  function onPointerDown(event: React.PointerEvent) {
    event.currentTarget.setPointerCapture(event.pointerId);
    const p = point(event);
    setStart(p);
    setRect({ x: p.x, y: p.y, width: 0, height: 0 });
  }

  function onPointerMove(event: React.PointerEvent) {
    if (!start) return;
    const p = point(event);
    setRect({
      x: Math.min(start.x, p.x),
      y: Math.min(start.y, p.y),
      width: Math.abs(p.x - start.x),
      height: Math.abs(p.y - start.y),
    });
  }

  const usable = rect !== null && rect.width > 0.08 && rect.height > 0.08;

  return (
    <Sheet open={open} onClose={onClose} title="Select one item">
      <p className="text-sm leading-6 text-stone">
        If the photo shows several garments, drag a box around the one you want to add.
      </p>
      <div className="mt-4 flex justify-center bg-sand">
        <div
          ref={frameRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={() => setStart(null)}
          onPointerCancel={() => setStart(null)}
          className="relative inline-block cursor-crosshair touch-none select-none"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photoUrl(blob)}
            alt="The photo to crop"
            draggable={false}
            className="block max-h-[50dvh] w-auto max-w-full"
          />
          {rect && (
            <span
              aria-hidden="true"
              className="pointer-events-none absolute border-2 border-ivory shadow-[0_0_0_9999px_rgba(41,35,31,0.45)]"
              style={{
                left: `${rect.x * 100}%`,
                top: `${rect.y * 100}%`,
                width: `${rect.width * 100}%`,
                height: `${rect.height * 100}%`,
              }}
            />
          )}
        </div>
      </div>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          disabled={!usable || busy}
          onClick={() => rect && onApply(rect)}
          className={primaryButton}
        >
          {busy ? "Cropping…" : "Use this area"}
        </button>
        <button type="button" onClick={() => setRect(null)} className={secondaryButton}>
          Start again
        </button>
      </div>
    </Sheet>
  );
}
