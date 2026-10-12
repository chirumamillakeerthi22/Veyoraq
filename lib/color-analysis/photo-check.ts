/*
  Quick, local checks on a photo's pixels before it is used. They only warn: a
  photo is never refused for looking imperfect, because the person is the best
  judge and these checks are rough. Nothing here leaves the browser.
*/

export type PhotoWarning = "dark" | "bright" | "blurry" | "low-contrast";

export const warningText: Record<PhotoWarning, string> = {
  dark: "This photo looks quite dark. Soft daylight facing a window works best, and results may be less reliable in low light.",
  bright: "This photo looks very bright or washed out. Softer, indirect daylight keeps natural colour.",
  blurry: "This photo may be out of focus. A sharper photo gives a more consistent estimate.",
  "low-contrast": "This photo looks flat or hazy, which can hide natural colouring.",
};

// RGBA pixels, as returned by a canvas.
export function assessPixels(data: Uint8ClampedArray, width: number, height: number): PhotoWarning[] {
  const warnings: PhotoWarning[] = [];
  const count = width * height;
  if (count === 0 || data.length < count * 4) return warnings;

  const luma = new Float32Array(count);
  let sum = 0;
  for (let i = 0; i < count; i += 1) {
    const value = 0.2126 * data[i * 4] + 0.7152 * data[i * 4 + 1] + 0.0722 * data[i * 4 + 2];
    luma[i] = value;
    sum += value;
  }
  const mean = sum / count;

  let variance = 0;
  for (let i = 0; i < count; i += 1) variance += (luma[i] - mean) ** 2;
  const spread = Math.sqrt(variance / count);

  if (mean < 55) warnings.push("dark");
  if (mean > 225) warnings.push("bright");
  if (spread < 18) warnings.push("low-contrast");

  // A Laplacian-style sharpness estimate: little local change means a soft image.
  if (width >= 3 && height >= 3) {
    let total = 0;
    let n = 0;
    for (let y = 1; y < height - 1; y += 1) {
      for (let x = 1; x < width - 1; x += 1) {
        const i = y * width + x;
        const lap = 4 * luma[i] - luma[i - 1] - luma[i + 1] - luma[i - width] - luma[i + width];
        total += lap * lap;
        n += 1;
      }
    }
    const sharpness = n > 0 ? total / n : 0;
    if (sharpness < 12 && !warnings.includes("dark")) warnings.push("blurry");
  }
  return warnings;
}

// Browser-only: reads a small copy of the photo and assesses it.
export async function assessPhoto(blob: Blob): Promise<PhotoWarning[]> {
  try {
    const bitmap = await createImageBitmap(blob);
    const scale = Math.min(1, 160 / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) return [];
    context.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();
    const { data } = context.getImageData(0, 0, width, height);
    return assessPixels(data, width, height);
  } catch {
    return []; // no opinion is better than a wrong one
  }
}

type FaceDetectorLike = { detect: (image: ImageBitmap) => Promise<unknown[]> };

// Uses the browser's built-in face detector where one exists. Null means "unknown".
export async function detectFace(blob: Blob): Promise<boolean | null> {
  try {
    const Detector = (globalThis as unknown as { FaceDetector?: new () => FaceDetectorLike }).FaceDetector;
    if (!Detector) return null;
    const bitmap = await createImageBitmap(blob);
    const faces = await new Detector().detect(bitmap);
    bitmap.close();
    return faces.length > 0;
  } catch {
    return null;
  }
}
