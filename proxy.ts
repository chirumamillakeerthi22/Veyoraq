import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  try {
    return await updateSession(request);
  } catch {
    // A problem refreshing a session must never take a page down.
    return NextResponse.next();
  }
}

// Only the pages that deal with a login session. Everything else (the homepage,
// the stylist, images, files) is untouched and stays fast and static.
export const config = {
  matcher: ["/account", "/saved/:path*", "/auth/:path*"],
};
