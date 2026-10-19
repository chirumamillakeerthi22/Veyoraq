import { describe, expect, it, vi } from "vitest";
import {
  audienceFromMetadata,
  readAudienceFromAccount,
  reconcileAudience,
  saveAudienceToAccount,
} from "./audience-sync";

describe("audienceFromMetadata", () => {
  it("reads only valid values", () => {
    expect(audienceFromMetadata({ audience: "men" })).toBe("men");
    expect(audienceFromMetadata({ audience: "boys" })).toBeNull();
    expect(audienceFromMetadata({})).toBeNull();
    expect(audienceFromMetadata(null)).toBeNull();
  });
});

describe("reconcileAudience", () => {
  it("lets an existing account preference win", () => {
    expect(reconcileAudience("women", "men")).toEqual({ use: "men", pushToAccount: false });
  });
  it("keeps this browser's choice and saves it when the account has none", () => {
    expect(reconcileAudience("men", null)).toEqual({ use: "men", pushToAccount: true });
  });
});

describe("account persistence", () => {
  it("writes the audience into the user's own metadata and reports success", async () => {
    const updateUser = vi.fn().mockResolvedValue({ error: null });
    expect(await saveAudienceToAccount({ auth: { updateUser } } as never, "men")).toBe(true);
    expect(updateUser).toHaveBeenCalledWith({ data: { audience: "men" } });
  });

  it("reports failure instead of pretending it saved", async () => {
    const failing = { auth: { updateUser: vi.fn().mockResolvedValue({ error: { message: "x" } }) } };
    expect(await saveAudienceToAccount(failing as never, "men")).toBe(false);
    const throwing = { auth: { updateUser: vi.fn().mockRejectedValue(new Error("offline")) } };
    expect(await saveAudienceToAccount(throwing as never, "men")).toBe(false);
  });

  it("reads the stored preference from the session", async () => {
    const client = { auth: { getSession: vi.fn().mockResolvedValue({ data: { session: { user: { user_metadata: { audience: "men" } } } } }) } };
    expect(await readAudienceFromAccount(client as never)).toBe("men");
    const none = { auth: { getSession: vi.fn().mockResolvedValue({ data: { session: null } }) } };
    expect(await readAudienceFromAccount(none as never)).toBeNull();
  });
});
