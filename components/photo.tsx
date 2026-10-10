import Image from "next/image";
import { photos, photoUrl, type PhotoName } from "@/lib/photos";

type PhotoProps = {
  name: PhotoName;
  // Tells the browser how wide the image is on screen so it downloads a suitable size.
  sizes: string;
  // Sets the frame's shape, e.g. "aspect-[4/5]". The frame keeps its space while the image loads.
  className?: string;
  position?: string;
  preload?: boolean;
};

export function Photo({
  name,
  sizes,
  className = "",
  position,
  preload = false,
}: PhotoProps) {
  const photo = photos[name];

  return (
    <div className={`relative overflow-hidden bg-sand ${className}`}>
      <Image
        src={photoUrl(photo.id)}
        alt={photo.alt}
        fill
        sizes={sizes}
        preload={preload}
        className="object-cover transition-transform duration-700 ease-out motion-safe:group-hover:scale-[1.03]"
        style={position ? { objectPosition: position } : undefined}
      />
    </div>
  );
}
