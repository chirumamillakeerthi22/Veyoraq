import { describe, expect, it, vi } from "vitest";
import { createAuthStore } from "./auth-store";

type Listener = (event: string, session: unknown) => void;

function fakeClient(initialSession: unknown) {
  const listeners: Listener[] = [];
  const client = {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: initialSession } }),
      onAuthStateChange: vi.fn((listener: Listener) => {
        listeners.push(listener);
        return { data: { subscription: { unsubscribe: () => {} } } };
      }),
    },
  };
  return { client: client as never, emit: (event: string, session: unknown) => listeners.forEach((l) => l(event, session)), calls: client.auth };
}

const session = (email: string, id = "user-1") => ({ user: { id, email } });
const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("auth store", () => {
  it("starts as loading and never invents a user", () => {
    const { client } = fakeClient(null);
    const store = createAuthStore(() => client);
    expect(store.getState()).toEqual({ status: "loading", email: null, userId: null });
  });

  it("reports the signed-in user's real email", async () => {
    const { client } = fakeClient(session("person@example.com"));
    const store = createAuthStore(() => client);
    store.start();
    await tick();
    expect(store.getState()).toEqual({
      status: "signed-in",
      email: "person@example.com",
      userId: "user-1",
    });
  });

  it("reports signed out when there is no session, with no stale email", async () => {
    const { client } = fakeClient(null);
    const store = createAuthStore(() => client);
    store.start();
    await tick();
    expect(store.getState()).toEqual({ status: "signed-out", email: null, userId: null });
  });

  it("updates immediately on sign in and sign out", async () => {
    const { client, emit } = fakeClient(null);
    const store = createAuthStore(() => client);
    const listener = vi.fn();
    store.subscribe(listener);
    store.start();
    await tick();

    emit("SIGNED_IN", session("a@example.com", "a"));
    expect(store.getState()).toMatchObject({ status: "signed-in", email: "a@example.com" });

    emit("SIGNED_OUT", null);
    expect(store.getState()).toEqual({ status: "signed-out", email: null, userId: null });
    expect(listener).toHaveBeenCalled();
  });

  it("switches user without ever mixing the two", async () => {
    const { client, emit } = fakeClient(session("first@example.com", "1"));
    const store = createAuthStore(() => client);
    store.start();
    await tick();
    emit("SIGNED_IN", session("second@example.com", "2"));
    expect(store.getState()).toMatchObject({ email: "second@example.com", userId: "2" });
  });

  it("does not notify for a routine token refresh of the same user", async () => {
    const { client, emit } = fakeClient(session("a@example.com", "a"));
    const store = createAuthStore(() => client);
    store.start();
    await tick();
    const listener = vi.fn();
    store.subscribe(listener);
    emit("TOKEN_REFRESHED", session("a@example.com", "a"));
    expect(listener).not.toHaveBeenCalled();
  });

  it("starts listening only once", async () => {
    const { client, calls } = fakeClient(null);
    const store = createAuthStore(() => client);
    store.start();
    store.start();
    store.start();
    await tick();
    expect(calls.getSession).toHaveBeenCalledTimes(1);
    expect(calls.onAuthStateChange).toHaveBeenCalledTimes(1);
  });

  it("is signed out when Supabase is not configured", async () => {
    const store = createAuthStore(() => {
      throw new Error("not configured");
    });
    store.start();
    expect(store.getState().status).toBe("signed-out");
  });
});
