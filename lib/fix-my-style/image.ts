import { acceptedImageTypes, limits } from "./options";

/*
  Browser-only photo handling. Every photo is redrawn onto a canvas and saved again
  as a smaller JPEG. That keeps storage small and uploads fast, and it also drops
  any metadata the original carried (such as the location it was taken at).
*/

export type PrepareResult =
  | { ok: true; blob: Blob; width: number; height: number }
  | { ok: false; message: string };

// Returns a message when the file cannot be used, or null when it can.
export function validateFile(file: { type: string; size: number }): string | null {
  if (!(acceptedImageTypes as readonly string[]).includes(file.type)) {
    return "That file type isn't supported. Please use a JPEG, PNG or WebP photo.";
  }
  if (file.size === 0) return "That file looks empty. Please choose another photo.";
  if (file.size > limits.rawPhotoBytes) {
    return "That photo is larger than 15 MB. Please choose a smaller one.";
  }
  return null;
}

async function decode(blob: Blob): Promise<{
  source: CanvasImageSource;
  width: number;
  height: number;
  release: () => void;
}> {
  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(blob, { imageOrientation: "from-image" });
      return {
        source: bitmap,
        width: bitmap.width,
        height: bitmap.height,
        release: () => bitmap.close(),
      };
    } catch {
      // fall through to the <img> route
    }
  }
  const url = URL.createObjectURL(blob);
  const image = new Image();
  try {
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("decode failed"));
      image.src = url;
    });
  } catch (error) {
    URL.revokeObjectURL(url);
    throw error;
  }
  return {
    source: image,
    width: image.naturalWidth,
    height: image.naturalHeight,
    release: () => URL.revokeObjectURL(url),
  };
}

function toJpeg(canvas: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise((resolve) => {
    let quality = 0.85;
    const attempt = () =>
      canvas.toBlob(
        (blob) => {
          if (!blob) return resolve(null);
          if (blob.size > limits.preparedPhotoBytes && quality > 0.5) {
            quality -= 0.1;
            return attempt();
          }
          resolve(blob);
        },
        "image/jpeg",
        quality,
      );
    attempt();
  });
}

const INVALID = "We couldn't read that image. It may be damaged. Please try another photo.";

// Optional crop, as fractions of the image (0 to 1).
export type CropRect = { x: number; y: number; width: number; height: number };

export async function prepareImage(blob: Blob, crop?: CropRect): Promise<PrepareResult> {
  let decoded;
  try {
    decoded = await decode(blob);
  } catch {
    return { ok: false, message: INVALID };
  }

  try {
    const sx = crop ? Math.round(crop.x * decoded.width) : 0;
    const sy = crop ? Math.round(crop.y * decoded.height) : 0;
    const sw = crop ? Math.max(1, Math.round(crop.width * decoded.width)) : decoded.width;
    const sh = crop ? Math.max(1, Math.round(crop.height * decoded.height)) : decoded.height;
    if (sw < 32 || sh < 32) {
      return { ok: false, message: "That area is too small. Please select a larger part of the photo." };
    }

    const scale = Math.min(1, limits.longEdgePixels / Math.max(sw, sh));
    const width = Math.max(1, Math.round(sw * scale));
    const height = Math.max(1, Math.round(sh * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) return { ok: false, message: INVALID };

    // JPEG has no transparency, so transparent PNG areas become white.
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, width, height);
    context.drawImage(decoded.source, sx, sy, sw, sh, 0, 0, width, height);

    const output = await toJpeg(canvas);
    if (!output || output.size > limits.preparedPhotoBytes) {
      return { ok: false, message: "That photo is too detailed to prepare. Please try a smaller one." };
    }
    return { ok: true, blob: output, width, height };
  } finally {
    decoded.release();
  }
}

export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result);
      resolve(result.slice(result.indexOf(",") + 1));
    };
    reader.onerror = () => reject(new Error("read failed"));
    reader.readAsDataURL(blob);
  });
}
