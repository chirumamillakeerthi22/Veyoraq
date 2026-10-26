"use client";

import Image from "next/image";
import { useState } from "react";
import { NavIconGlyph } from "@/components/nav-icon";
import { photos, photoUrl, type PhotoName } from "@/lib/photos";
import type { NavIcon } from "@/lib/navigation";

/*
  A cover photo that fills its frame. If the image cannot be loaded (offline, or the
  source is unavailable) it falls back to a calm tinted block with the feature's icon,
  so a card never shows a broken image.
*/
export function CoverImage({
  name,
  sizes,
  icon,
  className = "",
  position,
  imageClassName = "",
  preload = false,
}: {
  name: PhotoName;
  sizes: string;
  icon: NavIcon;
  className?: string;
  position?: string;
  // Extra classes for the image itself, e.g. responsive focal points like "object-[50%_20%]".
  imageClassName?: string;
  // Load this image first (the page's main picture).
  preload?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const photo = photos[name];

  return (
    <div className={`relative overflow-hidden bg-sand ${className}`}>
      {failed ? (
        <div className="flex h-full w-full items-center justify-center bg-champagne/60 text-gold">
          <NavIconGlyph name={icon} className="h-10 w-10" />
        </div>
      ) : (
        <Image
          src={photoUrl(photo.id)}
          alt={photo.alt}
          fill
          sizes={sizes}
          preload={preload}
          onError={() => setFailed(true)}
          className={`object-cover ${imageClassName}  transition-transform duration-700 ease-out motion-safe:group-hover:scale-[1.04] motion-safe:group-active:scale-[1.02]`}
          style={position ? { objectPosition: position } : undefined}
        />
      )}
    </div>
  );
}
