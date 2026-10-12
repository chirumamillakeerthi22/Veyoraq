// Photo limits shared by the browser and the server checks.
export const acceptedImageTypes = ["image/jpeg", "image/png", "image/webp"] as const;

export const limits = {
  // The largest file a person may choose. The browser shrinks it before sending.
  rawPhotoBytes: 15 * 1024 * 1024,
  // The largest prepared photo the server will accept.
  preparedPhotoBytes: 1_200_000,
  longEdgePixels: 1280,
} as const;
