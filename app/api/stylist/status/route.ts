import { connection } from "next/server";
import { isImageGenerationConfigured } from "@/lib/ai/gemini-image";
import { isStylistConfigured } from "@/lib/stylist/config";

/*
  Says which AI features this deployment can use, as two plain booleans. It is
  read when the page asks, not when the site is built, so changing an environment
  variable and redeploying is reflected without rebuilding page contents. It
  returns no keys, model names or other configuration.
*/
export async function GET() {
  // Without this, Next.js prerenders the handler at build time and the answer would
  // be frozen to whatever the environment was when the site was built.
  await connection();

  return Response.json(
    {
      // Written outfit ideas and photo analysis (the text and vision model).
      text: isStylistConfigured(),
      // Picture generation (a separate, billed image model chosen by the owner).
      images: isImageGenerationConfigured(),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
