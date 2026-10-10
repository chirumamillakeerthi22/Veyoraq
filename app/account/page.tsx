import type { Metadata } from "next";
import { ComingSoon } from "@/components/coming-soon";

export const metadata: Metadata = {
  title: "Account",
  description: "Accounts are in development.",
};

// Placeholder: there is no sign-in or account system yet.
export default function AccountPage() {
  return (
    <ComingSoon
      title={
        <>
          Your account, <em>soon.</em>
        </>
      }
    >
      Accounts, saved styles and wishlists aren&rsquo;t available yet. There is
      no sign-in for now, and nothing is stored about you.
    </ComingSoon>
  );
}
